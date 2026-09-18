# StockPilot Database Schema

Updated: 2026-09-18

## Database rules

- SQLite is authoritative for local operational data.
- `PRAGMA foreign_keys = ON`.
- `PRAGMA journal_mode = WAL`.
- IDs are application-generated UUID strings.
- Timestamps are ISO-8601 UTC strings.
- Quantities are integers in the foundation. Fractional inventory can be added later with an explicit unit model.
- Inventory quantity is protected by both service logic and `CHECK (quantity >= 0)`.
- Domain rules belong in services, not screens.
- Store-scoped reads and writes must always include the active `business_id` and `store_id` where applicable.
- Secrets must never be stored in SQLite settings tables. Use SecureStore for sensitive small values.

## Tables

### schema_migrations

Tracks applied database migrations.

- `version INTEGER PRIMARY KEY`
- `name TEXT NOT NULL`
- `applied_at TEXT NOT NULL`

---

### businesses

Represents an owner-managed business. One business may contain multiple stores.

- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

---

### stores

Represents a physical or logical inventory location belonging to one business.

- `id TEXT PRIMARY KEY`
- `business_id TEXT NOT NULL -> businesses.id`
- `name TEXT NOT NULL`
- `code TEXT NULL`
- `store_type TEXT NOT NULL DEFAULT 'retail'`
- `custom_store_type TEXT NULL`
- `currency_mode TEXT NOT NULL DEFAULT 'iso'`
- `currency_code TEXT NULL DEFAULT 'PHP'`
- `custom_currency_name TEXT NULL`
- `custom_currency_symbol TEXT NULL`
- `currency_decimal_places INTEGER NOT NULL DEFAULT 2`
- `address_line_1 TEXT NULL`
- `address_line_2 TEXT NULL`
- `barangay TEXT NULL`
- `city TEXT NULL`
- `province_state TEXT NULL`
- `postal_code TEXT NULL`
- `country_code TEXT NULL DEFAULT 'PH'`
- `status TEXT NOT NULL DEFAULT 'active'`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Allowed `store_type` values:

- `retail`
- `grocery`
- `convenience`
- `pharmacy`
- `hardware`
- `apparel`
- `electronics`
- `food_beverage`
- `wholesale`
- `warehouse`
- `other`

Store constraints:

- `store_type` must be one of the supported values above.
- `custom_store_type` is required when `store_type = 'other'`.
- `currency_mode` must be `iso` or `custom`.
- For `currency_mode = 'iso'`, `currency_code` must contain a three-letter currency code such as `PHP`, `USD`, `JPY`, or `EUR`.
- For `currency_mode = 'custom'`, both `custom_currency_name` and `custom_currency_symbol` are required.
- `currency_decimal_places` must be between `0` and `4`.
- `status` must be `active` or `archived`.
- Store names are unique inside a business.
- Store codes are unique inside a business when present.

Unique constraints:

- `(business_id, name)`
- `(business_id, code)` when `code` is present

Store identity and structural configuration belong directly on this table. Flexible UI, notification, formatting, or inventory preferences belong in `store_settings` instead.

---

### store_settings

Stores flexible, non-secret configuration for an individual store without continuously adding columns to `stores`.

