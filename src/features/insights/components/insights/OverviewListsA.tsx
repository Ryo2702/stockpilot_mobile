import { Package, TrendingUp } from "lucide-react-native";
import { Text, View } from "react-native";
import type { InsightProduct, StoreInsights } from "@/services/insights";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";
import { Card } from "@/components/ui/Card";
import { createInsightsStyles } from "./insights.styles";
import { EmptyCopy, InlineAction } from "./InsightBasics";
import { ProductRow, RankedProduct } from "./InsightProductRows";

export function ReviewProducts({ data, onSelectProduct, onNavigate }: { data: StoreInsights; onSelectProduct: (product: InsightProduct) => void; onNavigate: (key: "inventory") => void }) {
  const styles = useThemeStyles(createInsightsStyles); const { colors } = useTheme(); const products = [...data.products.critical.slice(0, 2), ...data.products.low.slice(0, 2)].slice(0, 3);
  return products.length ? <Card style={styles.card}><View style={styles.row}><View style={{ flex: 1, gap: 2 }}><Text style={styles.sectionTitle}>Products to review</Text><Text style={styles.sectionSubtitle}>Stock is at or below reorder level.</Text></View><Package size={19} color={colors.semantic.warning} /></View>{products.map((product) => <ProductRow key={product.id} product={product} onPress={onSelectProduct} />)}<InlineAction label="Open Inventory" onPress={() => onNavigate("inventory")} /></Card> : null;
}

export function TopMoving({ data, onSelectProduct }: { data: StoreInsights; onSelectProduct: (product: InsightProduct) => void }) {
  const styles = useThemeStyles(createInsightsStyles); const comparison = data.period.comparisonLabel.replace(/^vs /, "");
  return data.products.topMoving.length ? <Card style={styles.card}><View style={styles.row}><View style={{ flex: 1, gap: 2 }}><Text style={styles.sectionTitle}>Top moving products</Text><Text style={styles.sectionSubtitle}>Ranked by Stock Out · {data.period.label}</Text></View><TrendingUp size={19} color={useTheme().colors.primary[600]} /></View>{data.products.topMoving.slice(0, 3).map((product, index) => <View key={product.id} style={styles.row}><Text style={[styles.caption, { width: 18 }]}>{index + 1}</Text><View style={{ flex: 1 }}><RankedProduct product={product} rank={index + 1} comparisonLabel={comparison} onPress={onSelectProduct} /></View></View>)}</Card> : null;
}
