import { MoreVertical } from "lucide-react-native";
import { Text, View } from "react-native";
import { formatCurrency, type CurrencySettings } from "@/domain/currency";
import { catalogCategoryOptions } from "@/data/catalog.data";
import { type InsightReport } from "@/services/insights";
import { spacing, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import { createSheetStyles } from "./sheet.styles";
import { formatNumber, formatQuantity } from "./sheet.utils";

export function ReportListsSection({ report, currency }: { report: InsightReport; currency: CurrencySettings }) {
  const styles = useThemeStyles(createSheetStyles);
  const { colors } = useTheme();
  return <>{report.summary.recentMovements.length ? <View style={{ gap: spacing[2] }}><Text style={styles.fieldLabel}>Recent movement reasons</Text>{report.summary.recentMovements.map((movement, index) => <View key={`${movement.productName}-${movement.createdAt}-${index}`} style={styles.categoryMetricRow}><View style={{ flex: 1, gap: 2 }}><Text style={styles.categoryMetricLabel}>{movement.productName} · {movement.type.replaceAll("_", " ")}</Text><Text style={styles.reportTimestamp}>{movement.reason} · {new Date(movement.createdAt).toLocaleString()}</Text></View><Text style={styles.categoryMetricValue}>{movement.delta > 0 ? "+" : "−"}{formatQuantity(Math.abs(movement.delta), movement.unit)}</Text></View>)}</View> : null}
    {report.summary.topSelling?.length ? <MetricList title="Top Selling Products" items={report.summary.topSelling.map((product) => [product.name, `${formatQuantity(product.unitsSold, product.unit)} · ${formatCurrency(product.revenue, currency)}`])} styles={styles} /> : null}
    <View style={{ gap: spacing[2] }}><Text style={styles.fieldLabel}>Top Stock Movement Products</Text>{report.summary.topMoving.length ? report.summary.topMoving.map((product, index) => <View key={`${product.name}-${index}`} style={styles.categoryMetricRow}><Text style={styles.categoryMetricLabel}>{product.name}</Text><Text style={styles.categoryMetricValue}>{formatQuantity(product.stockOut, product.unit)}</Text></View>) : <Text style={styles.explanation}>No Stock Out movements were recorded for this period.</Text>}<Text style={styles.reportTimestamp}>{report.summary.noMovementCount} products had no movement in the last 30 days.</Text></View>
    {report.summary.slowMoving.length ? <MetricList title="Slow Moving Products" items={report.summary.slowMoving.map((product) => [product.name, formatQuantity(product.stockOut, product.unit)])} styles={styles} /> : null}
    {report.summary.noMovement.length ? <MetricList title="No Movement · 30 Days" items={report.summary.noMovement.map((product) => [product.name, product.lastMovementAt ? new Date(product.lastMovementAt).toLocaleDateString() : "No movement recorded"])} styles={styles} /> : null}
    {report.summary.criticalProducts.length ? <MetricList title="Out of Stock Products" items={report.summary.criticalProducts.map((product) => [product.name, formatQuantity(product.quantity, product.unit)])} styles={styles} /> : null}
    {report.summary.lowProducts.length ? <MetricList title="Low Stock Products" items={report.summary.lowProducts.map((product) => [product.name, formatQuantity(product.quantity, product.unit)])} styles={styles} /> : null}
    {report.summary.categories.length ? <MetricList title="Category Breakdown" items={report.summary.categories.map((category) => [catalogCategoryOptions.find((item) => item.value === category.category)?.label ?? category.category, `${category.products} items · ${formatNumber(category.stockOut)} out`])} styles={styles} /> : null}
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2] }}><MoreVertical size={16} color={colors.text.muted} /><Text style={styles.reportTimestamp}>This saved report stays in this store's local history.</Text></View></>;
}

function MetricList({ title, items, styles }: { title: string; items: string[][]; styles: ReturnType<typeof createSheetStyles> }) {
  return <View style={{ gap: spacing[2] }}><Text style={styles.fieldLabel}>{title}</Text>{items.map(([label, value], index) => <View key={`${label}-${index}`} style={styles.categoryMetricRow}><Text style={styles.categoryMetricLabel}>{label}</Text><Text style={styles.categoryMetricValue}>{value}</Text></View>)}</View>;
}
