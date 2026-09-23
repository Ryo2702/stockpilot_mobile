import { Archive } from "lucide-react-native";
import { Modal, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

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
  const compact = useWindowDimensions().width < 360;

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
        <ScrollView
          style={styles.card}
          contentContainerStyle={styles.cardContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.icon}>
            <Archive color={colors.semantic.danger} size={22} />
          </View>
          <Text style={styles.title}>Archive Item?</Text>
          <Text style={styles.copy}>
            This will remove “{productName}” from the active catalog. Its stock history will be kept
            and it can be restored later.
          </Text>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <View style={[styles.actions, compact && styles.compactActions]}>
            <Button
              title="Cancel"
              variant="ghost"
              disabled={archiving}
              onPress={onClose}
              style={[styles.actionButton, compact && styles.compactActionButton]}
            />
            <Button
              title="Archive Item"
              icon={Archive}
              variant="danger"
              loading={archiving}
              onPress={onConfirm}
              style={[styles.actionButton, compact && styles.compactActionButton]}
            />
          </View>
        </ScrollView>
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
    maxHeight: "90%",
    borderRadius: radii.lg,
    backgroundColor: colors.background.surface,
  },
  cardContent: {
    width: "100%",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[5],
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
  compactActions: {
    flexDirection: "column",
  },
  actionButton: {
    minWidth: 0,
    flex: 1,
    paddingHorizontal: spacing[2],
  },
  compactActionButton: {
    width: "100%",
    flex: 0,
  },
});
