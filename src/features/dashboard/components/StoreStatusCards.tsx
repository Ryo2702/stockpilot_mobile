import { Boxes, CircleAlert, CircleCheck, TriangleAlert } from "lucide-react-native";
import { Text, useWindowDimensions, View } from "react-native";

import { Card } from "@/components/ui/Card";
import type { OwnerStoreOverview } from "@/services/owner-store.service";
import { radii, spacing, typography, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";

const createStyles = (colors: ThemeColors) => ({
  layout: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: spacing[2],
  },
  catalogCard: {
    flexGrow: 1.7,
    flexBasis: 124,
    minWidth: 106,
    minHeight: 72,
    justifyContent: "space-between" as const,
    padding: spacing[2],
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[100],
  },
  catalogHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: spacing[1],
  },
  catalogLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    flexShrink: 1,
  },
  catalogCount: {
    ...typography.h2,
    color: colors.text.primary,
    lineHeight: 28,
  },
  statusCard: {
    flexGrow: 1,
    flexBasis: 64,
    minWidth: 62,
    minHeight: 72,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: spacing[1],
    padding: spacing[1],
  },
  statusHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: spacing[1],
    minWidth: 0,
  },
  iconBadge: {
    width: 14,
    height: 14,
    borderRadius: radii.full,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexShrink: 0,
  },
  statusCount: {
    ...typography.label,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700" as const,
    color: colors.text.primary,
  },
  statusLabel: {
    ...typography.caption,
    fontSize: 10,
    lineHeight: 12,
    color: colors.text.secondary,
    textAlign: "center" as const,
    flexShrink: 1,
  },
});

export default function StoreStatusCards({ overview }: { overview: OwnerStoreOverview | null }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const compact = useWindowDimensions().width < 380;
  const statuses = [
    {
      key: "healthy",
      label: "Healthy",
      count: overview?.healthyCount ?? 0,
      color: colors.semantic.success,
      background: colors.semantic.successBackground,
      Icon: CircleCheck,
    },
    {
      key: "lowStock",
      label: "Low Stock",
      count: overview?.lowStockCount ?? 0,
      color: colors.semantic.warning,
      background: colors.semantic.warningBackground,
      Icon: TriangleAlert,
    },
    {
      key: "critical",
      label: "Critical",
      count: overview?.criticalCount ?? 0,
      color: colors.semantic.danger,
      background: colors.semantic.dangerBackground,
      Icon: CircleAlert,
    },
  ];

  return (
    <View style={[styles.layout, compact && { flexWrap: "nowrap" as const, gap: spacing[1] }]}>
      <Card
        style={[
          styles.catalogCard,
          compact && { flexBasis: "38%" as const, minWidth: 0, padding: spacing[1] },
        ]}
      >
        <View style={[styles.catalogHeader, compact && { gap: spacing[1] }]}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.catalogLabel, compact && { fontSize: 10 }]}
          >
            Total Products
          </Text>
          <Boxes color={colors.primary[600]} size={compact ? 16 : 19} />
        </View>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={[styles.catalogCount, compact && { fontSize: 21 }]}
        >
          {overview ? overview.productCount.toLocaleString() : "—"}
        </Text>
      </Card>
      {statuses.map(({ key, label, count, color, background, Icon }) => (
        <Card
          key={key}
          style={[
            styles.statusCard,
            compact && { flexBasis: "18.5%" as const, minWidth: 0, paddingHorizontal: 2 },
            { backgroundColor: background, borderColor: background },
          ]}
        >
          <View style={[styles.statusHeader, compact && { gap: 2 }]}>
            <View
              style={[
                styles.iconBadge,
                compact && { width: 12, height: 12 },
                { backgroundColor: color },
              ]}
            >
              <Icon color={colors.white} size={compact ? 8 : 9} strokeWidth={3} />
            </View>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.statusLabel, compact && { fontSize: 8 }]}
            >
              {label}
            </Text>
          </View>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={[styles.statusCount, compact && { fontSize: 14 }]}
          >
            {overview ? count.toLocaleString() : "—"}
          </Text>
        </Card>
      ))}
    </View>
  );
}
