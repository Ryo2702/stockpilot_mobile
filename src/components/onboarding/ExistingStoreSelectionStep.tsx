import * as DocumentPicker from "expo-document-picker";
import { File as ExpoFile } from "expo-file-system";
import { useSQLiteContext } from "expo-sqlite";
import {
  ArrowRight,
  Check,
  Coffee,
  Info,
  Plus,
  ShoppingBasket,
  Store,
  Upload,
  Wrench,
  type LucideIcon,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator as NativeActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import useStoreSelector from "@/components/store/store-selector/hooks/useStoreSelector";
import StoreSelectorModal from "@/components/store/store-selector/partials/StoreSelectorModal";
import { Button } from "@/components/ui/Button";
import { importInventoryCsv } from "@/services/inventory";
import type { OwnerStore } from "@/services/owner-store.service";
import { radii, spacing, typography, useTheme, useThemeStyles } from "@/theme";
import type { ThemeColors } from "@/theme/tokens";
import type { StoreInput } from "@/validation/store.validation";

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

function sameStore(left: OwnerStore, right: OwnerStore) {
  return left.businessId === right.businessId && left.storeId === right.storeId;
}

function getStoreIcon(storeType: OwnerStore["storeType"]): LucideIcon {
  if (storeType === "cafe_shop" || storeType === "food_beverage") return Coffee;
  if (storeType === "mini_store" || storeType === "convenience" || storeType === "grocery") {
    return ShoppingBasket;
  }
  if (storeType === "motor_shop" || storeType === "hardware") return Wrench;
  return Store;
}

export default function ExistingStoreSelectionStep({
  ownerStore,
  ownerStores,
  onSelectStore,
  onCreateStore,
  onComplete,
}: ExistingStoreSelectionStepProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const db = useSQLiteContext();
  const [selectedStore, setSelectedStore] = useState(ownerStore);
  const [additionalStores, setAdditionalStores] = useState<OwnerStore[]>([]);
  const [entering, setEntering] = useState(false);
  const [switchingStoreId, setSwitchingStoreId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [message, setMessage] = useState("");
  const [selectorWidth, setSelectorWidth] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const storePagerRef = useRef<ScrollView>(null);
  const screenBusy = importing || entering || switchingStoreId !== null;

  const seenStoreIds = new Set<string>();
  const selectableStores = [...ownerStores, ...additionalStores, ownerStore, selectedStore].filter((store) => {
    const key = JSON.stringify([store.businessId, store.storeId]);
    if (seenStoreIds.has(key)) return false;
    seenStoreIds.add(key);
    return true;
  });
  const storePages: OwnerStore[][] = [];
  for (let index = 0; index < selectableStores.length; index += 3) {
    storePages.push(selectableStores.slice(index, index + 3));
  }

  const selectedStoreIndex = Math.max(
    selectableStores.findIndex((store) => sameStore(store, selectedStore)),
    0,
  );
  const selectedPageIndex = Math.floor(selectedStoreIndex / 3);

  useEffect(() => {
    if (!selectorWidth || !storePages.length) return;
    const page = Math.min(selectedPageIndex, storePages.length - 1);
    setCurrentPage(page);
    storePagerRef.current?.scrollTo({ x: page * selectorWidth, y: 0, animated: false });
  }, [selectedPageIndex, selectorWidth, storePages.length]);

  const addAdditionalStores = (stores: OwnerStore[]) => {
    setAdditionalStores((current) => {
      const known = new Set(
        [...ownerStores, ...current].map((store) => JSON.stringify([store.businessId, store.storeId])),
      );
      return [
        ...current,
        ...stores.filter((store) => {
          const key = JSON.stringify([store.businessId, store.storeId]);
          if (known.has(key)) return false;
          known.add(key);
          return true;
        }),
      ];
    });
  };

  const selectStore = async (store: OwnerStore) => {
    setMessage("");
    await onSelectStore?.(store);
    setSelectedStore(store);
  };

  const createStore = async (storeInput: StoreInput) => {
    if (!onCreateStore) throw new Error("Store creation is unavailable.");
    const store = await onCreateStore(storeInput);
    addAdditionalStores([store]);
    return store;
  };

  const selector = useStoreSelector({
    ownerStore: selectedStore,
    ownerStores: selectableStores,
    onSelectStore: selectStore,
    onCreateStore: onCreateStore ? createStore : undefined,
  });

  const switchStore = async (store: OwnerStore) => {
    if (switchingStoreId || sameStore(store, selectedStore)) return;
    setSwitchingStoreId(store.storeId);
    try {
      await selectStore(store);
    } catch {
      setMessage("Couldn't switch stores. Please try again.");
    } finally {
      setSwitchingStoreId(null);
    }
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
      addAdditionalStores(importResult.createdStores);
      setImportProgress({
        phase: "complete",
        processed: importResult.importedCount,
        total: importResult.importedCount,
        percent: 100,
      });
      const createdStoreNotice =
        importResult.createdStores.length === 1
          ? " Added " + importResult.createdStores[0].storeName + " to the selector."
          : importResult.createdStores.length > 1
            ? " Added " + importResult.createdStores.length + " new stores to the selector."
            : "";
      const successMessage =
        "Imported " +
        importResult.importedCount.toLocaleString() +
        " items. Matching SKUs have updated quantities." +
        createdStoreNotice;
      setMessage(successMessage);

      const storeToSelect = importResult.createdStores[0] ?? importResult.destinationStore;
      if (!sameStore(storeToSelect, selectedStore)) {
        try {
          await selectStore(storeToSelect);
        } catch {
          setMessage(successMessage + " Select " + storeToSelect.storeName + " to continue.");
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
    if (!selectableStores.length) {
      setMessage("Create or import a store before continuing.");
      return;
    }
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
      <View pointerEvents="none" style={styles.topShape} />
      <View pointerEvents="none" style={styles.bottomShape} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <Text style={styles.brandName}>
            <Text>Stock</Text>
            <Text style={styles.brandAccent}>Pilot</Text>
          </Text>
          <Text style={styles.tagline}>Smarter Inventory. Less Worry.</Text>
        </View>

        <View style={styles.welcome}>
          <Text style={styles.welcomeTitle}>Welcome back!</Text>
          <Text style={styles.greeting}>Hi, {ownerStore.ownerName}!</Text>
          <Text style={styles.subtitle}>Select a store to continue or add another store.</Text>
        </View>

        <View style={styles.storeSection}>
          {selectableStores.length ? (
            <View
              style={styles.storePagerViewport}
              onLayout={(event) => setSelectorWidth(event.nativeEvent.layout.width)}
            >
              <ScrollView
                ref={storePagerRef}
                horizontal
                pagingEnabled={storePages.length > 1}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(event) => {
                  if (selectorWidth) {
                    setCurrentPage(Math.round(event.nativeEvent.contentOffset.x / selectorWidth));
                  }
                }}
              >
                {storePages.map((page, pageIndex) => (
                  <View
                    key={pageIndex}
                    style={[styles.storePage, { width: selectorWidth || undefined }]}
                  >
                    {page.map((store) => {
                      const selected = sameStore(store, selectedStore);
                      const StoreIcon = getStoreIcon(store.storeType);
                      const switching = switchingStoreId === store.storeId;
                      return (
                        <Pressable
                          key={store.storeId}
                          accessibilityRole="button"
                          accessibilityLabel={store.storeName + (selected ? ", current store" : "")}
                          accessibilityState={{ selected, disabled: screenBusy }}
                          disabled={screenBusy}
                          onPress={() => void switchStore(store)}
                          style={({ pressed }) => [
                            styles.storeOption,
                            pressed && !selected && styles.storeOptionPressed,
                          ]}
                        >
                          <View
                            style={[
                              styles.storeCircle,
                              selected ? styles.selectedStoreCircle : styles.unselectedStoreCircle,
                            ]}
                          >
                            {switching ? (
                              <NativeActivityIndicator color={colors.primary[600]} />
                            ) : (
                              <StoreIcon
                                color={selected ? colors.primary[600] : colors.text.secondary}
                                size={selected ? 34 : 30}
                                strokeWidth={1.8}
                              />
                            )}
                            {selected ? (
                              <View style={styles.checkBadge}>
                                <Check color={colors.text.onPrimary} size={14} strokeWidth={3} />
                              </View>
                            ) : null}
                          </View>
                          <Text
                            numberOfLines={2}
                            style={[styles.storeName, selected && styles.selectedStoreName]}
                          >
                            {store.storeName}
                          </Text>
                          {selected ? (
                            <View style={styles.currentStorePill}>
                              <Text style={styles.currentStoreText}>Current store</Text>
                            </View>
                          ) : null}
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : (
            <Text style={styles.emptyStores}>Create or import a store to continue.</Text>
          )}
          {storePages.length > 1 ? (
            <View
              accessibilityLabel={"Store page " + (currentPage + 1) + " of " + storePages.length}
              style={styles.pagination}
            >
              {storePages.map((_, index) => (
                <View
                  key={index}
                  style={[styles.pageDot, index === currentPage && styles.pageDotSelected]}
                />
              ))}
            </View>
          ) : null}
          <Text style={styles.storeIsolation}>
            Catalog, inventory, movements, insights, and reports stay separate for each store.
          </Text>
        </View>

        <View style={styles.actionCards}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !onCreateStore || screenBusy }}
            disabled={!onCreateStore || screenBusy}
            onPress={selector.openCreate}
            style={({ pressed }) => [
              styles.actionCard,
              styles.addStoreCard,
              pressed && styles.actionPressed,
              (!onCreateStore || screenBusy) && styles.actionDisabled,
            ]}
          >
            <View style={[styles.actionIcon, styles.addStoreIcon]}>
              <Plus color={colors.text.onPrimary} size={23} strokeWidth={2.4} />
            </View>
            <Text style={styles.actionTitle}>Add store</Text>
            <Text style={styles.actionSubtitle}>Create a new store</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: screenBusy, busy: importing }}
            disabled={screenBusy}
            onPress={() => void importCsv()}
            style={({ pressed }) => [
              styles.actionCard,
              styles.importCard,
              pressed && styles.actionPressed,
              screenBusy && styles.actionDisabled,
            ]}
          >
            <View style={[styles.actionIcon, styles.importIcon]}>
              {importing ? (
                <NativeActivityIndicator color={colors.primary[600]} size="small" />
              ) : (
                <Upload color={colors.primary[700]} size={22} strokeWidth={2} />
              )}
            </View>
            <Text style={styles.actionTitle}>Import</Text>
            <Text style={styles.actionSubtitle}>Load from CSV</Text>
          </Pressable>
        </View>

        <View style={styles.importInfo}>
          <Info color={colors.primary[600]} size={20} strokeWidth={2} />
          <Text style={styles.importHint}>
            CSV: name and quantity are required; store_name, sku, reorder_level, and critical_level are optional. Unknown store names create stores. Matching SKUs replace current stock.
          </Text>
        </View>

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
              <View style={[styles.progressFill, { width: `${importProgress.percent}%` }]} />
            </View>
            <Text style={styles.progressDetail}>
              {importProgress.phase === "reading"
                ? "Reading the selected file."
                : importProgress.phase === "complete"
                  ? importProgress.processed.toLocaleString() + " items imported."
                  : importProgress.total
                    ? importProgress.processed.toLocaleString() +
                      " of " +
                      importProgress.total.toLocaleString() +
                      " rows " +
                      (importProgress.phase === "validating" ? "checked" : "processed") +
                      "."
                    : "Preparing CSV rows."}
            </Text>
          </View>
        ) : null}
        {message ? (
          <Text accessibilityRole="alert" style={styles.statusMessage}>
            {message}
          </Text>
        ) : null}

        <Button
          title="Enter"
          icon={ArrowRight}
          size="lg"
          loading={entering}
          disabled={!selectableStores.length || screenBusy}
          accessibilityLabel={"Enter " + selectedStore.storeName}
          onPress={() => void enter()}
          style={styles.enterButton}
        />
      </ScrollView>
      <StoreSelectorModal
        ownerStore={selectedStore}
        onCreateStore={onCreateStore ? createStore : undefined}
        showAddStoreButton
        disabled={screenBusy}
        selector={selector}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: colors.background.surface,
  },
  scrollView: {
    flex: 1,
  },
  topShape: {
    position: "absolute",
    top: -206,
    left: -172,
    width: 328,
    height: 328,
    borderRadius: radii.full,
    backgroundColor: colors.primary[50],
    opacity: 0.75,
  },
  bottomShape: {
    position: "absolute",
    right: -188,
    bottom: -222,
    width: 340,
    height: 340,
    borderRadius: radii.full,
    backgroundColor: colors.primary[50],
    opacity: 0.7,
  },
  content: {
    flexGrow: 1,
    justifyContent: "space-between",
    gap: spacing[4],
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
  },
  brand: {
    alignItems: "center",
    gap: spacing[1],
  },
  brandName: {
    ...typography.display,
    color: colors.text.primary,
    textAlign: "center",
  },
  brandAccent: {
    color: colors.primary[600],
  },
  tagline: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: "center",
  },
  welcome: {
    alignItems: "center",
    gap: spacing[1],
  },
  welcomeTitle: {
    ...typography.h1,
    color: colors.text.primary,
    textAlign: "center",
  },
  greeting: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: "center",
  },
  subtitle: {
    ...typography.bodySmall,
    maxWidth: 320,
    color: colors.text.secondary,
    textAlign: "center",
  },
  storeSection: {
    width: "100%",
    gap: spacing[2],
  },
  storePagerViewport: {
    width: "100%",
  },
  storePage: {
    minHeight: 160,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: spacing[1],
  },
  storeOption: {
    flex: 1,
    minWidth: 0,
    maxWidth: 112,
    alignItems: "center",
    gap: spacing[2],
    paddingTop: spacing[1],
  },
  storeOptionPressed: {
    opacity: 0.78,
  },
  storeCircle: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
  },
  selectedStoreCircle: {
    width: 92,
    height: 92,
    borderWidth: 2,
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  unselectedStoreCircle: {
    width: 82,
    height: 82,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  checkBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background.surface,
    borderRadius: radii.full,
    backgroundColor: colors.primary[600],
  },
  storeName: {
    ...typography.bodySmall,
    minHeight: 36,
    color: colors.text.primary,
    textAlign: "center",
  },
  selectedStoreName: {
    fontWeight: "600",
  },
  currentStorePill: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] / 2,
    borderRadius: radii.full,
    backgroundColor: colors.primary[50],
  },
  currentStoreText: {
    ...typography.caption,
    color: colors.primary[700],
    fontWeight: "600",
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingTop: spacing[1],
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: radii.full,
    backgroundColor: colors.gray[200],
  },
  pageDotSelected: {
    backgroundColor: colors.primary[600],
  },
  storeIsolation: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: "center",
  },
  emptyStores: {
    ...typography.bodySmall,
    paddingVertical: spacing[8],
    color: colors.text.secondary,
    textAlign: "center",
  },
  actionCards: {
    flexDirection: "row",
    gap: spacing[3],
  },
  actionCard: {
    flex: 1,
    minHeight: 122,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[1],
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.xl,
  },
  addStoreCard: {
    backgroundColor: colors.primary[50],
  },
  importCard: {
    backgroundColor: colors.background.subtle,
  },
  actionPressed: {
    opacity: 0.76,
  },
  actionDisabled: {
    opacity: 0.55,
  },
  actionIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing[1],
    borderRadius: radii.full,
  },
  addStoreIcon: {
    backgroundColor: colors.primary[600],
  },
  importIcon: {
    backgroundColor: colors.gray[100],
  },
  actionTitle: {
    ...typography.label,
    color: colors.text.primary,
    fontWeight: "600",
  },
  actionSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: "center",
  },
  importInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radii.lg,
    backgroundColor: colors.primary[50],
  },
  importHint: {
    ...typography.caption,
    flex: 1,
    color: colors.text.secondary,
    lineHeight: 18,
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
  statusMessage: {
    ...typography.caption,
    padding: spacing[3],
    borderRadius: radii.md,
    backgroundColor: colors.background.subtle,
    color: colors.text.secondary,
    textAlign: "center",
  },
  enterButton: {
    width: "100%",
    minHeight: 56,
    flexDirection: "row-reverse",
    borderRadius: radii.lg,
  },
});
