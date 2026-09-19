import type { LucideIcon } from "lucide-react-native";
import {
  Boxes,
  Camera,
  ChartNoAxesCombined,
  House,
  Store,
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
    { key: "dashboard", label: "Home", icon: House },
    { key: "catalog", label: "Catalog", icon: Boxes },
    { key: "camera", label: "Camera", icon: Camera },
    { key: "insights", label: "Insights", icon: ChartNoAxesCombined },
    { key: "inventory", label: "Inventory", icon: Store },
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
                styles.iconSlot,
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
                      : colors.text.primary
                }
                size={isCamera ? 22 : 21}
                strokeWidth={active || isCamera ? 2.2 : 2}
              />
            </View>
            <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 80,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: spacing[4],
    marginBottom: spacing[2],
    paddingHorizontal: spacing[1],
    paddingVertical: spacing[1],
    borderWidth: 1,
    borderColor: colors.gray[900],
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
  },
  cameraButton: {
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
    color: colors.primary[600],
    fontWeight: "600",
  },
  pressed: {
    opacity: 0.7,
  },
});
