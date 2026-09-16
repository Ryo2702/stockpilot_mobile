import type { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from "react-native";

import { colors, radii, spacing } from "@/theme";

export type CardVariant = "default" | "interactive" | "selected" | "critical";

type CardProps = PropsWithChildren<
  ViewProps & {
    variant?: CardVariant;
    style?: StyleProp<ViewStyle>;
  }
>;

export function Card({ children, variant = "default", style, ...props }: CardProps) {
  return (
    <View style={[styles.base, styles[variant], style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderColor: colors.primary[200],
  },
  critical: {
    backgroundColor: colors.semantic.dangerBackground,
    borderColor: colors.semantic.danger,
  },
});

