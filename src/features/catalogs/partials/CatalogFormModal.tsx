import { Camera, Check, ChevronDown, ChevronLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import type { CatalogCategory } from "@/domain/catalog";
import type { Product } from "@/domain/product";
import { CatalogError } from "@/features/catalogs/errors/catalog.errors";
import { colors, control, radii, spacing, typography } from "@/theme";
import {
  createProductSchema,
  updateProductSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from "@/validation/product.validation";

import type { CatalogCategoryOption } from "../data/catalog.data";
import CategorySelector from "../components/CategorySelector";

type DropdownOption = { value: string; label: string };

const UNIT_OPTIONS: DropdownOption[] = [
  { value: "ea", label: "Each (ea)" },
  { value: "pc", label: "Piece (pc)" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
  { value: "lb", label: "Pound (lb)" },
  { value: "oz", label: "Ounce (oz)" },
  { value: "L", label: "Liter (L)" },
  { value: "mL", label: "Milliliter (mL)" },
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
  { value: "case", label: "Case" },
  { value: "bottle", label: "Bottle" },
  { value: "can", label: "Can" },
  { value: "bag", label: "Bag" },
  { value: "roll", label: "Roll" },
  { value: "pair", label: "Pair" },
  { value: "dozen", label: "Dozen" },
];

const CRITICAL_LEVEL_PRESETS = [0, 1, 2, 3, 5, 10, 15, 20, 25, 50, 75, 100];

type ProductDraft = {
  name: string;
  sku: string;
  barcode: string;
  category: CatalogCategory;
  unit: string;
  initialQuantity: string;
  reorderLevel: string;
  criticalLevel: string;
  notes: string;
};

type CatalogFormModalProps = {
  visible: boolean;
  product: Product | null;
  categories: CatalogCategoryOption[];
  onClose: () => void;
  onScanBarcode: () => void;
  onSave: (input: CreateProductInput | UpdateProductInput) => Promise<void>;
  scannedBarcode?: string | null;
};

function createDraft(product: Product | null, categories: CatalogCategoryOption[]): ProductDraft {
  const category = categories.find(({ value }) => value === product?.category)?.value;

  return {
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    barcode: product?.barcode ?? "",
    category: category ?? categories[0]?.value ?? "other",
    unit: product?.unit ?? "ea",
    initialQuantity: "0",
    reorderLevel: String(product?.reorderLevel ?? 0),
    criticalLevel: String(product?.criticalLevel ?? 0),
    notes: product?.notes ?? "",
  };
}

export default function CatalogFormModal({
  visible,
  product,
  categories,
  onClose,
  onScanBarcode,
  onSave,
  scannedBarcode,
}: CatalogFormModalProps) {
  const [form, setForm] = useState(() => createDraft(product, categories));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm(createDraft(product, categories));
      setErrors({});
    }
  }, [categories, product, visible]);

  useEffect(() => {
    if (!visible || !scannedBarcode) return;
    setForm((current) => ({ ...current, barcode: scannedBarcode }));
    setErrors((current) => {
      if (!current.barcode) return current;
      const next = { ...current };
      delete next.barcode;
      return next;
    });
  }, [scannedBarcode, visible]);

  const updateField = <K extends keyof ProductDraft,>(field: K, value: ProductDraft[K]) => {
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
        form: error instanceof CatalogError ? error.message : "Couldn't save this product.",
      });
    } finally {
      setSaving(false);
    }
  };

  const unitOptions = UNIT_OPTIONS.some(({ value }) => value === form.unit)
    ? UNIT_OPTIONS
    : [{ value: form.unit, label: `${form.unit} (current)` }, ...UNIT_OPTIONS];
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
            label="Close product form"
            disabled={saving}
            onPress={close}
          />
          <Text style={styles.title}>{product ? "Edit Product" : "Add Product"}</Text>
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FormField
            label="Product Name *"
            accessibilityLabel="Product name"
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
          <FormField
            label="SKU"
            accessibilityLabel="SKU"
            value={form.sku}
            onChangeText={(value) => updateField("sku", value)}
            placeholder="e.g. RICE-001"
            autoCapitalize="characters"
            error={errors.sku}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Category *</Text>
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
          />
          {!product ? (
            <FormField
              label="Initial Quantity *"
              accessibilityLabel="Initial quantity"
              value={form.initialQuantity}
              onChangeText={(value) => updateField("initialQuantity", value)}
              keyboardType="number-pad"
              numericOnly
              error={errors.initialQuantity}
            />
          ) : null}

          <View style={styles.levelRow}>
            <FormField
              label="Reorder Level"
              accessibilityLabel="Reorder level"
              value={form.reorderLevel}
              onChangeText={(value) => updateField("reorderLevel", value)}
              keyboardType="number-pad"
              numericOnly
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
          <FormField
            label="Notes"
            accessibilityLabel="Product notes"
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
            title={product ? "Save Changes" : "Save Product"}
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

function FormField({
  label,
  error,
  containerStyle,
  multiline,
  numericOnly,
  ...inputProps
}: TextInputProps & {
  label: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  numericOnly?: boolean;
}) {
  return (
    <View style={[styles.fieldGroup, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        inputMode={numericOnly ? "numeric" : inputProps.inputMode}
        onChangeText={numericOnly
          ? (value) => inputProps.onChangeText?.(value.replace(/\D/g, ""))
          : inputProps.onChangeText}
        multiline={multiline}
        style={[styles.input, multiline && styles.multilineInput]}
        placeholderTextColor={colors.text.muted}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
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
            <ScrollView showsVerticalScrollIndicator={false}>
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

const styles = StyleSheet.create({
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
  fieldGroup: {
    gap: spacing[2],
  },
  barcodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  barcodeInput: {
    minWidth: 0,
    flex: 1,
  },
  levelField: {
    minWidth: 0,
    flex: 1,
  },
  label: {
    ...typography.label,
    color: colors.text.primary,
  },
  input: {
    minHeight: control.md,
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
    backgroundColor: "rgba(15, 23, 42, 0.32)",
  },
  dropdownSheet: {
    maxHeight: "75%",
    gap: spacing[2],
    padding: spacing[4],
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    backgroundColor: colors.background.surface,
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
