import {
  Lightbulb,
  Package,
  Store,
  Zap,
  type LucideIcon,
} from "lucide-react-native";

import type { ThemeColors } from "@/theme/tokens";
import { ownerNameSchema } from "@/validation/store.validation";

import type { StoreForm } from "./steps/types";

export const mascotVideo = require("../../../assets/mascot-clean.mp4");
export { ownerNameSchema };

export function getFeatures(colors: ThemeColors): Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  background: string;
}> {
  return [
    {
      title: "Multiple Stores",
      description: "Manage all your stores independently.",
      icon: Store,
      color: colors.primary[600],
      background: colors.primary[50],
    },
    {
      title: "Track Inventory",
      description: "Know what's in stock, low, or out of stock.",
      icon: Package,
      color: colors.semantic.success,
      background: colors.semantic.successBackground,
    },
    {
      title: "Get Insights",
      description: "See helpful insights to make better decisions.",
      icon: Lightbulb,
      color: colors.semantic.warning,
      background: colors.semantic.warningBackground,
    },
    {
      title: "Work Offline",
      description: "Your data stays on your device, always.",
      icon: Zap,
      color: colors.semantic.info,
      background: colors.semantic.infoBackground,
    },
  ];
}

export const nextSteps = [
  "Create your first store",
  "Add your items",
  "Start managing your inventory",
];

export const initialStoreForm: StoreForm = {
  name: "",
  code: "",
  storeType: "retail",
  customStoreType: "",
  currencyMode: "iso",
  currencyCode: "PHP",
  customCurrencyName: "",
  customCurrencySymbol: "",
  currencyDecimalPlaces: 2,
  addressLine1: "",
  addressLine2: "",
  barangay: "",
  city: "",
  provinceState: "",
  postalCode: "",
  countryCode: "PH",
};

export const storeTypeOptions: Array<{
  value: NonNullable<StoreForm["storeType"]>;
  label: string;
}> = [
  { value: "retail", label: "Retail" },
  { value: "grocery", label: "Grocery" },
  { value: "convenience", label: "Convenience" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "hardware", label: "Hardware" },
  { value: "apparel", label: "Apparel" },
  { value: "electronics", label: "Electronics" },
  { value: "food_beverage", label: "Food & beverage" },
  { value: "wholesale", label: "Wholesale" },
  { value: "warehouse", label: "Warehouse" },
  { value: "other", label: "Other" },
];

export const decimalPlaceOptions = [0, 1, 2, 3, 4];
