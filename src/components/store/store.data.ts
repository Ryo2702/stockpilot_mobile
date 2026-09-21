import type { ImageSourcePropType } from "react-native";

import { getCurrencySymbol } from "@/domain/currency";

import type { StoreForm } from "./store.types";
import type { OwnerStoreDetails } from "@/services/owner-store.service";

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

export function toStoreForm(store: OwnerStoreDetails): StoreForm {
  return {
    ...initialStoreForm,
    name: store.name,
    code: store.code ?? "",
    storeType: store.storeType,
    customStoreType: store.customStoreType ?? "",
    currencyMode: store.currencyMode,
    currencyCode: store.currencyCode ?? "",
    customCurrencyName: store.customCurrencyName ?? "",
    customCurrencySymbol: store.customCurrencySymbol ?? "",
    currencyDecimalPlaces: store.currencyDecimalPlaces,
    addressLine1: store.addressLine1 ?? "",
    addressLine2: store.addressLine2 ?? "",
    barangay: store.barangay ?? "",
    city: store.city ?? "",
    provinceState: store.provinceState ?? "",
    postalCode: store.postalCode ?? "",
    countryCode: store.countryCode ?? "",
    status: store.status,
  };
}

export const storeTypeOptions: Array<{
  value: NonNullable<StoreForm["storeType"]>;
  label: string;
  image: ImageSourcePropType;
}> = [
  { value: "retail", label: "Retail", image: require("../../../assets/images/stockpilot/store-types/01_retail.png") },
  { value: "grocery", label: "Grocery", image: require("../../../assets/images/stockpilot/store-types/02_grocery.png") },
  { value: "mini_store", label: "Mini Store", image: require("../../../assets/images/stockpilot/store-types/03_mini_store.png") },
  { value: "convenience", label: "Convenience Store", image: require("../../../assets/images/stockpilot/store-types/04_convenience_store.png") },
  { value: "cafe_shop", label: "Cafe Shop", image: require("../../../assets/images/stockpilot/store-types/05_cafe_shop.png") },
  { value: "motor_shop", label: "Motor Shop", image: require("../../../assets/images/stockpilot/store-types/06_motor_shop.png") },
  { value: "pharmacy", label: "Pharmacy", image: require("../../../assets/images/stockpilot/store-types/07_pharmacy.png") },
  { value: "hardware", label: "Hardware", image: require("../../../assets/images/stockpilot/store-types/08_hardware.png") },
  { value: "apparel", label: "Apparel", image: require("../../../assets/images/stockpilot/store-types/09_apparel.png") },
  { value: "electronics", label: "Electronics", image: require("../../../assets/images/stockpilot/store-types/10_electronics.png") },
  { value: "food_beverage", label: "Food & beverage", image: require("../../../assets/images/stockpilot/store-types/11_food_and_beverage.png") },
  { value: "wholesale", label: "Wholesale", image: require("../../../assets/images/stockpilot/store-types/12_wholesale.png") },
  { value: "warehouse", label: "Warehouse", image: require("../../../assets/images/stockpilot/store-types/13_warehouse.png") },
  { value: "other", label: "Other", image: require("../../../assets/images/stockpilot/store-types/14_other.png") },
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

const countryDisplayNames =
  typeof Intl.DisplayNames === "function"
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : undefined;
const countryCodes = [
  "AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ",
  "CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO",
  "FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT",
  "JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM",
  "MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR",
  "PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH",
  "TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW",
].join(" ").split(" ");
export const countryCodeOptions = countryCodes
  .map((value) => ({
    value,
    label: `${countryDisplayNames?.of(value) ?? value} (${value})`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label));

export const decimalPlaceOptions = [0, 1, 2, 3, 4];
