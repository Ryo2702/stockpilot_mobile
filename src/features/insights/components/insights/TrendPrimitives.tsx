import { Text, View } from "react-native";
import { useThemeStyles } from "@/theme/ThemeProvider";
import { createInsightsStyles } from "./insights.styles";

export function Legend({ color, label }: { color: string; label: string }) {
  const styles = useThemeStyles(createInsightsStyles); return <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: color }]} /><Text style={styles.legendText}>{label}</Text></View>;
}

export function Bar({ value, max, valueStyle }: { value: number; max: number; valueStyle: object }) {
  const styles = useThemeStyles(createInsightsStyles); return <View style={styles.barLine}><View style={styles.barTrack}><View style={[valueStyle, { width: `${value === 0 ? 0 : Math.max(2, value / max * 100)}%` }]} /></View><Text style={styles.barValue}>{value.toLocaleString()}</Text></View>;
}
