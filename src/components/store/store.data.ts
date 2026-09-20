import { getCurrencySymbol } from "@/domain/currency";

import type { StoreForm } from "./store.types";

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

export const storeTypeOptions: Array<{ value: NonNullable<StoreForm["storeType"]>; label: string }> = [
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

export const currencyModeOptions: Array<{
  value: NonNullable<StoreForm["currencyMode"]>;
  label: string;
}> = [
  { value: "iso", label: "Standard currency" },
  { value: "custom", label: "Custom currency" },
];

const fallbackCurrencyCodes = [
  "PHP", "USD", "EUR", "GBP", "JPY", "CNY", "CAD", "AUD", "SGD", "NZD", "HKD", "INR", "KRW", "THB", "MYR",
  "IDR", "VND", "TWD", "BND", "AED", "SAR", "CHF", "SEK", "NOK", "DKK", "PLN", "TRY", "ZAR", "BRL", "MXN",
];

// ponytail: Use common codes when supportedValuesOf is missing; add codes as users need them.
const currencyIntl = Intl as typeof Intl & { supportedValuesOf?: (key: "currency") => string[] };
const currencyCodes = currencyIntl.supportedValuesOf?.("currency") ?? fallbackCurrencyCodes;

export const currencyOptions = [...new Set(["PHP", ...currencyCodes])].map((value) => ({
  value,
  label: `${value} (${getCurrencySymbol({ currencyMode: "iso", currencyCode: value })})`,
}));

export const decimalPlaceOptions = [0, 1, 2, 3, 4];
