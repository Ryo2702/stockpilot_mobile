import * as Crypto from "expo-crypto";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import type { SQLiteDatabase } from "expo-sqlite";
import { Platform } from "react-native";

import { securityQuestionById, type SecurityQuestionId } from "@/data/security-questions";
import { isValidPin } from "@/validation/pin.validation";

type SettingsDatabase = Pick<SQLiteDatabase, "getFirstAsync" | "runAsync">;

export type ThemePreference = "light" | "dark" | "system";
export type ActiveStoreSelection = { businessId: string; storeId: string };
export type SecurityRecoveryAnswer = { questionId: SecurityQuestionId; answer: string };
export type SecurityRecoveryQuestion = { questionId: SecurityQuestionId; label: string };
export type AppSecuritySettings = {
  fingerprintEnabled: boolean;
  recoveryQuestions: SecurityRecoveryQuestion[];
};
const APP_PIN_KEY = "stockpilot.app.pin";
const APP_SECURITY_KEY = "stockpilot.app.security";
const SECURITY_QUESTION_COUNT = 5;

type StoredSecurityQuestion = {
  questionId: SecurityQuestionId;
  salt: string;
  answerDigest: string;
};
type StoredAppSecuritySettings = {
  fingerprintEnabled: boolean;
  recoveryQuestions: StoredSecurityQuestion[];
};

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

async function canUseSecureStore() {
  return Platform.OS !== "web" && await SecureStore.isAvailableAsync();
}

function normalizeRecoveryAnswer(answer: string) {
  return answer.trim().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").toLowerCase();
}

function isStoredSecuritySettings(value: unknown): value is StoredAppSecuritySettings {
  if (!value || typeof value !== "object" || !("recoveryQuestions" in value)) return false;
  const settings = value as Partial<StoredAppSecuritySettings>;
  return typeof settings.fingerprintEnabled === "boolean"
    && Array.isArray(settings.recoveryQuestions)
    && settings.recoveryQuestions.every((question) => (
      question
      && typeof question === "object"
      && "questionId" in question
      && "salt" in question
      && "answerDigest" in question
      && typeof question.questionId === "string"
      && securityQuestionById.has(question.questionId as SecurityQuestionId)
      && typeof question.salt === "string"
      && typeof question.answerDigest === "string"
    ));
}

function publicSecuritySettings(settings: StoredAppSecuritySettings): AppSecuritySettings {
  return {
    fingerprintEnabled: settings.fingerprintEnabled,
    recoveryQuestions: settings.recoveryQuestions.map(({ questionId }) => ({
      questionId,
      label: securityQuestionById.get(questionId)?.label ?? "Security question",
    })),
  };
}

async function readStoredSecuritySettings(db: SettingsDatabase): Promise<StoredAppSecuritySettings> {
  const raw = await canUseSecureStore()
    ? await SecureStore.getItemAsync(APP_SECURITY_KEY)
    : await readSetting(db, "app_security");
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      parsed = null;
    }
  }
  return isStoredSecuritySettings(parsed)
    ? parsed
    : { fingerprintEnabled: false, recoveryQuestions: [] };
}

async function saveStoredSecuritySettings(db: SettingsDatabase, settings: StoredAppSecuritySettings) {
  if (await canUseSecureStore()) {
    await SecureStore.setItemAsync(APP_SECURITY_KEY, JSON.stringify(settings));
    return;
  }
  await writeSetting(db, "app_security", settings);
}

function validateRecoveryAnswers(answers: SecurityRecoveryAnswer[]) {
  if (answers.length !== SECURITY_QUESTION_COUNT) {
    throw new Error(`Choose and answer all ${SECURITY_QUESTION_COUNT} security questions.`);
  }
  const ids = new Set<string>();
  for (const { questionId, answer } of answers) {
    if (!securityQuestionById.has(questionId) || ids.has(questionId) || normalizeRecoveryAnswer(answer).length < 2) {
      throw new Error("Choose five different questions and provide each answer.");
    }
    ids.add(questionId);
  }
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function digestRecoveryAnswer(salt: string, answer: string) {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${normalizeRecoveryAnswer(answer)}`,
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
  const value = await canUseSecureStore()
    ? await SecureStore.getItemAsync(APP_PIN_KEY)
    : await readSetting(db, "app_pin");
  return typeof value === "string" && isValidPin(value) ? value : null;
}

export async function saveAppPin(db: SettingsDatabase, pin: string) {
  if (!isValidPin(pin)) throw new Error("PIN must be 4 to 6 digits.");

  if (await canUseSecureStore()) {
    await SecureStore.setItemAsync(APP_PIN_KEY, pin);
    return;
  }

  // ponytail: web fallback keeps the PIN in local SQLite; use Web Crypto if web threat model requires stronger storage.
  await writeSetting(db, "app_pin", pin);
}

export async function getAppSecuritySettings(db: SettingsDatabase): Promise<AppSecuritySettings> {
  return publicSecuritySettings(await readStoredSecuritySettings(db));
}

export async function saveAppFingerprintEnabled(db: SettingsDatabase, enabled: boolean) {
  if (enabled && (!await getAppPin(db) || !await hasFingerprintAvailable())) {
    throw new Error("Fingerprint unlock is unavailable.");
  }
  const settings = await readStoredSecuritySettings(db);
  await saveStoredSecuritySettings(db, { ...settings, fingerprintEnabled: enabled });
}

export async function saveAppSecurityRecovery(
  db: SettingsDatabase,
  answers: SecurityRecoveryAnswer[],
) {
  validateRecoveryAnswers(answers);
  const recoveryQuestions = await Promise.all(answers.map(async ({ questionId, answer }) => {
    const salt = bytesToHex(await Crypto.getRandomBytesAsync(16));
    return { questionId, salt, answerDigest: await digestRecoveryAnswer(salt, answer) };
  }));
  const settings = await readStoredSecuritySettings(db);
  await saveStoredSecuritySettings(db, { ...settings, recoveryQuestions });
}

export async function verifyAppSecurityRecovery(
  db: SettingsDatabase,
  answers: SecurityRecoveryAnswer[],
) {
  const settings = await readStoredSecuritySettings(db);
  if (settings.recoveryQuestions.length !== SECURITY_QUESTION_COUNT) return false;
  try {
    validateRecoveryAnswers(answers);
  } catch {
    return false;
  }
  const supplied = new Map(answers.map((answer) => [answer.questionId, answer.answer]));
  const checks = await Promise.all(settings.recoveryQuestions.map(async (question) => {
    const answer = supplied.get(question.questionId);
    return typeof answer === "string"
      && await digestRecoveryAnswer(question.salt, answer) === question.answerDigest;
  }));
  return checks.every(Boolean);
}

export async function hasFingerprintAvailable() {
  if (Platform.OS === "web") return false;
  try {
    const [hasHardware, isEnrolled, authenticationTypes] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    return hasHardware
      && isEnrolled
      && authenticationTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);
  } catch {
    return false;
  }
}

export async function authenticateWithFingerprint() {
  if (!await hasFingerprintAvailable()) return false;
  const result = await LocalAuthentication.authenticateAsync({
    biometricsSecurityLevel: "strong",
    cancelLabel: "Use PIN",
    disableDeviceFallback: true,
    promptDescription: "Use your fingerprint to unlock StockPilot.",
    promptMessage: "Unlock StockPilot",
  });
  return result.success;
}
