import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";

import { createInsightsStyles } from "./insights.styles";
import { formatNumber } from "./insights.utils";

export type ChartSegment = { key: string; label: string; value: number; color: string };

export default function DonutChart({ title, segments }: { title: string; segments: ChartSegment[] }) {
  const styles = useThemeStyles(createInsightsStyles); const { colors } = useTheme();
  const total = segments.reduce((sum, segment) => sum + segment.value, 0); const circumference = 2 * Math.PI * 38; let offset = 0;
  return <View style={styles.chartPanel} accessibilityLabel={`${title}, ${total} total`}>
    <Text style={styles.chartTitle}>{title}</Text><View style={styles.donutWrap}>
      <Svg width={122} height={122} viewBox="0 0 100 100"><Circle cx="50" cy="50" r="38" fill="none" stroke={colors.background.subtle} strokeWidth="14" />
        {segments.map((segment) => { const length = total ? segment.value / total * circumference : 0; const visible = Math.max(length - 2, 0); const segmentOffset = offset; offset += length; return visible ? <Circle key={segment.key} cx="50" cy="50" r="38" fill="none" stroke={segment.color} strokeWidth="14" strokeDasharray={`${visible} ${circumference}`} strokeDashoffset={-segmentOffset} transform="rotate(-90 50 50)" /> : null; })}
      </Svg><View style={styles.donutCenter}><Text style={styles.donutValue}>{formatNumber(total)}</Text><Text style={styles.donutLabel}>items</Text></View>
    </View><View style={styles.chartLegend}>{segments.map((segment) => <View key={segment.key} style={styles.chartLegendRow}><View style={[styles.chartLegendDot, { backgroundColor: segment.color }]} /><Text numberOfLines={1} style={styles.chartLegendLabel}>{segment.label}</Text><Text style={styles.chartLegendValue}>{formatNumber(segment.value)}</Text></View>)}</View>
  </View>;
}
