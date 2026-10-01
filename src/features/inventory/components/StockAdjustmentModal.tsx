import { ChevronDown, ChevronLeft } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { TextField } from "@/components/ui/TextField";
import type { InventoryItem } from "@/domain/inventory";
import { control, radii, spacing, typography, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";
import { parseNumberInput } from "@/validation/number.validation";
import { stockAdjustmentSchema, type StockAdjustmentInput } from "@/validation/inventory.validation";

import { adjustmentReasons, adjustmentTypeOptions } from "../data/inventory.data";

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background.app },
  header: {
    minHeight: control.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  headerTitle: { ...typography.h3, color: colors.text.primary },
  scroll: { flex: 1 },
  content: {
    gap: spacing[4],
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  product: { gap: spacing[1] },
  productName: { ...typography.title, color: colors.text.primary },
  meta: { ...typography.caption, color: colors.text.muted },
  current: {
    gap: spacing[1],
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
  },
  currentLabel: { ...typography.caption, color: colors.text.muted },
  currentValue: { ...typography.h2, color: colors.text.primary },
  section: { gap: spacing[2] },
  sectionTitle: { ...typography.label, color: colors.text.primary },
  segments: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  segment: {
    minHeight: control.md,
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
  },
  segmentSelected: { borderColor: colors.primary[500], backgroundColor: colors.primary[50] },
  segmentLabel: { ...typography.caption, color: colors.text.secondary, textAlign: "center" },
  segmentLabelSelected: { color: colors.primary[700], fontWeight: "600" },
  field: { gap: spacing[1] },
  label: { ...typography.label, color: colors.text.primary },
  selector: {
    minHeight: control.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
  },
  selectorText: { ...typography.bodySmall, flex: 1, color: colors.text.primary },
  preview: {
    gap: spacing[3],
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
  },
  previewRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing[3] },
  previewLabel: { ...typography.bodySmall, color: colors.text.secondary },
  previewValue: { ...typography.label, color: colors.text.primary },
  explanation: { ...typography.caption, color: colors.text.secondary },
  error: { ...typography.caption, color: colors.semantic.danger },
  actions: { gap: spacing[2] },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(36, 28, 23, 0.32)" },
  reasonSheet: {
    maxHeight: "75%",
    gap: spacing[2],
    padding: spacing[4],
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    backgroundColor: colors.background.surface,
  },
  reasonTitle: { ...typography.h3, color: colors.text.primary },
  reasonOption: { minHeight: control.md, justifyContent: "center", paddingHorizontal: spacing[2] },
  reasonLabel: { ...typography.bodySmall, color: colors.text.primary },
  reasonSelected: { color: colors.primary[700], fontWeight: "600" },
  cancelReason: { minHeight: control.md, alignItems: "center", justifyContent: "center", borderTopWidth: 1, borderTopColor: colors.border.default },
  cancelText: { ...typography.label, color: colors.text.secondary },
  pressed: { opacity: 0.72 },
});

type StockAdjustmentModalProps = {
  visible: boolean;
  item: InventoryItem;
  storeName: string;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSave: (input: StockAdjustmentInput) => Promise<boolean>;
};

