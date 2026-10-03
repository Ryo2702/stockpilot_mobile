import { ChevronLeft, MoreVertical } from "lucide-react-native";
import { Directory } from "expo-file-system";
import { useEffect, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomNavigation, type BottomNavKey } from "@/components/ui/BottomNavigation";
import { IconButton } from "@/components/ui/IconButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { spacing, typography, useThemeStyles } from "@/theme";
import type { ThemeColors } from "@/theme/tokens";

import type { InventoryScreenController } from "../hooks/useInventoryScreen";
import BarcodeScannerModal from "@/components/ui/BarcodeScannerModal";
import type { CatalogCategoryOption } from "@/data/catalog.data";
import type { InventoryScreenProps } from "../types";
import {
  InventoryDetailContent,
  InventoryListContent,
  InventoryMessage,
  MovementDetailContent,
  MovementHistoryContent,
} from "./InventoryViews";
import {
  InventoryFilterSheet,
  InventoryMoreSheet,
  InventoryPreferencesSheet,
  InventorySortSheet,
} from "./InventorySheets";
import StockAdjustmentModal from "./StockAdjustmentModal";
import InventoryImportScreen from "./InventoryImportScreen";

type InventoryScreenViewProps = InventoryScreenProps & {
  categories: CatalogCategoryOption[];
  inventory: InventoryScreenController;
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background.app },
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    gap: spacing[4],
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
  },
  actions: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
  storeContext: { ...typography.caption, color: colors.text.secondary },
});

export default function InventoryScreenView({
  ownerStore,
  ownerStores,
  onSelectStore,
  onCreateStore,
  onOpenCatalogProduct,
  onScanBarcode,
  onNavigate,
  actionRequest,
  onActionRequestHandled,
  categories,
  inventory,
}: InventoryScreenViewProps) {
  const styles = useThemeStyles(createStyles);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const [moreVisible, setMoreVisible] = useState(false);
  const [preferencesVisible, setPreferencesVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  const handledActionRequest = useRef<number | null>(null);

  const subpage = inventory.page !== "list";
  const title = {
    list: "Inventory",
    detail: "Inventory Detail",
    movements: "Stock Movements",
    movementDetail: "Movement Detail",
    archived: "Archived Products",
  }[inventory.page];
  const goBack = () => {
    if (inventory.page === "detail") inventory.backToItemList();
    else if (inventory.page === "movements") inventory.backFromMovements();
    else if (inventory.page === "movementDetail") inventory.backFromMovementDetail();
    else if (inventory.page === "archived") inventory.backFromArchived();
  };

  const exportInventory = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const csv = await inventory.createExportCsv();
      if (Platform.OS === "web") {
        const fileName = `stockpilot-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        const directory = await Directory.pickDirectoryAsync();
        const fileName = `stockpilot-inventory-${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
        directory.createFile(fileName, "text/csv").write(csv);
      }
      inventory.showMessage(`Inventory exported for ${ownerStore.storeName}.`);
    } catch (error) {
      inventory.showMessage(error instanceof Error ? `Inventory couldn't be exported. ${error.message}` : "Inventory couldn't be exported. Try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleNavigation = (key: BottomNavKey) => {
    if (key === "camera") {
      setScannerVisible(true);
      return;
    }
    onNavigate(key);
  };
  const startInventoryImport = () => setImportVisible(true);

  useEffect(() => {
    if (!actionRequest || handledActionRequest.current === actionRequest.id) return;
    handledActionRequest.current = actionRequest.id;
    onActionRequestHandled?.(actionRequest.id);
    if (actionRequest.action === "import") startInventoryImport();
    else void exportInventory();
  }, [actionRequest, inventory, onActionRequestHandled]);

  if (importVisible) {
    return (
      <InventoryImportScreen
        ownerStore={ownerStore}
        ownerStores={ownerStores}
        onBack={() => setImportVisible(false)}
        onViewInventory={() => {
          setImportVisible(false);
          inventory.reload();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader
            title={title}
            leading={subpage ? <IconButton icon={ChevronLeft} label={`Back from ${title}`} tone="primary" onPress={goBack} /> : undefined}
            actions={(
              <View style={styles.actions}>
                <IconButton icon={MoreVertical} label="Inventory actions" size={22} onPress={() => setMoreVisible(true)} style={{ width: 44, height: 44 }} />
              </View>
            )}
            context={<Text style={styles.storeContext}>Store · {ownerStore.storeName}</Text>}
          />

          <InventoryMessage message={inventory.message} onDismiss={inventory.clearMessage} />

          {inventory.page === "list" || inventory.page === "archived" ? (
            <InventoryListContent
              ownerStore={ownerStore}
              inventory={inventory}
              archived={inventory.page === "archived"}
              onOpenFilters={() => setFiltersVisible(true)}
              onOpenSort={() => setSortVisible(true)}
              onOpenItem={(item) => inventory.openItem(item, inventory.page === "archived")}
              onAddProduct={() => onNavigate("catalog")}
              onImport={startInventoryImport}
              onOpenCatalog={() => onNavigate("catalog")}
            />
          ) : inventory.page === "detail" ? (
            <InventoryDetailContent
              inventory={inventory}
              onOpenMovement={(movement) => inventory.openMovement(movement, "detail")}
              onOpenAllMovements={(productId) => inventory.openMovements(productId)}
              onOpenCatalog={onOpenCatalogProduct}
            />
          ) : inventory.page === "movements" ? (
            <MovementHistoryContent
              inventory={inventory}
              onOpenMovement={(movement) => inventory.openMovement(movement, "movements")}
            />
          ) : (
            <MovementDetailContent inventory={inventory} />
          )}
        </ScrollView>
        <BottomNavigation activeKey="inventory" onChange={handleNavigation} />
      </View>

      <InventoryFilterSheet
        visible={filtersVisible}
        stockStatus={inventory.stockStatus}
        category={inventory.category}
        quantity={inventory.quantityFilter}
        categories={categories}
        onClose={() => setFiltersVisible(false)}
        onApply={(stockStatus, category, quantity) => {
          inventory.setStockStatus(stockStatus);
          inventory.setCategory(category);
          inventory.setQuantityFilter(quantity);
        }}
      />
      <InventorySortSheet
        visible={sortVisible}
        sort={inventory.sort}
        onClose={() => setSortVisible(false)}
        onApply={inventory.setSort}
      />
      <InventoryMoreSheet
        visible={moreVisible}
        onClose={() => setMoreVisible(false)}
        onMovements={() => inventory.openMovements()}
        onImport={startInventoryImport}
        onExport={() => void exportInventory()}
        exporting={exporting}
        onArchived={() => inventory.openArchived()}
        onPreferences={() => setPreferencesVisible(true)}
        onMore={() => onNavigate("more")}
      />
      <InventoryPreferencesSheet
        visible={preferencesVisible}
        defaultSort={inventory.defaultSort}
        onClose={() => setPreferencesVisible(false)}
        onSave={inventory.saveDefaultSort}
      />
      {inventory.detail?.item && inventory.detail.item.isActive ? (
        <StockAdjustmentModal
          visible={inventory.adjustVisible}
          item={inventory.detail.item}
          storeName={ownerStore.storeName}
          saving={inventory.savingStock}
          error={inventory.actionError}
          onClose={inventory.closeAdjustment}
          onSave={inventory.changeStock}
        />
      ) : null}
      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={(barcode) => {
          setScannerVisible(false);
          onScanBarcode(barcode);
        }}
      />
    </SafeAreaView>
  );
}
