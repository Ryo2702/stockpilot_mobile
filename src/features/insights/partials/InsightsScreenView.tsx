import { Directory } from "expo-file-system";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  MoreVertical,
  Package,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react-native";
import { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import StoreSelector from "@/components/store/StoreSelector";
import { BottomNavigation, type BottomNavKey } from "@/components/ui/BottomNavigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { catalogCategoryOptions } from "@/features/catalogs/data/catalog.data";
import {
  getInsightReportTitle,
  insightReportOptions,
  type InsightCategory,
  type InsightPeriod,
  type InsightProduct,
  type InsightReport,
  type InsightReportType,
  type StoreInsights,
} from "@/services/insights";
import { radii, spacing, typography, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";

import useInsightsScreen from "../hooks/useInsightsScreen";
import {
  CategoryInsightSheet,
  InsightPeriodSheet,
  InsightsMoreSheet,
  ProductInsightSheet,
  ReportDetailSheet,
} from "../components/InsightSheets";
import type { InsightsScreenProps } from "../types/insights-screen.types";

type InsightsController = ReturnType<typeof useInsightsScreen>;
type InsightsTab = "overview" | "trends" | "reports";
type TrendsTab = "movement" | "health" | "activity";

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background.app },
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    flexGrow: 1,
    gap: spacing[4],
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
  tabs: {
    minHeight: 46,
    flexDirection: "row",
    padding: spacing[1],
    borderRadius: radii.md,
    backgroundColor: colors.background.subtle,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tab: { minHeight: 38, flex: 1, alignItems: "center", justifyContent: "center", borderRadius: radii.sm },
  tabActive: { backgroundColor: colors.background.surface, borderWidth: 1, borderColor: colors.border.default },
  tabLabel: { ...typography.label, color: colors.text.secondary },
  tabLabelActive: { color: colors.primary[600], fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing[3] },
  sectionTitle: { ...typography.title, color: colors.text.primary },
  sectionSubtitle: { ...typography.bodySmall, color: colors.text.secondary },
  periodButton: { minHeight: controlHeight, flexDirection: "row", alignItems: "center", gap: spacing[2], paddingHorizontal: spacing[3], borderWidth: 1, borderColor: colors.border.default, borderRadius: radii.md, backgroundColor: colors.background.surface },
  periodLabel: { ...typography.label, color: colors.text.primary, maxWidth: 136 },
  section: { gap: spacing[3] },
  card: { gap: spacing[3] },
  cardTitle: { ...typography.label, color: colors.text.primary },
  caption: { ...typography.caption, color: colors.text.secondary },
  totalCard: { padding: spacing[5], gap: spacing[2] },
  totalLabel: { ...typography.label, color: colors.text.secondary },
  totalValue: { fontSize: 36, lineHeight: 42, fontWeight: "700", color: colors.text.primary },
  totalFoot: { ...typography.bodySmall, color: colors.text.muted },
  statusGrid: { flexDirection: "row", gap: spacing[2] },
  statusCard: { minHeight: 92, flex: 1, padding: spacing[3], justifyContent: "space-between", gap: spacing[2] },
  statusTop: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
  statusDot: { width: 8, height: 8, borderRadius: radii.full },
  statusLabel: { ...typography.caption, color: colors.text.secondary, flexShrink: 1 },
  statusCount: { ...typography.h3, color: colors.text.primary },
  comparisonLabel: { ...typography.caption, color: colors.text.muted },
  comparisonGrid: { flexDirection: "row", gap: spacing[2] },
  comparisonTile: { flex: 1, minWidth: 0, padding: spacing[3], borderRadius: radii.md, backgroundColor: colors.background.subtle, gap: spacing[1] },
  comparisonName: { ...typography.caption, color: colors.text.secondary },
  comparisonValue: { ...typography.title, color: colors.text.primary },
  comparisonChange: { ...typography.caption, color: colors.text.muted },
  comparisonNote: { ...typography.caption, color: colors.text.secondary, lineHeight: 18 },
  findingRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing[2] },
  findingBullet: { width: 7, height: 7, borderRadius: radii.full, marginTop: 6, backgroundColor: colors.primary[500] },
  findingText: { ...typography.bodySmall, color: colors.text.secondary, flex: 1, lineHeight: 21 },
  productRow: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: spacing[3], paddingVertical: spacing[2], borderBottomWidth: 1, borderBottomColor: colors.border.default },
  productCopy: { flex: 1, minWidth: 0, gap: 2 },
  productName: { ...typography.label, color: colors.text.primary },
  productMeta: { ...typography.caption, color: colors.text.secondary },
  productRight: { minWidth: 76, alignItems: "flex-end", gap: spacing[1] },
  productQuantity: { ...typography.label, color: colors.text.primary },
  productChange: { ...typography.caption, color: colors.text.muted },
  badge: { alignSelf: "flex-start", paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radii.full },
  badgeText: { ...typography.caption, fontWeight: "600" },
  inlineAction: { minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing[2], paddingVertical: spacing[1] },
  inlineActionText: { ...typography.bodySmall, color: colors.primary[600], fontWeight: "600", flex: 1 },
  categoryRow: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: spacing[3], paddingVertical: spacing[2], borderBottomWidth: 1, borderBottomColor: colors.border.default },
  categoryIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: radii.full, backgroundColor: colors.primary[50] },
  categoryCopy: { flex: 1, gap: 2 },
  categoryName: { ...typography.label, color: colors.text.primary },
  categoryMeta: { ...typography.caption, color: colors.text.secondary },
  categoryValue: { ...typography.label, color: colors.text.primary },
  notice: { padding: spacing[3], borderRadius: radii.md, backgroundColor: colors.primary[50], borderWidth: 1, borderColor: colors.primary[100] },
  noticeText: { ...typography.bodySmall, color: colors.primary[800], lineHeight: 20 },
  errorText: { ...typography.bodySmall, color: colors.semantic.danger, lineHeight: 20 },
  trendTabs: { flexDirection: "row", gap: spacing[1], paddingBottom: spacing[1] },
  trendTab: { minHeight: 38, flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing[1], borderBottomWidth: 2, borderBottomColor: "transparent" },
  trendTabActive: { borderBottomColor: colors.primary[600] },
  trendTabText: { ...typography.caption, color: colors.text.secondary, textAlign: "center" },
  trendTabTextActive: { color: colors.primary[600], fontWeight: "600" },
  legend: { flexDirection: "row", alignItems: "center", gap: spacing[4] },
  legendItem: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
  legendDot: { width: 8, height: 8, borderRadius: radii.full },
  legendText: { ...typography.caption, color: colors.text.secondary },
  barRow: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: spacing[2] },
  monthLabel: { width: 34, ...typography.caption, color: colors.text.secondary },
  barColumn: { flex: 1, gap: 3 },
  barLine: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  barTrack: { height: 7, flex: 1, borderRadius: radii.full, backgroundColor: colors.background.subtle, overflow: "hidden" },
  barIn: { height: "100%", borderRadius: radii.full, backgroundColor: colors.primary[500] },
  barOut: { height: "100%", borderRadius: radii.full, backgroundColor: colors.semantic.danger },
  barValue: { width: 34, ...typography.caption, color: colors.text.secondary, textAlign: "right" },
  monthlyHeader: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
  monthlyHeaderText: { width: 66, ...typography.caption, color: colors.text.muted },
  monthlyHeaderValue: { width: 56, ...typography.caption, color: colors.text.muted, textAlign: "right" },
  monthlyRow: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: spacing[1], borderBottomWidth: 1, borderBottomColor: colors.border.default },
  monthlyName: { width: 66, ...typography.caption, color: colors.text.primary },
  monthlyValue: { width: 56, ...typography.caption, color: colors.text.secondary, textAlign: "right" },
  healthHeader: { flexDirection: "row", justifyContent: "flex-end", gap: spacing[2] },
  healthHeaderText: { width: 46, ...typography.caption, textAlign: "right", color: colors.text.muted },
  healthRow: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: spacing[2], borderBottomWidth: 1, borderBottomColor: colors.border.default },
  healthMonth: { flex: 1, ...typography.caption, color: colors.text.primary },
  healthValue: { width: 46, ...typography.caption, color: colors.text.secondary, textAlign: "right" },
  emptyTitle: { ...typography.title, color: colors.text.primary, textAlign: "center" },
  emptyCopy: { ...typography.bodySmall, color: colors.text.secondary, textAlign: "center", lineHeight: 21 },
  emptyWrap: { alignItems: "center", gap: spacing[2], paddingVertical: spacing[5], paddingHorizontal: spacing[3] },
  reportRow: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: spacing[3], paddingVertical: spacing[2], borderBottomWidth: 1, borderBottomColor: colors.border.default },
  reportIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: radii.md, backgroundColor: colors.primary[50] },
  reportCopy: { flex: 1, gap: 2 },
  reportTitle: { ...typography.label, color: colors.text.primary },
  reportDescription: { ...typography.caption, color: colors.text.secondary },
  reportTimestamp: { ...typography.caption, color: colors.text.muted },
  reportSummary: { flexDirection: "row", gap: spacing[2] },
  reportSummaryItem: { flex: 1, gap: spacing[1] },
  reportSummaryValue: { ...typography.title, color: colors.text.primary },
  loadPlaceholder: { height: 84, borderRadius: radii.lg, backgroundColor: colors.background.subtle },
});

