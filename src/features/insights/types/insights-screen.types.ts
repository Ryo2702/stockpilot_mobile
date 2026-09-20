import type { BottomNavKey } from "@/components/ui/BottomNavigation";
import type { OwnerStore } from "@/services/owner-store.service";
import type { StoreInput } from "@/validation/store.validation";

export type InsightsScreenProps = {
  ownerStore: OwnerStore;
  ownerStores: OwnerStore[];
  onSelectStore: (store: OwnerStore) => Promise<void>;
  onCreateStore: (store: StoreInput) => Promise<OwnerStore>;
  onNavigate: (key: BottomNavKey) => void;
};
