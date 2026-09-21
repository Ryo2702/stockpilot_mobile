import type { DatabaseExecutor, Migration } from "../migrate";

const relationships = [
  {
    tables: ["products", "stores"],
    names: ["products_store_business_insert", "products_store_business_update"],
    sql: `
      CREATE TRIGGER IF NOT EXISTS products_store_business_insert
      BEFORE INSERT ON products
      WHEN NOT EXISTS (SELECT 1 FROM stores WHERE id = NEW.store_id AND business_id = NEW.business_id)
      BEGIN SELECT RAISE(ABORT, 'product store/business mismatch'); END;
      CREATE TRIGGER IF NOT EXISTS products_store_business_update
      BEFORE UPDATE OF business_id, store_id ON products
      WHEN NOT EXISTS (SELECT 1 FROM stores WHERE id = NEW.store_id AND business_id = NEW.business_id)
      BEGIN SELECT RAISE(ABORT, 'product store/business mismatch'); END;`,
  },
  {
    tables: ["inventory", "products"],
    names: ["inventory_store_product_insert", "inventory_store_product_update"],
    sql: `
      CREATE TRIGGER IF NOT EXISTS inventory_store_product_insert
      BEFORE INSERT ON inventory
      WHEN NOT EXISTS (SELECT 1 FROM products WHERE id = NEW.product_id AND store_id = NEW.store_id AND business_id = NEW.business_id)
      BEGIN SELECT RAISE(ABORT, 'inventory store/product mismatch'); END;
      CREATE TRIGGER IF NOT EXISTS inventory_store_product_update
      BEFORE UPDATE OF product_id, store_id, business_id ON inventory
      WHEN NOT EXISTS (SELECT 1 FROM products WHERE id = NEW.product_id AND store_id = NEW.store_id AND business_id = NEW.business_id)
      BEGIN SELECT RAISE(ABORT, 'inventory store/product mismatch'); END;`,
  },
  {
    tables: ["stock_movements", "products"],
    names: ["stock_movement_store_product_insert", "stock_movement_store_product_update"],
    sql: `
      CREATE TRIGGER IF NOT EXISTS stock_movement_store_product_insert
      BEFORE INSERT ON stock_movements
      WHEN NOT EXISTS (SELECT 1 FROM products WHERE id = NEW.product_id AND store_id = NEW.store_id AND business_id = NEW.business_id)
      BEGIN SELECT RAISE(ABORT, 'stock movement store/product mismatch'); END;
      CREATE TRIGGER IF NOT EXISTS stock_movement_store_product_update
      BEFORE UPDATE OF product_id, store_id, business_id ON stock_movements
      WHEN NOT EXISTS (SELECT 1 FROM products WHERE id = NEW.product_id AND store_id = NEW.store_id AND business_id = NEW.business_id)
      BEGIN SELECT RAISE(ABORT, 'stock movement store/product mismatch'); END;`,
  },
  {
    tables: ["insight_snapshots", "stores"],
    names: ["insight_snapshot_store_business_insert", "insight_snapshot_store_business_update"],
    sql: `
      CREATE TRIGGER IF NOT EXISTS insight_snapshot_store_business_insert
      BEFORE INSERT ON insight_snapshots
      WHEN NOT EXISTS (SELECT 1 FROM stores WHERE id = NEW.store_id AND business_id = NEW.business_id)
      BEGIN SELECT RAISE(ABORT, 'insight snapshot store/business mismatch'); END;
      CREATE TRIGGER IF NOT EXISTS insight_snapshot_store_business_update
      BEFORE UPDATE OF store_id, business_id ON insight_snapshots
      WHEN NOT EXISTS (SELECT 1 FROM stores WHERE id = NEW.store_id AND business_id = NEW.business_id)
      BEGIN SELECT RAISE(ABORT, 'insight snapshot store/business mismatch'); END;`,
  },
] as const;

const ownershipTables = ["products", "inventory", "stock_movements", "insight_snapshots"] as const;

