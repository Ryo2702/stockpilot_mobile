import { ActivityIndicator, Image, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { colors, spacing, typography } from "@/theme";

const headMascot = require("../../../assets/images/stockpilot/headMascot-transparent.png");

export function LoadingScreen() {
  return (
    <SafeAreaView style={styles.centered}>
      <Image
        accessible
        accessibilityLabel="StockPilot mascot loading"
        source={headMascot}
        resizeMode="contain"
        style={styles.mascot}
      />
      <ActivityIndicator color={colors.primary[600]} />
      <Text style={styles.loadingText}>Loading your store…</Text>
    </SafeAreaView>
  );
}

export function LoadErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <SafeAreaView style={styles.centered}>
      <Text style={styles.errorTitle}>Your store couldn&apos;t be loaded.</Text>
      <Text style={styles.errorText}>Try again to open StockPilot.</Text>
      <Button title="Try again" variant="secondary" onPress={onRetry} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    padding: spacing[6],
    backgroundColor: colors.background.surface,
  },
  mascot: {
    width: 150,
    height: 150,
  },
  loadingText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  errorTitle: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: "center",
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
});
