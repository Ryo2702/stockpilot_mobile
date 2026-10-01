import type { CatalogCategory } from "@/domain/catalog";
import type { CurrencySettings } from "@/domain/currency";
import { getProductStockStatus } from "@/domain/product";
import type {
  InsightsDatabase,
  InsightCategory,
  InsightCustomRange,
  InsightFilters,
  InsightHealth,
  InsightInventorySummary,
  InsightMovementSummary,
  InsightPeriod,
  InsightPeriodInfo,
  InsightProduct,
  InsightRevenueSummary,
  InsightSellingProduct,
  InsightStoreSales,
  MonthlyHealthSnapshot,
  MonthlyMovement,
  SalesTrendPoint,
  StoreInsights,
  StoreScope,
} from "./types";

type DateRange = {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
  label: string;
  comparisonLabel: string;
};

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonthsClamped(date: Date, months: number) {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + months);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

function parseDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) throw new Error("Enter dates as YYYY-MM-DD.");
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (
    date.getFullYear() !== Number(match[1]) ||
    date.getMonth() !== Number(match[2]) - 1 ||
    date.getDate() !== Number(match[3])
  ) {
    throw new Error("Choose a valid date range.");
  }
  return startOfDay(date);
}

function dateOnly(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getDateRange(
  period: InsightPeriod,
  customRange?: InsightCustomRange | null,
  now = new Date(),
): DateRange {
  const today = startOfDay(now);
  let start: Date;
  let end = new Date(now.getTime() + 1);
  let previousStart: Date;
  let previousEnd: Date;
  let label: string;
  let comparisonLabel: string;

  switch (period) {
    case "today": {
      start = today;
      const elapsedToday = Math.max(1, now.getTime() - today.getTime());
      previousStart = addDays(today, -1);
      previousEnd = new Date(previousStart.getTime() + elapsedToday);
      label = "Today";
      comparisonLabel = "vs the same time yesterday";
      break;
    }
    case "7_days":
    case "30_days": {
      const days = period === "7_days" ? 7 : 30;
      start = new Date(end.getTime() - days * DAY);
      previousEnd = start;
      previousStart = new Date(start.getTime() - days * DAY);
      label = `Last ${days} Days`;
      comparisonLabel = `vs the previous ${days} days`;
      break;
    }
    case "this_month": {
      start = startOfMonth(now);
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEnd = new Date(previousStart);
      previousEnd.setDate(Math.min(now.getDate(), new Date(now.getFullYear(), now.getMonth(), 0).getDate()));
      previousEnd.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
      label = "This Month";
      comparisonLabel = "vs the same dates last month";
      break;
    }
    case "last_month": {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = startOfMonth(now);
      previousStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      previousEnd = start;
      label = "Last Month";
      comparisonLabel = "vs the previous month";
      break;
    }
    case "3_months":
    case "6_months": {
      const months = period === "3_months" ? 3 : 6;
      start = addMonthsClamped(now, -months);
      previousEnd = start;
      previousStart = addMonthsClamped(start, -months);
      label = `Last ${months} Months`;
      comparisonLabel = `vs the previous ${months} months`;
      break;
    }
    case "this_year": {
      start = new Date(now.getFullYear(), 0, 1);
      previousStart = new Date(now.getFullYear() - 1, 0, 1);
      previousEnd = new Date(now);
      previousEnd.setFullYear(previousEnd.getFullYear() - 1);
      label = "This Year";
      comparisonLabel = "vs the same dates last year";
      break;
    }
    case "custom": {
      if (!customRange) throw new Error("Choose a start and end date.");
      start = parseDate(customRange.start);
      const lastDay = parseDate(customRange.end);
      if (lastDay < start) throw new Error("The end date must be on or after the start date.");
      end = addDays(lastDay, 1);
      const duration = end.getTime() - start.getTime();
      previousEnd = start;
      previousStart = new Date(start.getTime() - duration);
      label = `${dateOnly(start)} – ${dateOnly(lastDay)}`;
      comparisonLabel = `vs the previous ${Math.round(duration / DAY)} days`;
      break;
    }
  }

  return {
    start,
    end,
    previousStart,
    previousEnd,
    label,
    comparisonLabel,
  };
}

export const defaultInsightFilters = (store: StoreScope): InsightFilters => ({
  storeId: store.storeId,
  category: null,
  productQuery: "",
});

function normalizeFilters(store: StoreScope, filters?: InsightFilters): InsightFilters {
  return {
    storeId: filters?.storeId || store.storeId,
    category: filters?.category ?? null,
    productQuery: filters?.productQuery?.trim() ?? "",
  };
}

function scopeWhere(alias: string, store: StoreScope, filters: InsightFilters) {
  const params: string[] = [store.businessId];
  const conditions = [
    `${alias}.business_id = ?`,
    `EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = ${alias}.store_id
        AND stores.business_id = ${alias}.business_id
        AND stores.status = 'active'
    )`,
  ];
  if (filters.storeId !== "all") {
    conditions.push(`${alias}.store_id = ?`);
    params.push(filters.storeId);
  }
  return { sql: conditions.join(" AND "), params };
}

function productFilterWhere(alias: string, filters: InsightFilters) {
  const params: string[] = [];
  const conditions: string[] = [];
  if (filters.category) {
    conditions.push(`${alias}.category = ?`);
    params.push(filters.category);
  }
  if (filters.productQuery) {
    const query = `%${filters.productQuery}%`;
    conditions.push(`(
      LOWER(COALESCE(${alias}.name, '')) LIKE LOWER(?) OR
      LOWER(COALESCE(${alias}.sku, '')) LIKE LOWER(?) OR
      LOWER(COALESCE(${alias}.barcode, '')) LIKE LOWER(?)
    )`);
    params.push(query, query, query);
  }
  return { sql: conditions.length ? conditions.join(" AND ") : "1 = 1", params };
}

function movementProductWhere(filters: InsightFilters) {
  const product = productFilterWhere("filter_products", filters);
  if (product.sql === "1 = 1") return { sql: "1 = 1", params: [] as string[] };
  return {
    sql: `EXISTS (
      SELECT 1 FROM products AS filter_products
      WHERE filter_products.id = stock_movements.product_id
        AND filter_products.business_id = stock_movements.business_id
        AND filter_products.store_id = stock_movements.store_id
        AND filter_products.is_active = 1
        AND ${product.sql}
    )`,
    params: product.params,
  };
}

function hasProductFilter(filters: InsightFilters) {
  return Boolean(filters.category || filters.productQuery);
}

function movementSql(store: StoreScope, range: DateRange, filters: InsightFilters) {
  const scope = scopeWhere("stock_movements", store, filters);
  const product = movementProductWhere(filters);
  return {
    sql: `SELECT
        COALESCE(SUM(CASE WHEN movement_type = 'stock_in' THEN ABS(delta) ELSE 0 END), 0) AS stockIn,
        COALESCE(SUM(CASE WHEN movement_type = 'stock_out' THEN ABS(delta) ELSE 0 END), 0) AS stockOut,
        COALESCE(SUM(CASE WHEN movement_type = 'adjustment' THEN delta ELSE 0 END), 0) AS adjustments,
        COALESCE(SUM(delta), 0) AS net
      FROM stock_movements
      WHERE ${scope.sql} AND stock_movements.created_at >= ? AND stock_movements.created_at < ?
        AND ${product.sql}`,
    params: [...scope.params, range.start.toISOString(), range.end.toISOString(), ...product.params] as const,
  };
}

async function getHealth(db: InsightsDatabase, store: StoreScope, filters: InsightFilters) {
  const scope = scopeWhere("products", store, filters);
  const product = productFilterWhere("products", filters);
  return (await db.getFirstAsync<InsightHealth>(
    `SELECT
       COUNT(products.id) AS total,
       COALESCE(SUM(CASE WHEN COALESCE(inventory.quantity, 0) > products.reorder_level THEN 1 ELSE 0 END), 0) AS healthy,
       COALESCE(SUM(CASE WHEN COALESCE(inventory.quantity, 0) > 0 AND COALESCE(inventory.quantity, 0) <= products.reorder_level THEN 1 ELSE 0 END), 0) AS low,
       COALESCE(SUM(CASE WHEN COALESCE(inventory.quantity, 0) <= 0 THEN 1 ELSE 0 END), 0) AS critical,
       COALESCE(SUM(CASE WHEN COALESCE(inventory.quantity, 0) <= 0 THEN 1 ELSE 0 END), 0) AS outOfStock
     FROM products
     LEFT JOIN inventory ON inventory.product_id = products.id
       AND inventory.business_id = products.business_id AND inventory.store_id = products.store_id
     WHERE ${scope.sql} AND products.is_active = 1 AND ${product.sql}`,
    ...scope.params,
    ...product.params,
  )) ?? { total: 0, healthy: 0, low: 0, critical: 0, outOfStock: 0 };
}

async function getStoreCurrency(db: InsightsDatabase, store: StoreScope, filters: InsightFilters): Promise<CurrencySettings> {
  const currencyStoreId = filters.storeId === "all" ? store.storeId : filters.storeId;
  const row = await db.getFirstAsync<CurrencySettings>(
    `SELECT
       currency_mode AS currencyMode,
       currency_code AS currencyCode,
       custom_currency_symbol AS customCurrencySymbol,
       currency_decimal_places AS currencyDecimalPlaces
     FROM stores
     WHERE id = ? AND business_id = ? AND status = 'active'
     LIMIT 1`,
    currencyStoreId,
    store.businessId,
  );
  return row ?? { currencyMode: "iso", currencyCode: "PHP", currencyDecimalPlaces: 2 };
}

async function getScopeLabel(db: InsightsDatabase, store: StoreScope, filters: InsightFilters) {
  if (filters.storeId === "all") return "All Stores";
  const row = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM stores WHERE id = ? AND business_id = ? AND status = 'active' LIMIT 1",
    filters.storeId,
    store.businessId,
  );
  return row?.name ?? store.storeName;
}

