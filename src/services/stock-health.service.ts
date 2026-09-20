export type StoreStockHealthState = "empty" | "healthy" | "warning" | "critical";

export type StoreStockHealthCounts = {
  productCount: number;
  lowStockCount: number;
  criticalCount: number;
};

export function getStoreStockHealthState({
  productCount,
  lowStockCount,
  criticalCount,
}: StoreStockHealthCounts): StoreStockHealthState {
  if (productCount <= 0) return "empty";
  if (criticalCount / productCount >= 0.2) return "critical";
  if (lowStockCount / productCount >= 0.2) return "warning";
  return "healthy";
}
