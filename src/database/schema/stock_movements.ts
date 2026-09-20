export const stockMovementsSchema = `
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  store_id TEXT NOT NULL REFERENCES stores(id),
  product_id TEXT NOT NULL REFERENCES products(id),
  movement_type TEXT NOT NULL DEFAULT 'adjustment'
    CHECK (movement_type IN ('stock_in', 'stock_out', 'adjustment')),
  delta INTEGER NOT NULL CHECK (delta <> 0),
  quantity_before INTEGER NOT NULL CHECK (quantity_before >= 0),
  quantity_after INTEGER NOT NULL CHECK (quantity_after >= 0),
  reason TEXT NOT NULL,
  reference TEXT NULL,
  note TEXT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS stock_movements_store_product_created_idx
  ON stock_movements (store_id, product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS stock_movements_store_recent_idx
  ON stock_movements (business_id, store_id, created_at DESC, id DESC);`.trim();
