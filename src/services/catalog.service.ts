import { Platform } from "react-native";
import type { SQLiteDatabase } from "expo-sqlite";

import { getCatalogCategoryValues, type CatalogCategory } from "@/domain/catalog";
import {
  type Product,
  type ProductSort,
  type ProductStockFilter,
  type ProductStockMovement,
} from "@/domain/product";
import {
  DuplicateBarcodeError,
  DuplicateSkuError,
  InvalidCatalogInputError,
  InvalidCategoryForStoreError,
  ProductNotFoundError,
  StoreNotFoundError,
} from "@/features/catalogs/errors/catalog.errors";
import {
  createProductSchema,
  updateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from "@/validation/product.validation";
import type { StoreType } from "@/validation/store.validation";

import type { OwnerStore } from "./owner-store.service";

type CatalogExecutor = Pick<SQLiteDatabase, "getAllAsync" | "getFirstAsync" | "runAsync">;
type CatalogDatabase = CatalogExecutor &
  Pick<SQLiteDatabase, "withTransactionAsync" | "withExclusiveTransactionAsync">;

export type ProductQuery = {
  search?: string;
  category?: CatalogCategory | null;
  stockStatus?: ProductStockFilter;
  sort?: ProductSort;
  archived?: boolean;
  limit?: number;
  offset?: number;
};

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
  if (Platform.OS !== "web" && db.withExclusiveTransactionAsync) {
    await db.withExclusiveTransactionAsync((tx) => task(tx));
  } else {
    await db.withTransactionAsync(() => task(db));
  }
}

async function getStoreType(db: CatalogExecutor, store: OwnerStore): Promise<StoreType> {
  const result = await db.getFirstAsync<{ storeType: StoreType }>(
    "SELECT store_type AS storeType FROM stores WHERE id = ? AND business_id = ?",
    store.storeId,
    store.businessId,
  );
  if (!result) throw new StoreNotFoundError();
  return result.storeType;
}

