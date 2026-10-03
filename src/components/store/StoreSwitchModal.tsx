import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";

import { radii, spacing, typography, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";

export default function StoreSwitchModal({ visible }: { visible: boolean }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => undefined}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ActivityIndicator accessibilityLabel="Switching store" color={colors.primary[600]} />
          <Text style={styles.message}>Switching store…</Text>
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
    backgroundColor: colors.overlay,
  },
  card: {
    minWidth: 200,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    padding: spacing[5],
    borderRadius: radii.lg,
    backgroundColor: colors.background.surface,
  },
  message: {
    ...typography.bodySmall,
    color: colors.text.primary,
  },
});
