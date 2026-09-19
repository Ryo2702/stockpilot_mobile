import type { DatabaseExecutor, Migration } from "../migrate";

async function hasTable(db: DatabaseExecutor, table: string) {
  return Boolean(
    await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
      table,
    ),
  );
}

async function getColumns(db: DatabaseExecutor, table: string) {
  return new Set(
    (await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`)).map(({ name }) => name),
  );
}

async function getCategoryIndex(db: DatabaseExecutor, table: string) {
  return db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'index' AND name = ?",
    `${table}_store_category_active_idx`,
  );
}

export const catalogCategoriesMigration: Migration = {
  version: 4,
  name: "catalog_categories",
  async isApplied(db) {
    for (const table of ["catalogs", "products"]) {
      if (!(await hasTable(db, table))) continue;
      const columns = await getColumns(db, table);
      if (columns.has("category") && (await getCategoryIndex(db, table))) return true;
    }
    return false;
  },
  async up(db) {
    const table = (await hasTable(db, "catalogs")) ? "catalogs" : "products";
    const columns = await getColumns(db, table);
    if (!columns.has("category")) {
      await db.execAsync(`
        ALTER TABLE ${table} ADD COLUMN category TEXT NOT NULL DEFAULT 'other'
          CHECK (
            category IN (
              'grocery', 'beverages', 'food_beverage', 'health_beauty', 'household',
              'apparel', 'accessories', 'electronics', 'hardware', 'other'
            )
          );
      `);
    }
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS ${table}_store_category_active_idx
        ON ${table} (store_id, category, is_active);
    `);
  },
};
