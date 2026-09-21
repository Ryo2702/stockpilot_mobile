import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";

import {
  getOwnerStoreOverview,
  type OwnerStore,
  type OwnerStoreOverview,
} from "@/services/owner-store.service";

export default function useOwnerStoreScreen(ownerStore: OwnerStore) {
  const db = useSQLiteContext();
  const [overview, setOverview] = useState<OwnerStoreOverview | null>(null);

  useEffect(() => {
    let active = true;
    setOverview(null);
    getOwnerStoreOverview(db, ownerStore.businessId, ownerStore.storeId)
      .then((nextOverview) => {
        if (active) setOverview(nextOverview);
      })
      .catch(() => {
        if (active) setOverview(null);
      });

    return () => {
      active = false;
    };
  }, [db, ownerStore.businessId, ownerStore.storeId]);

  return { overview };
}
