import { describe, expect, it, jest } from "@jest/globals";
import type { SQLiteDatabase } from "expo-sqlite";

import type { OwnerStore } from "@/services/owner-store.service";

import {
  analyzeInventoryImport,
  assertInventoryImportFileSize,
  getInventoryImportErrorMessage,
  importInventoryCsv,
  InventoryImportError,
  MAX_INVENTORY_IMPORT_FILE_BYTES,
} from "./inventory-import.service";

const destination = {
  businessId: "business-1",
  ownerName: "Owner",
  storeId: "branch-1",
  storeName: "Branch Store",
  storeType: "grocery",
} as OwnerStore;

const exportedCsv = [
  "store_name,name,sku,barcode,category,unit,notes,quantity,reorder_level,critical_level,current_price",
  '"Main Store","Rice 25kg","RC250","123456","grocery","kg","Stock note",3,20,5,89.95',
].join("\n");

function createDatabase(products: Array<Record<string, unknown>> = []) {
  const getFirstAsync = jest.fn(async (_sql: string, ..._values: unknown[]) => ({ id: destination.storeId }));
  const getAllAsync = jest.fn(async (_sql: string, ..._values: unknown[]) => products);
  const runAsync = jest.fn(async (_sql: string, ..._values: unknown[]) => ({ changes: 1 }));
  const executor = { getFirstAsync, getAllAsync, runAsync };
  const database = {
    ...executor,
    withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
    withExclusiveTransactionAsync: jest.fn(async (task: (tx: unknown) => Promise<void>) => task(executor)),
  } as unknown as SQLiteDatabase;
  return { database, runAsync };
}

describe("inventory CSV transfer", () => {
  it("shows validated import errors but hides technical exception details", () => {
    expect(getInventoryImportErrorMessage(new InventoryImportError("Row 2: quantity is invalid."), "Import failed.")).toBe("Row 2: quantity is invalid.");
    expect(getInventoryImportErrorMessage(new Error("SQLITE_CANTOPEN /private/app/data.db"), "Import failed.")).toBe("Import failed.");
    expect(new InventoryImportError(`Row 2:\n${"x".repeat(300)}`).message).toHaveLength(240);
    expect(new InventoryImportError("bad\u202einput").message).toBe("bad input");
  });

  it("previews and adds missing exported products to the selected store", async () => {
    const { database, runAsync } = createDatabase();
    const analysis = await analyzeInventoryImport(database, destination, exportedCsv, "main-store.csv");

    expect(analysis.destinationStoreName).toBe("Branch Store");
    expect(analysis.sourceStoreNames).toEqual(["Main Store"]);
    expect(analysis.newProductCount).toBe(1);
    expect(analysis.existingProductCount).toBe(0);
    expect(analysis.rows[0]).toMatchObject({
      productName: "Rice 25kg",
      sku: "RC250",
      unit: "kg",
      currentQuantity: 0,
      importedQuantity: 3,
      action: "new_product",
    });

    const result = await importInventoryCsv(
      database,
      destination,
      exportedCsv,
      "main-store.csv",
      undefined,
      { activeStoreOnly: true, expectedAnalysis: analysis },
    );

    expect(result.createdProductCount).toBe(1);
    expect(result.updatedProductCount).toBe(0);
    expect(runAsync).toHaveBeenCalledTimes(3);
    expect(runAsync.mock.calls[0]?.[0]).toContain("INSERT INTO products");
    expect(runAsync.mock.calls[0]?.[9]).toBe(89.95);
    expect(runAsync.mock.calls[1]?.[0]).toContain("INSERT INTO inventory");
    expect(runAsync.mock.calls[2]?.[0]).toContain("INSERT INTO stock_movements");
  });

  it("matches destination products by SKU and previews a stock-only update", async () => {
    const { database, runAsync } = createDatabase([{
      id: "branch-rice",
      name: "Branch Rice",
      sku: "RC250",
      barcode: "123456",
      category: "grocery",
      unit: "kg",
      isActive: 1,
      quantity: 10,
    }]);
    const analysis = await analyzeInventoryImport(database, destination, exportedCsv, "main-store.csv");

    expect(analysis.newProductCount).toBe(0);
    expect(analysis.existingProductCount).toBe(1);
    expect(analysis.rows[0]).toMatchObject({
      productName: "Branch Rice",
      sourceName: "Rice 25kg",
      currentQuantity: 10,
      importedQuantity: 3,
      action: "update_stock",
    });

    await importInventoryCsv(
      database,
      destination,
      exportedCsv,
      "main-store.csv",
      undefined,
      { activeStoreOnly: true, expectedAnalysis: analysis },
    );

    expect(runAsync).toHaveBeenCalledTimes(2);
    expect(runAsync.mock.calls[0]?.[0]).toContain("INSERT INTO inventory");
    expect(runAsync.mock.calls[1]?.[0]).toContain("INSERT INTO stock_movements");
  });

  it("does not import against a destination quantity changed after review", async () => {
    const product = {
      id: "branch-rice",
      name: "Rice 25kg",
      sku: "RC250",
      barcode: "123456",
      category: "grocery",
      unit: "kg",
      isActive: 1,
      quantity: 10,
    };
    const { database, runAsync } = createDatabase([product]);
    const analysis = await analyzeInventoryImport(database, destination, exportedCsv, "main-store.csv");
    product.quantity = 12;

    await expect(importInventoryCsv(
      database,
      destination,
      exportedCsv,
      "main-store.csv",
      undefined,
      { activeStoreOnly: true, expectedAnalysis: analysis },
    )).rejects.toThrow("Inventory changed after review");
    expect(runAsync).not.toHaveBeenCalled();
  });

  it("rejects a negative current price during analysis", async () => {
    const { database } = createDatabase();
    const csv = exportedCsv.replace(",89.95", ",-1");

    await expect(analyzeInventoryImport(database, destination, csv, "main-store.csv"))
      .rejects.toThrow("current_price must be a valid amount of 0 or more");
  });

  it("rejects files whose size cannot be verified or exceeds the import limit", () => {
    expect(() => assertInventoryImportFileSize(undefined)).toThrow("couldn't be verified");
    expect(() => assertInventoryImportFileSize(MAX_INVENTORY_IMPORT_FILE_BYTES + 1)).toThrow("5 MB or smaller");
    expect(() => assertInventoryImportFileSize(MAX_INVENTORY_IMPORT_FILE_BYTES)).not.toThrow();
  });

  it("rejects oversized, too many-row, too many-column, and oversized-field CSV data", async () => {
    const { database } = createDatabase();
    const header = "name,quantity";
    const tooManyRows = [header, ...Array.from({ length: 10_001 }, (_, index) => `Item ${index},1`)].join("\n");

    await expect(analyzeInventoryImport(
      database,
      destination,
      "x".repeat(MAX_INVENTORY_IMPORT_FILE_BYTES + 1),
      "large.csv",
    )).rejects.toThrow("5 MB or smaller");
    await expect(analyzeInventoryImport(database, destination, tooManyRows, "rows.csv"))
      .rejects.toThrow("no more than 10,000 rows");
    await expect(analyzeInventoryImport(database, destination, "name,quantity,extra\nItem,1,x", "columns.csv"))
      .rejects.toThrow("unsupported column");
    await expect(analyzeInventoryImport(database, destination, `${header}\n${"a".repeat(4_097)},1`, "field.csv"))
      .rejects.toThrow("4096 characters or fewer");
  });
});
