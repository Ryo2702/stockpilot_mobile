import type { StoreType } from "@/validation/store.validation";

export const catalogCategoryValues = [
  "grocery",
  "beverages",
  "food_beverage",
  "health_beauty",
  "household",
  "apparel",
  "accessories",
  "electronics",
  "hardware",
  "other",
] as const;

export type CatalogCategory = (typeof catalogCategoryValues)[number];

const categoriesByStoreType: Record<StoreType, readonly CatalogCategory[]> = {
  retail: catalogCategoryValues,
  grocery: ["grocery", "beverages", "food_beverage", "household", "health_beauty", "other"],
  convenience: ["grocery", "beverages", "food_beverage", "health_beauty", "household", "other"],
  pharmacy: ["health_beauty", "grocery", "beverages", "other"],
  hardware: ["hardware", "household", "electronics", "other"],
  apparel: ["apparel", "accessories", "household", "other"],
  electronics: ["electronics", "accessories", "household", "other"],
  food_beverage: ["food_beverage", "beverages", "grocery", "household", "other"],
  wholesale: catalogCategoryValues,
  warehouse: catalogCategoryValues,
  other: catalogCategoryValues,
};

export function getCatalogCategoryValues(storeType: StoreType) {
  return categoriesByStoreType[storeType];
}
