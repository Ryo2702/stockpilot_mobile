import type { LucideIcon } from "lucide-react-native";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { control, radii, spacing, typography } from "@/theme";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = Omit<PressableProps, "children"> & {
  title: string;
  icon?: LucideIcon;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  icon: Icon,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const isDisabled = disabled || loading;
  const isLight = variant === "secondary" || variant === "ghost";
  const iconColor = isDisabled
    ? colors.text.disabled
    : variant === "danger"
      ? colors.white
      : variant === "primary"
        ? colors.text.onPrimary
        : colors.text.secondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        styles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && variant !== "ghost" && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={iconColor} size="small" />
      ) : (
        <>
          {Icon ? <Icon color={iconColor} size={size === "sm" ? 16 : 18} strokeWidth={2} /> : null}
          <Text style={[styles.label, isLight && styles.lightLabel, variant === "danger" && styles.dangerLabel, isDisabled && styles.disabledLabel]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  base: {
    minWidth: 88,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    borderWidth: 1,
    borderRadius: radii.md,
  },
  sm: {
    minHeight: control.sm,
    paddingHorizontal: spacing[3],
  },
  md: {
    minHeight: control.md,
    paddingHorizontal: spacing[4],
  },
  lg: {
    minHeight: control.lg,
    paddingHorizontal: spacing[5],
  },
  primary: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  secondary: {
    backgroundColor: colors.background.surface,
    borderColor: colors.border.default,
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  danger: {
    backgroundColor: colors.semantic.danger,
    borderColor: colors.semantic.danger,
  },
  label: {
    ...typography.label,
    color: colors.text.onPrimary,
  },
  lightLabel: {
    color: colors.text.primary,
  },
  dangerLabel: {
    color: colors.white,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    backgroundColor: colors.background.disabled,
    borderColor: colors.background.disabled,
  },
  disabledLabel: {
    color: colors.text.disabled,
  },
});
