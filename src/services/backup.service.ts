import * as Sharing from "expo-sharing";
import { Directory, File, Paths } from "expo-file-system";
import * as Crypto from "expo-crypto";
import {
  deserializeDatabaseAsync,
  deleteDatabaseAsync,
  defaultDatabaseDirectory,
  openDatabaseAsync,
  type SQLiteDatabase,
} from "expo-sqlite";
import { Platform } from "react-native";

type BackupDatabase = Pick<
  SQLiteDatabase,
  | "databasePath"
  | "serializeAsync"
  | "getAllAsync"
  | "getFirstAsync"
  | "runAsync"
  | "execAsync"
  | "withTransactionAsync"
>;

const backupDirectoryName = "StockPilot Backups";
export const MAX_BACKUP_BYTES = 50 * 1024 * 1024;
export const MIN_BACKUP_PASSPHRASE_LENGTH = 20;
export const MIN_RESTORE_PASSPHRASE_LENGTH = 12;
const portableBackupHeader = Uint8Array.of(0x53, 0x50, 0x42, 0x4b, 0x53, 0x51, 0x4c, 0x43, 0x31);
const sqliteHeader = Uint8Array.of(0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6f, 0x72, 0x6d, 0x61, 0x74, 0x20, 0x33, 0x00);
const RESTORE_BATCH_SIZE = 250;
const backupTables = [
  "businesses",
  "stores",
  "store_settings",
  "settings",
  "products",
  "inventory",
  "stock_movements",
  "insight_snapshots",
] as const;
const restoreOrder = backupTables;
const deleteOrder = [
  "stock_movements",
  "insight_snapshots",
  "inventory",
  "products",
  "store_settings",
  "stores",
  "businesses",
  "settings",
] as const;

export type BackupSummary = {
  storeCount: number;
  productCount: number;
  movementCount: number;
};

export type LocalBackupFile = {
  name: string;
  uri: string | null;
  size: number;
  createdAt: number;
  bytes?: Uint8Array;
  summary?: BackupSummary;
};

export class UnsupportedBackupError extends Error {
  constructor() {
    super("This file isn't a supported StockPilot backup.");
    this.name = "UnsupportedBackupError";
  }
}

export class BackupPassphraseError extends Error {
  constructor(minLength = MIN_BACKUP_PASSPHRASE_LENGTH) {
    super(`Use a passphrase between ${minLength} and 128 characters with at least one non-space character.`);
    this.name = "BackupPassphraseError";
  }
}

export function getBackupFormat(bytes: Uint8Array): "encrypted" | "legacy-plaintext" | "unsupported" {
  if (startsWith(bytes, portableBackupHeader)) return "encrypted";
  if (startsWith(bytes, sqliteHeader)) return "legacy-plaintext";
  return "unsupported";
}

export function assertBackupPassphrase(passphrase: string, minLength = MIN_BACKUP_PASSPHRASE_LENGTH) {
  if (
    passphrase.length < minLength ||
    passphrase.length > 128 ||
    !passphrase.trim() ||
    /[\u0000-\u001f\u007f]/.test(passphrase)
  ) {
    throw new BackupPassphraseError(minLength);
  }
}

function startsWith(bytes: Uint8Array, header: Uint8Array) {
  return bytes.byteLength >= header.byteLength && header.every((byte, index) => bytes[index] === byte);
}

function createTempDatabaseName() {
  return `stockpilot-backup-${Crypto.randomUUID()}.db`;
}

function quoteSqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

