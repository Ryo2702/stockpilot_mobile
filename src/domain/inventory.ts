import type { CatalogCategory } from "./catalog";
import type { ProductStockStatus } from "./product";

export type InventoryStatus = ProductStockStatus;
export const inventorySortValues = [
  "name_asc",
  "name_desc",
  "quantity_asc",
  "quantity_desc",
  "updated_desc",
  "reorder_urgency",
] as const;
export type InventorySort = (typeof inventorySortValues)[number];
export type InventoryQuantityFilter = "any" | "in_stock" | "zero_stock";
export type InventoryMovementType = "stock_in" | "stock_out" | "adjustment";
export type InventoryMovementFilter = "all" | InventoryMovementType;
export type InventoryMovementPeriod = "all" | "today" | "7_days" | "30_days";

export type InventoryItem = {
  id: string;
  businessId: string;
  storeId: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: CatalogCategory;
  unit: string;
  quantity: number;
  reorderLevel: number;
  criticalLevel: number;
  isActive: boolean;
  updatedAt: string;
};

export type InventoryMovement = {
  id: string;
  productId: string;
  productName: string;
  sku: string | null;
  unit: string;
  type: InventoryMovementType;
  delta: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  reference: string | null;
  note: string | null;
  createdAt: string;
};

export type InventoryCounts = {
  total: number;
  healthy: number;
  low: number;
  critical: number;
};

export type InventoryMovementSummary = {
  stockIn: number;
  stockOut: number;
  adjustments: number;
};

export type InventoryPreferences = {
  defaultSort: InventorySort;
  defaultReorderLevel?: number;
  defaultUnit?: string;
};

export type InventoryListQuery = {
  search?: string;
  category?: CatalogCategory | null;
  stockStatus?: InventoryStatus | "all";
  quantity?: InventoryQuantityFilter;
  sort?: InventorySort;
  archived?: boolean;
  limit?: number;
  offset?: number;
};

export type InventoryMovementQuery = {
  search?: string;
  type?: InventoryMovementFilter;
  since?: string;
  productId?: string;
  limit?: number;
  offset?: number;
};
