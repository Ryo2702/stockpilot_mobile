import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AlertCircle, ChevronRight, CircleCheck, Pencil, Search, TriangleAlert, X } from "lucide-react-native";
import { type ComponentProps, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import {
  type InventoryFileImportProduct,
  type InventoryFileImportReview,
  type InventoryFileImportStatus,
} from "@/services/inventory";
import { useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";

import { createInventoryImportStyles } from "./inventory-import.styles";

type ImportFilter = "all" | "ready" | "existing" | "needs_review";

const statusLabels: Record<InventoryFileImportStatus, string> = {
  ready: "Ready",
  existing_product: "Existing Product",
  needs_review: "Needs Review",
  missing_required_field: "Missing Required Field",
  invalid_quantity: "Invalid Quantity",
  invalid_price: "Invalid Price",
  duplicate_sku: "Duplicate SKU",
  duplicate_barcode: "Duplicate Barcode",
  possible_match: "Possible Match",
};

function money(value: string) {
  const number = Number(value.replace(/[₱,\s]/g, ""));
  return Number.isFinite(number) && value.trim() ? `₱${number.toFixed(2)}` : "—";
}

function statusTone(status: InventoryFileImportStatus) {
  if (status === "ready") return "success" as const;
  if (status === "existing_product" || status === "needs_review" || status === "possible_match") return "warning" as const;
  return "danger" as const;
}

function isNeedsReview(row: InventoryFileImportProduct) {
  return !row.canImport && row.status !== "existing_product";
}

function StatusChip({ status }: { status: InventoryFileImportStatus }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createInventoryImportStyles);
  const tone = statusTone(status);
  const Icon = tone === "success" ? CircleCheck : tone === "warning" ? TriangleAlert : AlertCircle;
  const color = tone === "success" ? colors.semantic.success : tone === "warning" ? colors.semantic.warning : colors.semantic.danger;
  const backgroundColor = tone === "success" ? colors.semantic.successBackground : tone === "warning" ? colors.semantic.warningBackground : colors.semantic.dangerBackground;
  return (
    <View style={[styles.statusChip, { backgroundColor }]}>
      <Icon color={color} size={13} strokeWidth={2.3} />
      <Text style={[styles.statusLabel, { color }]}>{statusLabels[status]}</Text>
    </View>
  );
}

function ProductRow({
  row,
  expanded,
  onToggle,
  onEdit,
}: {
  row: InventoryFileImportProduct;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createInventoryImportStyles);
  const issue = row.issues[0]?.message;
  return (
    <Card style={styles.productCard}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={onToggle} style={({ pressed }) => [styles.productHeader, pressed && styles.pressed]}>
        <View style={styles.productCopy}>
          <Text style={styles.productName}>{row.name || "Unnamed product"}</Text>
          <Text style={styles.productSummary}>{row.quantity || "—"} units · {money(row.costPrice)} cost · {money(row.sellingPrice)} selling</Text>
          <Text style={styles.productSku}>SKU: {row.sku || "—"}</Text>
          {row.existing ? <Text style={styles.productMatch}>Matched using {row.existing.match} · {row.existing.name}</Text> : null}
        </View>
        <View style={styles.productEnd}>
          <StatusChip status={row.status} />
          <ChevronRight color={colors.text.muted} size={18} style={expanded ? { transform: [{ rotate: "90deg" }] } : undefined} />
        </View>
      </Pressable>
      {expanded ? (
        <View style={styles.productDetail}>
          <Text style={styles.detailLine}>Barcode: {row.barcode || "—"}</Text>
          <Text style={styles.detailLine}>Category: {row.category || "Other"}</Text>
          <Text style={styles.detailLine}>Unit: {row.unit || "ea"}</Text>
          {row.existing ? <Text style={styles.matchLine}>Matched using {row.existing.match} · {row.existing.name}</Text> : null}
          {issue ? <Text style={styles.issueLine}>{issue}</Text> : null}
          <Button
            title={row.status === "existing_product" || row.status === "duplicate_barcode" || row.status === "duplicate_sku" ? "Review Product" : "Edit"}
            icon={Pencil}
            size="sm"
            variant="secondary"
            onPress={onEdit}
            style={styles.editButton}
          />
        </View>
      ) : null}
    </Card>
  );
}

export function ProductEditor({
  row,
  visible,
  saving,
  onClose,
  onSave,
}: {
  row: InventoryFileImportProduct | null;
  visible: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (updates: Partial<InventoryFileImportProduct>) => Promise<void>;
}) {
  const styles = useThemeStyles(createInventoryImportStyles);
  const [draft, setDraft] = useState<InventoryFileImportProduct | null>(row);
  useEffect(() => setDraft(row), [row]);
  if (!draft) return null;
  const update = (key: keyof InventoryFileImportProduct, value: string) => setDraft((current) => current ? { ...current, [key]: value } : current);
  const save = async () => {
    await onSave({
      name: draft.name,
      sku: draft.sku,
      barcode: draft.barcode,
      quantity: draft.quantity,
      costPrice: draft.costPrice,
      sellingPrice: draft.sellingPrice,
      category: draft.category,
      unit: draft.unit,
    });
  };
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView edges={["bottom"]} style={styles.editorSheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{draft.status === "existing_product" ? "Review Product" : "Edit Imported Product"}</Text>
            <IconButton icon={X} label="Close product editor" onPress={onClose} />
          </View>
          <ScrollView contentContainerStyle={styles.editorContent} keyboardShouldPersistTaps="handled">
            <EditorField label="Product Name" value={draft.name} onChangeText={(value) => update("name", value)} />
            <EditorField label="Quantity" keyboardType="number-pad" value={draft.quantity} onChangeText={(value) => update("quantity", value)} />
            <EditorField label="Cost Price" keyboardType="decimal-pad" value={draft.costPrice} onChangeText={(value) => update("costPrice", value)} />
            <EditorField label="Selling Price" keyboardType="decimal-pad" value={draft.sellingPrice} onChangeText={(value) => update("sellingPrice", value)} />
            <EditorField label="SKU" value={draft.sku} onChangeText={(value) => update("sku", value)} autoCapitalize="characters" />
            <EditorField label="Barcode" keyboardType="number-pad" value={draft.barcode} onChangeText={(value) => update("barcode", value)} />
            <EditorField label="Category" value={draft.category} onChangeText={(value) => update("category", value)} />
            <EditorField label="Unit" value={draft.unit} onChangeText={(value) => update("unit", value)} />
            {draft.existing ? (
              <Card style={styles.matchCard}>
                <Text style={styles.matchTitle}>Existing product</Text>
                <Text style={styles.copy}>{draft.existing.name} matched using {draft.existing.match}. Stock updates only after you explicitly approve it.</Text>
                {draft.status === "existing_product" ? (
                  <Button
                    title={draft.approveExisting ? "Will Update Stock" : "Update Existing Stock"}
                    variant={draft.approveExisting ? "primary" : "secondary"}
                    size="sm"
                    onPress={() => void onSave({ approveExisting: !draft.approveExisting })}
                  />
                ) : null}
              </Card>
            ) : null}
          </ScrollView>
          <View style={styles.editorActions}>
            <Button title="Cancel" variant="secondary" onPress={onClose} style={styles.flexButton} />
            <Button title="Save Changes" loading={saving} onPress={() => void save()} style={styles.flexButton} />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function EditorField({ label, ...props }: { label: string } & ComponentProps<typeof TextInput>) {
  const styles = useThemeStyles(createInventoryImportStyles);
  const { colors } = useTheme();
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput placeholderTextColor={colors.text.muted} style={styles.fieldInput} {...props} />
    </View>
  );
}

export function ConfirmationDialog({
  visible,
  count,
  storeName,
  remaining,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  count: number;
  storeName: string;
  remaining: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const styles = useThemeStyles(createInventoryImportStyles);
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={styles.dialogOverlay}>
        <Card style={styles.dialog}>
          <Text style={styles.dialogTitle}>Import {count.toLocaleString()} {count === 1 ? "product" : "products"} to {storeName}?</Text>
          <Text style={styles.copy}>{remaining ? `The remaining ${remaining.toLocaleString()} ${remaining === 1 ? "product" : "products"} will not be imported until their issues are resolved.` : "Your inventory will be updated after you confirm."}</Text>
          <View style={styles.dialogActions}>
            <Button title="Cancel" variant="secondary" onPress={onCancel} style={styles.flexButton} />
            <Button title="Confirm Import" onPress={onConfirm} style={styles.flexButton} />
          </View>
        </Card>
      </View>
    </Modal>
  );
}

export function ImportPreview({
  review,
  error,
  resolving,
  onEdit,
  onOpenConfirmation,
}: {
  review: InventoryFileImportReview;
  error: string;
  resolving: boolean;
  onEdit: (row: InventoryFileImportProduct) => void;
  onOpenConfirmation: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createInventoryImportStyles);
  const [filter, setFilter] = useState<ImportFilter>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const visibleRows = useMemo(() => review.rows.filter((row) => {
    const matchesFilter = filter === "all"
      || filter === "ready" && row.canImport
      || filter === "existing" && row.status === "existing_product"
      || filter === "needs_review" && isNeedsReview(row);
    const needle = search.trim().toLowerCase();
    return matchesFilter && (!needle || [row.name, row.sku, row.barcode, row.category].some((value) => value.toLowerCase().includes(needle)));
  }), [filter, review.rows, search]);

  return (
    <View style={styles.sectionGap}>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Card style={styles.summaryCard}>
        <Text style={styles.sectionTitle}>Import Summary</Text>
        <Text style={styles.summaryDetected}>{review.detectedCount.toLocaleString()} {review.detectedCount === 1 ? "product" : "products"} detected</Text>
        <View style={styles.summaryGrid}>
          <SummaryValue label="Ready" value={review.readyCount} color={colors.semantic.success} />
          <SummaryValue label="Existing" value={review.existingCount} color={colors.semantic.warning} />
          <SummaryValue label="Need Review" value={review.needsReviewCount} color={colors.semantic.danger} />
        </View>
      </Card>
      <View style={styles.previewHeader}>
        <Text style={styles.sectionTitle}>Preview Import</Text>
        {resolving ? <ActivityIndicator color={colors.primary[600]} size="small" /> : null}
      </View>
      <View style={styles.searchBox}>
        <Search color={colors.text.muted} size={18} />
        <TextInput
          accessibilityLabel="Search imported products"
          placeholder="Search products"
          placeholderTextColor={colors.text.muted}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
      </View>
      <ScrollView horizontal contentContainerStyle={styles.filterRow} showsHorizontalScrollIndicator={false}>
        {([
          ["all", "All"],
          ["ready", "Ready"],
          ["existing", "Existing"],
          ["needs_review", "Needs Review"],
        ] as Array<[ImportFilter, string]>).map(([value, label]) => (
          <Pressable key={value} accessibilityRole="radio" accessibilityState={{ selected: filter === value }} onPress={() => setFilter(value)} style={[styles.filterChip, filter === value && styles.filterChipActive]}>
            <Text style={[styles.filterLabel, filter === value && styles.filterLabelActive]}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.previewList}>
        {visibleRows.map((row) => (
          <ProductRow
            key={row.id}
            row={row}
            expanded={expanded === row.id}
            onToggle={() => setExpanded((current) => current === row.id ? null : row.id)}
            onEdit={() => onEdit(row)}
          />
        ))}
        {!visibleRows.length ? <Text style={styles.copy}>No products match this filter.</Text> : null}
      </View>
      <View style={styles.previewActions}>
        <Button title="Review Issues" variant="secondary" onPress={() => setFilter("needs_review")} style={styles.flexButton} />
        <Button
          title={`Import ${review.readyCount.toLocaleString()} ${review.readyCount === 1 ? "Product" : "Products"}`}
          disabled={!review.readyCount || resolving}
          onPress={onOpenConfirmation}
          style={styles.flexButton}
        />
      </View>
    </View>
  );
}

function SummaryValue({ label, value, color }: { label: string; value: number; color: string }) {
  const styles = useThemeStyles(createInventoryImportStyles);
  return (
    <View style={styles.summaryValue}>
      <Text style={[styles.summaryNumber, { color }]}>{value.toLocaleString()}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}
