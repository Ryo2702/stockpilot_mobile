import { useState, type ReactNode } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  CalendarDays,
  ChevronRight,
  Download,
  FileText,
  MoreVertical,
  X,
} from "lucide-react-native";

import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { catalogCategoryOptions } from "@/features/catalogs/data/catalog.data";
import {
  insightPeriods,
  type InsightCategory,
  type InsightCustomRange,
  type InsightPeriod,
  type InsightProduct,
  type InsightReport,
} from "@/services/insights";
import { radii, spacing, typography, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";

const periodLabels: Record<InsightPeriod, string> = {
  today: "Today",
  "7_days": "7 Days",
  "30_days": "30 Days",
  this_month: "This Month",
  last_month: "Last Month",
  "3_months": "3 Months",
  "6_months": "6 Months",
  this_year: "This Year",
  custom: "Custom Range",
};

const reportActionRows = [
  { id: "generate", label: "Generate Report", icon: FileText },
  { id: "export", label: "Export Report (CSV)", icon: Download },
  { id: "history", label: "Report History", icon: CalendarDays },
] as const;

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(15, 23, 42, 0.38)" },
  sheet: {
    maxHeight: "88%",
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[6],
    gap: spacing[4],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  handle: { width: 36, height: 4, borderRadius: radii.full, backgroundColor: colors.border.strong, alignSelf: "center" },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing[3] },
  title: { ...typography.h3, color: colors.text.primary },
  subtitle: { ...typography.bodySmall, color: colors.text.secondary },
  close: { marginRight: -spacing[2] },
  scroll: { flexGrow: 0 },
  option: { minHeight: 48, paddingHorizontal: spacing[3], flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: radii.md },
  optionSelected: { backgroundColor: colors.primary[50] },
  optionText: { ...typography.body, color: colors.text.primary },
  optionTextSelected: { color: colors.primary[700], fontWeight: "600" },
  divider: { height: 1, backgroundColor: colors.border.default },
  fieldLabel: { ...typography.label, color: colors.text.primary },
  fields: { flexDirection: "row", gap: spacing[3] },
  field: { flex: 1, gap: spacing[1] },
  input: { minHeight: 48, paddingHorizontal: spacing[3], borderRadius: radii.md, borderWidth: 1, borderColor: colors.border.default, color: colors.text.primary, backgroundColor: colors.background.surface, ...typography.bodySmall },
  error: { ...typography.caption, color: colors.semantic.danger },
  actionRow: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: spacing[3], paddingHorizontal: spacing[2], borderRadius: radii.md },
  actionIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: radii.full, backgroundColor: colors.primary[50] },
  actionText: { ...typography.body, color: colors.text.primary, flex: 1 },
  productHeader: { gap: spacing[1] },
  productTitle: { ...typography.h2, color: colors.text.primary },
  meta: { ...typography.bodySmall, color: colors.text.secondary },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
  summaryTile: { width: "47%", minHeight: 78, padding: spacing[3], gap: spacing[1], borderRadius: radii.md, backgroundColor: colors.background.subtle },
  summaryLabel: { ...typography.caption, color: colors.text.secondary },
  summaryValue: { ...typography.title, color: colors.text.primary },
  statusPill: { alignSelf: "flex-start", paddingHorizontal: spacing[2], paddingVertical: spacing[1], borderRadius: radii.full },
  statusText: { ...typography.caption, fontWeight: "600" },
  explanation: { ...typography.bodySmall, color: colors.text.secondary, lineHeight: 21 },
  buttonRow: { flexDirection: "row", gap: spacing[2] },
  button: { flex: 1 },
  categoryMetricRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing[2], borderBottomWidth: 1, borderBottomColor: colors.border.default },
  categoryMetricLabel: { ...typography.bodySmall, color: colors.text.secondary },
  categoryMetricValue: { ...typography.label, color: colors.text.primary },
  chartLegend: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
  legendItem: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
  legendDot: { width: 8, height: 8, borderRadius: radii.full },
  legendText: { ...typography.caption, color: colors.text.secondary },
  chartRow: { flexDirection: "row", alignItems: "center", gap: spacing[2], minHeight: 24 },
  chartLabel: { width: 35, ...typography.caption, color: colors.text.secondary },
  chartBars: { flex: 1, gap: spacing[1] },
  chartTrack: { height: 5, borderRadius: radii.full, backgroundColor: colors.background.subtle, overflow: "hidden" },
  chartBarIn: { height: "100%", borderRadius: radii.full, backgroundColor: colors.primary[500] },
  chartBarOut: { height: "100%", borderRadius: radii.full, backgroundColor: colors.semantic.danger },
  reportHeading: { ...typography.title, color: colors.text.primary },
  reportPeriod: { ...typography.bodySmall, color: colors.text.secondary },
  reportTimestamp: { ...typography.caption, color: colors.text.muted },
});

