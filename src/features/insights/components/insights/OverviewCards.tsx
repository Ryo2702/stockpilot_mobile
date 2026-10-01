import { Activity, Package } from "lucide-react-native";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { StoreInsights } from "@/services/insights";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";

import { HealthCountCard, MetricTile } from "./InsightBasics";
import { createInsightsStyles } from "./insights.styles";
import { dataFindings, formatNumber, movementChange } from "./insights.utils";

export function InventoryHealth({ data, onNavigate }: { data: StoreInsights; onNavigate: (key: "inventory") => void }) {
  const styles = useThemeStyles(createInsightsStyles); const { colors } = useTheme();
  return <><View style={styles.section}><Text style={styles.sectionTitle}>Inventory health</Text><Text style={styles.sectionSubtitle}>Current stock in this report scope</Text></View><Card style={styles.totalCard}><Text style={styles.totalLabel}>Total Products</Text><Text style={styles.totalValue}>{formatNumber(data.health.total)}</Text><Text style={styles.totalFoot}>{data.scopeLabel}</Text></Card><View style={styles.statusGrid}><HealthCountCard label="Healthy" count={data.health.healthy} color={colors.semantic.success} /><HealthCountCard label="Low Stock" count={data.health.low} color={colors.semantic.warning} /><HealthCountCard label="Out of Stock" count={data.health.outOfStock} color={colors.semantic.danger} /></View>{!data.hasMovementHistory ? <Card style={styles.card}><Text style={styles.sectionTitle}>No movement insights yet</Text><Text style={styles.sectionSubtitle}>Keep recording inventory movements. Trends and activity will appear once this store has stock history.</Text><Button title="Go to Inventory" onPress={() => onNavigate("inventory")} /></Card> : null}</>;
}

export function PeriodComparison({ data }: { data: StoreInsights }) {
  const styles = useThemeStyles(createInsightsStyles); const { colors } = useTheme();
  return <Card style={styles.card}><View style={styles.row}><View style={{ flex: 1, gap: 2 }}><Text style={styles.sectionTitle}>Period comparison</Text><Text style={styles.comparisonLabel}>{data.period.comparisonLabel}</Text></View><Activity size={18} color={colors.primary[600]} /></View><View style={styles.comparisonGrid}><MetricTile label="Stock In" value={formatNumber(data.movement.stockIn)} change={movementChange(data.movement.stockIn, data.previousMovement.stockIn, data.period.comparisonLabel.replace(/^vs /, ""))} /><MetricTile label="Stock Out" value={formatNumber(data.movement.stockOut)} change={movementChange(data.movement.stockOut, data.previousMovement.stockOut, data.period.comparisonLabel.replace(/^vs /, ""))} /><MetricTile label="Net Movement" value={`${data.movement.net > 0 ? "+" : ""}${formatNumber(data.movement.net)}`} change={`${data.movement.net - data.previousMovement.net > 0 ? "+" : ""}${formatNumber(data.movement.net - data.previousMovement.net)} vs ${data.period.comparisonLabel.replace(/^vs /, "")}`} /></View>{data.previousMonthHealth ? <Text style={styles.comparisonNote}>Current health vs last month&apos;s snapshot: Low {data.health.low} vs {data.previousMonthHealth.low} · Out of stock {data.health.outOfStock} vs {data.previousMonthHealth.outOfStock}.</Text> : <Text style={styles.comparisonNote}>Monthly health history builds as snapshots are recorded.</Text>}</Card>;
}

export function KeyFindings({ data }: { data: StoreInsights }) {
  const styles = useThemeStyles(createInsightsStyles); const findings = dataFindings(data);
  return <Card style={styles.card}><View style={styles.row}><Text style={styles.sectionTitle}>Key findings</Text><Text style={styles.caption}>From recorded activity</Text></View>{findings.length ? findings.map((finding, index) => <View key={`${index}-${finding}`} style={styles.findingRow}><View style={styles.findingBullet} /><Text style={styles.findingText}>{finding}</Text></View>) : <Text style={styles.caption}>No current conditions need attention.</Text>}</Card>;
}
