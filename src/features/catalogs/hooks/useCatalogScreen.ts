import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";

import type { CatalogCategory } from "@/domain/catalog";
import { CatalogError } from "@/domain/catalog.errors";
import type { CurrencySettings } from "@/domain/currency";
import type { Product, ProductSort, ProductStockFilter, ProductStockMovement } from "@/domain/product";
import type { CatalogCategoryOption } from "@/data/catalog.data";
import useAsyncEffect from "@/hooks/useAsyncEffect";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import { getInventoryProductDefaults } from "@/services/inventory";
import { getOwnerStoreDetails, type OwnerStore } from "@/services/owner-store.service";
import {
  archiveProduct,
  createProduct,
  findProductsByCode,
  getProduct,
  getProductStockMovements,
  listProducts,
  restoreProduct,
  updateProduct,
} from "@/services/catalog";
import type { CreateProductInput, UpdateProductInput } from "@/validation/product.validation";


const PAGE_SIZE = 50;
const defaultCurrency: CurrencySettings = {
  currencyMode: "iso",
  currencyCode: "PHP",
  currencyDecimalPlaces: 2,
};

type UseCatalogScreenOptions = {
  ownerStore: OwnerStore;
  categories: CatalogCategoryOption[];
  cameraRequest: number;
  onCameraRequestHandled?: () => void;
  productRequest: string | null;
  onProductRequestHandled?: () => void;
  barcodeRequest?: { id: number; code: string } | null;
  onBarcodeRequestHandled?: (id: number) => void;
};