async function getInventorySummary(db: InsightsDatabase, store: StoreScope, filters: InsightFilters): Promise<InsightInventorySummary> {
  const scope = scopeWhere("products", store, filters);
  const product = productFilterWhere("products", filters);
  const row = await db.getFirstAsync<InsightInventorySummary>(
    `SELECT
       COALESCE(SUM(COALESCE(inventory.quantity, 0)), 0) AS totalUnits,
       COALESCE(SUM(CASE WHEN products.cost_price IS NULL THEN 0 ELSE COALESCE(inventory.quantity, 0) * products.cost_price END), 0) AS costValue,
       COALESCE(SUM(CASE WHEN products.current_price IS NULL THEN 0 ELSE COALESCE(inventory.quantity, 0) * products.current_price END), 0) AS sellingValue,
       COALESCE(SUM(CASE WHEN products.cost_price IS NULL THEN 1 ELSE 0 END), 0) AS missingCostPrices,
       COALESCE(SUM(CASE WHEN products.current_price IS NULL THEN 1 ELSE 0 END), 0) AS missingSellingPrices
     FROM products
     LEFT JOIN inventory ON inventory.product_id = products.id
       AND inventory.business_id = products.business_id AND inventory.store_id = products.store_id
     WHERE ${scope.sql} AND products.is_active = 1 AND ${product.sql}`,
    ...scope.params,
    ...product.params,
  );
  const costValue = Number(row?.costValue ?? 0);
  const sellingValue = Number(row?.sellingValue ?? 0);
  return {
    totalUnits: Number(row?.totalUnits ?? 0),
    costValue,
    sellingValue,
    potentialGrossMargin: sellingValue - costValue,
    missingCostPrices: Number(row?.missingCostPrices ?? 0),
    missingSellingPrices: Number(row?.missingSellingPrices ?? 0),
  };
}

