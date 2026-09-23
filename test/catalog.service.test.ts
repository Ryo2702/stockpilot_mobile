import { describe, expect, test } from "@jest/globals";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

import { DB_SCHEMA } from "../src/database/db_schema";
import { getProductStockStatus } from "../src/domain/product";
import {
  DuplicateBarcodeError,
  DuplicateSkuError,
  InvalidCatalogInputError,
  ProductNotFoundError,
} from "../src/domain/catalog.errors";
import {
  archiveProduct,
  createProduct,
  getProduct,
  listProducts,
  restoreProduct,
  updateProduct,
} from "../src/services/catalog";
import { createOwnerStore, createStoreForBusiness, type OwnerStoreDatabase } from "../src/services/owner-store.service";
import type { CreateProductInput, UpdateProductInput } from "../src/validation/product.validation";

function createDatabase() {
  const database = new DatabaseSync(":memory:");
  database.exec(DB_SCHEMA);
  const executor = {
    getFirstAsync: async <T>(source: string, ...params: SQLInputValue[]) =>
      (database.prepare(source).get(...params) as T | undefined) ?? null,
    getAllAsync: async <T>(source: string, ...params: SQLInputValue[]) =>
      database.prepare(source).all(...params) as T[],
    runAsync: async (source: string, ...params: SQLInputValue[]) => {
      database.prepare(source).run(...params);
    },
  };
  const transact = async (task: (tx: typeof executor) => Promise<void>) => {
    database.exec("BEGIN");
    try {
      await task(executor);
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }
  };
  const db = {
    ...executor,
    withTransactionAsync: (task: () => Promise<void>) => transact(() => task()),
    withExclusiveTransactionAsync: (task: (tx: typeof executor) => Promise<void>) => transact(task),
  };
  return { database, db };
}

const newProduct = (name: string, values: Partial<CreateProductInput> = {}): CreateProductInput => ({
  name,
  sku: undefined,
  barcode: undefined,
  category: "grocery",
  unit: "ea",
  initialQuantity: 0,
  reorderLevel: 0,
  criticalLevel: 0,
  notes: undefined,
  ...values,
});

