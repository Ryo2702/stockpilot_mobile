import { catalogCategoryOptions } from "./data/catalog.data";
import useCatalogScreen from "./hooks/useCatalogScreen";
import CatalogScreenView from "./partials/CatalogScreenView";
import type { CatalogScreenProps } from "./types/catalog-screen.types";

export default function CatalogScreen(props: CatalogScreenProps) {
  const catalog = useCatalogScreen({
    ownerStore: props.ownerStore,
    categories: catalogCategoryOptions,
    cameraRequest: props.cameraRequest ?? 0,
    onCameraRequestHandled: props.onCameraRequestHandled,
    productRequest: props.productRequest ?? null,
    onProductRequestHandled: props.onProductRequestHandled,
    barcodeRequest: props.barcodeRequest ?? null,
    onBarcodeRequestHandled: props.onBarcodeRequestHandled,
  });

  return <CatalogScreenView {...props} categories={catalogCategoryOptions} catalog={catalog} />;
}
