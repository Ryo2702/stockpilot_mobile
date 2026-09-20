import type { SQLiteDatabase } from "expo-sqlite";
import { Platform } from "react-native";

import { catalogCategoryValues, type CatalogCategory } from "@/domain/catalog";
import { createProductSchema } from "@/validation/product.validation";

import { storeSchema } from "../validation/store.validation";
import { insertStoreForBusiness, type OwnerStore } from "./owner-store.service";

type ImportExecutor = Pick<
  SQLiteDatabase,
  "getAllAsync" | "getFirstAsync" | "runAsync"
>;
type ImportDatabase = ImportExecutor & Pick<SQLiteDatabase, "withTransactionAsync" | "withExclusiveTransactionAsync">;

type InventoryRow = {
  rowNumber: number;
  storeName: string | null;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: CatalogCategory | null;
  unit: string | null;
  notes: string | null;
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
  createdProductCount?: number;
  updatedProductCount?: number;
  unchangedProductCount?: number;
};

export type InventoryImportPreviewRow = {
  rowNumber: number;
  productName: string;
  sourceName: string;
  sku: string | null;
  category: CatalogCategory;
  unit: string;
  currentQuantity: number;
  importedQuantity: number;
  action: "new_product" | "update_stock";
};

export type InventoryImportAnalysis = {
  destinationStoreId: string;
  destinationStoreName: string;
  fileName: string;
  sourceStoreNames: string[];
  rows: InventoryImportPreviewRow[];
  newProductCount: number;
  existingProductCount: number;
  canImport: true;
  fingerprint: string;
};

type InventoryImportOptions = {
  activeStoreOnly?: boolean;
  expectedAnalysis?: InventoryImportAnalysis;
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
    const barcode = values(row, "barcode")?.trim() || null;
    const rawCategory = values(row, "category")?.trim().toLowerCase();
    const category = rawCategory
      ? catalogCategoryValues.find((value) => value === rawCategory) ?? null
      : null;
    if (rawCategory && !category) throw new Error(`Row ${rowNumber}: ${rawCategory} isn't a supported category.`);
    const unit = values(row, "unit")?.trim() || null;
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
    const notes = values(row, "notes")?.trim() || null;
    if (criticalLevel > reorderLevel) {
      throw new Error(`Row ${rowNumber}: critical_level cannot exceed reorder_level.`);
    }

    rows.push({
      rowNumber,
      storeName,
      name,
      sku,
      barcode,
      category,
      unit,
      notes,
      quantity,
      reorderLevel,
      criticalLevel,
    });

    const processed = index + 1;
    if (processed % PROGRESS_BATCH_SIZE === 0 || processed === dataRows.length) {
      onProgress?.(makeProgress("validating", processed, dataRows.length));
      if (processed < dataRows.length) await yieldToUi();
    }
  }

  return rows;
}

type ActiveImportProduct = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: CatalogCategory;
  unit: string;
  quantity: number;
  isActive: number;
};

type ActiveImportPlanRow = {
  row: InventoryRow;
  existing: ActiveImportProduct | null;
  currentQuantity: number;
  action: InventoryImportPreviewRow["action"];
  newProduct: ReturnType<typeof createProductSchema.parse> | null;
};

