import { StyleSheet } from "react-native";

import { radii, spacing, typography } from "@/theme";
import type { ThemeColors } from "@/theme/tokens";

export const createOwnerStoreStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.app,
  },
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: spacing[4],
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[10],
  },
  trialCard: {
    gap: spacing[1],
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.primary[100],
    borderRadius: radii.md,
    backgroundColor: colors.primary[50],
  },
  trialTitle: { ...typography.label, color: colors.primary[700] },
  trialDate: { ...typography.caption, color: colors.text.secondary },
});
