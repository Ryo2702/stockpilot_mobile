import type { SQLiteDatabase } from "expo-sqlite";
import { Platform } from "react-native";

import { findProductsByCode, getProduct, listProducts } from "@/services/catalog";
import { deductInventoryForSale, type InventoryTransactionExecutor } from "@/services/inventory";
import type { CatalogCategory } from "@/domain/catalog";
import type { PosProduct, PosTransaction, PosTransactionSummary } from "@/domain/pos";
import { InsufficientStockError } from "@/domain/inventory.errors";
import {
  EmptyCartError,
  InvalidCartError,
  PosProductNotFoundError,
  PosTransactionNotFoundError,
  ProductPriceMissingError,
} from "@/domain/pos.errors";
import type { StoreScope } from "@/domain/store";
import createId from "@/utils/createId";

type PosExecutor = Pick<SQLiteDatabase, "getAllAsync" | "getFirstAsync" | "runAsync">;
type PosDatabase = PosExecutor & Pick<SQLiteDatabase, "withTransactionAsync"> &
  Partial<Pick<SQLiteDatabase, "withExclusiveTransactionAsync">>;

type PosTransactionInput = {
  productId: string;
  quantity: number;
};

type StoreRow = {
  businessName: string;
  storeName: string;
  currencyMode: "iso" | "custom";
  currencyCode: string | null;
  customCurrencySymbol: string | null;
  currencyDecimalPlaces: number;
  addressLine1: string | null;
  addressLine2: string | null;
  barangay: string | null;
  city: string | null;
  provinceState: string | null;
  postalCode: string | null;
  countryCode: string | null;
};

type PosProductRow = {
  id: string;
  name: string;
  sku: string | null;
  costPrice: number | null;
  currentPrice: number | null;
  quantity: number;
};

export const POS_PAGE_SIZE = 50;

function roundMoney(value: number, decimalPlaces: number) {
  const factor = 10 ** decimalPlaces;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function decimalPlaces(value: number) {
  return Math.min(4, Math.max(0, Number.isInteger(value) ? value : 2));
}

async function withPosTransaction<T>(db: PosDatabase, task: (tx: PosExecutor) => Promise<T>) {
  let result!: T;
  if (Platform.OS !== "web" && db.withExclusiveTransactionAsync) {
    await db.withExclusiveTransactionAsync(async (tx) => {
      result = await task(tx);
    });
  } else {
    await db.withTransactionAsync(async () => {
      result = await task(db);
    });
  }
  return result;
}

async function getCostPrices(db: PosExecutor, store: StoreScope, productIds: string[]) {
  if (!productIds.length) return new Map<string, number | null>();
  const placeholders = productIds.map(() => "?").join(",");
  const rows = await db.getAllAsync<{ id: string; costPrice: number | null }>(
    `SELECT id, cost_price AS costPrice FROM products
     WHERE business_id = ? AND store_id = ? AND id IN (${placeholders})`,
    store.businessId,
    store.storeId,
    ...productIds,
  );
  return new Map(rows.map((row) => [row.id, row.costPrice]));
}

function toPosProduct(product: Awaited<ReturnType<typeof getProduct>>, costPrice: number | null): PosProduct {
  return { ...product, costPrice };
}

export async function listPosProducts(
  db: PosExecutor,
  store: StoreScope,
  query: { search?: string; category?: CatalogCategory | null; limit?: number; offset?: number } = {},
) {
  const products = await listProducts(db, store, {
    search: query.search,
    category: query.category,
    sort: "name_asc",
    limit: query.limit ?? POS_PAGE_SIZE,
    offset: query.offset,
  });
  const costPrices = await getCostPrices(db, store, products.map(({ id }) => id));
  return products.map((product) => toPosProduct(product, costPrices.get(product.id) ?? null));
}

export async function findPosProductByCode(db: PosExecutor, store: StoreScope, code: string) {
  const matches = await findProductsByCode(db, store, code.trim());
  const activeMatches = matches.filter((product) => product.isActive);
  if (activeMatches.length !== 1) return null;
  const product = await getProduct(db, store, activeMatches[0].id);
  const costPrices = await getCostPrices(db, store, [product.id]);
  return toPosProduct(product, costPrices.get(product.id) ?? null);
}

async function getStoreRow(db: PosExecutor, store: StoreScope) {
  return db.getFirstAsync<StoreRow>(
    `SELECT
       businesses.name AS businessName,
       stores.name AS storeName,
       stores.currency_mode AS currencyMode,
       stores.currency_code AS currencyCode,
       stores.custom_currency_symbol AS customCurrencySymbol,
       stores.currency_decimal_places AS currencyDecimalPlaces,
       stores.address_line_1 AS addressLine1,
       stores.address_line_2 AS addressLine2,
       stores.barangay,
       stores.city,
       stores.province_state AS provinceState,
       stores.postal_code AS postalCode,
       stores.country_code AS countryCode
     FROM stores
     INNER JOIN businesses ON businesses.id = stores.business_id
     WHERE stores.id = ? AND stores.business_id = ? AND stores.status = 'active'
     LIMIT 1`,
    store.storeId,
    store.businessId,
  );
}

function formatAddress(row: StoreRow) {
  const value = [
    row.addressLine1,
    row.addressLine2,
    row.barangay,
    row.city,
    row.provinceState,
    row.postalCode,
    row.countryCode,
  ].filter(Boolean).join(", ");
  return value || null;
}

async function nextReceiptNumber(db: PosExecutor, store: StoreScope, now: string) {
  const count = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM pos_transactions WHERE business_id = ? AND store_id = ?",
    store.businessId,
    store.storeId,
  );
  return `POS-${now.slice(0, 10).replaceAll("-", "")}-${String((count?.count ?? 0) + 1).padStart(4, "0")}`;
}

