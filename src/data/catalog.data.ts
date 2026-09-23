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

export const productUnitOptions = [
  { value: "ea", label: "Each (ea)" },
  { value: "pc", label: "Piece (pc)" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
  { value: "lb", label: "Pound (lb)" },
  { value: "oz", label: "Ounce (oz)" },
  { value: "L", label: "Liter (L)" },
  { value: "mL", label: "Milliliter (mL)" },
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
  { value: "case", label: "Case" },
  { value: "bottle", label: "Bottle" },
  { value: "can", label: "Can" },
  { value: "bag", label: "Bag" },
  { value: "roll", label: "Roll" },
  { value: "pair", label: "Pair" },
  { value: "dozen", label: "Dozen" },
];

export function getCatalogCategoryOption(category: CatalogCategory) {
  return categoryOptions[category];
}
