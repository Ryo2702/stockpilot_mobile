import type { SQLiteDatabase } from "expo-sqlite";

import type {
  InventoryCounts,
  InventoryItem,
  InventoryListQuery,
  InventoryMovement,
  InventoryMovementQuery,
  InventoryMovementSummary,
  InventoryPreferences,
} from "@/domain/inventory";

type StoreScope = Pick<InventoryItem, "businessId" | "storeId">;
type InventoryReader = Pick<SQLiteDatabase, "getAllAsync" | "getFirstAsync">;
type InventoryWriter = InventoryReader & Pick<SQLiteDatabase, "runAsync">;

type InventoryItemRow = Omit<InventoryItem, "isActive"> & { isActive: number };

const quantitySql = "COALESCE(inventory.quantity, 0)";
const activeStoreSql = `EXISTS (
  SELECT 1 FROM stores
  WHERE stores.id = products.store_id
    AND stores.business_id = products.business_id
    AND stores.status = 'active'
)`;

const itemColumns = `
  products.id,
  products.business_id AS businessId,
  products.store_id AS storeId,
  products.name,
  products.sku,
  products.barcode,
  products.category,
  products.unit,
  ${quantitySql} AS quantity,
  products.reorder_level AS reorderLevel,
  products.critical_level AS criticalLevel,
  products.is_active AS isActive,
  COALESCE(inventory.updated_at, products.updated_at) AS updatedAt`;

function buildInventoryWhere(store: StoreScope, query: InventoryListQuery) {
  const conditions = [
    "products.business_id = ?",
    "products.store_id = ?",
    "products.is_active = ?",
    activeStoreSql,
  ];
  const parameters: Array<string | number> = [
    store.businessId,
    store.storeId,
    query.archived ? 0 : 1,
  ];
  const search = query.search?.trim();

  if (search) {
    conditions.push(`(
      products.name LIKE ? COLLATE NOCASE OR
      COALESCE(products.sku, '') LIKE ? COLLATE NOCASE OR
      COALESCE(products.barcode, '') LIKE ? COLLATE NOCASE OR
      products.category LIKE ? COLLATE NOCASE
    )`);
    const value = `%${search}%`;
    parameters.push(value, value, value, value);
  }
  if (query.category) {
    conditions.push("products.category = ?");
    parameters.push(query.category);
  }
  if (query.stockStatus === "critical") conditions.push(`${quantitySql} <= 0`);
  if (query.stockStatus === "low") {
    conditions.push(`${quantitySql} > 0 AND ${quantitySql} <= products.reorder_level`);
  }
  if (query.stockStatus === "healthy") conditions.push(`${quantitySql} > products.reorder_level`);
  if (query.quantity === "in_stock") conditions.push(`${quantitySql} > 0`);
  if (query.quantity === "zero_stock") conditions.push(`${quantitySql} = 0`);

  return { where: conditions.join(" AND "), parameters };
}

function mapInventoryItem(row: InventoryItemRow): InventoryItem {
  return { ...row, isActive: Boolean(row.isActive) };
}

