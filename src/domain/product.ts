import type { CatalogCategory } from "./catalog";

export type ProductStockStatus = "healthy" | "low" | "critical";

export type ProductSort = "name_asc" | "name_desc" | "stock_asc" | "stock_desc" | "updated_desc";

export type ProductStockFilter = ProductStockStatus | "all";

export type Product = {
  id: string;
  businessId: string;
  storeId: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  category: CatalogCategory;
  unit: string;
  currentPrice: number | null;
  reorderLevel: number;
  criticalLevel: number;
  notes: string | null;
  quantity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductStockMovement = {
  id: string;
  delta: number;
  quantityBefore: number;
  quantityAfter: number;
  reason: string;
  note: string | null;
  createdAt: string;
};

export function getProductStockStatus(quantity: number, reorderLevel: number): ProductStockStatus {
  if (quantity <= 0) return "critical";
  if (quantity <= reorderLevel) return "low";
  return "healthy";
}
