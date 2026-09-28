import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, ChevronDown, FileText, Store, Trash2, X } from "lucide-react-native";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import type { OwnerStore } from "@/services/owner-store.service";
import {
  inventoryFileImportFieldLabels,
  inventoryFileImportFields,
  type InventoryFileImportField,
  type InventoryFileImportFieldMapping,
} from "@/services/inventory";
import { useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";

import { createInventoryImportStyles } from "./inventory-import.styles";

function formatFileSize(size: number | null) {
  if (size === null) return "Size unavailable";
  if (size < 1024) return `${size} B`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export function ImportStepper({ step }: { step: 1 | 2 | 3 }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createInventoryImportStyles);
  const steps = ["Select", "Review", "Import"];
  return (
    <View accessibilityLabel={`Import step ${step} of 3`} style={styles.stepper}>
      {steps.map((label, index) => {
        const active = step >= index + 1;
        return (
          <View key={label} style={styles.stepItem}>
            <View style={[styles.stepDot, active && styles.stepDotActive]}>
              {active && index + 1 < step ? <Check color={colors.text.onPrimary} size={13} strokeWidth={3} /> : <Text style={[styles.stepNumber, active && styles.stepNumberActive]}>{index + 1}</Text>}
            </View>
            <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
            {index < steps.length - 1 ? <View style={[styles.stepLine, step > index + 1 && styles.stepLineActive]} /> : null}
          </View>
        );
      })}
    </View>
  );
}

export function StoreContext({
  store,
  disabled,
  onPress,
}: {
  store: OwnerStore;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createInventoryImportStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Importing to ${store.storeName}`}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.storeContext, pressed && !disabled && styles.pressed, disabled && styles.disabled]}
    >
      <Store color={colors.primary[600]} size={20} />
      <View style={styles.storeCopy}>
        <Text style={styles.storeCaption}>Importing to</Text>
        <Text style={styles.storeName}>{store.storeName}</Text>
      </View>
      {!disabled ? <ChevronDown color={colors.text.secondary} size={18} /> : null}
    </Pressable>
  );
}

export function SelectedFileCard({
  file,
  detectedCount,
  parsing,
  onChange,
  onRemove,
}: {
  file: { name: string; type: string; size: number | null };
  detectedCount?: number;
  parsing: boolean;
  onChange: () => void;
  onRemove: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createInventoryImportStyles);
  return (
    <Card style={styles.fileCard}>
      <View style={styles.fileHeading}>
        <View style={styles.fileIcon}><FileText color={colors.primary[600]} size={22} /></View>
        <View style={styles.fileCopy}>
          <Text numberOfLines={1} style={styles.fileName}>{file.name}</Text>
          <Text style={styles.fileMeta}>{file.type} · {formatFileSize(file.size)}</Text>
        </View>
      </View>
      {parsing ? (
        <View style={styles.processingRow}>
          <ActivityIndicator color={colors.primary[600]} size="small" />
          <Text style={styles.processingText}>Preparing product preview...</Text>
        </View>
      ) : detectedCount === undefined ? null : (
        <Text style={styles.detected}>{detectedCount.toLocaleString()} {detectedCount === 1 ? "product" : "products"} detected</Text>
      )}
      {!parsing ? (
        <View style={styles.fileActions}>
          <Button title="Change File" variant="secondary" size="sm" onPress={onChange} style={styles.flexButton} />
          <Button title="Remove File" variant="ghost" size="sm" icon={Trash2} onPress={onRemove} style={styles.flexButton} />
        </View>
      ) : null}
    </Card>
  );
}

export function StorePicker({
  visible,
  stores,
  selected,
  onClose,
  onSelect,
}: {
  visible: boolean;
  stores: OwnerStore[];
  selected: OwnerStore;
  onClose: () => void;
  onSelect: (store: OwnerStore) => void;
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createInventoryImportStyles);
  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView edges={["bottom"]} style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Choose Store</Text>
            <IconButton icon={X} label="Close store selection" onPress={onClose} />
          </View>
          <Text style={styles.sheetCopy}>Imported products stay isolated in the store you choose.</Text>
          {stores.map((store) => {
            const active = store.businessId === selected.businessId && store.storeId === selected.storeId;
            return (
              <Pressable
                key={`${store.businessId}:${store.storeId}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => { onSelect(store); onClose(); }}
                style={({ pressed }) => [styles.storeOption, active && styles.storeOptionActive, pressed && styles.pressed]}
              >
                <Store color={active ? colors.primary[600] : colors.text.secondary} size={19} />
                <Text style={[styles.storeOptionLabel, active && styles.storeOptionLabelActive]}>{store.storeName}</Text>
                {active ? <Check color={colors.primary[600]} size={18} strokeWidth={3} /> : null}
              </Pressable>
            );
          })}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function MappingPicker({
  visible,
  selected,
  onClose,
  onSelect,
}: {
  visible: boolean;
  selected: InventoryFileImportField;
  onClose: () => void;
  onSelect: (field: InventoryFileImportField) => void;
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createInventoryImportStyles);
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.mappingMenu} onPress={() => undefined}>
          {inventoryFileImportFields.map((field) => (
            <Pressable
              key={field}
              accessibilityRole="radio"
              accessibilityState={{ selected: field === selected }}
              onPress={() => { onSelect(field); onClose(); }}
              style={({ pressed }) => [styles.mappingOption, pressed && styles.pressed]}
            >
              <Text style={[styles.mappingOptionLabel, field === selected && { color: colors.primary[700] }]}>{inventoryFileImportFieldLabels[field]}</Text>
              {field === selected ? <Check color={colors.primary[600]} size={18} /> : null}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function FieldMapping({
  mapping,
  error,
  saving,
  onSave,
}: {
  mapping: InventoryFileImportFieldMapping[];
  error: string;
  saving: boolean;
  onSave: (mapping: InventoryFileImportFieldMapping[]) => void;
}) {
  const styles = useThemeStyles(createInventoryImportStyles);
  const [draft, setDraft] = useState(mapping);
  const [openColumn, setOpenColumn] = useState<number | null>(null);
  useEffect(() => setDraft(mapping), [mapping]);
  const selected = draft.find(({ column }) => column === openColumn)?.field ?? "ignore";
  return (
    <View style={styles.sectionGap}>
      <View style={styles.mappingIntro}>
        <Text style={styles.sectionTitle}>Match file columns</Text>
        <Text style={styles.copy}>Choose where StockPilot should find each product detail. Product Name and Quantity are required.</Text>
      </View>
      <Card style={styles.mappingCard}>
        {draft.map((entry) => (
          <View key={entry.column} style={styles.mappingRow}>
            <Text numberOfLines={1} style={styles.mappingSource}>{entry.label}</Text>
            <Text style={styles.mappingArrow}>→</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Map ${entry.label} to ${inventoryFileImportFieldLabels[entry.field]}`}
              onPress={() => setOpenColumn(entry.column)}
              style={({ pressed }) => [styles.mappingSelect, pressed && styles.pressed]}
            >
              <Text numberOfLines={1} style={styles.mappingSelectText}>{inventoryFileImportFieldLabels[entry.field]}</Text>
              <ChevronDown size={16} />
            </Pressable>
          </View>
        ))}
      </Card>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      <Button title="Review Products" loading={saving} onPress={() => onSave(draft)} />
      <MappingPicker
        visible={openColumn !== null}
        selected={selected}
        onClose={() => setOpenColumn(null)}
        onSelect={(field) => setDraft((rows) => rows.map((row) => row.column === openColumn ? { ...row, field } : row))}
      />
    </View>
  );
}
