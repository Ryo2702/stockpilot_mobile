import type { SQLiteDatabase } from "expo-sqlite";

import type { StoreSchema } from "@/validation/store.validation";

export type StoreRepositoryDatabase = Pick<
  SQLiteDatabase,
  "getAllAsync" | "getFirstAsync" | "runAsync" | "withTransactionAsync"
>;
export type StoreWriteDatabase = Pick<SQLiteDatabase, "runAsync">;

export type OwnerStoreRecord = {
  businessId: string;
  ownerName: string;
  storeId: string;
  storeName: string;
  storeType: StoreSchema["storeType"];
};

export type StoreDetailsRow = OwnerStoreRecord & {
  name: string;
  code: string | null;
  customStoreType: string | null;
  currencyMode: StoreSchema["currencyMode"];
  currencyCode: string | null;
  customCurrencyName: string | null;
  customCurrencySymbol: string | null;
  currencyDecimalPlaces: number;
  addressLine1: string | null;
  addressLine2: string | null;
  barangay: string | null;
  city: string | null;
  provinceState: string | null;
  postalCode: string | null;
  countryCode: string | null;
  status: StoreSchema["status"];
};

export type StoreOverviewRecord = {
  productCount: number;
  itemsInStock: number;
  healthyCount: number;
  lowStockCount: number;
  criticalCount: number;
};

const ownerStoresQuery = `
  SELECT
    businesses.id AS businessId,
    businesses.name AS ownerName,
    stores.id AS storeId,
    stores.name AS storeName,
    stores.store_type AS storeType
  FROM businesses
  INNER JOIN stores ON stores.business_id = businesses.id
  WHERE stores.status = 'active'
  ORDER BY businesses.created_at ASC, stores.created_at ASC
`;

const storeDetailsQuery = `
  SELECT
    businesses.id AS businessId,
    businesses.name AS ownerName,
    stores.id AS storeId,
    stores.name AS storeName,
    stores.name AS name,
    stores.code AS code,
    stores.store_type AS storeType,
    stores.custom_store_type AS customStoreType,
    stores.currency_mode AS currencyMode,
    stores.currency_code AS currencyCode,
    stores.custom_currency_name AS customCurrencyName,
    stores.custom_currency_symbol AS customCurrencySymbol,
    stores.currency_decimal_places AS currencyDecimalPlaces,
    stores.address_line_1 AS addressLine1,
    stores.address_line_2 AS addressLine2,
    stores.barangay AS barangay,
    stores.city AS city,
    stores.province_state AS provinceState,
    stores.postal_code AS postalCode,
    stores.country_code AS countryCode,
    stores.status AS status
  FROM businesses
  INNER JOIN stores ON stores.business_id = businesses.id
  WHERE businesses.id = ? AND stores.id = ? AND stores.status = 'active'
  LIMIT 1
`;

