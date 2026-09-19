import type { DatabaseExecutor, Migration } from "../migrate";

async function hasTable(db: DatabaseExecutor, table: string) {
  return Boolean(
    await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
      table,
    ),
  );
}

async function getColumns(db: DatabaseExecutor) {
  return new Set(
    (await db.getAllAsync<{ name: string }>("PRAGMA table_info(products)")).map(({ name }) => name),
  );
}

export const productMetadataMigration: Migration = {
  version: 6,
  name: "product_metadata",
  async isApplied(db) {
    if (!(await hasTable(db, "products"))) return false;
    const columns = await getColumns(db);
    const barcodeIndex = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'products_store_barcode_unique'",
    );
    return columns.has("barcode") && columns.has("unit") && columns.has("notes") && Boolean(barcodeIndex);
  },
  async up(db) {
    if (!(await hasTable(db, "products"))) {
      throw new Error("The products table is missing during the metadata migration.");
    }
    const columns = await getColumns(db);
    if (!columns.has("barcode")) await db.execAsync("ALTER TABLE products ADD COLUMN barcode TEXT NULL;");
    if (!columns.has("unit")) {
      await db.execAsync("ALTER TABLE products ADD COLUMN unit TEXT NOT NULL DEFAULT 'ea';");
    }
    if (!columns.has("notes")) await db.execAsync("ALTER TABLE products ADD COLUMN notes TEXT NULL;");
    await db.execAsync(`
      CREATE UNIQUE INDEX IF NOT EXISTS products_store_barcode_unique
        ON products (store_id, barcode)
        WHERE barcode IS NOT NULL;
    `);
  },
};
