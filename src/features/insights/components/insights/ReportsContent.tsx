import { CalendarDays, ChevronRight, Download, FileText, RefreshCw } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/domain/currency";
import type { OwnerStore } from "@/services/owner-store.service";
import { getInsightReportTitle, insightReportOptions, type InsightFilters, type InsightReport, type InsightReportType, type StoreInsights } from "@/services/insights";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";

import { createInsightsStyles } from "./insights.styles";
import { EmptyCopy } from "./InsightBasics";
import { ReportFilters } from "./ReportFilters";

type Props = { reports: InsightReport[]; data: StoreInsights; ownerStore: OwnerStore; ownerStores: OwnerStore[]; filters: InsightFilters; onFiltersChange: (next: Partial<InsightFilters>) => void; onGenerate: (type: InsightReportType) => void; onSelectReport: (report: InsightReport) => void; onExport: () => void; generating: boolean };

export default function ReportsContent({ reports, data, ownerStore, ownerStores, filters, onFiltersChange, onGenerate, onSelectReport, onExport, generating }: Props) {
  const styles = useThemeStyles(createInsightsStyles); const colors = useTheme().colors;
  return <><Card style={styles.card}><View style={styles.row}><View style={{ flex: 1, gap: 2 }}><Text style={styles.sectionTitle}>Reports</Text><Text style={styles.sectionSubtitle}>Create reports from inventory and completed POS sales.</Text></View><FileText size={20} color={colors.primary[600]} /></View><ReportFilters ownerStore={ownerStore} ownerStores={ownerStores} filters={filters} onChange={onFiltersChange} /><View style={styles.reportMetrics}><Metric label="Sales Revenue" value={formatCurrency(data.revenue.total, data.currency)} styles={styles} /><Metric label="Items Sold" value={String(data.revenue.unitsSold)} styles={styles} /><Metric label="Inventory Retail Value" value={formatCurrency(data.inventory.sellingValue, data.currency)} styles={styles} /><Metric label="Potential Gross Profit" value={formatCurrency(data.inventory.potentialGrossMargin, data.currency)} styles={styles} /></View><Button title="Export selected period as Excel" icon={Download} onPress={onExport} /><Text style={styles.caption}>Excel includes valuation, sales by day / week / month / store, top-selling products, categories, movements, and stock health.</Text></Card><Card style={styles.card}><Text style={styles.sectionTitle}>Report types</Text>{insightReportOptions.map(({ type, description }) => <Pressable key={type} accessibilityRole="button" onPress={() => onGenerate(type)} style={styles.reportRow}><View style={styles.reportIcon}><FileText size={18} color={colors.primary[600]} /></View><View style={styles.reportCopy}><Text style={styles.reportTitle}>{getInsightReportTitle(type)}</Text><Text style={styles.reportDescription}>{description}</Text></View>{generating ? <RefreshCw size={17} color={colors.text.muted} /> : <ChevronRight size={18} color={colors.text.muted} />}</Pressable>)}</Card><Card style={styles.card}><View style={styles.row}><View style={{ flex: 1, gap: 2 }}><Text style={styles.sectionTitle}>Report history</Text><Text style={styles.sectionSubtitle}>Saved on this device for this store.</Text></View><CalendarDays size={18} color={colors.text.muted} /></View>{reports.slice(0, 5).map((report) => <Pressable key={report.id} onPress={() => onSelectReport(report)} style={styles.reportRow}><View style={styles.reportIcon}><FileText size={17} color={colors.primary[600]} /></View><View style={styles.reportCopy}><Text style={styles.reportTitle}>{report.title}</Text><Text style={styles.reportDescription}>{report.storeName} · {report.periodLabel} · {new Date(report.createdAt).toLocaleDateString()}</Text></View><ChevronRight size={18} color={colors.text.muted} /></Pressable>)}{!reports.length ? <EmptyCopy title="No saved reports" copy="Generated reports will appear here and remain stored locally for this store." /> : null}</Card></>;
}

function Metric({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof createInsightsStyles> }) {
  return <View style={styles.reportMetric}><Text style={styles.reportDescription}>{label}</Text><Text style={styles.reportMetricValue}>{value}</Text></View>;
}
