import { describe, expect, test } from "@jest/globals";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { migrate, migrateFresh, type DatabaseExecutor } from "../src/database/migrate";

function createTestDatabase() {
  const database = new DatabaseSync(":memory:");
  const db = {
    execAsync: async (source: string) => {
      database.exec(source);
    },
    runAsync: async (source: string, ...params: SQLInputValue[]) => {
      database.prepare(source).run(...params);
    },
    getFirstAsync: async <T>(source: string, ...params: SQLInputValue[]) =>
      (database.prepare(source).get(...params) as T | undefined) ?? null,
    getAllAsync: async <T>(source: string, ...params: SQLInputValue[]) =>
      database.prepare(source).all(...params) as T[],
    withTransactionAsync: async (task: () => Promise<void>) => {
      database.exec("BEGIN");
      try {
        await task();
        database.exec("COMMIT");
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },
  } as unknown as DatabaseExecutor;

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
      await migrate(database.db);

      expect(database.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'")).toHaveLength(9);
      expect(database.all<{ version: number }>("SELECT version FROM schema_migrations ORDER BY version")).toEqual([
        { version: 1 },
        { version: 2 },
        { version: 3 },
        { version: 4 },
        { version: 5 },
        { version: 6 },
        { version: 7 },
        { version: 8 },
        { version: 9 },
      ]);
      expect(database.first<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'products'")).toEqual({ name: "products" });
      expect(database.first<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'catalogs'")).toBeUndefined();
      expect(database.all<{ name: string }>("PRAGMA table_info(products)").map(({ name }) => name)).toEqual(
        expect.arrayContaining(["barcode", "unit", "notes", "category"]),
      );
      expect(database.all<{ name: string }>("PRAGMA table_info(stores)").map(({ name }) => name)).toEqual(
        expect.arrayContaining(["code", "store_type", "currency_mode", "status"]),
      );
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
      `);

      await migrateFresh(database.db);

      const tables = database.all<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
      );
      expect(tables).toHaveLength(9);
      for (const { name } of tables) {
        if (name !== "schema_migrations") {
          expect(database.first<{ count: number }>(`SELECT COUNT(*) AS count FROM ${name}`)?.count).toBe(0);
        }
      }
      expect(database.all<{ version: number }>("SELECT version FROM schema_migrations ORDER BY version")).toEqual([
        { version: 1 },
        { version: 2 },
        { version: 3 },
        { version: 4 },
        { version: 5 },
        { version: 6 },
        { version: 7 },
        { version: 8 },
        { version: 9 },
      ]);
    } finally {
      database.close();
    }
  });

  test("restores the products table name without losing inventory or history", async () => {
    const database = createTestDatabase();

    try {
      await database.db.execAsync(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL);
        CREATE TABLE businesses (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
        CREATE TABLE stores (
          id TEXT PRIMARY KEY,
          business_id TEXT NOT NULL REFERENCES businesses(id),
          name TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE (business_id, name)
        );
        CREATE TABLE catalogs (
          id TEXT PRIMARY KEY,
          business_id TEXT NOT NULL REFERENCES businesses(id),
          store_id TEXT NOT NULL REFERENCES stores(id),
          name TEXT NOT NULL,
          sku TEXT NULL,
          reorder_level INTEGER NOT NULL DEFAULT 0,
          critical_level INTEGER NOT NULL DEFAULT 0,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE UNIQUE INDEX catalogs_store_sku_unique ON catalogs (store_id, sku) WHERE sku IS NOT NULL;
        CREATE INDEX catalogs_store_active_idx ON catalogs (store_id, is_active);
        CREATE INDEX catalogs_store_sku_idx ON catalogs (store_id, sku);
        CREATE TABLE inventory (
          catalog_id TEXT PRIMARY KEY REFERENCES catalogs(id),
          business_id TEXT NOT NULL REFERENCES businesses(id),
          store_id TEXT NOT NULL REFERENCES stores(id),
          quantity INTEGER NOT NULL DEFAULT 0,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE stock_movements (
          id TEXT PRIMARY KEY,
          business_id TEXT NOT NULL REFERENCES businesses(id),
          store_id TEXT NOT NULL REFERENCES stores(id),
          catalog_id TEXT NOT NULL REFERENCES catalogs(id),
          delta INTEGER NOT NULL,
          quantity_before INTEGER NOT NULL,
          quantity_after INTEGER NOT NULL,
          reason TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        INSERT INTO businesses (id, name, created_at, updated_at) VALUES ('business-1', 'Owner', 'now', 'now');
        INSERT INTO stores (id, business_id, name, created_at, updated_at) VALUES ('store-1', 'business-1', 'Main Store', 'now', 'now');
        INSERT INTO catalogs (id, business_id, store_id, name, sku, created_at, updated_at) VALUES ('product-1', 'business-1', 'store-1', 'Legacy Product', 'SKU-1', 'now', 'now');
        INSERT INTO inventory (catalog_id, business_id, store_id, quantity, updated_at) VALUES ('product-1', 'business-1', 'store-1', 3, 'now');
        INSERT INTO stock_movements (id, business_id, store_id, catalog_id, delta, quantity_before, quantity_after, reason, created_at) VALUES ('movement-1', 'business-1', 'store-1', 'product-1', 1, 2, 3, 'test', 'now');
        INSERT INTO schema_migrations (version, name, applied_at) VALUES
          (1, 'initial', 'now'),
          (2, 'expand_stores_and_add_store_settings', 'now'),
          (3, 'rename_products_to_catalogs', 'now');
      `);

      await migrate(database.db);

      expect(database.first<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'catalogs'")).toBeUndefined();
      expect(database.first<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'products'")).toEqual({ name: "products" });
      expect(database.first<{ id: string; name: string }>("SELECT id, name FROM products")).toEqual({
        id: "product-1",
        name: "Legacy Product",
      });
      expect(database.first<{ category: string }>("SELECT category FROM products WHERE id = 'product-1'")).toEqual({
        category: "other",
      });
      expect(database.first<{ product_id: string; quantity: number }>("SELECT product_id, quantity FROM inventory")).toEqual({
        product_id: "product-1",
        quantity: 3,
      });
      expect(database.first<{ product_id: string }>("SELECT product_id FROM stock_movements")).toEqual({
        product_id: "product-1",
      });
      expect(database.all<{ version: number }>("SELECT version FROM schema_migrations ORDER BY version")).toHaveLength(9);
      expect(database.all("PRAGMA foreign_key_check")).toHaveLength(0);
    } finally {
      database.close();
    }
  });

  test("expands an existing stores table without dropping its data", async () => {
    const database = createTestDatabase();

    try {
      await database.db.execAsync(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE businesses (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
        CREATE TABLE stores (
          id TEXT PRIMARY KEY,
          business_id TEXT NOT NULL REFERENCES businesses(id),
          name TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE (business_id, name)
        );
        INSERT INTO businesses (id, name, created_at, updated_at) VALUES ('business-1', 'Owner', 'now', 'now');
        INSERT INTO stores (id, business_id, name, created_at, updated_at) VALUES ('store-1', 'business-1', 'Main Store', 'now', 'now');
      `);

      await migrate(database.db);

      expect(database.first<{ name: string }>("SELECT name FROM stores WHERE id = 'store-1'")?.name).toBe(
        "Main Store",
      );
      expect(database.first<{ store_type: string; currency_code: string; status: string }>(
        "SELECT store_type, currency_code, status FROM stores WHERE id = 'store-1'",
      )).toEqual({ store_type: "retail", currency_code: "PHP", status: "active" });
      expect(database.first<{ name: string }>("SELECT name FROM sqlite_master WHERE name = 'store_settings'")).toEqual({
        name: "store_settings",
      });
    } finally {
      database.close();
    }
  });

  test("repairs a recorded store migration when its columns are incomplete", async () => {
    const database = createTestDatabase();

    try {
      await database.db.execAsync(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL);
        CREATE TABLE businesses (id TEXT PRIMARY KEY, name TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
        CREATE TABLE stores (
          id TEXT PRIMARY KEY,
          business_id TEXT NOT NULL REFERENCES businesses(id),
          name TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE (business_id, name)
        );
        CREATE TABLE stock_movements (
          id TEXT PRIMARY KEY,
          business_id TEXT NOT NULL,
          store_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          delta INTEGER NOT NULL,
          quantity_before INTEGER NOT NULL,
          quantity_after INTEGER NOT NULL,
          reason TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        INSERT INTO schema_migrations (version, name, applied_at) VALUES
          (1, 'initial', 'now'),
          (2, 'expand_stores_and_add_store_settings', 'now');
      `);

      await migrate(database.db);

      expect(database.first<{ status: string }>("SELECT status FROM stores")).toBeUndefined();
      expect(database.all<{ name: string }>("PRAGMA table_info(stores)").map(({ name }) => name)).toEqual(
        expect.arrayContaining(["status", "store_type", "currency_code"]),
      );
      expect(database.first<{ name: string }>("SELECT name FROM sqlite_master WHERE name = 'store_settings'")).toEqual({
        name: "store_settings",
      });
    } finally {
      database.close();
    }
  });
});
