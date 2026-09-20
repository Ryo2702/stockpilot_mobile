import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import StoreSelector from "@/components/store/StoreSelector";
import { BottomNavigation, type BottomNavKey } from "@/components/ui/BottomNavigation";
import { Button } from "@/components/ui/Button";
import ScreenHeader from "@/components/ui/ScreenHeader";
import type { OwnerStore } from "@/services/owner-store.service";
import { spacing, typography, useThemeStyles } from "@/theme";
import type { ThemeColors } from "@/theme/tokens";
import type { StoreInput } from "@/validation/store.validation";

const insightsImage = require("../../../assets/images/stockpilot/empty state png/bulb2.png");

type ModuleKey = Extract<BottomNavKey, "insights">;

type ModuleEmptyScreenProps = {
  activeKey: ModuleKey;
  ownerStore: OwnerStore;
  ownerStores: OwnerStore[];
  onSelectStore: (store: OwnerStore) => Promise<void>;
  onCreateStore: (store: StoreInput) => Promise<OwnerStore>;
  onNavigate: (key: BottomNavKey) => void;
};

const content = {
  insights: {
    title: "Insights",
    subtitle: "See how your store is performing.",
    emptyTitle: "No insights yet",
    description: "Insights will appear after you add products and record stock activity.",
    image: insightsImage,
  },
} as const;

export default function ModuleEmptyScreen({
  activeKey,
  ownerStore,
  ownerStores,
  onSelectStore,
  onCreateStore,
  onNavigate,
}: ModuleEmptyScreenProps) {
  const styles = useThemeStyles(createStyles);
  const screen = content[activeKey];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader
            title={screen.title}
            subtitle={screen.subtitle}
            context={
              <StoreSelector
                ownerStore={ownerStore}
                ownerStores={ownerStores}
                onSelectStore={onSelectStore}
                onCreateStore={onCreateStore}
              />
            }
          />
          <View style={styles.empty}>
            <Image
              accessible={false}
              source={screen.image}
              resizeMode="contain"
              style={styles.image}
            />
            <Text style={styles.title}>{screen.emptyTitle}</Text>
            <Text style={styles.description}>{screen.description}</Text>
            <Button title="Go to Catalog" onPress={() => onNavigate("catalog")} />
          </View>
        </ScrollView>
        <BottomNavigation activeKey={activeKey} onChange={onNavigate} />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.app,
  },
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    gap: spacing[4],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    padding: spacing[6],
  },
  image: {
    width: 180,
    height: 180,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
    textAlign: "center",
  },
  description: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: "center",
  },
});
