import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock3,
  Database,
  Download,
  FileText,
  HardDrive,
  Info,
  MapPin,
  Moon,
  Package,
  ReceiptText,
  RefreshCw,
  Ruler,
  Save,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Trash2,
  Upload,
  UserRound,
  type LucideIcon,
} from "lucide-react-native";
import Constants from "expo-constants";
import * as DocumentPicker from "expo-document-picker";
import { useSQLiteContext } from "expo-sqlite";
import { Children, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import StoreSelector from "@/components/store/StoreSelector";
import {
  countryCodeOptions,
  currencyModeOptions,
  currencyOptions,
  decimalPlaceOptions,
  storeTypeOptions,
  toStoreForm,
} from "@/components/store/store.data";
import type { StoreErrors, StoreForm } from "@/components/store/store.types";
import { BottomNavigation, type BottomNavKey } from "@/components/ui/BottomNavigation";
import { Button } from "@/components/ui/Button";
import { legalPages, type LegalPage } from "@/data/legal.data";
import { getCurrencySymbol } from "@/domain/currency";
import { productUnitOptions } from "@/data/catalog.data";
import useAsyncEffect from "@/hooks/useAsyncEffect";
import { parseNumberInput } from "@/validation/number.validation";
import {
  getOwnerStoreDetails,
  type OwnerStore,
  type OwnerStoreDetails,
} from "@/services/owner-store.service";
import {
  canShareBackup,
  createBackup,
  getStorageUsage,
  inspectBackup,
  listLocalBackups,
  readBackupFile,
  restoreBackup,
  saveBackupToDevice,
  shareBackup,
  type BackupSummary,
  type LocalBackupFile,
} from "@/services/backup.service";
import {
  getInventoryProductDefaults,
  saveInventoryProductDefaults,
} from "@/services/inventory";
import { getAppPin, getThemePreference, saveAppPin } from "@/services/settings.service";
import { isValidPin } from "@/validation/pin.validation";
import { ownerNameSchema, storeSchema, type StoreInput, type StoreSchema } from "@/validation/store.validation";
import { spacing } from "@/theme";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";
import type { ThemePreference } from "@/theme/tokens";

import { createSettingsStyles } from "./settings.styles";

export type SettingsPage = "home" | "backup" | "about" | "security" | LegalPage;
type Page =
  | SettingsPage
  | "owner-name"
  | "store-preferences"
  | "store-name"
  | "store-type"
  | "currency"
  | "store-address"
  | "current-store"
  | "stock-preferences"
  | "reorder"
  | "unit"
  | "appearance"
  | "storage"
  | "premium"
  | "restore-purchase";

type SettingsScreenProps = {
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
  initialPage: SettingsPage;
  onClose: () => void;
};

type RestoreCandidate = {
  name: string;
  bytes: Uint8Array;
  summary: BackupSummary;
  createdAt: number | null;
};

const themeLabels: Record<ThemePreference, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};
const version = Constants.expoConfig?.version ?? "1.9.0";
const build = Constants.nativeBuildVersion ?? "Development";
const currencyDisplayNames = (() => {
  try {
    return new Intl.DisplayNames(undefined, { type: "currency" });
  } catch {
    return null;
  }
})();

function currencyOptionLabel(value: string, fallback: string) {
  const name = currencyDisplayNames?.of(value);
  const symbol = getCurrencySymbol({ currencyMode: "iso", currencyCode: value });
  return name && name.toUpperCase() !== value
    ? name + " (" + value + " · " + symbol + ")"
    : fallback;
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value < 0) return "Unavailable";
  if (value < 1024) return Math.round(value) + " bytes";
  const units = ["KB", "MB", "GB"];
  let size = value / 1024;
  let unit = units[0];
  for (let index = 1; size >= 1024 && index < units.length; index += 1) {
    size /= 1024;
    unit = units[index];
  }
  return size.toFixed(size >= 10 ? 1 : 2) + " " + unit;
}

function formatDateTime(timestamp: number | null | undefined) {
  if (!timestamp) return "Date unavailable";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  const day = new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric", year: "numeric" }).format(date);
  const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(date);
  return day + " · " + time;
}

function backupDateFromName(name: string) {
  const match = /^stockpilot-backup-(\d{4}-\d{2}-\d{2})-(\d{2})-(\d{2})-(\d{2})(?:-(\d{3}))?\.spbackup$/i.exec(name);
  if (!match) return null;
  const date = new Date(match[1] + "T" + match[2] + ":" + match[3] + ":" + match[4] + "." + (match[5] ?? "000"));
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function getUnitLabel(value: string) {
  return productUnitOptions.find((option) => option.value === value)?.label ?? value;
}

function getStoreTypeLabel(value?: string) {
  return storeTypeOptions.find((option) => option.value === value)?.label ?? "Other";
}

function getCurrencyLabel(form: StoreForm) {
  if (form.currencyMode === "custom") {
    const name = form.customCurrencyName?.trim() || "Custom currency";
    const symbol = form.customCurrencySymbol?.trim();
    return symbol ? name + " (" + symbol + ")" : name;
  }
  const code = form.currencyCode?.trim().toUpperCase() || "PHP";
  const option = currencyOptions.find((item) => item.value === code);
  return option ? currencyOptionLabel(option.value, option.label) : code;
}

function SettingsRow({
  icon: Icon,
  title,
  description,
  value,
  onPress,
  destructive = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createSettingsStyles);
  const content = (
    <>
      <View style={styles.iconSlot}>
        <Icon color={destructive ? colors.semantic.danger : colors.text.muted} size={20} strokeWidth={1.8} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, destructive && styles.destructiveRowTitle]}>{title}</Text>
        {description || value ? (
          <Text numberOfLines={2} style={styles.rowDescription}>{description ?? value}</Text>
        ) : null}
      </View>
      {onPress ? (
        <View style={styles.rowTrailing}>
          <ChevronRight color={colors.text.muted} size={18} />
        </View>
      ) : null}
    </>
  );

  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={description || value ? title + ", " + (description ?? value) : title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {content}
    </Pressable>
  ) : (
    <View style={styles.row}>{content}</View>
  );
}