async function getMovementSummary(db: InsightsDatabase, store: StoreScope, range: DateRange, filters: InsightFilters) {
  const query = movementSql(store, range, filters);
  return (await db.getFirstAsync<InsightMovementSummary>(query.sql, ...query.params)) ?? {
    stockIn: 0,
    stockOut: 0,
    adjustments: 0,
    net: 0,
  };
}

type SalesSource = {
  from: string;
  where: string;
  params: string[];
  amount: string;
  units: string;
  transactions: string;
};

function salesSource(store: StoreScope, filters: InsightFilters): SalesSource {
  const scope = scopeWhere("transactions", store, filters);
  if (hasProductFilter(filters)) {
    const product = productFilterWhere("products", filters);
    return {
      from: `FROM pos_transactions AS transactions
        INNER JOIN pos_transaction_items AS items ON items.transaction_id = transactions.id
        INNER JOIN products ON products.id = items.product_id
          AND products.business_id = transactions.business_id
          AND products.store_id = transactions.store_id`,
      where: `${scope.sql} AND ${product.sql} AND transactions.created_at >= ? AND transactions.created_at < ?`,
      params: [...scope.params, ...product.params],
      amount: "items.line_total",
      units: "items.quantity",
      transactions: "COUNT(DISTINCT transactions.id)",
    };
  }
  return {
    from: "FROM pos_transactions AS transactions",
    where: `${scope.sql} AND transactions.created_at >= ? AND transactions.created_at < ?`,
    params: scope.params,
    amount: "transactions.total",
    units: "COALESCE((SELECT SUM(item_units.quantity) FROM pos_transaction_items AS item_units WHERE item_units.transaction_id = transactions.id), 0)",
    transactions: "COUNT(transactions.id)",
  };
}