const controlHeight = 40;

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}

function formatQuantity(value: number, unit: string) {
  return `${formatNumber(value)} ${unit}`;
}

function periodTitle(period: InsightPeriod) {
  return {
    today: "Today",
    "7_days": "7 Days",
    "30_days": "30 Days",
    this_month: "This Month",
    last_month: "Last Month",
    "3_months": "3 Months",
    "6_months": "6 Months",
    this_year: "This Year",
    custom: "Custom Range",
  }[period];
}

function movementChange(current: number, previous: number, comparisonLabel = "the previous period") {
  if (previous === 0) return current === 0 ? "No activity" : "New activity";
  const percent = Math.round(((current - previous) / Math.abs(previous)) * 100);
  if (percent === 0) return "No change";
  return `${percent > 0 ? "+" : ""}${percent}% vs ${comparisonLabel}`;
}

function categoryName(category: string) {
  return catalogCategoryOptions.find((option) => option.value === category)?.label ?? category;
}

function daysSince(date: string | null) {
  if (!date) return "No movement recorded";
  const days = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / (24 * 60 * 60 * 1000)));
  return days === 0 ? "Today" : `${days} days ago`;
}

function dataFindings(data: StoreInsights) {
  const findings: string[] = [];
  if (data.health.critical > 0) findings.push(`${data.health.critical} ${data.health.critical === 1 ? "product is" : "products are"} currently critical with zero available stock.`);
  if (data.health.low > 0) findings.push(`${data.health.low} ${data.health.low === 1 ? "product is" : "products are"} at or below its reorder level.`);
  if (data.products.noMovementCount > 0) findings.push(`${data.products.noMovementCount} products had no stock movement in the last 30 days.`);
  const top = data.products.topMoving[0];
  if (top) findings.push(`${top.name} had the highest outgoing movement in ${data.period.label.toLowerCase()} (${formatQuantity(top.stockOut, top.unit)}).`);
  if (data.movement.stockIn === 0 && data.movement.stockOut === 0 && data.movement.adjustments === 0) {
    findings.push(`No stock movements were recorded for ${data.period.label.toLowerCase()}.`);
  }
  return findings.slice(0, 4);
}

