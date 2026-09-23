import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { control, radii, spacing, typography, useThemeStyles } from "@/theme";
import type { ThemeColors } from "@/theme/tokens";
import { isValidPin } from "@/validation/pin.validation";

type PinScreenProps = {
  mode: "setup" | "unlock";
  ownerName?: string;
  onSubmit: (pin: string) => Promise<boolean>;
};

export default function PinScreen({ mode, ownerName, onSubmit }: PinScreenProps) {
  const styles = useThemeStyles(createStyles);
  const [pin, setPin] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const isSetup = mode === "setup";

  const submit = async () => {
    if (!isValidPin(pin)) {
      setError("Use a PIN with 4 to 6 digits.");
      return;
    }
    if (isSetup && pin !== confirmation) {
      setError("PINs do not match.");
      return;
    }

    setSaving(true);
    setError(undefined);
    try {
      if (await onSubmit(pin)) return;
      setError("That PIN is incorrect.");
    } catch {
      setError("Couldn't save your PIN. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const updatePin = (value: string) => {
    setPin(value.replace(/\D/g, "").slice(0, 6));
    if (error) setError(undefined);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.brand}>
            <Text style={styles.brandName}>
              <Text>Stock</Text>
              <Text style={styles.brandAccent}>Pilot</Text>
            </Text>
            <Text style={styles.tagline}>Private on this device</Text>
          </View>
          <View style={styles.intro}>
            <Text style={styles.title}>{isSetup ? "Create your PIN" : "Enter your PIN"}</Text>
            <Text style={styles.subtitle}>
              {isSetup
                ? "Create a 4–6 digit PIN to protect your StockPilot data."
                : ownerName
                  ? "Welcome back, " + ownerName + ". Enter your PIN to continue."
                  : "Enter your PIN to continue."}
            </Text>
          </View>
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>PIN</Text>
              <TextInput
                accessibilityLabel="PIN"
                autoFocus
                keyboardType="number-pad"
                maxLength={6}
                onChangeText={updatePin}
                onSubmitEditing={isSetup ? undefined : () => void submit()}
                returnKeyType={isSetup ? "next" : "done"}
                secureTextEntry
                style={[styles.input, error && styles.inputError]}
                value={pin}
              />
            </View>
            {isSetup ? (
              <View style={styles.field}>
                <Text style={styles.label}>Confirm PIN</Text>
                <TextInput
                  accessibilityLabel="Confirm PIN"
                  keyboardType="number-pad"
                  maxLength={6}
                  onChangeText={(value) => {
                    setConfirmation(value.replace(/\D/g, "").slice(0, 6));
                    if (error) setError(undefined);
                  }}
                  onSubmitEditing={() => void submit()}
                  returnKeyType="done"
                  secureTextEntry
                  style={[styles.input, error && styles.inputError]}
                  value={confirmation}
                />
              </View>
            ) : null}
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <Button
              title={isSetup ? "Save PIN" : "Unlock"}
              loading={saving}
              onPress={() => void submit()}
              size="lg"
              style={styles.button}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background.surface },
  content: { flexGrow: 1, justifyContent: "center", padding: spacing[4] },
  card: { width: "100%", maxWidth: 420, alignSelf: "center", gap: spacing[8] },
  brand: { alignItems: "center", gap: spacing[1] },
  brandName: { ...typography.h2, color: colors.text.primary },
  brandAccent: { color: colors.primary[600] },
  tagline: { ...typography.caption, color: colors.text.muted },
  intro: { alignItems: "center", gap: spacing[2] },
  title: { ...typography.h2, color: colors.text.primary, textAlign: "center" },
  subtitle: { ...typography.bodySmall, color: colors.text.secondary, textAlign: "center" },
  form: { gap: spacing[3] },
  field: { gap: spacing[1] },
  label: { ...typography.label, color: colors.text.primary },
  input: {
    minHeight: control.lg,
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
    color: colors.text.primary,
    fontSize: 20,
    letterSpacing: 8,
    textAlign: "center",
  },
  inputError: { borderColor: colors.semantic.danger },
  error: { ...typography.caption, color: colors.semantic.danger },
  button: { width: "100%" },
});
