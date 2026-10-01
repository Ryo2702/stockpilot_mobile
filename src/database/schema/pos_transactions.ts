export const posTransactionsSchema = `
CREATE TABLE IF NOT EXISTS pos_transactions (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  store_id TEXT NOT NULL REFERENCES stores(id),
  receipt_number TEXT NOT NULL,
  subtotal REAL NOT NULL CHECK (subtotal >= 0),
  total REAL NOT NULL CHECK (total >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (store_id, receipt_number)
);

CREATE TABLE IF NOT EXISTS pos_transaction_items (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES pos_transactions(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_cost REAL NULL CHECK (unit_cost IS NULL OR unit_cost >= 0),
  unit_price REAL NOT NULL CHECK (unit_price >= 0),
  line_total REAL NOT NULL CHECK (line_total >= 0),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS pos_transactions_store_recent_idx
  ON pos_transactions (business_id, store_id, created_at DESC);

CREATE INDEX IF NOT EXISTS pos_transaction_items_transaction_idx
  ON pos_transaction_items (transaction_id);
`.trim();
