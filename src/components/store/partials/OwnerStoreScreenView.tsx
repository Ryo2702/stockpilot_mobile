import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomNavigation } from "@/components/ui/BottomNavigation";
import { useThemeStyles } from "@/theme/ThemeProvider";

import type { OwnerStoreScreenProps } from "../OwnerStoreScreen";
import useOwnerStoreScreen from "../hooks/useOwnerStoreScreen";
import OwnerStoreHeader from "./OwnerStoreHeader";
import OwnerStoreMenu from "./OwnerStoreMenu";
import OwnerStoreOverviewSection from "./OwnerStoreOverview";
import { createOwnerStoreStyles } from "./owner-store.styles";

type OwnerStoreScreenViewProps = OwnerStoreScreenProps &
  ReturnType<typeof useOwnerStoreScreen>;

export default function OwnerStoreScreenView({
  ownerStore,
  ownerStores,
  onSelectStore,
  onCreateStore,
  onNavigate,
  onExit,
  overview,
  menuOpen,
  openMenu,
  closeMenu,
}: OwnerStoreScreenViewProps) {
  const stores = ownerStores?.length ? ownerStores : [ownerStore];
  const styles = useThemeStyles(createOwnerStoreStyles);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <OwnerStoreHeader
            ownerStore={ownerStore}
            ownerStores={stores}
            onSelectStore={onSelectStore}
            onCreateStore={onCreateStore}
            onOpenMenu={openMenu}
          />
          <OwnerStoreOverviewSection
            ownerStore={ownerStore}
            overview={overview}
            onNavigate={onNavigate}
          />
        </ScrollView>
        <BottomNavigation activeKey="dashboard" onChange={onNavigate} />
      </View>
      <OwnerStoreMenu visible={menuOpen} onClose={closeMenu} onExit={onExit} />
    </SafeAreaView>
  );
}