function SheetFrame({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const styles = useThemeStyles(createStyles);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable accessibilityLabel="Close sheet" onPress={onClose} style={styles.backdrop} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.title}>{title}</Text>
            <IconButton icon={X} label={`Close ${title}`} onPress={onClose} style={styles.close} />
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

function isValidDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return false;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]);
}

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function InsightPeriodSheet({
  visible,
  selected,
  customRange,
  onClose,
  onSelect,
}: {
  visible: boolean;
  selected: InsightPeriod;
  customRange: InsightCustomRange | null;
  onClose: () => void;
  onSelect: (period: InsightPeriod, range?: InsightCustomRange) => void;
}) {
  const styles = useThemeStyles(createStyles);
  const { colors } = useTheme();
  const [customOpen, setCustomOpen] = useState(selected === "custom");
  const [start, setStart] = useState(customRange?.start ?? todayString());
  const [end, setEnd] = useState(customRange?.end ?? todayString());
  const [error, setError] = useState("");

  return (
    <SheetFrame visible={visible} onClose={onClose} title="Choose Period">
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {insightPeriods.map((period) => (
          <Pressable
            key={period}
            accessibilityRole="button"
            onPress={() => {
              if (period === "custom") {
                setCustomOpen(true);
                setStart(customRange?.start ?? todayString());
                setEnd(customRange?.end ?? todayString());
                setError("");
                return;
              }
              setCustomOpen(false);
              onSelect(period);
            }}
            style={[styles.option, selected === period && styles.optionSelected]}
          >
            <Text style={[styles.optionText, selected === period && styles.optionTextSelected]}>
              {periodLabels[period]}
            </Text>
            {selected === period ? <Text style={styles.optionTextSelected}>Selected</Text> : null}
          </Pressable>
        ))}
      </ScrollView>
      {customOpen ? (
        <View style={{ gap: spacing[3] }}>
          <View style={styles.divider} />
          <Text style={styles.fieldLabel}>Custom date range</Text>
          <View style={styles.fields}>
            <View style={styles.field}>
              <Text style={styles.summaryLabel}>Start date</Text>
              <TextInput
                accessibilityLabel="Start date"
                autoCapitalize="none"
                keyboardType="numbers-and-punctuation"
                onChangeText={setStart}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.muted}
                value={start}
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.summaryLabel}>End date</Text>
              <TextInput
                accessibilityLabel="End date"
                autoCapitalize="none"
                keyboardType="numbers-and-punctuation"
                onChangeText={setEnd}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.text.muted}
                value={end}
                style={styles.input}
              />
            </View>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            title="Apply Range"
            onPress={() => {
              if (!isValidDate(start) || !isValidDate(end) || end < start) {
                setError("Enter a valid range using YYYY-MM-DD.");
                return;
              }
              onSelect("custom", { start, end });
              setCustomOpen(false);
            }}
          />
        </View>
      ) : null}
    </SheetFrame>
  );
}

