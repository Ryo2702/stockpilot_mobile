jest.mock("expo-secure-store", () => ({
  getItemAsync: async () => null,
  isAvailableAsync: async () => false,
  setItemAsync: async () => undefined,
}));

jest.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: { SHA256: "SHA256" },
  digestStringAsync: async (_algorithm: string, value: string) => "digest:" + value,
  getRandomBytesAsync: async () => new Uint8Array(16).fill(7),
}));

jest.mock("expo-local-authentication", () => ({
  AuthenticationType: { FINGERPRINT: 1 },
  authenticateAsync: async () => ({ success: false }),
  hasHardwareAsync: async () => false,
  isEnrolledAsync: async () => false,
  supportedAuthenticationTypesAsync: async () => [],
}));

import {
  getAppSecuritySettings,
  saveAppSecurityRecovery,
  verifyAppSecurityRecovery,
} from "./settings.service";

function createSettingsDatabase() {
  const values = new Map<string, string>();
  return {
    database: {
      getFirstAsync: async <T,>(_query: string, key: string) => (
        values.has(key) ? { valueJson: values.get(key)! } as T : null
      ),
      runAsync: async (_query: string, key: string, valueJson: string) => {
        values.set(key, valueJson);
      },
    },
    values,
  };
}

describe("security recovery", () => {
  it("requires all five selected answers and never stores an answer in plain text", async () => {
    const { database, values } = createSettingsDatabase();
    const answers = [
      { questionId: "favorite-food" as const, answer: "Pancit" },
      { questionId: "childhood-nickname" as const, answer: "Migs" },
      { questionId: "first-pet" as const, answer: "Bantay" },
      { questionId: "first-school" as const, answer: "Rizal Academy" },
      { questionId: "favorite-teacher" as const, answer: "Santos" },
    ];

    const settingsDatabase = database as unknown as SQLiteDatabase;
    await saveAppSecurityRecovery(settingsDatabase, answers);

    expect(values.get("app_security")).not.toContain("Pancit");
    await expect(verifyAppSecurityRecovery(settingsDatabase, answers.map((entry) => ({
      ...entry,
      answer: "  " + entry.answer.toUpperCase() + "  ",
    })))).resolves.toBe(true);
    await expect(verifyAppSecurityRecovery(settingsDatabase, [
      ...answers.slice(0, 4),
      { questionId: "favorite-teacher" as const, answer: "Wrong answer" },
    ])).resolves.toBe(false);
    await expect(getAppSecuritySettings(settingsDatabase)).resolves.toEqual(expect.objectContaining({
      recoveryQuestions: expect.arrayContaining([expect.objectContaining({ questionId: "favorite-food" })]),
    }));
  });
});
import { describe, expect, it, jest } from "@jest/globals";
import type { SQLiteDatabase } from "expo-sqlite";