export async function listInventoryItems(
  db: InventoryReader,
  store: StoreScope,
  query: InventoryListQuery = {},
) {
  const { where, parameters } = buildInventoryWhere(store, query);
  const orderBy = {
    name_asc: "products.name COLLATE NOCASE ASC, products.id ASC",
    name_desc: "products.name COLLATE NOCASE DESC, products.id ASC",
    quantity_asc: `${quantitySql} ASC, products.name COLLATE NOCASE ASC`,
    quantity_desc: `${quantitySql} DESC, products.name COLLATE NOCASE ASC`,
    updated_desc: "COALESCE(inventory.updated_at, products.updated_at) DESC, products.id ASC",
    reorder_urgency: `
      CASE WHEN ${quantitySql} = 0 THEN 0
        WHEN ${quantitySql} <= products.reorder_level THEN 1 ELSE 2 END ASC,
      CASE WHEN ${quantitySql} > 0 AND ${quantitySql} <= products.reorder_level AND products.reorder_level > 0
        THEN ${quantitySql} * 1.0 / products.reorder_level ELSE 1 END ASC,
      products.name COLLATE NOCASE ASC`,
  }[query.sort ?? "name_asc"];
  const limit = Math.min(100000, Math.max(1, Math.floor(query.limit ?? 50)));
  const offset = Math.max(0, Math.floor(query.offset ?? 0));
  const [rows, count] = await Promise.all([
    db.getAllAsync<InventoryItemRow>(
      `SELECT ${itemColumns}
       FROM products
       LEFT JOIN inventory
         ON inventory.product_id = products.id
        AND inventory.business_id = products.business_id
        AND inventory.store_id = products.store_id
       WHERE ${where}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      ...parameters,
      limit,
      offset,
    ),
    db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) AS total
       FROM products
       LEFT JOIN inventory
         ON inventory.product_id = products.id
        AND inventory.business_id = products.business_id
        AND inventory.store_id = products.store_id
       WHERE ${where}`,
      ...parameters,
    ),
  ]);
  return { items: rows.map(mapInventoryItem), total: count?.total ?? 0 };
}

export async function getInventoryCounts(db: InventoryReader, store: StoreScope) {
  return (await db.getFirstAsync<InventoryCounts>(
    `SELECT
       COUNT(products.id) AS total,
       COALESCE(SUM(CASE WHEN ${quantitySql} > products.reorder_level THEN 1 ELSE 0 END), 0) AS healthy,
       COALESCE(SUM(CASE WHEN ${quantitySql} > 0 AND ${quantitySql} <= products.reorder_level THEN 1 ELSE 0 END), 0) AS low,
       COALESCE(SUM(CASE WHEN ${quantitySql} <= 0 THEN 1 ELSE 0 END), 0) AS critical
     FROM products
     LEFT JOIN inventory
       ON inventory.product_id = products.id
      AND inventory.business_id = products.business_id
      AND inventory.store_id = products.store_id
     WHERE products.business_id = ? AND products.store_id = ?
       AND products.is_active = 1 AND ${activeStoreSql}`,
    store.businessId,
    store.storeId,
  )) ?? { total: 0, healthy: 0, low: 0, critical: 0 };
}

export async function getInventoryItem(
  db: InventoryReader,
  store: StoreScope,
  productId: string,
  archived = false,
) {
  const row = await db.getFirstAsync<InventoryItemRow>(
    `SELECT ${itemColumns}
     FROM products
     LEFT JOIN inventory
       ON inventory.product_id = products.id
      AND inventory.business_id = products.business_id
      AND inventory.store_id = products.store_id
     WHERE products.id = ? AND products.business_id = ? AND products.store_id = ?
       AND products.is_active = ? AND ${activeStoreSql}
     LIMIT 1`,
    productId,
    store.businessId,
    store.storeId,
    archived ? 0 : 1,
  );
  return row ? mapInventoryItem(row) : null;
}

export async function getActiveInventoryQuantity(
  db: InventoryReader,
  store: StoreScope,
  productId: string,
) {
  return db.getFirstAsync<{ quantity: number }>(
    `SELECT COALESCE(inventory.quantity, 0) AS quantity
     FROM products
     INNER JOIN stores
       ON stores.id = products.store_id AND stores.business_id = products.business_id
     LEFT JOIN inventory
       ON inventory.product_id = products.id
      AND inventory.business_id = products.business_id
      AND inventory.store_id = products.store_id
     WHERE products.id = ? AND products.business_id = ? AND products.store_id = ?
       AND products.is_active = 1 AND stores.status = 'active'
     LIMIT 1`,
    productId,
    store.businessId,
    store.storeId,
  );
}