const insertStoreQuery = `
  INSERT INTO stores (
    id,
    business_id,
    name,
    code,
    store_type,
    custom_store_type,
    currency_mode,
    currency_code,
    custom_currency_name,
    custom_currency_symbol,
    currency_decimal_places,
    address_line_1,
    address_line_2,
    barangay,
    city,
    province_state,
    postal_code,
    country_code,
    status,
    created_at,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

export async function findOwnerStore(db: StoreRepositoryDatabase) {
  return db.getFirstAsync<OwnerStoreRecord>(`${ownerStoresQuery} LIMIT 1`);
}

export async function listOwnerStores(db: StoreRepositoryDatabase) {
  return db.getAllAsync<OwnerStoreRecord>(ownerStoresQuery);
}

export async function findStoreDetails(
  db: StoreRepositoryDatabase,
  businessId: string,
  storeId: string,
) {
  return db.getFirstAsync<StoreDetailsRow>(storeDetailsQuery, businessId, storeId);
}

export async function findBusinessName(db: StoreRepositoryDatabase, businessId: string) {
  const business = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM businesses WHERE id = ?",
    businessId,
  );
  return business?.name ?? null;
}

export async function insertBusiness(
  db: StoreWriteDatabase,
  businessId: string,
  name: string,
  now: string,
) {
  await db.runAsync(
    "INSERT INTO businesses (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
    businessId,
    name,
    now,
    now,
  );
}

export async function insertStore(
  db: StoreWriteDatabase,
  businessId: string,
  store: StoreSchema,
  storeId: string,
  now: string,
) {
  await db.runAsync(
    insertStoreQuery,
    storeId,
    businessId,
    store.name,
    store.code ?? null,
    store.storeType,
    store.storeType === "other" ? (store.customStoreType ?? null) : null,
    store.currencyMode,
    store.currencyMode === "iso" ? store.currencyCode : null,
    store.currencyMode === "custom" ? (store.customCurrencyName ?? null) : null,
    store.currencyMode === "custom" ? (store.customCurrencySymbol ?? null) : null,
    store.currencyDecimalPlaces,
    store.addressLine1 ?? null,
    store.addressLine2 ?? null,
    store.barangay ?? null,
    store.city ?? null,
    store.provinceState ?? null,
    store.postalCode ?? null,
    store.countryCode ?? null,
    store.status,
    now,
    now,
  );
}

export async function updateStore(
  db: StoreRepositoryDatabase,
  businessId: string,
  storeId: string,
  store: StoreSchema,
  now: string,
) {
  const result = await db.runAsync(
    `UPDATE stores SET
      name = ?, code = ?, store_type = ?, custom_store_type = ?,
      currency_mode = ?, currency_code = ?, custom_currency_name = ?,
      custom_currency_symbol = ?, currency_decimal_places = ?,
      address_line_1 = ?, address_line_2 = ?, barangay = ?, city = ?,
      province_state = ?, postal_code = ?, country_code = ?, updated_at = ?
     WHERE business_id = ? AND id = ? AND status = 'active'`,
    store.name,
    store.code ?? null,
    store.storeType,
    store.storeType === "other" ? (store.customStoreType ?? null) : null,
    store.currencyMode,
    store.currencyMode === "iso" ? store.currencyCode : null,
    store.currencyMode === "custom" ? (store.customCurrencyName ?? null) : null,
    store.currencyMode === "custom" ? (store.customCurrencySymbol ?? null) : null,
    store.currencyDecimalPlaces,
    store.addressLine1 ?? null,
    store.addressLine2 ?? null,
    store.barangay ?? null,
    store.city ?? null,
    store.provinceState ?? null,
    store.postalCode ?? null,
    store.countryCode ?? null,
    now,
    businessId,
    storeId,
  );
  return result.changes;
}

export async function deleteStore(
  db: StoreRepositoryDatabase,
  businessId: string,
  storeId: string,
) {
  let deleted = false;

  await db.withTransactionAsync(async () => {
    const store = await db.getFirstAsync<{ id: string }>(
      "SELECT id FROM stores WHERE business_id = ? AND id = ? AND status = 'active'",
      businessId,
      storeId,
    );
    if (!store) return;

    await db.runAsync(
      "DELETE FROM stock_movements WHERE business_id = ? AND store_id = ?",
      businessId,
      storeId,
    );
    await db.runAsync(
      "DELETE FROM inventory WHERE business_id = ? AND store_id = ?",
      businessId,
      storeId,
    );
    await db.runAsync(
      "DELETE FROM products WHERE business_id = ? AND store_id = ?",
      businessId,
      storeId,
    );
    await db.runAsync(
      "DELETE FROM insight_snapshots WHERE business_id = ? AND store_id = ?",
      businessId,
      storeId,
    );
    await db.runAsync("DELETE FROM store_settings WHERE store_id = ?", storeId);

    const result = await db.runAsync(
      "DELETE FROM stores WHERE business_id = ? AND id = ? AND status = 'active'",
      businessId,
      storeId,
    );
    if (!result.changes) throw new Error("Store not found.");
    deleted = true;

    await db.runAsync(
      "DELETE FROM businesses WHERE id = ? AND NOT EXISTS (SELECT 1 FROM stores WHERE business_id = ?)",
      businessId,
      businessId,
    );
  });

  return deleted;
}

export async function getStoreOverview(
  db: StoreRepositoryDatabase,
  businessId: string,
  storeId: string,
): Promise<StoreOverviewRecord> {
  const overviewQuery = `
    SELECT
      COUNT(products.id) AS productCount,
      COALESCE(SUM(inventory.quantity), 0) AS itemsInStock,
      COALESCE(SUM(CASE WHEN COALESCE(inventory.quantity, 0) > products.reorder_level THEN 1 ELSE 0 END), 0) AS healthyCount,
      COALESCE(SUM(CASE WHEN COALESCE(inventory.quantity, 0) > 0 AND COALESCE(inventory.quantity, 0) <= products.reorder_level THEN 1 ELSE 0 END), 0) AS lowStockCount,
      COALESCE(SUM(CASE WHEN COALESCE(inventory.quantity, 0) <= 0 THEN 1 ELSE 0 END), 0) AS criticalCount
    FROM products
    LEFT JOIN inventory
      ON inventory.product_id = products.id
     AND inventory.business_id = products.business_id
     AND inventory.store_id = products.store_id
    WHERE products.business_id = ?
      AND products.store_id = ?
      AND products.is_active = 1
  `;
  return (
    (await db.getFirstAsync<StoreOverviewRecord>(overviewQuery, businessId, storeId)) ?? {
      productCount: 0,
      itemsInStock: 0,
      healthyCount: 0,
      lowStockCount: 0,
      criticalCount: 0,
    }
  );
}
