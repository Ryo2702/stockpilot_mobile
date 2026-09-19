import { useState } from "react";

import { initialStoreForm } from "@/components/store/store.data";
import type { StoreErrors, StoreFieldChange, StoreForm } from "@/components/store/store.types";
import type { OwnerStore } from "@/services/owner-store.service";
import { storeSchema } from "@/validation/store.validation";

import type { SelectorView, StoreSelectorProps } from "../types";

export default function useStoreSelector({
  ownerStore,
  ownerStores,
  onSelectStore,
  onCreateStore,
}: StoreSelectorProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<SelectorView>("list");
  const [storeForm, setStoreForm] = useState<StoreForm>({ ...initialStoreForm });
  const [storeErrors, setStoreErrors] = useState<StoreErrors>({});
  const [saving, setSaving] = useState(false);
  const [switchingStoreId, setSwitchingStoreId] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState("");
  const stores = [
    ownerStore,
    ...(ownerStores ?? []).filter(
      (store) =>
        store.storeId !== ownerStore.storeId || store.businessId !== ownerStore.businessId,
    ),
  ];

  const resetCreateForm = () => {
    setStoreForm({ ...initialStoreForm });
    setStoreErrors({});
  };

  const toggle = () => {
    setOpen((current) => !current);
    setView("list");
    setSwitchError("");
    resetCreateForm();
  };

  const close = () => {
    setOpen(false);
    setView("list");
    setSwitchError("");
    resetCreateForm();
  };

  const dismiss = () => {
    setOpen(false);
    setView("list");
    resetCreateForm();
  };

  const openCreate = () => {
    resetCreateForm();
    setView("create");
    setOpen(true);
  };

  const showList = () => {
    setView("list");
    resetCreateForm();
  };

  const selectStore = async (store: OwnerStore) => {
    if (switchingStoreId) return;
    const isSwitch =
      store.storeId !== ownerStore.storeId || store.businessId !== ownerStore.businessId;
    if (!isSwitch) {
      close();
      return;
    }
    if (!onSelectStore) {
      setSwitchError("Store switching is unavailable. Please try again.");
      return;
    }

    setSwitchError("");
    setSwitchingStoreId(store.storeId);
    try {
      await onSelectStore(store);
      close();
    } catch {
      setSwitchError("Couldn't switch stores. Please try again.");
      setOpen(true);
    } finally {
      setSwitchingStoreId(null);
    }
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

  const createStore = async () => {
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

    if (!onCreateStore) return;

    setSaving(true);
    setStoreErrors({});
    try {
      const store = await onCreateStore(result.data);
      resetCreateForm();
      setView("list");
      await selectStore(store);
    } catch {
      setStoreErrors({ form: "Couldn't create your store. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return {
    open,
    view,
    stores,
    storeForm,
    storeErrors,
    saving,
    switchingStoreId,
    switchError,
    toggle,
    close,
    dismiss,
    openCreate,
    showList,
    selectStore,
    updateStoreField,
    createStore,
  };
}

export type StoreSelectorController = ReturnType<typeof useStoreSelector>;
