import { Fingerprint } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  SecurityQuestionFields,
  createSecurityQuestionDrafts,
  toSecurityRecoveryAnswers,
} from "@/components/auth/SecurityQuestionFields";
import { Button } from "@/components/ui/Button";
import type { SecurityRecoveryAnswer, SecurityRecoveryQuestion } from "@/services/settings.service";
import { control, radii, spacing, typography, useThemeStyles } from "@/theme";
import type { ThemeColors } from "@/theme/tokens";
import { isValidPin } from "@/validation/pin.validation";

type PinScreenProps = {
  mode: "setup" | "unlock";
  ownerName?: string;
  fingerprintAvailable?: boolean;
  fingerprintEnabled?: boolean;
  recoveryQuestions?: SecurityRecoveryQuestion[];
  onSubmit: (pin: string, recoveryAnswers?: SecurityRecoveryAnswer[]) => Promise<boolean>;
  onResetPin?: (pin: string) => Promise<boolean>;
  onVerifyRecovery?: (answers: SecurityRecoveryAnswer[]) => Promise<boolean>;
  onFingerprintUnlock?: () => Promise<boolean>;
};

type PinStage = "pin" | "setup-recovery" | "recover" | "reset";

export default function PinScreen({
  mode,
  ownerName,
  fingerprintAvailable = false,
  fingerprintEnabled = false,
  recoveryQuestions = [],
  onSubmit,
  onResetPin,
  onVerifyRecovery,
  onFingerprintUnlock,
}: PinScreenProps) {
  const styles = useThemeStyles(createStyles);
  const [stage, setStage] = useState<PinStage>("pin");
  const [pin, setPin] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [recoveryDrafts, setRecoveryDrafts] = useState(() => createSecurityQuestionDrafts());
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const isSetup = mode === "setup";
  const isCreatingPin = isSetup || stage === "reset";

  const resetPinFields = () => {
    setPin("");
    setConfirmation("");
  };

  const updatePin = (value: string) => {
    setPin(value.replace(/\D/g, "").slice(0, 6));
    if (error) setError(undefined);
  };

  const submitPin = async () => {
    if (!isValidPin(pin)) {
      setError("Use a PIN with 4 to 6 digits.");
      return;
    }
    if (isCreatingPin && pin !== confirmation) {
      setError("PINs do not match.");
      return;
    }
    if (isSetup) {
      setError(undefined);
      setStage("setup-recovery");
      return;
    }

    setSaving(true);
    setError(undefined);
    try {
      const saved = stage === "reset"
        ? await onResetPin?.(pin)
        : await onSubmit(pin);
      if (saved) return;
      setError(stage === "reset" ? "Couldn't save your new PIN. Please try again." : "That PIN is incorrect.");
    } catch {
      setError(stage === "reset" ? "Couldn't save your new PIN. Please try again." : "Couldn't unlock StockPilot. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const submitRecovery = async () => {
    const answers = toSecurityRecoveryAnswers(recoveryDrafts);
    if (!answers) {
      setError("Choose and answer all five security questions.");
      return;
    }

    setSaving(true);
    setError(undefined);
    try {
      if (isSetup) {
        if (await onSubmit(pin, answers)) return;
        setError("Couldn't save your security settings. Please try again.");
        return;
      }
      if (await onVerifyRecovery?.(answers)) {
        resetPinFields();
        setRecoveryDrafts(createSecurityQuestionDrafts());
        setStage("reset");
        return;
      }
      setError("Your answers don't match. Please try again.");
    } catch {
      setError("Couldn't verify your answers. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const unlockWithFingerprint = async () => {
    setSaving(true);
    setError(undefined);
    try {
      if (await onFingerprintUnlock?.()) return;
      setError("Fingerprint unlock wasn't completed. Use your PIN instead.");
    } catch {
      setError("Fingerprint unlock isn't available right now. Use your PIN instead.");
    } finally {
      setSaving(false);
    }
  };

  const beginRecovery = () => {
    setError(undefined);
    resetPinFields();
    setRecoveryDrafts(createSecurityQuestionDrafts(recoveryQuestions.map(({ questionId }) => questionId)));
    setStage("recover");
  };

  const returnToPin = () => {
    setError(undefined);
    resetPinFields();
    setRecoveryDrafts(createSecurityQuestionDrafts());
    setStage("pin");
  };

  const title = stage === "setup-recovery"
    ? "Set recovery questions"
    : stage === "recover"
      ? "Verify your identity"
      : stage === "reset"
        ? "Create a new PIN"
        : isSetup
          ? "Create your PIN"
          : "Enter your PIN";
  const subtitle = stage === "setup-recovery"
    ? "Choose five different questions and private answers. You'll need all five if you forget your PIN."
    : stage === "recover"
      ? "Answer all five recovery questions to create a new PIN."
      : stage === "reset"
        ? "Choose a new 4–6 digit PIN to protect StockPilot."
        : isSetup
          ? "Create a 4–6 digit PIN to protect your StockPilot data."
          : ownerName
            ? "Welcome back, " + ownerName + ". Enter your PIN to continue."
            : "Enter your PIN to continue.";

  const recoveryStage = stage === "setup-recovery" || stage === "recover";

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
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={styles.form}>
            {recoveryStage ? (
              <>
                <SecurityQuestionFields
                  drafts={recoveryDrafts}
                  onChange={setRecoveryDrafts}
                  questionsLocked={stage === "recover"}
                />
                {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
                <Button
                  title={isSetup ? "Save PIN and Recovery" : "Continue"}
                  loading={saving}
                  onPress={() => void submitRecovery()}
                  size="lg"
                  style={styles.button}
                />
                <Button title="Back to PIN" variant="ghost" disabled={saving} onPress={returnToPin} />
              </>
            ) : (
              <>
                <View style={styles.field}>
                  <Text style={styles.label}>{stage === "reset" ? "New PIN" : "PIN"}</Text>
                  <TextInput
                    accessibilityLabel={stage === "reset" ? "New PIN" : "PIN"}
                    autoFocus
                    keyboardType="number-pad"
                    maxLength={6}
                    onChangeText={updatePin}
                    onSubmitEditing={isCreatingPin ? undefined : () => void submitPin()}
                    returnKeyType={isCreatingPin ? "next" : "done"}
                    secureTextEntry
                    style={[styles.input, error && styles.inputError]}
                    value={pin}
                  />
                </View>
                {isCreatingPin ? (
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
                      onSubmitEditing={() => void submitPin()}
                      returnKeyType="done"
                      secureTextEntry
                      style={[styles.input, error && styles.inputError]}
                      value={confirmation}
                    />
                  </View>
                ) : null}
                {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
                <Button
                  title={isSetup ? "Continue" : stage === "reset" ? "Save New PIN" : "Unlock"}
                  loading={saving}
                  onPress={() => void submitPin()}
                  size="lg"
                  style={styles.button}
                />
                {mode === "unlock" && stage === "pin" && fingerprintEnabled && fingerprintAvailable ? (
                  <Button
                    title="Use Fingerprint"
                    icon={Fingerprint}
                    variant="secondary"
                    disabled={saving}
                    onPress={() => void unlockWithFingerprint()}
                    size="lg"
                    style={styles.button}
                  />
                ) : null}
                {mode === "unlock" && stage === "pin" && recoveryQuestions.length === 5 ? (
                  <Button title="Forgot PIN?" variant="ghost" disabled={saving} onPress={beginRecovery} />
                ) : null}
                {stage === "reset" ? <Button title="Back to recovery questions" variant="ghost" disabled={saving} onPress={beginRecovery} /> : null}
              </>
            )}
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
