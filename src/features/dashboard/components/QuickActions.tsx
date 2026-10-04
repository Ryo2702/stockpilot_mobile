import {
  ArrowUpFromLine,
  PackagePlus,
  Plus,
  ScanLine,
  type LucideIcon,
} from "lucide-react-native";
import { Pressable, Text, useWindowDimensions, View } from "react-native";

import type { BottomNavKey } from "@/components/ui/BottomNavigation";
import { radii, spacing, typography, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";

const createStyles = (colors: ThemeColors) => ({
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: spacing[2],
  },
  title: {
    ...typography.section,
    color: colors.text.primary,
  },
  seeAll: {
    ...typography.label,
    fontWeight: "600" as const,
    color: colors.primary[600],
  },
  actions: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: spacing[2],
  },
  tile: {
    flexGrow: 1,
    flexBasis: 72,
    minWidth: 64,
    minHeight: 68,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: spacing[1],
    padding: spacing[2],
    borderWidth: 1,
    borderRadius: radii.md,
  },
  label: {
    ...typography.label,
    color: colors.text.primary,
    textAlign: "center" as const,
  },
  pressed: { opacity: 0.75 },
});

export default function QuickActions({
  onNavigate,
  onAddItem,
}: {
  onNavigate?: (key: BottomNavKey) => void;
  onAddItem?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const compact = useWindowDimensions().width < 380;
  const actions: Array<{
    label: string;
    Icon: LucideIcon;
    key: BottomNavKey;
    color: string;
    background: string;
  }> = [
    {
      label: "Scan Item",
      Icon: ScanLine,
      key: "camera",
      color: colors.primary[600],
      background: colors.primary[50],
    },
    {
      label: "Add Item",
      Icon: Plus,
      key: "catalog",
      color: colors.primary[600],
      background: colors.primary[50],
    },
    {
      label: "Stock In",
      Icon: PackagePlus,
      key: "inventory",
      color: colors.secondary,
      background: colors.secondarySoft,
    },
    {
      label: "Stock Out",
      Icon: ArrowUpFromLine,
      key: "inventory",
      color: colors.primary[600],
      background: colors.primary[50],
    },
  ];

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Quick Actions</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="See all inventory actions"
          disabled={!onNavigate}
          onPress={() => onNavigate?.("inventory")}
        >
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>
      <View style={[styles.actions, compact && { gap: spacing[2] }]}>
        {actions.map(({ label, Icon, key, color, background }) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityLabel={label}
            disabled={!onNavigate && !onAddItem}
            onPress={() => label === "Add Item" && onAddItem ? onAddItem() : onNavigate?.(key)}
            style={({ pressed }) => [
              styles.tile,
              compact && { flexBasis: "47%" as const, minWidth: 0 },
              { backgroundColor: background, borderColor: background },
              pressed && styles.pressed,
            ]}
          >
            <Icon color={color} size={19} strokeWidth={2.2} />
            <Text style={styles.label}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
