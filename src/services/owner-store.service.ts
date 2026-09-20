import type { StoreSchema } from "../validation/store.validation";
import {
  ownerNameSchema,
  storeSchema,
  type StoreInput,
} from "../validation/store.validation";
import {
  deleteStore as deleteStoreRecord,
  findBusinessName,
  findOwnerStore,
  findStoreDetails,
  getStoreOverview,
  insertBusiness,
  insertStore,
  listOwnerStores,
  listRecentStoreActivities,
  updateStore as updateStoreRecord,
  type OwnerStoreRecord,
  type RecentStoreActivityRecord,
  type StoreDetailsRow,
  type StoreRepositoryDatabase,
  type StoreOverviewRecord,
  type StoreWriteDatabase,
} from "../database/repositories/store.repository";

export type OwnerStore = OwnerStoreRecord;
export type OwnerStoreDetails = OwnerStore & StoreSchema;
export type OwnerStoreOverview = StoreOverviewRecord & {
  recentActivities: RecentStoreActivityRecord[];
};
export type OwnerStoreDatabase = StoreRepositoryDatabase;

export class OwnerStoreNotFoundError extends Error {
  constructor() {
    super("Store not found.");
    this.name = "OwnerStoreNotFoundError";
  }
}

function createId(prefix: string) {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

async function createStoreRecord(
  db: StoreWriteDatabase,
  businessId: string,
  ownerName: string,
  store: StoreSchema,
  storeId: string,
  now: string,
) {
  await insertStore(db, businessId, store, storeId, now);
  return {
    businessId,
    ownerName,
    storeId,
    storeName: store.name,
    storeType: store.storeType,
  } satisfies OwnerStore;
}

export async function insertStoreForBusiness(
  db: StoreWriteDatabase,
  businessId: string,
  ownerName: string,
  store: StoreSchema,
) {
  return createStoreRecord(
    db,
    businessId,
    ownerName,
    store,
    createId("store"),
    new Date().toISOString(),
  );
}

export async function getOwnerStore(db: OwnerStoreDatabase) {
  return findOwnerStore(db);
}

export async function getOwnerStores(db: OwnerStoreDatabase) {
  return listOwnerStores(db);
}

export async function getOwnerStoreDetails(
  db: OwnerStoreDatabase,
  businessId: string,
  storeId: string,
): Promise<OwnerStoreDetails | null> {
  const row = await findStoreDetails(db, businessId, storeId);
  if (!row) return null;

  const details = storeSchema.parse({
    name: row.name,
    code: row.code ?? undefined,
    storeType: row.storeType,
    customStoreType: row.customStoreType ?? undefined,
    currencyMode: row.currencyMode,
    currencyCode: row.currencyCode ?? undefined,
    customCurrencyName: row.customCurrencyName ?? undefined,
    customCurrencySymbol: row.customCurrencySymbol ?? undefined,
    currencyDecimalPlaces: row.currencyDecimalPlaces,
    addressLine1: row.addressLine1 ?? undefined,
    addressLine2: row.addressLine2 ?? undefined,
    barangay: row.barangay ?? undefined,
    city: row.city ?? undefined,
    provinceState: row.provinceState ?? undefined,
    postalCode: row.postalCode ?? undefined,
    countryCode: row.countryCode ?? undefined,
    status: row.status,
  });

  return {
    businessId: row.businessId,
    ownerName: row.ownerName,
    storeId: row.storeId,
    storeName: row.storeName,
    ...details,
  };
}

export async function updateOwnerStore(
  db: OwnerStoreDatabase,
  businessId: string,
  storeId: string,
  storeInput: StoreInput,
) {
  const store = storeSchema.parse(storeInput);
  const changes = await updateStoreRecord(
    db,
    businessId,
    storeId,
    store,
    new Date().toISOString(),
  );
  if (!changes) throw new OwnerStoreNotFoundError();

  const updatedStore = await getOwnerStoreDetails(db, businessId, storeId);
  if (!updatedStore) throw new OwnerStoreNotFoundError();
  return updatedStore;
}

export async function deleteOwnerStore(
  db: OwnerStoreDatabase,
  businessId: string,
  storeId: string,
) {
  if (!(await deleteStoreRecord(db, businessId, storeId))) {
    throw new OwnerStoreNotFoundError();
  }
}

export async function getOwnerStoreOverview(
  db: OwnerStoreDatabase,
  businessId: string,
  storeId: string,
) {
  const [overview, recentActivities] = await Promise.all([
    getStoreOverview(db, businessId, storeId),
    listRecentStoreActivities(db, businessId, storeId),
  ]);
  return { ...overview, recentActivities };
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
  const result: { store?: OwnerStore } = {};

  await db.withTransactionAsync(async () => {
    await insertBusiness(db, businessId, owner, now);
    result.store = await createStoreRecord(db, businessId, owner, store, storeId, now);
  });

  if (!result.store) throw new Error("Store creation failed.");
  return result.store;
}

export async function createStoreForBusiness(
  db: OwnerStoreDatabase,
  businessId: string,
  storeInput: StoreInput | string,
) {
  const store = storeSchema.parse(
    typeof storeInput === "string" ? { name: storeInput } : storeInput,
  );
  const ownerName = await findBusinessName(db, businessId);
  if (!ownerName) throw new Error("Business not found.");

  const result: { store?: OwnerStore } = {};
  await db.withTransactionAsync(async () => {
    result.store = await insertStoreForBusiness(db, businessId, ownerName, store);
  });

  if (!result.store) throw new Error("Store creation failed.");
  return result.store;
}
