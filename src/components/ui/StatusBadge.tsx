import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

export type StockStatus = "healthy" | "low" | "critical" | "neutral";

const statusConfig: Record<
  StockStatus,
  { label: string; color: string; backgroundColor: string; icon: LucideIcon }
> = {
  healthy: {
    label: "Healthy",
    color: colors.semantic.success,
    backgroundColor: colors.semantic.successBackground,
    icon: CircleCheck,
  },
  low: {
    label: "Low Stock",
    color: colors.semantic.warning,
    backgroundColor: colors.semantic.warningBackground,
    icon: TriangleAlert,
  },
  critical: {
    label: "Critical",
    color: colors.semantic.danger,
    backgroundColor: colors.semantic.dangerBackground,
    icon: CircleAlert,
  },
  neutral: {
    label: "Not tracked",
    color: colors.text.muted,
    backgroundColor: colors.gray[100],
    icon: Info,
  },
};

type StatusBadgeProps = {
  status: StockStatus;
  label?: string;
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <View style={[styles.badge, { backgroundColor: config.backgroundColor }]}>
      <Icon color={config.color} size={14} strokeWidth={2.2} />
      <Text style={[styles.label, { color: config.color }]}>{label ?? config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    borderRadius: radii.full,
  },
  label: {
    ...typography.caption,
    fontWeight: "600",
  },
});
