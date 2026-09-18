import type { SQLiteDatabase } from "expo-sqlite";

import { ownerNameSchema, storeSchema } from "../validation/store.validation";

export type OwnerStore = {
  businessId: string;
  ownerName: string;
  storeId: string;
  storeName: string;
};

export type OwnerStoreDatabase = Pick<
  SQLiteDatabase,
  "getFirstAsync" | "runAsync" | "withTransactionAsync"
>;

const ownerStoreQuery = `
  SELECT
    businesses.id AS businessId,
    businesses.name AS ownerName,
    stores.id AS storeId,
    stores.name AS storeName
  FROM businesses
  INNER JOIN stores ON stores.business_id = businesses.id
  ORDER BY businesses.created_at ASC, stores.created_at ASC
  LIMIT 1
`;

function createId(prefix: string) {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

export async function getOwnerStore(db: OwnerStoreDatabase) {
  return db.getFirstAsync<OwnerStore>(ownerStoreQuery);
}

export async function createOwnerStore(db: OwnerStoreDatabase, ownerName: string, storeName: string) {
  const owner = ownerNameSchema.parse(ownerName);
  const store = storeSchema.parse({ name: storeName }).name;
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
    await db.runAsync(
      "INSERT INTO stores (id, business_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      storeId,
      businessId,
      store,
      now,
      now,
    );
  });

  return { businessId, ownerName: owner, storeId, storeName: store } satisfies OwnerStore;
}
