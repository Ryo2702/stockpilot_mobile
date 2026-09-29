import { useEffect, useRef, useState } from "react";
import { Animated, Text, useWindowDimensions, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { Card } from "@/components/ui/Card";
import type { OwnerStoreOverview } from "@/services/owner-store.service";
import { radii, spacing, typography, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";

const donutRadius = 40;
const donutCircumference = 2 * Math.PI * donutRadius;

const createStyles = (colors: ThemeColors) => ({
  card: {
    gap: spacing[3],
    padding: spacing[3],
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  body: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing[3],
  },
  donut: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  donutCenter: {
    position: "absolute" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  totalLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    textAlign: "center" as const,
  },
  totalCount: {
    ...typography.h2,
    color: colors.text.primary,
    lineHeight: 30,
  },
  statusList: {
    minWidth: 0,
    flex: 1,
    gap: spacing[2],
  },
  statusRow: {
    minHeight: 44,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radii.md,
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: radii.full,
    flexShrink: 0,
  },
  statusLabel: {
    ...typography.bodySmall,
    minWidth: 0,
    flex: 1,
    color: colors.text.primary,
    fontWeight: "500" as const,
  },
  statusCount: {
    ...typography.label,
    color: colors.text.primary,
    fontWeight: "700" as const,
  },
  percentage: {
    ...typography.caption,
    minWidth: 30,
    color: colors.text.secondary,
    textAlign: "right" as const,
  },
});

export default function StoreStatusCards({ overview }: { overview: OwnerStoreOverview | null }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const compact = useWindowDimensions().width < 380;
  const total = overview?.productCount ?? 0;
  const healthy = overview?.healthyCount ?? 0;
  const lowStock = overview?.lowStockCount ?? 0;
  const critical = overview?.criticalCount ?? 0;
  const statuses: Array<{
    key: string;
    label: string;
    count: number;
    color: string;
    background: string;
  }> = [
    {
      key: "healthy",
      label: "Healthy",
      count: healthy,
      color: colors.semantic.success,
      background: colors.semantic.successBackground,
    },
    {
      key: "lowStock",
      label: "Low Stock",
      count: lowStock,
      color: colors.semantic.warning,
      background: colors.semantic.warningBackground,
    },
    {
      key: "critical",
      label: "Critical",
      count: critical,
      color: colors.semantic.danger,
      background: colors.semantic.dangerBackground,
    },
  ];
  const statusTotal = statuses.reduce((sum, status) => sum + status.count, 0);
  const donutSize = compact ? 116 : 136;
  const animatedTotal = useCountUp(total);
  const animatedCounts = [useCountUp(healthy), useCountUp(lowStock), useCountUp(critical)];
  let offset = 0;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>Inventory Summary</Text>
      </View>
      <View style={styles.body}>
        <View style={[styles.donut, { width: donutSize, height: donutSize }]}>
          <Svg width={donutSize} height={donutSize} viewBox="0 0 100 100">
            <Circle
              cx="50"
              cy="50"
              r={donutRadius}
              fill="none"
              stroke={colors.background.subtle}
              strokeWidth="14"
            />
            {statuses.map((status) => {
              const segment = statusTotal ? (status.count / statusTotal) * donutCircumference : 0;
              const visibleSegment = Math.max(segment - 2, 0);
              const segmentOffset = offset;
              offset += segment;

              return visibleSegment ? (
                <Circle
                  key={status.key}
                  cx="50"
                  cy="50"
                  r={donutRadius}
                  fill="none"
                  stroke={status.color}
                  strokeWidth="14"
                  strokeDasharray={`${visibleSegment} ${donutCircumference}`}
                  strokeDashoffset={-segmentOffset}
                  transform="rotate(-90 50 50)"
                />
              ) : null;
            })}
          </Svg>
          <View style={styles.donutCenter}>
            <Text style={styles.totalLabel}>Total Items</Text>
            <Text style={styles.totalCount}>{overview ? animatedTotal.toLocaleString() : "—"}</Text>
          </View>
        </View>

        <View style={styles.statusList}>
          {statuses.map(({ key, label, count, color, background }, index) => {
            const percentage = statusTotal ? Math.round((count / statusTotal) * 100) : 0;
            return (
              <View
                key={key}
                accessibilityLabel={`${label}, ${count} items, ${percentage}% of inventory`}
                style={[styles.statusRow, { backgroundColor: background }]}
              >
                <View style={[styles.statusDot, { backgroundColor: color }]} />
                <Text numberOfLines={1} style={styles.statusLabel}>{label}</Text>
                <Text style={styles.statusCount}>{overview ? animatedCounts[index].toLocaleString() : "—"}</Text>
                <Text style={[styles.percentage, { color }]}>{overview ? `${percentage}%` : "—"}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </Card>
  );
}

function useCountUp(value: number) {
  const animation = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    animation.stopAnimation();
    animation.setValue(0);
    const listener = animation.addListener(({ value: nextValue }) => {
      setDisplayValue(Math.round(nextValue));
    });
    const timing = Animated.timing(animation, {
      toValue: value,
      duration: 420,
      useNativeDriver: false,
    });

    timing.start(({ finished }) => {
      if (finished) setDisplayValue(value);
    });
    return () => {
      timing.stop();
      animation.removeListener(listener);
    };
  }, [animation, value]);

  return displayValue;
}
