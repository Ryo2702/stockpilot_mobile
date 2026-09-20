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
    gap: spacing[4],
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[10],
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
});
