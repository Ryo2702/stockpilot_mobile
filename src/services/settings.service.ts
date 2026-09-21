import type { SQLiteDatabase } from "expo-sqlite";

type SettingsDatabase = Pick<SQLiteDatabase, "getFirstAsync" | "runAsync">;

export type ThemePreference = "light" | "dark" | "system";
export type ActiveStoreSelection = { businessId: string; storeId: string };
export const TRIAL_DURATION_DAYS = 3;

const trialExpirationKey = "trial_expires_at";
const millisecondsPerDay = 24 * 60 * 60 * 1000;

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

// ponytail: local expiry resets with app data or backups; use server entitlement for tamper-proof gating.
export async function getOrCreateTrialExpiration(db: SettingsDatabase) {
  const savedExpiration = await readSetting(db, trialExpirationKey);
  if (typeof savedExpiration === "number" && Number.isSafeInteger(savedExpiration)) {
    return savedExpiration;
  }

  const expiration = Date.now() + TRIAL_DURATION_DAYS * millisecondsPerDay;
  await writeSetting(db, trialExpirationKey, expiration);
  return expiration;
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
