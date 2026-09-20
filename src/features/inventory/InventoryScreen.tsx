import { useEffect, useMemo } from "react";

import { getCatalogCategoryOptions } from "@/features/catalogs/data/catalog.data";

import useInventoryScreen from "./hooks/useInventoryScreen";
import InventoryScreenView from "./partials/InventoryScreenView";
import type { InventoryScreenProps } from "./types/inventory-screen.types";

export default function InventoryScreen(props: InventoryScreenProps) {
  const categories = useMemo(
    () => getCatalogCategoryOptions(props.ownerStore.storeType),
    [props.ownerStore.storeType],
  );
  const inventory = useInventoryScreen(props.ownerStore);

  useEffect(() => {
    if (inventory.category && !categories.some(({ value }) => value === inventory.category)) {
      inventory.setCategory(null);
    }
  }, [categories, inventory.category, inventory.setCategory]);

  return <InventoryScreenView {...props} categories={categories} inventory={inventory} />;
}
