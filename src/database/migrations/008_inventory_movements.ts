import type { DatabaseExecutor, Migration } from "../migrate";

async function getColumns(db: DatabaseExecutor) {
  return new Set((await db.getAllAsync<{ name: string }>("PRAGMA table_info(stock_movements)")).map(({ name }) => name));
}

export const inventoryMovementsMigration: Migration = {
  version: 8,
  name: "inventory_movement_type_and_reference",
  async isApplied(db) {
    const columns = await getColumns(db);
    const index = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'stock_movements_store_recent_idx'",
    );
    return columns.has("movement_type") && columns.has("reference") && Boolean(index);
  },
  async up(db) {
    const columns = await getColumns(db);
    if (!columns.has("movement_type")) {
      await db.execAsync(`
        ALTER TABLE stock_movements ADD COLUMN movement_type TEXT NOT NULL DEFAULT 'adjustment'
          CHECK (movement_type IN ('stock_in', 'stock_out', 'adjustment'));
      `);
      await db.execAsync(`
        UPDATE stock_movements
        SET movement_type = CASE
          WHEN reason IN ('csv_import', 'physical_count', 'correction', 'adjustment') THEN 'adjustment'
          WHEN delta > 0 THEN 'stock_in'
          ELSE 'stock_out'
        END;
      `);
    }
    if (!columns.has("reference")) {
      await db.execAsync("ALTER TABLE stock_movements ADD COLUMN reference TEXT NULL;");
    }
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS stock_movements_store_recent_idx
        ON stock_movements (business_id, store_id, created_at DESC, id DESC);
    `);
  },
};
