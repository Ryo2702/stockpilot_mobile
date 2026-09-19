import { StyleSheet } from "react-native";

import { control, radii, spacing, typography } from "@/theme";
import type { ThemeColors } from "@/theme/tokens";

export const createStoreSelectorStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 999,
  },
  expandedContainer: {
    width: "100%",
  },
  compactContainer: {
    minWidth: 0,
    flex: 1,
  },
  selector: {
    minHeight: control.md,
    maxWidth: 190,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
  },
  expandedSelector: {
    width: "100%",
    maxWidth: 420,
  },
  compactSelector: {
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
  },
  pressed: {
    opacity: 0.76,
  },
  disabled: {
    opacity: 0.5,
  },
  selectorCopy: {
    minWidth: 0,
    flex: 1,
  },
  selectorLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  selectorName: {
    ...typography.label,
    color: colors.text.primary,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: colors.background.app,
  },
  modalContent: {
    flex: 1,
    gap: spacing[6],
    padding: spacing[4],
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  storeList: {
    gap: spacing[3],
  },
  storeItem: {
    minHeight: control.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
  },
  itemPressed: {
    backgroundColor: colors.gray[50],
  },
  storeItemLabel: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.text.secondary,
  },
  storeItemLabelSelected: {
    color: colors.primary[700],
    fontWeight: "600",
  },
  addButton: {
    alignSelf: "flex-start",
  },
  visibleAddButton: {
    width: "100%",
  },
  backButton: {
    minWidth: 0,
  },
  createForm: {
    flexGrow: 1,
    gap: spacing[4],
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
    paddingBottom: spacing[8],
  },
  createIntro: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  error: {
    ...typography.caption,
    color: colors.semantic.danger,
  },
  createButton: {
    width: "100%",
  },
  exitButton: {
    width: "100%",
    marginTop: "auto",
  },
});
