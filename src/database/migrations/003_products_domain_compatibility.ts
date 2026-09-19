import { productsSchema } from "../schema/products";
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

export const productsDomainMigration: Migration = {
  version: 3,
  name: "products_domain_compatibility",
  async isApplied(db) {
    const products = await hasTable(db, "products");
    const catalogs = await hasTable(db, "catalogs");
    const inventory = (await hasTable(db, "inventory"))
      ? await getColumns(db, "inventory")
      : new Set<string>();
    const movements = (await hasTable(db, "stock_movements"))
      ? await getColumns(db, "stock_movements")
      : new Set<string>();

    return (
      (products &&
        !catalogs &&
        !inventory.has("catalog_id") &&
        !movements.has("catalog_id")) ||
      (catalogs &&
        !products &&
        !inventory.has("product_id") &&
        !movements.has("product_id"))
    );
  },
  async up(db) {
    if (!(await hasTable(db, "products")) && !(await hasTable(db, "catalogs"))) {
      await db.execAsync(productsSchema);
    }
  },
};
