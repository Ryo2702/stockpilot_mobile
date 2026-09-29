import { Platform } from "react-native";

import type { OwnerStore } from "@/services/owner-store.service";
import createId from "@/utils/createId";

import {
  createInitialInventoryFileImportMapping,
  createInventoryFileImportRows,
  getInventoryFileType,
  inventoryFileImportMappingNeedsReview,
  maxInventoryFileImportBytes,
  parseInventoryFileSource,
} from "./inventory-file-import.parser";
import {
  buildInventoryFileImportReview,
  normalizeInventoryFileCategory,
  parseInventoryFilePrice,
  parseInventoryFileQuantity,
} from "./inventory-file-import.review";
import type {
  InventoryFileImportDatabase,
  InventoryFileImportExecutor,
  InventoryFileImportMetadata,
  InventoryFileImportProduct,
  InventoryFileImportProgress,
  InventoryFileImportResult,
  InventoryFileImportReview,
  InventoryFileImportSource,
} from "./inventory-file-import.types";

function metadataFromReview(review: InventoryFileImportReview): InventoryFileImportMetadata {
  return {
    fileName: review.fileName,
    fileType: review.fileType,
    fileSize: review.fileSize,
    columns: review.columns,
    mapping: review.mapping,
    sourceRecords: review.sourceRecords,
  };
}

export async function prepareInventoryFileImport(
  db: InventoryFileImportExecutor,
  store: OwnerStore,
  source: InventoryFileImportSource,
  onProgress?: (progress: InventoryFileImportProgress) => void,
): Promise<InventoryFileImportReview> {
  const fileType = getInventoryFileType(source.fileName);
  const contentSize = typeof source.content === "string" ? source.content.length : source.content.byteLength;
  if (Math.max(source.fileSize ?? 0, contentSize) > maxInventoryFileImportBytes) {
    throw new Error("Choose an inventory file smaller than 10 MB.");
  }

  onProgress?.({ phase: "reading", processed: 0, total: 1 });
  const parsed = parseInventoryFileSource(source, fileType);
  const mapping = createInitialInventoryFileImportMapping(parsed.columns, parsed.positional);
  const metadata: InventoryFileImportMetadata = {
    fileName: source.fileName,
    fileType,
    fileSize: source.fileSize,
    columns: parsed.columns,
    mapping,
    sourceRecords: parsed.records.map((values, index) => ({
      id: `row-${index + 1}`,
      rowNumber: index + (parsed.positional ? 1 : 2),
      values,
    })),
  };
  if (!metadata.sourceRecords.length) throw new Error("StockPilot could not identify inventory products in this file.");
  if (inventoryFileImportMappingNeedsReview(mapping)) {
    throw new Error("Product Name and Quantity columns are required. Use headers such as Product Name, Item Name, Quantity, or Qty.");
  }

  onProgress?.({ phase: "preparing", processed: 0, total: metadata.sourceRecords.length });
  const review = await buildInventoryFileImportReview(
    db,
    store,
    metadata,
    createInventoryFileImportRows(metadata.sourceRecords, mapping),
  );
  onProgress?.({ phase: "preparing", processed: review.detectedCount, total: review.detectedCount });
  return review;
}

export async function reviewInventoryFileImportRows(
  db: InventoryFileImportExecutor,
  store: OwnerStore,
  review: InventoryFileImportReview,
  rows: InventoryFileImportProduct[],
): Promise<InventoryFileImportReview> {
  return buildInventoryFileImportReview(db, store, metadataFromReview(review), rows);
}

function importProgress(processed: number, total: number): InventoryFileImportProgress {
  return { phase: "importing", processed, total };
}

async function withInventoryFileImportTransaction<T>(
  db: InventoryFileImportDatabase,
  task: (tx: InventoryFileImportExecutor) => Promise<T>,
) {
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
  if (result === undefined) throw new Error("The inventory import did not complete.");
  return result;
}

export async function commitInventoryFileImport(
  db: InventoryFileImportDatabase,
  store: OwnerStore,
  review: InventoryFileImportReview,
  onProgress?: (progress: InventoryFileImportProgress) => void,
): Promise<InventoryFileImportResult> {
  const refreshed = await reviewInventoryFileImportRows(db, store, review, review.rows);
  if (refreshed.fingerprint !== review.fingerprint) {
    throw new Error("Inventory changed after review. Review the file again before importing.");
  }
  const rowsToImport = refreshed.rows.filter(({ canImport }) => canImport);
  if (!rowsToImport.length) throw new Error("Resolve at least one product before importing.");

  onProgress?.(importProgress(0, rowsToImport.length));
  const result = await withInventoryFileImportTransaction(db, async (tx) => {
    const locked = await reviewInventoryFileImportRows(tx, store, review, review.rows);
    if (locked.fingerprint !== review.fingerprint) {
      throw new Error("Inventory changed after review. Review the file again before importing.");
    }

    const importRows = locked.rows.filter(({ canImport }) => canImport);
    let createdProductCount = 0;
    let updatedProductCount = 0;

    for (let index = 0; index < importRows.length; index += 1) {
      const row = importRows[index];
      const quantity = parseInventoryFileQuantity(row.quantity).value!;
      const costPrice = parseInventoryFilePrice(row.costPrice).value;
      const sellingPrice = parseInventoryFilePrice(row.sellingPrice).value;
      const now = new Date().toISOString();
      const existing = row.existing;
      const productId = existing?.id ?? createId("product");
      const previousQuantity = existing?.quantity ?? 0;

      if (!existing) {
        const category = normalizeInventoryFileCategory(row.category) ?? "other";
        await tx.runAsync(
          `INSERT INTO products (
            id, business_id, store_id, name, sku, barcode, category, unit, cost_price, current_price,
            reorder_level, critical_level, notes, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, NULL, 1, ?, ?)`,
          productId,
          store.businessId,
          store.storeId,
          row.name,
          row.sku || null,
          row.barcode || null,
          category,
          row.unit || "ea",
          costPrice,
          sellingPrice,
          now,
          now,
        );
        createdProductCount += 1;
      } else {
        updatedProductCount += 1;
      }

      await tx.runAsync(
        `INSERT INTO inventory (product_id, business_id, store_id, quantity, updated_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(product_id) DO UPDATE SET quantity = excluded.quantity, updated_at = excluded.updated_at`,
        productId,
        store.businessId,
        store.storeId,
        quantity,
        now,
      );
      if (quantity !== previousQuantity) {
        await tx.runAsync(
          `INSERT INTO stock_movements (
            id, business_id, store_id, product_id, movement_type, delta, quantity_before,
            quantity_after, reason, reference, note, created_at
          ) VALUES (?, ?, ?, ?, 'adjustment', ?, ?, ?, 'file_import', ?, NULL, ?)`,
          createId("movement"),
          store.businessId,
          store.storeId,
          productId,
          quantity - previousQuantity,
          previousQuantity,
          quantity,
          review.fileName,
          now,
        );
      }
      onProgress?.(importProgress(index + 1, importRows.length));
    }
    return { createdProductCount, updatedProductCount };
  });

  return {
    importedCount: rowsToImport.length,
    createdProductCount: result.createdProductCount,
    updatedProductCount: result.updatedProductCount,
    remainingReviewCount: refreshed.rows.length - rowsToImport.length,
  };
}
