import type { LucideIcon } from "lucide-react-native";
import {
  Boxes,
  ChartNoAxesCombined,
  House,
  Package,
  ReceiptText,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { control, radii, spacing, typography } from "@/theme";
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
  { key: "dashboard", label: "Home", icon: House },
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
        const isPos = key === "pos";

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
                isPos && styles.posButton,
                active && !isPos && styles.activeIcon,
              ]}
            >
              <Icon
                color={
                  isPos
                    ? colors.text.onPrimary
                    : active
                      ? colors.primary[700]
                      : colors.text.muted
                }
                size={isPos ? 22 : 21}
                strokeWidth={active || isPos ? 2.2 : 2}
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
    minHeight: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: spacing[3],
    marginBottom: spacing[2],
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[1],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.xl,
    backgroundColor: colors.background.surface,
  },
  item: {
    minHeight: 72,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[1],
  },
  iconSlot: {
    width: control.md,
    height: control.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
  },
  activeIcon: {
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[600],
  },
  posButton: {
    width: 52,
    height: 52,
    backgroundColor: colors.primary[600],
    borderRadius: radii.full,
  },
  label: {
    ...typography.caption,
    color: colors.text.muted,
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
