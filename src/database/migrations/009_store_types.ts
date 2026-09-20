import { createStoresTableSchema, storesIndexesSchema } from "../schema/stores";
import type { DatabaseExecutor, Migration } from "../migrate";

const addedStoreTypes = ["mini_store", "cafe_shop", "motor_shop"] as const;

async function supportsAddedStoreTypes(db: DatabaseExecutor) {
  const schema = await db.getFirstAsync<{ sql: string | null }>(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'stores'",
  );
  return Boolean(schema?.sql && addedStoreTypes.every((type) => schema.sql?.includes(`'${type}'`)));
}

export const storeTypesMigration: Migration = {
  version: 9,
  name: "mini_cafe_motor_store_types",
  disableForeignKeys: true,
  isApplied: supportsAddedStoreTypes,
  async up(db) {
    if (await supportsAddedStoreTypes(db)) return;

    await db.execAsync(createStoresTableSchema("stores_new"));
    await db.execAsync(`
      INSERT INTO stores_new (
        id, business_id, name, code, store_type, custom_store_type, currency_mode,
        currency_code, custom_currency_name, custom_currency_symbol, currency_decimal_places,
        address_line_1, address_line_2, barangay, city, province_state, postal_code,
        country_code, status, created_at, updated_at
      )
      SELECT
        id, business_id, name, code, store_type, custom_store_type, currency_mode,
        currency_code, custom_currency_name, custom_currency_symbol, currency_decimal_places,
        address_line_1, address_line_2, barangay, city, province_state, postal_code,
        country_code, status, created_at, updated_at
      FROM stores;

      DROP TABLE stores;
      ALTER TABLE stores_new RENAME TO stores;
      ${storesIndexesSchema}
    `);

    const violation = await db.getFirstAsync<{ table: string; parent: string }>(
      "PRAGMA foreign_key_check",
    );
    if (violation) {
      throw new Error(`Store type migration found an invalid reference in ${violation.table} to ${violation.parent}.`);
    }
  },
};