async function getRevenueSummary(db: InsightsDatabase, store: StoreScope, range: DateRange, filters: InsightFilters): Promise<InsightRevenueSummary> {
  const source = salesSource(store, filters);
  const row = await db.getFirstAsync<{ total: number | null; transactions: number | null; unitsSold: number | null }>(
    `SELECT
       COALESCE(SUM(${source.amount}), 0) AS total,
       ${source.transactions} AS transactions,
       COALESCE(SUM(${source.units}), 0) AS unitsSold
     ${source.from}
     WHERE ${source.where}`,
    ...source.params,
    range.start.toISOString(),
    range.end.toISOString(),
  );
  const total = Number(row?.total ?? 0);
  const transactions = Number(row?.transactions ?? 0);
  return {
    total,
    transactions,
    unitsSold: Number(row?.unitsSold ?? 0),
    averageTransactionValue: transactions ? total / transactions : 0,
  };
}

type InsightProductRow = Pick<InsightProduct,
  | "id"
  | "storeId"
  | "storeName"
  | "name"
  | "sku"
  | "createdAt"
  | "category"
  | "unit"
  | "costPrice"
  | "sellingPrice"
  | "quantity"
  | "reorderLevel"
  | "criticalLevel"
  | "stockIn"
  | "stockOut"
  | "previousStockOut"
  | "adjustment"
  | "movementsLast30Days"
  | "stockOutLast30Days"
  | "lastMovementAt"
>;

async function getProducts(
  db: InsightsDatabase,
  store: StoreScope,
  range: DateRange,
  now: Date,
  filters: InsightFilters,
) {
  const scope = scopeWhere("products", store, filters);
  const product = productFilterWhere("products", filters);
  const rows = await db.getAllAsync<InsightProductRow>(
    `SELECT
       products.id,
       products.store_id AS storeId,
       stores.name AS storeName,
       products.name,
       products.sku,
       products.created_at AS createdAt,
       products.category,
       products.unit,
       products.cost_price AS costPrice,
       products.current_price AS sellingPrice,
       COALESCE(inventory.quantity, 0) AS quantity,
       products.reorder_level AS reorderLevel,
       products.critical_level AS criticalLevel,
       COALESCE(SUM(CASE WHEN movements.created_at >= ? AND movements.created_at < ?
         AND movements.movement_type = 'stock_in' THEN ABS(movements.delta) ELSE 0 END), 0) AS stockIn,
       COALESCE(SUM(CASE WHEN movements.created_at >= ? AND movements.created_at < ?
         AND movements.movement_type = 'stock_out' THEN ABS(movements.delta) ELSE 0 END), 0) AS stockOut,
       COALESCE(SUM(CASE WHEN movements.created_at >= ? AND movements.created_at < ?
         AND movements.movement_type = 'stock_out' THEN ABS(movements.delta) ELSE 0 END), 0) AS previousStockOut,
       COALESCE(SUM(CASE WHEN movements.created_at >= ? AND movements.created_at < ?
         AND movements.movement_type = 'adjustment' THEN movements.delta ELSE 0 END), 0) AS adjustment,
       COALESCE(SUM(CASE WHEN movements.created_at >= ? AND movements.created_at < ? THEN 1 ELSE 0 END), 0) AS movementsLast30Days,
       COALESCE(SUM(CASE WHEN movements.created_at >= ? AND movements.created_at < ?
         AND movements.movement_type = 'stock_out' THEN ABS(movements.delta) ELSE 0 END), 0) AS stockOutLast30Days,
       MAX(movements.created_at) AS lastMovementAt
     FROM products
     INNER JOIN stores ON stores.id = products.store_id
       AND stores.business_id = products.business_id AND stores.status = 'active'
     LEFT JOIN inventory ON inventory.product_id = products.id
       AND inventory.business_id = products.business_id AND inventory.store_id = products.store_id
     LEFT JOIN stock_movements AS movements ON movements.product_id = products.id
       AND movements.business_id = products.business_id AND movements.store_id = products.store_id
     WHERE ${scope.sql} AND products.is_active = 1 AND ${product.sql}
     GROUP BY products.id
     ORDER BY products.name COLLATE NOCASE ASC`,
    range.start.toISOString(), range.end.toISOString(),
    range.start.toISOString(), range.end.toISOString(),
    range.previousStart.toISOString(), range.previousEnd.toISOString(),
    range.start.toISOString(), range.end.toISOString(),
    addDays(now, -30).toISOString(), now.toISOString(),
    addDays(now, -30).toISOString(), now.toISOString(),
    ...scope.params,
    ...product.params,
  );

  return rows.map((product) => {
    const net = product.stockIn - product.stockOut + product.adjustment;
    const observationStart = Math.max(addDays(now, -30).getTime(), new Date(product.createdAt).getTime());
    const observedDays = Math.max(1, Math.ceil((now.getTime() - observationStart) / DAY));
    const averageDailyOut = product.stockOutLast30Days / observedDays;
    return {
      ...product,
      stockStatus: getProductStockStatus(product.quantity, product.reorderLevel),
      net,
      averageDailyOut: averageDailyOut > 0 ? averageDailyOut : null,
      estimatedDaysRemaining: averageDailyOut > 0 ? product.quantity / averageDailyOut : null,
      recommendedRestock: averageDailyOut > 0
        ? Math.max(0, Math.ceil(averageDailyOut * 14 - product.quantity))
        : null,
    };
  });
}