async function createEncryptedBackup(db: BackupDatabase, passphrase: string) {
  assertBackupPassphrase(passphrase);
  if (!defaultDatabaseDirectory) throw new UnsupportedBackupError();

  const name = createTempDatabaseName();
  const path = `${defaultDatabaseDirectory}/${name}`;
  const alias = `portable_${Crypto.randomUUID().replace(/-/g, "")}`;
  const file = new File(defaultDatabaseDirectory, name);
  let attached = false;
  try {
    await db.runAsync(`ATTACH DATABASE ? AS "${alias}" KEY ?`, path, passphrase);
    attached = true;
    await db.getFirstAsync(`SELECT sqlcipher_export(?)`, alias);
    await db.execAsync(`DETACH DATABASE "${alias}"`);
    attached = false;
    if (!file.exists) throw new UnsupportedBackupError();
    assertBackupSize(file.size + portableBackupHeader.byteLength);
    const encrypted = await file.bytes();
    const bytes = new Uint8Array(portableBackupHeader.byteLength + encrypted.byteLength);
    bytes.set(portableBackupHeader);
    bytes.set(encrypted, portableBackupHeader.byteLength);
    assertBackupSize(bytes.byteLength);
    return bytes;
  } finally {
    if (attached) await db.execAsync(`DETACH DATABASE "${alias}"`).catch(() => undefined);
    await deleteDatabaseAsync(name, defaultDatabaseDirectory).catch(() => undefined);
  }
}

export function assertBackupSize(size: number) {
  if (!Number.isSafeInteger(size) || size <= 0 || size > MAX_BACKUP_BYTES) {
    throw new UnsupportedBackupError();
  }
}

function createBackupName(date: Date) {
  const day = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, "0"))
    .join("-");
  const time = [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((part) => String(part).padStart(2, "0"))
    .join("-");
  const milliseconds = String(date.getMilliseconds()).padStart(3, "0");
  return `stockpilot-backup-${day}-${time}-${milliseconds}.spbackup`;
}

function downloadBackup(bytes: Uint8Array, name: string) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.stockpilot.backup" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function getBackupDirectory() {
  return new Directory(Paths.document, backupDirectoryName);
}

export async function listLocalBackups(): Promise<LocalBackupFile[]> {
  if (Platform.OS === "web") return [];
  const directory = getBackupDirectory();
  if (!directory.exists) return [];
  return directory.list()
    .filter((item): item is File => item instanceof File && item.extension.toLowerCase() === ".spbackup")
    .map((file) => ({
      name: file.name,
      uri: file.uri,
      size: file.size,
      createdAt: file.lastModified ?? file.creationTime ?? 0,
    }))
    .sort((a, b) => b.createdAt - a.createdAt);
}

async function getDatabaseSummary(db: Pick<SQLiteDatabase, "getFirstAsync">): Promise<BackupSummary> {
  const [stores, products, movements] = await Promise.all([
    db.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM stores"),
    db.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM products"),
    db.getFirstAsync<{ count: number }>("SELECT COUNT(*) AS count FROM stock_movements"),
  ]);
  return {
    storeCount: stores?.count ?? 0,
    productCount: products?.count ?? 0,
    movementCount: movements?.count ?? 0,
  };
}

async function verifyBackupSchema(currentDb: BackupDatabase, backupDb: SQLiteDatabase) {
  const integrity = await backupDb.getFirstAsync<{ integrity_check: string }>("PRAGMA integrity_check");
  if (integrity?.integrity_check !== "ok") throw new UnsupportedBackupError();
  if ((await backupDb.getAllAsync("PRAGMA foreign_key_check")).length) throw new UnsupportedBackupError();

  const tables = new Set(
    (await backupDb.getAllAsync<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'")).map(({ name }) => name),
  );
  if (!["schema_migrations", ...backupTables].every((table) => tables.has(table))) {
    throw new UnsupportedBackupError();
  }

  const [currentVersion, backupVersion] = await Promise.all([
    currentDb.getFirstAsync<{ version: number }>("SELECT MAX(version) AS version FROM schema_migrations"),
    backupDb.getFirstAsync<{ version: number }>("SELECT MAX(version) AS version FROM schema_migrations"),
  ]);
  if (currentVersion?.version !== backupVersion?.version) throw new UnsupportedBackupError();

  for (const table of backupTables) {
    const [currentColumns, backupColumns] = await Promise.all([
      currentDb.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`),
      backupDb.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`),
    ]);
    if (
      currentColumns.length !== backupColumns.length ||
      currentColumns.some(({ name }, index) => name !== backupColumns[index]?.name)
    ) {
      throw new UnsupportedBackupError();
    }
  }

  const ownership = await backupDb.getFirstAsync<{ count: number }>(`
    SELECT
      (SELECT COUNT(*) FROM products p
        LEFT JOIN stores s ON s.id = p.store_id AND s.business_id = p.business_id
        WHERE s.id IS NULL) +
      (SELECT COUNT(*) FROM inventory i
        LEFT JOIN products p ON p.id = i.product_id AND p.store_id = i.store_id AND p.business_id = i.business_id
        WHERE p.id IS NULL OR i.quantity < 0) +
      (SELECT COUNT(*) FROM stock_movements m
        LEFT JOIN products p ON p.id = m.product_id AND p.store_id = m.store_id AND p.business_id = m.business_id
        WHERE p.id IS NULL) +
      (SELECT COUNT(*) FROM insight_snapshots i
        LEFT JOIN stores s ON s.id = i.store_id AND s.business_id = i.business_id
        WHERE s.id IS NULL) AS count
  `);
  if ((ownership?.count ?? 0) > 0) throw new UnsupportedBackupError();
}