export async function checkoutPosTransaction(
  db: PosDatabase,
  store: StoreScope,
  input: PosTransactionInput[],
) {
  if (!input.length) throw new EmptyCartError();
  if (input.some(({ productId, quantity }) => !productId || !Number.isSafeInteger(quantity) || quantity <= 0)) {
    throw new InvalidCartError();
  }

  const quantities = new Map<string, number>();
  for (const item of input) quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  const transactionId = createId("pos");

  return withPosTransaction(db, async (tx) => {
    const storeRow = await getStoreRow(tx, store);
    if (!storeRow) throw new PosProductNotFoundError();
    const digits = decimalPlaces(storeRow.currencyDecimalPlaces);
    const now = new Date().toISOString();
    const snapshots: Array<PosProductRow & { quantityRequested: number; unitPrice: number; lineTotal: number }> = [];

    for (const [productId, quantityRequested] of quantities) {
      const product = await tx.getFirstAsync<PosProductRow>(
        `SELECT
           products.id,
           products.name,
           products.sku,
           products.cost_price AS costPrice,
           products.current_price AS currentPrice,
           COALESCE(inventory.quantity, 0) AS quantity
         FROM products
         LEFT JOIN inventory
           ON inventory.product_id = products.id
          AND inventory.business_id = products.business_id
          AND inventory.store_id = products.store_id
         WHERE products.id = ? AND products.business_id = ? AND products.store_id = ?
           AND products.is_active = 1
         LIMIT 1`,
        productId,
        store.businessId,
        store.storeId,
      );
      if (!product) throw new PosProductNotFoundError();
      if (product.currentPrice === null) throw new ProductPriceMissingError();
      if (quantityRequested > product.quantity) throw new InsufficientStockError(product.quantity);
      const unitPrice = roundMoney(product.currentPrice, digits);
      snapshots.push({
        ...product,
        quantityRequested,
        unitPrice,
        lineTotal: roundMoney(unitPrice * quantityRequested, digits),
      });
    }

    const subtotal = roundMoney(snapshots.reduce((total, item) => total + item.lineTotal, 0), digits);
    const receiptNumber = await nextReceiptNumber(tx, store, now);
    await tx.runAsync(
      `INSERT INTO pos_transactions (
        id, business_id, store_id, receipt_number, subtotal, total, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      transactionId,
      store.businessId,
      store.storeId,
      receiptNumber,
      subtotal,
      subtotal,
      now,
      now,
    );

    for (const item of snapshots) {
      await deductInventoryForSale(
        tx as InventoryTransactionExecutor,
        store,
        item.id,
        item.quantityRequested,
        transactionId,
        now,
      );
      await tx.runAsync(
        `INSERT INTO pos_transaction_items (
          id, transaction_id, product_id, quantity, unit_cost, unit_price, line_total, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        createId("pos-item"),
        transactionId,
        item.id,
        item.quantityRequested,
        item.costPrice === null ? null : roundMoney(item.costPrice, digits),
        item.unitPrice,
        item.lineTotal,
        now,
      );
    }

    return getPosTransaction(tx, store, transactionId);
  });
}

