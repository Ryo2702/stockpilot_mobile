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
import { colors, spacing, typography } from "@/theme";
import type { StoreInput } from "@/validation/store.validation";

const headMascot = require("../../../assets/images/stockpilot/headMascot-transparent.png");

type ExistingStoreSelectionStepProps = {
  ownerStore: OwnerStore;
  ownerStores: OwnerStore[];
  onSelectStore?: (store: OwnerStore) => Promise<void>;
  onCreateStore?: (store: StoreInput) => Promise<OwnerStore>;
  onComplete: (store: OwnerStore) => void;
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
  const [entering, setEntering] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");

  const selectStore = async (store: OwnerStore) => {
    setMessage("");
    await onSelectStore?.(store);
    setSelectedStore(store);
  };

  const importCsv = async () => {
    setMessage("");
    setImporting(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/vnd.ms-excel"],
        base64: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset.name.toLowerCase().endsWith(".csv")) {
        throw new Error("Choose a .csv inventory file.");
      }
      const csv =
        Platform.OS === "web"
          ? await (asset.file?.text() ?? Promise.reject(new Error("Couldn't read the selected file.")))
          : await new ExpoFile(asset.uri).text();
      const count = await importInventoryCsv(db, selectedStore, csv, asset.name);
      setMessage(`Imported ${count} items. Matching SKUs have updated quantities.`);
    } catch (error) {
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
            ownerStores={ownerStores}
            onSelectStore={selectStore}
            onCreateStore={onCreateStore}
            showAddStoreButton
          />
          <Text style={styles.importHint}>
            CSV: name and quantity are required; sku, reorder_level, and critical_level are optional.{" "}
            Matching SKUs replace current stock.
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
  button: {
    width: "100%",
    maxWidth: 420,
  },
});
