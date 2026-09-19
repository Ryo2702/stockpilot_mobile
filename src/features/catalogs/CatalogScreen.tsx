import { useSQLiteContext } from "expo-sqlite";
import { Archive, Plus, RotateCcw } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import StoreSelector from "@/components/store/StoreSelector";
import { BottomNavigation, type BottomNavKey } from "@/components/ui/BottomNavigation";
import { Button } from "@/components/ui/Button";
import type { CatalogCategory } from "@/domain/catalog";
import type {
  Product,
  ProductSort,
  ProductStockFilter,
  ProductStockMovement,
} from "@/domain/product";
import { CatalogError } from "@/features/catalogs/errors/catalog.errors";
import type { OwnerStore } from "@/services/owner-store.service";
import {
  archiveProduct,
  createProduct,
  getProduct,
  getProductStockMovements,
  listProducts,
  restoreProduct,
  updateProduct,
} from "@/services/catalog.service";
import { colors, control, radii, spacing, typography } from "@/theme";
import type { StoreInput } from "@/validation/store.validation";
import type { CreateProductInput, UpdateProductInput } from "@/validation/product.validation";

import { getCatalogCategoryOptions } from "./catalog.data";
import CatalogFilters from "./partials/CatalogFilters";
import BarcodeScannerModal from "./partials/BarcodeScannerModal";
import CatalogFormModal from "./partials/CatalogFormModal";
import CatalogItemCard from "./partials/CatalogItemCard";
import ProductDetailsModal from "./partials/ProductDetailsModal";

const PAGE_SIZE = 50;
const boxMascot = require("../../../assets/images/stockpilot/empty state png/box.png");
const searchMascot = require("../../../assets/images/stockpilot/empty state png/search.png");
const archiveMascot = require("../../../assets/images/stockpilot/empty state png/archive.png");

type CatalogScreenProps = {
  ownerStore: OwnerStore;
  ownerStores: OwnerStore[];
  onSelectStore: (store: OwnerStore) => Promise<void>;
  onCreateStore: (store: StoreInput) => Promise<OwnerStore>;
  onImportInventory: () => void;
  onNavigate: (key: BottomNavKey) => void;
  onCameraRequestHandled?: () => void;
  cameraRequest?: number;
};

