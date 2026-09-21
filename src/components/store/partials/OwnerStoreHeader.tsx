import { EllipsisVertical } from "lucide-react-native";

import StoreSelector from "@/components/store/StoreSelector";
import type { BottomNavKey } from "@/components/ui/BottomNavigation";
import { IconButton } from "@/components/ui/IconButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import ThemeToggle from "@/components/ui/ThemeToggle";
import type { OwnerStore } from "@/services/owner-store.service";
import type { StoreInput } from "@/validation/store.validation";

type OwnerStoreHeaderProps = {
  ownerStore: OwnerStore;
  ownerStores: OwnerStore[];
  onSelectStore?: (store: OwnerStore) => Promise<void>;
  onCreateStore?: (store: StoreInput) => Promise<OwnerStore>;
  onNavigate?: (key: BottomNavKey) => void;
};

export default function OwnerStoreHeader({
  ownerStore,
  ownerStores,
  onSelectStore,
  onCreateStore,
  onNavigate,
}: OwnerStoreHeaderProps) {
  const ownerFirstName = ownerStore.ownerName.trim().split(/\s+/)[0] || "there";

  return (
    <ScreenHeader
      title={`Hi ${ownerFirstName}!`}
      subtitle="Here's your inventory at a glance."
      context={
        <StoreSelector
          ownerStore={ownerStore}
          ownerStores={ownerStores}
          onSelectStore={onSelectStore}
          onCreateStore={onCreateStore}
        />
      }
      actions={
        <>
          <ThemeToggle />
          <IconButton
            icon={EllipsisVertical}
            label="Open More menu"
            size={24}
            onPress={() => onNavigate?.("more")}
            style={{ width: 44, height: 44 }}
          />
        </>
      }
    />
  );
}
