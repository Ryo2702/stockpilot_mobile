import { Archive, Check, ChevronDown, Download, History, Menu, Settings, Upload, X } from "lucide-react-native";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import type {
  InventoryMovementFilter,
  InventoryMovementPeriod,
  InventoryQuantityFilter,
  InventorySort,
  InventoryStatus,
} from "@/domain/inventory";
import { control, radii, spacing, typography, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";
import type { CatalogCategoryOption } from "@/data/catalog.data";
import {
  inventorySortOptions,
  inventoryStatusOptions,
  quantityFilterOptions,
} from "../data/inventory.data";

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: colors.overlay },
  sheet: {
    maxHeight: "88%",
    gap: spacing[3],
    padding: spacing[4],
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    backgroundColor: colors.background.surface,
  },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { ...typography.h3, flex: 1, color: colors.text.primary },
  close: { width: control.md, height: control.md, alignItems: "center", justifyContent: "center" },
  scroll: { flexShrink: 1 },
  content: { gap: spacing[3], paddingBottom: spacing[2] },
  section: { gap: spacing[2] },
  sectionTitle: { ...typography.section, color: colors.text.primary },
  radioOption: {
    minHeight: control.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[2],
    borderRadius: radii.md,
  },
  radio: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radii.full,
  },
  radioSelected: { borderColor: colors.primary[600], backgroundColor: colors.primary[600] },
  optionLabel: { ...typography.bodySmall, flex: 1, color: colors.text.primary },
  optionSelected: { color: colors.primary[700], fontWeight: "600" },
  trigger: {
    minHeight: control.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
  },
  triggerLabel: { ...typography.bodySmall, flex: 1, color: colors.text.primary },
  categoryList: { maxHeight: 190 },
  quantityOptions: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  chip: {
    minHeight: control.sm,
    justifyContent: "center",
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.full,
  },
  chipSelected: { borderColor: colors.primary[200], backgroundColor: colors.primary[50] },
  chipLabel: { ...typography.label, color: colors.text.secondary },
  chipLabelSelected: { color: colors.primary[700], fontWeight: "600" },
  actions: { flexDirection: "row", gap: spacing[2] },
  action: { minWidth: 0, flex: 1 },
  menu: { gap: spacing[1] },
  menuRow: { minHeight: control.lg, flexDirection: "row", alignItems: "center", gap: spacing[3], paddingHorizontal: spacing[2] },
  menuLabel: { ...typography.bodySmall, flex: 1, color: colors.text.primary },
  copy: { ...typography.bodySmall, color: colors.text.secondary },
  pressed: { opacity: 0.7 },
});

function BottomSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.sheet} edges={["bottom"]}>
          <View style={styles.sheetHeader}>
            <Text style={styles.title}>{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`Close ${title}`} onPress={onClose} style={styles.close}>
              <X color={colors.text.secondary} size={20} />
            </Pressable>
          </View>
          {children}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function RadioOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const styles = useThemeStyles(createStyles);
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.radioOption, pressed && styles.pressed]}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <Check color={colors.text.onPrimary} size={13} strokeWidth={3} /> : null}
      </View>
      <Text style={[styles.optionLabel, selected && styles.optionSelected]}>{label}</Text>
    </Pressable>
  );
}

export function InventoryFilterSheet({
  visible,
  stockStatus,
  category,
  quantity,
  categories,
  onClose,
  onApply,
}: {
  visible: boolean;
  stockStatus: InventoryStatus | "all";
  category: CatalogCategoryOption["value"] | null;
  quantity: InventoryQuantityFilter;
  categories: CatalogCategoryOption[];
  onClose: () => void;
  onApply: (stockStatus: InventoryStatus | "all", category: CatalogCategoryOption["value"] | null, quantity: InventoryQuantityFilter) => void;
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const [draftStatus, setDraftStatus] = useState(stockStatus);
  const [draftCategory, setDraftCategory] = useState(category);
  const [draftQuantity, setDraftQuantity] = useState(quantity);
  const [categoryOpen, setCategoryOpen] = useState(false);
  useEffect(() => {
    if (visible) {
      setDraftStatus(stockStatus);
      setDraftCategory(category);
      setDraftQuantity(quantity);
      setCategoryOpen(false);
    }
  }, [category, quantity, stockStatus, visible]);
  const categoryLabel = categories.find(({ value }) => value === draftCategory)?.label ?? "All Categories";

  return (
    <BottomSheet visible={visible} title="Filter Inventory" onClose={onClose}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stock Status</Text>
          {inventoryStatusOptions.map((option) => (
            <RadioOption
              key={option.value}
              label={option.label}
              selected={draftStatus === option.value}
              onPress={() => setDraftStatus(option.value)}
            />
          ))}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: categoryOpen }}
            onPress={() => setCategoryOpen((current) => !current)}
            style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
          >
            <Text style={styles.triggerLabel}>{categoryLabel}</Text>
            <ChevronDown color={colors.text.secondary} size={18} />
          </Pressable>
          {categoryOpen ? (
            <ScrollView style={styles.categoryList} nestedScrollEnabled>
              <RadioOption label="All Categories" selected={!draftCategory} onPress={() => setDraftCategory(null)} />
              {categories.map((option) => (
                <RadioOption
                  key={option.value}
                  label={option.label}
                  selected={draftCategory === option.value}
                  onPress={() => setDraftCategory(option.value)}
                />
              ))}
            </ScrollView>
          ) : null}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quantity</Text>
          <View style={styles.quantityOptions}>
            {quantityFilterOptions.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected: draftQuantity === option.value }}
                onPress={() => setDraftQuantity(option.value)}
                style={({ pressed }) => [styles.chip, draftQuantity === option.value && styles.chipSelected, pressed && styles.pressed]}
              >
                <Text style={[styles.chipLabel, draftQuantity === option.value && styles.chipLabelSelected]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={styles.actions}>
        <Button
          title="Reset"
          variant="secondary"
          onPress={() => {
            setDraftStatus("all");
            setDraftCategory(null);
            setDraftQuantity("any");
          }}
          style={styles.action}
        />
        <Button
          title="Apply Filters"
          onPress={() => {
            onApply(draftStatus, draftCategory, draftQuantity);
            onClose();
          }}
          style={styles.action}
        />
      </View>
    </BottomSheet>
  );
}

