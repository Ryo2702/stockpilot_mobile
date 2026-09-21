import * as SQLite from "expo-sqlite";
import { File } from "expo-file-system";
import { Platform } from "react-native";

import { createDatabaseKey, readDatabaseKey } from "./database-key";

export const ENCRYPTED_DATABASE_NAME = "stockpilot-encrypted.db";
const LEGACY_DATABASE_NAME = "stockpilot.db";
const STAGING_DATABASE_NAME = "stockpilot-encryption-stage.db";
const IDENTIFIER_TABLES = [
  "businesses",
  "stores",
  "store_settings",
  "products",
  "catalogs",
  "inventory",
  "stock_movements",
  "settings",
  "insight_snapshots",
  "schema_migrations",
] as const;

type DatabaseSnapshot = {
  counts: Partial<Record<(typeof IDENTIFIER_TABLES)[number], number>>;
  inventoryTotal: number | null;
  foreignKeyViolations: number;
  ownershipViolations: number;
};

function databaseFile(name: string) {
  return new File(SQLite.defaultDatabaseDirectory, name);
}

function keyPragma(key: string) {
  return `PRAGMA key = "x'${key}'"`;
}

async function assertSQLCipher(db: SQLite.SQLiteDatabase) {
  const cipher = await db.getFirstAsync<{ cipher_version: string }>("PRAGMA cipher_version");
  if (!cipher?.cipher_version) throw new Error("SQLCipher is not enabled in this build.");
}

async function assertIntegrity(db: SQLite.SQLiteDatabase) {
  const integrity = await db.getFirstAsync<{ integrity_check: string }>("PRAGMA integrity_check");
  if (integrity?.integrity_check !== "ok") throw new Error("Database integrity validation failed.");
}

async function openEncryptedDatabase(name: string, key: string) {
  const db = await SQLite.openDatabaseAsync(name);
  try {
    await db.execAsync(keyPragma(key));
    await assertSQLCipher(db);
    await assertIntegrity(db);
    return db;
  } catch (error) {
    await db.closeAsync();
    throw error;
  }
}

async function snapshot(db: SQLite.SQLiteDatabase): Promise<DatabaseSnapshot> {
  const presentTables = new Set(
    (await db.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'")).map(({ name }) => name),
  );
  const counts: DatabaseSnapshot["counts"] = {};
  for (const table of IDENTIFIER_TABLES) {
    if (!presentTables.has(table)) continue;
    const row = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`);
    counts[table] = row?.count ?? 0;
  }

  const inventoryTotal = presentTables.has("inventory")
    ? (await db.getFirstAsync<{ total: number | null }>("SELECT SUM(quantity) AS total FROM inventory"))?.total ?? 0
    : null;
  const foreignKeyViolations = (await db.getAllAsync("PRAGMA foreign_key_check")).length;
  const ownershipViolations = await countOwnershipViolations(db, presentTables);
  return { counts, inventoryTotal, foreignKeyViolations, ownershipViolations };
}

async function countOwnershipViolations(db: SQLite.SQLiteDatabase, tables: Set<string>) {
  let count = 0;
  for (const productsTable of ["products", "catalogs"] as const) {
    if (!tables.has(productsTable)) continue;
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) AS count FROM ${productsTable} p
       LEFT JOIN stores s ON s.id = p.store_id AND s.business_id = p.business_id
       WHERE s.id IS NULL`,
    );
    count += row?.count ?? 0;

    if (tables.has("inventory")) {
      const productColumn = productsTable === "products" ? "product_id" : "catalog_id";
      const inventoryColumns = new Set((await db.getAllAsync<{ name: string }>("PRAGMA table_info(inventory)")).map(({ name }) => name));
      if (inventoryColumns.has(productColumn)) {
        const inventory = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) AS count FROM inventory i
           LEFT JOIN ${productsTable} p ON p.id = i.${productColumn}
           WHERE p.id IS NULL OR p.business_id <> i.business_id OR p.store_id <> i.store_id`,
        );
        count += inventory?.count ?? 0;
      }
    }

    if (tables.has("stock_movements")) {
      const movementColumns = new Set((await db.getAllAsync<{ name: string }>("PRAGMA table_info(stock_movements)")).map(({ name }) => name));
      const productColumn = productsTable === "products" ? "product_id" : "catalog_id";
      if (movementColumns.has(productColumn)) {
        const movements = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) AS count FROM stock_movements m
           LEFT JOIN ${productsTable} p ON p.id = m.${productColumn}
           WHERE p.id IS NULL OR p.business_id <> m.business_id OR p.store_id <> m.store_id`,
        );
        count += movements?.count ?? 0;
      }
    }
  }
  return count;
}

