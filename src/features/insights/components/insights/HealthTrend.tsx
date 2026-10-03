import { Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import type { StoreInsights } from "@/services/insights";
import { useThemeStyles } from "@/theme/ThemeProvider";
import { createInsightsStyles } from "./insights.styles";

export default function HealthTrend({ data }: { data: StoreInsights }) {
  const styles = useThemeStyles(createInsightsStyles); const rows = data.monthlyHealth.slice(-6).reverse();
  return <Card style={styles.card}><View style={{ gap: 2 }}><Text style={styles.sectionTitle}>Stock health trend</Text><Text style={styles.sectionSubtitle}>Latest saved monthly snapshot for each month.</Text></View><View style={styles.healthHeader}><Text style={styles.healthHeaderText}>Healthy</Text><Text style={styles.healthHeaderText}>Low</Text><Text style={styles.healthHeaderText}>Out</Text></View>{rows.map((snapshot) => <View key={snapshot.monthKey} style={styles.healthRow}><Text style={styles.healthMonth}>{snapshot.monthKey}</Text><Text style={styles.healthValue}>{snapshot.healthy}</Text><Text style={styles.healthValue}>{snapshot.low}</Text><Text style={styles.healthValue}>{snapshot.outOfStock}</Text></View>)}<Text style={styles.caption}>Snapshots are saved locally as you open Insights.</Text></Card>;
}