- `store_id TEXT NOT NULL -> stores.id`
- `key TEXT NOT NULL`
- `value_json TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Primary key:

- `(store_id, key)`

Examples of appropriate keys:

- `low_stock_threshold`
- `currency_symbol_position`
- `thousand_separator`
- `decimal_separator`
- `date_format`
- `default_product_unit`
- `stock_alerts_enabled`
- `notifications_enabled`
- `scanner_preferences`

Core identity values such as store type, address, currency identity, name, and archive status must not be moved into this key/value table.

---

### products

Represents an inventory item inside a specific store.

- `id TEXT PRIMARY KEY`
- `business_id TEXT NOT NULL -> businesses.id`
- `store_id TEXT NOT NULL -> stores.id`
- `name TEXT NOT NULL`
- `sku TEXT NULL`
- `reorder_level INTEGER NOT NULL DEFAULT 0`
- `critical_level INTEGER NOT NULL DEFAULT 0`
- `is_active INTEGER NOT NULL DEFAULT 1`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Constraints:

- `reorder_level >= 0`
- `critical_level >= 0`
- `critical_level <= reorder_level`
- `is_active IN (0, 1)`
- SKU is unique inside a store when present.

Unique:

- `(store_id, sku)` when `sku` is present

---

### inventory

Stores the authoritative current quantity for each product.

- `product_id TEXT PRIMARY KEY -> products.id`
- `business_id TEXT NOT NULL -> businesses.id`
- `store_id TEXT NOT NULL -> stores.id`
- `quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0)`
- `updated_at TEXT NOT NULL`

Rules:

- Exactly one inventory row exists per product.
- Quantity can never be negative.
- Quantity changes must be performed through the inventory/stock service inside a transaction.
- Screens must never update quantity directly.

---

### stock_movements

Immutable inventory movement history.

- `id TEXT PRIMARY KEY`
- `business_id TEXT NOT NULL -> businesses.id`
- `store_id TEXT NOT NULL -> stores.id`
- `product_id TEXT NOT NULL -> products.id`
- `delta INTEGER NOT NULL CHECK(delta <> 0)`
- `quantity_before INTEGER NOT NULL CHECK(quantity_before >= 0)`
- `quantity_after INTEGER NOT NULL CHECK(quantity_after >= 0)`
- `reason TEXT NOT NULL`
- `note TEXT NULL`
- `created_at TEXT NOT NULL`

Rules:

- Rows are append-only in normal application behavior.
- A stock movement and its resulting inventory quantity update must be committed in the same SQLite transaction.
- `quantity_after = quantity_before + delta` must be enforced by service validation.
- A movement must never produce negative stock.

---

### settings

Stores application-level, non-secret settings that are not specific to a store.

- `key TEXT PRIMARY KEY`
- `value_json TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Examples:

- theme preference
- onboarding completion state
- last selected business/store identifiers when non-sensitive
- local display preferences shared across stores

Only non-secret app settings belong here. Sensitive small values belong in SecureStore.

---

### insight_snapshots

Stores derived local inventory insights for fast display and offline reuse.

- `id TEXT PRIMARY KEY`
- `business_id TEXT NOT NULL -> businesses.id`
- `store_id TEXT NOT NULL -> stores.id`
- `kind TEXT NOT NULL`
- `payload_json TEXT NOT NULL`
- `source_updated_at TEXT NOT NULL`
- `created_at TEXT NOT NULL`

Rules:

- Snapshots are derived local data.
- Snapshots can be regenerated.
- Snapshots must never become the authoritative inventory quantity.

## Key indexes

- `stores(business_id)`
- `stores(business_id, status)`
- `store_settings(store_id)`
- `products(store_id, is_active)`
- `products(store_id, sku)`
- `inventory(store_id)`
- `stock_movements(store_id, product_id, created_at DESC)`
- `insight_snapshots(store_id, kind, created_at DESC)`

## Store setup model

The initial store setup UI should map directly to the core `stores` fields:

1. Store name
2. Optional store code
3. Store type selection
4. Custom store type input when `Other` is selected
5. Currency selection
6. Custom currency setup when `Custom currency` is selected
7. Address
8. Save as an active store

Currency formatting preferences that do not define the currency itself should be stored in `store_settings`.

## Migration guidance

If the original `stores` migration has not been released or used by real data yet, update that initial migration directly.

If the original migration may already exist on a device, do not rewrite its migration version. Add a new migration, for example:

`002_expand_stores_and_add_store_settings`

That migration should:

1. Add the new `stores` columns.
2. Backfill existing stores with safe defaults such as `store_type = 'retail'`, `currency_mode = 'iso'`, `currency_code = 'PHP'`, `currency_decimal_places = 2`, and `status = 'active'`.
3. Create `store_settings`.
4. Create the new indexes.
5. Preserve all existing business, store, product, inventory, movement, settings, and insight data.

Never drop and recreate a user database merely to add these fields after release.
