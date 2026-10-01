import { Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import type { StoreInsights } from "@/services/insights";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";
import { createInsightsStyles } from "./insights.styles";
import { formatNumber } from "./insights.utils";
import { EmptyCopy } from "./InsightBasics";
import { Bar, Legend } from "./TrendPrimitives";

export default function MovementTrend({ data }: { data: StoreInsights }) {
  const styles = useThemeStyles(createInsightsStyles); const { colors } = useTheme(); const max = Math.max(1, ...data.monthlyMovement.flatMap((month) => [month.stockIn, month.stockOut])); const recent = data.monthlyMovement.slice(-3).reverse();
  return <><Card style={styles.card}><View style={{ gap: 2 }}><Text style={styles.sectionTitle}>Monthly stock movement</Text><Text style={styles.sectionSubtitle}>Recorded Stock In and Stock Out · last 6 months</Text></View><View style={styles.legend}><Legend color={colors.primary[500]} label="Stock In" /><Legend color={colors.semantic.danger} label="Stock Out" /></View>{data.monthlyMovement.map((month) => <View key={month.monthKey} style={styles.barRow}><Text style={styles.monthLabel}>{month.label}</Text><View style={styles.barColumn}><Bar value={month.stockIn} max={max} valueStyle={styles.barIn} /><Bar value={month.stockOut} max={max} valueStyle={styles.barOut} /></View></View>)}{data.monthlyMovement.every((month) => !month.stockIn && !month.stockOut) ? <EmptyCopy title="No movement in these 6 months" copy="No stock movement records were found in this chart period." /> : null}</Card><Card style={styles.card}><Text style={styles.sectionTitle}>Monthly comparison</Text><View style={styles.monthlyHeader}><Text style={styles.monthlyHeaderText}>Month</Text><Text style={styles.monthlyHeaderValue}>In</Text><Text style={styles.monthlyHeaderValue}>Out</Text><Text style={styles.monthlyHeaderValue}>Net</Text></View>{recent.map((month) => <View key={month.monthKey} style={styles.monthlyRow}><Text style={styles.monthlyName}>{month.label}</Text><Text style={styles.monthlyValue}>{formatNumber(month.stockIn)}</Text><Text style={styles.monthlyValue}>{formatNumber(month.stockOut)}</Text><Text style={[styles.monthlyValue, { color: month.net < 0 ? colors.semantic.danger : colors.text.primary }]}>{month.net > 0 ? "+" : ""}{formatNumber(month.net)}</Text></View>)}<Text style={styles.caption}>Net includes all recorded movement deltas, including adjustments.</Text></Card></>;
}
