import { Fingerprint, KeyRound } from "lucide-react-native";
import { ActivityIndicator, Text, View } from "react-native";

import { SecurityQuestionFields } from "@/components/auth/SecurityQuestionFields";
import { Button } from "@/components/ui/Button";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";

import type { SettingsController } from "./settings.controller";
import { Field, SettingsGroup, SettingsRow } from "./settings.components";
import { createSettingsStyles } from "./settings.styles";

type Props = { settings: SettingsController };

export function SecurityContent({ settings }: Props) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createSettingsStyles);
  const {
    securityPin,
    securityLoadError,
    currentPin,
    setCurrentPin,
    newPin,
    setNewPin,
    confirmPin,
    setConfirmPin,
    securitySettings,
    fingerprintAvailable,
    securityError,
    setSecurityError,
    securitySaving,
    toggleFingerprint,
    openRecoveryQuestions,
    saveSecurityPin,
  } = settings;

  return securityPin === undefined ? (
      <View style={styles.busyRow}>
        {securityLoadError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            Security settings couldn't be loaded. Try again.
          </Text>
        ) : (
          <>
            <ActivityIndicator color={colors.primary[600]} />
            <Text style={styles.busyText}>Loading security settings…</Text>
          </>
        )}
      </View>
    ) : (
      <View style={styles.form}>
        <Text style={styles.infoText}>
          Your PIN is required when reopening StockPilot or after using Exit.
        </Text>
        {securityPin ? (
          <Field
            label="Current PIN"
            size="short"
            value={currentPin}
            onChangeText={(value) => {
              setCurrentPin(value.replace(/\D/g, "").slice(0, 6));
              setSecurityError("");
            }}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
          />
        ) : null}
        <Field
          label={securityPin ? "New PIN" : "Create PIN"}
          size="short"
          value={newPin}
          onChangeText={(value) => {
            setNewPin(value.replace(/\D/g, "").slice(0, 6));
            setSecurityError("");
          }}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
        />
        <Field
          label="Confirm PIN"
          size="short"
          value={confirmPin}
          onChangeText={(value) => {
            setConfirmPin(value.replace(/\D/g, "").slice(0, 6));
            setSecurityError("");
          }}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
        />
        {securityPin ? (
          <>
            <SettingsGroup label="Fingerprint">
              {fingerprintAvailable ? (
                <SettingsRow
                  icon={Fingerprint}
                  title="Fingerprint Unlock"
                  description={
                    (securitySettings?.fingerprintEnabled
                      ? "Enabled"
                      : "Disabled") +
                    " · Use an enrolled fingerprint instead of your PIN"
                  }
                  onPress={() => void toggleFingerprint()}
                />
              ) : (
                <SettingsRow
                  icon={Fingerprint}
                  title="Fingerprint Unlock"
                  description={
                    fingerprintAvailable === undefined
                      ? "Checking this device…"
                      : "No enrolled fingerprint is available on this device"
                  }
                />
              )}
            </SettingsGroup>
            <SettingsGroup label="Recovery">
              <SettingsRow
                icon={KeyRound}
                title="Recovery Questions"
                description={
                  (securitySettings?.recoveryQuestions.length === 5
                    ? "5 questions set"
                    : "Set up") +
                  " · Answer five questions if you forget your PIN"
                }
                onPress={openRecoveryQuestions}
              />
            </SettingsGroup>
          </>
        ) : (
          <View style={styles.infoNote}>
            <Text style={styles.infoText}>
              After creating a PIN, choose five recovery questions so you can
              reset it safely.
            </Text>
          </View>
        )}
        {securityError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {securityError}
          </Text>
        ) : null}
        <Button
          title={securityPin ? "Change PIN" : "Create PIN"}
          loading={securitySaving}
          onPress={() => void saveSecurityPin()}
        />
      </View>
    )
}

export function SecurityQuestionsContent({ settings }: Props) {
  const styles = useThemeStyles(createSettingsStyles);
  const {
    securityPin,
    pendingSecurityPin,
    recoveryCurrentPin,
    setRecoveryCurrentPin,
    recoveryDrafts,
    setRecoveryDrafts,
    recoveryError,
    setRecoveryError,
    recoverySaving,
    saveRecoveryQuestions,
  } = settings;

  return !securityPin && !pendingSecurityPin ? (
      <View style={styles.infoNote}>
        <Text style={styles.infoText}>
          Create a PIN before setting recovery questions.
        </Text>
      </View>
    ) : (
      <View style={styles.form}>
        <Text style={styles.infoText}>
          Choose five different questions and answers. StockPilot will ask for
          all five before allowing a PIN reset.
        </Text>
        <Field
          label="Current PIN"
          size="short"
          value={recoveryCurrentPin}
          onChangeText={(value) => {
            setRecoveryCurrentPin(value.replace(/\D/g, "").slice(0, 6));
            setRecoveryError("");
          }}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
        />
        <SecurityQuestionFields
          drafts={recoveryDrafts}
          onChange={(drafts) => {
            setRecoveryDrafts(drafts);
            setRecoveryError("");
          }}
        />
        {recoveryError ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {recoveryError}
          </Text>
        ) : null}
        <Button
          title="Save Recovery Questions"
          loading={recoverySaving}
          onPress={() => void saveRecoveryQuestions()}
        />
      </View>
    )
}
