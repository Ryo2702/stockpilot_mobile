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
  content: {
    gap: spacing[8],
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
    paddingBottom: spacing[10],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    width: "100%",
  },
  headerActions: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
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
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  greetingCopy: {
    gap: spacing[1],
  },
  greeting: {
    ...typography.h3,
    color: colors.text.primary,
  },
  menuSafeArea: {
    flex: 1,
    alignItems: "flex-end",
    backgroundColor: "transparent",
  },
  menuCard: {
    width: 220,
    gap: spacing[2],
    marginTop: spacing[2],
    marginRight: spacing[4],
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.lg,
    backgroundColor: colors.background.surface,
  },
  menuTitle: {
    ...typography.label,
    paddingHorizontal: spacing[2],
    color: colors.text.muted,
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
    gap: spacing[4],
  },
  overviewCard: {
    flex: 1,
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
