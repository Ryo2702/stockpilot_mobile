import type { SQLiteDatabase } from "expo-sqlite";

import { storeSchema } from "../validation/store.validation";
import { insertStoreForBusiness, type OwnerStore } from "./owner-store.service";

type ImportDatabase = Pick<
  SQLiteDatabase,
  "getAllAsync" | "getFirstAsync" | "runAsync" | "withTransactionAsync"
>;

type InventoryRow = {
  storeName: string | null;
  name: string;
  sku: string | null;
  quantity: number;
  reorderLevel: number;
  criticalLevel: number;
};

export type InventoryImportProgress = {
  phase: "validating" | "importing";
  processed: number;
  total: number;
  percent: number;
};

export type InventoryImportResult = {
  importedCount: number;
  destinationStore: OwnerStore;
  createdStores: OwnerStore[];
};

const PROGRESS_BATCH_SIZE = 250;

function makeProgress(
  phase: InventoryImportProgress["phase"],
  processed: number,
  total: number,
): InventoryImportProgress {
  const fraction = total ? processed / total : 0;
  return {
    phase,
    processed,
    total,
    percent: phase === "validating" ? fraction * 10 : 10 + fraction * 89,
  };
}

function yieldToUi() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function storeNameKey(name: string) {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function parseCsvRecords(csv: string) {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];

    if (quoted) {
      if (char === '"' && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field.length === 0) {
      quoted = true;
    } else if (char === ",") {
      record.push(field);
      field = "";
    } else if (char === "\n") {
      record.push(field.replace(/\r$/, ""));
      records.push(record);
      record = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (quoted) throw new Error("The CSV has an unclosed quoted value.");
  if (field.length || record.length) {
    record.push(field.replace(/\r$/, ""));
    records.push(record);
  }

  return records.filter((row) => row.some((value) => value.trim()));
}

function parseCount(value: string | undefined, label: string, rowNumber: number) {
  if (value === undefined || value.trim() === "") {
    if (label === "quantity") throw new Error(`Row ${rowNumber}: quantity is required.`);
    return 0;
  }

  const rawCount = value.trim();
  const count = Number(rawCount);
  if (!/^\d+$/.test(rawCount) || !Number.isSafeInteger(count)) {
    throw new Error(`Row ${rowNumber}: ${label} must be a whole number of 0 or more.`);
  }
  return count;
}

async function parseInventoryCsv(
  csv: string,
  defaultStoreName: string,
  onProgress?: (progress: InventoryImportProgress) => void,
): Promise<InventoryRow[]> {
  const [headerRow, ...dataRows] = parseCsvRecords(csv.replace(/^\uFEFF/, ""));
  if (!headerRow) throw new Error("The CSV file is empty.");

  const headers = headerRow.map((header) => header.trim().toLowerCase());
  if (new Set(headers).size !== headers.length) throw new Error("The CSV contains duplicate column names.");

  const column = (name: string) => headers.indexOf(name);
  if (column("name") === -1 || column("quantity") === -1) {
    throw new Error("CSV must include the name and quantity columns.");
  }

  const values = (row: string[], name: string) => {
    const index = column(name);
    return index === -1 ? undefined : row[index];
  };
  const seenSkus = new Map<string, Set<string>>();
  const normalizedStoreNames = new Map<string, string>();
  const rows: InventoryRow[] = [];
  onProgress?.(makeProgress("validating", 0, dataRows.length));
  await yieldToUi();

  for (let index = 0; index < dataRows.length; index += 1) {
    const row = dataRows[index];
    const rowNumber = index + 2;
    const name = values(row, "name")?.trim() ?? "";
    if (!name) throw new Error(`Row ${rowNumber}: name is required.`);

    const rawStoreName = values(row, "store_name")?.trim();
    let storeName: string | null = null;
    if (rawStoreName) {
      const key = storeNameKey(rawStoreName);
      storeName = normalizedStoreNames.get(key) ?? null;
      if (!storeName) {
        const parsedStore = storeSchema.safeParse({ name: rawStoreName });
        if (!parsedStore.success) {
          throw new Error(`Row ${rowNumber}: ${parsedStore.error.issues[0]?.message ?? "Invalid store name."}`);
        }
        storeName = parsedStore.data.name;
        normalizedStoreNames.set(key, storeName);
      }
    }

    const sku = values(row, "sku")?.trim().toUpperCase() || null;
    if (sku) {
      const skuStoreKey = storeNameKey(storeName ?? defaultStoreName);
      const storeSkus = seenSkus.get(skuStoreKey) ?? new Set<string>();
      if (storeSkus.has(sku)) {
        throw new Error(`Row ${rowNumber}: SKU ${sku} appears more than once in ${storeName ?? defaultStoreName}.`);
      }
      storeSkus.add(sku);
      seenSkus.set(skuStoreKey, storeSkus);
    }

    const quantity = parseCount(values(row, "quantity"), "quantity", rowNumber);
    const reorderLevel = parseCount(values(row, "reorder_level"), "reorder_level", rowNumber);
    const criticalLevel = parseCount(values(row, "critical_level"), "critical_level", rowNumber);
    if (criticalLevel > reorderLevel) {
      throw new Error(`Row ${rowNumber}: critical_level cannot exceed reorder_level.`);
    }

    rows.push({ storeName, name, sku, quantity, reorderLevel, criticalLevel });

    const processed = index + 1;
    if (processed % PROGRESS_BATCH_SIZE === 0 || processed === dataRows.length) {
      onProgress?.(makeProgress("validating", processed, dataRows.length));
      if (processed < dataRows.length) await yieldToUi();
    }
  }

  return rows;
}

function createId(prefix: string) {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function importInventoryCsv(
  db: ImportDatabase,
  store: OwnerStore,
  csv: string,
  fileName: string,
  onProgress?: (progress: InventoryImportProgress) => void,
): Promise<InventoryImportResult> {
  onProgress?.(makeProgress("validating", 0, 0));
  await yieldToUi();
  const rows = await parseInventoryCsv(csv, store.storeName, onProgress);
  if (!rows.length) throw new Error("The CSV has no inventory rows.");
  const now = new Date().toISOString();
  const storesByName = new Map<string, OwnerStore>();
  const importedStoreNames = new Map<string, string>();
  const createdStores: OwnerStore[] = [];

  const businessStores = await db.getAllAsync<OwnerStore>(`
    SELECT
      businesses.id AS businessId,
      businesses.name AS ownerName,
      stores.id AS storeId,
      stores.name AS storeName,
      stores.store_type AS storeType
    FROM businesses
    INNER JOIN stores ON stores.business_id = businesses.id
    WHERE businesses.id = ? AND stores.status = 'active'
  `, store.businessId);
  for (const businessStore of businessStores) {
    storesByName.set(storeNameKey(businessStore.storeName), businessStore);
  }
  for (const row of rows) {
    if (row.storeName) importedStoreNames.set(storeNameKey(row.storeName), row.storeName);
  }

  onProgress?.(makeProgress("importing", 0, rows.length));
  await yieldToUi();
  await db.withTransactionAsync(async () => {
    for (const [nameKey, storeName] of importedStoreNames) {
      if (storesByName.has(nameKey)) continue;
      const createdStore = await insertStoreForBusiness(
        db,
        store.businessId,
        store.ownerName,
        storeSchema.parse({ name: storeName }),
      );
      storesByName.set(nameKey, createdStore);
      createdStores.push(createdStore);
    }

    for (let index = 0; index < rows.length; index += 1) {
      const row = rows[index];
      const targetStore = row.storeName
        ? storesByName.get(storeNameKey(row.storeName))
        : store;
      if (!targetStore) throw new Error(`Row ${index + 2}: store could not be resolved.`);
      const existing = row.sku
        ? await db.getFirstAsync<{ id: string }>(
            "SELECT id FROM products WHERE business_id = ? AND store_id = ? AND sku = ? COLLATE NOCASE",
            targetStore.businessId,
            targetStore.storeId,
            row.sku,
          )
        : null;
      const productId = existing?.id ?? createId("product");
      const inventory = existing
        ? await db.getFirstAsync<{ quantity: number }>(
            "SELECT quantity FROM inventory WHERE product_id = ? AND business_id = ? AND store_id = ?",
            productId,
            targetStore.businessId,
            targetStore.storeId,
          )
        : null;
      const previousQuantity = inventory?.quantity ?? 0;

      if (existing) {
        await db.runAsync(
          "UPDATE products SET name = ?, reorder_level = ?, critical_level = ?, is_active = 1, updated_at = ? WHERE id = ? AND business_id = ? AND store_id = ?",
          row.name,
          row.reorderLevel,
          row.criticalLevel,
          now,
          productId,
          targetStore.businessId,
          targetStore.storeId,
        );
      } else {
        await db.runAsync(
          `INSERT INTO products (
            id, business_id, store_id, name, sku, reorder_level, critical_level,
            is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
          productId,
          targetStore.businessId,
          targetStore.storeId,
          row.name,
          row.sku,
          row.reorderLevel,
          row.criticalLevel,
          now,
          now,
        );
      }

      if (inventory) {
        await db.runAsync(
          "UPDATE inventory SET quantity = ?, updated_at = ? WHERE product_id = ? AND business_id = ? AND store_id = ?",
          row.quantity,
          now,
          productId,
          targetStore.businessId,
          targetStore.storeId,
        );
      } else {
        await db.runAsync(
          "INSERT INTO inventory (product_id, business_id, store_id, quantity, updated_at) VALUES (?, ?, ?, ?, ?)",
          productId,
          targetStore.businessId,
          targetStore.storeId,
          row.quantity,
          now,
        );
      }

      if (row.quantity !== previousQuantity) {
        await db.runAsync(
          `INSERT INTO stock_movements (
            id, business_id, store_id, product_id, delta, quantity_before,
            quantity_after, reason, note, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'csv_import', ?, ?)`,
          createId("movement"),
          targetStore.businessId,
          targetStore.storeId,
          productId,
          row.quantity - previousQuantity,
          previousQuantity,
          row.quantity,
          fileName,
          now,
        );
      }

      const processed = index + 1;
      if (processed % PROGRESS_BATCH_SIZE === 0 || processed === rows.length) {
        onProgress?.(makeProgress("importing", processed, rows.length));
        if (processed < rows.length) await yieldToUi();
      }
    }
  });

  const lastRow = rows[rows.length - 1];
  return {
    importedCount: rows.length,
    destinationStore: lastRow.storeName
      ? (storesByName.get(storeNameKey(lastRow.storeName)) ?? store)
      : store,
    createdStores,
  };
}
