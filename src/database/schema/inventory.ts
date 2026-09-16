export const inventorySchema = `
CREATE TABLE IF NOT EXISTS inventory (
  product_id TEXT PRIMARY KEY REFERENCES products(id),
  business_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at TEXT NOT NULL
);`.trim();
