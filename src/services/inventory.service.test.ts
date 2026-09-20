import type { SQLiteDatabase } from "expo-sqlite";
import { describe, expect, it, jest } from "@jest/globals";

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
    withExclusiveTransactionAsync: jest.fn(async (task: (tx: unknown) => Promise<void>) =>
      task({ getFirstAsync, runAsync }),
    ),
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
});
