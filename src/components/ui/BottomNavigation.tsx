import type { LucideIcon } from "lucide-react-native";
import {
  Boxes,
  ChartNoAxesCombined,
  House,
  Package,
  ReceiptText,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { radii, spacing, typography } from "@/theme";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";

export type BottomNavKey =
  | "dashboard"
  | "catalog"
  | "camera"
  | "inventory"
  | "insights"
  | "pos"
  | "more";

type BottomNavItemKey = Exclude<BottomNavKey, "camera" | "more">;

const navItems: Array<{ key: BottomNavItemKey; label: string; icon: LucideIcon }> = [
  { key: "dashboard", label: "Dashboard", icon: House },
  { key: "inventory", label: "Inventory", icon: Package },
  { key: "pos", label: "POS", icon: ReceiptText },
  { key: "catalog", label: "Catalog", icon: Boxes },
  { key: "insights", label: "Insights", icon: ChartNoAxesCombined },
];

type BottomNavigationProps = {
  activeKey: BottomNavItemKey | null;
  onChange?: (key: BottomNavItemKey) => void;
};

export function BottomNavigation({
  activeKey,
  onChange,
}: BottomNavigationProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  return (
    <View style={styles.container}>
      {navItems.map(({ key, label, icon: Icon }) => {
        const active = key === activeKey;

        return (
          <Pressable
            key={key}
            accessibilityLabel={label}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange?.(key)}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <View
              style={[
                styles.iconSlot,
                active && styles.activeIcon,
              ]}
            >
              <Icon
                color={active ? colors.primary[700] : colors.text.muted}
                size={20}
                strokeWidth={active ? 2.2 : 2}
              />
            </View>
            <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.label, active && styles.activeLabel]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[2],
    paddingTop: spacing[1],
    paddingBottom: spacing[2],
    borderTopWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: colors.background.surface,
  },
  item: {
    minHeight: 60,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[1],
  },
  iconSlot: {
    width: 36,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
  },
  activeIcon: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[600],
  },
  label: {
    ...typography.label,
    color: colors.text.secondary,
    textAlign: "center",
  },
  activeLabel: {
    color: colors.primary[700],
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.7,
  },
});