export default function CatalogScreen({
  ownerStore,
  ownerStores,
  onSelectStore,
  onCreateStore,
  onImportInventory,
  onNavigate,
  onCameraRequestHandled,
  cameraRequest = 0,
}: CatalogScreenProps) {
  const db = useSQLiteContext();
  const categories = useMemo(
    () => getCatalogCategoryOptions(ownerStore.storeType),
    [ownerStore.storeType],
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState<CatalogCategory | null>(null);
  const [stockStatus, setStockStatus] = useState<ProductStockFilter>("all");
  const [sort, setSort] = useState<ProductSort>("name_asc");
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [formVisible, setFormVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<"search" | "form">("search");
  const [formBarcode, setFormBarcode] = useState<string | null>(null);
  const [pendingBarcode, setPendingBarcode] = useState<string | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<ProductStockMovement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [undoArchivedProduct, setUndoArchivedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (cameraRequest === 0) return;
    setScannerTarget("search");
    setScannerVisible(true);
    onCameraRequestHandled?.();
  }, [cameraRequest, onCameraRequestHandled]);

  useEffect(() => {
    setUndoArchivedProduct(null);
  }, [ownerStore.businessId, ownerStore.storeId]);

  useEffect(() => {
    if (category && !categories.some((option) => option.value === category)) {
      setCategory(null);
    }
  }, [categories, category]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");

    listProducts(db, ownerStore, {
      search: debouncedSearch,
      category,
      stockStatus,
      sort,
      archived: showArchived,
      limit: PAGE_SIZE,
      offset: 0,
    })
      .then((items) => {
        if (!active) return;
        setProducts(items);
        setHasMore(items.length === PAGE_SIZE);
      })
      .catch((error) => {
        if (active) {
          setLoadError(error instanceof CatalogError ? error.message : "Couldn't load products.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [category, db, debouncedSearch, ownerStore, reloadKey, showArchived, sort, stockStatus]);

  useEffect(() => {
    if (!successMessage) return;
    const timeout = setTimeout(() => {
      setSuccessMessage("");
      setUndoArchivedProduct(null);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [successMessage]);

  const openCreate = () => {
    setEditingProduct(null);
    setFormBarcode(pendingBarcode);
    setPendingBarcode(null);
    setFormVisible(true);
  };

  const handleNavigation = (key: BottomNavKey) => {
    if (key === "camera") {
      setScannerTarget("search");
      setScannerVisible(true);
      return;
    }
    onNavigate(key);
  };

  const handleBarcodeScanned = (barcode: string) => {
    setScannerVisible(false);
    if (scannerTarget === "form") {
      setFormBarcode(barcode);
    } else {
      setCategory(null);
      setStockStatus("all");
      setShowArchived(false);
      setPendingBarcode(barcode);
      setSearch(barcode);
    }
  };

  const changeSearch = (value: string) => {
    setSearch(value);
    if (value.trim() !== pendingBarcode) setPendingBarcode(null);
  };

  const saveProduct = async (input: CreateProductInput | UpdateProductInput) => {
    if (editingProduct) {
      await updateProduct(db, ownerStore, editingProduct.id, input as UpdateProductInput);
      setSuccessMessage("Product Updated");
    } else {
      await createProduct(db, ownerStore, input as CreateProductInput);
      setSuccessMessage("Product Added");
    }
    setUndoArchivedProduct(null);
    setFormBarcode(null);
    setFormVisible(false);
    setReloadKey((current) => current + 1);
  };

  const openProductDetails = async (product: Product) => {
    setActionError("");
    setDetailProduct(product);
    setDetailVisible(true);
    setMovements([]);
    setLoadingHistory(true);
    try {
      const [details, history] = await Promise.all([
        getProduct(db, ownerStore, product.id),
        getProductStockMovements(db, ownerStore, product.id),
      ]);
      setDetailProduct(details);
      setMovements(history);
    } catch (error) {
      setActionError(error instanceof CatalogError ? error.message : "Couldn't load product details.");
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setLoadError("");
    try {
      const items = await listProducts(db, ownerStore, {
        search: debouncedSearch,
        category,
        stockStatus,
        sort,
        archived: showArchived,
        limit: PAGE_SIZE,
        offset: products.length,
      });
      setProducts((current) => [...current, ...items]);
      setHasMore(items.length === PAGE_SIZE);
    } catch (error) {
      setLoadError(error instanceof CatalogError ? error.message : "Couldn't load more products.");
    } finally {
      setLoadingMore(false);
    }
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    setArchiving(true);
    setActionError("");
    try {
      await archiveProduct(db, ownerStore, archiveTarget.id);
      setArchiveTarget(null);
      setDetailVisible(false);
      setDetailProduct(null);
      setUndoArchivedProduct(archiveTarget);
      setSuccessMessage("Product archived");
      setReloadKey((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof CatalogError ? error.message : "Couldn't archive this product.");
    } finally {
      setArchiving(false);
    }
  };

  const restore = async (product: Product) => {
    setActionError("");
    try {
      await restoreProduct(db, ownerStore, product.id);
      setUndoArchivedProduct(null);
      setSuccessMessage("Product restored");
      setReloadKey((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof CatalogError ? error.message : "Couldn't restore this product.");
    }
  };

  const undoArchive = async () => {
    if (!undoArchivedProduct) return;
    try {
      await restoreProduct(db, ownerStore, undoArchivedProduct.id);
      setUndoArchivedProduct(null);
      setSuccessMessage("Product restored");
      setReloadKey((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof CatalogError ? error.message : "Couldn't restore this product.");
    }
  };

  const empty = !loading && !loadError && products.length === 0;
  const filteredEmpty = Boolean(debouncedSearch || category || stockStatus !== "all");
  const emptyImage = showArchived ? archiveMascot : filteredEmpty ? searchMascot : boxMascot;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headingCopy}>
              <Text style={styles.title}>Catalog</Text>
              <StoreSelector
                ownerStore={ownerStore}
                ownerStores={ownerStores}
                onSelectStore={onSelectStore}
                onCreateStore={onCreateStore}
              />
            </View>
            <Button title="Add Product" icon={Plus} onPress={openCreate} />
          </View>

          <View style={styles.listActions}>
            <Text style={styles.storeName}>{ownerStore.storeName}</Text>
            <Button
              title={showArchived ? "Active Catalog" : "Archived Products"}
              icon={showArchived ? RotateCcw : Archive}
              size="sm"
              variant="secondary"
              onPress={() => setShowArchived((current) => !current)}
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
                onPress={() => setReloadKey((current) => current + 1)}
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
                  onEdit={() => {
                    setEditingProduct(product);
                    setFormBarcode(null);
                    setFormVisible(true);
                  }}
                  onArchive={() => setArchiveTarget(product)}
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
            <View style={styles.empty}>
              <Image
                accessible={false}
                source={emptyImage}
                resizeMode="contain"
                style={styles.emptyImage}
              />
              <Text style={styles.emptyTitle}>
                {showArchived
                  ? "No archived products"
                  : filteredEmpty
                    ? "No matching products"
                    : "No products yet"}
              </Text>
              <Text style={styles.emptyCopy}>
                {showArchived
                  ? "Archived products will appear here and can be restored."
                  : filteredEmpty
                    ? "Try changing your search or filters."
                    : "Start building this store's catalog by adding your first product."}
              </Text>
              {!showArchived && !filteredEmpty ? (
                <View style={styles.emptyActions}>
                  <Button title="Add Product" icon={Plus} onPress={openCreate} />
                  <Button
                    title="Import Inventory"
                    variant="secondary"
                    onPress={onImportInventory}
                  />
                </View>
              ) : null}
            </View>
          ) : null}
        </ScrollView>
        <BottomNavigation activeKey="catalog" onChange={handleNavigation} />
      </View>

      <CatalogFormModal
        visible={formVisible}
        product={editingProduct}
        categories={categories}
        scannedBarcode={formBarcode}
        onClose={() => {
          setFormVisible(false);
          setFormBarcode(null);
        }}
        onScanBarcode={() => {
          setScannerTarget("form");
          setScannerVisible(true);
        }}
        onSave={saveProduct}
      />

      <BarcodeScannerModal
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanned={handleBarcodeScanned}
      />

      <ProductDetailsModal
        visible={detailVisible}
        product={detailProduct}
        movements={movements}
        loadingHistory={loadingHistory}
        error={actionError}
        onClose={() => setDetailVisible(false)}
        onEdit={() => {
          if (!detailProduct) return;
          setEditingProduct(detailProduct);
          setFormBarcode(null);
          setDetailVisible(false);
          setFormVisible(true);
        }}
        onArchive={() => {
          if (!detailProduct) return;
          setActionError("");
          setArchiveTarget(detailProduct);
          setDetailVisible(false);
        }}
      />

      <Modal
        visible={Boolean(archiveTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!archiving) setArchiveTarget(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <Archive color={colors.semantic.danger} size={22} />
            </View>
            <Text style={styles.confirmTitle}>Archive Product?</Text>
            <Text style={styles.confirmCopy}>
              This will remove “{archiveTarget?.name}” from the active catalog. Its stock history
              will be kept and it can be restored later.
            </Text>
            {actionError ? <Text accessibilityRole="alert" style={styles.error}>{actionError}</Text> : null}
            <View style={styles.confirmActions}>
              <Button
                title="Cancel"
                variant="ghost"
                disabled={archiving}
                onPress={() => setArchiveTarget(null)}
                style={styles.confirmButton}
              />
              <Button
                title="Archive Product"
                icon={Archive}
                variant="danger"
                loading={archiving}
                onPress={() => void confirmArchive()}
                style={styles.confirmButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  headingCopy: {
    minWidth: 0,
    flex: 1,
    gap: spacing[2],
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
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    padding: spacing[8],
  },
  emptyImage: {
    width: 148,
    height: 148,
    backgroundColor: colors.background.surface,
  },
  emptyTitle: {
    ...typography.title,
    color: colors.text.primary,
    textAlign: "center",
  },
  emptyCopy: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: "center",
  },
  emptyActions: {
    width: "100%",
    gap: spacing[2],
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[4],
    backgroundColor: "rgba(15, 23, 42, 0.32)",
  },
  confirmCard: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[5],
    borderRadius: radii.lg,
    backgroundColor: colors.background.surface,
  },
  confirmIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    backgroundColor: colors.semantic.dangerBackground,
  },
  confirmTitle: {
    ...typography.title,
    color: colors.text.primary,
  },
  confirmCopy: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: "center",
  },
  confirmActions: {
    width: "100%",
    flexDirection: "row",
    gap: spacing[2],
  },
  confirmButton: {
    minWidth: 0,
    flex: 1,
    paddingHorizontal: spacing[2],
  },
});
