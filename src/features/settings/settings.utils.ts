import Constants from "expo-constants";

import {
  currencyOptions,
  storeTypeOptions,
} from "@/components/store/store.data";
import { productUnitOptions } from "@/data/catalog.data";
import { getCurrencySymbol } from "@/domain/currency";
import type { StoreForm } from "@/components/store/store.types";
import type { ThemePreference } from "@/theme/tokens";

export const themeLabels: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};
export const version = Constants.expoConfig?.version ?? "2.0.0";
export const build = Constants.nativeBuildVersion ?? "Development";
const currencyDisplayNames = (() => {
  try {
    return new Intl.DisplayNames(undefined, { type: "currency" });
  } catch {
    return null;
  }
})();

export function currencyOptionLabel(value: string, fallback: string) {
  const name = currencyDisplayNames?.of(value);
  const symbol = getCurrencySymbol({
    currencyMode: "iso",
    currencyCode: value,
  });
  return name && name.toUpperCase() !== value
    ? name + " (" + value + " · " + symbol + ")"
    : fallback;
}

export function formatBytes(value: number) {
  if (!Number.isFinite(value) || value < 0) return "Unavailable";
  if (value < 1024) return Math.round(value) + " bytes";
  const units = ["KB", "MB", "GB"];
  let size = value / 1024;
  let unit = units[0];
  for (let index = 1; size >= 1024 && index < units.length; index += 1) {
    size /= 1024;
    unit = units[index];
  }
  return size.toFixed(size >= 10 ? 1 : 2) + " " + unit;
}

export function formatDateTime(timestamp: number | null | undefined) {
  if (!timestamp) return "Date unavailable";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  const day = new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
  return day + " · " + time;
}

export function backupDateFromName(name: string) {
  const match =
    /^stockpilot-backup-(\d{4}-\d{2}-\d{2})-(\d{2})-(\d{2})-(\d{2})(?:-(\d{3}))?\.spbackup$/i.exec(
      name,
    );
  if (!match) return null;
  const date = new Date(
    match[1] +
      "T" +
      match[2] +
      ":" +
      match[3] +
      ":" +
      match[4] +
      "." +
      (match[5] ?? "000"),
  );
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

export function getUnitLabel(value: string) {
  return (
    productUnitOptions.find((option) => option.value === value)?.label ?? value
  );
}

export function getStoreTypeLabel(value?: string) {
  return (
    storeTypeOptions.find((option) => option.value === value)?.label ?? "Other"
  );
}

export function getCurrencyLabel(form: StoreForm) {
  if (form.currencyMode === "custom") {
    const name = form.customCurrencyName?.trim() || "Custom currency";
    const symbol = form.customCurrencySymbol?.trim();
    return symbol ? name + " (" + symbol + ")" : name;
  }
  const code = form.currencyCode?.trim().toUpperCase() || "PHP";
  const option = currencyOptions.find((item) => item.value === code);
  return option ? currencyOptionLabel(option.value, option.label) : code;
}
