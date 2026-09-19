import type { SQLiteDatabase } from "expo-sqlite";

import type { OwnerStore } from "./owner-store.service";

type ImportDatabase = Pick<
  SQLiteDatabase,
  "getFirstAsync" | "runAsync" | "withTransactionAsync"
>;

type InventoryRow = {
  name: string;
  sku: string | null;
  quantity: number;
  reorderLevel: number;
  criticalLevel: number;
};

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

function parseInventoryCsv(csv: string): InventoryRow[] {
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
  const seenSkus = new Set<string>();

  return dataRows.map((row, index) => {
    const rowNumber = index + 2;
    const name = values(row, "name")?.trim() ?? "";
    if (!name) throw new Error(`Row ${rowNumber}: name is required.`);

    const sku = values(row, "sku")?.trim() || null;
    if (sku && seenSkus.has(sku)) throw new Error(`Row ${rowNumber}: SKU ${sku} appears more than once.`);
    if (sku) seenSkus.add(sku);

    const quantity = parseCount(values(row, "quantity"), "quantity", rowNumber);
    const reorderLevel = parseCount(values(row, "reorder_level"), "reorder_level", rowNumber);
    const criticalLevel = parseCount(values(row, "critical_level"), "critical_level", rowNumber);
    if (criticalLevel > reorderLevel) {
      throw new Error(`Row ${rowNumber}: critical_level cannot exceed reorder_level.`);
    }

    return { name, sku, quantity, reorderLevel, criticalLevel };
  });
}

function createId(prefix: string) {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function importInventoryCsv(
  db: ImportDatabase,
  store: OwnerStore,
  csv: string,
  fileName: string,
) {
  const rows = parseInventoryCsv(csv);
  if (!rows.length) throw new Error("The CSV has no inventory rows.");
  const now = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    for (const row of rows) {
      const existing = row.sku
        ? await db.getFirstAsync<{ id: string }>(
            "SELECT id FROM catalogs WHERE store_id = ? AND sku = ?",
            store.storeId,
            row.sku,
          )
        : null;
      const catalogId = existing?.id ?? createId("catalog");
      const inventory = existing
        ? await db.getFirstAsync<{ quantity: number }>(
            "SELECT quantity FROM inventory WHERE catalog_id = ?",
            catalogId,
          )
        : null;
      const previousQuantity = inventory?.quantity ?? 0;

      if (existing) {
        await db.runAsync(
          "UPDATE catalogs SET name = ?, reorder_level = ?, critical_level = ?, is_active = 1, updated_at = ? WHERE id = ?",
          row.name,
          row.reorderLevel,
          row.criticalLevel,
          now,
          catalogId,
        );
      } else {
        await db.runAsync(
          `INSERT INTO catalogs (
            id, business_id, store_id, name, sku, reorder_level, critical_level,
            is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
          catalogId,
          store.businessId,
          store.storeId,
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
          "UPDATE inventory SET quantity = ?, updated_at = ? WHERE catalog_id = ?",
          row.quantity,
          now,
          catalogId,
        );
      } else {
        await db.runAsync(
          "INSERT INTO inventory (catalog_id, business_id, store_id, quantity, updated_at) VALUES (?, ?, ?, ?, ?)",
          catalogId,
          store.businessId,
          store.storeId,
          row.quantity,
          now,
        );
      }

      if (row.quantity !== previousQuantity) {
        await db.runAsync(
          `INSERT INTO stock_movements (
            id, business_id, store_id, catalog_id, delta, quantity_before,
            quantity_after, reason, note, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'csv_import', ?, ?)`,
          createId("movement"),
          store.businessId,
          store.storeId,
          catalogId,
          row.quantity - previousQuantity,
          previousQuantity,
          row.quantity,
          fileName,
          now,
        );
      }
    }
  });

  return rows.length;
}
