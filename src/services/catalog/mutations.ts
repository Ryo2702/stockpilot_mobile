import type { Product } from "@/domain/product";
import {
  DuplicateBarcodeError,
  DuplicateSkuError,
  InvalidCatalogInputError,
  ProductNotFoundError,
  StoreNotFoundError,
} from "@/features/catalogs/errors/catalog.errors";
import {
  createProductSchema,
  updateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from "@/validation/product.validation";
import type { OwnerStore } from "../owner-store.service";
import { getProduct } from "./queries";
import type { CatalogDatabase, CatalogExecutor } from "./types";

function createId(prefix: string) {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
}

async function withProductTransaction(
  db: CatalogDatabase,
  task: (tx: CatalogExecutor) => Promise<void>,
) {
  // ponytail: SQLCipher keys this connection; add a serialized writer if concurrent writes become a problem.
  await db.withTransactionAsync(() => task(db));
}

async function assertStoreExists(db: CatalogExecutor, store: OwnerStore) {
  const result = await db.getFirstAsync<{ id: string }>(
    "SELECT id FROM stores WHERE id = ? AND business_id = ?",
    store.storeId,
    store.businessId,
  );
  if (!result) throw new StoreNotFoundError();
}

async function assertUniqueSku(
  db: CatalogExecutor,
  store: OwnerStore,
  sku: string | undefined,
  productId = "",
) {
  if (!sku) return;
  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM products
     WHERE business_id = ? AND store_id = ? AND sku = ? COLLATE NOCASE AND id <> ?`,
    store.businessId,
    store.storeId,
    sku,
    productId,
  );
  if (existing) throw new DuplicateSkuError();
}

async function assertUniqueBarcode(
  db: CatalogExecutor,
  store: OwnerStore,
  barcode: string | undefined,
  productId = "",
) {
  if (!barcode) return;
  const existing = await db.getFirstAsync<{ id: string }>(
    `SELECT id FROM products
     WHERE business_id = ? AND store_id = ? AND barcode = ? COLLATE NOCASE AND id <> ?`,
    store.businessId,
    store.storeId,
    barcode,
    productId,
  );
  if (existing) throw new DuplicateBarcodeError();
}

export async function createProduct(
  db: CatalogDatabase,
  store: OwnerStore,
  input: CreateProductInput,
) {
  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    throw new InvalidCatalogInputError(parsed.error.issues[0]?.message ?? "Check the item details.");
  }
  const product = parsed.data;
  const id = createId("product");
  const now = new Date().toISOString();

  await withProductTransaction(db, async (tx) => {
    await assertStoreExists(tx, store);
    await assertUniqueSku(tx, store, product.sku);
    await assertUniqueBarcode(tx, store, product.barcode);
    await tx.runAsync(
      `INSERT INTO products (
        id, business_id, store_id, name, sku, barcode, category, unit, current_price,
        reorder_level, critical_level, notes, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      id,
      store.businessId,
      store.storeId,
      product.name,
      product.sku ?? null,
      product.barcode ?? null,
      product.category,
      product.unit,
      product.currentPrice ?? null,
      product.reorderLevel,
      product.criticalLevel,
      product.notes ?? null,
      now,
      now,
    );
    await tx.runAsync(
      `INSERT INTO inventory (product_id, business_id, store_id, quantity, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      id,
      store.businessId,
      store.storeId,
      product.initialQuantity,
      now,
    );
    if (product.initialQuantity > 0) {
      await tx.runAsync(
        `INSERT INTO stock_movements (
          id, business_id, store_id, product_id, movement_type, delta, quantity_before,
          quantity_after, reason, reference, note, created_at
        ) VALUES (?, ?, ?, ?, 'stock_in', ?, 0, ?, 'initial', NULL, NULL, ?)`,
        createId("movement"),
        store.businessId,
        store.storeId,
        id,
        product.initialQuantity,
        product.initialQuantity,
        now,
      );
    }
  });

  return {
    id,
    businessId: store.businessId,
    storeId: store.storeId,
    name: product.name,
    sku: product.sku ?? null,
    barcode: product.barcode ?? null,
    category: product.category,
    unit: product.unit,
    currentPrice: product.currentPrice ?? null,
    reorderLevel: product.reorderLevel,
    criticalLevel: product.criticalLevel,
    notes: product.notes ?? null,
    quantity: product.initialQuantity,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  } satisfies Product;
}

export async function updateProduct(
  db: CatalogDatabase,
  store: OwnerStore,
  productId: string,
  input: UpdateProductInput,
) {
  const parsed = updateProductSchema.safeParse(input);
  if (!parsed.success) {
    throw new InvalidCatalogInputError(parsed.error.issues[0]?.message ?? "Check the item details.");
  }
  const product = parsed.data;
  const now = new Date().toISOString();

  await withProductTransaction(db, async (tx) => {
    await assertStoreExists(tx, store);
    const existing = await tx.getFirstAsync<{ id: string; currentPrice: number | null }>(
      `SELECT id, current_price AS currentPrice FROM products
       WHERE id = ? AND business_id = ? AND store_id = ? AND is_active = 1`,
      productId,
      store.businessId,
      store.storeId,
    );
    if (!existing) throw new ProductNotFoundError();
    const currentPrice = product.currentPrice === undefined
      ? existing.currentPrice
      : product.currentPrice;
    await assertUniqueSku(tx, store, product.sku, productId);
    await assertUniqueBarcode(tx, store, product.barcode, productId);
    await tx.runAsync(
      `UPDATE products
       SET name = ?, sku = ?, barcode = ?, category = ?, unit = ?, current_price = ?, reorder_level = ?,
           critical_level = ?, notes = ?, updated_at = ?
       WHERE id = ? AND business_id = ? AND store_id = ? AND is_active = 1`,
      product.name,
      product.sku ?? null,
      product.barcode ?? null,
      product.category,
      product.unit,
      currentPrice,
      product.reorderLevel,
      product.criticalLevel,
      product.notes ?? null,
      now,
      productId,
      store.businessId,
      store.storeId,
    );
  });

  return getProduct(db, store, productId);
}

export async function archiveProduct(db: CatalogDatabase, store: OwnerStore, productId: string) {
  await withProductTransaction(db, async (tx) => {
    await assertStoreExists(tx, store);
    const existing = await tx.getFirstAsync<{ id: string }>(
      `SELECT id FROM products
       WHERE id = ? AND business_id = ? AND store_id = ? AND is_active = 1`,
      productId,
      store.businessId,
      store.storeId,
    );
    if (!existing) throw new ProductNotFoundError();
    await tx.runAsync(
      `UPDATE products SET is_active = 0, updated_at = ?
       WHERE id = ? AND business_id = ? AND store_id = ? AND is_active = 1`,
      new Date().toISOString(),
      productId,
      store.businessId,
      store.storeId,
    );
  });
}

export async function restoreProduct(db: CatalogDatabase, store: OwnerStore, productId: string) {
  await withProductTransaction(db, async (tx) => {
    await assertStoreExists(tx, store);
    const existing = await tx.getFirstAsync<{ id: string }>(
      `SELECT id FROM products
       WHERE id = ? AND business_id = ? AND store_id = ? AND is_active = 0`,
      productId,
      store.businessId,
      store.storeId,
    );
    if (!existing) throw new ProductNotFoundError();
    await tx.runAsync(
      `UPDATE products SET is_active = 1, updated_at = ?
       WHERE id = ? AND business_id = ? AND store_id = ? AND is_active = 0`,
      new Date().toISOString(),
      productId,
      store.businessId,
      store.storeId,
    );
  });
}