async function openVerifiedBackup(currentDb: BackupDatabase, bytes: Uint8Array, passphrase?: string) {
  let backupDb: SQLiteDatabase | null = null;
  let tempName: string | null = null;
  let encrypted = false;
  try {
    assertBackupSize(bytes.byteLength);
    const format = getBackupFormat(bytes);
    if (format === "legacy-plaintext") {
      backupDb = await deserializeDatabaseAsync(bytes);
    } else if (format === "encrypted") {
      if (!passphrase) throw new BackupPassphraseError(MIN_RESTORE_PASSPHRASE_LENGTH);
      assertBackupPassphrase(passphrase, MIN_RESTORE_PASSPHRASE_LENGTH);
      if (!defaultDatabaseDirectory) throw new UnsupportedBackupError();
      tempName = createTempDatabaseName();
      const file = new File(defaultDatabaseDirectory, tempName);
      file.create({ overwrite: true });
      file.write(bytes.subarray(portableBackupHeader.byteLength));
      backupDb = await openDatabaseAsync(tempName, { useNewConnection: true }, defaultDatabaseDirectory);
      await backupDb.execAsync(`PRAGMA key = ${quoteSqlString(passphrase)}`);
      const cipher = await backupDb.getFirstAsync<{ cipher_version: string }>("PRAGMA cipher_version");
      if (!cipher?.cipher_version) throw new UnsupportedBackupError();
      if ((await backupDb.getAllAsync("PRAGMA cipher_integrity_check")).length) {
        throw new UnsupportedBackupError();
      }
      encrypted = true;
    } else {
      throw new UnsupportedBackupError();
    }
    if (!backupDb) throw new UnsupportedBackupError();
    await verifyBackupSchema(currentDb, backupDb);
    const openedDb = backupDb;
    const openedTempName = tempName;
    let closed = false;
    return {
      db: openedDb,
      encrypted,
      close: async () => {
        if (closed) return;
        closed = true;
        await openedDb.closeAsync();
        if (openedTempName && defaultDatabaseDirectory) {
          await deleteDatabaseAsync(openedTempName, defaultDatabaseDirectory).catch(() => undefined);
        }
      },
    };
  } catch (error) {
    await backupDb?.closeAsync().catch(() => undefined);
    if (tempName && defaultDatabaseDirectory) await deleteDatabaseAsync(tempName, defaultDatabaseDirectory).catch(() => undefined);
    if (error instanceof UnsupportedBackupError) throw error;
    if (error instanceof BackupPassphraseError) throw error;
    throw new UnsupportedBackupError();
  }
}

export async function inspectBackup(db: BackupDatabase, bytes: Uint8Array, passphrase?: string) {
  const backup = await openVerifiedBackup(db, bytes, passphrase);
  try {
    return await getDatabaseSummary(backup.db);
  } finally {
    await backup.close();
  }
}

