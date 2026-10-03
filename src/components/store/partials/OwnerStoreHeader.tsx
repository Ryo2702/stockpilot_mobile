import { EllipsisVertical } from "lucide-react-native";
import { Text } from "react-native";

import type { BottomNavKey } from "@/components/ui/BottomNavigation";
import { IconButton } from "@/components/ui/IconButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import ThemeToggle from "@/components/ui/ThemeToggle";
import type { OwnerStore } from "@/services/owner-store.service";

type OwnerStoreHeaderProps = {
  ownerStore: OwnerStore;
  onNavigate?: (key: BottomNavKey) => void;
};

export default function OwnerStoreHeader({
  ownerStore,
  onNavigate,
}: OwnerStoreHeaderProps) {
  const ownerFirstName = ownerStore.ownerName.trim().split(/\s+/)[0] || "there";

  return (
    <ScreenHeader
      title={(
        <>
          <Text style={{ fontWeight: "400" }}>Hi </Text>
          <Text style={{ fontWeight: "700" }}>{ownerFirstName}</Text>
          <Text style={{ fontWeight: "400" }}>!</Text>
        </>
      )}
      subtitle={`Here's your inventory at a glance · ${ownerStore.storeName}.`}
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
