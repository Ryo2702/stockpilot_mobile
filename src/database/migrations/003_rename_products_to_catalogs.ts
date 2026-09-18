import { catalogsSchema } from "../schema/catalogs";
import type { DatabaseExecutor, Migration } from "../migrate";

async function hasTable(db: DatabaseExecutor, name: string) {
  return Boolean(
    await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
      name,
    ),
  );
}

async function getColumns(db: DatabaseExecutor, table: string) {
  return new Set(
    (await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`)).map(({ name }) => name),
  );
}

export const renameProductsMigration: Migration = {
  version: 3,
  name: "rename_products_to_catalogs",
  async isApplied(db) {
    const catalogs = await hasTable(db, "catalogs");
    const products = await hasTable(db, "products");
    const inventoryColumns = (await hasTable(db, "inventory"))
      ? await getColumns(db, "inventory")
      : new Set<string>();
    const movementColumns = (await hasTable(db, "stock_movements"))
      ? await getColumns(db, "stock_movements")
      : new Set<string>();

    return (
      catalogs &&
      !products &&
      !inventoryColumns.has("product_id") &&
      !movementColumns.has("product_id")
    );
  },
  async up(db) {
    const products = await hasTable(db, "products");
    const catalogs = await hasTable(db, "catalogs");

    if (products && catalogs) {
      throw new Error("Cannot rename products while catalogs already exists");
    }

    if (products) {
      await db.execAsync("ALTER TABLE products RENAME TO catalogs;");
    } else if (!catalogs) {
      await db.execAsync(catalogsSchema);
    }

    if (await hasTable(db, "inventory")) {
      const columns = await getColumns(db, "inventory");
      if (columns.has("product_id") && !columns.has("catalog_id")) {
        await db.execAsync("ALTER TABLE inventory RENAME COLUMN product_id TO catalog_id;");
      }
    }

    if (await hasTable(db, "stock_movements")) {
      const columns = await getColumns(db, "stock_movements");
      if (columns.has("product_id") && !columns.has("catalog_id")) {
        await db.execAsync("ALTER TABLE stock_movements RENAME COLUMN product_id TO catalog_id;");
      }
    }

    await db.execAsync(`
      DROP INDEX IF EXISTS products_store_sku_unique;
      DROP INDEX IF EXISTS products_store_active_idx;
      DROP INDEX IF EXISTS products_store_sku_idx;
      DROP INDEX IF EXISTS stock_movements_store_product_created_idx;
      ${catalogsSchema}
    `);

    if (await hasTable(db, "stock_movements")) {
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS stock_movements_store_catalog_created_idx
          ON stock_movements (store_id, catalog_id, created_at DESC);
      `);
    }
  },
};
