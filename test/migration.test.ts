import { describe, expect, test } from "@jest/globals";
import { DatabaseSync } from "node:sqlite";
import { DB_SCHEMA } from "../src/database/db_schema";
import { migrate, type DatabaseExecutor } from "../src/database/migrate";

const DROP_ALL_TABLES = `
DROP TABLE IF EXISTS insight_snapshots;
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS stores;
DROP TABLE IF EXISTS businesses;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS schema_migrations;`.trim();

async function migrateFresh(db: DatabaseExecutor) {
  await db.execAsync(DROP_ALL_TABLES);
  await migrate(db);
}

function createTestDatabase() {
  const database = new DatabaseSync(":memory:");
  const db: DatabaseExecutor = {
    execAsync: async (source) => {
      database.exec(source);
    },
  };

  return {
    db,
    all<T extends Record<string, unknown>>(source: string) {
      return database.prepare(source).all() as T[];
    },
    first<T extends Record<string, unknown>>(source: string) {
      return database.prepare(source).get() as T;
    },
    close() {
      database.close();
    },
  };
}

describe("database migration", () => {
  test("applies the schema", async () => {
    const database = createTestDatabase();

    try {
      await migrate(database.db);

      expect(database.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'")).toHaveLength(8);
      expect(DB_SCHEMA).toContain("CREATE TABLE IF NOT EXISTS businesses");
    } finally {
      database.close();
    }
  });

  test("migrate:fresh removes all data before rebuilding the schema", async () => {
    const database = createTestDatabase();

    try {
      await migrate(database.db);
      await database.db.execAsync(`
        INSERT INTO businesses (id, name, created_at, updated_at) VALUES ('business-1', 'Test Business', 'now', 'now');
        INSERT INTO stores (id, business_id, name, created_at, updated_at) VALUES ('store-1', 'business-1', 'Test Store', 'now', 'now');
        INSERT INTO products (id, business_id, store_id, name, sku, created_at, updated_at) VALUES ('product-1', 'business-1', 'store-1', 'Test Product', 'SKU-1', 'now', 'now');
        INSERT INTO inventory (product_id, business_id, store_id, updated_at) VALUES ('product-1', 'business-1', 'store-1', 'now');
        INSERT INTO stock_movements (id, business_id, store_id, product_id, delta, quantity_before, quantity_after, reason, created_at) VALUES ('movement-1', 'business-1', 'store-1', 'product-1', 1, 0, 1, 'test', 'now');
        INSERT INTO settings (key, value_json, updated_at) VALUES ('test', '{}', 'now');
        INSERT INTO insight_snapshots (id, business_id, store_id, kind, payload_json, source_updated_at, created_at) VALUES ('insight-1', 'business-1', 'store-1', 'test', '{}', 'now', 'now');
        INSERT INTO schema_migrations (version, name, applied_at) VALUES (1, 'initial', 'now');
      `);

      await migrateFresh(database.db);

      const tables = database.all<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
      );
      expect(tables).toHaveLength(8);
      for (const { name } of tables) {
        expect(database.first<{ count: number }>(`SELECT COUNT(*) AS count FROM ${name}`)?.count).toBe(0);
      }
    } finally {
      database.close();
    }
  });
});
