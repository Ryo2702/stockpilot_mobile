import { ArrowDownToLine, ArrowUpFromLine, History } from "lucide-react-native";
import { Text, View } from "react-native";

import { Card } from "@/components/ui/Card";
import type { BottomNavKey } from "@/components/ui/BottomNavigation";
import type { OwnerStoreOverview as OwnerStoreOverviewData } from "@/services/owner-store.service";
import { getStoreStockHealthState } from "@/services/stock-health.service";
import { radii, spacing, typography, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";

import QuickActions from "./QuickActions";
import StockHealthCard from "./StockHealthCard";
import StoreStatusCards from "./StoreStatusCards";

type RecentActivityRecord = OwnerStoreOverviewData["recentActivities"][number];

const createStyles = (colors: ThemeColors) => ({
  activityCard: { gap: spacing[3] },
  activityHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  activityTitle: { ...typography.label, color: colors.text.primary },
  activityList: { gap: spacing[3] },
  activityRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: spacing[3],
  },
  activityIcon: {
    width: 36,
    height: 36,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderRadius: radii.md,
  },
  activityCopy: { flex: 1, minWidth: 0, gap: spacing[1] },
  activityProduct: { ...typography.bodySmall, color: colors.text.primary, fontWeight: "600" as const },
  activityDetails: { ...typography.caption, color: colors.text.muted },
  activityDelta: { ...typography.label, textAlign: "right" as const },
  activityEmpty: { ...typography.bodySmall, color: colors.text.muted },
});

type OwnerStoreOverviewProps = {
  overview: OwnerStoreOverviewData | null;
  onNavigate?: (key: BottomNavKey) => void;
};

export default function OwnerStoreOverview({ overview, onNavigate }: OwnerStoreOverviewProps) {
  const { colors } = useTheme();
  const healthState = getStoreStockHealthState({
    productCount: overview?.productCount ?? 0,
    lowStockCount: overview?.lowStockCount ?? 0,
    criticalCount: overview?.criticalCount ?? 0,
  });
  const styles = useThemeStyles(createStyles);

  return (
    <View style={{ gap: spacing[3] }}>
      <StoreStatusCards overview={overview} />
      <StockHealthCard state={healthState} />
      <QuickActions onNavigate={onNavigate} />
      <Card style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <Text style={styles.activityTitle}>Recent Activities</Text>
          <History color={colors.text.muted} size={18} />
        </View>
        {overview?.recentActivities.length ? (
          <View style={styles.activityList}>
            {overview.recentActivities.map((activity) => (
              <RecentActivity key={activity.id} activity={activity} />
            ))}
          </View>
        ) : (
          <Text style={styles.activityEmpty}>No recent stock activity yet.</Text>
        )}
      </Card>
    </View>
  );
}

function RecentActivity({ activity }: { activity: RecentActivityRecord }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const added = activity.delta > 0;
  const color = added ? colors.semantic.success : colors.semantic.danger;
  const Icon = added ? ArrowDownToLine : ArrowUpFromLine;

  return (
    <View style={styles.activityRow}>
      <View
        style={[
          styles.activityIcon,
          { backgroundColor: added ? colors.semantic.successBackground : colors.semantic.dangerBackground },
        ]}
      >
        <Icon color={color} size={18} />
      </View>
      <View style={styles.activityCopy}>
        <Text numberOfLines={1} style={styles.activityProduct}>{activity.productName}</Text>
        <Text numberOfLines={1} style={styles.activityDetails}>
          {formatActivityReason(activity.reason)} · {formatActivityDate(activity.createdAt)}
        </Text>
      </View>
      <Text style={[styles.activityDelta, { color }]}>
        {added ? "+" : ""}{activity.delta} {activity.unit}
      </Text>
    </View>
  );
}

function formatActivityReason(reason: string) {
  if (reason === "initial") return "Initial stock";
  if (reason === "csv_import") return "Inventory import";
  return reason.replaceAll("_", " ").replace(/^./, (first) => first.toUpperCase());
}

function formatActivityDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}
