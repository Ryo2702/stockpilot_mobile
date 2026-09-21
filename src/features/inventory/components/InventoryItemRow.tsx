import { ChevronRight } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { StatusBadge } from "@/components/ui/StatusBadge";
import type { InventoryItem } from "@/domain/inventory";
import { getProductStockStatus } from "@/domain/product";
import { radii, spacing, typography, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";

import { getCatalogCategoryOption } from "@/features/catalogs/data/catalog.data";

type InventoryItemRowProps = {
  item: InventoryItem;
  archived?: boolean;
  onPress: () => void;
};

export default function InventoryItemRow({ item, archived = false, onPress }: InventoryItemRowProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const category = getCatalogCategoryOption(item.category);
  const status = getProductStockStatus(item.quantity, item.reorderLevel);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${item.quantity} ${item.unit}, ${status}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.product}>
        <Text numberOfLines={1} style={styles.name}>{item.name}</Text>
        <Text numberOfLines={1} style={styles.meta}>
          {item.sku ? `SKU: ${item.sku}` : "No SKU"}
          {item.barcode ? ` · Barcode: ${item.barcode}` : ""}
          {` · ${category.label}`}
        </Text>
        <View style={styles.statusRow}>
          {archived ? (
            <Text style={styles.archived}>Archived</Text>
          ) : (
            <StatusBadge
              status={status}
              label={status === "low" ? "Low" : status === "critical" ? "Critical" : "Healthy"}
            />
          )}
          <Text numberOfLines={1} style={styles.reorder}>Reorder at {item.reorderLevel} {item.unit}</Text>
        </View>
      </View>
      <View style={styles.quantity}>
        <Text numberOfLines={1} style={styles.quantityValue}>{item.quantity.toLocaleString()}</Text>
        <Text style={styles.unit}>{item.unit}</Text>
      </View>
      <ChevronRight color={colors.text.muted} size={18} />
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
  },
  pressed: { opacity: 0.74 },
  product: { minWidth: 0, flex: 1, gap: spacing[1] },
  name: { ...typography.label, color: colors.text.primary, fontWeight: "600" },
  meta: { ...typography.caption, color: colors.text.muted },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing[2],
    marginTop: spacing[1],
  },
  reorder: { ...typography.caption, flexShrink: 1, color: colors.text.secondary },
  archived: { ...typography.caption, color: colors.text.muted, fontWeight: "600" },
  quantity: { minWidth: 48, alignItems: "flex-end" },
  quantityValue: { ...typography.title, color: colors.text.primary, fontVariant: ["tabular-nums"] },
  unit: { ...typography.caption, color: colors.text.secondary },
});
