export const storeSettingsSchema = `
CREATE TABLE IF NOT EXISTS store_settings (
  store_id TEXT NOT NULL REFERENCES stores(id),
  key TEXT NOT NULL,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (store_id, key)
);

CREATE INDEX IF NOT EXISTS store_settings_store_id_idx
  ON store_settings (store_id);`.trim();
