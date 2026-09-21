import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

import { createDatabaseKey, readDatabaseKey } from "./database-key";

jest.mock("expo-crypto", () => ({
  getRandomBytesAsync: jest.fn(async (length: number) => new Uint8Array(length).fill(0xab)),
}));
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

describe("database key storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("creates and persists a random 256-bit key", async () => {
    const key = await createDatabaseKey();

    expect(Crypto.getRandomBytesAsync).toHaveBeenCalledWith(32);
    expect(key).toBe("ab".repeat(32));
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("stockpilot.database-encryption-key.v1", key);
  });

  test("reads a previously stored key", async () => {
    const key = "ab".repeat(32);
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue(key);

    await expect(readDatabaseKey()).resolves.toBe(key);
    expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  });

  test("rejects malformed stored keys", async () => {
    jest.mocked(SecureStore.getItemAsync).mockResolvedValue("not-a-key");
    await expect(readDatabaseKey()).rejects.toThrow("Database key storage is invalid.");
  });
});
