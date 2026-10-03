import type { LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from "react-native";

import { radii } from "@/theme";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";

type IconButtonProps = Omit<PressableProps, "children"> & {
  icon: LucideIcon;
  label: string;
  size?: number;
  variant?: "default" | "primary" | "danger";
  tone?: "primary" | "secondary";
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon: Icon,
  label,
  size = 20,
  variant = "default",
  tone = "secondary",
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
        : tone === "primary"
          ? colors.primary[600]
          : colors.secondary;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(props.disabled) }}
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
    width: 44,
    height: 44,
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
