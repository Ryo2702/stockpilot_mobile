import { Archive, ChevronLeft, History, Pencil } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, type CurrencySettings } from "@/domain/currency";
import { getProductStockStatus, type Product, type ProductStockMovement } from "@/domain/product";
import { control, radii, spacing, typography, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";

import { getCatalogCategoryOption } from "../data/catalog.data";

const noHistoryMascot = require("../../../../assets/images/stockpilot/empty state png/footprint.png");

type ProductDetailsModalProps = {
  visible: boolean;
  product: Product | null;
  currency: CurrencySettings;
  movements: ProductStockMovement[];
  loadingHistory: boolean;
  error?: string;
  onClose: () => void;
  onEdit: () => void;
  onArchive: () => void;
};

export default function ProductDetailsModal({
  visible,
  product,
  currency,
  movements,
  loadingHistory,
  error,
  onClose,
  onEdit,
  onArchive,
}: ProductDetailsModalProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const [historyVisible, setHistoryVisible] = useState(false);

  useEffect(() => setHistoryVisible(false), [product?.id, visible]);

  if (!product) return null;
  const category = getCatalogCategoryOption(product.category);
  const status = getProductStockStatus(product.quantity, product.reorderLevel);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <IconButton icon={ChevronLeft} label="Close item details" onPress={onClose} />
          <Text style={styles.headerTitle}>Item Details</Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <View style={styles.identity}>
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.identifier}>SKU: {product.sku ?? "—"}</Text>
            <Text style={styles.identifier}>Barcode: {product.barcode ?? "—"}</Text>
          </View>

          <View style={styles.stockCard}>
            <Text style={styles.sectionLabel}>Current Stock</Text>
            <Text style={styles.quantity}>{product.quantity} {product.unit}</Text>
            <StatusBadge status={status} />
          </View>

          <View style={styles.detailsCard}>
            <Detail label="Category" value={category.label} />
            <Detail label="Unit" value={product.unit} />
            <Detail
              label="Current Price"
              value={product.currentPrice === null ? "—" : formatCurrency(product.currentPrice, currency)}
            />
            <Detail label="Reorder Level" value={`${product.reorderLevel} ${product.unit}`} />
            <Detail label="Critical Level" value={`${product.criticalLevel} ${product.unit}`} />
            <Detail label="Notes" value={product.notes || "—"} />
          </View>

          <Button
            title={historyVisible ? "Hide Stock History" : "View Stock History"}
            icon={History}
            variant="secondary"
            onPress={() => setHistoryVisible((current) => !current)}
          />
          {historyVisible ? (
            <View style={styles.historyCard}>
              <Text style={styles.historyTitle}>Stock History</Text>
              {loadingHistory ? (
                <ActivityIndicator color={colors.primary[600]} />
              ) : movements.length ? (
                movements.map((movement) => (
                  <View key={movement.id} style={styles.movementRow}>
                    <View style={styles.movementCopy}>
                      <Text style={styles.movementReason}>{formatReason(movement.reason)}</Text>
                      <Text style={styles.movementDate}>{formatDate(movement.createdAt)}</Text>
                    </View>
                    <Text style={styles.movementDelta}>
                      {movement.delta > 0 ? "+" : ""}{movement.delta} {product.unit}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.historyEmpty}>
                  <Image
                    accessible={false}
                    source={noHistoryMascot}
                    resizeMode="contain"
                    style={styles.historyEmptyImage}
                  />
                  <Text style={styles.movementDate}>No stock movements recorded.</Text>
                </View>
              )}
            </View>
          ) : null}

          <Button title="Edit Item" icon={Pencil} onPress={onEdit} />
          <Button title="Archive Item" icon={Archive} variant="danger" onPress={onArchive} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const styles = useThemeStyles(createStyles);

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function formatReason(reason: string) {
  return reason.replaceAll("_", " ").replace(/^./, (first) => first.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
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
  headerTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  content: {
    gap: spacing[4],
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    padding: spacing[4],
    paddingBottom: spacing[10],
  },
  scroll: {
    flex: 1,
  },
  identity: {
    gap: spacing[1],
  },
  name: {
    ...typography.h2,
    color: colors.text.primary,
  },
  identifier: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  stockCard: {
    gap: spacing[2],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.lg,
    backgroundColor: colors.background.surface,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  quantity: {
    ...typography.h1,
    color: colors.text.primary,
  },
  detailsCard: {
    gap: spacing[3],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.lg,
    backgroundColor: colors.background.surface,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing[3],
  },
  detailLabel: {
    ...typography.bodySmall,
    minWidth: 0,
    flex: 1,
    flexShrink: 1,
    color: colors.text.muted,
  },
  detailValue: {
    ...typography.bodySmall,
    minWidth: 0,
    flex: 1,
    color: colors.text.primary,
    textAlign: "right",
  },
  historyCard: {
    gap: spacing[3],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.lg,
    backgroundColor: colors.background.surface,
  },
  historyTitle: {
    ...typography.label,
    color: colors.text.primary,
  },
  historyEmpty: {
    alignItems: "center",
    gap: spacing[2],
  },
  historyEmptyImage: {
    width: 88,
    height: 88,
    backgroundColor: colors.background.surface,
  },
  movementRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
  },
  movementCopy: {
    minWidth: 0,
    flex: 1,
  },
  movementReason: {
    ...typography.bodySmall,
    color: colors.text.primary,
    textTransform: "capitalize",
  },
  movementDate: {
    ...typography.caption,
    color: colors.text.muted,
  },
  movementDelta: {
    ...typography.label,
    color: colors.text.primary,
  },
  error: {
    ...typography.bodySmall,
    color: colors.semantic.danger,
    textAlign: "center",
  },
});
