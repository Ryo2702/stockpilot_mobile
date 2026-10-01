import { Camera, Check, ChevronDown, ChevronLeft } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { TextField } from "@/components/ui/TextField";
import type { CatalogCategory } from "@/domain/catalog";
import { getCurrencySymbol, type CurrencySettings } from "@/domain/currency";
import type { Product } from "@/domain/product";
import { CatalogError } from "@/domain/catalog.errors";
import { control, radii, spacing, typography, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";
import {
  createProductSchema,
  updateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from "@/validation/product.validation";

import type { CatalogCategoryOption } from "@/data/catalog.data";
import { productUnitOptions } from "@/data/catalog.data";
import CategorySelector from "./CategorySelector";

type DropdownOption = { value: string; label: string };

const CRITICAL_LEVEL_PRESETS = [0, 1, 2, 3, 5, 10, 15, 20, 25, 50, 75, 100];

type ProductDraft = {
  name: string;
  sku: string;
  barcode: string;
  category: CatalogCategory;
  unit: string;
  currentPrice: string;
  initialQuantity: string;
  reorderLevel: string;
  criticalLevel: string;
  notes: string;
};

type CatalogFormModalProps = {
  visible: boolean;
  product: Product | null;
  currency: CurrencySettings;
  categories: CatalogCategoryOption[];
  defaultUnit: string;
  defaultReorderLevel: number;
  onClose: () => void;
  onScanBarcode: () => void;
  onSave: (input: CreateProductInput | UpdateProductInput) => Promise<void>;
  scannedBarcode?: string | null;
};

function createDraft(
  product: Product | null,
  categories: CatalogCategoryOption[],
  defaultUnit: string,
  defaultReorderLevel: number,
): ProductDraft {
  const category = categories.find(({ value }) => value === product?.category)?.value;

  return {
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    barcode: product?.barcode ?? "",
    category: category ?? categories[0]?.value ?? "other",
    unit: product?.unit ?? defaultUnit,
    currentPrice: String(product?.currentPrice ?? ""),
    initialQuantity: "0",
    reorderLevel: String(product?.reorderLevel ?? defaultReorderLevel),
    criticalLevel: String(product?.criticalLevel ?? 0),
    notes: product?.notes ?? "",
  };
}

export default function CatalogFormModal({
  visible,
  product,
  currency,
  categories,
  defaultUnit,
  defaultReorderLevel,
  onClose,
  onScanBarcode,
  onSave,
  scannedBarcode,
}: CatalogFormModalProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const [form, setForm] = useState(() => createDraft(product, categories, defaultUnit, defaultReorderLevel));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const touchedDefaults = useRef({ unit: false, reorderLevel: false });

  useEffect(() => {
    if (visible) {
      touchedDefaults.current = { unit: false, reorderLevel: false };
      setForm(createDraft(product, categories, defaultUnit, defaultReorderLevel));
      setErrors({});
    }
  }, [categories, product, visible]);

  useEffect(() => {
    if (!visible || product) return;
    setForm((current) => ({
      ...current,
      unit: touchedDefaults.current.unit ? current.unit : defaultUnit,
      reorderLevel: touchedDefaults.current.reorderLevel
        ? current.reorderLevel
        : String(defaultReorderLevel),
    }));
  }, [defaultReorderLevel, defaultUnit, product, visible]);

  useEffect(() => {
    if (!visible || !scannedBarcode) return;
    setForm((current) => ({
      ...current,
      barcode: scannedBarcode,
      sku: !product && scannedBarcode.length <= 64 && (!current.sku || current.sku === current.barcode)
        ? scannedBarcode
        : current.sku,
    }));
    setErrors((current) => {
      if (!current.barcode) return current;
      const next = { ...current };
      delete next.barcode;
      return next;
    });
  }, [scannedBarcode, visible]);

  const updateField = <K extends keyof ProductDraft,>(field: K, value: ProductDraft[K]) => {
    if (field === "unit") touchedDefaults.current.unit = true;
    if (field === "reorderLevel") touchedDefaults.current.reorderLevel = true;
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field] && !current.form) return current;
      const next = { ...current };
      delete next[field];
      delete next.form;
      return next;
    });
  };

  const close = () => {
    if (!saving) onClose();
  };

  const save = async () => {
    const result = product
      ? updateProductSchema.safeParse(form)
      : createProductSchema.safeParse(form);
    if (!result.success) {
      const next: Record<string, string> = {};
      for (const issue of result.error.issues) {
        next[String(issue.path[0] ?? "form")] = issue.message;
      }
      setErrors(next);
      return;
    }

    setSaving(true);
    setErrors({});
    try {
      await onSave(result.data);
    } catch (error) {
      setErrors({
        form: error instanceof CatalogError ? error.message : "Couldn't save this item.",
      });
    } finally {
      setSaving(false);
    }
  };

  const unitOptions = productUnitOptions.some(({ value }) => value === form.unit)
    ? productUnitOptions
    : [{ value: form.unit, label: `${form.unit} (current)` }, ...productUnitOptions];
  const reorderLevel = Number(form.reorderLevel);
  const maxCriticalLevel = Number.isSafeInteger(reorderLevel) && reorderLevel >= 0
    ? reorderLevel
    : 0;
  const currentCriticalLevel = Number(form.criticalLevel);
  const criticalLevels = new Set([
    ...CRITICAL_LEVEL_PRESETS.filter((level) => level <= maxCriticalLevel),
    maxCriticalLevel,
    ...(Number.isSafeInteger(currentCriticalLevel) && currentCriticalLevel >= 0 && currentCriticalLevel <= maxCriticalLevel
      ? [currentCriticalLevel]
      : []),
  ]);
  const criticalLevelOptions = [...criticalLevels]
    .sort((a, b) => a - b)
    .map((level) => ({ value: String(level), label: `${level} ${form.unit || "ea"}` }));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={close}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <IconButton
            icon={ChevronLeft}
            label="Close item form"
            disabled={saving}
            onPress={close}
          />
          <Text style={styles.title}>{product ? "Edit Item" : "Add Item"}</Text>
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextField
            label="Product Name"
            required
            accessibilityLabel="Item name"
            value={form.name}
            onChangeText={(value) => updateField("name", value)}
            placeholder="e.g. Jasmine rice"
            error={errors.name}
          />
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Barcode</Text>
            <View style={styles.barcodeRow}>
              <TextInput
                accessibilityLabel="Barcode"
                value={form.barcode}
                onChangeText={(value) => updateField("barcode", value)}
                placeholder="Scan or enter a barcode"
                style={[styles.input, styles.barcodeInput]}
                placeholderTextColor={colors.text.muted}
              />
              <Button title="Scan" icon={Camera} variant="secondary" onPress={onScanBarcode} />
            </View>
            {errors.barcode ? <Text style={styles.error}>{errors.barcode}</Text> : null}
          </View>
          <TextField
            label="SKU"
            size="medium"
            accessibilityLabel="SKU"
            value={form.sku}
            onChangeText={(value) => updateField("sku", value)}
            placeholder="e.g. RICE-001"
            autoCapitalize="characters"
            error={errors.sku}
          />

          <View style={styles.formRow}>
            <View style={styles.mediumField}>
              <Text style={styles.label}>Category <Text style={styles.labelNote}>(required)</Text></Text>
              <CategorySelector
                categories={categories}
                value={form.category}
                onChange={(category) => updateField("category", category)}
              />
              {errors.category ? <Text style={styles.error}>{errors.category}</Text> : null}
            </View>
            <DropdownField
              label="Unit"
              value={form.unit}
              options={unitOptions}
              onChange={(value) => updateField("unit", value)}
              error={errors.unit}
              containerStyle={styles.shortField}
            />
          </View>
          <View style={styles.formRow}>
          <TextField
            label="Selling Price"
            size="medium"
            accessibilityLabel="Current price"
            value={form.currentPrice}
            onChangeText={(value) => updateField("currentPrice", value)}
            inputMode="decimal"
            keyboardType="decimal-pad"
            placeholder="0"
            prefix={getCurrencySymbol(currency)}
            error={errors.currentPrice}
          />
          {!product ? (
            <TextField
              label="Initial Quantity"
              required
              size="short"
              accessibilityLabel="Initial quantity"
              value={form.initialQuantity}
              onChangeText={(value) => updateField("initialQuantity", value)}
              keyboardType="number-pad"
              error={errors.initialQuantity}
            />
          ) : null}
          </View>

          <View style={styles.levelRow}>
            <TextField
              label="Reorder Level"
              size="short"
              accessibilityLabel="Reorder level"
              value={form.reorderLevel}
              onChangeText={(value) => updateField("reorderLevel", value)}
              keyboardType="number-pad"
              error={errors.reorderLevel}
              containerStyle={styles.levelField}
            />
            <DropdownField
              label="Critical Level"
              value={form.criticalLevel}
              options={criticalLevelOptions}
              onChange={(value) => updateField("criticalLevel", value)}
              error={errors.criticalLevel}
              containerStyle={styles.levelField}
            />
          </View>
          <TextField
            label="Notes"
            size="full"
            accessibilityLabel="Item notes"
            value={form.notes}
            onChangeText={(value) => updateField("notes", value)}
            placeholder="Optional details"
            multiline
            error={errors.notes}
          />
          <Text style={styles.hint}>
            {product
              ? "Stock quantity is managed through Inventory."
              : "Initial stock is recorded as a stock movement."}
          </Text>
          {errors.form ? (
            <Text accessibilityRole="alert" style={styles.error}>
              {errors.form}
            </Text>
          ) : null}
          <Button
            title={product ? "Save Changes" : "Save Item"}
            loading={saving}
            onPress={() => void save()}
            style={styles.saveButton}
          />
          <Button title="Cancel" variant="ghost" disabled={saving} onPress={close} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function DropdownField({
  label,
  value,
  options,
  onChange,
  error,
  containerStyle,
}: {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={[styles.fieldGroup, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${selected?.label ?? `select ${label.toLowerCase()}`}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.dropdownSelector, pressed && styles.pressed]}
      >
        <Text numberOfLines={1} style={[styles.dropdownText, !selected && styles.dropdownPlaceholder]}>
          {selected?.label ?? `Select ${label.toLowerCase()}`}
        </Text>
        <ChevronDown color={colors.text.secondary} size={18} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.dropdownOverlay}>
          <SafeAreaView style={styles.dropdownSheet} edges={["bottom"]}>
            <Text style={styles.dropdownTitle}>Select {label.toLowerCase()}</Text>
            <ScrollView style={styles.dropdownOptions} showsVerticalScrollIndicator={false}>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [styles.dropdownOption, pressed && styles.pressed]}
                  >
                    <Text style={[styles.dropdownOptionLabel, isSelected && styles.dropdownSelectedLabel]}>
                      {option.label}
                    </Text>
                    {isSelected ? <Check color={colors.primary[600]} size={18} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable
              accessibilityRole="button"
              onPress={() => setOpen(false)}
              style={styles.dropdownClose}
            >
              <Text style={styles.dropdownCloseText}>Cancel</Text>
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.app,
  },
  header: {
    minHeight: control.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  content: {
    gap: spacing[4],
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  scroll: {
    flex: 1,
  },
  fieldGroup: {
    gap: spacing[2],
  },
  barcodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  formRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  mediumField: { width: 180, maxWidth: "100%" },
  shortField: { width: 120, maxWidth: "100%" },
  barcodeInput: {
    minWidth: 0,
    flex: 1,
  },
  levelField: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 140,
    minWidth: 140,
  },
  label: {
    ...typography.label,
    color: colors.text.primary,
  },
  labelNote: {
    ...typography.caption,
    color: colors.text.muted,
  },
  input: {
    minHeight: control.lg,
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
    ...typography.bodySmall,
    color: colors.text.primary,
  },
  dropdownSelector: {
    minHeight: control.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
  },
  dropdownText: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.text.primary,
  },
  dropdownPlaceholder: {
    color: colors.text.muted,
  },
  dropdownOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(36, 28, 23, 0.32)",
  },
  dropdownSheet: {
    maxHeight: "75%",
    gap: spacing[2],
    padding: spacing[4],
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    backgroundColor: colors.background.surface,
  },
  dropdownOptions: {
    flexShrink: 1,
  },
  dropdownTitle: {
    ...typography.h3,
    paddingBottom: spacing[2],
    color: colors.text.primary,
  },
  dropdownOption: {
    minHeight: control.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
    paddingHorizontal: spacing[2],
  },
  dropdownOptionLabel: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.text.primary,
  },
  dropdownSelectedLabel: {
    color: colors.primary[700],
    fontWeight: "600",
  },
  dropdownClose: {
    minHeight: control.md,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  dropdownCloseText: {
    ...typography.label,
    color: colors.text.secondary,
  },
  multilineInput: {
    minHeight: 96,
    paddingTop: spacing[3],
    textAlignVertical: "top",
  },
  levelRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  hint: {
    ...typography.caption,
    color: colors.text.muted,
  },
  error: {
    ...typography.caption,
    color: colors.semantic.danger,
  },
  saveButton: {
    width: "100%",
  },
  pressed: {
    opacity: 0.7,
  },
});
