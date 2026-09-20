import type {
  Product,
  ProductSort,
  ProductStockMovement,
} from "@/domain/product";
import { ProductNotFoundError } from "@/features/catalogs/errors/catalog.errors";
import type { OwnerStore } from "../owner-store.service";
import type { CatalogExecutor, ProductQuery } from "./types";

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
       products.current_price AS currentPrice,
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
       products.current_price AS currentPrice,
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
