import { ChartNoAxesCombined } from "lucide-react-native";
import { Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import type { StoreInsights } from "@/services/insights";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";

import DonutChart from "./DonutChart";
import MovementGraph from "./MovementGraph";
import { RevenueGraph, RevenueSummary } from "./RevenueCharts";
import { createInsightsStyles } from "./insights.styles";
import { categoryName } from "./insights.utils";

export default function InsightCharts({ data }: { data: StoreInsights }) {
  const styles = useThemeStyles(createInsightsStyles); const { colors } = useTheme();
  const categories = data.categories.slice(0, 4).map((category, index) => ({ key: category.category, label: categoryName(category.category), value: category.products, color: [colors.primary[600], colors.semantic.info, colors.semantic.warning, colors.semantic.success][index] }));
  const remaining = data.categories.slice(4).reduce((sum, category) => sum + category.products, 0);
  if (remaining) categories.push({ key: "other", label: "Other", value: remaining, color: colors.text.muted });
  return <><RevenueSummary data={data} /><Card style={styles.card}><View style={styles.row}><View style={{ flex: 1, gap: 2 }}><Text style={styles.sectionTitle}>Stock charts</Text><Text style={styles.sectionSubtitle}>Current stock health and product mix</Text></View><ChartNoAxesCombined size={19} color={colors.primary[600]} /></View><View style={styles.chartGrid}><DonutChart title="Stock health" segments={[{ key: "healthy", label: "Healthy", value: data.health.healthy, color: colors.semantic.success }, { key: "low", label: "Low", value: data.health.low, color: colors.semantic.warning }, { key: "out-of-stock", label: "Out of Stock", value: data.health.outOfStock, color: colors.semantic.danger }]} /><DonutChart title="By category" segments={categories} /></View></Card><MovementGraph data={data} /><RevenueGraph data={data} /></>;
}