function HealthBadge({ status }: { status: InsightProduct["stockStatus"] }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const theme = status === "healthy"
    ? [colors.semantic.successBackground, colors.semantic.success]
    : status === "low"
      ? [colors.semantic.warningBackground, colors.semantic.warning]
      : [colors.semantic.dangerBackground, colors.semantic.danger];
  return (
    <View style={[styles.badge, { backgroundColor: theme[0] }]}>
      <Text style={[styles.badgeText, { color: theme[1] }]}>{status === "low" ? "Low" : status === "critical" ? "Critical" : "Healthy"}</Text>
    </View>
  );
}

function MetricTile({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: string;
}) {
  const styles = useThemeStyles(createStyles);
  return (
    <View style={styles.comparisonTile}>
      <Text style={styles.comparisonName}>{label}</Text>
      <Text style={styles.comparisonValue}>{value}</Text>
      <Text style={styles.comparisonChange}>{change}</Text>
    </View>
  );
}

function ProductRow({
  product,
  onPress,
  valueMode = "stock",
  comparisonLabel = "the previous period",
}: {
  product: InsightProduct;
  onPress: (product: InsightProduct) => void;
  valueMode?: "stock" | "movement";
  comparisonLabel?: string;
}) {
  const styles = useThemeStyles(createStyles);
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(product)}
      style={styles.productRow}
    >
      <View style={styles.productCopy}>
        <Text numberOfLines={1} style={styles.productName}>{product.name}</Text>
        <Text numberOfLines={1} style={styles.productMeta}>
          {valueMode === "stock" ? `${categoryName(product.category)} · ` : "Stock Out · "}{product.sku ?? "No SKU"}
        </Text>
      </View>
      <View style={styles.productRight}>
        <Text style={styles.productQuantity}>
          {valueMode === "stock" ? formatQuantity(product.quantity, product.unit) : formatQuantity(product.stockOut, product.unit)}
        </Text>
        {valueMode === "stock" ? <HealthBadge status={product.stockStatus} /> : <Text style={styles.productChange}>{movementChange(product.stockOut, product.previousStockOut, comparisonLabel)}</Text>}
      </View>
      <ChevronRight size={18} color={colors.text.muted} />
    </Pressable>
  );
}

