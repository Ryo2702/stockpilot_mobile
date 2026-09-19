import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";

import { colors, radii, spacing, typography } from "@/theme";

export default function StoreSwitchModal({ visible }: { visible: boolean }) {
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15, 23, 42, 0.28)",
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
