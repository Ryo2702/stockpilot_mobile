import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";

import type { OwnerStore } from "@/services/owner-store.service";

import useInventoryActions from "./useInventoryActions";
import useInventoryList from "./useInventoryList";
import useInventoryMovements from "./useInventoryMovements";
import type { InventoryPage } from "../types/inventory-screen.types";

export default function useInventoryScreen(ownerStore: OwnerStore) {
  const db = useSQLiteContext();
  const [page, setPage] = useState<InventoryPage>("list");
  const [reloadKey, setReloadKey] = useState(0);
  const [message, setMessage] = useState("");
  const reload = useCallback(() => setReloadKey((current) => current + 1), []);

  useEffect(() => {
    setPage("list");
    setMessage("");
  }, [ownerStore.businessId, ownerStore.storeId]);

  const inventory = useInventoryList({
    db,
    ownerStore,
    page,
    reloadKey,
    setPage,
    onMessage: setMessage,
  });
  const movements = useInventoryMovements({ db, ownerStore, page, setPage, reloadKey });
  const actions = useInventoryActions({
    db,
    ownerStore,
    detail: inventory.detail,
    onReload: reload,
    onMessage: setMessage,
  });

  return {
    page,
    ...inventory,
    ...movements,
    ...actions,
    message,
    clearMessage: () => setMessage(""),
    reload,
    showMessage: setMessage,
  };
}

export type InventoryScreenController = ReturnType<typeof useInventoryScreen>;