function getCategories(
  products: InsightProduct[],
  monthlyMovementByCategory: Map<string, MonthlyMovement[]>,
): InsightCategory[] {
  const groups = new Map<CatalogCategory, InsightProduct[]>();
  for (const product of products) {
    const group = groups.get(product.category) ?? [];
    group.push(product);
    groups.set(product.category, group);
  }
  return [...groups.entries()]
    .map(([category, items]) => {
      const moving = items.filter((item) => item.stockOut > 0).sort((a, b) => b.stockOut - a.stockOut);
      const slower = [...moving].sort((a, b) => a.stockOut - b.stockOut);
      return {
        category,
        products: items.length,
        healthy: items.filter((item) => item.stockStatus === "healthy").length,
        low: items.filter((item) => item.stockStatus === "low").length,
        critical: items.filter((item) => item.stockStatus === "critical").length,
        stockIn: items.reduce((sum, item) => sum + item.stockIn, 0),
        stockOut: items.reduce((sum, item) => sum + item.stockOut, 0),
        net: items.reduce((sum, item) => sum + item.net, 0),
        topMovingProduct: moving[0]?.name ?? null,
        slowestProduct: slower[0]?.name ?? null,
        monthlyMovement: monthlyMovementByCategory.get(category) ?? [],
      };
    })
    .sort((a, b) => b.stockOut - a.stockOut || a.category.localeCompare(b.category));
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat(undefined, { month: "short" }).format(date);
}

async function getMonthlyMovement(db: InsightsDatabase, store: StoreScope, now: Date, filters: InsightFilters) {
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const end = now;
  const scope = scopeWhere("stock_movements", store, filters);
  const product = movementProductWhere(filters);
  const rows = await db.getAllAsync<{
    monthKey: string;
    stockIn: number;
    stockOut: number;
    net: number;
  }>(
    `SELECT
       strftime('%Y-%m', stock_movements.created_at, 'localtime') AS monthKey,
       COALESCE(SUM(CASE WHEN movement_type = 'stock_in' THEN ABS(delta) ELSE 0 END), 0) AS stockIn,
       COALESCE(SUM(CASE WHEN movement_type = 'stock_out' THEN ABS(delta) ELSE 0 END), 0) AS stockOut,
       COALESCE(SUM(delta), 0) AS net
     FROM stock_movements
     WHERE ${scope.sql} AND stock_movements.created_at >= ? AND stock_movements.created_at < ?
       AND ${product.sql}
     GROUP BY monthKey
     ORDER BY monthKey ASC`,
    ...scope.params,
    firstMonth.toISOString(),
    end.toISOString(),
    ...product.params,
  );
  const values = new Map(rows.map((row) => [row.monthKey, row]));
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const key = monthKey(date);
    const value = values.get(key);
    return {
      monthKey: key,
      label: monthLabel(date),
      stockIn: value?.stockIn ?? 0,
      stockOut: value?.stockOut ?? 0,
      net: value?.net ?? 0,
    };
  });
}

async function getMonthlyRevenue(db: InsightsDatabase, store: StoreScope, now: Date, filters: InsightFilters) {
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const source = salesSource(store, filters);
  const rows = await db.getAllAsync<{
    monthKey: string;
    revenue: number;
    transactions: number;
    unitsSold: number;
  }>(
    `SELECT
       strftime('%Y-%m', transactions.created_at, 'localtime') AS monthKey,
       COALESCE(SUM(${source.amount}), 0) AS revenue,
       ${source.transactions} AS transactions,
       COALESCE(SUM(${source.units}), 0) AS unitsSold
     ${source.from}
     WHERE ${source.where}
     GROUP BY monthKey
     ORDER BY monthKey ASC`,
    ...source.params,
    firstMonth.toISOString(),
    now.toISOString(),
  );
  const values = new Map(rows.map((row) => [row.monthKey, row]));
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const key = monthKey(date);
    const value = values.get(key);
    return {
      monthKey: key,
      label: monthLabel(date),
      revenue: Number(value?.revenue ?? 0),
      transactions: Number(value?.transactions ?? 0),
      unitsSold: Number(value?.unitsSold ?? 0),
    };
  });
}

