import { useEffect } from "react";

import { catalogCategoryOptions } from "@/features/catalogs/data/catalog.data";

import useInventoryScreen from "./hooks/useInventoryScreen";
import InventoryScreenView from "./partials/InventoryScreenView";
import type { InventoryScreenProps } from "./types/inventory-screen.types";

export default function InventoryScreen(props: InventoryScreenProps) {
  const inventory = useInventoryScreen(props.ownerStore);

  useEffect(() => {
    if (
      inventory.category &&
      !catalogCategoryOptions.some(({ value }) => value === inventory.category)
    ) {
      inventory.setCategory(null);
    }
  }, [inventory.category, inventory.setCategory]);

  return (
    <InventoryScreenView {...props} categories={catalogCategoryOptions} inventory={inventory} />
  );
}
