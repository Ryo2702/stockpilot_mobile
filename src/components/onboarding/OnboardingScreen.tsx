import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PinScreen from "@/components/auth/PinScreen";
import { initialStoreForm } from "@/components/store/store.data";
import type { StoreErrors, StoreFieldChange, StoreForm } from "@/components/store/store.types";
import { createOwnerStore, type OwnerStore } from "@/services/owner-store.service";
import type { SecurityRecoveryAnswer } from "@/services/settings.service";
import { storeSchema, type StoreInput } from "@/validation/store.validation";

import ExistingStoreSelectionStep from "./ExistingStoreSelectionStep";
import OnboardingStep from "./OnboardingStep";
import { ownerNameSchema } from "./onboarding.data";
import { useOnboardingStyles } from "./onboarding.styles";

type OnboardingScreenProps = {
  onComplete: (ownerStore: OwnerStore, pinCreated?: boolean) => void;
  onSavePin: (pin: string, recoveryAnswers: SecurityRecoveryAnswer[]) => Promise<boolean>;
  existingStores?: OwnerStore[];
  selectedStore?: OwnerStore;
  onSelectStore?: (store: OwnerStore) => Promise<void>;
  onCreateStore?: (store: StoreInput) => Promise<OwnerStore>;
};

export default function OnboardingScreen({
  onComplete,
  existingStores,
  selectedStore,
  onSelectStore,
  onCreateStore,
  onSavePin,
}: OnboardingScreenProps) {
  if (existingStores?.length) {
    return (
      <ExistingStoreSelectionStep
        ownerStore={selectedStore ?? existingStores[0]}
        ownerStores={existingStores}
        onSelectStore={onSelectStore}
        onCreateStore={onCreateStore}
        onComplete={onComplete}
      />
    );
  }

  return <FirstRunOnboarding onComplete={onComplete} onSavePin={onSavePin} />;
}

function FirstRunOnboarding({ onComplete, onSavePin }: Pick<OnboardingScreenProps, "onComplete" | "onSavePin">) {
  const styles = useOnboardingStyles();
  const db = useSQLiteContext();
  const [step, setStep] = useState(0);
  const [ownerName, setOwnerName] = useState("");
  const [ownerError, setOwnerError] = useState<string>();
  const [storeForm, setStoreForm] = useState(initialStoreForm);
  const [storeErrors, setStoreErrors] = useState<StoreErrors>({});
  const [saving, setSaving] = useState(false);
  const [createdStore, setCreatedStore] = useState<OwnerStore>();
  const transition = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    transition.stopAnimation();
    transition.setValue(0);

    const animation = Animated.timing(transition, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: Platform.OS !== "web",
    });

    animation.start();
    return () => animation.stop();
  }, [step, transition]);

  const advance = () => setStep((currentStep) => Math.min(currentStep + 1, 4));
  const back = () => setStep((currentStep) => Math.max(currentStep - 1, 0));
  const continueWithOwnerName = () => {
    const result = ownerNameSchema.safeParse(ownerName);

    if (!result.success) {
      setOwnerError(result.error.issues[0]?.message ?? "Please enter your name.");
      return;
    }

    setOwnerName(result.data);
    setOwnerError(undefined);
    advance();
  };

  const updateStoreField: StoreFieldChange = (field, value) => {
    setStoreForm((current) => ({ ...current, [field]: value }));
    setStoreErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const createStore = async () => {
    const result = storeSchema.safeParse(storeForm);

    if (!result.success) {
      const errors: StoreErrors = {};
      for (const issue of result.error.issues) {
        const key = (issue.path.join(".") || "form") as keyof StoreErrors;
        errors[key] = issue.message;
      }
      setStoreErrors(errors);
      return;
    }

    setSaving(true);
    setStoreErrors({});

    try {
      const store = await createOwnerStore(db, ownerName, result.data);
      setCreatedStore(store);
    } catch {
      setStoreErrors({ form: "Couldn't create your store. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (createdStore) {
    return (
      <PinScreen
        mode="setup"
        ownerName={createdStore.ownerName}
        onSubmit={async (pin, recoveryAnswers) => {
          if (!recoveryAnswers || !await onSavePin(pin, recoveryAnswers)) return false;
          onComplete(createdStore, true);
          return true;
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: transition,
              transform: [
                {
                  translateY: transition.interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <OnboardingStep
            step={step}
            ownerName={ownerName}
            ownerError={ownerError}
            storeForm={storeForm}
            storeErrors={storeErrors}
            saving={saving}
            onOwnerNameChange={(value) => {
              setOwnerName(value);
              if (ownerError) setOwnerError(undefined);
            }}
            onOwnerContinue={continueWithOwnerName}
            onStoreFieldChange={updateStoreField}
            onCreateStore={createStore}
            onAdvance={advance}
            onBack={back}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
