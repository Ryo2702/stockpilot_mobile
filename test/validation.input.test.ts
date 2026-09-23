import { describe, expect, test } from "@jest/globals";

import { stockAdjustmentSchema } from "../src/validation/inventory.validation";
import { createProductSchema } from "../src/validation/product.validation";
import { storeSchema } from "../src/validation/store.validation";

describe("raw form input validation", () => {
  test("parses numeric drafts only when submitted", () => {
    const product = createProductSchema.parse({
      name: "Rice",
      category: "grocery",
      unit: "kg",
      currentPrice: "12,50",
      initialQuantity: "5",
      reorderLevel: "10",
      criticalLevel: "2",
    });
    const adjustment = stockAdjustmentSchema.parse({
      type: "stock_in",
      quantity: "3",
      reason: "purchase",
    });
    const store = storeSchema.parse({ name: "Main Store", currencyDecimalPlaces: "2", countryCode: "ph" });

    expect(product).toMatchObject({ currentPrice: 12.5, initialQuantity: 5, reorderLevel: 10 });
    expect(adjustment.quantity).toBe(3);
    expect(store).toMatchObject({ currencyDecimalPlaces: 2, countryCode: "PH" });
  });

  test("rejects non-integer quantities at submit time", () => {
    expect(createProductSchema.safeParse({
      name: "Rice",
      category: "grocery",
      unit: "kg",
      initialQuantity: "1.5",
      reorderLevel: "0",
      criticalLevel: "0",
    }).success).toBe(false);
    expect(stockAdjustmentSchema.safeParse({
      type: "stock_in",
      quantity: "1.5",
      reason: "purchase",
    }).success).toBe(false);
  });
});
