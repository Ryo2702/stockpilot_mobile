import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useMemo, useState } from "react";

import {
  currencyOptions,
  toStoreForm,
} from "@/components/store/store.data";
import type { StoreErrors, StoreForm } from "@/components/store/store.types";
import { type BottomNavKey } from "@/components/ui/BottomNavigation";
import type { LegalPage } from "@/data/legal.data";
import type { BackupSummary } from "@/services/backup.service";
import useAsyncEffect from "@/hooks/useAsyncEffect";
import {
  getInventoryProductDefaults,
  saveInventoryProductDefaults,
} from "@/services/inventory";
import {
  getOwnerStoreDetails,
  type OwnerStore,
  type OwnerStoreDetails,
} from "@/services/owner-store.service";
import type { AppSecuritySettings } from "@/services/settings.service";
import { useTheme } from "@/theme/ThemeProvider";
import type { ThemePreference } from "@/theme/tokens";
import { parseNumberInput } from "@/validation/number.validation";
import {
  ownerNameSchema,
  storeSchema,
  type StoreInput,
  type StoreSchema,
} from "@/validation/store.validation";

import useSettingsBackup from "./settings.backup";
import useSettingsSecurity from "./settings.security";
import { currencyOptionLabel } from "./settings.utils";

export type SettingsPage = "home" | "backup" | "about" | "security" | LegalPage;
export type Page =
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
  | "security-questions"
  | "free-access";

export type SettingsScreenProps = {
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
  onSecuritySettingsChanged: (settings: AppSecuritySettings) => void;
  initialPage: SettingsPage;
  onClose: () => void;
};

export type RestoreCandidate = {
  name: string;
  bytes: Uint8Array;
  summary: BackupSummary;
  createdAt: number | null;
};

export default function useSettingsScreen({
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
  onSecuritySettingsChanged,
  initialPage,
  onClose,
}: SettingsScreenProps) {
  const db = useSQLiteContext();
  const { preference, setColorScheme } = useTheme();
  const [page, setPage] = useState<Page>(initialPage);
  const [ownerName, setOwnerName] = useState(ownerStore.ownerName);
  const [ownerNameError, setOwnerNameError] = useState("");
  const [formError, setFormError] = useState("");
  const [storeDetails, setStoreDetails] = useState<OwnerStoreDetails | null>(
    null,
  );
  const [storeDetailsLoading, setStoreDetailsLoading] = useState(true);
  const [storeForm, setStoreForm] = useState<StoreForm>({});
  const [storeErrors, setStoreErrors] = useState<StoreErrors>({});
  const [saving, setSaving] = useState(false);
  const [productDefaults, setProductDefaults] = useState({
    defaultReorderLevel: 10,
    defaultUnit: "ea",
  });
  const [reorderDraft, setReorderDraft] = useState("10");
  const [reorderError, setReorderError] = useState("");
  const [deleteStoreDialogVisible, setDeleteStoreDialogVisible] =
    useState(false);
  const [deleteStoreBusy, setDeleteStoreBusy] = useState(false);
  const [deleteStoreError, setDeleteStoreError] = useState("");
  const [currencySearch, setCurrencySearch] = useState("");
  const currencyMatches = useMemo(() => {
    const query = currencySearch.trim().toLowerCase();
    if (!query) return currencyOptions;
    return currencyOptions.filter((option) =>
      (option.value + " " + currencyOptionLabel(option.value, option.label))
        .toLowerCase()
        .includes(query),
    );
  }, [currencySearch]);

  useEffect(() => {
    setOwnerName(ownerStore.ownerName);
  }, [ownerStore.businessId, ownerStore.ownerName]);

  useAsyncEffect(
    (isActive) => {
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
    },
    [db, ownerStore.businessId, ownerStore.storeId],
  );

  useAsyncEffect(
    (isActive) => {
      getInventoryProductDefaults(db, ownerStore)
        .then((defaults) => {
          if (!isActive()) return;
          setProductDefaults(defaults);
          setReorderDraft(String(defaults.defaultReorderLevel));
        })
        .catch(() => undefined);
    },
    [db, ownerStore.businessId, ownerStore.storeId],
  );

  useEffect(() => {
    if (page === "reorder")
      setReorderDraft(String(productDefaults.defaultReorderLevel));
    if (page === "currency") setCurrencySearch("");
    setFormError("");
  }, [page, productDefaults.defaultReorderLevel]);

  const security = useSettingsSecurity({
    onPinChanged,
    onSecuritySettingsChanged,
    goHome: () => setPage("home"),
    goToSecurity: () => setPage("security"),
    goToRecoveryQuestions: () => setPage("security-questions"),
  });
  const backup = useSettingsBackup({
    db,
    isBackupPage: page === "backup",
    onRestoreComplete,
    setColorScheme,
  });

  const back = () => {
    if (page === "home") {
      onClose();
      return;
    }
    if (
      page === "store-name" ||
      page === "store-type" ||
      page === "currency" ||
      page === "store-address"
    ) {
      setPage("store-preferences");
      return;
    }
    if (page === "security-questions") {
      security.resetRecovery();
      setPage("security");
      return;
    }
    if (
      (page === "backup" && initialPage === "backup") ||
      (page === "about" && initialPage === "about")
    ) {
      onClose();
      return;
    }
    setPage("home");
  };

  const updateStoreField = <K extends keyof StoreSchema>(
    field: K,
    value: StoreSchema[K],
  ) => {
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
      setOwnerNameError(
        parsed.error.issues[0]?.message ?? "Please enter your name.",
      );
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
    if (
      typeof parsed !== "number" ||
      !Number.isSafeInteger(parsed) ||
      parsed < 0
    ) {
      setReorderError("Enter a whole number of 0 or more.");
      return;
    }
    const value = parsed;
    setSaving(true);
    setReorderError("");
    try {
      await saveInventoryProductDefaults(db, ownerStore, {
        ...productDefaults,
        defaultReorderLevel: value,
      });
      setProductDefaults((current) => ({
        ...current,
        defaultReorderLevel: value,
      }));
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
      await saveInventoryProductDefaults(db, ownerStore, {
        ...productDefaults,
        defaultUnit: value,
      });
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

  const confirmDeleteStore = async () => {
    setDeleteStoreBusy(true);
    setDeleteStoreError("");
    try {
      await onDeleteStore();
    } catch {
      setDeleteStoreError(
        "Store couldn't be deleted. Your store data is unchanged.",
      );
      setDeleteStoreBusy(false);
    }
  };


  return {
    page,
    setPage,
    preference,
    ownerName,
    setOwnerName,
    ownerNameError,
    setOwnerNameError,
    formError,
    setFormError,
    storeDetails,
    storeDetailsLoading,
    storeForm,
    storeErrors,
    saving,
    productDefaults,
    reorderDraft,
    setReorderDraft,
    reorderError,
    setReorderError,
    currencySearch,
    setCurrencySearch,
    currencyMatches,
    deleteStoreDialogVisible,
    setDeleteStoreDialogVisible,
    deleteStoreBusy,
    deleteStoreError,
    setDeleteStoreError,
    back,
    updateStoreField,
    saveStoreForm,
    saveOwnerName,
    saveReorderLevel,
    saveDefaultUnit,
    saveTheme,
    ...security,
    ...backup,
    confirmDeleteStore,
  };
}

export type SettingsController = ReturnType<typeof useSettingsScreen>;
