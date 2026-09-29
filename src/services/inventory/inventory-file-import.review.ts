import { catalogCategoryValues, type CatalogCategory } from "@/domain/catalog";
import type { OwnerStore } from "@/services/owner-store.service";
import { createProductSchema } from "@/validation/product.validation";

import { normalizeInventoryFileValue } from "./inventory-file-import.parser";
import type {
  ExistingInventoryFileProduct,
  ExistingInventoryFileProductRecord,
  InventoryFileImportExecutor,
  InventoryFileImportFieldMapping,
  InventoryFileImportIssue,
  InventoryFileImportMetadata,
  InventoryFileImportProduct,
  InventoryFileImportReview,
} from "./inventory-file-import.types";

export function parseInventoryFileQuantity(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { value: null, error: "Quantity is required." };
  if (!/^\d+$/.test(trimmed)) return { value: null, error: "Quantity must be zero or greater." };
  const quantity = Number(trimmed);
  if (!Number.isSafeInteger(quantity)) return { value: null, error: "Quantity must be zero or greater." };
  return { value: quantity, error: null };
}

export function parseInventoryFilePrice(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { value: null, error: null };
  const normalized = trimmed.replace(/[₱$€£¥\s]/g, "").replace(/,/g, "");
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return { value: null, error: "Price contains an unsupported value." };
  const price = Number(normalized);
  if (!Number.isFinite(price) || price < 0) return { value: null, error: "Price must be zero or greater." };
  return { value: price, error: null };
}

export function normalizeInventoryFileCategory(value: string): CatalogCategory | null {
  const category = normalizeInventoryFileValue(value).replace(/[\s-]+/g, "_");
  return catalogCategoryValues.find((entry) => entry === category) ?? null;
}

function issuePriority(issues: InventoryFileImportIssue[]) {
  const codes = new Set(issues.map(({ code }) => code));
  if (codes.has("missing_required_field")) return "missing_required_field" as const;
  if (codes.has("invalid_quantity")) return "invalid_quantity" as const;
  if (codes.has("invalid_price")) return "invalid_price" as const;
  if (codes.has("duplicate_barcode")) return "duplicate_barcode" as const;
  if (codes.has("duplicate_sku")) return "duplicate_sku" as const;
  if (codes.has("possible_match")) return "possible_match" as const;
  return "needs_review" as const;
}

function indexExistingProducts(
  products: ExistingInventoryFileProductRecord[],
  key: "sku" | "barcode" | "name",
) {
  const index = new Map<string, ExistingInventoryFileProductRecord[]>();
  for (const product of products) {
    const value = product[key];
    if (!value) continue;
    const normalized = normalizeInventoryFileValue(value);
    const matches = index.get(normalized) ?? [];
    matches.push(product);
    index.set(normalized, matches);
  }
  return index;
}

function occurrenceCounts(rows: InventoryFileImportProduct[], field: "sku" | "barcode") {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row[field].trim()) continue;
    const value = normalizeInventoryFileValue(row[field]);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

function mapExistingProduct(
  product: ExistingInventoryFileProductRecord,
  match: ExistingInventoryFileProduct["match"],
): ExistingInventoryFileProduct {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    quantity: product.quantity,
    match,
    isActive: Boolean(product.isActive),
  };
}

async function assertActiveStore(db: InventoryFileImportExecutor, store: OwnerStore) {
  const activeStore = await db.getFirstAsync<{ id: string }>(
    "SELECT id FROM stores WHERE id = ? AND business_id = ? AND status = 'active' LIMIT 1",
    store.storeId,
    store.businessId,
  );
  if (!activeStore) throw new Error(`${store.storeName} is no longer an active store.`);
}

