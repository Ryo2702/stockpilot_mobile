import { Pressable, Text, View } from "react-native";
import type { InsightProduct, StoreInsights } from "@/services/insights";
import { useThemeStyles } from "@/theme/ThemeProvider";
import { createInsightsStyles } from "./insights.styles";
import type { TrendsTab } from "./insights.types";
import ActivityTrend from "./ActivityTrend";
import HealthTrend from "./HealthTrend";
import MovementTrend from "./MovementTrend";

export default function TrendsContent({ data, selected, onSelect, onSelectProduct }: { data: StoreInsights; selected: TrendsTab; onSelect: (tab: TrendsTab) => void; onSelectProduct: (product: InsightProduct) => void }) {
  const styles = useThemeStyles(createInsightsStyles); const tabs: Array<{ id: TrendsTab; label: string }> = [{ id: "movement", label: "Stock Movement" }, { id: "health", label: "Stock Health" }, { id: "activity", label: "Product Activity" }];
  return <><View style={styles.section}><Text style={styles.sectionTitle}>Trends</Text><Text style={styles.sectionSubtitle}>Historical activity for this store.</Text></View><View style={styles.trendTabs}>{tabs.map((tab) => <Pressable key={tab.id} accessibilityRole="tab" accessibilityState={{ selected: selected === tab.id }} onPress={() => onSelect(tab.id)} style={[styles.trendTab, selected === tab.id && styles.trendTabActive]}><Text style={[styles.trendTabText, selected === tab.id && styles.trendTabTextActive]}>{tab.label}</Text></Pressable>)}</View>{selected === "movement" ? <MovementTrend data={data} /> : selected === "health" ? <HealthTrend data={data} /> : <ActivityTrend data={data} onSelectProduct={onSelectProduct} />}</>;
}
