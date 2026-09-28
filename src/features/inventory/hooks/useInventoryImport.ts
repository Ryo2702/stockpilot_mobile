import * as DocumentPicker from "expo-document-picker";
import { File as ExpoFile } from "expo-file-system";
import type { SQLiteDatabase } from "expo-sqlite";
import { useRef, useState } from "react";
import { Platform } from "react-native";

import type { OwnerStore } from "@/services/owner-store.service";
import {
  applyInventoryFileImportMapping,
  commitInventoryFileImport,
  prepareInventoryFileImport,
  reviewInventoryFileImportRows,
  type InventoryFileImportFieldMapping,
  type InventoryFileImportProduct,
  type InventoryFileImportProgress,
  type InventoryFileImportResult,
  type InventoryFileImportReview,
  type InventoryFileImportSource,
} from "@/services/inventory";

export type InventoryImportStage =
  | "empty"
  | "parsing"
  | "mapping"
  | "preview"
  | "confirming"
  | "importing"
  | "success"
  | "failure";

export type SelectedInventoryImportFile = {
  name: string;
  type: string;
  size: number | null;
};

const documentTypes = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/csv",
  "text/comma-separated-values",
];

function fileType(name: string) {
  return name.trim().split(".").pop()?.toUpperCase() || "FILE";
}

function requiresText(name: string) {
  const extension = name.trim().split(".").pop()?.toLowerCase();
  return extension === "csv" || extension === "txt";
}

function userFacingError(caught: unknown, fallback: string) {
  const message = caught instanceof Error ? caught.message.trim() : "";
  return /^(Choose |Unable to read|This |StockPilot |Map |Quantity |Price |Selling |Category |Product |Inventory changed|Resolve )/.test(message)
    ? message
    : fallback;
}

async function readSelectedFile(asset: DocumentPicker.DocumentPickerAsset): Promise<InventoryFileImportSource> {
  const text = requiresText(asset.name);
  let content: string | Uint8Array;
  if (Platform.OS === "web") {
    if (!asset.file) throw new Error("Unable to read the selected file.");
    content = text ? await asset.file.text() : new Uint8Array(await asset.file.arrayBuffer());
  } else {
    const file = new ExpoFile(asset.uri);
    content = text ? await file.text() : await file.bytes();
  }
  return { fileName: asset.name, fileSize: asset.size ?? null, content };
}

export default function useInventoryImport(db: SQLiteDatabase, initialStore: OwnerStore) {
  const request = useRef(0);
  const [destinationStore, setDestinationStore] = useState(initialStore);
  const [stage, setStage] = useState<InventoryImportStage>("empty");
  const [selectedFile, setSelectedFile] = useState<SelectedInventoryImportFile | null>(null);
  const [review, setReview] = useState<InventoryFileImportReview | null>(null);
  const [progress, setProgress] = useState<InventoryFileImportProgress | null>(null);
  const [result, setResult] = useState<InventoryFileImportResult | null>(null);
  const [error, setError] = useState("");
  const [resolving, setResolving] = useState(false);

  const reset = () => {
    request.current += 1;
    setStage("empty");
    setSelectedFile(null);
    setReview(null);
    setProgress(null);
    setResult(null);
    setError("");
    setResolving(false);
  };

  const pickFile = async () => {
    const id = request.current + 1;
    request.current = id;
    setError("");
    setResult(null);
    try {
      const selection = await DocumentPicker.getDocumentAsync({
        type: documentTypes,
        base64: false,
        copyToCacheDirectory: true,
      });
      if (selection.canceled || request.current !== id) return;
      const asset = selection.assets[0];
      setSelectedFile({ name: asset.name, type: fileType(asset.name), size: asset.size ?? null });
      setReview(null);
      setProgress({ phase: "reading", processed: 0, total: 1 });
      setStage("parsing");
      const source = await readSelectedFile(asset);
      if (request.current !== id) return;
      const nextReview = await prepareInventoryFileImport(db, destinationStore, source, (nextProgress) => {
        if (request.current === id) setProgress(nextProgress);
      });
      if (request.current !== id) return;
      setReview(nextReview);
      setProgress(null);
      setStage(nextReview.requiresMapping ? "mapping" : "preview");
    } catch (caught) {
      if (request.current !== id) return;
      setProgress(null);
      setError(userFacingError(caught, "Unable to read this file. StockPilot could not identify inventory information in this document."));
      setStage("failure");
    }
  };

  const applyMapping = async (mapping: InventoryFileImportFieldMapping[]) => {
    if (!review || resolving) return false;
    const id = request.current;
    setResolving(true);
    setError("");
    try {
      const nextReview = await applyInventoryFileImportMapping(db, destinationStore, review, mapping);
      if (request.current !== id) return false;
      setReview(nextReview);
      setStage("preview");
      return true;
    } catch (caught) {
      if (request.current === id) setError(userFacingError(caught, "Check the field mapping."));
      return false;
    } finally {
      if (request.current === id) setResolving(false);
    }
  };

  const reviewRows = async (rows: InventoryFileImportProduct[]) => {
    if (!review || resolving) return false;
    const id = request.current;
    setResolving(true);
    setError("");
    try {
      const nextReview = await reviewInventoryFileImportRows(db, destinationStore, review, rows);
      if (request.current !== id) return false;
      setReview(nextReview);
      setStage("preview");
      return true;
    } catch (caught) {
      if (request.current === id) setError(userFacingError(caught, "Unable to review this product."));
      return false;
    } finally {
      if (request.current === id) setResolving(false);
    }
  };

  const updateProduct = async (id: string, updates: Partial<InventoryFileImportProduct>) => {
    if (!review) return false;
    return reviewRows(review.rows.map((row) => row.id === id ? { ...row, ...updates } : row));
  };

  const changeDestinationStore = async (store: OwnerStore) => {
    if (store.storeId === destinationStore.storeId && store.businessId === destinationStore.businessId) return;
    setDestinationStore(store);
    if (!review || review.requiresMapping) return;
    const id = request.current;
    setResolving(true);
    setError("");
    try {
      const nextReview = await reviewInventoryFileImportRows(db, store, review, review.rows);
      if (request.current !== id) return;
      setReview(nextReview);
      setStage("preview");
    } catch (caught) {
      if (request.current === id) setError(userFacingError(caught, "Unable to review this store."));
    } finally {
      if (request.current === id) setResolving(false);
    }
  };

  const importProducts = async () => {
    if (!review || stage === "importing" || resolving) return false;
    const id = request.current;
    setStage("importing");
    setProgress({ phase: "importing", processed: 0, total: review.readyCount });
    setError("");
    try {
      const importResult = await commitInventoryFileImport(db, destinationStore, review, (nextProgress) => {
        if (request.current === id) setProgress(nextProgress);
      });
      if (request.current !== id) return false;
      setResult(importResult);
      setProgress(null);
      setStage("success");
      return true;
    } catch (caught) {
      if (request.current === id) {
        setProgress(null);
        setError(userFacingError(caught, "Import could not be completed. No inventory changes were saved."));
        setStage("failure");
      }
      return false;
    }
  };

  return {
    destinationStore,
    stage,
    selectedFile,
    review,
    progress,
    result,
    error,
    resolving,
    pickFile,
    reset,
    applyMapping,
    updateProduct,
    changeDestinationStore,
    importProducts,
    openConfirmation: () => setStage("confirming"),
    closeConfirmation: () => setStage("preview"),
    retry: () => setStage(review ? "preview" : "empty"),
  };
}
