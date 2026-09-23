import type { SQLiteDatabase } from "expo-sqlite";
import { Platform } from "react-native";

import {
  InventoryItemNotFoundError,
  InventoryMovementNotFoundError,
  InventoryStoreNotFoundError,
  InsufficientStockError,
  InvalidInventoryPreferenceError,
  InvalidStockAdjustmentError,
  NoStockChangeError,
} from "@/domain/inventory.errors";
import {
  inventorySortValues,
  type InventoryListQuery,
  type InventoryMovementFilter,
  type InventoryMovementPeriod,
  type InventorySort,
} from "@/domain/inventory";
import {
  getActiveInventoryQuantity,
  getInventoryCounts,
  getInventoryItem,
  getInventoryMovement,
  getInventoryPreferences,
  getProductMovementSummary,
  insertInventoryMovement,
  listInventoryItems,
  listInventoryMovements,
  listProductInventoryMovements,
  setInventoryPreferences,
  updateInventoryQuantity,
} from "@/database/repositories/inventory.repository";
import type { NamedStoreScope, StoreScope } from "@/domain/store";
import {
  inventoryPreferencesSchema,
  stockAdjustmentSchema,
  type StockAdjustmentInput,
} from "@/validation/inventory.validation";
import createId from "@/utils/createId";

type InventoryExecutor = Pick<SQLiteDatabase, "getAllAsync" | "getFirstAsync" | "runAsync">;
type InventoryDatabase = InventoryExecutor &
  Pick<SQLiteDatabase, "withTransactionAsync" | "withExclusiveTransactionAsync">;

async function withInventoryTransaction<T>(db: InventoryDatabase, task: (tx: InventoryExecutor) => Promise<T>) {
  let result: T | undefined;
  if (Platform.OS !== "web" && db.withExclusiveTransactionAsync) {
    await db.withExclusiveTransactionAsync(async (tx) => {
      result = await task(tx);
    });
  } else {
    await db.withTransactionAsync(async () => {
      result = await task(db);
    });
  }
  if (result === undefined) throw new Error("Stock update did not complete.");
  return result;
}

export async function getInventoryList(
  db: InventoryExecutor,
  store: StoreScope,
  query: InventoryListQuery,
) {
  return listInventoryItems(db, store, query);
}

export async function getInventoryOverview(db: InventoryExecutor, store: StoreScope) {
  return getInventoryCounts(db, store);
}

export async function getInventoryDetail(
  db: InventoryExecutor,
  store: StoreScope,
  productId: string,
  archived = false,
) {
  const item = await getInventoryItem(db, store, productId, archived);
  if (!item) throw new InventoryItemNotFoundError();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [summary, recentMovements] = await Promise.all([
    getProductMovementSummary(db, store, productId, since),
    listProductInventoryMovements(db, store, productId, 3),
  ]);
  return { item, summary, recentMovements };
}

export async function getInventoryMovementHistory(
  db: InventoryExecutor,
  store: StoreScope,
  query: {
    search?: string;
    type: InventoryMovementFilter;
    period: InventoryMovementPeriod;
    productId?: string;
    offset?: number;
  },
) {
  let since: string | undefined;
  if (query.period !== "all") {
    const start = new Date();
    if (query.period === "today") start.setHours(0, 0, 0, 0);
    else start.setDate(start.getDate() - (query.period === "7_days" ? 7 : 30));
    since = start.toISOString();
  }
  return listInventoryMovements(db, store, {
    search: query.search,
    type: query.type,
    since,
    productId: query.productId,
    limit: 50,
    offset: query.offset,
  });
}

export async function getInventoryMovementDetail(
  db: InventoryExecutor,
  store: StoreScope,
  movementId: string,
) {
  const movement = await getInventoryMovement(db, store, movementId);
  if (!movement) throw new InventoryMovementNotFoundError();
  return movement;
}