export async function updateInventoryQuantity(
  db: InventoryWriter,
  store: StoreScope,
  productId: string,
  quantity: number,
  now: string,
) {
  const update = await db.runAsync(
    `UPDATE inventory SET quantity = ?, updated_at = ?
     WHERE product_id = ? AND business_id = ? AND store_id = ?`,
    quantity,
    now,
    productId,
    store.businessId,
    store.storeId,
  );
  if (!update.changes) {
    await db.runAsync(
      `INSERT INTO inventory (product_id, business_id, store_id, quantity, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
      productId,
      store.businessId,
      store.storeId,
      quantity,
      now,
    );
  }
}

export async function insertInventoryMovement(
  db: InventoryWriter,
  movement: Omit<InventoryMovement, "productName" | "sku" | "unit">,
  store: StoreScope,
) {
  await db.runAsync(
    `INSERT INTO stock_movements (
      id, business_id, store_id, product_id, movement_type, delta, quantity_before,
      quantity_after, reason, reference, note, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    movement.id,
    store.businessId,
    store.storeId,
    movement.productId,
    movement.type,
    movement.delta,
    movement.quantityBefore,
    movement.quantityAfter,
    movement.reason,
    movement.reference,
    movement.note,
    movement.createdAt,
  );
}

function movementWhere(store: StoreScope, query: InventoryMovementQuery) {
  const conditions = [
    "movements.business_id = ?",
    "movements.store_id = ?",
    `EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = movements.store_id AND stores.business_id = movements.business_id
        AND stores.status = 'active'
    )`,
  ];
  const parameters: Array<string | number> = [store.businessId, store.storeId];
  if (query.type && query.type !== "all") {
    conditions.push("movements.movement_type = ?");
    parameters.push(query.type);
  }
  if (query.since) {
    conditions.push("movements.created_at >= ?");
    parameters.push(query.since);
  }
  if (query.productId) {
    conditions.push("movements.product_id = ?");
    parameters.push(query.productId);
  }
  const search = query.search?.trim();
  if (search) {
    conditions.push(`(
      products.name LIKE ? COLLATE NOCASE OR
      COALESCE(products.sku, '') LIKE ? COLLATE NOCASE OR
      COALESCE(products.barcode, '') LIKE ? COLLATE NOCASE OR
      movements.reason LIKE ? COLLATE NOCASE OR
      COALESCE(movements.reference, '') LIKE ? COLLATE NOCASE OR
      COALESCE(movements.note, '') LIKE ? COLLATE NOCASE
    )`);
    const value = `%${search}%`;
    parameters.push(value, value, value, value, value, value);
  }
  return { where: conditions.join(" AND "), parameters };
}

const movementColumns = `
  movements.id,
  movements.product_id AS productId,
  products.name AS productName,
  products.sku,
  products.unit,
  movements.movement_type AS type,
  movements.delta,
  movements.quantity_before AS quantityBefore,
  movements.quantity_after AS quantityAfter,
  movements.reason,
  movements.reference,
  movements.note,
  movements.created_at AS createdAt`;

export async function listInventoryMovements(
  db: InventoryReader,
  store: StoreScope,
  query: InventoryMovementQuery = {},
) {
  const { where, parameters } = movementWhere(store, query);
  const limit = Math.min(100, Math.max(1, Math.floor(query.limit ?? 50)));
  const offset = Math.max(0, Math.floor(query.offset ?? 0));
  const [items, count] = await Promise.all([
    db.getAllAsync<InventoryMovement>(
      `SELECT ${movementColumns}
       FROM stock_movements AS movements
       INNER JOIN products
         ON products.id = movements.product_id
        AND products.business_id = movements.business_id
        AND products.store_id = movements.store_id
       WHERE ${where}
       ORDER BY movements.created_at DESC, movements.id DESC
       LIMIT ? OFFSET ?`,
      ...parameters,
      limit,
      offset,
    ),
    db.getFirstAsync<{ total: number }>(
      `SELECT COUNT(*) AS total
       FROM stock_movements AS movements
       INNER JOIN products
         ON products.id = movements.product_id
        AND products.business_id = movements.business_id
        AND products.store_id = movements.store_id
       WHERE ${where}`,
      ...parameters,
    ),
  ]);
  return { items, total: count?.total ?? 0 };
}

export async function listProductInventoryMovements(
  db: InventoryReader,
  store: StoreScope,
  productId: string,
  limit = 3,
) {
  return db.getAllAsync<InventoryMovement>(
    `SELECT ${movementColumns}
     FROM stock_movements AS movements
     INNER JOIN products
       ON products.id = movements.product_id
      AND products.business_id = movements.business_id
      AND products.store_id = movements.store_id
     WHERE movements.business_id = ? AND movements.store_id = ? AND movements.product_id = ?
       AND EXISTS (
         SELECT 1 FROM stores
         WHERE stores.id = movements.store_id AND stores.business_id = movements.business_id
           AND stores.status = 'active'
       )
     ORDER BY movements.created_at DESC, movements.id DESC
     LIMIT ?`,
    store.businessId,
    store.storeId,
    productId,
    Math.min(50, Math.max(1, Math.floor(limit))),
  );
}

export async function getInventoryMovement(
  db: InventoryReader,
  store: StoreScope,
  movementId: string,
) {
  return db.getFirstAsync<InventoryMovement>(
    `SELECT ${movementColumns}
     FROM stock_movements AS movements
     INNER JOIN products
       ON products.id = movements.product_id
      AND products.business_id = movements.business_id
      AND products.store_id = movements.store_id
     WHERE movements.id = ? AND movements.business_id = ? AND movements.store_id = ?
       AND EXISTS (
         SELECT 1 FROM stores
         WHERE stores.id = movements.store_id AND stores.business_id = movements.business_id
           AND stores.status = 'active'
       )
     LIMIT 1`,
    movementId,
    store.businessId,
    store.storeId,
  );
}

export async function getProductMovementSummary(
  db: InventoryReader,
  store: StoreScope,
  productId: string,
  since: string,
) {
  return (await db.getFirstAsync<InventoryMovementSummary>(
    `SELECT
       COALESCE(SUM(CASE WHEN movement_type = 'stock_in' THEN ABS(delta) ELSE 0 END), 0) AS stockIn,
       COALESCE(SUM(CASE WHEN movement_type = 'stock_out' THEN ABS(delta) ELSE 0 END), 0) AS stockOut,
       COALESCE(SUM(CASE WHEN movement_type = 'adjustment' THEN 1 ELSE 0 END), 0) AS adjustments
     FROM stock_movements
     WHERE business_id = ? AND store_id = ? AND product_id = ? AND created_at >= ?
       AND EXISTS (
         SELECT 1 FROM stores
         WHERE stores.id = stock_movements.store_id AND stores.business_id = stock_movements.business_id
           AND stores.status = 'active'
       )`,
    store.businessId,
    store.storeId,
    productId,
    since,
  )) ?? { stockIn: 0, stockOut: 0, adjustments: 0 };
}

const preferencesKey = "inventory_preferences";

export async function getInventoryPreferences(db: InventoryReader, store: StoreScope) {
  const row = await db.getFirstAsync<{ valueJson: string }>(
    `SELECT value_json AS valueJson FROM store_settings
     WHERE store_id = ? AND key = ?
       AND EXISTS (
         SELECT 1 FROM stores
         WHERE stores.id = store_settings.store_id AND stores.business_id = ? AND stores.status = 'active'
       )
     LIMIT 1`,
    store.storeId,
    preferencesKey,
    store.businessId,
  );
  if (!row) return null;
  try {
    return JSON.parse(row.valueJson) as InventoryPreferences;
  } catch {
    return null;
  }
}

export async function setInventoryPreferences(
  db: InventoryWriter,
  store: StoreScope,
  preferences: InventoryPreferences,
  now: string,
) {
  const availableStore = await db.getFirstAsync<{ id: string }>(
    "SELECT id FROM stores WHERE id = ? AND business_id = ? AND status = 'active' LIMIT 1",
    store.storeId,
    store.businessId,
  );
  if (!availableStore) return false;
  await db.runAsync(
    `INSERT INTO store_settings (store_id, key, value_json, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(store_id, key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`,
    store.storeId,
    preferencesKey,
    JSON.stringify(preferences),
    now,
  );
  return true;
}
