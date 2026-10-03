import type {
  InsightsDatabase,
  InsightFilters,
  InsightMovementRecord,
  InsightReport,
  InsightReportType,
  StoreInsights,
  StoreScope,
} from "./types";
import createId from "@/utils/createId";

function movementQueryScope(store: StoreScope, filters: InsightFilters, start: string, end: string) {
  const params: string[] = [store.businessId];
  const conditions = [
    "stock_movements.business_id = ?",
    "stock_movements.created_at >= ?",
    "stock_movements.created_at < ?",
    `EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = stock_movements.store_id
        AND stores.business_id = stock_movements.business_id
        AND stores.status = 'active'
    )`,
  ];
  params.push(start, end);
  if (filters.storeId !== "all") {
    conditions.push("stock_movements.store_id = ?");
    params.push(filters.storeId);
  }
  if (filters.category || filters.productQuery) {
    const query = `%${filters.productQuery}%`;
    const productConditions = ["filter_products.is_active = 1"];
    if (filters.category) {
      productConditions.push("filter_products.category = ?");
      params.push(filters.category);
    }
    if (filters.productQuery) {
      productConditions.push(`(
        LOWER(COALESCE(filter_products.name, '')) LIKE LOWER(?) OR
        LOWER(COALESCE(filter_products.sku, '')) LIKE LOWER(?) OR
        LOWER(COALESCE(filter_products.barcode, '')) LIKE LOWER(?)
      )`);
      params.push(query, query, query);
    }
    conditions.push(`EXISTS (
      SELECT 1 FROM products AS filter_products
      WHERE filter_products.id = stock_movements.product_id
        AND filter_products.business_id = stock_movements.business_id
        AND filter_products.store_id = stock_movements.store_id
        AND ${productConditions.join(" AND ")}
    )`);
  }
  return { where: conditions.join(" AND "), params };
}

const reportTitles: Record<InsightReportType, string> = {
  monthly: "Monthly Inventory Report",
  movement: "Stock Movement Report",
  performance: "Product Performance Report",
  low_stock: "Low Stock Report",
  critical_stock: "Out of Stock Report",
  slow_moving: "Slow Moving Report",
  category: "Category Report",
  custom: "Custom Inventory Report",
};

export async function saveInsightsReport(
  db: InsightsDatabase,
  store: StoreScope,
  insights: StoreInsights,
  type: InsightReportType,
) {
  const createdAt = new Date().toISOString();
  const movementScope = movementQueryScope(store, insights.filters, insights.period.start, insights.period.end);
  const recentMovements = await db.getAllAsync<Pick<InsightMovementRecord, "productName" | "type" | "delta" | "unit" | "reason" | "createdAt">>(
    `SELECT products.name AS productName, products.unit,
       stock_movements.movement_type AS type, stock_movements.delta,
       stock_movements.reason, stock_movements.created_at AS createdAt
     FROM stock_movements
     INNER JOIN products ON products.id = stock_movements.product_id
       AND products.business_id = stock_movements.business_id AND products.store_id = stock_movements.store_id
     WHERE ${movementScope.where}
     ORDER BY stock_movements.created_at DESC LIMIT 8`,
    ...movementScope.params,
  );
  const report: InsightReport = {
    id: createId("report"),
    type,
    title: reportTitles[type],
    periodLabel: insights.period.label,
    storeName: insights.scopeLabel,
    filters: insights.filters,
    createdAt,
    summary: {
      health: insights.health,
      inventory: insights.inventory,
      movement: insights.movement,
      previousMovement: insights.previousMovement,
      revenue: insights.revenue,
      previousRevenue: insights.previousRevenue,
      previousMonthHealth: insights.previousMonthHealth,
      comparisonLabel: insights.period.comparisonLabel,
      topMoving: insights.products.topMoving.slice(0, 5).map(({ name, stockOut, unit }) => ({ name, stockOut, unit })),
      slowMoving: insights.products.slowMoving.slice(0, 5).map(({ name, stockOut, previousStockOut, unit }) => ({ name, stockOut, previousStockOut, unit })),
      noMovement: insights.products.noMovement.slice(0, 10).map(({ name, unit, lastMovementAt }) => ({ name, unit, lastMovementAt })),
      lowProducts: insights.products.low.map(({ name, quantity, reorderLevel, unit }) => ({ name, quantity, reorderLevel, unit })),
      criticalProducts: insights.products.critical.map(({ name, quantity, reorderLevel, unit }) => ({ name, quantity, reorderLevel, unit })),
      categories: insights.categories.map(({ category, products, stockIn, stockOut, net }) => ({ category, products, stockIn, stockOut, net })),
      recentMovements: recentMovements.map(({ productName, type, delta, unit, reason, createdAt: movementAt }) => ({
        productName,
        type,
        delta,
        unit,
        reason,
        createdAt: movementAt,
      })),
      noMovementCount: insights.products.noMovementCount,
      topSelling: insights.topSelling,
      salesByDay: insights.salesByDay,
      salesByWeek: insights.salesByWeek,
      salesByStore: insights.salesByStore,
    },
  };
  await db.runAsync(
    `INSERT INTO insight_snapshots (id, business_id, store_id, kind, payload_json, source_updated_at, created_at)
     SELECT ?, ?, ?, 'report', ?, ?, ?
     WHERE EXISTS (
       SELECT 1 FROM stores WHERE stores.id = ? AND stores.business_id = ? AND stores.status = 'active'
     )`,
    report.id,
    store.businessId,
    store.storeId,
    JSON.stringify(report),
    insights.period.end,
    createdAt,
    store.storeId,
    store.businessId,
  );
  return report;
}

