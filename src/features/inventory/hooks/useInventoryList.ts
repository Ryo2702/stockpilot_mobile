import type { SQLiteDatabase } from "expo-sqlite";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

import type { CatalogCategory } from "@/domain/catalog";
import { InventoryError } from "@/domain/inventory.errors";
import type { InventoryItem, InventorySort } from "@/domain/inventory";
import useAsyncEffect from "@/hooks/useAsyncEffect";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import {
  getInventoryDetail,
  getInventoryList,
  getInventoryOverview,
  getInventoryPreference,
  saveInventoryPreference,
} from "@/services/inventory";
import type { OwnerStore } from "@/services/owner-store.service";

import type { InventoryDetailReturnPage, InventoryPage } from "../types";

const PAGE_SIZE = 50;

type UseInventoryListOptions = {
  db: SQLiteDatabase;
  ownerStore: OwnerStore;
  page: InventoryPage;
  reloadKey: number;
  setPage: Dispatch<SetStateAction<InventoryPage>>;
  onMessage: (message: string) => void;
};

export default function useInventoryList({
  db,
  ownerStore,
  page,
  reloadKey,
  setPage,
  onMessage,
}: UseInventoryListOptions) {
  const [search, setSearch] = useState("");
  const [debouncedSearchValue, setDebouncedSearch] = useDebouncedValue(search, 220);
  const debouncedSearch = debouncedSearchValue.trim();
  const [stockStatus, setStockStatus] = useState<"all" | "healthy" | "low" | "critical">("all");
  const [category, setCategory] = useState<CatalogCategory | null>(null);
  const [quantityFilter, setQuantityFilter] = useState<"any" | "in_stock" | "zero_stock">("any");
  const [sort, setSort] = useState<InventorySort>("name_asc");
  const [defaultSort, setDefaultSort] = useState<InventorySort>("name_asc");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [counts, setCounts] = useState<Awaited<ReturnType<typeof getInventoryOverview>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemArchived, setSelectedItemArchived] = useState(false);
  const [detailReturnPage, setDetailReturnPage] = useState<InventoryDetailReturnPage>("list");
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof getInventoryDetail>> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    setSearch("");
    setDebouncedSearch("");
    setStockStatus("all");
    setCategory(null);
    setQuantityFilter("any");
    setSort("name_asc");
    setDefaultSort("name_asc");
    setItems([]);
    setTotalCount(0);
    setCounts(null);
    setLoading(true);
    setLoadingMore(false);
    setHasMore(false);
    setSelectedItemId(null);
    setSelectedItemArchived(false);
    setDetail(null);
    setDetailLoading(false);
    setDetailError("");
    setLoadError("");
  }, [ownerStore.businessId, ownerStore.storeId]);

  useAsyncEffect((isActive) => {
    setSort("name_asc");
    getInventoryPreference(db, ownerStore)
      .then((value) => {
        if (isActive()) {
          setDefaultSort(value);
          setSort(value);
        }
      })
      .catch(() => {
        if (isActive()) {
          setDefaultSort("name_asc");
          setSort("name_asc");
        }
      });
  }, [db, ownerStore.businessId, ownerStore.storeId]);

  useAsyncEffect((isActive) => {
    getInventoryOverview(db, ownerStore)
      .then((value) => {
        if (isActive()) setCounts(value);
      })
      .catch(() => {
        if (isActive()) setCounts(null);
      });
  }, [db, ownerStore, reloadKey]);

  useAsyncEffect((isActive) => {
    if (page !== "list" && page !== "archived") return;
    setLoading(true);
    setLoadError("");
    getInventoryList(db, ownerStore, {
      search: debouncedSearch,
      category: page === "list" ? category : null,
      stockStatus: page === "list" ? stockStatus : "all",
      quantity: page === "list" ? quantityFilter : "any",
      sort,
      archived: page === "archived",
      limit: PAGE_SIZE,
      offset: 0,
    })
      .then((result) => {
        if (!isActive()) return;
        setItems(result.items);
        setTotalCount(result.total);
        setHasMore(result.items.length < result.total);
      })
      .catch(() => {
        if (isActive()) {
          setItems([]);
          setTotalCount(0);
          setHasMore(false);
          setLoadError("Inventory couldn't be loaded. The local inventory database could not be read.");
        }
      })
      .finally(() => {
        if (isActive()) setLoading(false);
      });
  }, [category, debouncedSearch, db, ownerStore, page, quantityFilter, reloadKey, sort, stockStatus]);

  useAsyncEffect((isActive) => {
    if (page !== "detail" || !selectedItemId) return;
    setDetailLoading(true);
    setDetailError("");
    getInventoryDetail(db, ownerStore, selectedItemId, selectedItemArchived)
      .then((value) => {
        if (isActive()) setDetail(value);
      })
      .catch((error) => {
        if (isActive()) {
          setDetail(null);
          setDetailError(error instanceof InventoryError
            ? error.message
            : "Inventory detail couldn't be loaded. The local inventory database could not be read.");
        }
      })
      .finally(() => {
        if (isActive()) setDetailLoading(false);
      });
  }, [db, ownerStore, page, reloadKey, selectedItemArchived, selectedItemId]);

  const openItem = (item: InventoryItem, archived = false) => {
    setSelectedItemId(item.id);
    setSelectedItemArchived(archived);
    setDetailReturnPage(archived ? "archived" : "list");
    setDetail(null);
    setPage("detail");
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore || (page !== "list" && page !== "archived")) return;
    setLoadingMore(true);
    setLoadError("");
    try {
      const result = await getInventoryList(db, ownerStore, {
        search: debouncedSearch,
        category: page === "list" ? category : null,
        stockStatus: page === "list" ? stockStatus : "all",
        quantity: page === "list" ? quantityFilter : "any",
        sort,
        archived: page === "archived",
        limit: PAGE_SIZE,
        offset: items.length,
      });
      setItems((current) => [...current, ...result.items]);
      setTotalCount(result.total);
      setHasMore(items.length + result.items.length < result.total);
    } catch {
      setLoadError("More inventory couldn't be loaded. Try again.");
    } finally {
      setLoadingMore(false);
    }
  };

  const saveDefaultSort = async (value: InventorySort) => {
    try {
      await saveInventoryPreference(db, ownerStore, value);
      setDefaultSort(value);
      setSort(value);
      onMessage("Inventory preference saved for this store.");
      return true;
    } catch {
      onMessage("Inventory preference couldn't be saved. Try again.");
      return false;
    }
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStockStatus("all");
    setCategory(null);
    setQuantityFilter("any");
  };

  const openArchived = () => {
    clearFilters();
    setPage("archived");
  };

  return {
    search,
    setSearch,
    stockStatus,
    setStockStatus,
    category,
    setCategory,
    quantityFilter,
    setQuantityFilter,
    sort,
    setSort,
    defaultSort,
    saveDefaultSort,
    items,
    totalCount,
    counts,
    loading,
    loadingMore,
    hasMore,
    loadError,
    loadMore,
    clearFilters,
    isFiltered: Boolean(search.trim() || category || stockStatus !== "all" || quantityFilter !== "any"),
    openItem,
    backToItemList: () => setPage(detailReturnPage),
    detail,
    detailLoading,
    detailError,
    openArchived,
    backFromArchived: () => setPage("list"),
    goToList: () => setPage("list"),
  };
}