function SettingsGroup({ label, children }: { label: string; children: ReactNode }) {
  const styles = useThemeStyles(createSettingsStyles);
  const rows = Children.toArray(children);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.group}>
        {rows.map((child, index) => (
          <View key={index}>
            {child}
            {index < rows.length - 1 ? <View style={styles.separator} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function RadioRow({
  label,
  description,
  selected,
  onPress,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createSettingsStyles);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.radioRow, pressed && styles.rowPressed]}
    >
      <View style={styles.choiceCopy}>
        <Text style={styles.radioLabel}>{label}</Text>
        {description ? <Text style={styles.radioDescription}>{description}</Text> : null}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <Check color={colors.text.onPrimary} size={14} strokeWidth={2.5} /> : null}
      </View>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  help,
  keyboardType,
  autoCapitalize = "sentences",
  secureTextEntry = false,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  help?: string;
  keyboardType?: "default" | "number-pad" | "decimal-pad" | "numbers-and-punctuation";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
  maxLength?: number;
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createSettingsStyles);
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        maxLength={maxLength}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.muted}
        secureTextEntry={secureTextEntry}
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
      />
      {help ? <Text style={styles.fieldHelp}>{help}</Text> : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export default function SettingsScreen({
  ownerStore,
  ownerStores,
  onSelectStore,
  onCreateStore,
  onUpdateStore,
  onUpdateOwnerName,
  onDeleteStore,
  onOpenStoreManagement,
  onOpenInventoryAction,
  onRestoreComplete,
  onNavigate,
  onPinChanged,
  initialPage,
  onClose,
}: SettingsScreenProps) {
  const db = useSQLiteContext();
  const { colors, preference, setColorScheme } = useTheme();
  const styles = useThemeStyles(createSettingsStyles);
  const [page, setPage] = useState<Page>(initialPage);
  const [ownerName, setOwnerName] = useState(ownerStore.ownerName);
  const [ownerNameError, setOwnerNameError] = useState("");
  const [formError, setFormError] = useState("");
  const [storeDetails, setStoreDetails] = useState<OwnerStoreDetails | null>(null);
  const [storeDetailsLoading, setStoreDetailsLoading] = useState(true);
  const [storeForm, setStoreForm] = useState<StoreForm>({});
  const [storeErrors, setStoreErrors] = useState<StoreErrors>({});
  const [saving, setSaving] = useState(false);
  const [productDefaults, setProductDefaults] = useState({ defaultReorderLevel: 10, defaultUnit: "ea" });
  const [reorderDraft, setReorderDraft] = useState("10");
  const [reorderError, setReorderError] = useState("");
  const [storage, setStorage] = useState<{ databaseBytes: number; backupBytes: number; totalBytes: number; backupCount: number } | null>(null);
  const [backupFiles, setBackupFiles] = useState<LocalBackupFile[]>([]);
  const [backupResult, setBackupResult] = useState<LocalBackupFile | null>(null);
  const [lastBackup, setLastBackup] = useState<LocalBackupFile | null>(null);
  const [backupError, setBackupError] = useState("");
  const [backupStatus, setBackupStatus] = useState<"preparing" | "saving" | "sharing" | "checking" | null>(null);
  const backupBusy = backupStatus !== null;
  const [shareAvailable, setShareAvailable] = useState(false);
  const [restoreCandidate, setRestoreCandidate] = useState<RestoreCandidate | null>(null);
  const [restoreDialogVisible, setRestoreDialogVisible] = useState(false);
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreError, setRestoreError] = useState("");
  const [restoreMessage, setRestoreMessage] = useState("");
  const [deleteStoreDialogVisible, setDeleteStoreDialogVisible] = useState(false);
  const [deleteStoreBusy, setDeleteStoreBusy] = useState(false);
  const [deleteStoreError, setDeleteStoreError] = useState("");
  const [currencySearch, setCurrencySearch] = useState("");
  const [securityPin, setSecurityPin] = useState<string | null | undefined>(undefined);
  const [securityLoadError, setSecurityLoadError] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [securitySaving, setSecuritySaving] = useState(false);

  const currencyMatches = useMemo(() => {
    const query = currencySearch.trim().toLowerCase();
    if (!query) return currencyOptions;
    return currencyOptions.filter((option) => (option.value + " " + currencyOptionLabel(option.value, option.label)).toLowerCase().includes(query));
  }, [currencySearch]);

  useEffect(() => {
    setOwnerName(ownerStore.ownerName);
  }, [ownerStore.businessId, ownerStore.ownerName]);

  useAsyncEffect((isActive) => {
    setStoreDetailsLoading(true);
    getOwnerStoreDetails(db, ownerStore.businessId, ownerStore.storeId)
      .then((details) => {
        if (!isActive()) return;
        setStoreDetails(details);
        setStoreForm(details ? toStoreForm(details) : {});
      })
      .catch(() => {
        if (isActive()) setStoreDetails(null);
      })
      .finally(() => {
        if (isActive()) setStoreDetailsLoading(false);
      });
  }, [db, ownerStore.businessId, ownerStore.storeId]);

  useAsyncEffect((isActive) => {
    getInventoryProductDefaults(db, ownerStore)
      .then((defaults) => {
        if (!isActive()) return;
        setProductDefaults(defaults);
        setReorderDraft(String(defaults.defaultReorderLevel));
      })
      .catch(() => undefined);
  }, [db, ownerStore.businessId, ownerStore.storeId]);

  useAsyncEffect((isActive) => {
    getAppPin(db)
      .then((pin) => {
        if (isActive()) {
          setSecurityPin(pin);
          setSecurityLoadError(false);
        }
      })
      .catch(() => {
        if (isActive()) setSecurityLoadError(true);
      });
  }, [db]);

  useAsyncEffect((isActive) => {
    getStorageUsage(db)
      .then((result) => {
        if (isActive()) setStorage(result);
      })
      .catch(() => {
        if (isActive()) setStorage(null);
      });
  }, [db, backupFiles.length]);

  useAsyncEffect((isActive) => {
    if (page !== "backup") return;
    setBackupError("");
    listLocalBackups()
      .then((files) => {
        if (!isActive()) return;
        setBackupFiles(files);
        setLastBackup((current) => current && current.uri === null ? current : files[0] ?? null);
      })
      .catch(() => {
        if (isActive()) setBackupFiles([]);
      });
    void canShareBackup().then((available) => {
      if (isActive()) setShareAvailable(available);
    }).catch(() => {
      if (isActive()) setShareAvailable(false);
    });
  }, [db, page]);

  useEffect(() => {
    if (page === "reorder") setReorderDraft(String(productDefaults.defaultReorderLevel));
    if (page === "currency") setCurrencySearch("");
    setFormError("");
  }, [page, productDefaults.defaultReorderLevel]);

  const back = () => {
    if (page === "home") {
      onClose();
      return;
    }
    if (page === "store-name" || page === "store-type" || page === "currency" || page === "store-address") {
      setPage("store-preferences");
      return;
    }
    if ((page === "backup" && initialPage === "backup") || (page === "about" && initialPage === "about")) {
      onClose();
      return;
    }
    setPage("home");
  };

  const updateStoreField = <K extends keyof StoreSchema,>(field: K, value: StoreSchema[K]) => {
    setStoreForm((current) => ({ ...current, [field]: value }));
    setStoreErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
    setFormError("");
  };

  const saveStoreForm = async (nextForm: StoreForm = storeForm) => {
    const parsed = storeSchema.safeParse(nextForm);
    if (!parsed.success) {
      const nextErrors: StoreErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof StoreSchema | undefined;
        nextErrors[key ?? "form"] = issue.message;
      }
      setStoreErrors(nextErrors);
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const updated = await onUpdateStore(parsed.data);
      setStoreDetails(updated);
      setStoreForm(toStoreForm(updated));
      setStoreErrors({});
      setPage("store-preferences");
    } catch {
      setFormError("Store preferences couldn't be saved. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveOwnerName = async () => {
    const parsed = ownerNameSchema.safeParse(ownerName);
    if (!parsed.success) {
      setOwnerNameError(parsed.error.issues[0]?.message ?? "Please enter your name.");
      return;
    }
    setSaving(true);
    setOwnerNameError("");
    try {
      await onUpdateOwnerName(ownerStore.businessId, parsed.data);
      setOwnerName(parsed.data);
      setPage("home");
    } catch {
      setOwnerNameError("Your name couldn't be saved. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveReorderLevel = async () => {
    const parsed = parseNumberInput(reorderDraft);
    if (typeof parsed !== "number" || !Number.isSafeInteger(parsed) || parsed < 0) {
      setReorderError("Enter a whole number of 0 or more.");
      return;
    }
    const value = parsed;
    setSaving(true);
    setReorderError("");
    try {
      await saveInventoryProductDefaults(db, ownerStore, { ...productDefaults, defaultReorderLevel: value });
      setProductDefaults((current) => ({ ...current, defaultReorderLevel: value }));
      setPage("home");
    } catch {
      setReorderError("Default reorder settings couldn't be saved. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveDefaultUnit = async (value: string) => {
    setSaving(true);
    setFormError("");
    try {
      await saveInventoryProductDefaults(db, ownerStore, { ...productDefaults, defaultUnit: value });
      setProductDefaults((current) => ({ ...current, defaultUnit: value }));
      setPage("home");
    } catch {
      setFormError("Default unit couldn't be saved. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveTheme = async (value: ThemePreference) => {
    setFormError("");
    try {
      await setColorScheme(value);
    } catch {
      setFormError("Appearance preference couldn't be saved. Try again.");
    }
  };

  const saveSecurityPin = async () => {
    if (securityPin && currentPin !== securityPin) {
      setSecurityError("Your current PIN is incorrect.");
      return;
    }
    if (!isValidPin(newPin)) {
      setSecurityError("Use a PIN with 4 to 6 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setSecurityError("PINs do not match.");
      return;
    }

    setSecuritySaving(true);
    setSecurityError("");
    try {
      await saveAppPin(db, newPin);
      setSecurityPin(newPin);
      onPinChanged(newPin);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      setPage("home");
    } catch {
      setSecurityError("Your PIN couldn't be saved. Please try again.");
    } finally {
      setSecuritySaving(false);
    }
  };

  const refreshStorage = async () => {
    try {
      setStorage(await getStorageUsage(db));
    } catch {
      setStorage(null);
    }
  };

  const startBackup = async () => {
    setBackupStatus("preparing");
    setBackupError("");
    setRestoreMessage("");
    try {
      const created = await createBackup(db);
      setBackupResult(created);
      setLastBackup(created);
      setBackupFiles((files) => [created, ...files.filter((file) => file.name !== created.name)]);
      await refreshStorage();
    } catch {
      setBackupError("Backup couldn't be created. Your current inventory data is unchanged.");
    } finally {
      setBackupStatus(null);
    }
  };

  const saveBackup = async () => {
    if (!backupResult) return;
    setBackupStatus("saving");
    setBackupError("");
    try {
      await saveBackupToDevice(backupResult);
      setBackupError("");
    } catch {
      setBackupError("Backup couldn't be saved. Choose a location and try again.");
    } finally {
      setBackupStatus(null);
    }
  };

  const shareCreatedBackup = async () => {
    if (!backupResult) return;
    setBackupStatus("sharing");
    setBackupError("");
    try {
      await shareBackup(backupResult);
    } catch {
      setBackupError("Backup couldn't be shared. Try again.");
    } finally {
      setBackupStatus(null);
    }
  };

  const prepareRestore = async (name: string, bytes: Uint8Array, createdAt: number | null) => {
    setBackupStatus("checking");
    setBackupError("");
    setRestoreError("");
    try {
      const summary = await inspectBackup(db, bytes);
      setRestoreCandidate({ name, bytes, summary, createdAt });
      setRestoreDialogVisible(true);
    } catch {
      setBackupError("Backup couldn't be restored. The selected file may be invalid or unsupported.");
    } finally {
      setBackupStatus(null);
    }
  };

  const chooseBackupFile = async () => {
    setBackupError("");
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const bytes = await readBackupFile(asset.uri, asset.file);
      await prepareRestore(asset.name, bytes, backupDateFromName(asset.name));
    } catch {
      setBackupError("Backup couldn't be restored. The selected file may be invalid or unsupported.");
    }
  };

  const prepareLocalRestore = async (backup: LocalBackupFile) => {
    if (!backup.uri && !backup.bytes) return;
    try {
      const bytes = backup.bytes ?? await readBackupFile(backup.uri as string);
      await prepareRestore(backup.name, bytes, backup.createdAt || backupDateFromName(backup.name));
    } catch {
      setBackupError("Backup couldn't be opened. Choose another backup file.");
    }
  };

  const confirmRestore = async () => {
    if (!restoreCandidate) return;
    setRestoreBusy(true);
    setRestoreError("");
    try {
      await restoreBackup(db, restoreCandidate.bytes);
      setRestoreDialogVisible(false);
      setRestoreMessage("Backup restored.");
      setRestoreCandidate(null);
      void onRestoreComplete().catch(() => undefined);
      void getThemePreference(db).then((restoredPreference) => setColorScheme(restoredPreference)).catch(() => undefined);
      await refreshStorage();
      const files = await listLocalBackups().catch(() => []);
      setBackupFiles(files);
      setLastBackup(files[0] ?? null);
    } catch {
      setRestoreError("Backup couldn't be restored. Your current inventory data is unchanged.");
    } finally {
      setRestoreBusy(false);
    }
  };

  const confirmDeleteStore = async () => {
    setDeleteStoreBusy(true);
    setDeleteStoreError("");
    try {
      await onDeleteStore();
    } catch {
      setDeleteStoreError("Store couldn't be deleted. Your store data is unchanged.");
      setDeleteStoreBusy(false);
    }
  };

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
    appearance: "Appearance",
    security: "Security",
    terms: legalPages.terms.title,
    privacy: legalPages.privacy.title,
    faq: legalPages.faq.title,
    rules: legalPages.rules.title,
    backup: "Backup & Restore",
    storage: "Storage Usage",
    premium: "StockPilot Premium",
    "restore-purchase": "Restore Purchase",
    about: "About StockPilot",
  };

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
          <Text style={styles.pageSubtitle}>Manage your StockPilot preferences and local data.</Text>
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

  const homeContent = (
    <>
      <SettingsGroup label="Personal">
        <SettingsRow icon={UserRound} title="Your Name" value={ownerStore.ownerName} onPress={() => setPage("owner-name")} />
      </SettingsGroup>
      <SettingsGroup label="Store">
        <SettingsRow icon={Store} title="Manage Stores" description="Add, edit, archive, or switch stores" onPress={onOpenStoreManagement} />
        <SettingsRow icon={Store} title="Current Store" value={ownerStore.storeName} onPress={() => setPage("current-store")} />
        <SettingsRow icon={SlidersHorizontal} title="Edit Store" description="Edit name, type, currency and address" onPress={() => setPage("store-preferences")} />
        <SettingsRow
          icon={Trash2}
          title="Delete Store"
          description="Permanently delete this store and its inventory"
          destructive
          onPress={() => {
            setDeleteStoreError("");
            setDeleteStoreDialogVisible(true);
          }}
        />
      </SettingsGroup>
      <SettingsGroup label="Inventory">
        <SettingsRow icon={Package} title="Stock Preferences" description="Stock rules and defaults" onPress={() => setPage("stock-preferences")} />
        <SettingsRow icon={CircleAlert} title="Default Reorder Settings" value={productDefaults.defaultReorderLevel + " units"} onPress={() => setPage("reorder")} />
        <SettingsRow icon={Ruler} title="Default Unit" value={getUnitLabel(productDefaults.defaultUnit)} onPress={() => setPage("unit")} />
      </SettingsGroup>
      <SettingsGroup label="Appearance">
        <SettingsRow icon={Moon} title="Theme" value={themeLabels[preference]} onPress={() => setPage("appearance")} />
      </SettingsGroup>
      <SettingsGroup label="Security">
        <SettingsRow
          icon={ShieldCheck}
          title="Security"
          value={securityPin === undefined ? "Loading…" : securityPin ? "PIN enabled" : "Set up PIN"}
          onPress={() => {
            setSecurityError("");
            setPage("security");
          }}
        />
      </SettingsGroup>
      <SettingsGroup label="Legal & Help">
        <SettingsRow icon={FileText} title={legalPages.terms.title} onPress={() => setPage("terms")} />
        <SettingsRow icon={ShieldCheck} title={legalPages.privacy.title} onPress={() => setPage("privacy")} />
        <SettingsRow icon={Info} title={legalPages.faq.title} onPress={() => setPage("faq")} />
        <SettingsRow icon={CircleAlert} title={legalPages.rules.title} onPress={() => setPage("rules")} />
      </SettingsGroup>
      <SettingsGroup label="Data & Storage">
        <SettingsRow icon={Database} title="Backup & Restore" description="Manage local backup files" onPress={() => setPage("backup")} />
        <SettingsRow icon={Upload} title="Import Inventory" description="Import inventory from CSV" onPress={() => onOpenInventoryAction("import")} />
        <SettingsRow icon={Download} title="Export Inventory" description="Export store data as CSV" onPress={() => onOpenInventoryAction("export")} />
        <SettingsRow icon={HardDrive} title="Storage Usage" value={storage ? formatBytes(storage.totalBytes) : "Loading…"} onPress={() => setPage("storage")} />
      </SettingsGroup>
      <View style={styles.infoNote}>
        <Text style={styles.infoText}>Your StockPilot inventory is stored locally on this device.</Text>
      </View>
      <SettingsGroup label="Purchase">
        <SettingsRow icon={BadgeCheck} title="StockPilot Premium" description="Lifetime access · one-time purchase" onPress={() => setPage("premium")} />
        <SettingsRow icon={RefreshCw} title="Restore Purchase" onPress={() => setPage("restore-purchase")} />
      </SettingsGroup>
      <SettingsGroup label="Application">
        <SettingsRow icon={Info} title="About StockPilot" onPress={() => setPage("about")} />
        <SettingsRow icon={FileText} title="App Version" value={version} />
      </SettingsGroup>
    </>
  );

  const ownerNameContent = (
    <View style={styles.form}>
      <Text style={styles.infoText}>This name is used to personalize StockPilot on this device.</Text>
      <Field
        label="Your Name"
        value={ownerName}
        onChangeText={(value) => {
          setOwnerName(value);
          setOwnerNameError("");
        }}
        autoCapitalize="words"
        error={ownerNameError}
      />
      <Button title="Save Changes" loading={saving} onPress={() => void saveOwnerName()} />
    </View>
  );

  const storePreferencesContent = storeDetailsLoading ? (
    <View style={styles.busyRow}><ActivityIndicator color={colors.primary[600]} /><Text style={styles.busyText}>Loading store preferences…</Text></View>
  ) : !storeDetails ? (
    <View style={styles.infoNote}><Text style={styles.infoText}>Store preferences couldn't be loaded. Open Store Management and try again.</Text></View>
  ) : (
    <>
      <Text style={styles.infoText}>{storeDetails.name}</Text>
      <SettingsGroup label="Store Details">
        <SettingsRow icon={Store} title="Store Name" value={storeDetails.name} onPress={() => setPage("store-name")} />
        <SettingsRow icon={Store} title="Store Type" value={getStoreTypeLabel(storeDetails.storeType)} onPress={() => setPage("store-type")} />
        <SettingsRow icon={ReceiptText} title="Currency" value={getCurrencyLabel(storeForm)} onPress={() => setPage("currency")} />
        <SettingsRow icon={MapPin} title="Address" value={storeDetails.city || storeDetails.addressLine1 || "Optional"} onPress={() => setPage("store-address")} />
      </SettingsGroup>
    </>
  );

  const storeNameContent = (
    <View style={styles.form}>
      <Text style={styles.infoText}>Update the name used for this store throughout StockPilot.</Text>
      <Field
        label="Store Name"
        value={storeForm.name ?? ""}
        onChangeText={(value) => updateStoreField("name", value)}
        placeholder="e.g. Main Store"
        autoCapitalize="words"
        error={storeErrors.name}
      />
      {formError ? <Text accessibilityRole="alert" style={styles.error}>{formError}</Text> : null}
      <Button title="Save Changes" loading={saving} onPress={() => void saveStoreForm()} />
    </View>
  );

  const storeTypeContent = (
    <View style={styles.form}>
      <Text style={styles.infoText}>Choose a store type already supported by StockPilot.</Text>
      <SettingsGroup label="Store Type">
        {storeTypeOptions.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: storeForm.storeType === option.value }}
            onPress={() => updateStoreField("storeType", option.value)}
            style={({ pressed }) => [styles.radioRow, pressed && styles.rowPressed]}
          >
            <Store color={colors.text.muted} size={20} strokeWidth={1.8} />
            <Text style={styles.radioLabel}>{option.label}</Text>
            <View style={[styles.radio, storeForm.storeType === option.value && styles.radioSelected]}>
              {storeForm.storeType === option.value ? <Check color={colors.text.onPrimary} size={14} strokeWidth={2.5} /> : null}
            </View>
          </Pressable>
        ))}
      </SettingsGroup>
      {storeForm.storeType === "other" ? (
        <Field
          label="Describe your store type"
          value={storeForm.customStoreType ?? ""}
          onChangeText={(value) => updateStoreField("customStoreType", value)}
          error={storeErrors.customStoreType}
        />
      ) : null}
      {formError ? <Text accessibilityRole="alert" style={styles.error}>{formError}</Text> : null}
      <Button title="Save Changes" loading={saving} onPress={() => void saveStoreForm()} />
    </View>
  );

  const currencyContent = (
    <View style={styles.form}>
      <SettingsGroup label="Currency Type">
        {currencyModeOptions.map((option) => (
          <RadioRow
            key={option.value}
            label={option.label}
            selected={(storeForm.currencyMode ?? "iso") === option.value}
            onPress={() => updateStoreField("currencyMode", option.value)}
          />
        ))}
      </SettingsGroup>
      {storeForm.currencyMode !== "custom" ? (
        <>
          <Field
            label="Search currencies"
            value={currencySearch}
            onChangeText={setCurrencySearch}
            placeholder="Search name, code or symbol"
            autoCapitalize="none"
          />
          <SettingsGroup label="Currency">
            <ScrollView style={{ maxHeight: 320 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {currencyMatches.map((option) => (
                <RadioRow
                  key={option.value}
                  label={currencyOptionLabel(option.value, option.label)}
                  selected={(storeForm.currencyCode ?? "PHP").toUpperCase() === option.value}
                  onPress={() => updateStoreField("currencyCode", option.value)}
                />
              ))}
              {!currencyMatches.length ? <Text style={[styles.infoText, { padding: spacing[3] }]}>No matching currencies.</Text> : null}
            </ScrollView>
          </SettingsGroup>
        </>
      ) : (
        <>
          <Field
            label="Currency Name"
            value={storeForm.customCurrencyName ?? ""}
            onChangeText={(value) => updateStoreField("customCurrencyName", value)}
            placeholder="e.g. Credits"
            autoCapitalize="words"
            error={storeErrors.customCurrencyName}
          />
          <Field
            label="Symbol"
            value={storeForm.customCurrencySymbol ?? ""}
            onChangeText={(value) => updateStoreField("customCurrencySymbol", value)}
            placeholder="e.g. ¤"
            autoCapitalize="none"
            error={storeErrors.customCurrencySymbol}
          />
        </>
      )}
      <SettingsGroup label="Decimal Places">
        {decimalPlaceOptions.map((value) => (
          <RadioRow
            key={value}
            label={String(value)}
            selected={(storeForm.currencyDecimalPlaces ?? 2) === value}
            onPress={() => updateStoreField("currencyDecimalPlaces", value)}
          />
        ))}
      </SettingsGroup>
      {formError ? <Text accessibilityRole="alert" style={styles.error}>{formError}</Text> : null}
      <Button title="Save Changes" loading={saving} onPress={() => void saveStoreForm()} />
    </View>
  );

  const addressContent = (
    <View style={styles.form}>
      <Text style={styles.infoText}>Address details are optional.</Text>
      <Field label="Address Line 1" value={storeForm.addressLine1 ?? ""} onChangeText={(value) => updateStoreField("addressLine1", value)} error={storeErrors.addressLine1} />
      <Field label="Address Line 2" value={storeForm.addressLine2 ?? ""} onChangeText={(value) => updateStoreField("addressLine2", value)} error={storeErrors.addressLine2} />
      <Field label="Barangay" value={storeForm.barangay ?? ""} onChangeText={(value) => updateStoreField("barangay", value)} error={storeErrors.barangay} />
      <Field label="City" value={storeForm.city ?? ""} onChangeText={(value) => updateStoreField("city", value)} error={storeErrors.city} />
      <Field label="Province / State" value={storeForm.provinceState ?? ""} onChangeText={(value) => updateStoreField("provinceState", value)} error={storeErrors.provinceState} />
      <Field label="Postal Code" value={storeForm.postalCode ?? ""} onChangeText={(value) => updateStoreField("postalCode", value)} error={storeErrors.postalCode} />
      <Field
        label="Country Code"
        value={storeForm.countryCode ?? ""}
        onChangeText={(value) => updateStoreField("countryCode", value)}
        placeholder="PH"
        autoCapitalize="characters"
        help={countryCodeOptions.find((option) => option.value === storeForm.countryCode)?.label}
        error={storeErrors.countryCode}
      />
      {formError ? <Text accessibilityRole="alert" style={styles.error}>{formError}</Text> : null}
      <Button title="Save Changes" loading={saving} onPress={() => void saveStoreForm()} />
    </View>
  );

  const stockPreferencesContent = (
    <>
      <SettingsGroup label="Stock Rules">
        <SettingsRow icon={CircleAlert} title="Critical Stock" value="Zero quantity" />
        <SettingsRow icon={Package} title="Low Stock" value="At or below reorder level" />
        <SettingsRow icon={CircleCheck} title="Zero Stock" value="Allowed" />
        <SettingsRow icon={CircleAlert} title="Negative Stock" value="Never allowed" />
      </SettingsGroup>
      <View style={styles.infoNote}>
        <Text style={styles.infoText}>Stock quantities cannot be reduced below zero. Reorder defaults apply only to new products.</Text>
      </View>
    </>
  );

  const reorderContent = (
    <View style={styles.form}>
      <Text style={styles.infoText}>Uses each product's unit as the initial reorder level for new products. Each product can be changed individually later. Existing products won't be changed.</Text>
      <Field
        label="Default Reorder Level"
        value={reorderDraft}
        onChangeText={(value) => {
          setReorderDraft(value);
          setReorderError("");
        }}
        keyboardType="number-pad"
        error={reorderError}
      />
      <Button title="Save Changes" loading={saving} onPress={() => void saveReorderLevel()} />
    </View>
  );

  const unitOptions = productDefaults.defaultUnit && !productUnitOptions.some((option) => option.value === productDefaults.defaultUnit)
    ? [...productUnitOptions, { value: productDefaults.defaultUnit, label: productDefaults.defaultUnit }]
    : productUnitOptions;
  const unitContent = (
    <>
      <Text style={styles.infoText}>Used as the initial unit for new products. Each product can be changed individually later.</Text>
      <SettingsGroup label="Unit">
        {unitOptions.map((option) => (
          <RadioRow
            key={option.value}
            label={option.label}
            selected={productDefaults.defaultUnit === option.value}
            onPress={() => void saveDefaultUnit(option.value)}
          />
        ))}
      </SettingsGroup>
      {saving ? <View style={styles.busyRow}><ActivityIndicator color={colors.primary[600]} /><Text style={styles.busyText}>Saving default unit…</Text></View> : null}
      {formError ? <Text accessibilityRole="alert" style={styles.error}>{formError}</Text> : null}
    </>
  );

  const appearanceContent = (
    <>
      <SettingsGroup label="Theme">
        <RadioRow label="Light" selected={preference === "light"} onPress={() => void saveTheme("light")} />
        <RadioRow label="Dark" selected={preference === "dark"} onPress={() => void saveTheme("dark")} />
        <RadioRow label="System" description="Follows your device appearance" selected={preference === "system"} onPress={() => void saveTheme("system")} />
      </SettingsGroup>
      {formError ? <Text accessibilityRole="alert" style={styles.error}>{formError}</Text> : null}
    </>
  );

  const securityContent = securityPin === undefined ? (
    <View style={styles.busyRow}>
      {securityLoadError ? (
        <Text accessibilityRole="alert" style={styles.error}>Security settings couldn't be loaded. Try again.</Text>
      ) : (
        <>
          <ActivityIndicator color={colors.primary[600]} />
          <Text style={styles.busyText}>Loading security settings…</Text>
        </>
      )}
    </View>
  ) : (
    <View style={styles.form}>
      <Text style={styles.infoText}>
        Your PIN is required when reopening StockPilot or after using Exit.
      </Text>
      {securityPin ? (
        <Field
          label="Current PIN"
          value={currentPin}
          onChangeText={(value) => {
            setCurrentPin(value.replace(/\D/g, "").slice(0, 6));
            setSecurityError("");
          }}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
        />
      ) : null}
      <Field
        label={securityPin ? "New PIN" : "Create PIN"}
        value={newPin}
        onChangeText={(value) => {
          setNewPin(value.replace(/\D/g, "").slice(0, 6));
          setSecurityError("");
        }}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
      />
      <Field
        label="Confirm PIN"
        value={confirmPin}
        onChangeText={(value) => {
          setConfirmPin(value.replace(/\D/g, "").slice(0, 6));
          setSecurityError("");
        }}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={6}
      />
      {securityError ? <Text accessibilityRole="alert" style={styles.error}>{securityError}</Text> : null}
      <Button
        title={securityPin ? "Change PIN" : "Create PIN"}
        loading={securitySaving}
        onPress={() => void saveSecurityPin()}
      />
    </View>
  );

  const legalContent = (pageKey: LegalPage) => {
    const content = legalPages[pageKey];
    return (
      <View style={styles.form}>
        <Text style={styles.infoText}>{content.intro}</Text>
        {content.sections.map((section) => (
          <View key={section.heading} style={styles.infoNote}>
            <Text style={styles.rowTitle}>{section.heading}</Text>
            <Text style={styles.infoText}>{section.body}</Text>
          </View>
        ))}
      </View>
    );
  };

  const backupContent = backupResult ? (
    <View style={styles.form}>
      <View style={styles.statusCard}>
        <CircleCheck color={colors.semantic.success} size={32} />
        <Text style={styles.statusTitle}>Backup Created</Text>
        <Text style={styles.filename}>{backupResult.name}</Text>
        <Text style={styles.statusCopy}>{formatBytes(backupResult.size)} · This device</Text>
      </View>
      <Button title="Save to Device" icon={Save} loading={backupBusy} onPress={() => void saveBackup()} />
      {shareAvailable ? <Button title="Share File" icon={Share2} variant="secondary" loading={backupBusy} onPress={() => void shareCreatedBackup()} /> : null}
      <Button title="Done" variant="ghost" onPress={() => setBackupResult(null)} />
      {backupError ? <Text accessibilityRole="alert" style={styles.error}>{backupError}</Text> : null}
    </View>
  ) : (
    <>
      <SettingsGroup label="Last Backup">
        <SettingsRow
          icon={Clock3}
          title={lastBackup ? formatDateTime(lastBackup.createdAt) : "No backups yet"}
          description={lastBackup ? "This device" : "Create a local backup to keep a portable copy of your StockPilot data."}
        />
      </SettingsGroup>
      {backupFiles.length ? (
        <SettingsGroup label="Saved on This Device">
          {backupFiles.map((backup) => (
            <SettingsRow
              key={backup.name}
              icon={Database}
              title={backup.name}
              description={formatBytes(backup.size)}
              onPress={() => void prepareLocalRestore(backup)}
            />
          ))}
        </SettingsGroup>
      ) : null}
      <Button title="Create Backup" loading={backupBusy} onPress={() => void startBackup()} />
      <SettingsGroup label="Restore Backup">
        <SettingsRow icon={RefreshCw} title="Choose Backup File" description="Restore inventory from a StockPilot backup file." onPress={() => void chooseBackupFile()} />
      </SettingsGroup>
      {backupStatus ? (
        <View style={styles.busyRow}>
          <ActivityIndicator color={colors.primary[600]} />
          <Text style={styles.busyText}>{backupStatus === "preparing" ? "Preparing Backup" : backupStatus === "checking" ? "Checking Backup File" : backupStatus === "saving" ? "Saving Backup" : "Opening Share Sheet"}</Text>
        </View>
      ) : null}
      {backupError ? <Text accessibilityRole="alert" style={styles.error}>{backupError}</Text> : null}
      {restoreError ? <Text accessibilityRole="alert" style={styles.error}>{restoreError}</Text> : null}
      {restoreMessage ? <View style={styles.infoNote}><Text style={styles.infoText}>{restoreMessage}</Text></View> : null}
    </>
  );

  const storageContent = (
    <>
      <SettingsGroup label="StockPilot Data">
        <SettingsRow icon={Database} title="Database" value={storage ? formatBytes(storage.databaseBytes) : "Unavailable"} />
        <SettingsRow
          icon={FileText}
          title="Backups"
          value={storage
            ? formatBytes(storage.backupBytes) + " · " + storage.backupCount + (storage.backupCount === 1 ? " local backup" : " local backups")
            : "Unavailable"}
        />
        <SettingsRow icon={HardDrive} title="Total" value={storage ? formatBytes(storage.totalBytes) : "Unavailable"} />
      </SettingsGroup>
      <Button title="Manage Backups" variant="secondary" onPress={() => setPage("backup")} />
    </>
  );

  const premiumContent = (
    <View style={styles.form}>
      <View style={styles.statusCard}>
        <View style={styles.brandMark}><BadgeCheck color={colors.primary[600]} size={30} /></View>
        <Text style={styles.statusTitle}>Lifetime Access</Text>
        <Text style={styles.statusCopy}>One-time purchase.</Text>
      </View>
      <View style={styles.infoNote}>
        <Text style={styles.infoText}>Purchase service isn't available in this build.</Text>
      </View>
      <Button title="Get Lifetime Access" disabled />
    </View>
  );

  const restorePurchaseContent = (
    <View style={styles.form}>
      <View style={styles.statusCard}>
        <RefreshCw color={colors.text.muted} size={30} />
        <Text style={styles.statusTitle}>Restore Purchase</Text>
        <Text style={styles.statusCopy}>Restore a previous StockPilot lifetime purchase through the existing store platform.</Text>
      </View>
      <Text style={styles.infoText}>Purchase verification isn't available in this build.</Text>
      <Button title="Restore Purchase" disabled />
    </View>
  );

  const aboutContent = (
    <>
      <View style={styles.statusCard}>
        <Image accessible={false} source={require("../../../assets/app-icon.png")} resizeMode="cover" style={styles.brandMark} />
        <Text style={styles.statusTitle}>StockPilot</Text>
        <Text style={styles.tagline}>Smarter Inventory. Less Worry.</Text>
        <Text style={styles.statusCopy}>StockPilot helps small businesses track products, monitor stock levels, and keep everyday inventory work in one place.</Text>
      </View>
      <SettingsGroup label="Application">
        <SettingsRow icon={FileText} title="Version" value={version} />
        <SettingsRow icon={Info} title="Build" value={String(build)} />
      </SettingsGroup>
    </>
  );

  const pageContent: Partial<Record<Page, ReactNode>> = {
    home: homeContent,
    "owner-name": ownerNameContent,
    "store-preferences": storePreferencesContent,
    "store-name": storeNameContent,
    "store-type": storeTypeContent,
    currency: currencyContent,
    "store-address": addressContent,
    "current-store": (
      <View style={styles.form}>
        <Text style={styles.infoText}>Choose which store StockPilot is showing.</Text>
        <StoreSelector
          ownerStore={ownerStore}
          ownerStores={ownerStores}
          onSelectStore={async (store) => {
            await onSelectStore(store);
            setPage("home");
          }}
          onCreateStore={onCreateStore}
          showAddStoreButton
          openOnMount
        />
      </View>
    ),
    "stock-preferences": stockPreferencesContent,
    reorder: reorderContent,
    unit: unitContent,
    appearance: appearanceContent,
    security: securityContent,
    terms: legalContent("terms"),
    privacy: legalContent("privacy"),
    faq: legalContent("faq"),
    rules: legalContent("rules"),
    backup: backupContent,
    storage: storageContent,
    premium: premiumContent,
    "restore-purchase": restorePurchaseContent,
    about: aboutContent,
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.content, page === "home" && styles.homeContent]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {header}
          {pageContent[page]}
        </ScrollView>
        <BottomNavigation
          activeKey={null}
          onChange={onNavigate}
        />
      </View>
      <Modal
        visible={restoreDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!restoreBusy) {
            setRestoreDialogVisible(false);
            setRestoreCandidate(null);
          }
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Restore Backup?</Text>
            <Text style={styles.dialogCopy}>This backup may replace your current StockPilot data.</Text>
            {restoreCandidate ? (
              <View style={styles.form}>
                <Text style={styles.filename}>{restoreCandidate.name}</Text>
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Backup Date</Text><Text style={styles.summaryValue}>{formatDateTime(restoreCandidate.createdAt)}</Text></View>
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Stores</Text><Text style={styles.summaryValue}>{restoreCandidate.summary.storeCount}</Text></View>
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Products</Text><Text style={styles.summaryValue}>{restoreCandidate.summary.productCount}</Text></View>
                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Stock Movements</Text><Text style={styles.summaryValue}>{restoreCandidate.summary.movementCount.toLocaleString()}</Text></View>
              </View>
            ) : null}
            {restoreError ? <Text accessibilityRole="alert" style={styles.error}>{restoreError}</Text> : null}
            <View style={styles.dialogActions}>
              <Button
                title="Cancel"
                variant="secondary"
                disabled={restoreBusy}
                onPress={() => {
                  setRestoreDialogVisible(false);
                  setRestoreCandidate(null);
                }}
                style={styles.dialogButton}
              />
              <Button
                title="Restore Backup"
                variant="danger"
                loading={restoreBusy}
                onPress={() => void confirmRestore()}
                style={styles.dialogButton}
              />
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={deleteStoreDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleteStoreBusy) setDeleteStoreDialogVisible(false);
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Delete {ownerStore.storeName}?</Text>
            <Text style={styles.dialogCopy}>This permanently deletes the store, its products, stock levels, and movement history.</Text>
            {deleteStoreError ? <Text accessibilityRole="alert" style={styles.error}>{deleteStoreError}</Text> : null}
            <View style={styles.dialogActions}>
              <Button
                title="Cancel"
                variant="secondary"
                disabled={deleteStoreBusy}
                onPress={() => {
                  setDeleteStoreDialogVisible(false);
                  setDeleteStoreError("");
                }}
                style={styles.dialogButton}
              />
              <Button
                title="Delete Store"
                variant="danger"
                loading={deleteStoreBusy}
                onPress={() => void confirmDeleteStore()}
                style={styles.dialogButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export { SettingsGroup, SettingsRow };
