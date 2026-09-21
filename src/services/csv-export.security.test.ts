import { describe, expect, it } from "@jest/globals";
import type { SQLiteDatabase } from "expo-sqlite";

import type { OwnerStore } from "@/services/owner-store.service";
import { createInsightsCsv } from "@/services/insights/reports";
import type { StoreInsights } from "@/services/insights/types";

import { exportInventoryCsv } from "./inventory.service";

const store = {
  businessId: "business-1",
  ownerName: "Owner",
  storeId: "store-1",
  storeName: "  =1+1",
  storeType: "grocery",
} as OwnerStore;

describe("CSV formula injection protection", () => {
  it("escapes formula prefixes after whitespace in inventory exports", async () => {
    const db = {
      getAllAsync: async (sql: string) => sql.startsWith("SELECT id, notes")
        ? [{ id: "product-1", notes: "\t=SUM(1,1)" }]
        : [{
          id: "product-1",
          businessId: store.businessId,
          storeId: store.storeId,
          name: "\t=HYPERLINK(\"https://example.invalid\")",
          sku: null,
          barcode: null,
          category: "grocery",
          unit: "ea",
          quantity: 4,
          reorderLevel: 5,
          criticalLevel: 1,
          isActive: 1,
          updatedAt: "2026-09-21T00:00:00.000Z",
        }],
      getFirstAsync: async () => ({ total: 1 }),
    } as unknown as SQLiteDatabase;

    const csv = await exportInventoryCsv(db, store);

    expect(csv).toContain("\"'  =1+1\"");
    expect(csv).toContain("'\t=HYPERLINK(");
    expect(csv).toContain("'\t=SUM(");
  });

  it("escapes formula prefixes after whitespace in insight exports and preserves numeric negatives", async () => {
    const db = {
      getAllAsync: async () => [{
        id: "movement-1",
        productName: "  +SUM(1,1)",
        sku: null,
        unit: "ea",
        type: "stock_out",
        delta: -2,
        quantityBefore: 3,
        quantityAfter: 1,
        reason: "sale",
        reference: null,
        note: "\t@SUM(1,1)",
        createdAt: "2026-09-21T00:00:00.000Z",
      }],
    } as unknown as SQLiteDatabase;
    const insights = {
      period: { period: "this_month", label: "This month", comparisonLabel: "Previous month", start: "2026-09-01", end: "2026-10-01", previousStart: "2026-08-01", previousEnd: "2026-09-01", days: 30 },
      health: { total: 0, healthy: 0, low: 0, critical: 0 },
      hasMovementHistory: true,
      previousMonthHealth: null,
      movement: { stockIn: 0, stockOut: 2, adjustments: 0, net: -2 },
      previousMovement: { stockIn: 0, stockOut: 0, adjustments: 0, net: 0 },
      products: { topMoving: [], slowMoving: [], largestIncreases: [], largestDecreases: [], noMovement: [], noMovementCount: 0, critical: [], low: [] },
      categories: [],
      monthlyMovement: [],
      monthlyHealth: [],
    } as StoreInsights;

    const csv = await createInsightsCsv(db, store, insights);

    expect(csv).toContain("'  +SUM(");
    expect(csv).toContain("'\t@SUM(");
    expect(csv).toContain('"stock out","-2","3","1"');
  });
});
