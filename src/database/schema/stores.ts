export const storesSchema = `
CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  name TEXT NOT NULL,
  code TEXT NULL,
  store_type TEXT NOT NULL DEFAULT 'retail'
    CHECK (store_type IN ('retail', 'grocery', 'convenience', 'pharmacy', 'hardware', 'apparel', 'electronics', 'food_beverage', 'wholesale', 'warehouse', 'other')),
  custom_store_type TEXT NULL,
  currency_mode TEXT NOT NULL DEFAULT 'iso'
    CHECK (currency_mode IN ('iso', 'custom')),
  currency_code TEXT NULL DEFAULT 'PHP',
  custom_currency_name TEXT NULL,
  custom_currency_symbol TEXT NULL,
  currency_decimal_places INTEGER NOT NULL DEFAULT 2
    CHECK (currency_decimal_places BETWEEN 0 AND 4),
  address_line_1 TEXT NULL,
  address_line_2 TEXT NULL,
  barangay TEXT NULL,
  city TEXT NULL,
  province_state TEXT NULL,
  postal_code TEXT NULL,
  country_code TEXT NULL DEFAULT 'PH',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (business_id, name),
  CHECK (store_type <> 'other' OR (custom_store_type IS NOT NULL AND length(trim(custom_store_type)) > 0)),
  CHECK (
    (currency_mode = 'iso' AND currency_code IS NOT NULL AND currency_code GLOB '[A-Z][A-Z][A-Z]')
    OR
    (currency_mode = 'custom' AND custom_currency_name IS NOT NULL AND length(trim(custom_currency_name)) > 0
      AND custom_currency_symbol IS NOT NULL AND length(trim(custom_currency_symbol)) > 0)
  )
);`.trim();

export const storesIndexesSchema = `
CREATE INDEX IF NOT EXISTS stores_business_id_idx
  ON stores (business_id);

CREATE INDEX IF NOT EXISTS stores_business_status_idx
  ON stores (business_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS stores_business_code_unique
  ON stores (business_id, code)
  WHERE code IS NOT NULL;`.trim();
