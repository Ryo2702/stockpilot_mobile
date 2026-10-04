import type { BottomNavKey } from "@/components/ui/BottomNavigation";
import type { OwnerStore } from "@/services/owner-store.service";
import type { StoreInput } from "@/validation/store.validation";

export type CatalogScreenProps = {
  ownerStore: OwnerStore;
  ownerStores: OwnerStore[];
  onSelectStore: (store: OwnerStore) => Promise<void>;
  onCreateStore: (store: StoreInput) => Promise<OwnerStore>;
  onImportInventory: () => void;
  productRequest?: string | null;
  onProductRequestHandled?: () => void;
  createRequest?: number | null;
  onCreateRequestHandled?: (id: number) => void;
  barcodeRequest?: { id: number; code: string } | null;
  onBarcodeRequestHandled?: (id: number) => void;
  onNavigate: (key: BottomNavKey) => void;
  onCameraRequestHandled?: () => void;
  cameraRequest?: number;
};
