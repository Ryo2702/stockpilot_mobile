import { describe, expect, it, jest } from "@jest/globals";
import type { SQLiteDatabase } from "expo-sqlite";
import { strToU8, zipSync } from "fflate";
import * as XLSX from "xlsx";

import type { OwnerStore } from "@/services/owner-store.service";

import {
  commitInventoryFileImport,
  prepareInventoryFileImport,
  reviewInventoryFileImportRows,
} from "./inventory-file-import.service";

const store = {
  businessId: "business-1",
  ownerName: "Owner",
  storeId: "store-1",
  storeName: "Main Store",
  storeType: "grocery",
} as OwnerStore;

function createDatabase(products: Array<Record<string, unknown>> = []) {
  const getFirstAsync = jest.fn(async (_sql: string, ..._values: unknown[]) => ({ id: store.storeId }));
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

describe("inventory file import", () => {
  it("reads XLSX, XLS, and DOCX inventory rows before any write", async () => {
    const { database, runAsync } = createDatabase();
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ["Item Name", "Qty", "Purchase Price", "Retail"],
      ["Rice 25kg", 8, 1100, 1250],
    ]), "Inventory");
    const spreadsheet = await prepareInventoryFileImport(database, store, {
      fileName: "stock.xlsx",
      fileSize: 0,
      content: new Uint8Array(XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer),
    });
    const legacySpreadsheet = await prepareInventoryFileImport(database, store, {
      fileName: "stock.xls",
      fileSize: 0,
      content: new Uint8Array(XLSX.write(workbook, { type: "array", bookType: "xls" }) as ArrayBuffer),
    });
    const document = await prepareInventoryFileImport(database, store, {
      fileName: "stock.docx",
      fileSize: 0,
      content: zipSync({
        "word/document.xml": strToU8("<w:document><w:body><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Product Name</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Quantity</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Cost Price</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Selling Price</w:t></w:r></w:p></w:tc></w:tr><w:tr><w:tc><w:p><w:r><w:t>Coke 1.5L</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>20</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>55.00</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>70.00</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>"),
      }),
    });

    expect(spreadsheet.rows[0]).toMatchObject({ name: "Rice 25kg", quantity: "8", status: "ready" });
    expect(legacySpreadsheet.rows[0]).toMatchObject({ name: "Rice 25kg", quantity: "8", status: "ready" });
    expect(document.rows[0]).toMatchObject({ name: "Coke 1.5L", quantity: "20", status: "ready" });
    expect(runAsync).not.toHaveBeenCalled();
  });

  it("finds inventory after a cover sheet and title rows in a regular Excel workbook", async () => {
    const { database, runAsync } = createDatabase();
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ["ACME Supplier Catalogue"],
      ["March 2026"],
    ]), "Cover");
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([
      ["ACME Supplier Catalogue"],
      ["Prepared for StockPilot"],
      ["Product Name", "Quantity", "Retail Price", "Item Code"],
      ["Rice 25kg", 8, 1250, "RICE-25"],
    ]), "Products");

    const review = await prepareInventoryFileImport(database, store, {
      fileName: "supplier.xlsx",
      fileSize: 0,
      content: new Uint8Array(XLSX.write(workbook, { type: "array", bookType: "xlsx", compression: true }) as ArrayBuffer),
    });

    expect(review.rows).toHaveLength(1);
    expect(review.rows[0]).toMatchObject({
      name: "Rice 25kg",
      quantity: "8",
      sellingPrice: "1250",
      sku: "RICE-25",
      status: "ready",
    });
    expect(runAsync).not.toHaveBeenCalled();
  });

  it("previews recognizable TXT rows without writing products", async () => {
    const { database, runAsync } = createDatabase();
    const review = await prepareInventoryFileImport(database, store, {
      fileName: "inventory.txt",
      fileSize: 74,
      content: "Coke 1.5L | 20 | 55.00 | 70.00\nSprite 1.5L | 12 | 54.00 | 68.00",
    });

    expect(review.rows).toHaveLength(2);
    expect(review.rows[0]).toMatchObject({
      name: "Coke 1.5L",
      quantity: "20",
      costPrice: "55.00",
      sellingPrice: "70.00",
      status: "ready",
      canImport: true,
    });
    expect(runAsync).not.toHaveBeenCalled();
  });

  it("rejects files without recognizable product and quantity columns", async () => {
    const { database } = createDatabase();
    await expect(prepareInventoryFileImport(database, store, {
      fileName: "supplier.csv",
      fileSize: 42,
      content: "Item,Amount,Retail\nRice 25kg,8,1250",
    })).rejects.toThrow("Product Name and Quantity columns are required");
  });

  it("requires an explicit approval before an exact existing-product stock update", async () => {
    const { database, runAsync } = createDatabase([{
      id: "coke-1",
      name: "Coca-Cola 1.5L",
      sku: "COKE-15",
      barcode: "4801234567890",
      quantity: 8,
      isActive: 1,
    }]);
    const review = await prepareInventoryFileImport(database, store, {
      fileName: "inventory.csv",
      fileSize: 100,
      content: "Product Name,Qty,SKU,Barcode,Cost Price,Selling Price\nCoca-Cola 1.5L,24,COKE-15,4801234567890,55,70",
    });

    expect(review.rows[0]).toMatchObject({ status: "existing_product", canImport: false });
    expect(review.readyCount).toBe(0);
    expect(runAsync).not.toHaveBeenCalled();

    const approved = await reviewInventoryFileImportRows(
      database,
      store,
      review,
      review.rows.map((row) => ({ ...row, approveExisting: true })),
    );
    expect(approved.rows[0]).toMatchObject({ status: "existing_product", canImport: true });

    const result = await commitInventoryFileImport(database, store, approved);
    expect(result).toMatchObject({ importedCount: 1, createdProductCount: 0, updatedProductCount: 1 });
    expect(runAsync).toHaveBeenCalledTimes(2);
    expect(runAsync.mock.calls[0]?.[0]).toContain("INSERT INTO inventory");
    expect(runAsync.mock.calls[1]?.[0]).toContain("INSERT INTO stock_movements");
  });

  it("marks duplicate barcodes for review instead of importing either row", async () => {
    const { database } = createDatabase();
    const review = await prepareInventoryFileImport(database, store, {
      fileName: "duplicates.csv",
      fileSize: 112,
      content: "Name,Quantity,Barcode\nCoke,2,480123\nSprite,3,480123",
    });

    expect(review.rows.map(({ status }) => status)).toEqual(["duplicate_barcode", "duplicate_barcode"]);
    expect(review.readyCount).toBe(0);
  });

  it("flags an SKU assigned to another product instead of merging it", async () => {
    const { database } = createDatabase([{
      id: "coke-1",
      name: "Coca-Cola 1.5L",
      sku: "COKE-15",
      barcode: "4801234567890",
      quantity: 8,
      isActive: 1,
    }]);
    const review = await prepareInventoryFileImport(database, store, {
      fileName: "conflict.csv",
      fileSize: 60,
      content: "Name,Quantity,SKU\nSprite 1.5L,12,COKE-15",
    });

    expect(review.rows[0]).toMatchObject({ status: "duplicate_sku", canImport: false });
  });
});
