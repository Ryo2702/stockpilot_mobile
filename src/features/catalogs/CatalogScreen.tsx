import { useMemo } from "react";

import { getCatalogCategoryOptions } from "./data/catalog.data";
import useCatalogScreen from "./hooks/useCatalogScreen";
import CatalogScreenView from "./partials/CatalogScreenView";
import type { CatalogScreenProps } from "./types/catalog-screen.types";

export default function CatalogScreen(props: CatalogScreenProps) {
  const categories = useMemo(
    () => getCatalogCategoryOptions(props.ownerStore.storeType),
    [props.ownerStore.storeType],
  );
  const catalog = useCatalogScreen({
    ownerStore: props.ownerStore,
    categories,
    cameraRequest: props.cameraRequest ?? 0,
    onCameraRequestHandled: props.onCameraRequestHandled,
    productRequest: props.productRequest ?? null,
    onProductRequestHandled: props.onProductRequestHandled,
  });

  return <CatalogScreenView {...props} categories={categories} catalog={catalog} />;
}
