import { useSQLiteContext } from "expo-sqlite";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertCircle, ArrowLeft, CircleCheck, Upload } from "lucide-react-native";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import type { OwnerStore } from "@/services/owner-store.service";
import type { InventoryFileImportProduct } from "@/services/inventory";
import { useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";

import { createInventoryImportStyles } from "./inventory-import.styles";
import { ConfirmationDialog, ImportPreview, ProductEditor } from "./InventoryImportReview";
import { ImportStepper, SelectedFileCard, StoreContext, StorePicker } from "./InventoryImportSetup";
import useInventoryImport from "../hooks/useInventoryImport";

type InventoryImportScreenProps = {
  ownerStore: OwnerStore;
  ownerStores: OwnerStore[];
  onBack: () => void;
  onViewInventory: () => void;
};

export default function InventoryImportScreen({
  ownerStore,
  ownerStores,
  onBack,
  onViewInventory,
}: InventoryImportScreenProps) {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const styles = useThemeStyles(createInventoryImportStyles);
  const importer = useInventoryImport(db, ownerStore);
  const [editing, setEditing] = useState<InventoryFileImportProduct | null>(null);
  const [storePickerVisible, setStorePickerVisible] = useState(false);

  const stores = ownerStores.filter((store) => store.businessId === ownerStore.businessId);
  const review = importer.review;
  const isImporting = importer.stage === "importing";
  const isBusy = isImporting || importer.stage === "parsing" || importer.resolving;
  const stageStep: 1 | 2 | 3 = importer.stage === "empty" || importer.stage === "parsing" ? 1 : importer.stage === "importing" || importer.stage === "success" ? 3 : 2;
  const remaining = review ? review.detectedCount - review.readyCount : 0;

  const saveProduct = async (updates: Partial<InventoryFileImportProduct>) => {
    if (!editing) return;
    if (await importer.updateProduct(editing.id, updates)) setEditing(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <IconButton icon={ArrowLeft} label="Back to inventory" tone="primary" disabled={isBusy} onPress={onBack} />
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Import Inventory</Text>
              <Text style={styles.subtitle}>Add multiple products from an existing file</Text>
            </View>
          </View>
          <StoreContext
            store={importer.destinationStore}
            disabled={isBusy || importer.stage === "success"}
            onPress={() => setStorePickerVisible(true)}
          />
          <ImportStepper step={stageStep} />

          {importer.stage === "empty" ? (
            <View style={styles.emptyContent}>
              <Card style={styles.pickerCard}>
                <View style={styles.pickerIcon}><Upload color={colors.primary[600]} size={28} /></View>
                <Text style={styles.pickerTitle}>Choose inventory file</Text>
                <Text style={styles.pickerCopy}>Import products from Excel, DOCX, TXT, or CSV files.</Text>
                <Button title="Select File" icon={Upload} onPress={() => void importer.pickFile()} style={styles.fullButton} />
                <Text style={styles.supported}>Supported: XLSX, XLS, DOCX, TXT, CSV</Text>
              </Card>
              <Text style={styles.reassurance}>StockPilot will review the file before anything is added to your inventory.</Text>
            </View>
          ) : null}

          {importer.selectedFile && importer.stage !== "empty" && importer.stage !== "success" ? (
            <SelectedFileCard
              file={importer.selectedFile}
              detectedCount={review?.detectedCount}
              parsing={importer.stage === "parsing"}
              onChange={() => void importer.pickFile()}
              onRemove={importer.reset}
            />
          ) : null}

          {importer.stage === "parsing" ? (
            <View style={styles.parsingBlock}>
              <ActivityIndicator color={colors.primary[600]} />
              <Text style={styles.parsingTitle}>{importer.progress?.phase === "reading" ? "Reading inventory file..." : "Preparing product preview..."}</Text>
              <Text style={styles.copy}>Your inventory is unchanged while StockPilot checks the file.</Text>
            </View>
          ) : null}

          {importer.stage === "preview" && review ? (
            <ImportPreview
              review={review}
              error={importer.error}
              resolving={importer.resolving}
              onEdit={setEditing}
              onOpenConfirmation={importer.openConfirmation}
            />
          ) : null}

          {importer.stage === "importing" ? (
            <View style={styles.importingBlock}>
              <ActivityIndicator color={colors.primary[600]} />
              <Text style={styles.parsingTitle}>Importing products...</Text>
              <Text style={styles.copy}>{importer.progress?.processed ?? 0} of {importer.progress?.total ?? review?.readyCount ?? 0} products</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.min(100, ((importer.progress?.processed ?? 0) / Math.max(1, importer.progress?.total ?? 1)) * 100)}%` }]} />
              </View>
            </View>
          ) : null}

          {importer.stage === "success" && importer.result ? (
            <Card style={styles.resultCard}>
              <CircleCheck color={colors.semantic.success} size={36} />
              <Text style={styles.resultTitle}>{importer.result.remainingReviewCount ? "Import Completed With Issues" : "Import Completed"}</Text>
              <Text style={styles.resultCopy}>{importer.result.importedCount.toLocaleString()} {importer.result.importedCount === 1 ? "product" : "products"} imported to {importer.destinationStore.storeName}.</Text>
              <Text style={styles.resultCopy}>{importer.result.updatedProductCount.toLocaleString()} existing {importer.result.updatedProductCount === 1 ? "product" : "products"} updated.</Text>
              {importer.result.remainingReviewCount ? <Text style={styles.issueLine}>{importer.result.remainingReviewCount.toLocaleString()} {importer.result.remainingReviewCount === 1 ? "product still needs" : "products still need"} review.</Text> : null}
              <View style={styles.resultActions}>
                <Button title="View Inventory" onPress={onViewInventory} style={styles.flexButton} />
                <Button title="Import Another File" variant="secondary" onPress={importer.reset} style={styles.flexButton} />
              </View>
            </Card>
          ) : null}

          {importer.stage === "failure" ? (
            <Card style={styles.failureCard}>
              <AlertCircle color={colors.semantic.danger} size={30} />
              <Text style={styles.resultTitle}>Import could not be completed</Text>
              <Text accessibilityRole="alert" style={styles.resultCopy}>{importer.error || "Unable to read this file."}</Text>
              {review ? <Text style={styles.copy}>No inventory changes were saved.</Text> : null}
              <View style={styles.resultActions}>
                <Button title="Choose Another File" variant="secondary" onPress={() => void importer.pickFile()} style={styles.flexButton} />
                <Button title="Try Again" onPress={importer.retry} style={styles.flexButton} />
              </View>
            </Card>
          ) : null}
        </ScrollView>
      </View>

      <StorePicker
        visible={storePickerVisible}
        stores={stores}
        selected={importer.destinationStore}
        onClose={() => setStorePickerVisible(false)}
        onSelect={(store) => void importer.changeDestinationStore(store)}
      />
      <ProductEditor
        row={editing}
        visible={Boolean(editing)}
        saving={importer.resolving}
        onClose={() => setEditing(null)}
        onSave={saveProduct}
      />
      <ConfirmationDialog
        visible={importer.stage === "confirming" && Boolean(review)}
        count={review?.readyCount ?? 0}
        storeName={importer.destinationStore.storeName}
        remaining={remaining}
        onCancel={importer.closeConfirmation}
        onConfirm={() => void importer.importProducts()}
      />
    </SafeAreaView>
  );
}
