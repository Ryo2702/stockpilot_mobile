import * as Sharing from "expo-sharing";
import { Directory, File, Paths } from "expo-file-system";
import {
  deserializeDatabaseAsync,
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
}

async function openVerifiedBackup(currentDb: BackupDatabase, bytes: Uint8Array) {
  let backupDb: SQLiteDatabase | null = null;
  try {
    if (!bytes.length) throw new UnsupportedBackupError();
    backupDb = await deserializeDatabaseAsync(bytes);
    await verifyBackupSchema(currentDb, backupDb);
    return backupDb;
  } catch (error) {
    await backupDb?.closeAsync();
    if (error instanceof UnsupportedBackupError) throw error;
    throw new UnsupportedBackupError();
  }
}

export async function inspectBackup(db: BackupDatabase, bytes: Uint8Array) {
  const backupDb = await openVerifiedBackup(db, bytes);
  try {
    return await getDatabaseSummary(backupDb);
  } finally {
    await backupDb.closeAsync();
  }
}

export async function createBackup(db: BackupDatabase): Promise<LocalBackupFile> {
  const createdAt = Date.now();
  const name = createBackupName(new Date(createdAt));
  const bytes = await db.serializeAsync();
  const summary = await inspectBackup(db, bytes);

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
  if (Platform.OS === "web" && webFile) return new Uint8Array(await webFile.arrayBuffer());
  return new File(uri).bytes();
}

export async function restoreBackup(db: BackupDatabase, bytes: Uint8Array) {
  const backupDb = await openVerifiedBackup(db, bytes);
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
        const rows = await backupDb.getAllAsync<Record<string, string | number | null | Uint8Array>>(
          `SELECT * FROM ${table}`,
        );
        if (!columns.length || !rows.length) continue;
        const statement = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`;
        for (const row of rows) {
          await db.runAsync(statement, columns.map((column) => row[column]));
        }
      }
    });
  } finally {
    await backupDb.closeAsync();
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
