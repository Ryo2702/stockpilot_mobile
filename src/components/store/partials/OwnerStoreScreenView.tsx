import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomNavigation } from "@/components/ui/BottomNavigation";
import { OwnerStoreOverview } from "@/features/dashboard";
import { useThemeStyles } from "@/theme/ThemeProvider";

import type { OwnerStoreScreenProps } from "../OwnerStoreScreen";
import useOwnerStoreScreen from "../hooks/useOwnerStoreScreen";
import OwnerStoreHeader from "./OwnerStoreHeader";
import { createOwnerStoreStyles } from "./owner-store.styles";

type OwnerStoreScreenViewProps = OwnerStoreScreenProps &
  ReturnType<typeof useOwnerStoreScreen>;

export default function OwnerStoreScreenView({
  ownerStore,
  onNavigate,
  overview,
}: OwnerStoreScreenViewProps) {
  const styles = useThemeStyles(createOwnerStoreStyles);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <OwnerStoreHeader
            ownerStore={ownerStore}
            onNavigate={onNavigate}
          />
          <OwnerStoreOverview overview={overview} onNavigate={onNavigate} />
        </ScrollView>
        <BottomNavigation activeKey="dashboard" onChange={onNavigate} />
      </View>
    </SafeAreaView>
  );
}
