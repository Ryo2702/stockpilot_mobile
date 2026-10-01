import { ScrollView, Text, View } from "react-native";
import { type CurrencySettings } from "@/domain/currency";
import { type InsightReport } from "@/services/insights";
import { spacing, useThemeStyles } from "@/theme";
import { SheetFrame } from "./SheetFrame";
import { createSheetStyles } from "./sheet.styles";
import { ReportListsSection } from "./ReportListsSection";
import { ReportSummarySection } from "./ReportSummarySection";

export function ReportDetailSheet({ report, currency, onClose }: { report: InsightReport | null; currency?: CurrencySettings; onClose: () => void }) {
  const styles = useThemeStyles(createSheetStyles);
  const reportCurrency = currency ?? { currencyMode: "iso" as const, currencyCode: "PHP", currencyDecimalPlaces: 2 };
  return <SheetFrame visible={Boolean(report)} onClose={onClose} title="Report Detail">{report ? <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing[4] }}>
    <View style={styles.productHeader}><Text style={styles.reportHeading}>{report.title}</Text><Text style={styles.reportPeriod}>{report.storeName} · {report.periodLabel}</Text><Text style={styles.reportTimestamp}>Saved {new Date(report.createdAt).toLocaleString()}</Text></View>
    <ReportSummarySection report={report} currency={reportCurrency} /><ReportListsSection report={report} />
  </ScrollView> : null}</SheetFrame>;
}
