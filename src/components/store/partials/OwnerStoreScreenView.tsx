import { ScrollView, Text, View } from "react-native";
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
  ownerStores,
  trialDaysRemaining,
  trialExpirationLabel,
  onSelectStore,
  onCreateStore,
  onNavigate,
  overview,
}: OwnerStoreScreenViewProps) {
  const stores = ownerStores?.length ? ownerStores : [ownerStore];
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
            ownerStores={stores}
            onSelectStore={onSelectStore}
            onCreateStore={onCreateStore}
            onNavigate={onNavigate}
          />
          <View style={styles.trialCard}>
            <Text style={styles.trialTitle}>
              {trialDaysRemaining} {trialDaysRemaining === 1 ? "day" : "days"} left in your trial
            </Text>
            <Text style={styles.trialDate}>Trial expires {trialExpirationLabel}</Text>
          </View>
          <OwnerStoreOverview overview={overview} onNavigate={onNavigate} />
        </ScrollView>
        <BottomNavigation activeKey="dashboard" onChange={onNavigate} />
      </View>
    </SafeAreaView>
  );
}
