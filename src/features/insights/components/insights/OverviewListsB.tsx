import { ChartNoAxesCombined } from "lucide-react-native";
import { Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import type { InsightCategory, StoreInsights } from "@/services/insights";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";
import { createInsightsStyles } from "./insights.styles";
import { ActionRow } from "./InsightBasics";
import { CategoryRow } from "./InsightProductRows";

export function CategoryInsights({ data, onSelectCategory }: { data: StoreInsights; onSelectCategory: (category: InsightCategory) => void }) {
  const styles = useThemeStyles(createInsightsStyles); const colors = useTheme().colors; const categories = data.categories.slice(0, 4);
  return categories.length ? <Card style={styles.card}><View style={styles.row}><View style={{ flex: 1, gap: 2 }}><Text style={styles.sectionTitle}>Category insights</Text><Text style={styles.sectionSubtitle}>Activity by existing Catalog category</Text></View><ChartNoAxesCombined size={19} color={colors.primary[600]} /></View>{categories.map((category) => <CategoryRow key={category.category} category={category} onPress={onSelectCategory} />)}</Card> : null;
}

export function NextChecks({ data, onNavigate }: { data: StoreInsights; onNavigate: (key: "inventory") => void }) {
  const styles = useThemeStyles(createInsightsStyles); const hasActions = data.health.outOfStock || data.health.low || data.products.noMovementCount;
  return <Card style={styles.card}><Text style={styles.sectionTitle}>Next checks</Text>{data.health.outOfStock ? <ActionRow label="Restock Out-of-Stock Items" count={data.health.outOfStock} onPress={() => onNavigate("inventory")} /> : null}{data.health.low ? <ActionRow label="Review Low Stock" count={data.health.low} onPress={() => onNavigate("inventory")} /> : null}{data.products.noMovementCount ? <ActionRow label="Check Products with No Movement" count={data.products.noMovementCount} onPress={() => onNavigate("inventory")} /> : null}{data.movement.stockIn || data.movement.stockOut || data.movement.adjustments ? <ActionRow label="View Recent Stock Movements" onPress={() => onNavigate("inventory")} /> : null}{!hasActions ? <Text style={styles.caption}>No stock conditions need review.</Text> : null}</Card>;
}