function useThemeColors() {
  return useTheme().colors;
}

export function InsightsMoreSheet({
  visible,
  onClose,
  onAction,
}: {
  visible: boolean;
  onClose: () => void;
  onAction: (action: "generate" | "export" | "history") => void;
}) {
  const styles = useThemeStyles(createStyles);
  const { colors } = useTheme();
  return (
    <SheetFrame visible={visible} onClose={onClose} title="Insights Actions">
      <View>
        {reportActionRows.map(({ id, label, icon: Icon }) => (
          <Pressable
            key={id}
            accessibilityRole="button"
            onPress={() => onAction(id)}
            style={styles.actionRow}
          >
            <View style={styles.actionIcon}><Icon size={18} color={colors.primary[600]} /></View>
            <Text style={styles.actionText}>{label}</Text>
            <ChevronRight size={18} color={colors.text.muted} />
          </Pressable>
        ))}
      </View>
    </SheetFrame>
  );
}

function StatusPill({ status }: { status: InsightProduct["stockStatus"] }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const statusStyle = status === "healthy"
    ? { backgroundColor: colors.semantic.successBackground, color: colors.semantic.success }
    : status === "low"
      ? { backgroundColor: colors.semantic.warningBackground, color: colors.semantic.warning }
      : { backgroundColor: colors.semantic.dangerBackground, color: colors.semantic.danger };
  return (
    <View style={[styles.statusPill, { backgroundColor: statusStyle.backgroundColor }]}>
      <Text style={[styles.statusText, { color: statusStyle.color }]}>
        {status === "low" ? "Low stock" : status === "critical" ? "Critical" : "Healthy"}
      </Text>
    </View>
  );
}

