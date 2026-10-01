import { TrendingUp } from "lucide-react-native";
import { Text, View } from "react-native";
import Svg, { Circle, Line, Polyline } from "react-native-svg";

import { Card } from "@/components/ui/Card";
import type { StoreInsights } from "@/services/insights";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";

import { createInsightsStyles } from "./insights.styles";

export default function MovementGraph({ data }: { data: StoreInsights }) {
  const styles = useThemeStyles(createInsightsStyles); const { colors } = useTheme(); const width = 320; const height = 170; const left = 24; const right = 8; const top = 12; const bottom = 28; const chartWidth = width - left - right; const chartHeight = height - top - bottom;
  const max = Math.max(1, ...data.monthlyMovement.flatMap((month) => [month.stockIn, month.stockOut]));
  const point = (value: number, index: number) => `${left + (index / Math.max(1, data.monthlyMovement.length - 1)) * chartWidth},${top + chartHeight - value / max * chartHeight}`;
  const inPoints = data.monthlyMovement.map((month, index) => point(month.stockIn, index)).join(" "); const outPoints = data.monthlyMovement.map((month, index) => point(month.stockOut, index)).join(" ");
  return <Card style={styles.card}><View style={styles.row}><View style={{ flex: 1, gap: 2 }}><Text style={styles.sectionTitle}>Stock movement graph</Text><Text style={styles.sectionSubtitle}>Six-month incoming and outgoing stock</Text></View><TrendingUp size={19} color={colors.primary[600]} /></View>
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}><>{[0, 0.5, 1].map((fraction) => { const y = top + chartHeight - fraction * chartHeight; return <Line key={fraction} x1={left} x2={width - right} y1={y} y2={y} stroke={colors.border.default} strokeWidth="1" />; })}<Polyline points={inPoints} fill="none" stroke={colors.primary[600]} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" /><Polyline points={outPoints} fill="none" stroke={colors.semantic.danger} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />{data.monthlyMovement.map((month, index) => <Circle key={`in-${month.monthKey}`} cx={point(month.stockIn, index).split(",")[0]} cy={point(month.stockIn, index).split(",")[1]} r="3" fill={colors.primary[600]} />)}{data.monthlyMovement.map((month, index) => <Circle key={`out-${month.monthKey}`} cx={point(month.stockOut, index).split(",")[0]} cy={point(month.stockOut, index).split(",")[1]} r="3" fill={colors.semantic.danger} />)}</></Svg>
    <View style={styles.chartXAxis}>{data.monthlyMovement.map((month) => <Text key={month.monthKey} style={styles.chartAxisLabel}>{month.label}</Text>)}</View><View style={styles.legend}><Legend color={colors.primary[600]} label="Stock In" /><Legend color={colors.semantic.danger} label="Stock Out" /></View>
  </Card>;
}

function Legend({ color, label }: { color: string; label: string }) {
  const styles = useThemeStyles(createInsightsStyles); return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={styles.legendText}>{label}</Text></View>;
}
