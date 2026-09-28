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
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[6],
  },
  content: {
    width: "100%",
    alignSelf: "center",
    maxWidth: 420,
    gap: spacing[6],
  },
  storeSetup: {
    gap: spacing[5],
  },
  storeSetupHeader: {
    gap: spacing[2],
  },
  storeSetupHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  storeSetupBackButton: {
    width: 44,
    height: 44,
    marginLeft: -spacing[2],
  },
  storeSetupTitleRow: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  storeSetupIcon: {
    width: control.md,
    height: control.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    backgroundColor: colors.primary[50],
  },
  storeSetupTitle: {
    ...typography.h2,
    flexShrink: 1,
    color: colors.primary[700],
  },
  storeSetupSubtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  storeSetupCreateAction: {
    width: "100%",
    minHeight: 52,
    borderRadius: radii.lg,
  },
  ownerNameScreen: {
    position: "relative",
    width: "100%",
    gap: spacing[6],
    overflow: "hidden",
  },
  ownerNameBackdropTop: {
    position: "absolute",
    top: 84,
    left: -104,
    width: 196,
    height: 196,
    borderRadius: radii.full,
    backgroundColor: colors.primary[50],
    opacity: 0.28,
  },
  ownerNameBackdropBottom: {
    position: "absolute",
    right: -112,
    bottom: -12,
    width: 208,
    height: 208,
    borderRadius: radii.full,
    backgroundColor: colors.primary[50],
    opacity: 0.34,
  },
  brand: {
    alignItems: "center",
    gap: spacing[1],
  },
  brandName: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "600",
    color: colors.primary[700],
  },
  brandNameAccent: {
    color: colors.primary[600],
  },
  brandTagline: {
    ...typography.caption,
    color: colors.text.muted,
  },
  hero: {
    alignItems: "center",
    gap: spacing[1],
  },
  mascot: {
    width: 124,
    height: 124,
    marginBottom: spacing[3],
  },
  heading: {
    ...typography.h2,
    color: colors.primary[700],
    textAlign: "center",
  },
  featureHeading: {
    maxWidth: 280,
  },
  title: {
    ...typography.title,
    color: colors.primary[700],
    textAlign: "center",
  },
  subtitle: {
    ...typography.bodySmall,
    maxWidth: 320,
    marginTop: spacing[1],
    color: colors.text.secondary,
    textAlign: "center",
  },
  form: {
    gap: spacing[4],
  },
  storeFormFields: {
    gap: spacing[5],
  },
  formSection: {
    gap: spacing[3],
  },
  compactSectionHeading: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  sectionNumber: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primary[600],
    borderRadius: radii.full,
    backgroundColor: colors.primary[50],
  },
  sectionNumberText: {
    ...typography.caption,
    color: colors.primary[700],
    fontWeight: "700",
  },
  compactSectionTitle: {
    ...typography.title,
    flexShrink: 1,
    color: colors.primary[700],
  },
  sectionOptional: {
    ...typography.caption,
    color: colors.text.muted,
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
    fontWeight: "600",
  },
  optional: {
    ...typography.caption,
    color: colors.text.muted,
  },
  input: {
    minHeight: 52,
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radii.lg,
    color: colors.text.primary,
    backgroundColor: colors.background.surface,
    ...typography.bodySmall,
  },
  inputError: {
    borderColor: colors.semantic.danger,
  },
  inputFocused: {
    borderColor: colors.border.focus,
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
  storeTypeScroller: {
    gap: spacing[2],
    paddingRight: spacing[4],
  },
  compactStoreTypeChoice: {
    position: "relative",
    width: 92,
    minHeight: 100,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    padding: spacing[1],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.lg,
    backgroundColor: colors.background.surface,
  },
  compactStoreTypeChoiceSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  compactStoreTypeImage: {
    width: 54,
    height: 54,
  },
  compactStoreTypeLabel: {
    ...typography.caption,
    minHeight: 28,
    color: colors.text.secondary,
    textAlign: "center",
  },
  compactStoreTypeLabelSelected: {
    color: colors.primary[700],
    fontWeight: "600",
  },
  compactStoreTypeCheck: {
    position: "absolute",
    top: spacing[1],
    right: spacing[1],
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background.surface,
    borderRadius: radii.full,
    backgroundColor: colors.primary[600],
  },
  currencyFormatRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[3],
  },
  currencyFormatCurrency: {
    flexGrow: 1,
    flexBasis: 128,
    minWidth: 128,
  },
  currencyFormatDecimals: {
    flexGrow: 1,
    flexBasis: 236,
    minWidth: 236,
  },
  decimalChoices: {
    flexDirection: "row",
    gap: spacing[1],
  },
  decimalChoice: {
    minHeight: control.lg,
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 44,
    paddingHorizontal: 0,
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
    borderRadius: radii.lg,
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
    backgroundColor: "rgba(36, 28, 23, 0.32)",
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
  locationCollapsed: {
    minHeight: control.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  locationAddIcon: {
    width: control.md,
    height: control.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    backgroundColor: colors.primary[50],
  },
  locationCopy: {
    minWidth: 0,
    flex: 1,
    gap: 1,
  },
  locationAddTitle: {
    ...typography.label,
    color: colors.primary[700],
  },
  locationDescription: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  locationRemove: {
    alignSelf: "flex-start",
  },
  actions: {
    gap: spacing[4],
  },
  legalConsent: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[2],
    paddingVertical: spacing[2],
  },
  checkbox: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radii.xs,
    backgroundColor: colors.background.surface,
  },
  checkboxSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[600],
  },
  legalText: {
    ...typography.caption,
    flex: 1,
    color: colors.text.secondary,
  },
  action: {
    width: "100%",
    minHeight: 52,
    borderRadius: radii.lg,
  },
  featureList: {
    gap: spacing[4],
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  featureIcon: {
    width: control.md,
    height: control.md,
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
    fontWeight: "600",
  },
  featureDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  nextSteps: {
    gap: spacing[3],
  },
  nextTitle: {
    ...typography.title,
    color: colors.text.primary,
  },
  nextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  stepNumber: {
    width: 28,
    height: 28,
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
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
});

export function useOnboardingStyles() {
  return useThemeStyles(createOnboardingStyles);
}
