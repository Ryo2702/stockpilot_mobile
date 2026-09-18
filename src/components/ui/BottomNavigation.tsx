import type { LucideIcon } from "lucide-react-native";
import {
  Boxes,
  Camera,
  LayoutDashboard,
  Lightbulb,
  Package,
} from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, control, radii, spacing, typography } from "@/theme";

export type BottomNavKey =
  | "dashboard"
  | "catalog"
  | "camera"
  | "inventory"
  | "insights";

const navItems: Array<{ key: BottomNavKey; label: string; icon: LucideIcon }> =
  [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "catalog", label: "Catalog", icon: Package },
    { key: "camera", label: "Camera", icon: Camera },
    { key: "inventory", label: "Inventory", icon: Boxes },
    { key: "insights", label: "Insights", icon: Lightbulb },
  ];

type BottomNavigationProps = {
  activeKey: BottomNavKey;
  onChange?: (key: BottomNavKey) => void;
};

export function BottomNavigation({
  activeKey,
  onChange,
}: BottomNavigationProps) {
  return (
    <View style={styles.container}>
      {navItems.map(({ key, label, icon: Icon }) => {
        const active = key === activeKey;
        const isCamera = key === "camera";

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
                isCamera && styles.cameraButton,
                active && !isCamera && styles.activeIcon,
              ]}
            >
              <Icon
                color={
                  isCamera
                    ? colors.text.onPrimary
                    : active
                      ? colors.primary[600]
                      : colors.text.muted
                }
                size={isCamera ? 22 : 20}
                strokeWidth={active || isCamera ? 2.2 : 2}
              />
            </View>
            <Text style={[styles.label, active && styles.activeLabel]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-around",
    paddingTop: spacing[2],
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  item: {
    minWidth: 56,
    minHeight: control.md,
    flex: 1,
    alignItems: "center",
    gap: spacing[1],
  },
  activeIcon: {
    width: control.md,
    height: control.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.primary[50],
  },
  cameraButton: {
    width: control.lg,
    height: control.lg,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -spacing[3],
    borderRadius: radii.full,
    backgroundColor: colors.primary[600],
    borderWidth: 4,
    borderColor: colors.background.app,
  },
  label: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: "center",
  },
  activeLabel: {
    color: colors.primary[600],
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.7,
  },
});
