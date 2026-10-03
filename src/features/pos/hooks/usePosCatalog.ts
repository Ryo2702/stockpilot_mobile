import { useEffect, useState } from "react";
import { useSQLiteContext } from "expo-sqlite";
import useAsyncEffect from "@/hooks/useAsyncEffect";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import type { CatalogCategory } from "@/domain/catalog";
import type { CurrencySettings } from "@/domain/currency";
import type { PosProduct } from "@/domain/pos";
import type { OwnerStore } from "@/services/owner-store.service";
import { getOwnerStoreDetails } from "@/services/owner-store.service";
import { findPosProductByCode, listPosProducts, POS_PAGE_SIZE } from "@/services/pos.service";
import { PosError } from "@/domain/pos.errors";

const defaultCurrency: CurrencySettings = { currencyMode: "iso", currencyCode: "PHP", currencyDecimalPlaces: 2 };

export default function usePosCatalog({ ownerStore, reloadKey, onError, onAddProduct }: { ownerStore: OwnerStore; reloadKey: number; onError: (message: string) => void; onAddProduct: (product: PosProduct) => void }) {
  const db = useSQLiteContext();
  const [currency, setCurrency] = useState(defaultCurrency);
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 250);
  const [category, setCategory] = useState<CatalogCategory | null>(null);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const setCatalogSearch = (value: string) => { setSearch(value); setPage(0); };
  const setCatalogCategory = (value: CatalogCategory | null) => { setCategory(value); setPage(0); };

  useEffect(() => { setPage(0); }, [ownerStore.businessId, ownerStore.storeId]);

  useAsyncEffect((isActive) => {
    setLoading(true);
    Promise.all([
      getOwnerStoreDetails(db, ownerStore.businessId, ownerStore.storeId),
      listPosProducts(db, ownerStore, {
        search: debouncedSearch,
        category,
        limit: POS_PAGE_SIZE + 1,
        offset: page * POS_PAGE_SIZE,
      }),
    ]).then(([store, items]) => {
      if (!isActive()) return;
      setCurrency(store ? { currencyMode: store.currencyMode, currencyCode: store.currencyCode, customCurrencySymbol: store.customCurrencySymbol, currencyDecimalPlaces: store.currencyDecimalPlaces } : defaultCurrency);
      setProducts(items.slice(0, POS_PAGE_SIZE));
      setHasNextPage(items.length > POS_PAGE_SIZE);
    }).catch((error) => { if (isActive()) onError(error instanceof Error ? error.message : "Couldn't load POS products."); }).finally(() => { if (isActive()) setLoading(false); });
  }, [category, db, debouncedSearch, ownerStore, page, reloadKey]);
  const handleBarcode = async (code: string) => {
    onError("");
    try { const product = await findPosProductByCode(db, ownerStore, code); if (!product) { setCatalogSearch(code.trim()); return onError("Barcode not found. Use the search results to find the product manually."); } onAddProduct(product); }
    catch (error) { onError(error instanceof PosError ? error.message : "Couldn't look up that barcode."); }
  };
  const previousPage = () => setPage((current) => Math.max(0, current - 1));
  const nextPage = () => { if (!loading && hasNextPage) setPage((current) => current + 1); };
  return { currency, products, search, setSearch: setCatalogSearch, category, setCategory: setCatalogCategory, loading, page, hasNextPage, previousPage, nextPage, handleBarcode };
}
