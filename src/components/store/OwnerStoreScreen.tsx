import { Boxes, PackageOpen, Store } from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomNavigation } from "@/components/ui/BottomNavigation";
import { Card } from "@/components/ui/Card";
import type { OwnerStore } from "@/services/owner-store.service";
import { colors, radii, spacing, typography } from "@/theme";

type OwnerStoreScreenProps = {
  ownerStore: OwnerStore;
};

function ownerInitials(ownerName: string) {
  return ownerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function OwnerStoreScreen({ ownerStore }: OwnerStoreScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Store owner</Text>
              <Text style={styles.ownerName}>{ownerStore.ownerName}</Text>
            </View>
            <View accessible accessibilityLabel={`Owner ${ownerStore.ownerName}`} style={styles.avatar}>
              <Text style={styles.avatarText}>{ownerInitials(ownerStore.ownerName)}</Text>
            </View>
          </View>

          <View>
            <Text style={styles.title}>Your store</Text>
            <Text style={styles.subtitle}>Keep your stock and products moving.</Text>
          </View>

          <Card variant="selected" style={styles.storeCard}>
            <View style={styles.storeHeader}>
              <View style={styles.storeIcon}>
                <Store color={colors.primary[600]} size={22} strokeWidth={2} />
              </View>
              <View style={styles.storeCopy}>
                <Text style={styles.cardLabel}>Current store</Text>
                <Text style={styles.storeName}>{ownerStore.storeName}</Text>
              </View>
            </View>
            <Text style={styles.cardDescription}>Your store is ready. Add products to start managing inventory.</Text>
          </Card>

          <Text style={styles.sectionTitle}>Store overview</Text>
          <View style={styles.overviewRow}>
            <Card style={styles.overviewCard}>
              <PackageOpen color={colors.primary[600]} size={20} />
              <Text style={styles.overviewValue}>0</Text>
              <Text style={styles.overviewLabel}>Products</Text>
            </Card>
            <Card style={styles.overviewCard}>
              <Boxes color={colors.semantic.warning} size={20} />
              <Text style={styles.overviewValue}>0</Text>
              <Text style={styles.overviewLabel}>Items in stock</Text>
            </Card>
          </View>
        </ScrollView>
        <BottomNavigation activeKey="dashboard" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.app,
  },
  screen: {
    flex: 1,
  },
  content: {
    gap: spacing[6],
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    ...typography.caption,
    color: colors.text.muted,
  },
  ownerName: {
    ...typography.h2,
    color: colors.text.primary,
  },
  avatar: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    backgroundColor: colors.primary[100],
  },
  avatarText: {
    ...typography.label,
    color: colors.primary[700],
    fontWeight: "700",
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.bodySmall,
    marginTop: spacing[1],
    color: colors.text.secondary,
  },
  storeCard: {
    gap: spacing[4],
  },
  storeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  storeIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.white,
  },
  storeCopy: {
    flex: 1,
  },
  cardLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  storeName: {
    ...typography.h3,
    color: colors.text.primary,
  },
  cardDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.text.primary,
  },
  overviewRow: {
    flexDirection: "row",
    gap: spacing[3],
  },
  overviewCard: {
    flex: 1,
    gap: spacing[2],
  },
  overviewValue: {
    ...typography.h2,
    color: colors.text.primary,
  },
  overviewLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