export async function getPosTransaction(db: PosExecutor, store: StoreScope, transactionId: string): Promise<PosTransaction> {
  const row = await db.getFirstAsync<StoreRow & {
    id: string;
    receiptNumber: string;
    subtotal: number;
    total: number;
    createdAt: string;
  }>(
    `SELECT
       transactions.id,
       businesses.name AS businessName,
       stores.name AS storeName,
       stores.currency_mode AS currencyMode,
       stores.currency_code AS currencyCode,
       stores.custom_currency_symbol AS customCurrencySymbol,
       stores.currency_decimal_places AS currencyDecimalPlaces,
       stores.address_line_1 AS addressLine1,
       stores.address_line_2 AS addressLine2,
       stores.barangay,
       stores.city,
       stores.province_state AS provinceState,
       stores.postal_code AS postalCode,
       stores.country_code AS countryCode,
       transactions.receipt_number AS receiptNumber,
       transactions.subtotal,
       transactions.total,
       transactions.created_at AS createdAt
     FROM pos_transactions AS transactions
     INNER JOIN businesses ON businesses.id = transactions.business_id
     INNER JOIN stores ON stores.id = transactions.store_id AND stores.business_id = transactions.business_id
     WHERE transactions.id = ? AND transactions.business_id = ? AND transactions.store_id = ?
     LIMIT 1`,
    transactionId,
    store.businessId,
    store.storeId,
  );
  if (!row) throw new PosTransactionNotFoundError();

  const items = await db.getAllAsync<{
    id: string;
    productId: string;
    productName: string;
    sku: string | null;
    quantity: number;
    unitCost: number | null;
    unitPrice: number;
    lineTotal: number;
  }>(
    `SELECT
       items.id,
       items.product_id AS productId,
       products.name AS productName,
       products.sku,
       items.quantity,
       items.unit_cost AS unitCost,
       items.unit_price AS unitPrice,
       items.line_total AS lineTotal
     FROM pos_transaction_items AS items
     INNER JOIN products
       ON products.id = items.product_id
      AND products.business_id = ?
      AND products.store_id = ?
     WHERE items.transaction_id = ?
     ORDER BY items.created_at ASC, items.id ASC`,
    store.businessId,
    store.storeId,
    transactionId,
  );

  return {
    id: row.id,
    businessName: row.businessName,
    storeName: row.storeName,
    storeAddress: formatAddress(row),
    receiptNumber: row.receiptNumber,
    subtotal: row.subtotal,
    total: row.total,
    createdAt: row.createdAt,
    currency: {
      currencyMode: row.currencyMode,
      currencyCode: row.currencyCode,
      customCurrencySymbol: row.customCurrencySymbol,
      currencyDecimalPlaces: decimalPlaces(row.currencyDecimalPlaces),
    },
    items,
  };
}

export async function listPosTransactions(
  db: PosExecutor,
  store: StoreScope,
  limit = 50,
  offset = 0,
): Promise<PosTransactionSummary[]> {
  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  const safeOffset = Math.max(0, Math.trunc(offset));
  return db.getAllAsync<PosTransactionSummary>(
    `SELECT
       transactions.id,
       transactions.receipt_number AS receiptNumber,
       transactions.subtotal,
       transactions.total,
       transactions.created_at AS createdAt,
       COUNT(items.id) AS itemCount,
       COALESCE(SUM(items.quantity), 0) AS totalItems
     FROM pos_transactions AS transactions
     LEFT JOIN pos_transaction_items AS items ON items.transaction_id = transactions.id
     WHERE transactions.business_id = ? AND transactions.store_id = ?
     GROUP BY transactions.id
     ORDER BY transactions.created_at DESC, transactions.id DESC
     LIMIT ? OFFSET ?`,
    store.businessId,
    store.storeId,
    safeLimit,
    safeOffset,
  );
}
