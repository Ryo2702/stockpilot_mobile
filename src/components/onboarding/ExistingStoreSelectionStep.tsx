import * as DocumentPicker from "expo-document-picker";
import { File as ExpoFile } from "expo-file-system";
import { useSQLiteContext } from "expo-sqlite";
import { Upload } from "lucide-react-native";
import { useState } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import StoreSelector from "@/components/store/StoreSelector";
import { Button } from "@/components/ui/Button";
import { importInventoryCsv } from "@/services/inventory-import.service";
import type { OwnerStore } from "@/services/owner-store.service";
import { colors, radii, spacing, typography } from "@/theme";
import type { StoreInput } from "@/validation/store.validation";

const headMascot = require("../../../assets/images/stockpilot/headMascot-transparent.png");

type ExistingStoreSelectionStepProps = {
  ownerStore: OwnerStore;
  ownerStores: OwnerStore[];
  onSelectStore?: (store: OwnerStore) => Promise<void>;
  onCreateStore?: (store: StoreInput) => Promise<OwnerStore>;
  onComplete: (store: OwnerStore) => void;
};

type ImportProgress = {
  phase: "reading" | "validating" | "importing" | "complete";
  processed: number;
  total: number;
  percent: number;
};

export default function ExistingStoreSelectionStep({
  ownerStore,
  ownerStores,
  onSelectStore,
  onCreateStore,
  onComplete,
}: ExistingStoreSelectionStepProps) {
  const db = useSQLiteContext();
  const [selectedStore, setSelectedStore] = useState(ownerStore);
  const [importedStores, setImportedStores] = useState<OwnerStore[]>([]);
  const [entering, setEntering] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [message, setMessage] = useState("");
  const selectableStores = [
    ...ownerStores,
    ...importedStores.filter(
      (imported) =>
        !ownerStores.some(
          (current) =>
            current.businessId === imported.businessId && current.storeId === imported.storeId,
        ),
    ),
  ];

  const selectStore = async (store: OwnerStore) => {
    setMessage("");
    await onSelectStore?.(store);
    setSelectedStore(store);
  };

  const importCsv = async () => {
    setMessage("");
    setImportProgress(null);
    setImporting(true);
    try {
      const selection = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel"],
        base64: false,
        copyToCacheDirectory: true,
      });
      if (selection.canceled) return;

      const asset = selection.assets[0];
      if (!asset.name.toLowerCase().endsWith(".csv")) {
        throw new Error("Choose a .csv inventory file.");
      }
      setImportProgress({ phase: "reading", processed: 0, total: 0, percent: 0 });
      const csv =
        Platform.OS === "web"
          ? await (asset.file?.text() ?? Promise.reject(new Error("Couldn't read the selected file.")))
          : await new ExpoFile(asset.uri).text();
      const importResult = await importInventoryCsv(
        db,
        selectedStore,
        csv,
        asset.name,
        (progress) => setImportProgress(progress),
      );
      setImportedStores((current) => [
        ...current,
        ...importResult.createdStores.filter(
          (created) =>
            !current.some(
              (existing) =>
                existing.businessId === created.businessId && existing.storeId === created.storeId,
            ),
        ),
      ]);
      setImportProgress({
        phase: "complete",
        processed: importResult.importedCount,
        total: importResult.importedCount,
        percent: 100,
      });
      const createdStoreNotice =
        importResult.createdStores.length === 1
          ? ` Added ${importResult.createdStores[0].storeName} to the selector.`
          : importResult.createdStores.length > 1
            ? ` Added ${importResult.createdStores.length} new stores to the selector.`
            : "";
      const successMessage = `Imported ${importResult.importedCount.toLocaleString()} items. Matching SKUs have updated quantities.${createdStoreNotice}`;
      setMessage(successMessage);

      const storeToSelect = importResult.createdStores[0] ?? importResult.destinationStore;
      if (
        storeToSelect.businessId !== selectedStore.businessId ||
        storeToSelect.storeId !== selectedStore.storeId
      ) {
        setSelectedStore(storeToSelect);
        try {
          await onSelectStore?.(storeToSelect);
        } catch {
          setMessage(`${successMessage} Select ${storeToSelect.storeName} to continue.`);
        }
      }
    } catch (error) {
      setImportProgress(null);
      setMessage(error instanceof Error ? error.message : "Couldn't import this CSV file.");
    } finally {
      setImporting(false);
    }
  };

  const enter = async () => {
    setMessage("");
    setEntering(true);
    try {
      await onSelectStore?.(selectedStore);
      onComplete(selectedStore);
    } catch {
      setMessage("Couldn't switch stores. Please try again.");
    } finally {
      setEntering(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.content}>
        <Image
          accessible
          accessibilityLabel="StockPilot mascot"
          source={headMascot}
          resizeMode="contain"
          style={styles.mascot}
        />
        <Text style={styles.title}>Welcome back to StockPilot</Text>
        <Text style={styles.greeting}>Hi, {ownerStore.ownerName}!</Text>
        <Text style={styles.subtitle}>Select a store to continue or add another store.</Text>
        <View style={styles.storeActions}>
          <StoreSelector
            ownerStore={selectedStore}
            ownerStores={selectableStores}
            onSelectStore={selectStore}
            onCreateStore={onCreateStore}
            showAddStoreButton
            disabled={importing}
          />
          <Text style={styles.importHint}>
            CSV: name and quantity are required; store_name, sku, reorder_level, and critical_level are optional.{" "}
            Unknown store names create stores. Matching SKUs replace current stock.
          </Text>
          <Button
            title="Import"
            icon={Upload}
            variant="secondary"
            loading={importing}
            disabled={entering}
            onPress={() => void importCsv()}
            style={styles.actionButton}
          />
          {importProgress ? (
            <View style={styles.progressPanel}>
              <View style={styles.progressHeading}>
                <Text style={styles.progressLabel}>
                  {importProgress.phase === "reading"
                    ? "Reading CSV"
                    : importProgress.phase === "validating"
                      ? "Validating rows"
                      : importProgress.phase === "importing"
                        ? "Importing inventory"
                        : "Import complete"}
                </Text>
                <Text style={styles.progressPercent}>{Math.floor(importProgress.percent)}%</Text>
              </View>
              <View
                accessibilityLabel="CSV import progress"
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: 100, now: Math.floor(importProgress.percent) }}
                style={styles.progressTrack}
              >
                <View
                  style={[styles.progressFill, { width: `${importProgress.percent}%` }]}
                />
              </View>
              <Text style={styles.progressDetail}>
                {importProgress.phase === "reading"
                  ? "Reading the selected file."
                  : importProgress.phase === "complete"
                    ? `${importProgress.processed.toLocaleString()} items imported.`
                    : importProgress.total
                      ? `${importProgress.processed.toLocaleString()} of ${importProgress.total.toLocaleString()} rows ${importProgress.phase === "validating" ? "checked" : "processed"}.`
                      : "Preparing CSV rows."}
              </Text>
            </View>
          ) : null}
          {message ? (
            <Text accessibilityRole="alert" style={styles.importMessage}>
              {message}
            </Text>
          ) : null}
        </View>
        <Button
          title="Enter"
          size="lg"
          loading={entering}
          disabled={importing}
          onPress={enter}
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.surface,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[4],
    padding: spacing[6],
  },
  mascot: {
    width: 150,
    height: 150,
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: "center",
  },
  greeting: {
    ...typography.title,
    color: colors.text.primary,
    textAlign: "center",
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: "center",
  },
  storeActions: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    gap: spacing[3],
  },
  importHint: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: "center",
  },
  importMessage: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: "center",
  },
  actionButton: {
    width: "100%",
  },
  progressPanel: {
    width: "100%",
    gap: spacing[2],
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.subtle,
  },
  progressHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  progressLabel: {
    ...typography.label,
    flex: 1,
    color: colors.text.primary,
  },
  progressPercent: {
    ...typography.label,
    color: colors.primary[700],
  },
  progressTrack: {
    height: 8,
    overflow: "hidden",
    borderRadius: radii.full,
    backgroundColor: colors.gray[200],
  },
  progressFill: {
    height: "100%",
    borderRadius: radii.full,
    backgroundColor: colors.primary[600],
  },
  progressDetail: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  button: {
    width: "100%",
    maxWidth: 420,
  },
});
