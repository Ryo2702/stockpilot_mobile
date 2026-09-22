import type { SQLiteDatabase } from "expo-sqlite";
import { describe, expect, it, jest } from "@jest/globals";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

import { InsufficientStockError } from "@/domain/inventory.errors";
import type { OwnerStore } from "@/services/owner-store.service";

import { applyStockChange } from "./inventory.service";

const store = {
  businessId: "business-1",
  ownerName: "Owner",
  storeId: "store-1",
  storeName: "Main Store",
  storeType: "grocery",
} as OwnerStore;

function createDatabase(quantity: number) {
  const getFirstAsync = jest.fn(async (_sql: string, ..._values: unknown[]) => ({ quantity }));
  const runAsync = jest.fn(async (_sql: string, ..._values: unknown[]) => ({ changes: 1 }));
  const database = {
    getFirstAsync,
    runAsync,
    withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
  } as unknown as SQLiteDatabase;

  return { database, getFirstAsync, runAsync };
}

describe("applyStockChange", () => {
  it("updates store-scoped stock and records the matching movement", async () => {
    const { database, getFirstAsync, runAsync } = createDatabase(3);

    await expect(applyStockChange(database, store, "product-1", {
      type: "stock_in",
      quantity: 20,
      reason: "purchase",
    })).resolves.toBe(23);

    expect(getFirstAsync.mock.calls[0]?.slice(1)).toEqual([
      "product-1",
      "business-1",
      "store-1",
    ]);
    expect(runAsync).toHaveBeenCalledTimes(2);

    const [updateSql, ...updateValues] = runAsync.mock.calls[0] ?? [];
    expect(updateSql).toContain("UPDATE inventory");
    expect(updateValues).toEqual([
      23,
      expect.any(String),
      "product-1",
      "business-1",
      "store-1",
    ]);

    const [movementSql, ...movementValues] = runAsync.mock.calls[1] ?? [];
    expect(movementSql).toContain("INSERT INTO stock_movements");
    expect(movementValues).toEqual([
      expect.any(String),
      "business-1",
      "store-1",
      "product-1",
      "stock_in",
      20,
      3,
      23,
      "purchase",
      null,
      null,
      expect.any(String),
    ]);
  });

  it("rejects a stock out larger than available stock without writing", async () => {
    const { database, runAsync } = createDatabase(3);

    await expect(applyStockChange(database, store, "product-1", {
      type: "stock_out",
      quantity: 4,
      reason: "sale",
    })).rejects.toBeInstanceOf(InsufficientStockError);

    expect(runAsync).not.toHaveBeenCalled();
  });

  it("rolls inventory back when movement creation fails", async () => {
    const native = new DatabaseSync(":memory:");
    native.exec(`
      CREATE TABLE stores (id TEXT PRIMARY KEY, business_id TEXT, status TEXT);
      CREATE TABLE products (id TEXT PRIMARY KEY, business_id TEXT, store_id TEXT, is_active INTEGER);
      CREATE TABLE inventory (product_id TEXT PRIMARY KEY, business_id TEXT, store_id TEXT, quantity INTEGER, updated_at TEXT);
      CREATE TABLE stock_movements (id TEXT, business_id TEXT, store_id TEXT, product_id TEXT,
        movement_type TEXT CHECK (0), delta INTEGER, quantity_before INTEGER, quantity_after INTEGER,
        reason TEXT, reference TEXT, note TEXT, created_at TEXT);
      INSERT INTO stores VALUES ('store-1', 'business-1', 'active');
      INSERT INTO products VALUES ('product-1', 'business-1', 'store-1', 1);
      INSERT INTO inventory VALUES ('product-1', 'business-1', 'store-1', 3, 'now');
    `);

    const database = {
      getFirstAsync: async <T>(sql: string, ...values: SQLInputValue[]) =>
        (native.prepare(sql).get(...values) as T | undefined) ?? null,
      runAsync: async (sql: string, ...values: SQLInputValue[]) => {
        const result = native.prepare(sql).run(...values);
        return { changes: Number(result.changes), lastInsertRowId: Number(result.lastInsertRowid) };
      },
      withTransactionAsync: async (task: () => Promise<void>) => {
        native.exec("BEGIN");
        try {
          await task();
          native.exec("COMMIT");
        } catch (error) {
          native.exec("ROLLBACK");
          throw error;
        }
      },
    } as unknown as SQLiteDatabase;

    try {
      await expect(applyStockChange(database, store, "product-1", {
        type: "stock_in",
        quantity: 2,
        reason: "purchase",
      })).rejects.toThrow();
      expect(native.prepare("SELECT quantity FROM inventory WHERE product_id = 'product-1'").get()).toEqual({ quantity: 3 });
      expect(native.prepare("SELECT COUNT(*) AS count FROM stock_movements").get()).toEqual({ count: 0 });
    } finally {
      native.close();
    }
  });
});
