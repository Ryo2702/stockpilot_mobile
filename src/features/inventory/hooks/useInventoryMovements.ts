import type { SQLiteDatabase } from "expo-sqlite";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { InventoryError } from "@/domain/inventory.errors";
import type {
  InventoryMovement,
  InventoryMovementFilter,
  InventoryMovementPeriod,
} from "@/domain/inventory";
import {
  getInventoryMovementDetail,
  getInventoryMovementHistory,
} from "@/services/inventory.service";
import type { OwnerStore } from "@/services/owner-store.service";

import type {
  InventoryMovementListReturnPage,
  InventoryPage,
} from "../types/inventory-screen.types";

type UseInventoryMovementsOptions = {
  db: SQLiteDatabase;
  ownerStore: OwnerStore;
  page: InventoryPage;
  setPage: Dispatch<SetStateAction<InventoryPage>>;
  reloadKey: number;
};

export default function useInventoryMovements({
  db,
  ownerStore,
  page,
  setPage,
  reloadKey,
}: UseInventoryMovementsOptions) {
  const [movementSearch, setMovementSearch] = useState("");
  const [debouncedMovementSearch, setDebouncedMovementSearch] = useState("");
  const [movementType, setMovementType] = useState<InventoryMovementFilter>("all");
  const [movementPeriod, setMovementPeriod] = useState<InventoryMovementPeriod>("all");
  const [movementProductId, setMovementProductId] = useState<string | undefined>();
  const [movementListReturnPage, setMovementListReturnPage] = useState<InventoryMovementListReturnPage>("list");
  const [movementItems, setMovementItems] = useState<InventoryMovement[]>([]);
  const [movementTotal, setMovementTotal] = useState(0);
  const [movementHasMore, setMovementHasMore] = useState(false);
  const [movementLoading, setMovementLoading] = useState(false);
  const [movementLoadingMore, setMovementLoadingMore] = useState(false);
  const [movementError, setMovementError] = useState("");
  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null);
  const [movementDetailReturnPage, setMovementDetailReturnPage] = useState<"detail" | "movements">("movements");
  const [movementDetail, setMovementDetail] = useState<InventoryMovement | null>(null);
  const [movementDetailError, setMovementDetailError] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedMovementSearch(movementSearch.trim()), 220);
    return () => clearTimeout(timeout);
  }, [movementSearch]);

  useEffect(() => {
    setMovementSearch("");
    setDebouncedMovementSearch("");
    setMovementType("all");
    setMovementPeriod("all");
    setMovementProductId(undefined);
    setMovementItems([]);
    setMovementTotal(0);
    setMovementHasMore(false);
    setMovementLoading(false);
    setMovementLoadingMore(false);
    setSelectedMovementId(null);
    setMovementDetail(null);
    setMovementDetailReturnPage("movements");
    setMovementError("");
    setMovementDetailError("");
  }, [ownerStore.businessId, ownerStore.storeId]);

  useEffect(() => {
    if (page !== "movements") return;
    let active = true;
    setMovementLoading(true);
    setMovementError("");
    getInventoryMovementHistory(db, ownerStore, {
      search: debouncedMovementSearch,
      type: movementType,
      period: movementPeriod,
      productId: movementProductId,
      offset: 0,
    })
      .then((result) => {
        if (!active) return;
        setMovementItems(result.items);
        setMovementTotal(result.total);
        setMovementHasMore(result.items.length < result.total);
      })
      .catch(() => {
        if (active) {
          setMovementItems([]);
          setMovementTotal(0);
          setMovementHasMore(false);
          setMovementError("Stock movements couldn't be loaded. The local inventory database could not be read.");
        }
      })
      .finally(() => {
        if (active) setMovementLoading(false);
      });
    return () => {
      active = false;
    };
  }, [db, debouncedMovementSearch, movementPeriod, movementProductId, movementType, ownerStore, page, reloadKey]);

  useEffect(() => {
    if (page !== "movementDetail" || !selectedMovementId) return;
    let active = true;
    setMovementDetailError("");
    getInventoryMovementDetail(db, ownerStore, selectedMovementId)
      .then((value) => {
        if (active) setMovementDetail(value);
      })
      .catch((error) => {
        if (active) {
          setMovementDetailError(error instanceof InventoryError
            ? error.message
            : "Movement detail couldn't be loaded. The local inventory database could not be read.");
        }
      });
    return () => {
      active = false;
    };
  }, [db, ownerStore, page, selectedMovementId]);

  const openMovements = (productId?: string) => {
    setMovementListReturnPage(page === "detail" ? "detail" : page === "archived" ? "archived" : "list");
    setMovementProductId(productId);
    setMovementSearch("");
    setDebouncedMovementSearch("");
    setMovementType("all");
    setMovementPeriod("all");
    setMovementItems([]);
    setMovementTotal(0);
    setMovementHasMore(false);
    setMovementDetailReturnPage("movements");
    setPage("movements");
  };

  const openMovement = (movement: InventoryMovement, returnPage: "detail" | "movements") => {
    setSelectedMovementId(movement.id);
    setMovementDetailReturnPage(returnPage);
    setMovementDetail(movement);
    setPage("movementDetail");
  };

  const loadMoreMovements = async () => {
    if (movementLoadingMore || !movementHasMore) return;
    setMovementLoadingMore(true);
    try {
      const result = await getInventoryMovementHistory(db, ownerStore, {
        search: debouncedMovementSearch,
        type: movementType,
        period: movementPeriod,
        productId: movementProductId,
        offset: movementItems.length,
      });
      setMovementItems((current) => [...current, ...result.items]);
      setMovementTotal(result.total);
      setMovementHasMore(movementItems.length + result.items.length < result.total);
    } catch {
      setMovementError("More stock movements couldn't be loaded. Try again.");
    } finally {
      setMovementLoadingMore(false);
    }
  };

  const clearMovementFilters = () => {
    setMovementSearch("");
    setDebouncedMovementSearch("");
    setMovementType("all");
    setMovementPeriod("all");
    setMovementProductId(undefined);
  };

  return {
    openMovements,
    movementSearch,
    setMovementSearch,
    movementType,
    setMovementType,
    movementPeriod,
    setMovementPeriod,
    movementProductId,
    movementItems,
    movementTotal,
    movementLoading,
    movementLoadingMore,
    movementHasMore,
    movementError,
    loadMoreMovements,
    openMovement,
    backFromMovementDetail: () => setPage(movementDetailReturnPage),
    backFromMovements: () => setPage(movementListReturnPage),
    movementDetail,
    movementDetailError,
    clearMovementFilters,
  };
}
