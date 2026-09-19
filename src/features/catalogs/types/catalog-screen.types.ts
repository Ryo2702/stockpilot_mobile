import type { BottomNavKey } from "@/components/ui/BottomNavigation";
import type { OwnerStore } from "@/services/owner-store.service";
import type { StoreInput } from "@/validation/store.validation";

export type CatalogScreenProps = {
  ownerStore: OwnerStore;
  ownerStores: OwnerStore[];
  onSelectStore: (store: OwnerStore) => Promise<void>;
  onCreateStore: (store: StoreInput) => Promise<OwnerStore>;
  onImportInventory: () => void;
  onNavigate: (key: BottomNavKey) => void;
  onCameraRequestHandled?: () => void;
  cameraRequest?: number;
};
