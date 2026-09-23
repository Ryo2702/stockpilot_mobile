import * as SecureStore from "expo-secure-store";
import type { SQLiteDatabase } from "expo-sqlite";
import { Platform } from "react-native";

import { isValidPin } from "@/validation/pin.validation";

type SettingsDatabase = Pick<SQLiteDatabase, "getFirstAsync" | "runAsync">;

export type ThemePreference = "light" | "dark" | "system";
export type ActiveStoreSelection = { businessId: string; storeId: string };
const APP_PIN_KEY = "stockpilot.app.pin";

async function readSetting(db: SettingsDatabase, key: string): Promise<unknown> {
  const row = await db.getFirstAsync<{ valueJson: string }>(
    "SELECT value_json AS valueJson FROM settings WHERE key = ?",
    key,
  );
  if (!row) return null;
  try {
    return JSON.parse(row.valueJson) as unknown;
  } catch {
    return null;
  }
}

async function writeSetting(db: SettingsDatabase, key: string, value: unknown) {
  await db.runAsync(
    `INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at`,
    key,
    JSON.stringify(value),
    new Date().toISOString(),
  );
}

export async function getThemePreference(db: SettingsDatabase): Promise<ThemePreference> {
  const preference = await readSetting(db, "appearance");
  return preference === "light" || preference === "dark" || preference === "system"
    ? preference
    : "system";
}

export async function saveThemePreference(
  db: SettingsDatabase,
  preference: ThemePreference,
) {
  await writeSetting(db, "appearance", preference);
}

export async function getActiveStoreSelection(db: SettingsDatabase) {
  const value = await readSetting(db, "active_store");
  if (
    value &&
    typeof value === "object" &&
    "businessId" in value && typeof value.businessId === "string" &&
    "storeId" in value && typeof value.storeId === "string"
  ) {
    return value as ActiveStoreSelection;
  }
  return null;
}

export async function saveActiveStoreSelection(
  db: SettingsDatabase,
  selection: ActiveStoreSelection | null,
) {
  if (selection) {
    await writeSetting(db, "active_store", selection);
  } else {
    await db.runAsync("DELETE FROM settings WHERE key = ?", "active_store");
  }
}

export async function getAppPin(db: SettingsDatabase): Promise<string | null> {
  const value = Platform.OS !== "web" && await SecureStore.isAvailableAsync()
    ? await SecureStore.getItemAsync(APP_PIN_KEY)
    : await readSetting(db, "app_pin");
  return typeof value === "string" && isValidPin(value) ? value : null;
}

export async function saveAppPin(db: SettingsDatabase, pin: string) {
  if (!isValidPin(pin)) throw new Error("PIN must be 4 to 6 digits.");

  if (Platform.OS !== "web" && await SecureStore.isAvailableAsync()) {
    await SecureStore.setItemAsync(APP_PIN_KEY, pin);
    return;
  }

  // ponytail: web fallback keeps the PIN in local SQLite; use Web Crypto if web threat model requires stronger storage.
  await writeSetting(db, "app_pin", pin);
}
