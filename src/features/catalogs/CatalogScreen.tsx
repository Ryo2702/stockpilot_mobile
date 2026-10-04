import { catalogCategoryOptions } from "@/data/catalog.data";
import useCatalogScreen from "./hooks/useCatalogScreen";
import CatalogScreenView from "./components/CatalogScreenView";
import type { CatalogScreenProps } from "./types";

export default function CatalogScreen(props: CatalogScreenProps) {
  const catalog = useCatalogScreen({
    ownerStore: props.ownerStore,
    categories: catalogCategoryOptions,
    cameraRequest: props.cameraRequest ?? 0,
    onCameraRequestHandled: props.onCameraRequestHandled,
    productRequest: props.productRequest ?? null,
    onProductRequestHandled: props.onProductRequestHandled,
    createRequest: props.createRequest ?? null,
    onCreateRequestHandled: props.onCreateRequestHandled,
    barcodeRequest: props.barcodeRequest ?? null,
    onBarcodeRequestHandled: props.onBarcodeRequestHandled,
  });

  return <CatalogScreenView {...props} categories={catalogCategoryOptions} catalog={catalog} />;
}
