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

export const restoreProductsTableMigration: Migration = {
  version: 5,
  name: "restore_products_table_name",
  async isApplied(db) {
    const products = await hasTable(db, "products");
    const catalogs = await hasTable(db, "catalogs");
    if (!products || catalogs) return false;

    const inventoryColumns = (await hasTable(db, "inventory"))
      ? await getColumns(db, "inventory")
      : new Set<string>();
    const movementColumns = (await hasTable(db, "stock_movements"))
      ? await getColumns(db, "stock_movements")
      : new Set<string>();
    const categoryIndex = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'products_store_category_active_idx'",
    );

    return (
      !inventoryColumns.has("catalog_id") &&
      !movementColumns.has("catalog_id") &&
      Boolean(categoryIndex)
    );
  },
  async up(db) {
    const catalogs = await hasTable(db, "catalogs");
    const products = await hasTable(db, "products");
    if (catalogs && products) {
      throw new Error("Cannot restore the products table while both products and catalogs exist.");
    }
    if (catalogs) await db.execAsync("ALTER TABLE catalogs RENAME TO products;");
    if (!(await hasTable(db, "products"))) {
      throw new Error("The products table is missing during the catalog rollback migration.");
    }

    if (await hasTable(db, "inventory")) {
      const columns = await getColumns(db, "inventory");
      if (columns.has("catalog_id") && !columns.has("product_id")) {
        await db.execAsync("ALTER TABLE inventory RENAME COLUMN catalog_id TO product_id;");
      }
    }
    if (await hasTable(db, "stock_movements")) {
      const columns = await getColumns(db, "stock_movements");
      if (columns.has("catalog_id") && !columns.has("product_id")) {
        await db.execAsync("ALTER TABLE stock_movements RENAME COLUMN catalog_id TO product_id;");
      }
    }

    await db.execAsync(`
      DROP INDEX IF EXISTS catalogs_store_sku_unique;
      DROP INDEX IF EXISTS catalogs_store_active_idx;
      DROP INDEX IF EXISTS catalogs_store_sku_idx;
      DROP INDEX IF EXISTS catalogs_store_category_active_idx;
      DROP INDEX IF EXISTS products_store_sku_unique;
      DROP INDEX IF EXISTS products_store_barcode_unique;
      DROP INDEX IF EXISTS products_store_active_idx;
      DROP INDEX IF EXISTS products_store_category_active_idx;
      DROP INDEX IF EXISTS products_store_sku_idx;
      DROP INDEX IF EXISTS stock_movements_store_catalog_created_idx;
      DROP INDEX IF EXISTS stock_movements_store_product_created_idx;

      CREATE UNIQUE INDEX products_store_sku_unique
        ON products (store_id, sku) WHERE sku IS NOT NULL;
      CREATE INDEX products_store_active_idx
        ON products (store_id, is_active);
      CREATE INDEX products_store_category_active_idx
        ON products (store_id, category, is_active);
      CREATE INDEX products_store_sku_idx
        ON products (store_id, sku);
    `);

    if (await hasTable(db, "stock_movements")) {
      await db.execAsync(`
        CREATE INDEX stock_movements_store_product_created_idx
          ON stock_movements (store_id, product_id, created_at DESC);
      `);
    }
  },
};
