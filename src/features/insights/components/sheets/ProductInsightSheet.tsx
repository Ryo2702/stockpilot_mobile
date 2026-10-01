import { ScrollView, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { type InsightProduct } from "@/services/insights";
import { spacing, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import { SheetFrame } from "./SheetFrame";
import { createSheetStyles } from "./sheet.styles";
import { formatQuantity } from "./sheet.utils";

function StatusPill({ status }: { status: InsightProduct["stockStatus"] }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createSheetStyles);
  const statusStyle = status === "healthy" ? { backgroundColor: colors.semantic.successBackground, color: colors.semantic.success } : status === "low" ? { backgroundColor: colors.semantic.warningBackground, color: colors.semantic.warning } : { backgroundColor: colors.semantic.dangerBackground, color: colors.semantic.danger };
  return <View style={[styles.statusPill, { backgroundColor: statusStyle.backgroundColor }]}><Text style={[styles.statusText, { color: statusStyle.color }]}>{status === "low" ? "Low stock" : status === "critical" ? "Critical" : "Healthy"}</Text></View>;
}

export function ProductInsightSheet({ product, onClose, onViewInventory }: { product: InsightProduct | null; onClose: () => void; onViewInventory: () => void }) {
  const styles = useThemeStyles(createSheetStyles);
  const { colors } = useTheme();
  return <SheetFrame visible={Boolean(product)} onClose={onClose} title="Product Insight">{product ? <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing[4] }}>
    <View style={styles.productHeader}><Text style={styles.productTitle}>{product.name}</Text>{product.sku ? <Text style={styles.meta}>SKU: {product.sku}</Text> : null}<StatusPill status={product.stockStatus} /></View>
    <View style={styles.summaryGrid}><View style={styles.summaryTile}><Text style={styles.summaryLabel}>Current Stock</Text><Text style={styles.summaryValue}>{formatQuantity(product.quantity, product.unit)}</Text></View><View style={styles.summaryTile}><Text style={styles.summaryLabel}>Reorder Level</Text><Text style={styles.summaryValue}>{formatQuantity(product.reorderLevel, product.unit)}</Text></View><View style={styles.summaryTile}><Text style={styles.summaryLabel}>Average Daily Out</Text><Text style={styles.summaryValue}>{product.averageDailyOut !== null ? `${product.averageDailyOut.toFixed(1)} ${product.unit}/day` : "—"}</Text></View><View style={styles.summaryTile}><Text style={styles.summaryLabel}>Estimated Remaining</Text><Text style={styles.summaryValue}>{product.quantity === 0 ? "Out of stock" : product.estimatedDaysRemaining === null ? "Not enough data" : `~${Math.max(1, Math.ceil(product.estimatedDaysRemaining))} days`}</Text></View></View>
    <View style={{ gap: spacing[2] }}><Text style={styles.fieldLabel}>Restock calculation</Text><Text style={styles.explanation}>{product.recommendedRestock === null ? "No recent outgoing movement is available to estimate a 14-day restock quantity." : `A 14-day target based on the last 30 days of outgoing movement is ${formatQuantity(product.recommendedRestock, product.unit)} to restock.`}</Text><Text style={[styles.explanation, { color: colors.text.muted }]}>This estimate is calculated from recorded Stock Out movements and current quantity.</Text></View>
    <View style={styles.buttonRow}><Button title="View Inventory" onPress={onViewInventory} style={styles.button} /><Button title="Close" variant="secondary" onPress={onClose} style={styles.button} /></View>
  </ScrollView> : null}</SheetFrame>;
}
