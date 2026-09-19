import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";

import {
  getOwnerStoreDetails,
  getOwnerStoreOverview,
  type OwnerStore,
  type OwnerStoreDetails,
  type OwnerStoreOverview,
} from "@/services/owner-store.service";
import { storeSchema, type StoreInput } from "@/validation/store.validation";

import { initialStoreForm } from "../store.data";
import type { StoreErrors, StoreFieldChange, StoreForm } from "../store.types";

function toStoreForm(store: OwnerStoreDetails): StoreForm {
  return {
    ...initialStoreForm,
    name: store.name,
    code: store.code ?? "",
    storeType: store.storeType,
    customStoreType: store.customStoreType ?? "",
    currencyMode: store.currencyMode,
    currencyCode: store.currencyCode ?? "",
    customCurrencyName: store.customCurrencyName ?? "",
    customCurrencySymbol: store.customCurrencySymbol ?? "",
    currencyDecimalPlaces: store.currencyDecimalPlaces,
    addressLine1: store.addressLine1 ?? "",
    addressLine2: store.addressLine2 ?? "",
    barangay: store.barangay ?? "",
    city: store.city ?? "",
    provinceState: store.provinceState ?? "",
    postalCode: store.postalCode ?? "",
    countryCode: store.countryCode ?? "",
    status: store.status,
  };
}

export default function useOwnerStoreScreen(
  ownerStore: OwnerStore,
  onUpdateStore?: (store: StoreInput) => Promise<OwnerStoreDetails>,
) {
  const db = useSQLiteContext();
  const [overview, setOverview] = useState<OwnerStoreOverview | null>(null);
  const [storeDetails, setStoreDetails] = useState<OwnerStoreDetails | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [storeForm, setStoreForm] = useState<StoreForm>({ ...initialStoreForm });
  const [storeErrors, setStoreErrors] = useState<StoreErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    setOverview(null);
    setStoreDetails(null);
    setEditOpen(false);

    Promise.all([
      getOwnerStoreOverview(db, ownerStore.businessId, ownerStore.storeId),
      getOwnerStoreDetails(db, ownerStore.businessId, ownerStore.storeId),
    ])
      .then(([nextOverview, details]) => {
        if (active) {
          setOverview(nextOverview);
          setStoreDetails(details);
        }
      })
      .catch(() => {
        if (active) {
          setOverview(null);
          setStoreDetails(null);
        }
      });

    return () => {
      active = false;
    };
  }, [db, ownerStore.businessId, ownerStore.storeId]);

  const openEdit = () => {
    if (!storeDetails) return;
    setStoreForm(toStoreForm(storeDetails));
    setStoreErrors({});
    setEditOpen(true);
    setMenuOpen(false);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setStoreErrors({});
  };

  const updateStoreField: StoreFieldChange = (field, value) => {
    setStoreForm((current) => ({ ...current, [field]: value }));
    setStoreErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const saveStore = async () => {
    const result = storeSchema.safeParse(storeForm);
    if (!result.success) {
      const errors: StoreErrors = {};
      for (const issue of result.error.issues) {
        const key = (issue.path.join(".") || "form") as keyof StoreErrors;
        errors[key] = issue.message;
      }
      setStoreErrors(errors);
      return;
    }
    if (!onUpdateStore) return;

    setSaving(true);
    setStoreErrors({});
    try {
      const updatedStore = await onUpdateStore(result.data);
      setStoreDetails(updatedStore);
      setEditOpen(false);
    } catch {
      setStoreErrors({
        form: "Couldn't update the store. Check that its name and code are unique.",
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    overview,
    storeDetails,
    menuOpen,
    openMenu: () => setMenuOpen(true),
    closeMenu: () => setMenuOpen(false),
    editOpen,
    openEdit,
    closeEdit,
    storeForm,
    storeErrors,
    saving,
    updateStoreField,
    saveStore,
  };
}