export async function applyStockChange(
  db: InventoryDatabase,
  store: StoreScope,
  productId: string,
  input: StockAdjustmentInput,
) {
  const parsed = stockAdjustmentSchema.safeParse(input);
  if (!parsed.success) {
    throw new InvalidStockAdjustmentError(parsed.error.issues[0]?.message ?? "Check the stock change.");
  }
  const change = parsed.data;

  return withInventoryTransaction(db, async (tx) => {
    const current = await getActiveInventoryQuantity(tx, store, productId);
    if (!current) throw new InventoryItemNotFoundError();

    const delta = change.type === "stock_in"
      ? change.quantity
      : change.type === "stock_out"
        ? -change.quantity
        : change.quantity - current.quantity;
    const nextQuantity = current.quantity + delta;
    if (nextQuantity < 0) throw new InsufficientStockError(current.quantity);
    if (delta === 0) throw new NoStockChangeError();

    const now = new Date().toISOString();
    const movement = {
      id: createId("movement"),
      productId,
      type: change.type === "set_current_stock" ? "adjustment" as const : change.type,
      delta,
      quantityBefore: current.quantity,
      quantityAfter: nextQuantity,
      reason: change.reason,
      reference: change.reference ?? null,
      note: change.note ?? null,
      createdAt: now,
    };
    await updateInventoryQuantity(tx, store, productId, nextQuantity, now);
    await insertInventoryMovement(tx, movement, store);
    return nextQuantity;
  });
}

function isInventorySort(value: unknown): value is InventorySort {
  return typeof value === "string" && inventorySortValues.includes(value as InventorySort);
}

export async function getInventoryPreference(db: InventoryExecutor, store: StoreScope) {
  const preferences = await getInventoryPreferences(db, store);
  return isInventorySort(preferences?.defaultSort) ? preferences.defaultSort : "name_asc";
}

export async function saveInventoryPreference(
  db: InventoryDatabase,
  store: StoreScope,
  value: InventorySort,
) {
  const current = await getInventoryPreferences(db, store);
  const parsed = inventoryPreferencesSchema.safeParse({ ...current, defaultSort: value });
  if (!parsed.success) {
    throw new InvalidInventoryPreferenceError();
  }
  const saved = await setInventoryPreferences(db, store, parsed.data, new Date().toISOString());
  if (!saved) throw new InventoryStoreNotFoundError();
}

export async function getInventoryProductDefaults(db: InventoryExecutor, store: StoreScope) {
  const preferences = await getInventoryPreferences(db, store);
  const defaultReorderLevel = preferences?.defaultReorderLevel;
  return {
    defaultReorderLevel: typeof defaultReorderLevel === "number" &&
      Number.isSafeInteger(defaultReorderLevel) && defaultReorderLevel >= 0
      ? defaultReorderLevel
      : 10,
    defaultUnit: typeof preferences?.defaultUnit === "string" && preferences.defaultUnit.trim()
      ? preferences.defaultUnit
      : "ea",
  };
}

export async function saveInventoryProductDefaults(
  db: InventoryDatabase,
  store: StoreScope,
  defaults: { defaultReorderLevel: number; defaultUnit: string },
) {
  const current = await getInventoryPreferences(db, store);
  const parsed = inventoryPreferencesSchema.safeParse({
    ...current,
    defaultSort: isInventorySort(current?.defaultSort) ? current.defaultSort : "name_asc",
    ...defaults,
  });
  if (!parsed.success) throw new InvalidInventoryPreferenceError();
  const saved = await setInventoryPreferences(db, store, parsed.data, new Date().toISOString());
  if (!saved) throw new InventoryStoreNotFoundError();
}

function csvCell(value: string | number | null) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function exportInventoryCsv(db: InventoryExecutor, store: NamedStoreScope) {
  const { items } = await listInventoryItems(db, store, { limit: 100000 });
  const productNotes = await db.getAllAsync<{ id: string; notes: string | null }>(
    "SELECT id, notes FROM products WHERE business_id = ? AND store_id = ? AND is_active = 1",
    store.businessId,
    store.storeId,
  );
  const notesByProductId = new Map(productNotes.map(({ id, notes }) => [id, notes]));
  const rows = [
    ["store_name", "name", "sku", "barcode", "category", "unit", "notes", "quantity", "reorder_level", "critical_level"],
    ...items.map((item) => [
      store.storeName,
      item.name,
      item.sku,
      item.barcode,
      item.category,
      item.unit,
      notesByProductId.get(item.id) ?? null,
      item.quantity,
      item.reorderLevel,
      item.criticalLevel,
    ]),
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}
