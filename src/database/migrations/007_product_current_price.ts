import type { DatabaseExecutor, Migration } from "../migrate";

async function hasCurrentPrice(db: DatabaseExecutor) {
  return (await db.getAllAsync<{ name: string }>("PRAGMA table_info(products)")).some(
    ({ name }) => name === "current_price",
  );
}

export const productCurrentPriceMigration: Migration = {
  version: 7,
  name: "product_current_price",
  async isApplied(db) {
    return hasCurrentPrice(db);
  },
  async up(db) {
    if (!(await hasCurrentPrice(db))) {
      await db.execAsync(
        "ALTER TABLE products ADD COLUMN current_price REAL NULL CHECK (current_price IS NULL OR current_price >= 0);",
      );
    }
  },
};