export async function getInsightReportHistory(db: InsightsDatabase, store: StoreScope) {
  const rows = await db.getAllAsync<{ payloadJson: string }>(
    `SELECT payload_json AS payloadJson
     FROM insight_snapshots
     WHERE business_id = ? AND store_id = ? AND kind = 'report'
       AND EXISTS (
         SELECT 1 FROM stores
         WHERE stores.id = insight_snapshots.store_id
           AND stores.business_id = insight_snapshots.business_id
           AND stores.status = 'active'
       )
     ORDER BY created_at DESC LIMIT 20`,
    store.businessId,
    store.storeId,
  );
  const reports: InsightReport[] = [];
  for (const row of rows) {
    try {
      const report = JSON.parse(row.payloadJson) as InsightReport;
      if (
        report.id && report.title && report.createdAt && report.summary?.health &&
        report.summary.movement && Array.isArray(report.summary.recentMovements)
      ) reports.push(report);
    } catch {
      // Ignore malformed local report snapshots.
    }
  }
  return reports;
}

function csvCell(value: string | number | null | undefined) {
  let text = String(value ?? "");
  if (typeof value === "string" && /^[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function createInsightsCsv(db: InsightsDatabase, store: StoreScope, insights: StoreInsights) {
  const movementScope = movementQueryScope(store, insights.filters, insights.period.start, insights.period.end);
  const movements = await db.getAllAsync<InsightMovementRecord>(
    `SELECT stock_movements.id,
       products.name AS productName,
       products.sku,
       products.unit,
       stock_movements.movement_type AS type,
       stock_movements.delta,
       stock_movements.quantity_before AS quantityBefore,
       stock_movements.quantity_after AS quantityAfter,
       stock_movements.reason,
       stock_movements.reference,
       stock_movements.note,
       stock_movements.created_at AS createdAt
     FROM stock_movements
     INNER JOIN products ON products.id = stock_movements.product_id
       AND products.business_id = stock_movements.business_id AND products.store_id = stock_movements.store_id
     WHERE ${movementScope.where}
     ORDER BY stock_movements.created_at DESC, stock_movements.id DESC`,
    ...movementScope.params,
  );
  const rows: Array<Array<string | number | null>> = [
    ["StockPilot Inventory Report", insights.scopeLabel],
    ["Period", insights.period.label],
    ["Store Scope", insights.scopeLabel],
    ["Category Filter", insights.filters.category ?? "All categories"],
    ["Product Filter", insights.filters.productQuery || "All products"],
    [],
    ["Inventory Health", "Products"],
    ["Total Products", insights.health.total],
    ["Total Units", insights.inventory.totalUnits],
    ["Healthy", insights.health.healthy],
    ["Low Stock", insights.health.low],
    ["Out of Stock", insights.health.outOfStock],
    [],
    ["Inventory Valuation", "Amount"],
    ["Inventory Cost Value", insights.inventory.costValue],
    ["Inventory Retail Value", insights.inventory.sellingValue],
    ["Potential Gross Profit", insights.inventory.potentialGrossMargin],
    ["Products Missing Cost Price", insights.inventory.missingCostPrices],
    ["Products Missing Selling Price", insights.inventory.missingSellingPrices],
    [],
    ["Stock Movement", "Quantity"],
    ["Stock In", insights.movement.stockIn],
    ["Stock Out", insights.movement.stockOut],
    ["Adjustments", insights.movement.adjustments],
    ["Net Movement", insights.movement.net],
    [],
    ["Sales Analytics", "Value"],
    ["Sales Revenue", insights.revenue.total],
    ["Completed Sales", insights.revenue.transactions],
    ["Items Sold", insights.revenue.unitsSold],
    ["Average Transaction Value", insights.revenue.averageTransactionValue],
    [],
    ["Sales by Day", "Day", "Sales Revenue", "Completed Sales", "Items Sold"],
    ...insights.salesByDay.map((point) => [point.label, point.periodKey, point.revenue, point.transactions, point.unitsSold]),
    [],
    ["Sales by Week", "Week", "Sales Revenue", "Completed Sales", "Items Sold"],
    ...insights.salesByWeek.map((point) => [point.label, point.periodKey, point.revenue, point.transactions, point.unitsSold]),
    [],
    ["Sales by Month", "Month", "Sales Revenue", "Completed Sales", "Items Sold"],
    ...insights.monthlyRevenue.map((month) => [month.label, month.monthKey, month.revenue, month.transactions, month.unitsSold]),
    [],
    ["Sales by Store", "Store", "Sales Revenue", "Completed Sales", "Items Sold"],
    ...insights.salesByStore.map((item) => [item.storeName, item.storeId, item.grossSales, item.transactions, item.unitsSold]),
    [],
    ["Top Selling Products", "Items Sold", "Revenue", "Transactions", "Unit"],
    ...insights.topSelling.map((product) => [product.name, product.unitsSold, product.revenue, product.transactions, product.unit]),
    [],
    ["Stock Movements", "Date", "Product", "SKU", "Type", "Change", "Before", "After", "Reason", "Reference", "Notes"],
    ...movements.map((movement) => [
      movement.createdAt,
      movement.productName,
      movement.sku,
      movement.type.replaceAll("_", " "),
      movement.delta,
      movement.quantityBefore,
      movement.quantityAfter,
      movement.reason,
      movement.reference,
      movement.note,
    ]),
    [],
    ["Category Performance", "Products", "Stock In", "Stock Out", "Net"],
    ...insights.categories.map((category) => [
      category.category,
      category.products,
      category.stockIn,
      category.stockOut,
      category.net,
    ]),
    [],
    ["Top Stock Movement Products", "Stock Out", "Unit"],
    ...insights.products.topMoving.map((product) => [product.name, product.stockOut, product.unit]),
    [],
    ["Low Stock", "Current Stock", "Reorder Level", "Unit"],
    ...insights.products.low.map((product) => [product.name, product.quantity, product.reorderLevel, product.unit]),
    [],
    ["Out of Stock Products", "Current Stock", "Reorder Level", "Unit"],
    ...insights.products.critical.map((product) => [product.name, product.quantity, product.reorderLevel, product.unit]),
  ];
  return rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export const insightReportOptions: Array<{ type: InsightReportType; description: string }> = [
  { type: "monthly", description: "Health, valuation, movement, and sales for the selected period." },
  { type: "movement", description: "Stock In, Stock Out, and adjustments." },
  { type: "performance", description: "Top-selling products and stock movement." },
  { type: "low_stock", description: "Products at or below their reorder level." },
  { type: "critical_stock", description: "Products with zero available stock." },
  { type: "slow_moving", description: "Products with the least outgoing movement." },
  { type: "category", description: "Movement and stock health by catalog category." },
  { type: "custom", description: "A summary for the selected date range." },
];

export function getInsightReportTitle(type: InsightReportType) {
  return reportTitles[type];
}
