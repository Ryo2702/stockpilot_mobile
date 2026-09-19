import type { OwnerStore } from "@/services/owner-store.service";
import type { StoreInput } from "@/validation/store.validation";

export type StoreSelectorProps = {
  ownerStore: OwnerStore;
  ownerStores?: OwnerStore[];
  onSelectStore?: (store: OwnerStore) => Promise<void>;
  onCreateStore?: (store: StoreInput) => Promise<OwnerStore>;
  showAddStoreButton?: boolean;
  compact?: boolean;
  disabled?: boolean;
};

export type SelectorView = "list" | "create";
