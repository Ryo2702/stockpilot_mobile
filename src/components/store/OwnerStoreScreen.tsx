import type {
  OwnerStore,
  OwnerStoreDetails,
  OwnerStoreOverview,
} from "@/services/owner-store.service";
import type { BottomNavKey } from "@/components/ui/BottomNavigation";
import type { StoreInput } from "@/validation/store.validation";

import useOwnerStoreScreen from "./hooks/useOwnerStoreScreen";
import OwnerStoreScreenView from "./partials/OwnerStoreScreenView";

export type OwnerStoreScreenProps = {
  ownerStore: OwnerStore;
  ownerStores?: OwnerStore[];
  onSelectStore?: (store: OwnerStore) => Promise<void>;
  onCreateStore?: (store: StoreInput) => Promise<OwnerStore>;
  onUpdateStore?: (store: StoreInput) => Promise<OwnerStoreDetails>;
  onDeleteStore?: () => Promise<void>;
  onNavigate?: (key: BottomNavKey) => void;
  onExit: () => void;
};

export default function OwnerStoreScreen(props: OwnerStoreScreenProps) {
  const screen = useOwnerStoreScreen(props.ownerStore, props.onUpdateStore);

  return <OwnerStoreScreenView {...props} {...screen} />;
}