function assertSameSnapshot(source: DatabaseSnapshot, encrypted: DatabaseSnapshot, includeMigrationCount = true) {
  const comparableCounts = (counts: DatabaseSnapshot["counts"]) => includeMigrationCount
    ? IDENTIFIER_TABLES.map((table) => counts[table] ?? 0)
    : [
        counts.businesses ?? 0,
        counts.stores ?? 0,
        (counts.products ?? 0) + (counts.catalogs ?? 0),
        counts.inventory ?? 0,
        counts.stock_movements ?? 0,
        counts.store_settings ?? 0,
        counts.settings ?? 0,
        counts.insight_snapshots ?? 0,
      ];
  if (
    JSON.stringify(comparableCounts(source.counts)) !== JSON.stringify(comparableCounts(encrypted.counts)) ||
    (source.inventoryTotal ?? 0) !== (encrypted.inventoryTotal ?? 0) ||
    source.foreignKeyViolations !== 0 ||
    encrypted.foreignKeyViolations !== 0 ||
    source.ownershipViolations !== 0 ||
    encrypted.ownershipViolations !== 0
  ) {
    throw new Error("Database migration validation failed.");
  }
}

async function encryptLegacyDatabase(key: string) {
  const stagingFile = databaseFile(STAGING_DATABASE_NAME);
  if (stagingFile.exists) await SQLite.deleteDatabaseAsync(STAGING_DATABASE_NAME);
  const legacy = await SQLite.openDatabaseAsync(LEGACY_DATABASE_NAME);
  try {
    await assertIntegrity(legacy);
    const sourceSnapshot = await snapshot(legacy);
    await legacy.runAsync(
      "ATTACH DATABASE ? AS encrypted KEY ?",
      `${SQLite.defaultDatabaseDirectory}/${STAGING_DATABASE_NAME}`,
      `x'${key}'`,
    );
    await legacy.getFirstAsync("SELECT sqlcipher_export('encrypted')");
    await legacy.execAsync("DETACH DATABASE encrypted");

    const encrypted = await openEncryptedDatabase(STAGING_DATABASE_NAME, key);
    try {
      await assertIntegrity(encrypted);
      assertSameSnapshot(sourceSnapshot, await snapshot(encrypted));
    } finally {
      await encrypted.closeAsync();
    }
  } catch (error) {
    await legacy.closeAsync().catch(() => undefined);
    if (stagingFile.exists) await SQLite.deleteDatabaseAsync(STAGING_DATABASE_NAME);
    throw error;
  }
  await legacy.closeAsync();
  const targetFile = databaseFile(ENCRYPTED_DATABASE_NAME);
  if (targetFile.exists) await SQLite.deleteDatabaseAsync(ENCRYPTED_DATABASE_NAME);
  await stagingFile.move(databaseFile(ENCRYPTED_DATABASE_NAME));
}

export async function prepareEncryptedDatabase() {
  if (Platform.OS === "web") return;

  const targetFile = databaseFile(ENCRYPTED_DATABASE_NAME);
  const legacyFile = databaseFile(LEGACY_DATABASE_NAME);
  let key = await readDatabaseKey();

  if (!key && targetFile.exists && (targetFile.size ?? 0) > 0) {
    throw new Error("The database key is unavailable. Existing data was not changed.");
  }
  if (!key) key = await createDatabaseKey();

  if (targetFile.exists && (targetFile.size ?? 0) > 0) {
    const db = await openEncryptedDatabase(ENCRYPTED_DATABASE_NAME, key);
    await db.closeAsync();
    return;
  }

  if (legacyFile.exists && (legacyFile.size ?? 0) > 0) {
    await encryptLegacyDatabase(key);
  } else {
    const db = await openEncryptedDatabase(ENCRYPTED_DATABASE_NAME, key);
    await db.closeAsync();
  }
}

export async function initializeEncryptedDatabase(db: SQLite.SQLiteDatabase) {
  const key = await readDatabaseKey();
  if (!key) throw new Error("The database key is unavailable. Existing data was not changed.");
  await db.execAsync(keyPragma(key));
  await assertSQLCipher(db);
}

export async function removeLegacyDatabaseAfterMigration(encryptedDb: SQLite.SQLiteDatabase) {
  if (Platform.OS === "web") return;
  const legacyFile = databaseFile(LEGACY_DATABASE_NAME);
  if (!legacyFile.exists) return;

  const legacy = await SQLite.openDatabaseAsync(LEGACY_DATABASE_NAME);
  try {
    await assertIntegrity(legacy);
    assertSameSnapshot(await snapshot(legacy), await snapshot(encryptedDb), false);
  } finally {
    await legacy.closeAsync();
  }
  await SQLite.deleteDatabaseAsync(LEGACY_DATABASE_NAME);
}
