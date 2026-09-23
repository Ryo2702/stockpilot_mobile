import type {
  OwnerStore,
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
  onNavigate?: (key: BottomNavKey) => void;
};

export default function OwnerStoreScreen(props: OwnerStoreScreenProps) {
  const screen = useOwnerStoreScreen(props.ownerStore);

  return <OwnerStoreScreenView {...props} {...screen} />;
}
