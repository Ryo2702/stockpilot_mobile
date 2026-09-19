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
>;

export type Migration = {
  version: number;
  name: string;
  up: (db: DatabaseExecutor) => Promise<void>;
  isApplied?: (db: DatabaseExecutor) => Promise<boolean>;
};

const DROP_ALL_TABLES = `
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

export async function migrate(db: DatabaseExecutor) {
  await db.execAsync(
    `PRAGMA foreign_keys = ON;\nPRAGMA journal_mode = WAL;\n${schemaMigrationsSchema}`,
  );

  for (const migration of migrations) {
    const applied = await db.getFirstAsync<{ version: number }>(
      "SELECT version FROM schema_migrations WHERE version = ?",
      migration.version,
    );

    if (applied && (!migration.isApplied || (await migration.isApplied(db))))
      continue;

    await db.withTransactionAsync(async () => {
      await migration.up(db);
      if (!applied) {
        await db.runAsync(
          "INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)",
          migration.version,
          migration.name,
          new Date().toISOString(),
        );
      }
    });
  }
}

export async function migrateFresh(db: DatabaseExecutor) {
  await db.execAsync(DROP_ALL_TABLES);
  await migrate(db);
}
