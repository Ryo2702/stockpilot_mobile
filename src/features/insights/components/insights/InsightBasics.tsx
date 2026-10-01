import { CalendarDays, ChevronDown, ChevronRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import type { InsightProduct } from "@/services/insights";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";

import { createInsightsStyles } from "./insights.styles";
import { periodTitle } from "./insights.utils";

export function HealthBadge({ status }: { status: InsightProduct["stockStatus"] }) {
  const { colors } = useTheme(); const styles = useThemeStyles(createInsightsStyles);
  const theme = status === "healthy" ? [colors.semantic.successBackground, colors.semantic.success] : status === "low" ? [colors.semantic.warningBackground, colors.semantic.warning] : [colors.semantic.dangerBackground, colors.semantic.danger];
  return <View style={[styles.badge, { backgroundColor: theme[0] }]}><Text style={[styles.badgeText, { color: theme[1] }]}>{status === "low" ? "Low" : status === "critical" ? "Critical" : "Healthy"}</Text></View>;
}

export function MetricTile({ label, value, change }: { label: string; value: string; change: string }) {
  const styles = useThemeStyles(createInsightsStyles);
  return <View style={styles.comparisonTile}><Text style={styles.comparisonName}>{label}</Text><Text style={styles.comparisonValue}>{value}</Text><Text style={styles.comparisonChange}>{change}</Text></View>;
}

export function PeriodControl({ period, label, onPress }: { period: Parameters<typeof periodTitle>[0]; label?: string; onPress: () => void }) {
  const styles = useThemeStyles(createInsightsStyles); const { colors } = useTheme();
  return <Pressable accessibilityRole="button" accessibilityLabel={`Period: ${periodTitle(period)}`} onPress={onPress} style={styles.periodButton}><CalendarDays size={17} color={colors.primary[600]} /><Text style={styles.periodLabel}>{label ?? periodTitle(period)}</Text><ChevronDown size={16} color={colors.text.secondary} /></Pressable>;
}

export function HealthCountCard({ label, count, color }: { label: string; count: number; color: string }) {
  const styles = useThemeStyles(createInsightsStyles);
  return <Card style={styles.statusCard}><View style={styles.statusTop}><View style={[styles.statusDot, { backgroundColor: color }]} /><Text numberOfLines={1} style={styles.statusLabel}>{label}</Text></View><Text style={styles.statusCount}>{count.toLocaleString()}</Text></Card>;
}

export function InlineAction({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useThemeStyles(createInsightsStyles); const { colors } = useTheme();
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.inlineAction}><Text style={styles.inlineActionText}>{label}</Text><ChevronRight size={17} color={colors.primary[600]} /></Pressable>;
}

export function ActionRow({ label, count, onPress }: { label: string; count?: number; onPress: () => void }) {
  const styles = useThemeStyles(createInsightsStyles); const { colors } = useTheme();
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.inlineAction}><Text style={styles.findingText}>{label}</Text>{count !== undefined ? <Text style={styles.productQuantity}>{count}</Text> : null}<ChevronRight size={17} color={colors.text.muted} /></Pressable>;
}

export function EmptyCopy({ title, copy }: { title: string; copy: string }) {
  const styles = useThemeStyles(createInsightsStyles);
  return <View style={styles.emptyWrap}><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyCopy}>{copy}</Text></View>;
}