function salesTrendLabel(bucket: "day" | "week", key: string) {
  if (bucket === "week") return key.replace(/^\d{4}-/, "");
  const date = new Date(`${key}T00:00:00`);
  return Number.isNaN(date.getTime()) ? key : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
}

async function getSalesTrend(
  db: InsightsDatabase,
  store: StoreScope,
  range: DateRange,
  filters: InsightFilters,
  bucket: "day" | "week",
): Promise<SalesTrendPoint[]> {
  const source = salesSource(store, filters);
  const expression = bucket === "day"
    ? "strftime('%Y-%m-%d', transactions.created_at, 'localtime')"
    : "strftime('%Y-W%W', transactions.created_at, 'localtime')";
  const rows = await db.getAllAsync<SalesTrendPoint>(
    `SELECT
       ${expression} AS periodKey,
       COALESCE(SUM(${source.amount}), 0) AS revenue,
       ${source.transactions} AS transactions,
       COALESCE(SUM(${source.units}), 0) AS unitsSold
     ${source.from}
     WHERE ${source.where}
     GROUP BY periodKey
     ORDER BY periodKey ASC`,
    ...source.params,
    range.start.toISOString(),
    range.end.toISOString(),
  );
  return rows.map((row) => ({
    periodKey: row.periodKey,
    label: salesTrendLabel(bucket, row.periodKey),
    revenue: Number(row.revenue ?? 0),
    transactions: Number(row.transactions ?? 0),
    unitsSold: Number(row.unitsSold ?? 0),
  }));
}

async function getTopSelling(db: InsightsDatabase, store: StoreScope, range: DateRange, filters: InsightFilters): Promise<InsightSellingProduct[]> {
  const scope = scopeWhere("transactions", store, filters);
  const product = productFilterWhere("products", filters);
  const rows = await db.getAllAsync<InsightSellingProduct>(
    `SELECT
       products.id,
       products.name,
       products.sku,
       products.category,
       products.unit,
       COALESCE(SUM(items.quantity), 0) AS unitsSold,
       COALESCE(SUM(items.line_total), 0) AS revenue,
       COUNT(DISTINCT transactions.id) AS transactions
     FROM pos_transactions AS transactions
     INNER JOIN pos_transaction_items AS items ON items.transaction_id = transactions.id
     INNER JOIN products ON products.id = items.product_id
       AND products.business_id = transactions.business_id
       AND products.store_id = transactions.store_id
     WHERE ${scope.sql}
       AND products.is_active = 1
       AND ${product.sql}
       AND transactions.created_at >= ? AND transactions.created_at < ?
     GROUP BY products.id
     ORDER BY unitsSold DESC, revenue DESC, products.name COLLATE NOCASE ASC
     LIMIT 10`,
    ...scope.params,
    ...product.params,
    range.start.toISOString(),
    range.end.toISOString(),
  );
  return rows.map((row) => ({
    ...row,
    unitsSold: Number(row.unitsSold ?? 0),
    revenue: Number(row.revenue ?? 0),
    transactions: Number(row.transactions ?? 0),
  }));
}

async function getStoreSalesBreakdown(db: InsightsDatabase, store: StoreScope, range: DateRange, filters: InsightFilters): Promise<InsightStoreSales[]> {
  const source = salesSource(store, filters);
  const rows = await db.getAllAsync<InsightStoreSales>(
    `SELECT
       stores.id AS storeId,
       stores.name AS storeName,
       COALESCE(SUM(${source.amount}), 0) AS grossSales,
       ${source.transactions} AS transactions,
       COALESCE(SUM(${source.units}), 0) AS unitsSold
     ${source.from}
     INNER JOIN stores ON stores.id = transactions.store_id
       AND stores.business_id = transactions.business_id
       AND stores.status = 'active'
     WHERE ${source.where}
     GROUP BY stores.id, stores.name
     ORDER BY grossSales DESC, stores.name COLLATE NOCASE ASC`,
    ...source.params,
    range.start.toISOString(),
    range.end.toISOString(),
  );
  return rows.map((row) => ({
    ...row,
    grossSales: Number(row.grossSales ?? 0),
    transactions: Number(row.transactions ?? 0),
    unitsSold: Number(row.unitsSold ?? 0),
  }));
}