export async function createBackup(db: BackupDatabase, passphrase?: string): Promise<LocalBackupFile> {
  const createdAt = Date.now();
  const name = createBackupName(new Date(createdAt));
  const bytes = Platform.OS === "web"
    ? await db.serializeAsync()
    : await createEncryptedBackup(db, passphrase ?? "");
  assertBackupSize(bytes.byteLength);
  const summary = await inspectBackup(db, bytes, passphrase);

  if (Platform.OS === "web") {
    return { name, uri: null, size: bytes.byteLength, createdAt, bytes, summary };
  }

  const directory = getBackupDirectory();
  directory.create({ intermediates: true, idempotent: true });
  const file = new File(directory, name);
  file.create({ overwrite: true });
  file.write(bytes);
  return { name, uri: file.uri, size: bytes.byteLength, createdAt, summary };
}

export async function readBackupFile(uri: string, webFile?: Blob) {
  if (Platform.OS === "web" && webFile) {
    assertBackupSize(webFile.size);
    return new Uint8Array(await webFile.arrayBuffer());
  }
  const file = new File(uri);
  assertBackupSize(file.size);
  return file.bytes();
}

export async function restoreBackup(db: BackupDatabase, bytes: Uint8Array, passphrase?: string) {
  const backup = await openVerifiedBackup(db, bytes, passphrase);
  try {
    const columnsByTable = new Map<string, string[]>();
    for (const table of restoreOrder) {
      columnsByTable.set(
        table,
        (await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`)).map(({ name }) => name),
      );
    }

    await db.withTransactionAsync(async () => {
      for (const table of deleteOrder) await db.runAsync(`DELETE FROM ${table}`);
      for (const table of restoreOrder) {
        const columns = columnsByTable.get(table) ?? [];
        if (!columns.length) continue;
        const statement = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`;
        let offset = 0;
        while (true) {
          const rows = await backup.db.getAllAsync<Record<string, string | number | null | Uint8Array>>(
            `SELECT * FROM ${table} LIMIT ? OFFSET ?`,
            RESTORE_BATCH_SIZE,
            offset,
          );
          if (!rows.length) break;
          for (const row of rows) {
            await db.runAsync(statement, columns.map((column) => row[column]));
          }
          offset += rows.length;
          if (rows.length < RESTORE_BATCH_SIZE) break;
        }
      }
    });
  } finally {
    await backup.close();
  }
}

export async function saveBackupToDevice(backup: LocalBackupFile) {
  if (Platform.OS === "web") {
    const bytes = backup.bytes ?? (backup.uri ? await readBackupFile(backup.uri) : new Uint8Array());
    if (!bytes.length) throw new Error("This backup is no longer available.");
    downloadBackup(bytes, backup.name);
    return;
  }
  if (!backup.uri) throw new Error("This backup is no longer available.");
  const directory = await Directory.pickDirectoryAsync();
  const file = new File(directory, backup.name);
  file.create({ overwrite: true });
  file.write(await new File(backup.uri).bytes());
}

export async function canShareBackup() {
  return Platform.OS !== "web" && Sharing.isAvailableAsync();
}

export async function shareBackup(backup: LocalBackupFile) {
  if (!backup.uri || !(await Sharing.isAvailableAsync())) {
    throw new Error("File sharing isn't available on this device.");
  }
  await Sharing.shareAsync(backup.uri, {
    dialogTitle: "Share StockPilot backup",
    mimeType: "application/vnd.stockpilot.backup",
    UTI: "public.database",
  });
}

export async function getStorageUsage(db: BackupDatabase) {
  const databaseBytes = Platform.OS === "web"
    ? (await db.serializeAsync()).byteLength
    : new File(db.databasePath).size + new File(`${db.databasePath}-wal`).size;
  const backups = await listLocalBackups();
  const backupBytes = backups.reduce((total, file) => total + file.size, 0);
  return {
    databaseBytes,
    backupBytes,
    totalBytes: databaseBytes + backupBytes,
    backupCount: backups.length,
  };
}
