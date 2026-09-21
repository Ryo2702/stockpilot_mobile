import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const KEY_STORAGE_NAME = "stockpilot.database-encryption-key.v1";
const DATABASE_KEY_BYTES = 32;

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function readDatabaseKey() {
  const key = await SecureStore.getItemAsync(KEY_STORAGE_NAME);
  if (key !== null && !/^[\da-f]{64}$/.test(key)) {
    throw new Error("Database key storage is invalid.");
  }
  return key;
}

export async function createDatabaseKey() {
  const key = toHex(await Crypto.getRandomBytesAsync(DATABASE_KEY_BYTES));
  await SecureStore.setItemAsync(KEY_STORAGE_NAME, key);
  return key;
}
