import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { describe, expect, it } from "@jest/globals";

import { InsufficientStockError } from "@/domain/inventory.errors";
import type { OwnerStore } from "@/services/owner-store.service";
import { migrate, type DatabaseExecutor } from "@/database/migrate";
import { createInsightsCsv } from "@/services/insights/reports";
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
      expect(insights.revenue).toEqual({ total: 140, transactions: 1, unitsSold: 2, averageTransactionValue: 140 });
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
      expect(insights.revenue).toEqual({ total: 0, transactions: 0, unitsSold: 0, averageTransactionValue: 0 });
    } finally {
      database.close();
    }
  });

  it("calculates valuation, sales analytics, and report filters", async () => {
    const { db, database } = createDatabase();
    try {
      await seedProduct(db, 3);
      await db.runAsync(
        `INSERT INTO products (id, business_id, store_id, name, sku, category, current_price, cost_price, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        "product-2",
        "business-1",
        "store-1",
        "Bread",
        "BREAD-01",
        "beverages",
        20,
        10,
        "now",
        "now",
      );
      await db.runAsync(
        "INSERT INTO inventory (product_id, business_id, store_id, quantity, updated_at) VALUES (?, ?, ?, ?, ?)",
        "product-2",
        "business-1",
        "store-1",
        5,
        "now",
      );
      const transaction = await checkoutPosTransaction(db, store, [{ productId: "product-1", quantity: 2 }]);
      const insights = await getStoreInsights(db, store, "this_month");

      expect(insights.inventory).toEqual({
        totalUnits: 6,
        costValue: 100,
        sellingValue: 170,
        potentialGrossMargin: 70,
        missingCostPrices: 0,
        missingSellingPrices: 0,
      });
      expect(insights.revenue).toEqual({ total: 140, transactions: 1, unitsSold: 2, averageTransactionValue: 140 });
      expect(insights.topSelling[0]).toMatchObject({ id: "product-1", unitsSold: 2, revenue: 140 });
      expect(insights.salesByDay).toHaveLength(1);
      expect(insights.salesByWeek).toHaveLength(1);
      expect(insights.salesByStore).toEqual([expect.objectContaining({ storeId: store.storeId, grossSales: 140, unitsSold: 2 })]);

      const categoryInsights = await getStoreInsights(db, store, "this_month", null, {
        storeId: store.storeId,
        category: "beverages",
        productQuery: "",
      });
      expect(categoryInsights.inventory.totalUnits).toBe(5);
      expect(categoryInsights.revenue.total).toBe(0);
      expect(categoryInsights.topSelling).toEqual([]);

      const productInsights = await getStoreInsights(db, store, "this_month", null, {
        storeId: store.storeId,
        category: null,
        productQuery: "Coke",
      });
      expect(productInsights.inventory.totalUnits).toBe(1);
      expect(productInsights.revenue.unitsSold).toBe(2);
      expect(productInsights.revenue.total).toBe(transaction.total);

      await db.runAsync("INSERT INTO stores (id, business_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)", "store-2", "business-1", "Second Store", "now", "now");
      await db.runAsync(
        `INSERT INTO products (id, business_id, store_id, name, sku, category, current_price, cost_price, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        "product-3",
        "business-1",
        "store-2",
        "Rice",
        "RICE-01",
        "grocery",
        30,
        15,
        "now",
        "now",
      );
      await db.runAsync(
        "INSERT INTO inventory (product_id, business_id, store_id, quantity, updated_at) VALUES (?, ?, ?, ?, ?)",
        "product-3",
        "business-1",
        "store-2",
        4,
        "now",
      );
      await checkoutPosTransaction(db, { businessId: store.businessId, storeId: "store-2" }, [{ productId: "product-3", quantity: 1 }]);
      const allStoreInsights = await getStoreInsights(db, store, "this_month", null, { storeId: "all", category: null, productQuery: "" });
      expect(allStoreInsights.inventory.totalUnits).toBe(9);
      expect(allStoreInsights.revenue).toMatchObject({ total: 170, transactions: 2, unitsSold: 3 });
      expect(allStoreInsights.salesByStore).toEqual(expect.arrayContaining([
        expect.objectContaining({ storeId: "store-1", grossSales: 140 }),
        expect.objectContaining({ storeId: "store-2", grossSales: 30 }),
      ]));
      const csv = await createInsightsCsv(db, store, allStoreInsights);
      expect(csv).toContain("Inventory Selling Value (Theoretical)");
      expect(csv).toContain("Sales by Day");
      expect(csv).toContain("Top Selling Products");
    } finally {
      database.close();
    }
  });
});
