import type { SQLiteDatabase } from "expo-sqlite";

import { migrations } from "./migrations";
import { schemaMigrationsSchema } from "./schema/schema_migrations";

export type DatabaseExecutor = Pick<
  SQLiteDatabase,
  | "execAsync"
  | "runAsync"
  | "getFirstAsync"
  | "getAllAsync"
  | "withTransactionAsync"
> & Partial<Pick<SQLiteDatabase, "withExclusiveTransactionAsync">>;

export type Migration = {
  version: number;
  name: string;
  disableForeignKeys?: boolean;
  up: (db: DatabaseExecutor) => Promise<void>;
  isApplied?: (db: DatabaseExecutor) => Promise<boolean>;
};

const DROP_ALL_TABLES = `
DROP TABLE IF EXISTS app_events;
DROP TABLE IF EXISTS store_settings;
DROP TABLE IF EXISTS insight_snapshots;
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS catalogs;
DROP TABLE IF EXISTS stores;
DROP TABLE IF EXISTS businesses;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS schema_migrations;`.trim();

// Version 0 records the one-time destructive reset. Numbered schema migrations start at 1.
const FRESH_RESET_VERSION = 0;

async function prepareDatabase(db: DatabaseExecutor) {
  await db.execAsync(
    `PRAGMA busy_timeout = 5000;\nPRAGMA foreign_keys = ON;\nPRAGMA journal_mode = WAL;\n${schemaMigrationsSchema}`,
  );
}

async function applyMigrations(db: DatabaseExecutor) {
  for (const migration of migrations) {
    const applied = await db.getFirstAsync<{ version: number }>(
      "SELECT version FROM schema_migrations WHERE version = ?",
      migration.version,
    );

    if (applied && (!migration.isApplied || (await migration.isApplied(db))))
      continue;

    if (migration.disableForeignKeys) await db.execAsync("PRAGMA foreign_keys = OFF;");
    try {
      const runMigration = async (transaction: DatabaseExecutor) => {
        await migration.up(transaction);
        if (!applied) {
          await transaction.runAsync(
            "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
            migration.version,
            migration.name,
            new Date().toISOString(),
          );
        }
      };
      if (db.withExclusiveTransactionAsync) {
        await db.withExclusiveTransactionAsync((transaction) => runMigration(transaction));
      } else {
        await db.withTransactionAsync(() => runMigration(db));
      }
    } finally {
      if (migration.disableForeignKeys) await db.execAsync("PRAGMA foreign_keys = ON;");
    }
  }
}

async function migrateOnce(db: DatabaseExecutor) {
  await prepareDatabase(db);

  const resetApplied = await db.getFirstAsync<{ version: number }>(
    "SELECT version FROM schema_migrations WHERE version = ?",
    FRESH_RESET_VERSION,
  );
  const hasNumberedMigration = await db.getFirstAsync<{ version: number }>(
    "SELECT version FROM schema_migrations WHERE version > ? LIMIT 1",
    FRESH_RESET_VERSION,
  );
  const hasExistingSchema = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name <> 'schema_migrations' LIMIT 1",
  );

  if (!resetApplied && !hasNumberedMigration && !hasExistingSchema) {
    await migrateFresh(db);
    return;
  }

  await applyMigrations(db);
}

function isDatabaseLocked(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /database (?:table )?(?:is )?locked|database is busy/i.test(message);
}

async function wait(milliseconds: number) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

let activeMigration: Promise<void> | null = null;

export function migrate(db: DatabaseExecutor) {
  if (activeMigration) return activeMigration;

  activeMigration = (async () => {
    const delays = [100, 250, 500, 1000];
    for (let attempt = 0; ; attempt += 1) {
      try {
        await migrateOnce(db);
        return;
      } catch (error) {
        if (!isDatabaseLocked(error) || attempt >= delays.length) throw error;
        await wait(delays[attempt]);
      }
    }
  })().finally(() => {
    activeMigration = null;
  });

  return activeMigration;
}

export async function migrateFresh(db: DatabaseExecutor) {
  await db.execAsync(DROP_ALL_TABLES);
  await prepareDatabase(db);
  await db.runAsync(
    "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
    FRESH_RESET_VERSION,
    "one_time_fresh_reset",
    new Date().toISOString(),
  );
  await applyMigrations(db);
}
