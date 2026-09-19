import { Camera, ChevronLeft } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Modal,
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

import type { CatalogCategoryOption } from "../catalog.data";
import CategorySelector from "./CategorySelector";

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

          <FormField
            label="Unit"
            accessibilityLabel="Unit"
            value={form.unit}
            onChangeText={(value) => updateField("unit", value)}
            placeholder="e.g. piece, kg, box"
            error={errors.unit}
          />
          {!product ? (
            <FormField
              label="Initial Quantity *"
              accessibilityLabel="Initial quantity"
              value={form.initialQuantity}
              onChangeText={(value) => updateField("initialQuantity", value)}
              keyboardType="number-pad"
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
              error={errors.reorderLevel}
              containerStyle={styles.levelField}
            />
            <FormField
              label="Critical Level"
              accessibilityLabel="Critical level"
              value={form.criticalLevel}
              onChangeText={(value) => updateField("criticalLevel", value)}
              keyboardType="number-pad"
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
  ...inputProps
}: TextInputProps & {
  label: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.fieldGroup, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...inputProps}
        multiline={multiline}
        style={[styles.input, multiline && styles.multilineInput]}
        placeholderTextColor={colors.text.muted}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
});