function assertCategory(category: CatalogCategory, storeType: StoreType) {
  if (!getCatalogCategoryValues(storeType).includes(category)) {
    throw new InvalidCategoryForStoreError();
  }
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

function mapProduct(row: Product) {
  return { ...row, isActive: Boolean(row.isActive) };
}

export async function listProducts(
  db: CatalogExecutor,
  store: OwnerStore,
  query: ProductQuery = {},
) {
  const conditions = [
    "products.business_id = ?",
    "products.store_id = ?",
    "products.is_active = ?",
  ];
  const parameters: Array<string | number> = [
    store.businessId,
    store.storeId,
    query.archived ? 0 : 1,
  ];
  const search = query.search?.trim();

  if (search) {
    conditions.push(`(
      products.name LIKE ? COLLATE NOCASE OR
      COALESCE(products.sku, '') LIKE ? COLLATE NOCASE OR
      COALESCE(products.barcode, '') LIKE ? COLLATE NOCASE OR
      products.category LIKE ? COLLATE NOCASE
    )`);
    const value = `%${search}%`;
    parameters.push(value, value, value, value);
  }
  if (query.category) {
    conditions.push("products.category = ?");
    parameters.push(query.category);
  }

  const quantity = "COALESCE(inventory.quantity, 0)";
  if (query.stockStatus === "critical") conditions.push(`${quantity} <= 0`);
  if (query.stockStatus === "low") {
    conditions.push(`${quantity} > 0 AND ${quantity} <= products.reorder_level`);
  }
  if (query.stockStatus === "healthy") {
    conditions.push(`${quantity} > products.reorder_level`);
  }

  const orderBy: Record<ProductSort, string> = {
    name_asc: "products.name COLLATE NOCASE ASC, products.id ASC",
    name_desc: "products.name COLLATE NOCASE DESC, products.id ASC",
    stock_asc: `${quantity} ASC, products.name COLLATE NOCASE ASC`,
    stock_desc: `${quantity} DESC, products.name COLLATE NOCASE ASC`,
    updated_desc: "products.updated_at DESC, products.id ASC",
  };
  const sort = query.sort ?? "name_asc";
  const limit = Math.min(100, Math.max(1, Math.floor(query.limit ?? 50)));
  const offset = Math.max(0, Math.floor(query.offset ?? 0));

  const rows = await db.getAllAsync<Product>(
    `SELECT
       products.id,
       products.business_id AS businessId,
       products.store_id AS storeId,
       products.name,
       products.sku,
       products.barcode,
       products.category,
       products.unit,
       products.reorder_level AS reorderLevel,
       products.critical_level AS criticalLevel,
       products.notes,
       ${quantity} AS quantity,
       products.is_active AS isActive,
       products.created_at AS createdAt,
       products.updated_at AS updatedAt
     FROM products
     LEFT JOIN inventory
       ON inventory.product_id = products.id
      AND inventory.business_id = products.business_id
      AND inventory.store_id = products.store_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY ${orderBy[sort]}
     LIMIT ? OFFSET ?`,
    ...parameters,
    limit,
    offset,
  );
  return rows.map(mapProduct);
}

export async function getProduct(db: CatalogExecutor, store: OwnerStore, productId: string) {
  const product = await db.getFirstAsync<Product>(
    `SELECT
       products.id,
       products.business_id AS businessId,
       products.store_id AS storeId,
       products.name,
       products.sku,
       products.barcode,
       products.category,
       products.unit,
       products.reorder_level AS reorderLevel,
       products.critical_level AS criticalLevel,
       products.notes,
       COALESCE(inventory.quantity, 0) AS quantity,
       products.is_active AS isActive,
       products.created_at AS createdAt,
       products.updated_at AS updatedAt
     FROM products
     LEFT JOIN inventory
       ON inventory.product_id = products.id
      AND inventory.business_id = products.business_id
      AND inventory.store_id = products.store_id
     WHERE products.id = ?
       AND products.business_id = ?
       AND products.store_id = ?
       AND products.is_active = 1
     LIMIT 1`,
    productId,
    store.businessId,
    store.storeId,
  );
  if (!product) throw new ProductNotFoundError();
  return mapProduct(product);
}

export async function getProductStockMovements(
  db: CatalogExecutor,
  store: OwnerStore,
  productId: string,
  limit = 10,
) {
  const product = await db.getFirstAsync<{ id: string }>(
    "SELECT id FROM products WHERE id = ? AND business_id = ? AND store_id = ?",
    productId,
    store.businessId,
    store.storeId,
  );
  if (!product) throw new ProductNotFoundError();
  return db.getAllAsync<ProductStockMovement>(
    `SELECT
       id,
       delta,
       quantity_before AS quantityBefore,
       quantity_after AS quantityAfter,
       reason,
       note,
       created_at AS createdAt
     FROM stock_movements
     WHERE business_id = ? AND store_id = ? AND product_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT ?`,
    store.businessId,
    store.storeId,
    productId,
    Math.min(50, Math.max(1, Math.floor(limit))),
  );
}

export async function createProduct(
  db: CatalogDatabase,
  store: OwnerStore,
  input: CreateProductInput,
) {
  const parsed = createProductSchema.safeParse(input);
  if (!parsed.success) {
    throw new InvalidCatalogInputError(parsed.error.issues[0]?.message ?? "Check the product details.");
  }
  const product = parsed.data;
  const id = createId("product");
  const now = new Date().toISOString();

  await withProductTransaction(db, async (tx) => {
    const storeType = await getStoreType(tx, store);
    assertCategory(product.category, storeType);
    await assertUniqueSku(tx, store, product.sku);
    await assertUniqueBarcode(tx, store, product.barcode);
    await tx.runAsync(
      `INSERT INTO products (
        id, business_id, store_id, name, sku, barcode, category, unit,
        reorder_level, critical_level, notes, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      id,
      store.businessId,
      store.storeId,
      product.name,
      product.sku ?? null,
      product.barcode ?? null,
      product.category,
      product.unit,
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
          id, business_id, store_id, product_id, delta, quantity_before,
          quantity_after, reason, note, created_at
        ) VALUES (?, ?, ?, ?, ?, 0, ?, 'initial', NULL, ?)`,
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
    throw new InvalidCatalogInputError(parsed.error.issues[0]?.message ?? "Check the product details.");
  }
  const product = parsed.data;
  const now = new Date().toISOString();

  await withProductTransaction(db, async (tx) => {
    const storeType = await getStoreType(tx, store);
    assertCategory(product.category, storeType);
    const existing = await tx.getFirstAsync<{ id: string }>(
      `SELECT id FROM products
       WHERE id = ? AND business_id = ? AND store_id = ? AND is_active = 1`,
      productId,
      store.businessId,
      store.storeId,
    );
    if (!existing) throw new ProductNotFoundError();
    await assertUniqueSku(tx, store, product.sku, productId);
    await assertUniqueBarcode(tx, store, product.barcode, productId);
    await tx.runAsync(
      `UPDATE products
       SET name = ?, sku = ?, barcode = ?, category = ?, unit = ?, reorder_level = ?,
           critical_level = ?, notes = ?, updated_at = ?
       WHERE id = ? AND business_id = ? AND store_id = ? AND is_active = 1`,
      product.name,
      product.sku ?? null,
      product.barcode ?? null,
      product.category,
      product.unit,
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
    await getStoreType(tx, store);
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
    await getStoreType(tx, store);
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
