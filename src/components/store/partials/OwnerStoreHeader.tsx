import { EllipsisVertical } from "lucide-react-native";
import { Image, Pressable } from "react-native";

import StoreSelector from "@/components/store/StoreSelector";
import ScreenHeader from "@/components/ui/ScreenHeader";
import ThemeToggle from "@/components/ui/ThemeToggle";
import type { OwnerStore } from "@/services/owner-store.service";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";
import type { StoreInput } from "@/validation/store.validation";

import { createOwnerStoreStyles } from "./owner-store.styles";

const headMascot = require("../../../../assets/images/stockpilot/headMascot-transparent.png");

type OwnerStoreHeaderProps = {
  ownerStore: OwnerStore;
  ownerStores: OwnerStore[];
  onSelectStore?: (store: OwnerStore) => Promise<void>;
  onCreateStore?: (store: StoreInput) => Promise<OwnerStore>;
  onOpenMenu: () => void;
};

export default function OwnerStoreHeader({
  ownerStore,
  ownerStores,
  onSelectStore,
  onCreateStore,
  onOpenMenu,
}: OwnerStoreHeaderProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createOwnerStoreStyles);

  return (
    <ScreenHeader
      title={`Hi ${ownerStore.ownerName}!`}
      subtitle="Here's your store overview."
      leading={
        <Image
          accessible
          accessibilityLabel="StockPilot mascot"
          source={headMascot}
          resizeMode="contain"
          style={styles.brandMark}
        />
      }
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open StockPilot menu"
            onPress={onOpenMenu}
            style={({ pressed }) => [
              styles.overflowButton,
              pressed && styles.pressed,
            ]}
          >
            <EllipsisVertical color={colors.text.secondary} size={21} />
          </Pressable>
        </>
      }
    />
  );
}
