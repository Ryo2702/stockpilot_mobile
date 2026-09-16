export const storesSchema = `
CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (business_id, name)
);

CREATE INDEX IF NOT EXISTS stores_business_id_idx
  ON stores (business_id);`.trim();
