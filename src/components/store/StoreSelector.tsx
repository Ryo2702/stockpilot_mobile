import { ArrowLeft, Check, ChevronDown, Plus, Store } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import StoreFormFields from "@/components/store/partials/StoreFormFields";
import { initialStoreForm } from "@/components/store/store.data";
import type { StoreErrors, StoreFieldChange, StoreForm } from "@/components/store/store.types";
import { Button } from "@/components/ui/Button";
import type { OwnerStore } from "@/services/owner-store.service";
import { colors, control, radii, spacing, typography } from "@/theme";
import { storeSchema, type StoreInput } from "@/validation/store.validation";

type StoreSelectorProps = {
  ownerStore: OwnerStore;
  ownerStores?: OwnerStore[];
  onSelectStore?: (store: OwnerStore) => Promise<void>;
  onCreateStore?: (store: StoreInput) => Promise<OwnerStore>;
  showAddStoreButton?: boolean;
};

type SelectorView = "list" | "create";

export default function StoreSelector({
  ownerStore,
  ownerStores,
  onSelectStore,
  onCreateStore,
  showAddStoreButton = false,
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

  return (
    <View style={[styles.container, showAddStoreButton && styles.expandedContainer]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Select store, current ${ownerStore.storeName}`}
        accessibilityState={{ expanded: open }}
        onPress={toggle}
        style={({ pressed }) => [
          styles.selector,
          showAddStoreButton && styles.expandedSelector,
          pressed && styles.pressed,
        ]}
      >
        <Store color={colors.primary[600]} size={18} strokeWidth={2} />
        <View style={styles.selectorCopy}>
          <Text style={styles.selectorLabel}>Current store</Text>
          <Text numberOfLines={1} style={styles.selectorName}>
            {ownerStore.storeName}
          </Text>
        </View>
        <ChevronDown color={colors.text.secondary} size={18} />
      </Pressable>
      {showAddStoreButton && onCreateStore ? (
        <Button
          title="Add store"
          icon={Plus}
          size="md"
          variant="secondary"
          onPress={() => {
            resetCreateForm();
            setView("create");
            setOpen(true);
          }}
          style={styles.visibleAddButton}
        />
      ) : null}

      <Modal
        visible={open}
        animationType="slide"
        onRequestClose={() => {
          setOpen(false);
          setView("list");
          resetCreateForm();
        }}
      >
        <SafeAreaView style={styles.modalSafeArea} edges={["top", "bottom"]}>
          <View style={styles.modalContent}>
            {view === "list" ? (
              <>
                <View style={styles.modalHeader}>
                  <Button
                    title="Back"
                    icon={ArrowLeft}
                    size="sm"
                    variant="ghost"
                    accessibilityLabel="Back to OwnerStoreScreen"
                    onPress={() => {
                      setOpen(false);
                      resetCreateForm();
                    }}
                    style={styles.backButton}
                  />
                  <Text style={styles.modalTitle}>Select store</Text>
                </View>
                {switchError ? (
                  <Text accessibilityRole="alert" style={styles.error}>
                    {switchError}
                  </Text>
                ) : null}
                <View style={styles.storeList}>
                  {stores.map((store) => {
                    const selected =
                      store.storeId === ownerStore.storeId &&
                      store.businessId === ownerStore.businessId;

                    return (
                      <Pressable
                        key={store.storeId}
                        accessibilityRole="menuitem"
                        accessibilityState={{ selected }}
                        disabled={Boolean(switchingStoreId)}
                        onPress={() => void selectStore(store)}
                        style={({ pressed }) => [styles.storeItem, pressed && styles.itemPressed]}
                      >
                        <Store color={selected ? colors.primary[600] : colors.text.muted} size={20} />
                        <Text style={[styles.storeItemLabel, selected && styles.storeItemLabelSelected]}>
                          {store.storeName}
                        </Text>
                        {selected ? <Check color={colors.primary[600]} size={20} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
                {onCreateStore && !showAddStoreButton ? (
                  <Button
                    title="Add store"
                    icon={Plus}
                    size="md"
                    variant="secondary"
                    onPress={() => {
                      resetCreateForm();
                      setView("create");
                    }}
                    style={styles.addButton}
                  />
                ) : null}
              </>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Button
                    title="Back"
                    icon={ArrowLeft}
                    size="sm"
                    variant="ghost"
                    accessibilityLabel="Back to store list"
                    onPress={() => {
                      setView("list");
                      resetCreateForm();
                    }}
                    style={styles.backButton}
                  />
                  <Text style={styles.modalTitle}>Add store</Text>
                </View>
                <ScrollView
                  contentContainerStyle={styles.createForm}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.createIntro}>Each store has its own setup and inventory data.</Text>
                  <StoreFormFields
                    storeForm={storeForm}
                    storeErrors={storeErrors}
                    onStoreFieldChange={updateStoreField}
                  />
                  {storeErrors.form ? <Text style={styles.error}>{storeErrors.form}</Text> : null}
                  <Button title="Create store" loading={saving} onPress={createStore} style={styles.createButton} />
                  <Button
                    title="Exit"
                    variant="ghost"
                    onPress={() => {
                      setView("list");
                      resetCreateForm();
                    }}
                    style={styles.exitButton}
                  />
                </ScrollView>
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 999,
  },
  expandedContainer: {
    width: "100%",
  },
  selector: {
    minHeight: control.md,
    maxWidth: 190,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
  },
  expandedSelector: {
    width: "100%",
    maxWidth: 420,
  },
  pressed: {
    opacity: 0.76,
  },
  selectorCopy: {
    minWidth: 0,
    flex: 1,
  },
  selectorLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  selectorName: {
    ...typography.label,
    color: colors.text.primary,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: colors.background.app,
  },
  modalContent: {
    flex: 1,
    gap: spacing[6],
    padding: spacing[4],
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  storeList: {
    gap: spacing[3],
  },
  storeItem: {
    minHeight: control.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
  },
  itemPressed: {
    backgroundColor: colors.gray[50],
  },
  storeItemLabel: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.text.secondary,
  },
  storeItemLabelSelected: {
    color: colors.primary[700],
    fontWeight: "600",
  },
  addButton: {
    alignSelf: "flex-start",
  },
  visibleAddButton: {
    width: "100%",
  },
  backButton: {
    minWidth: 0,
  },
  createForm: {
    flexGrow: 1,
    gap: spacing[4],
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
    paddingBottom: spacing[8],
  },
  createIntro: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  error: {
    ...typography.caption,
    color: colors.semantic.danger,
  },
  createButton: {
    width: "100%",
  },
  exitButton: {
    width: "100%",
    marginTop: "auto",
  },
});
