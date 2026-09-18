export const productsSchema = `
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  store_id TEXT NOT NULL REFERENCES stores(id),
  name TEXT NOT NULL,
  sku TEXT NULL,
  reorder_level INTEGER NOT NULL DEFAULT 0,
  critical_level INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (reorder_level >= 0),
  CHECK (critical_level >= 0),
  CHECK (critical_level <= reorder_level),
  CHECK (is_active IN (0, 1))
);

CREATE UNIQUE INDEX IF NOT EXISTS products_store_sku_unique
  ON products (store_id, sku)
  WHERE sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS products_store_active_idx
  ON products (store_id, is_active);

CREATE INDEX IF NOT EXISTS products_store_sku_idx
  ON products (store_id, sku);`.trim();
