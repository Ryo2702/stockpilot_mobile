export type CurrencySettings = {
  currencyMode: "iso" | "custom";
  currencyCode?: string | null;
  customCurrencySymbol?: string | null;
  currencyDecimalPlaces: number;
};

type CurrencySymbolSource = Pick<
  CurrencySettings,
  "currencyMode" | "currencyCode" | "customCurrencySymbol"
>;

export function getCurrencySymbol(currency: CurrencySymbolSource) {
  if (currency.currencyMode === "custom") return currency.customCurrencySymbol || "¤";

  const code = currency.currencyCode?.trim().toUpperCase() || "PHP";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0).find(({ type }) => type === "currency")?.value ?? code;
  } catch {
    return code;
  }
}

export function formatCurrency(value: number, currency: CurrencySettings) {
  const digits = currency.currencyDecimalPlaces;
  if (currency.currencyMode === "iso") {
    const code = currency.currencyCode?.trim().toUpperCase() || "PHP";
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: code,
        currencyDisplay: "narrowSymbol",
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(value);
    } catch {
      // Fall back to the selected code if the runtime does not recognize it.
    }
  }
  return `${getCurrencySymbol(currency)}${value.toFixed(digits)}`;
}
