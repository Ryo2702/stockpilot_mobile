import type { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

import { radii, spacing } from "@/theme";
import { useThemeStyles } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";

export type CardVariant = "default" | "interactive" | "selected" | "critical";

type CardProps = PropsWithChildren<
  ViewProps & {
    variant?: CardVariant;
    style?: StyleProp<ViewStyle>;
  }
>;

export function Card({ children, variant = "default", style, ...props }: CardProps) {
  const styles = useThemeStyles(createStyles);

  return (
    <View style={[styles.base, styles[variant], style]} {...props}>
      {children}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  base: {
    padding: spacing[4],
    backgroundColor: colors.background.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.lg,
  },
  default: {},
  interactive: {
    borderColor: colors.border.strong,
  },
  selected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  critical: {
    backgroundColor: colors.semantic.dangerBackground,
    borderColor: colors.semantic.danger,
  },
});
