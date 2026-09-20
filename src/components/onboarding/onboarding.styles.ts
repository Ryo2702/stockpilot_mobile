import { StyleSheet } from "react-native";

import { control, radii, spacing, typography, useThemeStyles } from "@/theme";
import type { ThemeColors } from "@/theme/tokens";

const createOnboardingStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.surface,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[8],
  },
  content: {
    width: "100%",
    alignSelf: "center",
    maxWidth: 420,
    gap: spacing[8],
  },
  hero: {
    alignItems: "center",
  },
  mascot: {
    width: 150,
    height: 150,
    marginBottom: spacing[4],
  },
  heading: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: "center",
  },
  featureHeading: {
    maxWidth: 260,
  },
  title: {
    ...typography.title,
    marginTop: spacing[1],
    color: colors.text.primary,
    textAlign: "center",
  },
  subtitle: {
    ...typography.caption,
    maxWidth: 300,
    marginTop: spacing[2],
    color: colors.text.secondary,
    textAlign: "center",
  },
  form: {
    gap: spacing[3],
  },
  formIntro: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  formSection: {
    gap: spacing[3],
  },
  sectionTitle: {
    ...typography.title,
    color: colors.text.primary,
  },
  field: {
    gap: spacing[1],
  },
  columnGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  column: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 140,
    minWidth: 140,
    gap: spacing[1],
  },
  fieldLabel: {
    ...typography.label,
    color: colors.text.primary,
  },
  optional: {
    ...typography.caption,
    color: colors.text.muted,
  },
  input: {
    minHeight: control.lg,
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radii.md,
    color: colors.text.primary,
    backgroundColor: colors.background.surface,
    ...typography.caption,
  },
  inputError: {
    borderColor: colors.semantic.danger,
  },
  error: {
    ...typography.caption,
    color: colors.semantic.danger,
  },
  choiceList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  choice: {
    minHeight: control.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
  },
  choiceSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  choicePressed: {
    opacity: 0.75,
  },
  choiceLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  choiceLabelSelected: {
    color: colors.primary[700],
    fontWeight: "600",
  },
  dropdownSelector: {
    minHeight: control.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
  },
  dropdownText: {
    ...typography.caption,
    flex: 1,
    color: colors.text.primary,
  },
  dropdownPlaceholder: {
    color: colors.text.muted,
  },
  dropdownOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.32)",
  },
  dropdownSheet: {
    maxHeight: "75%",
    gap: spacing[2],
    padding: spacing[4],
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    backgroundColor: colors.background.surface,
  },
  dropdownOptions: {
    flexShrink: 1,
  },
  dropdownTitle: {
    ...typography.title,
    paddingBottom: spacing[2],
    color: colors.text.primary,
  },
  dropdownOption: {
    minHeight: control.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
    paddingHorizontal: spacing[2],
  },
  dropdownOptionLabel: {
    ...typography.caption,
    flex: 1,
    color: colors.text.primary,
  },
  dropdownSelectedLabel: {
    color: colors.primary[700],
    fontWeight: "600",
  },
  dropdownClose: {
    minHeight: control.md,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  dropdownCloseText: {
    ...typography.label,
    color: colors.text.secondary,
  },
  helper: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: "center",
  },
  actions: {
    gap: spacing[3],
  },
  action: {
    width: "100%",
  },
  featureList: {
    gap: spacing[4],
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  featureIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
  },
  featureCopy: {
    flex: 1,
  },
  featureTitle: {
    ...typography.label,
    color: colors.text.primary,
  },
  featureDescription: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  nextCard: {
    gap: spacing[3],
  },
  nextTitle: {
    ...typography.label,
    color: colors.text.primary,
  },
  nextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  stepNumber: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    backgroundColor: colors.primary[600],
  },
  stepNumberText: {
    ...typography.caption,
    color: colors.text.onPrimary,
    fontWeight: "700",
  },
  nextLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});

export function useOnboardingStyles() {
  return useThemeStyles(createOnboardingStyles);
}