export function InventorySortSheet({
  visible,
  sort,
  onClose,
  onApply,
}: {
  visible: boolean;
  sort: InventorySort;
  onClose: () => void;
  onApply: (sort: InventorySort) => void;
}) {
  const styles = useThemeStyles(createStyles);
  const [draftSort, setDraftSort] = useState(sort);
  useEffect(() => {
    if (visible) setDraftSort(sort);
  }, [sort, visible]);
  return (
    <BottomSheet visible={visible} title="Sort Inventory" onClose={onClose}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {inventorySortOptions.map((option) => (
          <RadioOption
            key={option.value}
            label={option.label}
            selected={draftSort === option.value}
            onPress={() => setDraftSort(option.value)}
          />
        ))}
      </ScrollView>
      <Button title="Apply Sort" onPress={() => { onApply(draftSort); onClose(); }} />
    </BottomSheet>
  );
}

export function InventoryMoreSheet({
  visible,
  onClose,
  onMovements,
  onImport,
  onExport,
  exporting,
  onArchived,
  onPreferences,
  onMore,
}: {
  visible: boolean;
  onClose: () => void;
  onMovements: () => void;
  onImport: () => void;
  onExport: () => void;
  exporting: boolean;
  onArchived: () => void;
  onPreferences: () => void;
  onMore: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const actions = [
    { label: "Stock Movement History", Icon: History, onPress: onMovements, loading: false, close: true },
    { label: "Import Inventory", Icon: Upload, onPress: onImport, loading: false, close: true },
    { label: exporting ? "Exporting Inventory…" : "Export Inventory", Icon: Download, onPress: onExport, loading: exporting, close: false },
    { label: "Archived Products", Icon: Archive, onPress: onArchived, loading: false, close: true },
    { label: "Inventory Preferences", Icon: Settings, onPress: onPreferences, loading: false, close: true },
    { label: "More", Icon: Menu, onPress: onMore, loading: false, close: true },
  ];
  return (
    <BottomSheet visible={visible} title="Inventory Actions" onClose={onClose}>
      <View style={styles.menu}>
        {actions.map(({ label, Icon, onPress, loading, close }) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityState={{ busy: loading, disabled: loading }}
            disabled={loading}
            onPress={() => { if (close) onClose(); onPress(); }}
            style={({ pressed }) => [styles.menuRow, pressed && !loading && styles.pressed]}
          >
            {loading ? <ActivityIndicator color={colors.primary[600]} size="small" /> : <Icon color={colors.text.secondary} size={20} />}
            <Text style={styles.menuLabel}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </BottomSheet>
  );
}

export function InventoryPreferencesSheet({
  visible,
  defaultSort,
  onClose,
  onSave,
}: {
  visible: boolean;
  defaultSort: InventorySort;
  onClose: () => void;
  onSave: (sort: InventorySort) => Promise<boolean>;
}) {
  const styles = useThemeStyles(createStyles);
  const [draftSort, setDraftSort] = useState(defaultSort);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (visible) setDraftSort(defaultSort);
  }, [defaultSort, visible]);
  const save = async () => {
    setSaving(true);
    if (await onSave(draftSort)) onClose();
    setSaving(false);
  };
  return (
    <BottomSheet visible={visible} title="Inventory Preferences" onClose={() => { if (!saving) onClose(); }}>
      <Text style={styles.copy}>Choose the sort order used when you open this store's inventory.</Text>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {inventorySortOptions.map((option) => (
          <RadioOption
            key={option.value}
            label={option.label}
            selected={draftSort === option.value}
            onPress={() => setDraftSort(option.value)}
          />
        ))}
      </ScrollView>
      <Button title="Save Preference" loading={saving} onPress={() => void save()} />
    </BottomSheet>
  );
}
