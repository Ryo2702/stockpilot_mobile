import type { SQLiteDatabase } from "expo-sqlite";

import {
  ownerNameSchema,
  storeSchema,
  type StoreInput,
  type StoreSchema,
} from "../validation/store.validation";

export type OwnerStore = {
  businessId: string;
  ownerName: string;
  storeId: string;
  storeName: string;
};

export type OwnerStoreOverview = {
  catalogCount: number;
  itemsInStock: number;
};

export type OwnerStoreDatabase = Pick<
  SQLiteDatabase,
  "getAllAsync" | "getFirstAsync" | "runAsync" | "withTransactionAsync"
>;

const ownerStoresQuery = `
  SELECT
    businesses.id AS businessId,
    businesses.name AS ownerName,
    stores.id AS storeId,
    stores.name AS storeName
  FROM businesses
  INNER JOIN stores ON stores.business_id = businesses.id
  ORDER BY businesses.created_at ASC, stores.created_at ASC
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

function createId(prefix: string) {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

async function insertStore(
  db: OwnerStoreDatabase,
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
    store.currencyMode === "custom"
      ? (store.customCurrencySymbol ?? null)
      : null,
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

export async function getOwnerStore(db: OwnerStoreDatabase) {
  return db.getFirstAsync<OwnerStore>(`${ownerStoresQuery} LIMIT 1`);
}

export async function getOwnerStores(db: OwnerStoreDatabase) {
  return db.getAllAsync<OwnerStore>(ownerStoresQuery);
}

export async function getOwnerStoreOverview(
  db: OwnerStoreDatabase,
  businessId: string,
  storeId: string,
) {
  const newLocal = `
        SELECT
          COUNT(catalogs.id) AS catalogCount,
          COALESCE(SUM(inventory.quantity), 0) AS itemsInStock
        FROM catalogs
        LEFT JOIN inventory
          ON inventory.catalog_id = catalogs.id
         AND inventory.business_id = catalogs.business_id
         AND inventory.store_id = catalogs.store_id
        WHERE catalogs.business_id = ?
          AND catalogs.store_id = ?
          AND catalogs.is_active = 1
      `;
  return (
    (await db.getFirstAsync<OwnerStoreOverview>(
      newLocal,
      businessId,
      storeId,
    )) ?? { catalogCount: 0, itemsInStock: 0 }
  );
}

export async function createOwnerStore(
  db: OwnerStoreDatabase,
  ownerName: string,
  storeInput: StoreInput | string,
) {
  const owner = ownerNameSchema.parse(ownerName);
  const store = storeSchema.parse(
    typeof storeInput === "string" ? { name: storeInput } : storeInput,
  );
  const existing = await getOwnerStore(db);

  if (existing) return existing;

  const businessId = createId("business");
  const storeId = createId("store");
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      "INSERT INTO businesses (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
      businessId,
      owner,
      now,
      now,
    );
    await insertStore(db, businessId, store, storeId, now);
  });

  return {
    businessId,
    ownerName: owner,
    storeId,
    storeName: store.name,
  } satisfies OwnerStore;
}

export async function createStoreForBusiness(
  db: OwnerStoreDatabase,
  businessId: string,
  storeInput: StoreInput | string,
) {
  const store = storeSchema.parse(
    typeof storeInput === "string" ? { name: storeInput } : storeInput,
  );
  const business = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM businesses WHERE id = ?",
    businessId,
  );

  if (!business) throw new Error("Business not found");

  const storeId = createId("store");
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    await insertStore(db, businessId, store, storeId, now);
  });

  return {
    businessId,
    ownerName: business.name,
    storeId,
    storeName: store.name,
  } satisfies OwnerStore;
}
