import type { SQLiteDatabase } from "expo-sqlite";

import type { CatalogCategory } from "@/domain/catalog";
import type { CurrencySettings } from "@/domain/currency";
import type { ProductStockStatus } from "@/domain/product";
import type { NamedStoreScope } from "@/domain/store";

export type InsightsDatabase = Pick<SQLiteDatabase, "getAllAsync" | "getFirstAsync" | "runAsync">;
export type StoreScope = NamedStoreScope;

export const insightPeriods = [
  "today",
  "7_days",
  "30_days",
  "this_month",
  "last_month",
  "3_months",
  "6_months",
  "this_year",
  "custom",
] as const;

export type InsightPeriod = (typeof insightPeriods)[number];
export type InsightCustomRange = { start: string; end: string };
export type InsightReportType =
  | "monthly"
  | "movement"
  | "performance"
  | "low_stock"
  | "critical_stock"
  | "slow_moving"
  | "category"
  | "custom";

export type InsightHealth = {
  total: number;
  healthy: number;
  low: number;
  critical: number;
};

export type InsightMovementSummary = {
  stockIn: number;
  stockOut: number;
  adjustments: number;
  net: number;
};

export type InsightRevenueSummary = {
  total: number;
  transactions: number;
};

export type InsightProduct = {
  id: string;
  name: string;
  sku: string | null;
  createdAt: string;
  category: CatalogCategory;
  unit: string;
  quantity: number;
  reorderLevel: number;
  criticalLevel: number;
  stockStatus: ProductStockStatus;
  stockIn: number;
  stockOut: number;
  previousStockOut: number;
  adjustment: number;
  net: number;
  movementsLast30Days: number;
  stockOutLast30Days: number;
  averageDailyOut: number | null;
  lastMovementAt: string | null;
  estimatedDaysRemaining: number | null;
  recommendedRestock: number | null;
};

export type InsightCategory = {
  category: CatalogCategory;
  products: number;
  healthy: number;
  low: number;
  critical: number;
  stockIn: number;
  stockOut: number;
  net: number;
  topMovingProduct: string | null;
  slowestProduct: string | null;
  monthlyMovement: MonthlyMovement[];
};

export type MonthlyMovement = {
  monthKey: string;
  label: string;
  stockIn: number;
  stockOut: number;
  net: number;
};

export type MonthlyRevenue = {
  monthKey: string;
  label: string;
  revenue: number;
  transactions: number;
};

export type MonthlyHealthSnapshot = InsightHealth & {
  monthKey: string;
  capturedAt: string;
};

export type InsightMovementRecord = {
  id: string;
  productName: string;
  sku: string | null;
  unit: string;
  type: "stock_in" | "stock_out" | "adjustment";
  delta: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  reference: string | null;
  note: string | null;
  createdAt: string;
};

export type InsightPeriodInfo = {
  period: InsightPeriod;
  label: string;
  comparisonLabel: string;
  start: string;
  end: string;
  previousStart: string;
  previousEnd: string;
  days: number;
};

export type StoreInsights = {
  currency: CurrencySettings;
  period: InsightPeriodInfo;
  health: InsightHealth;
  hasMovementHistory: boolean;
  previousMonthHealth: MonthlyHealthSnapshot | null;
  movement: InsightMovementSummary;
  previousMovement: InsightMovementSummary;
  revenue: InsightRevenueSummary;
  previousRevenue: InsightRevenueSummary;
  products: {
    topMoving: InsightProduct[];
    slowMoving: InsightProduct[];
    largestIncreases: InsightProduct[];
    largestDecreases: InsightProduct[];
    noMovement: InsightProduct[];
    noMovementCount: number;
    critical: InsightProduct[];
    low: InsightProduct[];
  };
  categories: InsightCategory[];
  monthlyMovement: MonthlyMovement[];
  monthlyRevenue: MonthlyRevenue[];
  monthlyHealth: MonthlyHealthSnapshot[];
};

export type InsightReport = {
  id: string;
  type: InsightReportType;
  title: string;
  periodLabel: string;
  storeName: string;
  createdAt: string;
  summary: {
    health: InsightHealth;
    movement: InsightMovementSummary;
    previousMovement: InsightMovementSummary;
    revenue?: InsightRevenueSummary;
    previousRevenue?: InsightRevenueSummary;
    previousMonthHealth: InsightHealth | null;
    comparisonLabel: string;
    topMoving: Array<Pick<InsightProduct, "name" | "stockOut" | "unit">>;
    slowMoving: Array<Pick<InsightProduct, "name" | "stockOut" | "previousStockOut" | "unit">>;
    noMovement: Array<Pick<InsightProduct, "name" | "unit" | "lastMovementAt">>;
    lowProducts: Array<Pick<InsightProduct, "name" | "quantity" | "reorderLevel" | "unit">>;
    criticalProducts: Array<Pick<InsightProduct, "name" | "quantity" | "reorderLevel" | "unit">>;
    categories: Array<Pick<InsightCategory, "category" | "products" | "stockIn" | "stockOut" | "net">>;
    recentMovements: Array<Pick<InsightMovementRecord, "productName" | "type" | "delta" | "unit" | "reason" | "createdAt">>;
    noMovementCount: number;
  };
};
