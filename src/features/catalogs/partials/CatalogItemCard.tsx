import { Archive, Pencil, RotateCcw } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getProductStockStatus, type Product } from "@/domain/product";
import { colors, radii, spacing, typography } from "@/theme";

import { getCatalogCategoryOption } from "../catalog.data";

type CatalogItemCardProps = {
  product: Product;
  archived?: boolean;
  onOpen?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
};

export default function CatalogItemCard({
  product,
  archived = false,
  onOpen,
  onEdit,
  onArchive,
  onRestore,
}: CatalogItemCardProps) {
  const category = getCatalogCategoryOption(product.category);
  const CategoryIcon = category.icon;
  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.categoryIcon}>
          <CategoryIcon color={colors.primary[700]} size={19} />
        </View>
        {onOpen && !archived ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${product.name} details`}
            onPress={onOpen}
            style={({ pressed }) => [styles.copy, pressed && styles.pressed]}
          >
            <Text numberOfLines={1} style={styles.name}>{product.name}</Text>
            <Text numberOfLines={1} style={styles.identifier}>
              {product.sku ? `SKU ${product.sku}` : product.barcode ? `Barcode ${product.barcode}` : "No SKU or barcode"}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.copy}>
            <Text numberOfLines={1} style={styles.name}>{product.name}</Text>
            <Text numberOfLines={1} style={styles.identifier}>
              {product.sku ? `SKU ${product.sku}` : product.barcode ? `Barcode ${product.barcode}` : "No SKU or barcode"}
            </Text>
          </View>
        )}
        {!archived && onEdit ? (
          <IconButton icon={Pencil} label={`Edit ${product.name}`} onPress={onEdit} />
        ) : null}
        {!archived && onArchive ? (
          <IconButton
            icon={Archive}
            label={`Archive ${product.name}`}
            onPress={onArchive}
            variant="danger"
          />
        ) : null}
        {archived && onRestore ? (
          <IconButton icon={RotateCcw} label={`Restore ${product.name}`} onPress={onRestore} />
        ) : null}
      </View>
      <View style={styles.details}>
        <Text style={styles.category}>{category.label}</Text>
        <Text style={styles.stockText}>
          {product.quantity} {product.unit} in stock
        </Text>
      </View>
      <View style={styles.statusRow}>
        <StatusBadge status={getProductStockStatus(product.quantity, product.reorderLevel)} />
        <Text style={styles.thresholds}>
          Reorder at {product.reorderLevel} {product.unit}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[3],
  },
  pressed: {
    opacity: 0.75,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  categoryIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[1],
    borderRadius: radii.md,
    backgroundColor: colors.primary[50],
  },
  copy: {
    minWidth: 0,
    flex: 1,
  },
  name: {
    ...typography.label,
    color: colors.text.primary,
  },
  identifier: {
    ...typography.caption,
    color: colors.text.muted,
  },
  details: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  category: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  stockText: {
    ...typography.label,
    color: colors.text.primary,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[2],
  },
  thresholds: {
    ...typography.caption,
    color: colors.text.muted,
  },
});
