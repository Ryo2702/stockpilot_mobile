import { Printer } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { spacing, typography, useThemeStyles } from "@/theme";
import type { ThemeColors } from "@/theme/tokens";

import { printProductBarcode } from "@/utils/printProductBarcode";

type PrintBarcodeButtonProps = { name: string; barcode: string | null };

export default function PrintBarcodeButton({ name, barcode }: PrintBarcodeButtonProps) {
  const styles = useThemeStyles(createStyles);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState("");

  const print = async () => {
    if (!barcode) return;
    setPrinting(true);
    setError("");
    try {
      await printProductBarcode(name, barcode);
    } catch {
      setError("Couldn't print this barcode.");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title="Print Barcode"
        icon={Printer}
        variant="secondary"
        disabled={!barcode}
        loading={printing}
        onPress={() => void print()}
      />
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { gap: spacing[2] },
  error: { ...typography.bodySmall, color: colors.semantic.danger },
});
