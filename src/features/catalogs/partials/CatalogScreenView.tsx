import { Archive, Plus, RotateCcw } from "lucide-react-native";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import StoreSelector from "@/components/store/StoreSelector";
import { BottomNavigation, type BottomNavKey } from "@/components/ui/BottomNavigation";
import { Button } from "@/components/ui/Button";
import { control, radii, spacing, typography, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";

import CatalogFilters from "../components/CatalogFilters";
import CatalogItemCard from "../components/CatalogItemCard";
import type { CatalogCategoryOption } from "../data/catalog.data";
import type { CatalogScreenController } from "../hooks/useCatalogScreen";
import ArchiveProductModal from "./ArchiveProductModal";
import BarcodeScannerModal from "./BarcodeScannerModal";
import CatalogEmptyState from "./CatalogEmptyState";
import CatalogFormModal from "./CatalogFormModal";
import ProductDetailsModal from "./ProductDetailsModal";
import type { CatalogScreenProps } from "../types/catalog-screen.types";

type CatalogScreenViewProps = CatalogScreenProps & {
  categories: CatalogCategoryOption[];
  catalog: CatalogScreenController;
};

export default function CatalogScreenView({
  ownerStore,
  ownerStores,
  onSelectStore,
  onCreateStore,
  onImportInventory,
  onNavigate,
  categories,
  catalog,
}: CatalogScreenViewProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const compactHeader = useWindowDimensions().width < 390;
  const {
    products,
    search,
    category,
    stockStatus,
    sort,
    showArchived,
    loading,
    loadingMore,
    hasMore,
    loadError,
    actionError,
    formVisible,
    editingProduct,
    scannerVisible,
    formBarcode,
    detailVisible,
    detailProduct,
    movements,
    loadingHistory,
    archiveTarget,
    archiving,
    successMessage,
    undoArchivedProduct,
    empty,
    filteredEmpty,
    setCategory,
    setStockStatus,
    setSort,
    changeSearch,
    openCreate,
    openEditProduct,
    openSearchScanner,
    openArchiveConfirmation,
    closeForm,
    openFormScanner,
    closeScanner,
    handleBarcodeScanned,
    saveProduct,
    openProductDetails,
    loadMore,
    confirmArchive,
    restore,
    undoArchive,
    editProductFromDetails,
    archiveProductFromDetails,
    closeDetails,
    closeArchive,
    toggleArchived,
    retryLoad,
  } = catalog;
  const handleNavigation = (key: BottomNavKey) => {
    if (key === "camera") {
      openSearchScanner();
      return;
    }
    onNavigate(key);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, compactHeader && styles.compactHeader]}>
            <View style={[styles.headingCopy, compactHeader && styles.compactHeadingCopy]}>
              <Text style={styles.title}>Catalog</Text>
              <StoreSelector
                ownerStore={ownerStore}
                ownerStores={ownerStores}
                onSelectStore={onSelectStore}
                onCreateStore={onCreateStore}
              />
            </View>
            <Button
              title="Add Product"
              icon={Plus}
              onPress={openCreate}
              style={compactHeader && styles.compactHeaderButton}
            />
          </View>

          <View style={styles.listActions}>
            <Text style={styles.storeName}>{ownerStore.storeName}</Text>
            <Button
              title={showArchived ? "Active Catalog" : "Archived Products"}
              icon={showArchived ? RotateCcw : Archive}
              size="sm"
              variant="secondary"
              onPress={toggleArchived}
            />
          </View>

          <CatalogFilters
            search={search}
            category={category}
            stockStatus={stockStatus}
            sort={sort}
            categories={categories}
            onSearchChange={changeSearch}
            onCategoryChange={setCategory}
            onStockStatusChange={setStockStatus}
            onSortChange={setSort}
          />

          {successMessage ? (
            <View accessibilityLiveRegion="polite" style={styles.success}>
              <Text style={styles.successText}>{successMessage}</Text>
              {undoArchivedProduct ? (
                <Button title="Undo" size="sm" variant="ghost" onPress={() => void undoArchive()} />
              ) : null}
            </View>
          ) : null}
          {actionError ? (
            <Text accessibilityRole="alert" style={styles.error}>{actionError}</Text>
          ) : null}

          {loading ? (
            <View style={styles.status}>
              <ActivityIndicator color={colors.primary[600]} />
              <Text style={styles.statusText}>Loading catalog…</Text>
            </View>
          ) : loadError ? (
            <View style={styles.status}>
              <Text accessibilityRole="alert" style={styles.error}>{loadError}</Text>
              <Button
                title="Try again"
                variant="secondary"
                onPress={retryLoad}
              />
            </View>
          ) : products.length ? (
            <View style={styles.list}>
              <Text style={styles.resultCount}>
                {products.length}{hasMore ? "+" : ""} {products.length === 1 ? "product" : "products"}
              </Text>
              {products.map((product) => (
                <CatalogItemCard
                  key={product.id}
                  product={product}
                  archived={showArchived}
                  onOpen={() => void openProductDetails(product)}
                  onEdit={() => openEditProduct(product)}
                  onArchive={() => openArchiveConfirmation(product)}
                  onRestore={() => void restore(product)}
                />
              ))}
              {hasMore ? (
                <Button
                  title={loadingMore ? "Loading…" : "Load more"}
                  variant="secondary"
                  loading={loadingMore}
                  onPress={() => void loadMore()}
                />
              ) : null}
            </View>
          ) : empty ? (
            <CatalogEmptyState
              archived={showArchived}
              filtered={filteredEmpty}
              onAddProduct={openCreate}
              onImportInventory={onImportInventory}
            />
          ) : null}
        </ScrollView>
        <BottomNavigation activeKey="catalog" onChange={handleNavigation} />
      </View>

      <CatalogFormModal
        visible={formVisible}
        product={editingProduct}
        categories={categories}
        scannedBarcode={formBarcode}
        onClose={closeForm}
        onScanBarcode={openFormScanner}
        onSave={saveProduct}
      />

      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={closeScanner}
        onScanned={handleBarcodeScanned}
      />

      <ProductDetailsModal
        visible={detailVisible}
        product={detailProduct}
        movements={movements}
        loadingHistory={loadingHistory}
        error={actionError}
        onClose={closeDetails}
        onEdit={editProductFromDetails}
        onArchive={archiveProductFromDetails}
      />

      <ArchiveProductModal
        visible={Boolean(archiveTarget)}
        productName={archiveTarget?.name ?? null}
        archiving={archiving}
        error={actionError}
        onClose={closeArchive}
        onConfirm={() => void confirmArchive()}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.app,
  },
  screen: {
    flex: 1,
  },
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
  },
  compactHeader: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  headingCopy: {
    minWidth: 0,
    flex: 1,
    gap: spacing[2],
  },
  compactHeadingCopy: {
    flex: 0,
  },
  compactHeaderButton: {
    alignSelf: "flex-end",
  },
  title: {
    ...typography.h2,
    color: colors.text.primary,
  },
  storeName: {
    ...typography.caption,
    color: colors.text.muted,
  },
  listActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  list: {
    gap: spacing[3],
  },
  resultCount: {
    ...typography.caption,
    color: colors.text.muted,
  },
  status: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    padding: spacing[8],
  },
  statusText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  error: {
    ...typography.bodySmall,
    color: colors.semantic.danger,
    textAlign: "center",
  },
  success: {
    minHeight: control.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radii.md,
    backgroundColor: colors.semantic.successBackground,
  },
  successText: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.semantic.success,
    textAlign: "left",
  },
});