function PeriodControl({ period, label, onPress }: { period: InsightPeriod; label?: string; onPress: () => void }) {
  const styles = useThemeStyles(createStyles);
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Period: ${periodTitle(period)}`} onPress={onPress} style={styles.periodButton}>
      <CalendarDays size={17} color={colors.primary[600]} />
      <Text style={styles.periodLabel}>{label ?? periodTitle(period)}</Text>
      <ChevronDown size={16} color={colors.text.secondary} />
    </Pressable>
  );
}

function OverviewContent({
  data,
  onSelectProduct,
  onSelectCategory,
  onNavigate,
}: {
  data: StoreInsights;
  onSelectProduct: (product: InsightProduct) => void;
  onSelectCategory: (category: InsightCategory) => void;
  onNavigate: (key: BottomNavKey) => void;
}) {
  const styles = useThemeStyles(createStyles);
  const { colors } = useTheme();
  const findings = dataFindings(data);
  const reviewProducts = [...data.products.critical.slice(0, 2), ...data.products.low.slice(0, 2)].slice(0, 3);
  const categories = data.categories.slice(0, 4);

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inventory health</Text>
        <Text style={styles.sectionSubtitle}>Current stock in this store</Text>
      </View>
      <Card style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Products</Text>
        <Text style={styles.totalValue}>{formatNumber(data.health.total)}</Text>
        <Text style={styles.totalFoot}>Active items in this store's catalog</Text>
      </Card>
      <View style={styles.statusGrid}>
        <HealthCountCard label="Healthy" count={data.health.healthy} color={colors.semantic.success} />
        <HealthCountCard label="Low Stock" count={data.health.low} color={colors.semantic.warning} />
        <HealthCountCard label="Critical" count={data.health.critical} color={colors.semantic.danger} />
      </View>
      {!data.hasMovementHistory ? (
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>No movement insights yet</Text>
          <Text style={styles.sectionSubtitle}>Keep recording inventory movements. Trends and product activity will appear once this store has stock history.</Text>
          <Button title="Go to Inventory" onPress={() => onNavigate("inventory")} />
        </Card>
      ) : null}
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.sectionTitle}>Period comparison</Text>
            <Text style={styles.comparisonLabel}>{data.period.comparisonLabel}</Text>
          </View>
          <Activity size={18} color={colors.primary[600]} />
        </View>
        <View style={styles.comparisonGrid}>
          <MetricTile label="Stock In" value={formatNumber(data.movement.stockIn)} change={movementChange(data.movement.stockIn, data.previousMovement.stockIn, data.period.comparisonLabel.replace(/^vs /, ""))} />
          <MetricTile label="Stock Out" value={formatNumber(data.movement.stockOut)} change={movementChange(data.movement.stockOut, data.previousMovement.stockOut, data.period.comparisonLabel.replace(/^vs /, ""))} />
          <MetricTile label="Net Movement" value={`${data.movement.net > 0 ? "+" : ""}${formatNumber(data.movement.net)}`} change={`${data.movement.net - data.previousMovement.net > 0 ? "+" : ""}${formatNumber(data.movement.net - data.previousMovement.net)} vs ${data.period.comparisonLabel.replace(/^vs /, "")}`} />
        </View>
        {data.previousMonthHealth ? (
          <Text style={styles.comparisonNote}>
            Current health vs last month’s snapshot: Low {data.health.low} vs {data.previousMonthHealth.low} · Critical {data.health.critical} vs {data.previousMonthHealth.critical}.
          </Text>
        ) : (
          <Text style={styles.comparisonNote}>Monthly health history builds as snapshots are recorded.</Text>
        )}
      </Card>
      <Card style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.sectionTitle}>Key findings</Text>
          <Text style={styles.caption}>From recorded activity</Text>
        </View>
        {findings.length ? findings.map((finding, index) => (
          <View key={`${index}-${finding}`} style={styles.findingRow}>
            <View style={styles.findingBullet} />
            <Text style={styles.findingText}>{finding}</Text>
          </View>
        )) : (
          <Text style={styles.caption}>No current conditions need attention.</Text>
        )}
      </Card>
      {reviewProducts.length ? (
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.sectionTitle}>Products to review</Text>
              <Text style={styles.sectionSubtitle}>Stock is at or below reorder level.</Text>
            </View>
            <Package size={19} color={colors.semantic.warning} />
          </View>
          {reviewProducts.map((product) => <ProductRow key={product.id} product={product} onPress={onSelectProduct} />)}
          <InlineAction label="Open Inventory" onPress={() => onNavigate("inventory")} />
        </Card>
      ) : null}
      {data.products.topMoving.length ? (
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.sectionTitle}>Top moving products</Text>
              <Text style={styles.sectionSubtitle}>Ranked by Stock Out · {data.period.label}</Text>
            </View>
            <TrendingUp size={19} color={colors.primary[600]} />
          </View>
          {data.products.topMoving.slice(0, 3).map((product, index) => (
            <View key={product.id} style={styles.row}>
              <Text style={[styles.caption, { width: 18 }]}>{index + 1}</Text>
              <View style={{ flex: 1 }}>
                <ProductRow product={product} onPress={onSelectProduct} valueMode="movement" comparisonLabel={data.period.comparisonLabel.replace(/^vs /, "")} />
              </View>
            </View>
          ))}
        </Card>
      ) : null}
      {categories.length ? (
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.sectionTitle}>Category insights</Text>
              <Text style={styles.sectionSubtitle}>Activity by existing Catalog category</Text>
            </View>
            <ChartNoAxesCombined size={19} color={colors.primary[600]} />
          </View>
          {categories.map((category) => <CategoryRow key={category.category} category={category} onPress={onSelectCategory} />)}
        </Card>
      ) : null}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Next checks</Text>
        {data.health.critical ? <ActionRow label="Restock Critical Items" count={data.health.critical} onPress={() => onNavigate("inventory")} /> : null}
        {data.health.low ? <ActionRow label="Review Low Stock" count={data.health.low} onPress={() => onNavigate("inventory")} /> : null}
        {data.products.noMovementCount ? <ActionRow label="Check Products with No Movement" count={data.products.noMovementCount} onPress={() => onNavigate("inventory")} /> : null}
        {data.movement.stockIn || data.movement.stockOut || data.movement.adjustments ? <ActionRow label="View Recent Stock Movements" onPress={() => onNavigate("inventory")} /> : null}
        {!data.health.critical && !data.health.low && !data.products.noMovementCount ? <Text style={styles.caption}>No stock conditions need review.</Text> : null}
      </Card>
    </>
  );
}

function HealthCountCard({ label, count, color }: { label: string; count: number; color: string }) {
  const styles = useThemeStyles(createStyles);
  return (
    <Card style={styles.statusCard}>
      <View style={styles.statusTop}>
        <View style={[styles.statusDot, { backgroundColor: color }]} />
        <Text numberOfLines={1} style={styles.statusLabel}>{label}</Text>
      </View>
      <Text style={styles.statusCount}>{formatNumber(count)}</Text>
    </Card>
  );
}

function InlineAction({ label, onPress }: { label: string; onPress: () => void }) {
  const styles = useThemeStyles(createStyles);
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.inlineAction}>
      <Text style={styles.inlineActionText}>{label}</Text>
      <ArrowRight size={17} color={colors.primary[600]} />
    </Pressable>
  );
}

function ActionRow({ label, count, onPress }: { label: string; count?: number; onPress: () => void }) {
  const styles = useThemeStyles(createStyles);
  const { colors } = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.inlineAction}>
      <Text style={styles.findingText}>{label}</Text>
      {count !== undefined ? <Text style={styles.productQuantity}>{count}</Text> : null}
      <ChevronRight size={17} color={colors.text.muted} />
    </Pressable>
  );
}

function CategoryRow({ category, onPress }: { category: InsightCategory; onPress: (category: InsightCategory) => void }) {
  const styles = useThemeStyles(createStyles);
  const colors = useTheme().colors;
  const option = catalogCategoryOptions.find((item) => item.value === category.category);
  const Icon = option?.icon ?? Package;
  return (
    <Pressable accessibilityRole="button" onPress={() => onPress(category)} style={styles.categoryRow}>
      <View style={styles.categoryIcon}><Icon size={18} color={colors.primary[600]} /></View>
      <View style={styles.categoryCopy}>
        <Text numberOfLines={1} style={styles.categoryName}>{option?.label ?? category.category}</Text>
        <Text style={styles.categoryMeta}>{category.products} items · {formatNumber(category.stockOut)} out</Text>
      </View>
      <Text style={styles.categoryValue}>{category.net > 0 ? "+" : ""}{formatNumber(category.net)}</Text>
      <ChevronRight size={17} color={colors.text.muted} />
    </Pressable>
  );
}

function TrendsContent({
  data,
  selected,
  onSelect,
  onSelectProduct,
}: {
  data: StoreInsights;
  selected: TrendsTab;
  onSelect: (tab: TrendsTab) => void;
  onSelectProduct: (product: InsightProduct) => void;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useTheme().colors;
  const tabs: Array<{ id: TrendsTab; label: string }> = [
    { id: "movement", label: "Stock Movement" },
    { id: "health", label: "Stock Health" },
    { id: "activity", label: "Product Activity" },
  ];
  const maxMovement = Math.max(1, ...data.monthlyMovement.flatMap((month) => [month.stockIn, month.stockOut]));
  const recentMonths = data.monthlyMovement.slice(-3).reverse();
  const healthRows = data.monthlyHealth.slice(-6).reverse();

  return (
    <>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trends</Text>
        <Text style={styles.sectionSubtitle}>Historical activity for this store.</Text>
      </View>
      <View style={styles.trendTabs}>
        {tabs.map((tab) => (
          <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected: selected === tab.id }} onPress={() => onSelect(tab.id)} style={[styles.trendTab, selected === tab.id && styles.trendTabActive]}>
            <Text style={[styles.trendTabText, selected === tab.id && styles.trendTabTextActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>
      {selected === "movement" ? (
        <>
          <Card style={styles.card}>
            <View style={{ gap: 2 }}>
              <Text style={styles.sectionTitle}>Monthly stock movement</Text>
              <Text style={styles.sectionSubtitle}>Recorded Stock In and Stock Out · last 6 months</Text>
            </View>
            <View style={styles.legend}>
              <Legend color={colors.primary[500]} label="Stock In" />
              <Legend color={colors.semantic.danger} label="Stock Out" />
            </View>
            {data.monthlyMovement.map((month) => (
              <View key={month.monthKey} style={styles.barRow}>
                <Text style={styles.monthLabel}>{month.label}</Text>
                <View style={styles.barColumn}>
                  <Bar value={month.stockIn} max={maxMovement} valueStyle={styles.barIn} />
                  <Bar value={month.stockOut} max={maxMovement} valueStyle={styles.barOut} />
                </View>
              </View>
            ))}
            {data.monthlyMovement.every((month) => month.stockIn === 0 && month.stockOut === 0) ? (
              <EmptyCopy title="No movement in these 6 months" copy="No stock movement records were found in this chart period." />
            ) : null}
          </Card>
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Monthly comparison</Text>
            <View style={styles.monthlyHeader}>
              <Text style={styles.monthlyHeaderText}>Month</Text>
              <Text style={styles.monthlyHeaderValue}>In</Text>
              <Text style={styles.monthlyHeaderValue}>Out</Text>
              <Text style={styles.monthlyHeaderValue}>Net</Text>
            </View>
            {recentMonths.map((month) => (
              <View key={month.monthKey} style={styles.monthlyRow}>
                <Text style={styles.monthlyName}>{month.label}</Text>
                <Text style={styles.monthlyValue}>{formatNumber(month.stockIn)}</Text>
                <Text style={styles.monthlyValue}>{formatNumber(month.stockOut)}</Text>
                <Text style={[styles.monthlyValue, { color: month.net < 0 ? colors.semantic.danger : colors.text.primary }]}>{month.net > 0 ? "+" : ""}{formatNumber(month.net)}</Text>
              </View>
            ))}
            <Text style={styles.caption}>Net includes all recorded movement deltas, including adjustments.</Text>
          </Card>
        </>
      ) : selected === "health" ? (
        <Card style={styles.card}>
          <View style={{ gap: 2 }}>
            <Text style={styles.sectionTitle}>Stock health trend</Text>
            <Text style={styles.sectionSubtitle}>Latest saved monthly snapshot for each month.</Text>
          </View>
          <View style={styles.healthHeader}>
            <Text style={styles.healthHeaderText}>Healthy</Text>
            <Text style={styles.healthHeaderText}>Low</Text>
            <Text style={styles.healthHeaderText}>Critical</Text>
          </View>
          {healthRows.map((snapshot) => (
            <View key={snapshot.monthKey} style={styles.healthRow}>
              <Text style={styles.healthMonth}>{snapshot.monthKey}</Text>
              <Text style={styles.healthValue}>{snapshot.healthy}</Text>
              <Text style={[styles.healthValue, { color: colors.semantic.warning }]}>{snapshot.low}</Text>
              <Text style={[styles.healthValue, { color: colors.semantic.danger }]}>{snapshot.critical}</Text>
            </View>
          ))}
          <Text style={styles.caption}>Earlier stock health cannot be reconstructed from movement history. Snapshots are saved locally as you open Insights.</Text>
        </Card>
      ) : (
        <>
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.sectionTitle}>Top moving</Text>
                <Text style={styles.sectionSubtitle}>Ranked by outgoing quantity · {data.period.label}</Text>
              </View>
              <TrendingUp size={18} color={colors.primary[600]} />
            </View>
            {data.products.topMoving.length ? data.products.topMoving.slice(0, 5).map((product, index) => (
              <RankedProduct
                key={product.id}
                rank={index + 1}
                product={product}
                comparisonLabel={data.period.comparisonLabel.replace(/^vs /, "")}
                onPress={onSelectProduct}
              />
            )) : <EmptyCopy title="No Stock Out yet" copy={`No outgoing movement was recorded for ${data.period.label.toLowerCase()}.`} />}
          </Card>
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Largest changes</Text>
            <Text style={styles.sectionSubtitle}>Stock Out compared with {data.period.comparisonLabel.replace(/^vs /, "")}.</Text>
            {data.products.largestIncreases.length ? (
              <View style={{ gap: spacing[1] }}>
                <Text style={styles.cardTitle}>Largest increases</Text>
                {data.products.largestIncreases.slice(0, 3).map((product) => (
                  <ProductRow key={`increase-${product.id}`} product={product} onPress={onSelectProduct} valueMode="movement" comparisonLabel={data.period.comparisonLabel.replace(/^vs /, "")} />
                ))}
              </View>
            ) : null}
            {data.products.largestDecreases.length ? (
              <View style={{ gap: spacing[1] }}>
                <Text style={styles.cardTitle}>Largest decreases</Text>
                {data.products.largestDecreases.slice(0, 3).map((product) => (
                  <ProductRow key={`decrease-${product.id}`} product={product} onPress={onSelectProduct} valueMode="movement" comparisonLabel={data.period.comparisonLabel.replace(/^vs /, "")} />
                ))}
              </View>
            ) : null}
            {!data.products.largestIncreases.length && !data.products.largestDecreases.length ? (
              <EmptyCopy title="No comparable changes" copy="Products need outgoing movement in both periods to calculate a percentage change." />
            ) : null}
          </Card>
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.sectionTitle}>Slow moving</Text>
                <Text style={styles.sectionSubtitle}>Lowest outgoing movement among active products.</Text>
              </View>
              <TrendingDown size={18} color={colors.semantic.warning} />
            </View>
            {data.products.slowMoving.length ? data.products.slowMoving.slice(0, 5).map((product) => (
              <ProductRow key={product.id} product={product} onPress={onSelectProduct} valueMode="movement" comparisonLabel={data.period.comparisonLabel.replace(/^vs /, "")} />
            )) : <EmptyCopy title="No slow movers to rank" copy="Products need recorded outgoing movement to compare activity." />}
            {data.products.slowMoving.length ? <Text style={styles.caption}>Low movement during the selected period. Review purchasing volume before reordering.</Text> : null}
          </Card>
          <Card style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.sectionTitle}>No movement in 30 days</Text>
                <Text style={styles.sectionSubtitle}>{data.products.noMovementCount} active products with no recent stock movement.</Text>
              </View>
              <Activity size={18} color={colors.text.muted} />
            </View>
            {data.products.noMovement.slice(0, 5).map((product) => (
              <Pressable key={product.id} onPress={() => onSelectProduct(product)} style={styles.productRow}>
                <View style={styles.productCopy}>
                  <Text numberOfLines={1} style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productMeta}>Last movement: {daysSince(product.lastMovementAt)}</Text>
                </View>
                <Text style={styles.productQuantity}>{formatQuantity(product.quantity, product.unit)}</Text>
                <ChevronRight size={18} color={colors.text.muted} />
              </Pressable>
            ))}
            {!data.products.noMovementCount ? <EmptyCopy title="Recent movement recorded" copy="Every active product has had a stock movement in the last 30 days." /> : null}
          </Card>
        </>
      )}
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  const styles = useThemeStyles(createStyles);
  return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={styles.legendText}>{label}</Text></View>;
}

function Bar({ value, max, valueStyle }: { value: number; max: number; valueStyle: object }) {
  const styles = useThemeStyles(createStyles);
  return (
    <View style={styles.barLine}>
      <View style={styles.barTrack}>
        <View style={[valueStyle, { width: `${value === 0 ? 0 : Math.max(2, value / max * 100)}%` }]} />
      </View>
      <Text style={styles.barValue}>{formatNumber(value)}</Text>
    </View>
  );
}

function RankedProduct({ rank, product, comparisonLabel, onPress }: { rank: number; product: InsightProduct; comparisonLabel: string; onPress: (product: InsightProduct) => void }) {
  const styles = useThemeStyles(createStyles);
  const colors = useTheme().colors;
  const comparison = product.previousStockOut === 0 ? "No prior activity" : movementChange(product.stockOut, product.previousStockOut, comparisonLabel);
  const trendColor = product.stockOut > product.previousStockOut ? colors.semantic.danger : colors.semantic.success;
  const TrendIcon = product.stockOut > product.previousStockOut ? ArrowUpRight : ArrowDownRight;
  return (
    <Pressable accessibilityRole="button" onPress={() => onPress(product)} style={styles.productRow}>
      <Text style={styles.caption}>{rank}</Text>
      <View style={styles.productCopy}>
        <Text numberOfLines={1} style={styles.productName}>{product.name}</Text>
        <Text style={styles.productMeta}>{categoryName(product.category)}</Text>
      </View>
      <View style={styles.productRight}>
        <Text style={styles.productQuantity}>{formatQuantity(product.stockOut, product.unit)}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          {product.previousStockOut > 0 ? <TrendIcon size={13} color={trendColor} /> : null}
          <Text style={[styles.productChange, product.previousStockOut > 0 && { color: trendColor }]}>{comparison}</Text>
        </View>
      </View>
      <ChevronRight size={17} color={colors.text.muted} />
    </Pressable>
  );
}

function EmptyCopy({ title, copy }: { title: string; copy: string }) {
  const styles = useThemeStyles(createStyles);
  return <View style={styles.emptyWrap}><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyCopy}>{copy}</Text></View>;
}

function ReportsContent({
  reports,
  onGenerate,
  onSelectReport,
  onExport,
  generating,
}: {
  reports: InsightReport[];
  onGenerate: (type: InsightReportType) => void;
  onSelectReport: (report: InsightReport) => void;
  onExport: () => void;
  generating: boolean;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useTheme().colors;
  return (
    <>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.sectionTitle}>Reports</Text>
            <Text style={styles.sectionSubtitle}>Create store-scoped reports from local inventory records.</Text>
          </View>
          <FileText size={20} color={colors.primary[600]} />
        </View>
        <Button title="Export selected period as CSV" icon={Download} onPress={onExport} />
        <Text style={styles.caption}>CSV includes summary, category performance, movement history, and low / critical stock lists.</Text>
      </Card>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Report types</Text>
        {insightReportOptions.map(({ type, description }) => (
          <Pressable key={type} accessibilityRole="button" onPress={() => onGenerate(type)} style={styles.reportRow}>
            <View style={styles.reportIcon}><FileText size={18} color={colors.primary[600]} /></View>
            <View style={styles.reportCopy}>
              <Text style={styles.reportTitle}>{getInsightReportTitle(type)}</Text>
              <Text style={styles.reportDescription}>{description}</Text>
            </View>
            {generating ? <RefreshCw size={17} color={colors.text.muted} /> : <ChevronRight size={18} color={colors.text.muted} />}
          </Pressable>
        ))}
      </Card>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.sectionTitle}>Report history</Text>
            <Text style={styles.sectionSubtitle}>Saved on this device for this store.</Text>
          </View>
          <CalendarDays size={18} color={colors.text.muted} />
        </View>
        {reports.slice(0, 5).map((report) => (
          <Pressable key={report.id} onPress={() => onSelectReport(report)} style={styles.reportRow}>
            <View style={styles.reportIcon}><FileText size={17} color={colors.primary[600]} /></View>
            <View style={styles.reportCopy}>
              <Text style={styles.reportTitle}>{report.title}</Text>
              <Text style={styles.reportDescription}>{report.periodLabel} · {new Date(report.createdAt).toLocaleDateString()}</Text>
            </View>
            <ChevronRight size={18} color={colors.text.muted} />
          </Pressable>
        ))}
        {!reports.length ? <EmptyCopy title="No saved reports" copy="Generated reports will appear here and remain stored locally for this store." /> : null}
      </Card>
    </>
  );
}

export default function InsightsScreenView({
  ownerStore,
  ownerStores,
  onSelectStore,
  onCreateStore,
  onNavigate,
  insights,
}: InsightsScreenProps & { insights: InsightsController }) {
  const styles = useThemeStyles(createStyles);
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<InsightsTab>("overview");
  const [trendsTab, setTrendsTab] = useState<TrendsTab>("movement");
  const [periodVisible, setPeriodVisible] = useState(false);
  const [moreVisible, setMoreVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InsightProduct | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<InsightCategory | null>(null);
  const [selectedReport, setSelectedReport] = useState<InsightReport | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [message, setMessage] = useState("");

  const showMessage = (text: string) => setMessage(text);

  const exportReport = async () => {
    if (!insights.data) return;
    try {
      const csv = await insights.createCsv();
      const storeSlug = ownerStore.storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const fileName = `stockpilot-${storeSlug}-${new Date().toISOString().slice(0, 10)}.csv`;
      if (Platform.OS === "web") {
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } else {
        const directory = await Directory.pickDirectoryAsync();
        await directory.createFile(fileName, "text/csv").write(csv);
      }
      showMessage(`CSV report saved for ${ownerStore.storeName}.`);
    } catch (error) {
      showMessage(error instanceof Error ? `Report couldn't be exported. ${error.message}` : "Report couldn't be exported. Try again.");
    }
  };

  const generateReport = async (type: InsightReportType) => {
    setGeneratingReport(true);
    try {
      const report = await insights.generateReport(type);
      setSelectedReport(report);
      showMessage("Report saved to this store's local history.");
    } catch (error) {
      showMessage(error instanceof Error ? error.message : "Report couldn't be generated. Try again.");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleMoreAction = (action: "generate" | "export" | "history") => {
    setMoreVisible(false);
    if (action === "generate") {
      setActiveTab("reports");
      void generateReport("monthly");
    } else if (action === "export") {
      void exportReport();
    } else {
      setActiveTab("reports");
    }
  };

  const handleNavigation = (key: BottomNavKey) => onNavigate(key);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ScreenHeader
            title="Insights"
            subtitle="Understand how your inventory is changing."
            actions={(
              <View style={styles.headerActions}>
                <ThemeToggle />
                <IconButton icon={MoreVertical} label="Insights actions" size={22} onPress={() => setMoreVisible(true)} style={{ width: 44, height: 44 }} />
              </View>
            )}
            context={(
              <StoreSelector
                ownerStore={ownerStore}
                ownerStores={ownerStores}
                onSelectStore={onSelectStore}
                onCreateStore={onCreateStore}
              />
            )}
          />
          <View style={styles.tabs}>
            {(["overview", "trends", "reports"] as const).map((tab) => (
              <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: activeTab === tab }} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
                <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{tab[0].toUpperCase() + tab.slice(1)}</Text>
              </Pressable>
            ))}
          </View>
          {insights.data ? (
            <View style={styles.row}>
              <Text style={[styles.caption, { flex: 1 }]}>{activeTab === "trends" ? "Product activity period" : "Reporting period"}</Text>
              <PeriodControl
                period={insights.data.period.period}
                label={insights.data.period.label}
                onPress={() => setPeriodVisible(true)}
              />
            </View>
          ) : null}
          {message ? <Pressable accessibilityRole="button" onPress={() => setMessage("")} style={styles.notice}><Text style={styles.noticeText}>{message}</Text></Pressable> : null}
          {insights.error ? (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Insights couldn’t be updated</Text>
              <Text style={styles.errorText}>{insights.error}. Your inventory data is unchanged.</Text>
              <Button title="Try Again" icon={RefreshCw} onPress={insights.reload} />
            </Card>
          ) : insights.loading && !insights.data ? (
            <View style={{ gap: spacing[3] }}>
              <View style={styles.loadPlaceholder} />
              <View style={styles.loadPlaceholder} />
              <View style={styles.loadPlaceholder} />
            </View>
          ) : insights.data ? (
            insights.data.health.total === 0 ? (
              <Card style={styles.card}>
                <View style={styles.emptyWrap}>
                  <Package size={30} color={colors.primary[500]} />
                  <Text style={styles.emptyTitle}>No insights yet</Text>
                  <Text style={styles.emptyCopy}>Keep recording inventory movements. Reports and trends will appear once there is activity in this store.</Text>
                  <Button title="Go to Inventory" onPress={() => onNavigate("inventory")} />
                </View>
              </Card>
            ) : activeTab === "overview" ? (
              <OverviewContent
                data={insights.data}
                onSelectProduct={setSelectedProduct}
                onSelectCategory={setSelectedCategory}
                onNavigate={onNavigate}
              />
            ) : activeTab === "trends" ? (
              <TrendsContent data={insights.data} selected={trendsTab} onSelect={setTrendsTab} onSelectProduct={setSelectedProduct} />
            ) : (
              <ReportsContent
                reports={insights.reports}
                onGenerate={(type) => void generateReport(type)}
                onSelectReport={setSelectedReport}
                onExport={() => void exportReport()}
                generating={generatingReport}
              />
            )
          ) : null}
        </ScrollView>
        <BottomNavigation activeKey="insights" onChange={handleNavigation} />
      </View>
      <InsightPeriodSheet
        visible={periodVisible}
        selected={insights.period}
        customRange={insights.customRange}
        onClose={() => setPeriodVisible(false)}
        onSelect={(period, range) => {
          insights.choosePeriod(period, range);
          setPeriodVisible(false);
        }}
      />
      <InsightsMoreSheet
        visible={moreVisible}
        onClose={() => setMoreVisible(false)}
        onAction={handleMoreAction}
        onMore={() => onNavigate("more")}
      />
      <ProductInsightSheet
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onViewInventory={() => {
          setSelectedProduct(null);
          onNavigate("inventory");
        }}
      />
      <CategoryInsightSheet category={selectedCategory} onClose={() => setSelectedCategory(null)} />
      <ReportDetailSheet report={selectedReport} onClose={() => setSelectedReport(null)} />
    </SafeAreaView>
  );
}
