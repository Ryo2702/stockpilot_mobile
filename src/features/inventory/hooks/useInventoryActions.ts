import * as DocumentPicker from "expo-document-picker";
import { File as ExpoFile } from "expo-file-system";
import type { SQLiteDatabase } from "expo-sqlite";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import {
  InsufficientStockError,
  InventoryItemNotFoundError,
  InvalidStockAdjustmentError,
  NoStockChangeError,
} from "@/domain/inventory.errors";
import {
  applyStockChange,
  analyzeInventoryImport,
  exportInventoryCsv,
  importInventoryCsv,
  type InventoryImportAnalysis,
  type InventoryImportProgress,
  type getInventoryDetail,
} from "@/services/inventory";
import type { OwnerStore } from "@/services/owner-store.service";
import type { StockAdjustmentInput } from "@/validation/inventory.validation";

type InventoryDetail = Awaited<ReturnType<typeof getInventoryDetail>>;

type UseInventoryActionsOptions = {
  db: SQLiteDatabase;
  ownerStore: OwnerStore;
  detail: InventoryDetail | null;
  onReload: () => void;
  onMessage: (message: string) => void;
};

export default function useInventoryActions({
  db,
  ownerStore,
  detail,
  onReload,
  onMessage,
}: UseInventoryActionsOptions) {
  const [actionError, setActionError] = useState("");
  const [adjustVisible, setAdjustVisible] = useState(false);
  const [savingStock, setSavingStock] = useState(false);
  const [pendingImport, setPendingImport] = useState<{
    csv: string;
    fileName: string;
    analysis: InventoryImportAnalysis | null;
  } | null>(null);
  const [analyzingImport, setAnalyzingImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<InventoryImportProgress | null>(null);
  const [importError, setImportError] = useState("");
  const importRequest = useRef(0);

  useEffect(() => {
    importRequest.current += 1;
    setAdjustVisible(false);
    setActionError("");
    setPendingImport(null);
    setAnalyzingImport(false);
    setImporting(false);
    setImportProgress(null);
    setImportError("");
  }, [ownerStore.businessId, ownerStore.storeId]);

  const changeStock = async (input: StockAdjustmentInput) => {
    if (!detail) return false;
    setSavingStock(true);
    setActionError("");
    try {
      await applyStockChange(db, ownerStore, detail.item.id, input);
      setAdjustVisible(false);
      onMessage("Stock updated and movement recorded.");
      onReload();
      return true;
    } catch (error) {
      const unit = detail.item.unit;
      if (error instanceof InsufficientStockError) {
        setActionError(`Only ${error.currentStock ?? detail.item.quantity} ${unit} are currently available.`);
      } else if (error instanceof NoStockChangeError) {
        setActionError(error.message);
      } else if (error instanceof InvalidStockAdjustmentError || error instanceof InventoryItemNotFoundError) {
        setActionError(error.message);
      } else {
        setActionError("Stock wasn't updated. Your previous stock quantity is unchanged. Try again.");
      }
      return false;
    } finally {
      setSavingStock(false);
    }
  };

  const analyzeImportFile = async (csv: string, fileName: string) => {
    const requestId = importRequest.current + 1;
    importRequest.current = requestId;
    setImportError("");
    setImportProgress(null);
    setAnalyzingImport(true);
    try {
      const analysis = await analyzeInventoryImport(
        db,
        ownerStore,
        csv,
        fileName,
        (progress) => {
          if (importRequest.current === requestId) setImportProgress(progress);
        },
      );
      if (importRequest.current === requestId) setPendingImport({ csv, fileName, analysis });
    } catch (error) {
      if (importRequest.current === requestId) {
        setImportError(error instanceof Error ? error.message : "Couldn't analyze this CSV file.");
      }
    } finally {
      if (importRequest.current === requestId) {
        setAnalyzingImport(false);
        setImportProgress(null);
      }
    }
  };

  const pickInventoryImport = async () => {
    const requestId = importRequest.current + 1;
    importRequest.current = requestId;
    setActionError("");
    setImportError("");
    try {
      const selection = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel"],
        base64: false,
        copyToCacheDirectory: true,
      });
      if (selection.canceled) return;
      if (importRequest.current !== requestId) return;
      const asset = selection.assets[0];
      if (!asset.name.toLowerCase().endsWith(".csv")) throw new Error("Choose a .csv inventory file.");
      const csv = Platform.OS === "web"
        ? await (asset.file?.text() ?? Promise.reject(new Error("Couldn't read the selected file.")))
        : await new ExpoFile(asset.uri).text();
      setPendingImport({ csv, fileName: asset.name, analysis: null });
      await analyzeImportFile(csv, asset.name);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Couldn't read the selected CSV file.");
    }
  };

  const confirmInventoryImport = async () => {
    if (!pendingImport?.analysis?.canImport || importing || analyzingImport) return;
    const requestId = importRequest.current;
    setImporting(true);
    setImportError("");
    try {
      const result = await importInventoryCsv(
        db,
        ownerStore,
        pendingImport.csv,
        pendingImport.fileName,
        (progress) => {
          if (importRequest.current === requestId) setImportProgress(progress);
        },
        { activeStoreOnly: true, expectedAnalysis: pendingImport.analysis },
      );
      if (importRequest.current === requestId) {
        setPendingImport(null);
        setImportProgress(null);
        const added = result.createdProductCount ?? 0;
        const updated = result.updatedProductCount ?? result.importedCount - added;
        const unchanged = result.unchangedProductCount ?? 0;
        const unchangedMessage = unchanged ? `, ${unchanged.toLocaleString()} unchanged` : "";
        onMessage(`Imported ${result.importedCount.toLocaleString()} products into ${ownerStore.storeName}: ${added.toLocaleString()} added, ${updated.toLocaleString()} stock changes${unchangedMessage}.`);
        onReload();
      }
    } catch (error) {
      if (importRequest.current === requestId) {
        setImportError(error instanceof Error ? error.message : "Couldn't import this CSV file.");
        setImportProgress(null);
      }
    } finally {
      if (importRequest.current === requestId) setImporting(false);
    }
  };

  const reanalyzeInventoryImport = async () => {
    if (!pendingImport || importing || analyzingImport) return;
    setPendingImport({ ...pendingImport, analysis: null });
    await analyzeImportFile(pendingImport.csv, pendingImport.fileName);
  };

  return {
    adjustVisible,
    openAdjustment: () => {
      setActionError("");
      setAdjustVisible(true);
    },
    closeAdjustment: () => {
      if (!savingStock) {
        setAdjustVisible(false);
        setActionError("");
      }
    },
    savingStock,
    actionError,
    changeStock,
    pickInventoryImport,
    pendingImport,
    analyzingImport,
    importing,
    importProgress,
    importError,
    cancelImport: () => {
      if (!importing && !analyzingImport) {
        importRequest.current += 1;
        setPendingImport(null);
        setImportProgress(null);
        setImportError("");
      }
    },
    reanalyzeInventoryImport,
    confirmInventoryImport,
    createExportCsv: () => exportInventoryCsv(db, ownerStore),
  };
}