async function getMonthlyCategoryMovement(db: InsightsDatabase, store: StoreScope, now: Date, filters: InsightFilters) {
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const end = now;
  const scope = scopeWhere("stock_movements", store, filters);
  const product = productFilterWhere("products", filters);
  const rows = await db.getAllAsync<{
    category: CatalogCategory;
    monthKey: string;
    stockIn: number;
    stockOut: number;
    net: number;
  }>(
    `SELECT
       products.category,
       strftime('%Y-%m', stock_movements.created_at, 'localtime') AS monthKey,
       COALESCE(SUM(CASE WHEN stock_movements.movement_type = 'stock_in' THEN ABS(stock_movements.delta) ELSE 0 END), 0) AS stockIn,
       COALESCE(SUM(CASE WHEN stock_movements.movement_type = 'stock_out' THEN ABS(stock_movements.delta) ELSE 0 END), 0) AS stockOut,
       COALESCE(SUM(stock_movements.delta), 0) AS net
     FROM stock_movements
     INNER JOIN products ON products.id = stock_movements.product_id
       AND products.business_id = stock_movements.business_id AND products.store_id = stock_movements.store_id
     WHERE ${scope.sql}
       AND stock_movements.created_at >= ? AND stock_movements.created_at < ?
       AND products.is_active = 1 AND ${product.sql}
     GROUP BY products.category, monthKey
     ORDER BY monthKey ASC`,
    ...scope.params,
    firstMonth.toISOString(),
    end.toISOString(),
    ...product.params,
  );
  const values = new Map(rows.map((row) => [`${row.category}:${row.monthKey}`, row]));
  const result = new Map<string, MonthlyMovement[]>();
  for (const category of new Set(rows.map((row) => row.category))) {
    result.set(category, Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      const key = monthKey(date);
      const value = values.get(`${category}:${key}`);
      return {
        monthKey: key,
        label: monthLabel(date),
        stockIn: value?.stockIn ?? 0,
        stockOut: value?.stockOut ?? 0,
        net: value?.net ?? 0,
      };
    }));
  }
  return result;
}

function decodeHealthSnapshots(rows: Array<{ payloadJson: string; createdAt: string }>) {
  const snapshots: MonthlyHealthSnapshot[] = [];
  for (const row of rows) {
    try {
      const value = JSON.parse(row.payloadJson) as MonthlyHealthSnapshot;
      const outOfStock = Number(value.outOfStock ?? value.critical ?? 0);
      if (
        typeof value.monthKey === "string" &&
        Number.isFinite(value.total) && Number.isFinite(value.healthy) &&
        Number.isFinite(value.low) && Number.isFinite(value.critical)
      ) {
        snapshots.push({ ...value, outOfStock, capturedAt: row.createdAt });
      }
    } catch {
      // Ignore malformed local snapshots; live inventory remains available.
    }
  }
  return snapshots;
}

async function saveMonthlyHealthSnapshot(
  db: InsightsDatabase,
  store: StoreScope,
  health: InsightHealth,
  now: Date,
) {
  const createdAt = now.toISOString();
  const key = monthKey(now);
  const id = `health:${store.businessId}:${store.storeId}:${key}`;
  const payload = JSON.stringify({ monthKey: key, ...health });
  await db.runAsync(
    `INSERT INTO insight_snapshots (id, business_id, store_id, kind, payload_json, source_updated_at, created_at)
     SELECT ?, ?, ?, 'stock_health_monthly', ?, ?, ?
     WHERE EXISTS (
       SELECT 1 FROM stores WHERE stores.id = ? AND stores.business_id = ? AND stores.status = 'active'
     )
     ON CONFLICT(id) DO UPDATE SET
       payload_json = excluded.payload_json,
       source_updated_at = excluded.source_updated_at,
       created_at = excluded.created_at`,
    id,
    store.businessId,
    store.storeId,
    payload,
    createdAt,
    createdAt,
    store.storeId,
    store.businessId,
  );
}