export default function StockAdjustmentModal({
  visible,
  item,
  storeName,
  saving,
  error,
  onClose,
  onSave,
}: StockAdjustmentModalProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const [type, setType] = useState<StockAdjustmentInput["type"]>("stock_in");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("purchase");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [reasonOpen, setReasonOpen] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const reasons = adjustmentReasons[type];
  const currentQuantity = item.quantity;
  const parsedInput = parseNumberInput(quantity);
  const parsedQuantity = typeof parsedInput === "number" ? parsedInput : NaN;
  const hasIntegerQuantity = Number.isSafeInteger(parsedQuantity) && parsedQuantity >= 0;
  const delta = hasIntegerQuantity
    ? type === "stock_in"
      ? parsedQuantity
      : type === "stock_out"
        ? -parsedQuantity
        : parsedQuantity - currentQuantity
    : 0;
  const nextQuantity = currentQuantity + delta;
  const insufficient = type === "stock_out" && hasIntegerQuantity && nextQuantity < 0;
  const noChange = type === "set_current_stock" && hasIntegerQuantity && delta === 0;
  const quantityError = !quantity.trim()
    ? "Enter a quantity."
    : !hasIntegerQuantity
      ? "Enter a whole number."
      : type !== "set_current_stock" && parsedQuantity === 0
        ? "Enter a quantity greater than zero."
        : "";
  const reasonLabel = reasons.find((option) => option.value === reason)?.label ?? "Select reason";
  const changeLabel = type === "stock_in" ? "Stock In" : type === "stock_out" ? "Stock Out" : "Difference";
  const confirmLabel = type === "stock_in" ? "Confirm Stock In" : type === "stock_out" ? "Confirm Stock Out" : "Confirm Count";

  useEffect(() => {
    if (!visible) return;
    setType("stock_in");
    setQuantity("1");
    setReason("purchase");
    setReference("");
    setNote("");
    setFieldError("");
    setReasonOpen(false);
  }, [item.id, visible]);

  const previewRows = useMemo(() => [
    { label: type === "set_current_stock" ? "System Quantity" : "Current Stock", value: `${currentQuantity} ${item.unit}` },
    {
      label: type === "set_current_stock" ? "Difference" : changeLabel,
      value: `${delta > 0 ? "+" : ""}${delta} ${item.unit}`,
    },
    { label: "New Stock", value: `${hasIntegerQuantity ? nextQuantity : "—"} ${item.unit}` },
  ], [changeLabel, currentQuantity, delta, hasIntegerQuantity, item.unit, nextQuantity, type]);

  const save = async () => {
    setFieldError("");
    const result = stockAdjustmentSchema.safeParse({
      type,
      quantity,
      reason,
      reference,
      note,
    });
    if (!result.success) {
      const issue = result.error.issues[0];
      setFieldError(issue?.message ?? "Check the quantity and reason.");
      return;
    }
    if (insufficient) {
      setFieldError(`Only ${currentQuantity} ${item.unit} are currently available.`);
      return;
    }
    if (await onSave(result.data)) onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={() => { if (!saving) onClose(); }}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <IconButton icon={ChevronLeft} label="Close stock adjustment" disabled={saving} onPress={onClose} />
          <Text style={styles.headerTitle}>Adjust Stock</Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.product}>
            <Text style={styles.productName}>{item.name}</Text>
            <Text style={styles.meta}>{item.sku ? `SKU: ${item.sku}` : "No SKU"}</Text>
            <Text style={styles.meta}>Store: {storeName}</Text>
          </View>
          <View style={styles.current}>
            <Text style={styles.currentLabel}>Current Stock</Text>
            <Text style={styles.currentValue}>{currentQuantity} {item.unit}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adjustment Type</Text>
            <View style={styles.segments}>
              {adjustmentTypeOptions.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: type === option.value }}
                  onPress={() => {
                    setType(option.value);
                    setQuantity(option.value === "set_current_stock" ? "" : quantity || "1");
                    setReason(adjustmentReasons[option.value][0].value);
                    setFieldError("");
                  }}
                  style={({ pressed }) => [styles.segment, type === option.value && styles.segmentSelected, pressed && styles.pressed]}
                >
                  <Text style={[styles.segmentLabel, type === option.value && styles.segmentLabelSelected]}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <TextField
            accessibilityLabel={type === "set_current_stock" ? "Counted quantity" : "Quantity"}
            error={quantityError || (insufficient ? `Only ${currentQuantity} ${item.unit} are currently available.` : undefined)}
            keyboardType="number-pad"
            label={type === "set_current_stock" ? "Counted Quantity" : "Quantity"}
            onChangeText={setQuantity}
            placeholder="0"
            required
            size="short"
            value={quantity}
          />
          {noChange ? <Text style={styles.explanation}>The counted quantity matches current stock, so no adjustment will be recorded.</Text> : null}

          <View style={styles.field}>
            <Text style={styles.label}>Reason *</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Reason, ${reasonLabel}`}
              accessibilityState={{ expanded: reasonOpen }}
              onPress={() => setReasonOpen(true)}
              style={({ pressed }) => [styles.selector, pressed && styles.pressed]}
            >
              <Text style={styles.selectorText}>{reasonLabel}</Text>
              <ChevronDown color={colors.text.secondary} size={18} />
            </Pressable>
          </View>

          {type !== "set_current_stock" ? (
            <TextField label="Reference" optional size="medium" value={reference} onChangeText={setReference} placeholder="e.g. PO-001" />
          ) : null}
          <TextField label="Notes" optional value={note} onChangeText={setNote} placeholder="Add an optional note" multiline />

          <View style={styles.preview}>
            {previewRows.map((row) => (
              <View key={row.label} style={styles.previewRow}>
                <Text style={styles.previewLabel}>{row.label}</Text>
                <Text style={styles.previewValue}>{row.value}</Text>
              </View>
            ))}
            {type === "set_current_stock" ? (
              <Text style={styles.explanation}>
                {hasIntegerQuantity
                  ? `Current stock will be updated from ${currentQuantity} to ${parsedQuantity} ${item.unit}. A ${delta > 0 ? "+" : ""}${delta} adjustment will be recorded in stock history.`
                  : "Enter the counted quantity to preview the stock change."}
              </Text>
            ) : null}
          </View>

          {fieldError || error ? <Text accessibilityRole="alert" style={styles.error}>{fieldError || error}</Text> : null}
          <View style={styles.actions}>
            <Button title="Cancel" variant="secondary" disabled={saving} onPress={onClose} />
            <Button
              title={confirmLabel}
              loading={saving}
              disabled={!hasIntegerQuantity || (type !== "set_current_stock" && parsedQuantity <= 0) || insufficient || noChange}
              onPress={() => void save()}
            />
          </View>
          <Text style={styles.meta}>Adjustment will be recorded in this store's stock history.</Text>
        </ScrollView>
      </SafeAreaView>

      <Modal visible={reasonOpen} transparent animationType="fade" onRequestClose={() => setReasonOpen(false)}>
        <View style={styles.overlay}>
          <SafeAreaView style={styles.reasonSheet} edges={["bottom"]}>
            <Text style={styles.reasonTitle}>Select reason</Text>
            <ScrollView>
              {reasons.map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: reason === option.value }}
                  onPress={() => { setReason(option.value); setReasonOpen(false); }}
                  style={({ pressed }) => [styles.reasonOption, pressed && styles.pressed]}
                >
                  <Text style={[styles.reasonLabel, reason === option.value && styles.reasonSelected]}>{option.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable accessibilityRole="button" onPress={() => setReasonOpen(false)} style={styles.cancelReason}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>
    </Modal>
  );
}
