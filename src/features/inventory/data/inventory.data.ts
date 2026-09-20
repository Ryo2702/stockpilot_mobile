import type {
  InventoryMovementFilter,
  InventoryMovementPeriod,
  InventorySort,
  InventoryStatus,
} from "@/domain/inventory";
import type { StockAdjustmentInput } from "@/validation/inventory.validation";

export const inventoryStatusOptions: Array<{ value: InventoryStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "healthy", label: "Healthy" },
  { value: "low", label: "Low" },
  { value: "critical", label: "Critical" },
];

export const inventorySortOptions: Array<{ value: InventorySort; label: string }> = [
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "quantity_asc", label: "Quantity: Low to High" },
  { value: "quantity_desc", label: "Quantity: High to Low" },
  { value: "updated_desc", label: "Recently Updated" },
  { value: "reorder_urgency", label: "Reorder Urgency" },
];

export const quantityFilterOptions = [
  { value: "any", label: "Any" },
  { value: "in_stock", label: "In Stock" },
  { value: "zero_stock", label: "Zero Stock" },
] as const;

export const movementFilterOptions: Array<{ value: InventoryMovementFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "stock_in", label: "Stock In" },
  { value: "stock_out", label: "Stock Out" },
  { value: "adjustment", label: "Adjustments" },
];

export const movementPeriodOptions: Array<{ value: InventoryMovementPeriod; label: string }> = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7_days", label: "7 Days" },
  { value: "30_days", label: "30 Days" },
];

type AdjustmentType = StockAdjustmentInput["type"];

export const adjustmentTypeOptions: Array<{ value: AdjustmentType; label: string }> = [
  { value: "stock_in", label: "Stock In" },
  { value: "stock_out", label: "Stock Out" },
  { value: "set_current_stock", label: "Set Current Stock" },
];

export const adjustmentReasons: Record<AdjustmentType, Array<{ value: string; label: string }>> = {
  stock_in: [
    { value: "purchase", label: "Purchase" },
    { value: "supplier_delivery", label: "Supplier Delivery" },
    { value: "returned_item", label: "Returned Item" },
    { value: "correction", label: "Correction" },
    { value: "opening_stock", label: "Opening Stock" },
    { value: "other", label: "Other" },
  ],
  stock_out: [
    { value: "sale", label: "Sale" },
    { value: "damaged", label: "Damaged" },
    { value: "expired", label: "Expired" },
    { value: "lost", label: "Lost" },
    { value: "internal_use", label: "Internal Use" },
    { value: "correction", label: "Correction" },
    { value: "other", label: "Other" },
  ],
  set_current_stock: [
    { value: "physical_count", label: "Physical Count" },
    { value: "correction", label: "Correction" },
  ],
};

export function formatInventoryReason(reason: string) {
  const labels: Record<string, string> = {
    initial: "Opening Stock",
    csv_import: "Import",
    physical_count: "Physical Count",
    returned_item: "Returned Item",
    supplier_delivery: "Supplier Delivery",
    internal_use: "Internal Use",
  };
  return labels[reason] ?? reason.replaceAll("_", " ").replace(/^./, (first) => first.toUpperCase());
}

export function getInventorySortLabel(sort: InventorySort) {
  return inventorySortOptions.find((option) => option.value === sort)?.label ?? "Name A–Z";
}