async function getMonthlyHealthSnapshots(db: InsightsDatabase, store: StoreScope) {
  const rows = await db.getAllAsync<{ payloadJson: string; createdAt: string }>(
    `SELECT payload_json AS payloadJson, created_at AS createdAt
     FROM insight_snapshots
     WHERE business_id = ? AND store_id = ? AND kind = 'stock_health_monthly'
       AND EXISTS (
         SELECT 1 FROM stores
         WHERE stores.id = insight_snapshots.store_id
           AND stores.business_id = insight_snapshots.business_id
           AND stores.status = 'active'
       )
     ORDER BY created_at DESC LIMIT 18`,
    store.businessId,
    store.storeId,
  );
  return decodeHealthSnapshots(rows).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

export async function getStoreInsights(
  db: InsightsDatabase,
  store: StoreScope,
  period: InsightPeriod,
  customRange?: InsightCustomRange | null,
  inputFilters?: InsightFilters,
) {
  const filters = normalizeFilters(store, inputFilters);
  const now = new Date();
  const range = getDateRange(period, customRange, now);
  const [currency, scopeLabel, health, inventory, movement, previousMovement, revenue, previousRevenue, allProducts, monthlyMovement, monthlyRevenue, salesByDay, salesByWeek, salesByStore, topSelling, monthlyCategoryMovement] = await Promise.all([
    getStoreCurrency(db, store, filters),
    getScopeLabel(db, store, filters),
    getHealth(db, store, filters),
    getInventorySummary(db, store, filters),
    getMovementSummary(db, store, range, filters),
    getMovementSummary(db, store, {
      ...range,
      start: range.previousStart,
      end: range.previousEnd,
    }, filters),
    getRevenueSummary(db, store, range, filters),
    getRevenueSummary(db, store, {
      ...range,
      start: range.previousStart,
      end: range.previousEnd,
    }, filters),
    getProducts(db, store, range, now, filters),
    getMonthlyMovement(db, store, now, filters),
    getMonthlyRevenue(db, store, now, filters),
    getSalesTrend(db, store, range, filters, "day"),
    getSalesTrend(db, store, range, filters, "week"),
    getStoreSalesBreakdown(db, store, range, filters),
    getTopSelling(db, store, range, filters),
    getMonthlyCategoryMovement(db, store, now, filters),
  ]);

  const trackHealthSnapshot = filters.storeId === store.storeId && !filters.category && !filters.productQuery;
  if (trackHealthSnapshot) await saveMonthlyHealthSnapshot(db, store, health, now);
  const monthlyHealth = trackHealthSnapshot ? await getMonthlyHealthSnapshots(db, store) : [];
  const previousMonthKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const topMoving = allProducts.filter((product) => product.stockOut > 0)
    .sort((a, b) => b.stockOut - a.stockOut || a.name.localeCompare(b.name));
  const slowMoving = allProducts.filter((product) => product.stockOut > 0)
    .sort((a, b) => a.stockOut - b.stockOut || a.name.localeCompare(b.name));
  const noMovement = allProducts.filter((product) => product.movementsLast30Days === 0);
  const changes = allProducts.filter((product) => product.previousStockOut > 0 && product.stockOut !== product.previousStockOut);
  const periodInfo: InsightPeriodInfo = {
    period,
    label: range.label,
    comparisonLabel: range.comparisonLabel,
    start: range.start.toISOString(),
    end: range.end.toISOString(),
    previousStart: range.previousStart.toISOString(),
    previousEnd: range.previousEnd.toISOString(),
    days: Math.max(1, Math.ceil((range.end.getTime() - range.start.getTime()) / DAY)),
  };

  return {
    currency,
    filters,
    scopeLabel,
    period: periodInfo,
    health,
    inventory,
    hasMovementHistory: allProducts.some((product) => product.lastMovementAt !== null),
    previousMonthHealth: monthlyHealth.find((snapshot) => snapshot.monthKey === previousMonthKey) ?? null,
    movement,
    previousMovement,
    revenue,
    previousRevenue,
    products: {
      topMoving,
      slowMoving,
      largestIncreases: changes.filter((product) => product.stockOut > product.previousStockOut)
        .sort((a, b) => (b.stockOut - b.previousStockOut) / b.previousStockOut - (a.stockOut - a.previousStockOut) / a.previousStockOut)
        .slice(0, 5),
      largestDecreases: changes.filter((product) => product.stockOut < product.previousStockOut)
        .sort((a, b) => (a.stockOut - a.previousStockOut) / a.previousStockOut - (b.stockOut - b.previousStockOut) / b.previousStockOut)
        .slice(0, 5),
      noMovement,
      noMovementCount: noMovement.length,
      critical: allProducts.filter((product) => product.stockStatus === "critical")
        .sort((a, b) => a.quantity - b.quantity || a.name.localeCompare(b.name)),
      low: allProducts.filter((product) => product.stockStatus === "low")
        .sort((a, b) => (a.quantity / Math.max(1, a.reorderLevel)) - (b.quantity / Math.max(1, b.reorderLevel))),
    },
    categories: getCategories(allProducts, monthlyCategoryMovement),
    monthlyMovement,
    monthlyRevenue,
    salesByDay,
    salesByWeek,
    salesByStore,
    topSelling,
    monthlyHealth,
  } satisfies StoreInsights;
}

export function getInsightDateOnly(date: Date) {
  return dateOnly(date);
}
