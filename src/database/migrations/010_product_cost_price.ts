import type { DatabaseExecutor, Migration } from "../migrate";

async function hasCostPrice(db: DatabaseExecutor) {
  return (await db.getAllAsync<{ name: string }>("PRAGMA table_info(products)"))
    .some(({ name }) => name === "cost_price");
}

export const productCostPriceMigration: Migration = {
  version: 10,
  name: "product_cost_price",
  isApplied: hasCostPrice,
  async up(db) {
    if (!await hasCostPrice(db)) {
      await db.execAsync(
        "ALTER TABLE products ADD COLUMN cost_price REAL NULL CHECK (cost_price IS NULL OR cost_price >= 0);",
      );
    }
  },
};
