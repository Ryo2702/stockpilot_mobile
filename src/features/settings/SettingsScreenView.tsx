import { ArrowLeft } from "lucide-react-native";
import { type ReactNode } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BottomNavigation } from "@/components/ui/BottomNavigation";
import { Button } from "@/components/ui/Button";
import { legalPages } from "@/data/legal.data";
import { useThemeStyles } from "@/theme/ThemeProvider";

import type { Page, SettingsController, SettingsScreenProps } from "./settings.controller";
import SettingsDialogs from "./SettingsDialogs";
import {
  AboutContent,
  BackupContent,
  PremiumAccessContent,
  LegalContent,
  StorageContent,
} from "./SettingsDataContent";
import {
  AddressContent,
  CurrencyContent,
  CurrentStoreContent,
  OwnerNameContent,
  SettingsHomeContent,
  StoreNameContent,
  StorePreferencesContent,
  StoreTypeContent,
} from "./SettingsGeneralContent";
import {
  AppearanceContent,
  ReorderContent,
  StockPreferencesContent,
  UnitContent,
} from "./SettingsInventoryContent";
import {
  SecurityContent,
  SecurityQuestionsContent,
} from "./SettingsSecurityContent";
import { createSettingsStyles } from "./settings.styles";

const titleByPage: Record<Page, string> = {
  home: "Settings",
  "owner-name": "Your Name",
  "store-preferences": "Store Preferences",
  "store-name": "Store Name",
  "store-type": "Store Type",
  currency: "Currency",
  "store-address": "Address",
  "current-store": "Current Store",
  "stock-preferences": "Stock Preferences",
  reorder: "Default Reorder Settings",
  unit: "Default Unit",
  appearance: "Theme",
  security: "Security",
  "security-questions": "Recovery Questions",
  terms: legalPages.terms.title,
  privacy: legalPages.privacy.title,
  faq: legalPages.faq.title,
  rules: legalPages.rules.title,
  backup: "Backup & Restore",
  storage: "Storage Usage",
  "premium-access": "Premium Access",
  about: "About StockPilot",
};

type ViewProps = SettingsScreenProps & { settings: SettingsController };

export default function SettingsScreenView({
  ownerStore,
  ownerStores,
  onSelectStore,
  onCreateStore,
  onOpenStoreManagement,
  onOpenInventoryAction,
  onNavigate,
  onClose,
  settings,
}: ViewProps) {
  const styles = useThemeStyles(createSettingsStyles);
  const { page, back } = settings;

  const header = (
    <View style={styles.header}>
      {page === "home" ? (
        <>
          <View style={styles.headerRow}>
            <Button
              title="More"
              icon={ArrowLeft}
              size="sm"
              variant="ghost"
              accessibilityLabel="Back to More"
              onPress={onClose}
              style={styles.backButton}
            />
            <Text style={styles.pageTitle}>Settings</Text>
          </View>
          <Text style={styles.pageSubtitle}>
            Manage your StockPilot preferences and local data.
          </Text>
        </>
      ) : (
        <View style={styles.headerRow}>
          <Button
            title="Back"
            icon={ArrowLeft}
            size="sm"
            variant="ghost"
            accessibilityLabel={"Back from " + titleByPage[page]}
            onPress={back}
            style={styles.backButton}
          />
          <Text style={styles.pageTitle}>{titleByPage[page]}</Text>
        </View>
      )}
    </View>
  );

  const pageContent: Record<Page, ReactNode> = {
    home: (
      <SettingsHomeContent
        ownerStore={ownerStore}
        onOpenStoreManagement={onOpenStoreManagement}
        onOpenInventoryAction={onOpenInventoryAction}
        settings={settings}
      />
    ),
    "owner-name": <OwnerNameContent settings={settings} />,
    "store-preferences": <StorePreferencesContent settings={settings} />,
    "store-name": <StoreNameContent settings={settings} />,
    "store-type": <StoreTypeContent settings={settings} />,
    currency: <CurrencyContent settings={settings} />,
    "store-address": <AddressContent settings={settings} />,
    "current-store": (
      <CurrentStoreContent
        ownerStore={ownerStore}
        ownerStores={ownerStores}
        onSelectStore={onSelectStore}
        onCreateStore={onCreateStore}
      />
    ),
    "stock-preferences": <StockPreferencesContent />,
    reorder: <ReorderContent settings={settings} />,
    unit: <UnitContent settings={settings} />,
    appearance: <AppearanceContent settings={settings} />,
    security: <SecurityContent settings={settings} />,
    "security-questions": <SecurityQuestionsContent settings={settings} />,
    terms: <LegalContent pageKey="terms" />,
    privacy: <LegalContent pageKey="privacy" />,
    faq: <LegalContent pageKey="faq" />,
    rules: <LegalContent pageKey="rules" />,
    backup: <BackupContent settings={settings} />,
    storage: <StorageContent settings={settings} />,
    "premium-access": <PremiumAccessContent />,
    about: <AboutContent />,
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            page === "home" && styles.homeContent,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {header}
          {pageContent[page]}
        </ScrollView>
        <BottomNavigation activeKey={null} onChange={onNavigate} />
      </View>
      <SettingsDialogs ownerStore={ownerStore} settings={settings} />
    </SafeAreaView>
  );
}
