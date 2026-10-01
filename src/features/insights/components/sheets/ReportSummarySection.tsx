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
  return <><View style={styles.summaryGrid}><SummaryTile label="Total Products" value={report.summary.health.total} /><SummaryTile label="Low Stock" value={report.summary.health.low} color={colors.semantic.warning} /><SummaryTile label="Critical" value={report.summary.health.critical} color={colors.semantic.danger} /><SummaryTile label="Net Movement" value={`${report.summary.movement.net > 0 ? "+" : ""}${report.summary.movement.net}`} />{report.summary.revenue ? <SummaryTile label="Revenue" value={formatCurrency(report.summary.revenue.total, currency)} color={colors.semantic.success} /> : null}</View>
    <View style={{ gap: spacing[2] }}><Text style={styles.fieldLabel}>Period findings</Text><Text style={styles.explanation}>{movementFinding("Stock In", report.summary.movement.stockIn, report.summary.previousMovement.stockIn, comparison)}</Text><Text style={styles.explanation}>{movementFinding("Stock Out", report.summary.movement.stockOut, report.summary.previousMovement.stockOut, comparison)}</Text>{report.summary.previousMonthHealth ? <Text style={styles.explanation}>Critical products: {report.summary.previousMonthHealth.critical} → {report.summary.health.critical} · Low stock: {report.summary.previousMonthHealth.low} → {report.summary.health.low} compared with the previous month’s snapshot.</Text> : <Text style={styles.explanation}>No previous monthly health snapshot is available for comparison.</Text>}</View>
    {report.summary.revenue ? <View style={{ gap: spacing[2] }}><Text style={styles.fieldLabel}>Revenue</Text><View style={styles.categoryMetricRow}><Text style={styles.categoryMetricLabel}>Completed sales</Text><Text style={styles.categoryMetricValue}>{Number(report.summary.revenue.transactions ?? 0)}</Text></View><View style={styles.categoryMetricRow}><Text style={styles.categoryMetricLabel}>Average sale</Text><Text style={styles.categoryMetricValue}>{formatCurrency(report.summary.revenue.transactions ? report.summary.revenue.total / report.summary.revenue.transactions : 0, currency)}</Text></View>{report.summary.previousRevenue ? <Text style={styles.explanation}>{revenueFinding(report.summary.revenue.total, report.summary.previousRevenue.total, comparison)}</Text> : null}</View> : null}
    <View style={{ gap: spacing[2] }}><Text style={styles.fieldLabel}>Stock Movement</Text>{[["Stock In", formatNumber(report.summary.movement.stockIn)], ["Stock Out", formatNumber(report.summary.movement.stockOut)], ["Adjustments", formatNumber(report.summary.movement.adjustments)]].map(([label, value]) => <View key={label} style={styles.categoryMetricRow}><Text style={styles.categoryMetricLabel}>{label}</Text><Text style={styles.categoryMetricValue}>{value}</Text></View>)}</View></>;
}
