import { useEffect } from "react";

import { catalogCategoryOptions } from "@/data/catalog.data";

import useInventoryScreen from "./hooks/useInventoryScreen";
import InventoryScreenView from "./components/InventoryScreenView";
import type { InventoryScreenProps } from "./types";

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