export async function validateInventoryFileImportRows(
  db: InventoryFileImportExecutor,
  store: OwnerStore,
  rows: InventoryFileImportProduct[],
  mapping: InventoryFileImportFieldMapping[],
): Promise<InventoryFileImportProduct[]> {
  await assertActiveStore(db, store);
  const products = await db.getAllAsync<ExistingInventoryFileProductRecord>(
    `SELECT products.id, products.name, products.sku, products.barcode,
       COALESCE(inventory.quantity, 0) AS quantity, products.is_active AS isActive
     FROM products
     LEFT JOIN inventory ON inventory.product_id = products.id
       AND inventory.business_id = products.business_id AND inventory.store_id = products.store_id
     WHERE products.business_id = ? AND products.store_id = ?`,
    store.businessId,
    store.storeId,
  );
  const bySku = indexExistingProducts(products, "sku");
  const byBarcode = indexExistingProducts(products, "barcode");
  const byName = indexExistingProducts(products, "name");
  const skuCounts = occurrenceCounts(rows, "sku");
  const barcodeCounts = occurrenceCounts(rows, "barcode");
  const requiresSellingPrice = mapping.some(({ field }) => field === "sellingPrice");

  return rows.map((rawRow) => {
    const row: InventoryFileImportProduct = {
      ...rawRow,
      name: rawRow.name.trim().replace(/\s+/g, " "),
      sku: rawRow.sku.trim().toUpperCase(),
      barcode: rawRow.barcode.trim(),
      quantity: rawRow.quantity.trim(),
      costPrice: rawRow.costPrice.trim(),
      sellingPrice: rawRow.sellingPrice.trim(),
      category: rawRow.category.trim(),
      unit: rawRow.unit.trim(),
      issues: [],
      existing: null,
      approveExisting: rawRow.approveExisting,
      status: "needs_review",
      canImport: false,
    };
    const issues: InventoryFileImportIssue[] = [];
    const quantity = parseInventoryFileQuantity(row.quantity);
    const costPrice = parseInventoryFilePrice(row.costPrice);
    const sellingPrice = parseInventoryFilePrice(row.sellingPrice);
    const category = row.category ? normalizeInventoryFileCategory(row.category) : "other";

    if (!row.name) issues.push({ code: "missing_required_field", message: "Product name is required." });
    if (quantity.error) issues.push({
      code: row.quantity ? "invalid_quantity" : "missing_required_field",
      message: quantity.error,
    });
    if (costPrice.error) issues.push({ code: "invalid_price", message: `Cost price ${costPrice.error.toLowerCase()}` });
    if (sellingPrice.error) issues.push({ code: "invalid_price", message: `Selling price ${sellingPrice.error.toLowerCase()}` });
    if (requiresSellingPrice && !row.sellingPrice) {
      issues.push({ code: "needs_review", message: "Selling price is missing." });
    }
    if (row.category && !category) {
      issues.push({ code: "needs_review", message: "Category is not recognized." });
    }
    if (row.sku && (skuCounts.get(normalizeInventoryFileValue(row.sku)) ?? 0) > 1) {
      issues.push({ code: "duplicate_sku", message: "This SKU appears more than once in this import." });
    }
    if (row.barcode && (barcodeCounts.get(normalizeInventoryFileValue(row.barcode)) ?? 0) > 1) {
      issues.push({ code: "duplicate_barcode", message: "This barcode appears more than once in this import." });
    }

    const barcodeMatches = row.barcode ? byBarcode.get(normalizeInventoryFileValue(row.barcode)) ?? [] : [];
    const skuMatches = row.sku ? bySku.get(normalizeInventoryFileValue(row.sku)) ?? [] : [];
    const nameMatches = row.name ? byName.get(normalizeInventoryFileValue(row.name)) ?? [] : [];
    const barcodeMatch = barcodeMatches.length === 1 ? barcodeMatches[0] : null;
    const skuMatch = skuMatches.length === 1 ? skuMatches[0] : null;

    if (barcodeMatches.length > 1 || skuMatches.length > 1) {
      issues.push({ code: "possible_match", message: "More than one existing product matches this identifier." });
    } else if (barcodeMatch && skuMatch && barcodeMatch.id !== skuMatch.id) {
      issues.push({ code: "duplicate_barcode", message: "This barcode and SKU belong to different existing products." });
    } else if (barcodeMatch || skuMatch) {
      const existing = barcodeMatch ?? skuMatch!;
      row.existing = mapExistingProduct(existing, barcodeMatch ? "barcode" : "sku");
      if (row.name && normalizeInventoryFileValue(row.name) !== normalizeInventoryFileValue(existing.name)) {
        issues.push({
          code: barcodeMatch ? "duplicate_barcode" : "duplicate_sku",
          message: `${barcodeMatch ? "Barcode" : "SKU"} is already assigned to ${existing.name}.`,
        });
      } else if (!existing.isActive) {
        issues.push({ code: "needs_review", message: `${existing.name} is archived in this store.` });
      }
    } else if (nameMatches.length) {
      row.existing = mapExistingProduct(nameMatches[0], "name");
      issues.push({
        code: "possible_match",
        message: nameMatches.length > 1
          ? "More than one product has this name. Add an SKU or barcode to confirm it."
          : `Possible match: ${nameMatches[0].name}. Confirm it before importing.`,
      });
    }

    const productInput = createProductSchema.safeParse({
      name: row.name,
      sku: row.sku || undefined,
      barcode: row.barcode || undefined,
      category: category ?? "other",
      unit: row.unit || "ea",
      currentPrice: sellingPrice.value,
      reorderLevel: 0,
      criticalLevel: 0,
      notes: undefined,
      initialQuantity: quantity.value ?? 0,
    });
    if (!productInput.success && !row.existing) {
      const message = productInput.error.issues[0]?.message ?? "Check this product's details.";
      if (!issues.some((issue) => issue.message === message)) {
        issues.push({ code: "needs_review", message });
      }
    }

    row.issues = issues;
    if (issues.length) {
      row.status = issuePriority(issues);
      row.approveExisting = false;
    } else if (row.existing) {
      row.status = "existing_product";
    } else {
      row.status = "ready";
    }
    row.canImport = row.status === "ready" || (row.status === "existing_product" && row.approveExisting);
    return row;
  });
}

function fingerprint(rows: InventoryFileImportProduct[]) {
  return JSON.stringify(rows.map(({ id, name, sku, barcode, quantity, costPrice, sellingPrice, category, unit, existing, approveExisting, status }) => ({
    id,
    name,
    sku,
    barcode,
    quantity,
    costPrice,
    sellingPrice,
    category,
    unit,
    existingId: existing?.id ?? null,
    existingQuantity: existing?.quantity ?? null,
    approveExisting,
    status,
  })));
}

export function finalizeInventoryFileImportReview(
  metadata: InventoryFileImportMetadata,
  rows: InventoryFileImportProduct[],
): InventoryFileImportReview {
  const readyCount = rows.filter(({ canImport }) => canImport).length;
  const existingCount = rows.filter(({ status }) => status === "existing_product").length;
  return {
    ...metadata,
    detectedCount: metadata.sourceRecords.length,
    rows,
    readyCount,
    existingCount,
    needsReviewCount: rows.filter(({ canImport, status }) => !canImport && status !== "existing_product").length,
    fingerprint: fingerprint(rows),
  };
}

export async function buildInventoryFileImportReview(
  db: InventoryFileImportExecutor,
  store: OwnerStore,
  metadata: InventoryFileImportMetadata,
  rows: InventoryFileImportProduct[],
) {
  return finalizeInventoryFileImportReview(
    metadata,
    await validateInventoryFileImportRows(db, store, rows, metadata.mapping),
  );
}
