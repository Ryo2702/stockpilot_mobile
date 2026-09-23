import { Database, Download, House, Info, Settings, Upload } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomNavigation, type BottomNavKey } from "@/components/ui/BottomNavigation";
import type { OwnerStore, OwnerStoreDetails } from "@/services/owner-store.service";
import type { StoreInput } from "@/validation/store.validation";
import { spacing, useThemeStyles } from "@/theme";

import SettingsScreen, { SettingsGroup, SettingsRow, type SettingsPage } from "./SettingsScreen";
import { createSettingsStyles } from "./settings.styles";

type MoreScreenProps = {
  ownerStore: OwnerStore;
  ownerStores: OwnerStore[];
  onSelectStore: (store: OwnerStore) => Promise<void>;
  onCreateStore: (store: StoreInput) => Promise<OwnerStore>;
  onUpdateStore: (store: StoreInput) => Promise<OwnerStoreDetails>;
  onUpdateOwnerName: (businessId: string, name: string) => Promise<void>;
  onDeleteStore: () => Promise<void>;
  onOpenStoreManagement: () => void;
  onOpenInventoryAction: (action: "import" | "export") => void;
  onRestoreComplete: () => Promise<void>;
  onNavigate: (key: BottomNavKey) => void;
  onPinChanged: (pin: string) => void;
  onExit: () => void;
};

export default function MoreScreen(props: MoreScreenProps) {
  const styles = useThemeStyles(createSettingsStyles);
  const [page, setPage] = useState<"more" | "settings">("more");
  const [settingsInitialPage, setSettingsInitialPage] = useState<SettingsPage>("home");

  const openSettings = (initialPage: SettingsPage) => {
    setSettingsInitialPage(initialPage);
    setPage("settings");
  };

  if (page === "settings") {
    return (
      <SettingsScreen
        {...props}
        initialPage={settingsInitialPage}
        onNavigate={(key) => key === "more" ? setPage("more") : props.onNavigate(key)}
        onClose={() => setPage("more")}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { gap: spacing[5] }]} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.pageTitle}>More</Text>
            <Text style={styles.pageSubtitle}>Tools and information for StockPilot.</Text>
          </View>
          <SettingsGroup label="Preferences">
            <SettingsRow
              icon={Settings}
              title="Settings"
              description="Manage preferences and local data"
              onPress={() => openSettings("home")}
            />
          </SettingsGroup>
          <SettingsGroup label="Data & Storage">
            <SettingsRow
              icon={Database}
              title="Backup & Restore"
              description="Manage local backup files"
              onPress={() => openSettings("backup")}
            />
            <SettingsRow
              icon={Upload}
              title="Import Inventory"
              description="Import inventory from CSV"
              onPress={() => props.onOpenInventoryAction("import")}
            />
            <SettingsRow
              icon={Download}
              title="Export Inventory"
              description="Export store data as CSV"
              onPress={() => props.onOpenInventoryAction("export")}
            />
          </SettingsGroup>
          <SettingsGroup label="Application">
            <SettingsRow
              icon={Info}
              title="About StockPilot"
              onPress={() => openSettings("about")}
            />
            <SettingsRow
              icon={House}
              title="Exit"
              description="Return to onboarding"
              onPress={props.onExit}
            />
          </SettingsGroup>
        </ScrollView>
        <BottomNavigation activeKey={null} onChange={props.onNavigate} />
      </View>
    </SafeAreaView>
  );
}
