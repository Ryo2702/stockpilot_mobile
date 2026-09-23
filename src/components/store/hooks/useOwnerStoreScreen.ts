import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";

import useAsyncEffect from "@/hooks/useAsyncEffect";
import {
  getOwnerStoreOverview,
  type OwnerStore,
  type OwnerStoreOverview,
} from "@/services/owner-store.service";

export default function useOwnerStoreScreen(ownerStore: OwnerStore) {
  const db = useSQLiteContext();
  const [overview, setOverview] = useState<OwnerStoreOverview | null>(null);

  useAsyncEffect((isActive) => {
    setOverview(null);
    getOwnerStoreOverview(db, ownerStore.businessId, ownerStore.storeId)
      .then((nextOverview) => {
        if (isActive()) setOverview(nextOverview);
      })
      .catch(() => {
        if (isActive()) setOverview(null);
      });
  }, [db, ownerStore.businessId, ownerStore.storeId]);

  return { overview };
}