function normalizedValue(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function addProductIndex(
  index: Map<string, ActiveImportProduct[]>,
  key: string | null,
  product: ActiveImportProduct,
) {
  if (!key) return;
  const matches = index.get(key) ?? [];
  matches.push(product);
  index.set(key, matches);
}

function oneProductMatch(
  index: Map<string, ActiveImportProduct[]>,
  key: string | null,
  label: string,
  rowNumber: number,
) {
  if (!key) return null;
  const matches = index.get(key) ?? [];
  if (matches.length > 1) throw new Error(`Row ${rowNumber}: ${label} matches more than one product in the destination store.`);
  return matches[0] ?? null;
}

async function buildActiveImportPlan(
  db: ImportExecutor,
  store: OwnerStore,
  rows: InventoryRow[],
): Promise<ActiveImportPlanRow[]> {
  const sourceStores = new Set(
    rows.map(({ storeName }) => storeName ? storeNameKey(storeName) : null).filter(Boolean),
  );
  if (sourceStores.size > 1) throw new Error("This file includes multiple source stores. Export one store at a time.");

  const activeStore = await db.getFirstAsync<{ id: string }>(
    "SELECT id FROM stores WHERE id = ? AND business_id = ? AND status = 'active' LIMIT 1",
    store.storeId,
    store.businessId,
  );
  if (!activeStore) throw new Error(`${store.storeName} is no longer an active store.`);

  const products = await db.getAllAsync<ActiveImportProduct>(
    `SELECT products.id, products.name, products.sku, products.barcode,
       products.category, products.unit, products.is_active AS isActive,
       COALESCE(inventory.quantity, 0) AS quantity
     FROM products
     LEFT JOIN inventory ON inventory.product_id = products.id
       AND inventory.business_id = products.business_id AND inventory.store_id = products.store_id
     WHERE products.business_id = ? AND products.store_id = ?`,
    store.businessId,
    store.storeId,
  );
  const bySku = new Map<string, ActiveImportProduct[]>();
  const byBarcode = new Map<string, ActiveImportProduct[]>();
  const byName = new Map<string, ActiveImportProduct[]>();
  for (const product of products) {
    addProductIndex(bySku, product.sku ? normalizedValue(product.sku) : null, product);
    addProductIndex(byBarcode, product.barcode ? normalizedValue(product.barcode) : null, product);
    addProductIndex(byName, normalizedValue(product.name), product);
  }

  const seenSkus = new Set<string>();
  const seenBarcodes = new Set<string>();
  const seenNamesWithoutId = new Set<string>();
  const matchedProductIds = new Set<string>();
  const plan: ActiveImportPlanRow[] = [];

  for (const row of rows) {
    const skuKey = row.sku ? normalizedValue(row.sku) : null;
    const barcodeKey = row.barcode ? normalizedValue(row.barcode) : null;
    const nameKey = normalizedValue(row.name);
    if (skuKey && seenSkus.has(skuKey)) throw new Error(`Row ${row.rowNumber}: SKU ${row.sku} appears more than once in this file.`);
    if (barcodeKey && seenBarcodes.has(barcodeKey)) throw new Error(`Row ${row.rowNumber}: barcode ${row.barcode} appears more than once in this file.`);
    if (!skuKey && !barcodeKey && seenNamesWithoutId.has(nameKey)) {
      throw new Error(`Row ${row.rowNumber}: ${row.name} appears more than once without a SKU or barcode.`);
    }
    if (skuKey) seenSkus.add(skuKey);
    if (barcodeKey) seenBarcodes.add(barcodeKey);
    if (!skuKey && !barcodeKey) seenNamesWithoutId.add(nameKey);

    const skuMatch = oneProductMatch(bySku, skuKey, `SKU ${row.sku}`, row.rowNumber);
    const barcodeMatch = oneProductMatch(byBarcode, barcodeKey, `barcode ${row.barcode}`, row.rowNumber);
    if (skuMatch && barcodeMatch && skuMatch.id !== barcodeMatch.id) {
      throw new Error(`Row ${row.rowNumber}: the SKU and barcode match different products in ${store.storeName}.`);
    }

    let existing = skuMatch ?? barcodeMatch;
    if (!existing && !row.sku && !row.barcode) {
      const nameMatches = byName.get(nameKey) ?? [];
      if (nameMatches.length > 1) {
        throw new Error(`Row ${row.rowNumber}: ${row.name} matches more than one product. Add its SKU or barcode to the CSV.`);
      }
      existing = nameMatches[0] ?? null;
    }

    if (existing && row.sku && existing.sku && normalizedValue(row.sku) !== normalizedValue(existing.sku)) {
      throw new Error(`Row ${row.rowNumber}: the SKU conflicts with the product matched by barcode in ${store.storeName}.`);
    }
    if (existing && row.barcode && existing.barcode && normalizedValue(row.barcode) !== normalizedValue(existing.barcode)) {
      throw new Error(`Row ${row.rowNumber}: the barcode conflicts with the product matched by SKU in ${store.storeName}.`);
    }
    if (existing?.isActive === 0) {
      throw new Error(`Row ${row.rowNumber}: ${row.name} is archived in ${store.storeName}. Restore it in Catalog before importing stock.`);
    }
    if (existing && matchedProductIds.has(existing.id)) {
      throw new Error(`Row ${row.rowNumber}: more than one row matches ${existing.name} in ${store.storeName}.`);
    }
    if (existing) matchedProductIds.add(existing.id);
    if (existing?.unit && row.unit && normalizedValue(existing.unit) !== normalizedValue(row.unit)) {
      throw new Error(`Row ${row.rowNumber}: ${row.name} uses ${row.unit} in the file but ${existing.unit} in ${store.storeName}.`);
    }

    let newProduct: ActiveImportPlanRow["newProduct"] = null;
    if (!existing) {
      const category = row.category ?? "other";
      if (!catalogCategoryValues.includes(category)) {
        throw new Error(`Row ${row.rowNumber}: category ${category} isn't supported.`);
      }
      const parsed = createProductSchema.safeParse({
        name: row.name,
        sku: row.sku ?? undefined,
        barcode: row.barcode ?? undefined,
        category,
        unit: row.unit ?? "ea",
        currentPrice: null,
        reorderLevel: row.reorderLevel,
        criticalLevel: row.criticalLevel,
        notes: row.notes ?? undefined,
        initialQuantity: row.quantity,
      });
      if (!parsed.success) {
        throw new Error(`Row ${row.rowNumber}: ${parsed.error.issues[0]?.message ?? "Check the item details."}`);
      }
      newProduct = parsed.data;
    }

    plan.push({
      row,
      existing,
      currentQuantity: existing?.quantity ?? 0,
      action: existing ? "update_stock" : "new_product",
      newProduct,
    });
  }

  return plan;
}

function activePlanFingerprint(plan: ActiveImportPlanRow[]) {
  return JSON.stringify(plan.map(({ row, existing, currentQuantity, action, newProduct }) => ({
    row,
    existing,
    currentQuantity,
    action,
    newProduct,
  })));
}

function toImportAnalysis(
  store: OwnerStore,
  fileName: string,
  plan: ActiveImportPlanRow[],
): InventoryImportAnalysis {
  const sourceStores = new Map<string, string>();
  for (const { row } of plan) {
    if (row.storeName) sourceStores.set(storeNameKey(row.storeName), row.storeName);
  }
  const rows = plan.map(({ row, existing, currentQuantity, action, newProduct }) => ({
    rowNumber: row.rowNumber,
    productName: existing?.name ?? newProduct?.name ?? row.name,
    sourceName: row.name,
    sku: existing ? existing.sku : newProduct?.sku ?? row.sku,
    category: existing ? existing.category : newProduct?.category ?? row.category ?? "other",
    unit: existing?.unit ?? newProduct?.unit ?? row.unit ?? "ea",
    currentQuantity,
    importedQuantity: row.quantity,
    action,
  }));
  const newProductCount = plan.filter(({ action }) => action === "new_product").length;
  return {
    destinationStoreId: store.storeId,
    destinationStoreName: store.storeName,
    fileName,
    sourceStoreNames: [...sourceStores.values()],
    rows,
    newProductCount,
    existingProductCount: rows.length - newProductCount,
    canImport: true,
    fingerprint: activePlanFingerprint(plan),
  };
}

export async function analyzeInventoryImport(
  db: ImportExecutor,
  store: OwnerStore,
  csv: string,
  fileName: string,
  onProgress?: (progress: InventoryImportProgress) => void,
): Promise<InventoryImportAnalysis> {
  onProgress?.({ phase: "validating", processed: 0, total: 0, percent: 0 });
  await yieldToUi();
  const rows = await parseInventoryCsv(csv, store.storeName, (progress) => {
    onProgress?.({
      ...progress,
      percent: progress.total ? (progress.processed / progress.total) * 90 : 0,
    });
  });
  if (!rows.length) throw new Error("The CSV has no inventory rows.");
  const plan = await buildActiveImportPlan(db, store, rows);
  onProgress?.({ phase: "validating", processed: rows.length, total: rows.length, percent: 100 });
  return toImportAnalysis(store, fileName, plan);
}

async function withImportTransaction<T>(db: ImportDatabase, task: (tx: ImportExecutor) => Promise<T>) {
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
  if (result === undefined) throw new Error("Inventory import did not complete.");
  return result;
}

async function importIntoActiveStore(
  db: ImportDatabase,
  store: OwnerStore,
  csv: string,
  fileName: string,
  onProgress?: (progress: InventoryImportProgress) => void,
  expectedAnalysis?: InventoryImportAnalysis,
): Promise<InventoryImportResult> {
  const rows = await parseInventoryCsv(csv, store.storeName, onProgress);
  if (!rows.length) throw new Error("The CSV has no inventory rows.");
  const plan = await buildActiveImportPlan(db, store, rows);
  const fingerprint = activePlanFingerprint(plan);
  if (expectedAnalysis && (
    expectedAnalysis.destinationStoreId !== store.storeId ||
    expectedAnalysis.fileName !== fileName ||
    expectedAnalysis.fingerprint !== fingerprint
  )) {
    throw new Error("Inventory changed after review. Analyze the file again before importing.");
  }

  onProgress?.(makeProgress("importing", 0, plan.length));
  await yieldToUi();
  const result = await withImportTransaction(db, async (tx) => {
    const currentPlan = await buildActiveImportPlan(tx, store, rows);
    if (activePlanFingerprint(currentPlan) !== fingerprint) {
      throw new Error("Inventory changed after review. Analyze the file again before importing.");
    }

    let createdProductCount = 0;
    let updatedProductCount = 0;
    let unchangedProductCount = 0;
    for (let index = 0; index < currentPlan.length; index += 1) {
      const { row, existing, currentQuantity, newProduct } = currentPlan[index];
      const productId = existing?.id ?? createId("product");
      const now = new Date().toISOString();

      if (newProduct) {
        await tx.runAsync(
          `INSERT INTO products (
            id, business_id, store_id, name, sku, barcode, category, unit, current_price,
            reorder_level, critical_level, notes, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
          productId,
          store.businessId,
          store.storeId,
          newProduct.name,
          newProduct.sku ?? null,
          newProduct.barcode ?? null,
          newProduct.category,
          newProduct.unit,
          newProduct.currentPrice ?? null,
          newProduct.reorderLevel,
          newProduct.criticalLevel,
          newProduct.notes ?? null,
          now,
          now,
        );
        createdProductCount += 1;
      }

      await tx.runAsync(
        `INSERT INTO inventory (product_id, business_id, store_id, quantity, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(product_id) DO UPDATE SET quantity = excluded.quantity, updated_at = excluded.updated_at`,
        productId,
        store.businessId,
        store.storeId,
        row.quantity,
        now,
      );

      const delta = row.quantity - currentQuantity;
      if (delta !== 0) {
        if (existing) updatedProductCount += 1;
        await tx.runAsync(
          `INSERT INTO stock_movements (
            id, business_id, store_id, product_id, movement_type, delta, quantity_before,
            quantity_after, reason, reference, note, created_at
          ) VALUES (?, ?, ?, ?, 'adjustment', ?, ?, ?, 'csv_import', ?, NULL, ?)`,
          createId("movement"),
          store.businessId,
          store.storeId,
          productId,
          delta,
          currentQuantity,
          row.quantity,
          fileName,
          now,
        );
      } else if (existing) {
        unchangedProductCount += 1;
      }

      const processed = index + 1;
      if (processed % PROGRESS_BATCH_SIZE === 0 || processed === currentPlan.length) {
        onProgress?.(makeProgress("importing", processed, currentPlan.length));
        if (processed < currentPlan.length) await yieldToUi();
      }
    }
    return { createdProductCount, updatedProductCount, unchangedProductCount };
  });

  return {
    importedCount: rows.length,
    destinationStore: store,
    createdStores: [],
    createdProductCount: result.createdProductCount,
    updatedProductCount: result.updatedProductCount,
    unchangedProductCount: result.unchangedProductCount,
  };
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
  options: InventoryImportOptions = {},
): Promise<InventoryImportResult> {
  if (options.activeStoreOnly) {
    return importIntoActiveStore(db, store, csv, fileName, onProgress, options.expectedAnalysis);
  }

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
      let existing = row.sku
        ? await db.getFirstAsync<{ id: string }>(
            `SELECT id FROM products
             WHERE business_id = ? AND store_id = ? AND sku = ? COLLATE NOCASE
               AND (? = 0 OR is_active = 1)`,
            targetStore.businessId,
            targetStore.storeId,
            row.sku,
            0,
          )
        : null;
      const productId = existing?.id ?? createId("product");
      const inventory = existing
        ? await db.getFirstAsync<{ quantity: number; unit: string }>(
            `SELECT COALESCE(inventory.quantity, 0) AS quantity, products.unit
             FROM products
             LEFT JOIN inventory ON inventory.product_id = products.id
               AND inventory.business_id = products.business_id AND inventory.store_id = products.store_id
             WHERE products.id = ? AND products.business_id = ? AND products.store_id = ?`,
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
      } else if (!existing) {
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
            id, business_id, store_id, product_id, movement_type, delta, quantity_before,
            quantity_after, reason, reference, note, created_at
          ) VALUES (?, ?, ?, ?, 'adjustment', ?, ?, ?, 'csv_import', ?, NULL, ?)`,
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
