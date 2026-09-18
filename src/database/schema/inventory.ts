export const inventorySchema = `
CREATE TABLE IF NOT EXISTS inventory (
  catalog_id TEXT PRIMARY KEY REFERENCES catalogs(id),
  business_id TEXT NOT NULL REFERENCES businesses(id),
  store_id TEXT NOT NULL REFERENCES stores(id),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS inventory_store_idx
  ON inventory (store_id);`.trim();
