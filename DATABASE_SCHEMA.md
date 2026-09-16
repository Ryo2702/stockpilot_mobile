# Database Schema

## Database rules

- SQLite is authoritative for local operational data.
- `PRAGMA foreign_keys = ON`.
- `PRAGMA journal_mode = WAL`.
- IDs are application-generated UUID strings.
- Timestamps are ISO-8601 UTC strings.
- Quantities are integers in the foundation. Fractional inventory can be added later with an explicit unit model.
- Inventory quantity is protected by both service logic and `CHECK (quantity >= 0)`.

## Tables

### schema_migrations

- `version INTEGER PRIMARY KEY`
- `name TEXT NOT NULL`
- `applied_at TEXT NOT NULL`

### businesses

- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

### stores

- `id TEXT PRIMARY KEY`
- `business_id TEXT NOT NULL -> businesses.id`
- `name TEXT NOT NULL`
- `created_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Unique: `(business_id, name)`.

### products

- `id TEXT PRIMARY KEY`
- `business_id TEXT NOT NULL`
- `store_id TEXT NOT NULL`
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
- SKU is unique inside a store when present.

### inventory

- `product_id TEXT PRIMARY KEY -> products.id`
- `business_id TEXT NOT NULL`
- `store_id TEXT NOT NULL`
- `quantity INTEGER NOT NULL DEFAULT 0 CHECK(quantity >= 0)`
- `updated_at TEXT NOT NULL`

One inventory row per product.

### stock_movements

- `id TEXT PRIMARY KEY`
- `business_id TEXT NOT NULL`
- `store_id TEXT NOT NULL`
- `product_id TEXT NOT NULL -> products.id`
- `delta INTEGER NOT NULL CHECK(delta <> 0)`
- `quantity_before INTEGER NOT NULL CHECK(quantity_before >= 0)`
- `quantity_after INTEGER NOT NULL CHECK(quantity_after >= 0)`
- `reason TEXT NOT NULL`
- `note TEXT NULL`
- `created_at TEXT NOT NULL`

Rows are append-only in normal application behavior.

### settings

- `key TEXT PRIMARY KEY`
- `value_json TEXT NOT NULL`
- `updated_at TEXT NOT NULL`

Only non-secret app settings belong here.

### insight_snapshots

- `id TEXT PRIMARY KEY`
- `business_id TEXT NOT NULL`
- `store_id TEXT NOT NULL`
- `kind TEXT NOT NULL`
- `payload_json TEXT NOT NULL`
- `source_updated_at TEXT NOT NULL`
- `created_at TEXT NOT NULL`

Snapshots are derived local data. They can be regenerated and must not become the authoritative inventory quantity.

## Key indexes

- `stores(business_id)`
- `products(store_id, is_active)`
- `products(store_id, sku)`
- `stock_movements(store_id, product_id, created_at DESC)`
- `insight_snapshots(store_id, kind, created_at DESC)`