function formatQuantity(value: number, unit: string) {
  return `${formatNumber(value)} ${unit}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}

function movementFinding(name: string, current: number, previous: number, comparisonLabel: string) {
  if (previous === 0) {
    return current === 0
      ? `No ${name.toLowerCase()} was recorded in either period.`
      : `${name} was ${formatNumber(current)}; none was recorded in ${comparisonLabel}.`;
  }
  const difference = current - previous;
  if (difference === 0) return `${name} was unchanged compared with ${comparisonLabel}.`;
  const roundedPercent = Math.round(Math.abs(difference / Math.abs(previous)) * 100);
  const percent = roundedPercent === 0 ? "less than 1%" : `${roundedPercent}%`;
  return `${name} ${difference > 0 ? "increased" : "decreased"} ${percent} compared with ${comparisonLabel}.`;
}

export function ProductInsightSheet({
  product,
  onClose,
  onViewInventory,
}: {
  product: InsightProduct | null;
  onClose: () => void;
  onViewInventory: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useThemeColors();
  return (
    <SheetFrame visible={Boolean(product)} onClose={onClose} title="Product Insight">
      {product ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing[4] }}>
          <View style={styles.productHeader}>
            <Text style={styles.productTitle}>{product.name}</Text>
            {product.sku ? <Text style={styles.meta}>SKU: {product.sku}</Text> : null}
            <StatusPill status={product.stockStatus} />
          </View>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryLabel}>Current Stock</Text>
              <Text style={styles.summaryValue}>{formatQuantity(product.quantity, product.unit)}</Text>
            </View>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryLabel}>Reorder Level</Text>
              <Text style={styles.summaryValue}>{formatQuantity(product.reorderLevel, product.unit)}</Text>
            </View>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryLabel}>Average Daily Out</Text>
              <Text style={styles.summaryValue}>
                {product.averageDailyOut !== null
                  ? `${product.averageDailyOut.toFixed(1)} ${product.unit}/day`
                  : "—"}
              </Text>
            </View>
            <View style={styles.summaryTile}>
              <Text style={styles.summaryLabel}>Estimated Remaining</Text>
              <Text style={styles.summaryValue}>
                {product.quantity === 0
                  ? "Out of stock"
                  : product.estimatedDaysRemaining === null
                    ? "Not enough data"
                    : `~${Math.max(1, Math.ceil(product.estimatedDaysRemaining))} days`}
              </Text>
            </View>
          </View>
          <View style={{ gap: spacing[2] }}>
            <Text style={styles.fieldLabel}>Restock calculation</Text>
            <Text style={styles.explanation}>
              {product.recommendedRestock === null
                ? "No recent outgoing movement is available to estimate a 14-day restock quantity."
                : `A 14-day target based on the last 30 days of outgoing movement is ${formatQuantity(product.recommendedRestock, product.unit)} to restock.`}
            </Text>
            <Text style={[styles.explanation, { color: colors.text.muted }]}>
              This estimate is calculated from recorded Stock Out movements and current quantity.
            </Text>
          </View>
          <View style={styles.buttonRow}>
            <Button title="View Inventory" onPress={onViewInventory} style={styles.button} />
            <Button title="Close" variant="secondary" onPress={onClose} style={styles.button} />
          </View>
        </ScrollView>
      ) : null}
    </SheetFrame>
  );
}

export function CategoryInsightSheet({
  category,
  onClose,
}: {
  category: InsightCategory | null;
  onClose: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useThemeColors();
  const option = category ? catalogCategoryOptions.find(({ value }) => value === category.category) : null;
  const max = Math.max(1, ...(category?.monthlyMovement.map((item) => item.stockIn) ?? []), ...(category?.monthlyMovement.map((item) => item.stockOut) ?? []));
  return (
    <SheetFrame visible={Boolean(category)} onClose={onClose} title="Category Detail">
      {category ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing[4] }}>
          <View style={styles.productHeader}>
            <Text style={styles.productTitle}>{option?.label ?? category.category}</Text>
            <Text style={styles.meta}>{category.products} active {category.products === 1 ? "item" : "items"}</Text>
          </View>
          <View>
            {[
              ["Recorded Stock In", formatNumber(category.stockIn)],
              ["Recorded Stock Out", formatNumber(category.stockOut)],
              ["Net Movement", `${category.net > 0 ? "+" : ""}${formatNumber(category.net)}`],
              ["Healthy / Low / Critical", `${category.healthy} / ${category.low} / ${category.critical}`],
            ].map(([label, value]) => (
              <View key={label} style={styles.categoryMetricRow}>
                <Text style={styles.categoryMetricLabel}>{label}</Text>
                <Text style={styles.categoryMetricValue}>{value}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.explanation}>Category totals add recorded quantities. Product units can differ within a category.</Text>
          <View style={{ gap: spacing[2] }}>
            <Text style={styles.fieldLabel}>Monthly movement · last 6 months</Text>
            {category.monthlyMovement.length ? (
              <>
                <View style={styles.chartLegend}>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.primary[500] }]} /><Text style={styles.legendText}>In</Text></View>
                  <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: colors.semantic.danger }]} /><Text style={styles.legendText}>Out</Text></View>
                </View>
                {category.monthlyMovement.map((month) => (
                  <View key={month.monthKey} style={styles.chartRow}>
                    <Text style={styles.chartLabel}>{month.label}</Text>
                    <View style={styles.chartBars}>
                      <View style={styles.chartTrack}><View style={[styles.chartBarIn, { width: `${Math.max(0, month.stockIn / max * 100)}%` }]} /></View>
                      <View style={styles.chartTrack}><View style={[styles.chartBarOut, { width: `${Math.max(0, month.stockOut / max * 100)}%` }]} /></View>
                    </View>
                  </View>
                ))}
              </>
            ) : (
              <Text style={styles.explanation}>No category movements are recorded in this period yet.</Text>
            )}
          </View>
          <View style={{ gap: spacing[2] }}>
            <Text style={styles.fieldLabel}>Product activity</Text>
            <Text style={styles.explanation}>Top moving: {category.topMovingProduct ?? "No outgoing movement recorded"}</Text>
            <Text style={styles.explanation}>Slowest moving: {category.slowestProduct ?? "No outgoing movement recorded"}</Text>
          </View>
        </ScrollView>
      ) : null}
    </SheetFrame>
  );
}

export function ReportDetailSheet({
  report,
  onClose,
}: {
  report: InsightReport | null;
  onClose: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const { colors } = useTheme();
  return (
    <SheetFrame visible={Boolean(report)} onClose={onClose} title="Report Detail">
      {report ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: spacing[4] }}>
          <View style={styles.productHeader}>
            <Text style={styles.reportHeading}>{report.title}</Text>
            <Text style={styles.reportPeriod}>{report.storeName} · {report.periodLabel}</Text>
            <Text style={styles.reportTimestamp}>Saved {new Date(report.createdAt).toLocaleString()}</Text>
          </View>
          <View style={styles.summaryGrid}>
            <SummaryTile label="Total Products" value={report.summary.health.total} />
            <SummaryTile label="Low Stock" value={report.summary.health.low} color={colors.semantic.warning} />
            <SummaryTile label="Critical" value={report.summary.health.critical} color={colors.semantic.danger} />
            <SummaryTile label="Net Movement" value={`${report.summary.movement.net > 0 ? "+" : ""}${report.summary.movement.net}`} />
          </View>
          <View style={{ gap: spacing[2] }}>
            <Text style={styles.fieldLabel}>Period findings</Text>
            <Text style={styles.explanation}>{movementFinding("Stock In", report.summary.movement.stockIn, report.summary.previousMovement.stockIn, report.summary.comparisonLabel.replace(/^vs /, ""))}</Text>
            <Text style={styles.explanation}>{movementFinding("Stock Out", report.summary.movement.stockOut, report.summary.previousMovement.stockOut, report.summary.comparisonLabel.replace(/^vs /, ""))}</Text>
            {report.summary.previousMonthHealth ? (
              <Text style={styles.explanation}>Critical products: {report.summary.previousMonthHealth.critical} → {report.summary.health.critical} · Low stock: {report.summary.previousMonthHealth.low} → {report.summary.health.low} compared with the previous month’s snapshot.</Text>
            ) : (
              <Text style={styles.explanation}>No previous monthly health snapshot is available for comparison.</Text>
            )}
          </View>
          <View style={{ gap: spacing[2] }}>
            <Text style={styles.fieldLabel}>Stock Movement</Text>
            <View style={styles.categoryMetricRow}><Text style={styles.categoryMetricLabel}>Stock In</Text><Text style={styles.categoryMetricValue}>{report.summary.movement.stockIn}</Text></View>
            <View style={styles.categoryMetricRow}><Text style={styles.categoryMetricLabel}>Stock Out</Text><Text style={styles.categoryMetricValue}>{report.summary.movement.stockOut}</Text></View>
            <View style={styles.categoryMetricRow}><Text style={styles.categoryMetricLabel}>Adjustments</Text><Text style={styles.categoryMetricValue}>{report.summary.movement.adjustments}</Text></View>
          </View>
          {report.summary.recentMovements.length ? (
            <View style={{ gap: spacing[2] }}>
              <Text style={styles.fieldLabel}>Recent movement reasons</Text>
              {report.summary.recentMovements.map((movement, index) => (
                <View key={`${movement.productName}-${movement.createdAt}-${index}`} style={styles.categoryMetricRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.categoryMetricLabel}>{movement.productName} · {movement.type.replaceAll("_", " ")}</Text>
                    <Text style={styles.reportTimestamp}>{movement.reason} · {new Date(movement.createdAt).toLocaleString()}</Text>
                  </View>
                  <Text style={styles.categoryMetricValue}>{movement.delta > 0 ? "+" : "−"}{formatQuantity(Math.abs(movement.delta), movement.unit)}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <View style={{ gap: spacing[2] }}>
            <Text style={styles.fieldLabel}>Top Moving Products</Text>
            {report.summary.topMoving.length ? report.summary.topMoving.map((product, index) => (
              <View key={`${product.name}-${index}`} style={styles.categoryMetricRow}>
                <Text style={styles.categoryMetricLabel}>{product.name}</Text>
                <Text style={styles.categoryMetricValue}>{formatQuantity(product.stockOut, product.unit)}</Text>
              </View>
            )) : <Text style={styles.explanation}>No Stock Out movements were recorded for this period.</Text>}
            <Text style={styles.reportTimestamp}>{report.summary.noMovementCount} products had no movement in the last 30 days.</Text>
          </View>
          {report.summary.slowMoving.length ? (
            <View style={{ gap: spacing[2] }}>
              <Text style={styles.fieldLabel}>Slow Moving Products</Text>
              {report.summary.slowMoving.map((product, index) => (
                <View key={`${product.name}-${index}`} style={styles.categoryMetricRow}>
                  <Text style={styles.categoryMetricLabel}>{product.name}</Text>
                  <Text style={styles.categoryMetricValue}>{formatQuantity(product.stockOut, product.unit)}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {report.summary.noMovement.length ? (
            <View style={{ gap: spacing[2] }}>
              <Text style={styles.fieldLabel}>No Movement · 30 Days</Text>
              {report.summary.noMovement.map((product, index) => (
                <View key={`${product.name}-${index}`} style={styles.categoryMetricRow}>
                  <Text style={styles.categoryMetricLabel}>{product.name}</Text>
                  <Text style={styles.categoryMetricValue}>{product.lastMovementAt ? new Date(product.lastMovementAt).toLocaleDateString() : "No movement recorded"}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {report.summary.criticalProducts.length ? (
            <View style={{ gap: spacing[2] }}>
              <Text style={styles.fieldLabel}>Critical Products</Text>
              {report.summary.criticalProducts.map((product, index) => (
                <View key={`${product.name}-${index}`} style={styles.categoryMetricRow}>
                  <Text style={styles.categoryMetricLabel}>{product.name}</Text>
                  <Text style={styles.categoryMetricValue}>{formatQuantity(product.quantity, product.unit)}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {report.summary.lowProducts.length ? (
            <View style={{ gap: spacing[2] }}>
              <Text style={styles.fieldLabel}>Low Stock Products</Text>
              {report.summary.lowProducts.map((product, index) => (
                <View key={`${product.name}-${index}`} style={styles.categoryMetricRow}>
                  <Text style={styles.categoryMetricLabel}>{product.name}</Text>
                  <Text style={styles.categoryMetricValue}>{formatQuantity(product.quantity, product.unit)}</Text>
                </View>
              ))}
            </View>
          ) : null}
          {report.summary.categories.length ? (
            <View style={{ gap: spacing[2] }}>
              <Text style={styles.fieldLabel}>Category Breakdown</Text>
              {report.summary.categories.map((category) => (
                <View key={category.category} style={styles.categoryMetricRow}>
                  <Text style={styles.categoryMetricLabel}>{catalogCategoryOptions.find((item) => item.value === category.category)?.label ?? category.category}</Text>
                  <Text style={styles.categoryMetricValue}>{category.products} items · {formatNumber(category.stockOut)} out</Text>
                </View>
              ))}
            </View>
          ) : null}
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[2] }}>
            <MoreVertical size={16} color={colors.text.muted} />
            <Text style={styles.reportTimestamp}>This saved report stays in this store's local history.</Text>
          </View>
        </ScrollView>
      ) : null}
    </SheetFrame>
  );
}

function SummaryTile({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const styles = useThemeStyles(createStyles);
  return (
    <View style={styles.summaryTile}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, color ? { color } : null]}>{value}</Text>
    </View>
  );
}
