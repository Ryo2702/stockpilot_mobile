import * as DocumentPicker from "expo-document-picker";
import type { SQLiteDatabase } from "expo-sqlite";
import { useState } from "react";

import useAsyncEffect from "@/hooks/useAsyncEffect";
import {
  canShareBackup,
  createBackup,
  getStorageUsage,
  inspectBackup,
  listLocalBackups,
  readBackupFile,
  restoreBackup,
  saveBackupToDevice,
  shareBackup,
  type LocalBackupFile,
} from "@/services/backup.service";
import { getThemePreference } from "@/services/settings.service";
import type { ThemePreference } from "@/theme/tokens";

import type { RestoreCandidate } from "./settings.controller";
import { backupDateFromName } from "./settings.utils";

type SettingsBackupOptions = {
  db: SQLiteDatabase;
  isBackupPage: boolean;
  onRestoreComplete: () => Promise<void>;
  setColorScheme: (preference: ThemePreference) => Promise<void>;
};

export default function useSettingsBackup({
  db,
  isBackupPage,
  onRestoreComplete,
  setColorScheme,
}: SettingsBackupOptions) {
  const [storage, setStorage] = useState<{
    databaseBytes: number;
    backupBytes: number;
    totalBytes: number;
    backupCount: number;
  } | null>(null);
  const [backupFiles, setBackupFiles] = useState<LocalBackupFile[]>([]);
  const [backupResult, setBackupResult] = useState<LocalBackupFile | null>(
    null,
  );
  const [lastBackup, setLastBackup] = useState<LocalBackupFile | null>(null);
  const [backupError, setBackupError] = useState("");
  const [backupStatus, setBackupStatus] = useState<
    "preparing" | "saving" | "sharing" | "checking" | null
  >(null);
  const backupBusy = backupStatus !== null;
  const [shareAvailable, setShareAvailable] = useState(false);
  const [restoreCandidate, setRestoreCandidate] =
    useState<RestoreCandidate | null>(null);
  const [restoreDialogVisible, setRestoreDialogVisible] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreError, setRestoreError] = useState("");
  const [restoreMessage, setRestoreMessage] = useState("");

  useAsyncEffect(
    (isActive) => {
      getStorageUsage(db)
        .then((result) => {
          if (isActive()) setStorage(result);
        })
        .catch(() => {
          if (isActive()) setStorage(null);
        });
    },
    [db, backupFiles.length],
  );

  useAsyncEffect(
    (isActive) => {
      if (!isBackupPage) return;
      setBackupError("");
      listLocalBackups()
        .then((files) => {
          if (!isActive()) return;
          setBackupFiles(files);
          setLastBackup((current) =>
            current && current.uri === null ? current : (files[0] ?? null),
          );
        })
        .catch(() => {
          if (isActive()) setBackupFiles([]);
        });
      void canShareBackup()
        .then((available) => {
          if (isActive()) setShareAvailable(available);
        })
        .catch(() => {
          if (isActive()) setShareAvailable(false);
        });
    },
    [db, isBackupPage],
  );

  const refreshStorage = async () => {
    try {
      setStorage(await getStorageUsage(db));
    } catch {
      setStorage(null);
    }
  };

  const startBackup = async () => {
    setBackupStatus("preparing");
    setBackupError("");
    setRestoreMessage("");
    try {
      const created = await createBackup(db);
      setBackupResult(created);
      setLastBackup(created);
      setBackupFiles((files) => [
        created,
        ...files.filter((file) => file.name !== created.name),
      ]);
      await refreshStorage();
    } catch {
      setBackupError(
        "Backup couldn't be created. Your current inventory data is unchanged.",
      );
    } finally {
      setBackupStatus(null);
    }
  };

  const saveBackup = async () => {
    if (!backupResult) return;
    setBackupStatus("saving");
    setBackupError("");
    try {
      await saveBackupToDevice(backupResult);
      setBackupError("");
    } catch {
      setBackupError(
        "Backup couldn't be saved. Choose a location and try again.",
      );
    } finally {
      setBackupStatus(null);
    }
  };

  const shareCreatedBackup = async () => {
    if (!backupResult) return;
    setBackupStatus("sharing");
    setBackupError("");
    try {
      await shareBackup(backupResult);
    } catch {
      setBackupError("Backup couldn't be shared. Try again.");
    } finally {
      setBackupStatus(null);
    }
  };

  const prepareRestore = async (
    name: string,
    bytes: Uint8Array,
    createdAt: number | null,
  ) => {
    setBackupStatus("checking");
    setBackupError("");
    setRestoreError("");
    try {
      const summary = await inspectBackup(db, bytes);
      setRestoreCandidate({ name, bytes, summary, createdAt });
      setRestoreDialogVisible(true);
    } catch {
      setBackupError(
        "Backup couldn't be restored. The selected file may be invalid or unsupported.",
      );
    } finally {
      setBackupStatus(null);
    }
  };

  const chooseBackupFile = async () => {
    setBackupError("");
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const bytes = await readBackupFile(asset.uri, asset.file);
      await prepareRestore(asset.name, bytes, backupDateFromName(asset.name));
    } catch {
      setBackupError(
        "Backup couldn't be restored. The selected file may be invalid or unsupported.",
      );
    }
  };

  const prepareLocalRestore = async (backup: LocalBackupFile) => {
    if (!backup.uri && !backup.bytes) return;
    try {
      const bytes =
        backup.bytes ?? (await readBackupFile(backup.uri as string));
      await prepareRestore(
        backup.name,
        bytes,
        backup.createdAt || backupDateFromName(backup.name),
      );
    } catch {
      setBackupError("Backup couldn't be opened. Choose another backup file.");
    }
  };

  const confirmRestore = async () => {
    if (!restoreCandidate) return;
    setRestoreBusy(true);
    setRestoreError("");
    try {
      await restoreBackup(db, restoreCandidate.bytes);
      setRestoreDialogVisible(false);
      setRestoreMessage("Backup restored.");
      setRestoreCandidate(null);
      void onRestoreComplete().catch(() => undefined);
      void getThemePreference(db)
        .then((restoredPreference) => setColorScheme(restoredPreference))
        .catch(() => undefined);
      await refreshStorage();
      const files = await listLocalBackups().catch(() => []);
      setBackupFiles(files);
      setLastBackup(files[0] ?? null);
    } catch {
      setRestoreError(
        "Backup couldn't be restored. Your current inventory data is unchanged.",
      );
    } finally {
      setRestoreBusy(false);
    }
  };

  return {
    storage,
    backupFiles,
    backupResult,
    setBackupResult,
    lastBackup,
    backupError,
    backupStatus,
    backupBusy,
    shareAvailable,
    restoreCandidate,
    setRestoreCandidate,
    restoreDialogVisible,
    setRestoreDialogVisible,
    restoreBusy,
    restoreError,
    restoreMessage,
    startBackup,
    saveBackup,
    shareCreatedBackup,
    chooseBackupFile,
    prepareLocalRestore,
    confirmRestore,
  };
}
