import { useSQLiteContext } from "expo-sqlite";
import { Boxes, Info, LogOut, PackageOpen, Settings, Store } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomNavigation } from "@/components/ui/BottomNavigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  getOwnerStoreOverview,
  type OwnerStore,
  type OwnerStoreOverview,
} from "@/services/owner-store.service";
import { colors, radii, spacing, typography } from "@/theme";
import type { StoreInput } from "@/validation/store.validation";

import StoreSelector from "./StoreSelector";

const headMascot = require("../../../assets/images/stockpilot/headMascot-transparent.png");

type OwnerStoreScreenProps = {
  ownerStore: OwnerStore;
  ownerStores?: OwnerStore[];
  onSelectStore?: (store: OwnerStore) => Promise<void>;
  onCreateStore?: (store: StoreInput) => Promise<OwnerStore>;
  onExit: () => void;
};

export default function OwnerStoreScreen({
  ownerStore,
  ownerStores,
  onSelectStore,
  onCreateStore,
  onExit,
}: OwnerStoreScreenProps) {
  const db = useSQLiteContext();
  const stores = ownerStores?.length ? ownerStores : [ownerStore];
  const [overview, setOverview] = useState<OwnerStoreOverview | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setOverview(null);

    getOwnerStoreOverview(db, ownerStore.businessId, ownerStore.storeId)
      .then((value) => {
        if (active) setOverview(value);
      })
      .catch(() => {
        if (active) setOverview({ catalogCount: 0, itemsInStock: 0 });
      });

    return () => {
      active = false;
    };
  }, [db, ownerStore.businessId, ownerStore.storeId]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.ownerCopy}>
              <Text style={styles.eyebrow}>Store owner</Text>
              <Text style={styles.ownerName}>{ownerStore.ownerName}</Text>
            </View>
            <View style={styles.headerActions}>
              <StoreSelector
                ownerStore={ownerStore}
                ownerStores={stores}
                onSelectStore={onSelectStore}
                onCreateStore={onCreateStore}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open StockPilot menu"
                onPress={() => setMenuOpen(true)}
                style={({ pressed }) => [styles.mascotButton, pressed && styles.mascotPressed]}
              >
                <Image
                  accessible={false}
                  source={headMascot}
                  resizeMode="contain"
                  style={styles.mascot}
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.intro}>
            <Text style={styles.title}>
              {stores.length > 1 ? "Your stores" : "Your store"}
            </Text>
            <Text style={styles.subtitle}>
              Keep your stock and items moving.
            </Text>
          </View>

          <Card variant="selected" style={styles.storeCard}>
            <View style={styles.storeHeader}>
              <View style={styles.storeIcon}>
                <Store color={colors.primary[600]} size={24} strokeWidth={2} />
              </View>
              <View style={styles.storeCopy}>
                <Text style={styles.cardLabel}>Current store</Text>
                <Text style={styles.storeName}>{ownerStore.storeName}</Text>
              </View>
            </View>
            <Text style={styles.cardDescription}>
              Your store is ready. Add catalogs to start managing inventory.
            </Text>
          </Card>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Store overview</Text>
            <Text style={styles.sectionHint}>For {ownerStore.storeName}</Text>
          </View>
          <View style={styles.overviewRow}>
            <Card style={styles.overviewCard}>
              <PackageOpen color={colors.primary[600]} size={22} />
              <Text style={styles.overviewValue}>{overview?.catalogCount ?? "—"}</Text>
              <Text style={styles.overviewLabel}>Catalogs</Text>
            </Card>
            <Card style={styles.overviewCard}>
              <Boxes color={colors.semantic.warning} size={22} />
              <Text style={styles.overviewValue}>{overview?.itemsInStock ?? "—"}</Text>
              <Text style={styles.overviewLabel}>Items in stock</Text>
            </Card>
          </View>
        </ScrollView>
        <BottomNavigation activeKey="dashboard" />
      </View>
      <Modal
        visible={menuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <SafeAreaView style={styles.menuSafeArea} edges={["top", "right", "left"]}>
          <Pressable
            accessibilityLabel="Close StockPilot menu"
            onPress={() => setMenuOpen(false)}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.menuCard}>
            <Text style={styles.menuTitle}>StockPilot</Text>
            <Button
              title="Settings"
              icon={Settings}
              variant="ghost"
              onPress={() => {
                setMenuOpen(false);
                Alert.alert("Settings", "Settings will be available here.");
              }}
              style={styles.menuButton}
            />
            <Button
              title="About"
              icon={Info}
              variant="ghost"
              onPress={() => {
                setMenuOpen(false);
                Alert.alert("About StockPilot", "StockPilot keeps your store inventory on this device.");
              }}
              style={styles.menuButton}
            />
            <Button
              title="Exit"
              icon={LogOut}
              variant="secondary"
              onPress={() => {
                setMenuOpen(false);
                onExit();
              }}
              style={styles.menuButton}
            />
          </View>
        </SafeAreaView>
      </Modal>
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
    gap: spacing[8],
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[10],
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[4],
  },
  ownerCopy: {
    flex: 1,
    minWidth: 0,
    paddingTop: spacing[1],
  },
  headerActions: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  mascotButton: {
    width: 56,
    height: 56,
  },
  mascotPressed: {
    opacity: 0.7,
  },
  mascot: {
    width: 56,
    height: 56,
    marginTop: -spacing[2],
  },
  menuSafeArea: {
    flex: 1,
    alignItems: "flex-end",
    backgroundColor: "transparent",
  },
  menuCard: {
    width: 220,
    gap: spacing[2],
    marginTop: spacing[2],
    marginRight: spacing[4],
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.lg,
    backgroundColor: colors.background.surface,
  },
  menuTitle: {
    ...typography.label,
    paddingHorizontal: spacing[2],
    color: colors.text.muted,
  },
  menuButton: {
    width: "100%",
    justifyContent: "flex-start",
  },
  eyebrow: {
    ...typography.caption,
    color: colors.text.muted,
  },
  ownerName: {
    ...typography.h2,
    color: colors.text.primary,
  },
  intro: {
    gap: spacing[1],
  },
  title: {
    ...typography.display,
    color: colors.text.primary,
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  storeCard: {
    gap: spacing[6],
    padding: spacing[6],
  },
  storeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
  },
  storeIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.lg,
    backgroundColor: colors.white,
  },
  storeCopy: {
    flex: 1,
    minWidth: 0,
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
  sectionHeader: {
    gap: spacing[1],
  },
  sectionTitle: {
    ...typography.title,
    color: colors.text.primary,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.text.muted,
  },
  overviewRow: {
    flexDirection: "row",
    gap: spacing[4],
  },
  overviewCard: {
    flex: 1,
    minHeight: 140,
    gap: spacing[3],
    padding: spacing[5],
  },
  overviewValue: {
    ...typography.h1,
    color: colors.text.primary,
  },
  overviewLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