function dependentProductsTrigger(tables: Set<string>) {
  if (!tables.has("products")) return null;
  const children = ["inventory", "stock_movements"]
    .filter((table) => tables.has(table))
    .map((table) => `EXISTS (SELECT 1 FROM ${table} WHERE product_id = OLD.id)`);
  if (!children.length) return null;
  return `
    CREATE TRIGGER IF NOT EXISTS products_dependent_ownership_update
    BEFORE UPDATE OF business_id, store_id ON products
    WHEN (NEW.business_id <> OLD.business_id OR NEW.store_id <> OLD.store_id)
      AND (${children.join(" OR ")})
    BEGIN SELECT RAISE(ABORT, 'product has dependent inventory data'); END;`;
}

async function getTables(db: DatabaseExecutor) {
  return new Set(
    (await db.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'")).map(({ name }) => name),
  );
}

function applicableRelationships(tables: Set<string>) {
  return relationships.filter(({ tables: required }) => required.every((table) => tables.has(table)));
}

async function assertExistingRowsMatchOwnership(db: DatabaseExecutor, tables: Set<string>) {
  const checks: string[] = [];
  if (tables.has("products") && tables.has("stores")) {
    checks.push(`SELECT COUNT(*) AS count FROM products p
      LEFT JOIN stores s ON s.id = p.store_id AND s.business_id = p.business_id WHERE s.id IS NULL`);
  }
  if (tables.has("inventory") && tables.has("products")) {
    checks.push(`SELECT COUNT(*) AS count FROM inventory i
      LEFT JOIN products p ON p.id = i.product_id AND p.store_id = i.store_id AND p.business_id = i.business_id WHERE p.id IS NULL`);
  }
  if (tables.has("stock_movements") && tables.has("products")) {
    checks.push(`SELECT COUNT(*) AS count FROM stock_movements m
      LEFT JOIN products p ON p.id = m.product_id AND p.store_id = m.store_id AND p.business_id = m.business_id WHERE p.id IS NULL`);
  }
  if (tables.has("insight_snapshots") && tables.has("stores")) {
    checks.push(`SELECT COUNT(*) AS count FROM insight_snapshots i
      LEFT JOIN stores s ON s.id = i.store_id AND s.business_id = i.business_id WHERE s.id IS NULL`);
  }

  for (const query of checks) {
    const result = await db.getFirstAsync<{ count: number }>(query);
    if ((result?.count ?? 0) > 0) {
      throw new Error("Existing store ownership data is inconsistent; migration was not applied.");
    }
  }
  if ((await db.getAllAsync("PRAGMA foreign_key_check")).length) {
    throw new Error("Existing database references are inconsistent; migration was not applied.");
  }
}

export const storeOwnershipMigration: Migration = {
  version: 10,
  name: "enforce_store_business_ownership",
  async isApplied(db) {
    const tables = await getTables(db);
    const expected: string[] = applicableRelationships(tables).flatMap(({ names }) => [...names]);
    if (dependentProductsTrigger(tables)) expected.push("products_dependent_ownership_update");
    if (tables.has("stores") && [...ownershipTables, "store_settings"].some((table) => tables.has(table))) {
      expected.push("stores_business_ownership_update");
    }
    if (!expected.length) return true;
    const triggers = await db.getAllAsync<{ name: string }>(
      `SELECT name FROM sqlite_master WHERE type = 'trigger' AND name IN (${expected.map(() => "?").join(", ")})`,
      ...expected,
    );
    return triggers.length === expected.length;
  },
  async up(db) {
    const tables = await getTables(db);
    await assertExistingRowsMatchOwnership(db, tables);

    const triggerSql = [
      ...applicableRelationships(tables).map(({ sql }) => sql),
      dependentProductsTrigger(tables),
    ].filter(Boolean).join("\n");
    if (tables.has("stores") && [...ownershipTables, "store_settings"].some((table) => tables.has(table))) {
      const children = ["products", "inventory", "stock_movements", "insight_snapshots", "store_settings"]
        .filter((table) => tables.has(table))
        .map((table) => `EXISTS (SELECT 1 FROM ${table} WHERE store_id = OLD.id)`);
      await db.execAsync(`${triggerSql}
        CREATE TRIGGER IF NOT EXISTS stores_business_ownership_update
        BEFORE UPDATE OF business_id ON stores
        WHEN NEW.business_id <> OLD.business_id AND (${children.join(" OR ")})
        BEGIN SELECT RAISE(ABORT, 'store has dependent business data'); END;`);
    } else if (triggerSql) {
      await db.execAsync(triggerSql);
    }
  },
};
