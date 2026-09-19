import { useSQLiteContext } from "expo-sqlite";
import { useVideoPlayer } from "expo-video";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { initialStoreForm } from "@/components/store/store.data";
import type { StoreErrors, StoreFieldChange, StoreForm } from "@/components/store/store.types";
import { createOwnerStore, type OwnerStore } from "@/services/owner-store.service";
import { storeSchema, type StoreInput } from "@/validation/store.validation";

import ExistingStoreSelectionStep from "./ExistingStoreSelectionStep";
import OnboardingStep from "./OnboardingStep";
import { mascotVideo, ownerNameSchema } from "./onboarding.data";
import { onboardingStyles as styles } from "./onboarding.styles";

type OnboardingScreenProps = {
  onComplete: (ownerStore: OwnerStore) => void;
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

  return <FirstRunOnboarding onComplete={onComplete} />;
}

function FirstRunOnboarding({ onComplete }: Pick<OnboardingScreenProps, "onComplete">) {
  const db = useSQLiteContext();
  const [step, setStep] = useState(0);
  const [ownerName, setOwnerName] = useState("");
  const [ownerError, setOwnerError] = useState<string>();
  const [storeForm, setStoreForm] = useState(initialStoreForm);
  const [storeErrors, setStoreErrors] = useState<StoreErrors>({});
  const [saving, setSaving] = useState(false);
  const transition = useRef(new Animated.Value(0)).current;
  const player = useVideoPlayer(mascotVideo, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
  });

  useEffect(() => {
    player.play();
  }, [player]);

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
      onComplete(await createOwnerStore(db, ownerName, result.data));
    } catch {
      setStoreErrors({ form: "Couldn't create your store. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView
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
            player={player}
            onOwnerNameChange={(value) => {
              setOwnerName(value);
              if (ownerError) setOwnerError(undefined);
            }}
            onOwnerContinue={continueWithOwnerName}
            onStoreFieldChange={updateStoreField}
            onCreateStore={createStore}
            onAdvance={advance}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
