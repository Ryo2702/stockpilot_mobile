import type { ReactNode } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { spacing, typography, useThemeStyles } from "@/theme";
import type { ThemeColors } from "@/theme/tokens";

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  actions?: ReactNode;
  context?: ReactNode;
};

export default function ScreenHeader({
  title,
  subtitle,
  leading,
  actions,
  context,
}: ScreenHeaderProps) {
  const compact = useWindowDimensions().width < 390;
  const styles = useThemeStyles(createStyles);

  return (
    <View style={styles.container}>
      <View style={[styles.row, compact && styles.compactRow]}>
        <View style={styles.heading}>
          {leading}
          <View style={styles.copy}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
        </View>
        {actions ? (
          <View style={[styles.actions, compact && styles.compactActions]}>
            {actions}
          </View>
        ) : null}
      </View>
      {context ? <View style={styles.context}>{context}</View> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    gap: spacing[3],
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
  },
  compactRow: {
    flexDirection: "column",
    alignItems: "stretch",
  },
  heading: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  copy: {
    minWidth: 0,
    flexShrink: 1,
    gap: spacing[1],
  },
  title: {
    ...typography.h2,
    color: colors.primary[700],
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  actions: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  compactActions: {
    alignSelf: "flex-end",
  },
  context: {
    alignItems: "flex-start",
  },
});
