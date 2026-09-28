import type { LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { control, radii } from "@/theme";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";

type IconButtonProps = Omit<PressableProps, "children"> & {
  icon: LucideIcon;
  label: string;
  size?: number;
  variant?: "default" | "primary" | "danger";
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon: Icon,
  label,
  size = 20,
  variant = "default",
  style,
  ...props
}: IconButtonProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const iconColor =
    variant === "primary"
      ? colors.text.onPrimary
      : variant === "danger"
        ? colors.semantic.danger
        : colors.primary[700];

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        variant === "primary" && styles.primary,
        variant === "danger" && styles.danger,
        pressed && styles.pressed,
        style,
      ]}
      {...props}
    >
      <Icon color={iconColor} size={size} strokeWidth={2} />
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  base: {
    width: control.md,
    height: control.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: radii.md,
    backgroundColor: "transparent",
  },
  primary: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  danger: {
    backgroundColor: colors.semantic.dangerBackground,
    borderColor: colors.semantic.dangerBackground,
  },
  pressed: {
    opacity: 0.76,
  },
});
