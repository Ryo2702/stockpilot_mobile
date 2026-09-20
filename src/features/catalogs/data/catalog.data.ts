import {
  CupSoda,
  House,
  Package,
  Pill,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Tag,
  Utensils,
  Wrench,
  type LucideIcon,
} from "lucide-react-native";

import {
  catalogCategoryValues,
  type CatalogCategory,
} from "@/domain/catalog";

export type CatalogCategoryOption = {
  value: CatalogCategory;
  label: string;
  icon: LucideIcon;
};

const categoryOptions: Record<CatalogCategory, CatalogCategoryOption> = {
  grocery: { value: "grocery", label: "Grocery & pantry", icon: ShoppingBasket },
  beverages: { value: "beverages", label: "Beverages", icon: CupSoda },
  food_beverage: { value: "food_beverage", label: "Prepared food", icon: Utensils },
  health_beauty: { value: "health_beauty", label: "Health & beauty", icon: Pill },
  household: { value: "household", label: "Household", icon: House },
  apparel: { value: "apparel", label: "Apparel", icon: Shirt },
  accessories: { value: "accessories", label: "Accessories", icon: Tag },
  electronics: { value: "electronics", label: "Electronics", icon: Smartphone },
  hardware: { value: "hardware", label: "Hardware", icon: Wrench },
  other: { value: "other", label: "Other", icon: Package },
};

export const catalogCategoryOptions = catalogCategoryValues.map(
  (category) => categoryOptions[category],
);

export function getCatalogCategoryOption(category: CatalogCategory) {
  return categoryOptions[category];
}
