import { ScrollView, Text, View } from "react-native";
import { catalogCategoryOptions } from "@/data/catalog.data";
import { type InsightCategory } from "@/services/insights";
import { spacing, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import { SheetFrame } from "./SheetFrame";
import { createSheetStyles } from "./sheet.styles";
import { formatNumber } from "./sheet.utils";

export function CategoryInsightSheet({ category, onClose }: { category: InsightCategory | null; onClose: () => void }) {
  const styles = useThemeStyles(createSheetStyles);
  const { colors } = useTheme();
  const option = category ? catalogCategoryOptions.find(({ value }) => value === category.category) : null;
  const max = Math.max(1, ...(category?.monthlyMovement.map((item) => item.stockIn) ?? []), ...(category?.monthlyMovement.map((item) => item.stockOut) ?? []));
  return <SheetFrame visible={Boolean(category)} onClose={onClose} title="Category Detail">{category ? <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing[4] }}>
    <View style={styles.productHeader}><Text style={styles.productTitle}>{option?.label ?? category.category}</Text><Text style={styles.meta}>{category.products} active {category.products === 1 ? "item" : "items"}</Text></View>
    <View>{[["Recorded Stock In", formatNumber(category.stockIn)], ["Recorded Stock Out", formatNumber(category.stockOut)], ["Net Movement", `${category.net > 0 ? "+" : ""}${formatNumber(category.net)}`], ["Healthy / Low / Critical", `${category.healthy} / ${category.low} / ${category.critical}`]].map(([label, value]) => <View key={label} style={styles.categoryMetricRow}><Text style={styles.categoryMetricLabel}>{label}</Text><Text style={styles.categoryMetricValue}>{value}</Text></View>)}</View>
    <Text style={styles.explanation}>Category totals add recorded quantities. Product units can differ within a category.</Text>
    <View style={{ gap: spacing[2] }}><Text style={styles.fieldLabel}>Monthly movement · last 6 months</Text>{category.monthlyMovement.length ? <><View style={styles.chartLegend}><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.primary[500] }]} /><Text style={styles.legendText}>In</Text></View><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.semantic.danger }]} /><Text style={styles.legendText}>Out</Text></View></View>{category.monthlyMovement.map((month) => <View key={month.monthKey} style={styles.chartRow}><Text style={styles.chartLabel}>{month.label}</Text><View style={styles.chartBars}><View style={styles.chartTrack}><View style={[styles.chartBarIn, { width: `${Math.max(0, month.stockIn / max * 100)}%` }]} /></View><View style={styles.chartTrack}><View style={[styles.chartBarOut, { width: `${Math.max(0, month.stockOut / max * 100)}%` }]} /></View></View></View>)}</> : <Text style={styles.explanation}>No category movements are recorded in this period yet.</Text>}</View>
    <View style={{ gap: spacing[2] }}><Text style={styles.fieldLabel}>Product activity</Text><Text style={styles.explanation}>Top moving: {category.topMovingProduct ?? "No outgoing movement recorded"}</Text><Text style={styles.explanation}>Slowest moving: {category.slowestProduct ?? "No outgoing movement recorded"}</Text></View>
  </ScrollView> : null}</SheetFrame>;
}
