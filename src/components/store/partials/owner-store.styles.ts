import { StyleSheet } from "react-native";

import { control, radii, spacing, typography } from "@/theme";
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
    gap: spacing[8],
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[10],
  },
  brandMark: {
    width: 44,
    height: 44,
  },
  overflowButton: {
    width: control.md,
    height: control.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
  },
  pressed: {
    opacity: 0.7,
  },
  menuSafeArea: {
    flex: 1,
    alignItems: "flex-end",
    backgroundColor: "transparent",
  },
  menuCard: {
    width: 220,
    maxHeight: "90%",
    marginTop: spacing[2],
    marginRight: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.lg,
    backgroundColor: colors.background.surface,
  },
  menuContent: {
    gap: spacing[2],
    padding: spacing[3],
  },
  menuConfirmCard: {
    width: 320,
    maxWidth: "90%",
  },
  menuTitle: {
    ...typography.label,
    paddingHorizontal: spacing[2],
    color: colors.text.muted,
  },
  menuDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  menuError: {
    ...typography.caption,
    color: colors.semantic.danger,
  },
  menuActions: {
    flexDirection: "row",
    gap: spacing[2],
  },
  menuActionButton: {
    flex: 1,
    minWidth: 0,
  },
  menuButton: {
    width: "100%",
    justifyContent: "flex-start",
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  storeCard: {
    gap: spacing[6],
    padding: spacing[6],
  },
  stockHealth: {
    gap: spacing[3],
  },
  stockHealthEmpty: {
    alignItems: "center",
    gap: spacing[3],
  },
  stockHealthImage: {
    width: 148,
    height: 148,
    backgroundColor: colors.background.surface,
  },
  stockHealthCopy: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: "center",
  },
  storeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
  },
  storeIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.lg,
    backgroundColor: colors.background.surface,
  },
  storeCopy: {
    flex: 1,
    minWidth: 0,
  },
  cardLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  storeName: {
    ...typography.h3,
    color: colors.text.primary,
  },
  cardDescription: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  storeDetails: {
    gap: spacing[1],
  },
  storeDetailText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  sectionHeader: {
    gap: spacing[1],
  },
  sectionTitle: {
    ...typography.title,
    color: colors.text.primary,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.text.muted,
  },
  overviewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[4],
  },
  overviewCard: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 145,
    minWidth: 145,
    minHeight: 140,
    gap: spacing[3],
    padding: spacing[5],
  },
  overviewValue: {
    ...typography.h1,
    color: colors.text.primary,
  },
  overviewLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
