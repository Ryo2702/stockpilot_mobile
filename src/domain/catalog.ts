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
