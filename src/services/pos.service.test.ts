import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { describe, expect, it } from "@jest/globals";

import { InsufficientStockError } from "@/domain/inventory.errors";
import type { OwnerStore } from "@/services/owner-store.service";
import { migrate, type DatabaseExecutor } from "@/database/migrate";
import { getStoreInsights } from "@/services/insights/queries";

import { checkoutPosTransaction, listPosTransactions } from "./pos.service";

const store = {
  businessId: "business-1",
  ownerName: "Owner",
  storeId: "store-1",
  storeName: "Main Store",
  storeType: "grocery",
} as OwnerStore;

function createDatabase() {
  const database = new DatabaseSync(":memory:");
  const db = {
    execAsync: async (source: string) => database.exec(source),
    runAsync: async (source: string, ...params: SQLInputValue[]) => database.prepare(source).run(...params),
    getFirstAsync: async <T>(source: string, ...params: SQLInputValue[]) =>
      (database.prepare(source).get(...params) as T | undefined) ?? null,
    getAllAsync: async <T>(source: string, ...params: SQLInputValue[]) => database.prepare(source).all(...params) as T[],
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
  return { db, database };
}

async function seedProduct(db: DatabaseExecutor, quantity = 3) {
  await migrate(db);
  await db.runAsync("INSERT INTO businesses (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)", "business-1", "Owner", "now", "now");
  await db.runAsync("INSERT INTO stores (id, business_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", "store-1", "business-1", "Main Store", "now", "now");
  await db.runAsync(
    `INSERT INTO products (id, business_id, store_id, name, sku, current_price, cost_price, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    "product-1",
    "business-1",
    "store-1",
    "Coke 1.5L",
    "COKE-15",
    70,
    50,
    "now",
    "now",
  );
  await db.runAsync(
    "INSERT INTO inventory (product_id, business_id, store_id, quantity, updated_at) VALUES (?, ?, ?, ?, ?)",
    "product-1",
    "business-1",
    "store-1",
    quantity,
    "now",
  );
}

describe("checkoutPosTransaction", () => {
  it("saves a price snapshot and deducts stock with a sale movement", async () => {
    const { db, database } = createDatabase();
    try {
      await seedProduct(db);
      const transaction = await checkoutPosTransaction(db, store, [{ productId: "product-1", quantity: 2 }]);

      expect(transaction.total).toBe(140);
      const insights = await getStoreInsights(db, store, "this_month");
      expect(insights.revenue).toEqual({ total: 140, transactions: 1 });
      expect(insights.monthlyRevenue.reduce((sum, month) => sum + month.revenue, 0)).toBe(140);
      await expect(listPosTransactions(db, store)).resolves.toEqual([expect.objectContaining({
        id: transaction.id,
        receiptNumber: transaction.receiptNumber,
        subtotal: 140,
        total: 140,
        itemCount: 1,
        totalItems: 2,
      })]);
      expect(database.prepare("SELECT quantity FROM inventory WHERE product_id = 'product-1'").get()).toEqual({ quantity: 1 });
      expect(database.prepare("SELECT unit_price, line_total FROM pos_transaction_items").get()).toEqual({ unit_price: 70, line_total: 140 });
      expect(database.prepare("SELECT movement_type, delta, reason, reference FROM stock_movements WHERE reason = 'sale'").get()).toMatchObject({
        movement_type: "stock_out",
        delta: -2,
        reason: "sale",
        reference: transaction.id,
      });
    } finally {
      database.close();
    }
  });

  it("rolls back the transaction when stock is insufficient", async () => {
    const { db, database } = createDatabase();
    try {
      await seedProduct(db, 1);
      await expect(checkoutPosTransaction(db, store, [{ productId: "product-1", quantity: 2 }])).rejects.toBeInstanceOf(InsufficientStockError);
      expect(database.prepare("SELECT COUNT(*) AS count FROM pos_transactions").get()).toEqual({ count: 0 });
      expect(database.prepare("SELECT quantity FROM inventory WHERE product_id = 'product-1'").get()).toEqual({ quantity: 1 });
      const insights = await getStoreInsights(db, store, "this_month");
      expect(insights.revenue).toEqual({ total: 0, transactions: 0 });
    } finally {
      database.close();
    }
  });
});
