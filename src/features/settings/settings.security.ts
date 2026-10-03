import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";

import {
  createSecurityQuestionDrafts,
  toSecurityRecoveryAnswers,
} from "@/components/auth/SecurityQuestionFields";
import useAsyncEffect from "@/hooks/useAsyncEffect";
import {
  getAppPin,
  getAppSecuritySettings,
  hasFingerprintAvailable,
  saveAppFingerprintEnabled,
  saveAppPin,
  saveAppSecurityRecovery,
  type AppSecuritySettings,
} from "@/services/settings.service";
import { isValidPin } from "@/validation/pin.validation";

type SettingsSecurityOptions = {
  onPinChanged: (pin: string) => void;
  onSecuritySettingsChanged: (settings: AppSecuritySettings) => void;
  goHome: () => void;
  goToSecurity: () => void;
  goToRecoveryQuestions: () => void;
};

export default function useSettingsSecurity({
  onPinChanged,
  onSecuritySettingsChanged,
  goHome,
  goToSecurity,
  goToRecoveryQuestions,
}: SettingsSecurityOptions) {
  const db = useSQLiteContext();
  const [securityPin, setSecurityPin] = useState<string | null | undefined>(
    undefined,
  );
  const [pendingSecurityPin, setPendingSecurityPin] = useState<string>();
  const [securitySettings, setSecuritySettings] =
    useState<AppSecuritySettings>();
  const [fingerprintAvailable, setFingerprintAvailable] = useState<boolean>();
  const [securityLoadError, setSecurityLoadError] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [securitySaving, setSecuritySaving] = useState(false);
  const [recoveryCurrentPin, setRecoveryCurrentPin] = useState("");
  const [recoveryDrafts, setRecoveryDrafts] = useState(() =>
    createSecurityQuestionDrafts(),
  );
  const [recoveryError, setRecoveryError] = useState("");
  const [recoverySaving, setRecoverySaving] = useState(false);

  useAsyncEffect(
    (isActive) => {
      Promise.all([
        getAppPin(db),
        getAppSecuritySettings(db),
        hasFingerprintAvailable(),
      ])
        .then(([pin, settings, hasFingerprint]) => {
          if (isActive()) {
            setSecurityPin(pin);
            setSecuritySettings(settings);
            setFingerprintAvailable(hasFingerprint);
            setSecurityLoadError(false);
          }
        })
        .catch(() => {
          if (isActive()) setSecurityLoadError(true);
        });
    },
    [db],
  );

  const saveSecurityPin = async () => {
    if (securityPin && currentPin !== securityPin) {
      setSecurityError("Your current PIN is incorrect.");
      return;
    }
    if (!isValidPin(newPin)) {
      setSecurityError("Use a PIN with 4 to 6 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setSecurityError("PINs do not match.");
      return;
    }

    setSecuritySaving(true);
    setSecurityError("");
    try {
      if (!securityPin) {
        setPendingSecurityPin(newPin);
        setRecoveryCurrentPin(newPin);
        setRecoveryDrafts(createSecurityQuestionDrafts());
        setRecoveryError("");
        setNewPin("");
        setConfirmPin("");
        goToRecoveryQuestions();
        return;
      }
      await saveAppPin(db, newPin);
      setSecurityPin(newPin);
      onPinChanged(newPin);
      setCurrentPin("");
      setNewPin("");
      setConfirmPin("");
      goHome();
    } catch {
      setSecurityError("Your PIN couldn't be saved. Please try again.");
    } finally {
      setSecuritySaving(false);
    }
  };

  const saveRecoveryQuestions = async () => {
    const pinForRecovery = securityPin ?? pendingSecurityPin;
    if (!pinForRecovery || recoveryCurrentPin !== pinForRecovery) {
      setRecoveryError("Enter your current PIN to update recovery questions.");
      return;
    }
    const answers = toSecurityRecoveryAnswers(recoveryDrafts);
    if (!answers) {
      setRecoveryError("Choose and answer all five different questions.");
      return;
    }

    setRecoverySaving(true);
    setRecoveryError("");
    try {
      await saveAppSecurityRecovery(db, answers);
      if (!securityPin) {
        await saveAppPin(db, pinForRecovery);
        setSecurityPin(pinForRecovery);
        setPendingSecurityPin(undefined);
        onPinChanged(pinForRecovery);
      }
      const settings = await getAppSecuritySettings(db);
      setSecuritySettings(settings);
      onSecuritySettingsChanged(settings);
      setRecoveryCurrentPin("");
      setRecoveryDrafts(createSecurityQuestionDrafts());
      goToSecurity();
    } catch {
      setRecoveryError(
        "Recovery questions couldn't be saved. Please try again.",
      );
    } finally {
      setRecoverySaving(false);
    }
  };

  const toggleFingerprint = async () => {
    if (
      securitySaving ||
      !securityPin ||
      !securitySettings ||
      !fingerprintAvailable
    )
      return;
    if (currentPin !== securityPin) {
      setSecurityError(
        "Enter your current PIN before changing fingerprint unlock.",
      );
      return;
    }

    setSecuritySaving(true);
    setSecurityError("");
    try {
      const enabled = !securitySettings.fingerprintEnabled;
      await saveAppFingerprintEnabled(db, enabled);
      const settings = { ...securitySettings, fingerprintEnabled: enabled };
      setSecuritySettings(settings);
      onSecuritySettingsChanged(settings);
      setCurrentPin("");
    } catch {
      setSecurityError(
        "Fingerprint unlock couldn't be updated. Please try again.",
      );
    } finally {
      setSecuritySaving(false);
    }
  };

  const openRecoveryQuestions = () => {
    if (!securitySettings) return;
    setRecoveryCurrentPin("");
    setRecoveryDrafts(
      createSecurityQuestionDrafts(
        securitySettings.recoveryQuestions.map(({ questionId }) => questionId),
      ),
    );
    setRecoveryError("");
    goToRecoveryQuestions();
  };

  const resetRecovery = () => {
    setPendingSecurityPin(undefined);
    setRecoveryCurrentPin("");
    setRecoveryDrafts(createSecurityQuestionDrafts());
  };

  return {
    securityPin,
    pendingSecurityPin,
    securitySettings,
    fingerprintAvailable,
    securityLoadError,
    currentPin,
    setCurrentPin,
    newPin,
    setNewPin,
    confirmPin,
    setConfirmPin,
    securityError,
    setSecurityError,
    securitySaving,
    recoveryCurrentPin,
    setRecoveryCurrentPin,
    recoveryDrafts,
    setRecoveryDrafts,
    recoveryError,
    setRecoveryError,
    recoverySaving,
    resetRecovery,
    saveSecurityPin,
    saveRecoveryQuestions,
    toggleFingerprint,
    openRecoveryQuestions,
  };
}
