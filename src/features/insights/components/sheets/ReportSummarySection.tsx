import { Text, View } from "react-native";
import { formatCurrency, type CurrencySettings } from "@/domain/currency";
import { type InsightReport } from "@/services/insights";
import { spacing, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import { createSheetStyles } from "./sheet.styles";
import { formatNumber, movementFinding, revenueFinding } from "./sheet.utils";

function SummaryTile({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const styles = useThemeStyles(createSheetStyles);
  return <View style={styles.summaryTile}><Text style={styles.summaryLabel}>{label}</Text><Text style={[styles.summaryValue, color ? { color } : null]}>{value}</Text></View>;
}

export function ReportSummarySection({ report, currency }: { report: InsightReport; currency: CurrencySettings }) {
  const styles = useThemeStyles(createSheetStyles);
  const { colors } = useTheme();
  const comparison = report.summary.comparisonLabel.replace(/^vs /, "");
  const inventory = report.summary.inventory;
  const revenue = report.summary.revenue;
  return <><View style={styles.summaryGrid}><SummaryTile label="Total Products" value={report.summary.health.total} /><SummaryTile label="Total Units" value={inventory?.totalUnits ?? "—"} /><SummaryTile label="Low Stock" value={report.summary.health.low} color={colors.semantic.warning} /><SummaryTile label="Out of Stock" value={report.summary.health.outOfStock ?? report.summary.health.critical} color={colors.semantic.danger} />{revenue ? <SummaryTile label="Gross Sales" value={formatCurrency(revenue.total, currency)} color={colors.semantic.success} /> : null}</View>
    {inventory ? <View style={{ gap: spacing[2] }}><Text style={styles.fieldLabel}>Inventory valuation</Text><MetricRow label="Cost value" value={formatCurrency(inventory.costValue, currency)} /><MetricRow label="Selling value · theoretical" value={formatCurrency(inventory.sellingValue, currency)} /><MetricRow label="Potential gross margin · theoretical" value={formatCurrency(inventory.potentialGrossMargin, currency)} /><Text style={styles.explanation}>{inventory.missingCostPrices || inventory.missingSellingPrices ? `${inventory.missingCostPrices} products are missing cost prices and ${inventory.missingSellingPrices} are missing selling prices.` : "All active products have both inventory prices."}</Text></View> : null}
    <View style={{ gap: spacing[2] }}><Text style={styles.fieldLabel}>Period findings</Text><Text style={styles.explanation}>{movementFinding("Stock In", report.summary.movement.stockIn, report.summary.previousMovement.stockIn, comparison)}</Text><Text style={styles.explanation}>{movementFinding("Stock Out", report.summary.movement.stockOut, report.summary.previousMovement.stockOut, comparison)}</Text>{report.summary.previousMonthHealth ? <Text style={styles.explanation}>Out-of-stock products: {report.summary.previousMonthHealth.outOfStock ?? report.summary.previousMonthHealth.critical} → {report.summary.health.outOfStock ?? report.summary.health.critical} · Low stock: {report.summary.previousMonthHealth.low} → {report.summary.health.low} compared with the previous month&apos;s snapshot.</Text> : <Text style={styles.explanation}>No previous monthly health snapshot is available for comparison.</Text>}</View>
    {revenue ? <View style={{ gap: spacing[2] }}><Text style={styles.fieldLabel}>Sales analytics</Text><MetricRow label="Completed sales" value={String(revenue.transactions ?? 0)} /><MetricRow label="Units sold" value={String(revenue.unitsSold ?? 0)} /><MetricRow label="Average transaction value" value={formatCurrency(revenue.averageTransactionValue ?? (revenue.transactions ? revenue.total / revenue.transactions : 0), currency)} />{report.summary.previousRevenue ? <Text style={styles.explanation}>{revenueFinding(revenue.total, report.summary.previousRevenue.total, comparison)}</Text> : null}</View> : null}
    <View style={{ gap: spacing[2] }}><Text style={styles.fieldLabel}>Stock Movement</Text>{[["Stock In", formatNumber(report.summary.movement.stockIn)], ["Stock Out", formatNumber(report.summary.movement.stockOut)], ["Adjustments", formatNumber(report.summary.movement.adjustments)]].map(([label, value]) => <View key={label} style={styles.categoryMetricRow}><Text style={styles.categoryMetricLabel}>{label}</Text><Text style={styles.categoryMetricValue}>{value}</Text></View>)}</View></>;
}

function MetricRow({ label, value }: { label: string; value: string }) {
  const styles = useThemeStyles(createSheetStyles);
  return <View style={styles.categoryMetricRow}><Text style={styles.categoryMetricLabel}>{label}</Text><Text style={styles.categoryMetricValue}>{value}</Text></View>;
}