describe("catalog product service", () => {
  test("creates a product, inventory row, and initial stock movement in one transaction", async () => {
    const { database, db } = createDatabase();
    try {
      const store = await createOwnerStore(db as unknown as OwnerStoreDatabase, "Maria", {
        name: "Grocery Store",
        storeType: "grocery",
      });
      const product = await createProduct(db as never, store, newProduct("Rice", { initialQuantity: 5 }));

      expect(product.quantity).toBe(5);
      expect(database.prepare("SELECT product_id, quantity FROM inventory").get()).toEqual({
        product_id: product.id,
        quantity: 5,
      });
      expect(database.prepare("SELECT product_id, delta, quantity_before, quantity_after, reason FROM stock_movements").get()).toEqual({
        product_id: product.id,
        delta: 5,
        quantity_before: 0,
        quantity_after: 5,
        reason: "initial",
      });
    } finally {
      database.close();
    }
  });

  test("allows global categories and rejects invalid input or duplicate SKU or barcode", async () => {
    const { database, db } = createDatabase();
    try {
      const store = await createOwnerStore(db as unknown as OwnerStoreDatabase, "Maria", {
        name: "Grocery Store",
        storeType: "grocery",
      });
      await expect(
        createProduct(db as never, store, newProduct("Negative Stock", { initialQuantity: -1 })),
      ).rejects.toBeInstanceOf(InvalidCatalogInputError);
      await expect(
        createProduct(db as never, store, newProduct("Phone", { category: "electronics" })),
      ).resolves.toMatchObject({ category: "electronics" });
      await createProduct(db as never, store, newProduct("Rice", { sku: "RICE-1", barcode: "0001" }));
      await expect(
        createProduct(db as never, store, newProduct("Rice Two", { sku: "rice-1" })),
      ).rejects.toBeInstanceOf(DuplicateSkuError);
      await expect(
        createProduct(db as never, store, newProduct("Rice Three", { barcode: "0001" })),
      ).rejects.toBeInstanceOf(DuplicateBarcodeError);
      expect(database.prepare("SELECT COUNT(*) AS count FROM products").get()).toEqual({ count: 2 });
    } finally {
      database.close();
    }
  });

  test("lists and reads products only within the selected store", async () => {
    const { database, db } = createDatabase();
    try {
      const firstStore = await createOwnerStore(db as unknown as OwnerStoreDatabase, "Maria", "Main Store");
      const secondStore = await createStoreForBusiness(
        db as unknown as OwnerStoreDatabase,
        firstStore.businessId,
        { name: "Branch Store", storeType: "grocery" },
      );
      const firstProduct = await createProduct(db as never, firstStore, newProduct("Alpha", { barcode: "123" }));
      const secondProduct = await createProduct(db as never, secondStore, newProduct("Beta", { barcode: "456" }));

      expect(await listProducts(db as never, firstStore, { search: "123" })).toEqual([
        expect.objectContaining({ id: firstProduct.id, storeId: firstStore.storeId }),
      ]);
      await expect(getProduct(db as never, firstStore, secondProduct.id)).rejects.toBeInstanceOf(ProductNotFoundError);
      await expect(
        updateProduct(db as never, firstStore, secondProduct.id, {
          name: "Wrong store",
          sku: undefined,
          barcode: undefined,
          category: "other",
          unit: "ea",
          reorderLevel: 0,
          criticalLevel: 0,
          notes: undefined,
        } satisfies UpdateProductInput),
      ).rejects.toBeInstanceOf(ProductNotFoundError);
      expect(database.prepare("SELECT COUNT(*) AS count FROM products WHERE store_id = ?").get(firstStore.storeId)).toEqual({ count: 1 });
    } finally {
      database.close();
    }
  });

  test("updates metadata without changing stock, and archive/restore keeps product history", async () => {
    const { database, db } = createDatabase();
    try {
      const store = await createOwnerStore(db as unknown as OwnerStoreDatabase, "Maria", {
        name: "Main Store",
        storeType: "grocery",
      });
      const product = await createProduct(db as never, store, newProduct("Rice", { initialQuantity: 7 }));
      const updated = await updateProduct(db as never, store, product.id, {
        name: "Jasmine Rice",
        sku: "RICE-7",
        barcode: "1234",
        category: "electronics",
        unit: "bag",
        reorderLevel: 10,
        criticalLevel: 2,
        notes: "Long grain",
      });

      expect(updated.category).toBe("electronics");
      expect((await getProduct(db as never, store, product.id)).quantity).toBe(7);
      await archiveProduct(db as never, store, product.id);
      expect(await listProducts(db as never, store)).toHaveLength(0);
      expect(await listProducts(db as never, store, { archived: true })).toEqual([
        expect.objectContaining({ id: product.id, isActive: false }),
      ]);
      expect(database.prepare("SELECT COUNT(*) AS count FROM stock_movements WHERE product_id = ?").get(product.id)).toEqual({ count: 1 });

      await restoreProduct(db as never, store, product.id);
      expect(await getProduct(db as never, store, product.id)).toEqual(
        expect.objectContaining({ id: product.id, quantity: 7, name: "Jasmine Rice" }),
      );
      expect(database.prepare("SELECT COUNT(*) AS count FROM stock_movements WHERE product_id = ?").get(product.id)).toEqual({ count: 1 });
    } finally {
      database.close();
    }
  });

  test("derives healthy, low, and critical stock status", () => {
    expect(getProductStockStatus(0, 5)).toBe("critical");
    expect(getProductStockStatus(2, 5)).toBe("low");
    expect(getProductStockStatus(6, 5)).toBe("healthy");
  });
});
