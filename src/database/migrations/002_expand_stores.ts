import { storeSettingsSchema } from "../schema/store_settings";
import { storesIndexesSchema } from "../schema/stores";
import type { DatabaseExecutor, Migration } from "../migrate";

const STORE_COLUMNS = [
  {
    name: "code",
    sql: "ALTER TABLE stores ADD COLUMN code TEXT NULL;",
  },
  {
    name: "store_type",
    sql: "ALTER TABLE stores ADD COLUMN store_type TEXT NOT NULL DEFAULT 'retail' CHECK (store_type IN ('retail', 'grocery', 'convenience', 'pharmacy', 'hardware', 'apparel', 'electronics', 'food_beverage', 'wholesale', 'warehouse', 'other'));",
  },
  {
    name: "custom_store_type",
    sql: "ALTER TABLE stores ADD COLUMN custom_store_type TEXT NULL CHECK (store_type <> 'other' OR (custom_store_type IS NOT NULL AND length(trim(custom_store_type)) > 0));",
  },
  {
    name: "currency_mode",
    sql: "ALTER TABLE stores ADD COLUMN currency_mode TEXT NOT NULL DEFAULT 'iso' CHECK (currency_mode IN ('iso', 'custom'));",
  },
  {
    name: "currency_code",
    sql: "ALTER TABLE stores ADD COLUMN currency_code TEXT NULL DEFAULT 'PHP' CHECK (currency_mode <> 'iso' OR (currency_code IS NOT NULL AND currency_code GLOB '[A-Z][A-Z][A-Z]'));",
  },
  {
    name: "custom_currency_name",
    sql: "ALTER TABLE stores ADD COLUMN custom_currency_name TEXT NULL CHECK (currency_mode <> 'custom' OR (custom_currency_name IS NOT NULL AND length(trim(custom_currency_name)) > 0));",
  },
  {
    name: "custom_currency_symbol",
    sql: "ALTER TABLE stores ADD COLUMN custom_currency_symbol TEXT NULL CHECK (currency_mode <> 'custom' OR (custom_currency_symbol IS NOT NULL AND length(trim(custom_currency_symbol)) > 0));",
  },
  {
    name: "currency_decimal_places",
    sql: "ALTER TABLE stores ADD COLUMN currency_decimal_places INTEGER NOT NULL DEFAULT 2 CHECK (currency_decimal_places BETWEEN 0 AND 4);",
  },
  { name: "address_line_1", sql: "ALTER TABLE stores ADD COLUMN address_line_1 TEXT NULL;" },
  { name: "address_line_2", sql: "ALTER TABLE stores ADD COLUMN address_line_2 TEXT NULL;" },
  { name: "barangay", sql: "ALTER TABLE stores ADD COLUMN barangay TEXT NULL;" },
  { name: "city", sql: "ALTER TABLE stores ADD COLUMN city TEXT NULL;" },
  { name: "province_state", sql: "ALTER TABLE stores ADD COLUMN province_state TEXT NULL;" },
  { name: "postal_code", sql: "ALTER TABLE stores ADD COLUMN postal_code TEXT NULL;" },
  { name: "country_code", sql: "ALTER TABLE stores ADD COLUMN country_code TEXT NULL DEFAULT 'PH';" },
  {
    name: "status",
    sql: "ALTER TABLE stores ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived'));",
  },
];

export const expandStoresMigration: Migration = {
  version: 2,
  name: "expand_stores_and_add_store_settings",
  async isApplied(db: DatabaseExecutor) {
    const columns = new Set(
      (await db.getAllAsync<{ name: string }>("PRAGMA table_info(stores)")).map(({ name }) => name),
    );
    const tables = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'store_settings'",
    );
    const indexes = new Set(
      (
        await db.getAllAsync<{ name: string }>(
          "SELECT name FROM sqlite_master WHERE type = 'index' AND name IN (?, ?, ?, ?)",
          "stores_business_id_idx",
          "stores_business_status_idx",
          "stores_business_code_unique",
          "store_settings_store_id_idx",
        )
      ).map(({ name }) => name),
    );

    return (
      STORE_COLUMNS.every(({ name }) => columns.has(name)) &&
      Boolean(tables) &&
      [
        "stores_business_id_idx",
        "stores_business_status_idx",
        "stores_business_code_unique",
        "store_settings_store_id_idx",
      ].every((name) => indexes.has(name))
    );
  },
  async up(db: DatabaseExecutor) {
    const columns = new Set(
      (await db.getAllAsync<{ name: string }>("PRAGMA table_info(stores)")).map(({ name }) => name),
    );

    for (const column of STORE_COLUMNS) {
      if (!columns.has(column.name)) await db.execAsync(column.sql);
    }

    await db.execAsync(`${storeSettingsSchema}\n\n${storesIndexesSchema}`);
  },
};
