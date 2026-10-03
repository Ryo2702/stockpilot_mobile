import { TrendingUp } from "lucide-react-native";
import { Text, View } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";

import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/domain/currency";
import type { StoreInsights } from "@/services/insights";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";

import { createInsightsStyles } from "./insights.styles";
import { revenueChange } from "./insights.utils";

export function RevenueSummary({ data }: { data: StoreInsights }) {
  const styles = useThemeStyles(createInsightsStyles); const { colors } = useTheme(); const total = Number(data.revenue?.total ?? 0); const transactions = Number(data.revenue?.transactions ?? 0); const previous = Number(data.previousRevenue?.total ?? 0); const average = transactions ? total / transactions : 0;
  return <Card style={styles.card} accessibilityLabel="Revenue summary"><View style={styles.row}><View style={{ flex: 1, gap: 2 }}><Text style={styles.sectionTitle}>Sales Revenue</Text><Text style={styles.sectionSubtitle}>Completed POS sales for {data.period.label.toLowerCase()}</Text></View><TrendingUp size={19} color={colors.primary[600]} /></View><Text style={styles.revenueValue}>{formatCurrency(total, data.currency)}</Text><Text style={styles.revenueMeta}>{transactions} completed {transactions === 1 ? "sale" : "sales"} · {data.revenue.unitsSold} items sold · Average {formatCurrency(average, data.currency)}</Text><Text style={[styles.revenueChange, { color: total >= previous ? colors.semantic.success : colors.semantic.danger }]}>{revenueChange(total, previous, data.period.comparisonLabel.replace(/^vs /, ""))}</Text><Text style={styles.caption}>Sales revenue is calculated from completed POS transaction totals.</Text></Card>;
}

export function RevenueGraph({ data }: { data: StoreInsights }) {
  const styles = useThemeStyles(createInsightsStyles); const { colors } = useTheme(); const width = 320; const height = 170; const left = 24; const right = 8; const top = 12; const bottom = 28; const chartWidth = width - left - right; const chartHeight = height - top - bottom; const max = Math.max(1, ...data.monthlyRevenue.map((month) => month.revenue));
  const point = (value: number, index: number) => `${left + (index / Math.max(1, data.monthlyRevenue.length - 1)) * chartWidth},${top + chartHeight - value / max * chartHeight}`; const points = data.monthlyRevenue.map((month, index) => point(month.revenue, index)).join(" ");
  return <Card style={styles.card}><View style={styles.row}><View style={{ flex: 1, gap: 2 }}><Text style={styles.sectionTitle}>Revenue trend</Text><Text style={styles.sectionSubtitle}>Monthly completed-sale revenue · last 6 months</Text></View><Text style={styles.revenuePeak}>Peak {formatCurrency(max, data.currency)}</Text></View><Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}><>{[0, 0.5, 1].map((fraction) => { const y = top + chartHeight - fraction * chartHeight; return <Line key={fraction} x1={left} x2={width - right} y1={y} y2={y} stroke={colors.border.default} strokeWidth="1" />; })}<Polyline points={points} fill="none" stroke={colors.primary[600]} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />{data.monthlyRevenue.map((month, index) => <Circle key={month.monthKey} cx={point(month.revenue, index).split(",")[0]} cy={point(month.revenue, index).split(",")[1]} r="3" fill={colors.primary[600]} />)}</></Svg><View style={styles.chartXAxis}>{data.monthlyRevenue.map((month) => <Text key={month.monthKey} style={styles.chartAxisLabel}>{month.label}</Text>)}</View></Card>;
}
