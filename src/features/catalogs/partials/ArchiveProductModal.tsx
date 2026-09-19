import { Archive } from "lucide-react-native";
import { Modal, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { radii, spacing, typography, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";

type ArchiveProductModalProps = {
  visible: boolean;
  productName: string | null;
  archiving: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ArchiveProductModal({
  visible,
  productName,
  archiving,
  error,
  onClose,
  onConfirm,
}: ArchiveProductModalProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!archiving) onClose();
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.icon}>
            <Archive color={colors.semantic.danger} size={22} />
          </View>
          <Text style={styles.title}>Archive Product?</Text>
          <Text style={styles.copy}>
            This will remove “{productName}” from the active catalog. Its stock history will be kept
            and it can be restored later.
          </Text>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Button
              title="Cancel"
              variant="ghost"
              disabled={archiving}
              onPress={onClose}
              style={styles.actionButton}
            />
            <Button
              title="Archive Product"
              icon={Archive}
              variant="danger"
              loading={archiving}
              onPress={onConfirm}
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[4],
    backgroundColor: "rgba(15, 23, 42, 0.32)",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[5],
    borderRadius: radii.lg,
    backgroundColor: colors.background.surface,
  },
  icon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    backgroundColor: colors.semantic.dangerBackground,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
  },
  copy: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: "center",
  },
  error: {
    ...typography.bodySmall,
    color: colors.semantic.danger,
    textAlign: "center",
  },
  actions: {
    width: "100%",
    flexDirection: "row",
    gap: spacing[2],
  },
  actionButton: {
    minWidth: 0,
    flex: 1,
    paddingHorizontal: spacing[2],
  },
});