export default function useCatalogScreen({
  ownerStore,
  categories,
  cameraRequest,
  onCameraRequestHandled,
  productRequest,
  onProductRequestHandled,
  barcodeRequest,
  onBarcodeRequestHandled,
}: UseCatalogScreenOptions) {
  const db = useSQLiteContext();
  const [currency, setCurrency] = useState<CurrencySettings>(defaultCurrency);
  const [productDefaults, setProductDefaults] = useState({ defaultUnit: "ea", defaultReorderLevel: 10 });
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearchValue] = useDebouncedValue(search, 300);
  const debouncedSearch = debouncedSearchValue.trim();
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
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<ProductStockMovement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [undoArchivedProduct, setUndoArchivedProduct] = useState<Product | null>(null);
  const handledBarcodeRequest = useRef<number | null>(null);

  useEffect(() => {
    if (cameraRequest === 0) return;
    setScannerTarget("search");
    setScannerVisible(true);
    onCameraRequestHandled?.();
  }, [cameraRequest, onCameraRequestHandled]);

  useEffect(() => {
    setUndoArchivedProduct(null);
  }, [ownerStore.businessId, ownerStore.storeId]);

  useAsyncEffect((isActive) => {
    setCurrency(defaultCurrency);
    getOwnerStoreDetails(db, ownerStore.businessId, ownerStore.storeId)
      .then((store) => {
        if (isActive() && store) {
          setCurrency({
            currencyMode: store.currencyMode,
            currencyCode: store.currencyCode,
            customCurrencySymbol: store.customCurrencySymbol,
            currencyDecimalPlaces: store.currencyDecimalPlaces,
          });
        }
      })
      .catch(() => {
        if (isActive()) setCurrency(defaultCurrency);
      });
  }, [db, ownerStore.businessId, ownerStore.storeId]);

  useAsyncEffect((isActive) => {
    setProductDefaults({ defaultUnit: "ea", defaultReorderLevel: 10 });
    getInventoryProductDefaults(db, ownerStore)
      .then((defaults) => {
        if (isActive()) setProductDefaults(defaults);
      })
      .catch(() => {
        if (isActive()) setProductDefaults({ defaultUnit: "ea", defaultReorderLevel: 10 });
      });
  }, [db, ownerStore.businessId, ownerStore.storeId]);

  useEffect(() => {
    if (category && !categories.some((option) => option.value === category)) {
      setCategory(null);
    }
  }, [categories, category]);

  useAsyncEffect((isActive) => {
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
        if (!isActive()) return;
        setProducts(items);
        setHasMore(items.length === PAGE_SIZE);
      })
      .catch((error) => {
        if (isActive()) {
          setLoadError(error instanceof CatalogError ? error.message : "Couldn't load items.");
        }
      })
      .finally(() => {
        if (isActive()) setLoading(false);
      });
  }, [category, db, debouncedSearch, ownerStore, reloadKey, showArchived, sort, stockStatus]);

  useEffect(() => {
    if (!successMessage) return;
    const timeout = setTimeout(() => {
      setSuccessMessage("");
      setUndoArchivedProduct(null);
    }, 3000);
    return () => clearTimeout(timeout);
  }, [successMessage]);

  const changeSearch = (value: string) => {
    setSearch(value);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setFormBarcode(null);
    setFormVisible(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormBarcode(null);
    setFormVisible(true);
  };

  const closeForm = () => {
    setFormVisible(false);
    setFormBarcode(null);
  };

  const openSearchScanner = () => {
    setScannerTarget("search");
    setScannerVisible(true);
  };

  const openFormScanner = () => {
    setScannerTarget("form");
    setScannerVisible(true);
  };

  const openProductDetails = useCallback(async (product: Product) => {
    setActionError("");
    setDetailProduct(product);
    setDetailVisible(true);
    setMovements([]);
    setLoadingHistory(true);
    try {
      const history = await getProductStockMovements(db, ownerStore, product.id);
      setMovements(history);
    } catch (error) {
      setActionError(error instanceof CatalogError ? error.message : "Couldn't load item details.");
    } finally {
      setLoadingHistory(false);
    }
  }, [db, ownerStore.businessId, ownerStore.storeId]);

  const handleBarcodeScanned = useCallback(async (barcode: string, target = scannerTarget) => {
    setScannerVisible(false);
    if (target === "form") {
      setFormBarcode(barcode);
      return;
    }
    const code = barcode.trim();
    if (!code) return;
    setActionError("");
    setCategory(null);
    setStockStatus("all");

    try {
      const matches = await findProductsByCode(db, ownerStore, code);
      const activeMatches = matches.filter((product) => product.isActive);
      if (matches.length === 1 && activeMatches.length === 1) {
        setShowArchived(false);
        setSearch("");
        await openProductDetails(await getProduct(db, ownerStore, matches[0].id));
        return;
      }
      if (matches.length === 0) {
        setShowArchived(false);
        setSearch("");
        setEditingProduct(null);
        setFormBarcode(code);
        setFormVisible(true);
        return;
      }

      setShowArchived(activeMatches.length === 0);
      setSearch(code);
    } catch (error) {
      setActionError(error instanceof CatalogError ? error.message : "Couldn't look up this barcode.");
    }
  }, [db, openProductDetails, ownerStore, scannerTarget]);

  useEffect(() => {
    if (!barcodeRequest) {
      handledBarcodeRequest.current = null;
      return;
    }
    if (handledBarcodeRequest.current === barcodeRequest.id) return;
    handledBarcodeRequest.current = barcodeRequest.id;
    onBarcodeRequestHandled?.(barcodeRequest.id);
    void handleBarcodeScanned(barcodeRequest.code, "search");
  }, [barcodeRequest, handleBarcodeScanned, onBarcodeRequestHandled]);

  const saveProduct = async (input: CreateProductInput | UpdateProductInput) => {
    if (editingProduct) {
      await updateProduct(db, ownerStore, editingProduct.id, input as UpdateProductInput);
      setSuccessMessage("Item updated");
    } else {
      await createProduct(db, ownerStore, input as CreateProductInput);
      setSuccessMessage("Item added");
    }
    setUndoArchivedProduct(null);
    setFormBarcode(null);
    setFormVisible(false);
    setReloadKey((current) => current + 1);
  };

  useAsyncEffect((isActive) => {
    if (!productRequest) return;
    setSearch("");
    setCategory(null);
    setStockStatus("all");
    setShowArchived(false);
    getProduct(db, ownerStore, productRequest)
      .then(async (product) => {
        if (isActive()) await openProductDetails(product);
      })
      .catch((error) => {
        if (isActive()) setActionError(error instanceof CatalogError ? error.message : "Couldn't open this catalog item.");
      })
      .finally(() => {
        if (isActive()) onProductRequestHandled?.();
      });
  }, [db, onProductRequestHandled, openProductDetails, ownerStore, productRequest]);

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
      setLoadError(error instanceof CatalogError ? error.message : "Couldn't load more items.");
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
      setSuccessMessage("Item archived");
      setReloadKey((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof CatalogError ? error.message : "Couldn't archive this item.");
    } finally {
      setArchiving(false);
    }
  };

  const restore = async (product: Product) => {
    setActionError("");
    try {
      await restoreProduct(db, ownerStore, product.id);
      setUndoArchivedProduct(null);
      setSuccessMessage("Item restored");
      setReloadKey((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof CatalogError ? error.message : "Couldn't restore this item.");
    }
  };

  const undoArchive = async () => {
    if (!undoArchivedProduct) return;
    try {
      await restoreProduct(db, ownerStore, undoArchivedProduct.id);
      setUndoArchivedProduct(null);
      setSuccessMessage("Item restored");
      setReloadKey((current) => current + 1);
    } catch (error) {
      setActionError(error instanceof CatalogError ? error.message : "Couldn't restore this item.");
    }
  };

  const editProductFromDetails = () => {
    if (!detailProduct) return;
    openEditProduct(detailProduct);
    setDetailVisible(false);
  };

  const archiveProductFromDetails = () => {
    if (!detailProduct) return;
    setActionError("");
    setArchiveTarget(detailProduct);
    setDetailVisible(false);
  };

  return {
    currency,
    productDefaults,
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
    empty: !loading && !loadError && products.length === 0,
    filteredEmpty: Boolean(debouncedSearch || category || stockStatus !== "all"),
    setCategory,
    setStockStatus,
    setSort,
    changeSearch,
    openCreate,
    openEditProduct,
    closeForm,
    openSearchScanner,
    openFormScanner,
    closeScanner: () => setScannerVisible(false),
    handleBarcodeScanned,
    saveProduct,
    openProductDetails,
    loadMore,
    confirmArchive,
    restore,
    undoArchive,
    editProductFromDetails,
    archiveProductFromDetails,
    closeDetails: () => setDetailVisible(false),
    openArchiveConfirmation: (product: Product) => setArchiveTarget(product),
    closeArchive: () => setArchiveTarget(null),
    toggleArchived: () => setShowArchived((current) => !current),
    retryLoad: () => setReloadKey((current) => current + 1),
  };
}

export type CatalogScreenController = ReturnType<typeof useCatalogScreen>;
