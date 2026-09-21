import { describe, expect, test } from "@jest/globals";
import {
  assertBackupPassphrase,
  assertBackupSize,
  BackupPassphraseError,
  getBackupFormat,
  MAX_BACKUP_BYTES,
  MIN_BACKUP_PASSPHRASE_LENGTH,
  UnsupportedBackupError,
} from "./backup.service";

describe("backup size guard", () => {
  test("accepts non-empty backups within the byte limit", () => {
    expect(() => assertBackupSize(1)).not.toThrow();
    expect(() => assertBackupSize(MAX_BACKUP_BYTES)).not.toThrow();
  });

  test.each([0, -1, Number.MAX_SAFE_INTEGER + 1, MAX_BACKUP_BYTES + 1])("rejects invalid size %s", (size) => {
    expect(() => assertBackupSize(size)).toThrow(UnsupportedBackupError);
  });
});

describe("portable backup format", () => {
  test("recognizes encrypted and legacy plaintext backup signatures", () => {
    expect(getBackupFormat(new TextEncoder().encode("SPBKSQLC1ciphertext"))).toBe("encrypted");
    expect(getBackupFormat(new TextEncoder().encode("SQLite format 3\0legacy"))).toBe("legacy-plaintext");
    expect(getBackupFormat(new TextEncoder().encode("not a backup"))).toBe("unsupported");
  });

  test("requires longer passphrases for new backups while allowing older backups to restore", () => {
    expect(() => assertBackupPassphrase("unique memorable backup phrase")).not.toThrow();
    expect(() => assertBackupPassphrase("beta backup 1", 12)).not.toThrow();
    for (const invalid of [
      "a".repeat(MIN_BACKUP_PASSPHRASE_LENGTH - 1),
      "             ",
      "a".repeat(129),
      "valid\npassphrase-longer",
    ]) {
      expect(() => assertBackupPassphrase(invalid)).toThrow(BackupPassphraseError);
    }
  });
});
