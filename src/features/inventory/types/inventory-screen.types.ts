import type { BottomNavKey } from "@/components/ui/BottomNavigation";
import type { OwnerStore } from "@/services/owner-store.service";
import type { StoreInput } from "@/validation/store.validation";

export type InventoryPage = "list" | "detail" | "movements" | "movementDetail" | "archived";
export type InventoryDetailReturnPage = "list" | "archived";
export type InventoryMovementListReturnPage = "list" | "detail" | "archived";

export type InventoryScreenProps = {
  ownerStore: OwnerStore;
  ownerStores: OwnerStore[];
  onSelectStore: (store: OwnerStore) => Promise<void>;
  onCreateStore: (store: StoreInput) => Promise<OwnerStore>;
  onOpenCatalogProduct: (productId: string) => void;
  onNavigate: (key: BottomNavKey) => void;
};
