import { useVideoPlayer } from "expo-video";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import OnboardingStep from "./OnboardingStep";
import { mascotVideo, ownerNameSchema } from "./onboarding.data";
import { onboardingStyles as styles } from "./onboarding.styles";

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [ownerName, setOwnerName] = useState("");
  const [ownerError, setOwnerError] = useState<string>();
  const transition = useRef(new Animated.Value(0)).current;
  const player = useVideoPlayer(mascotVideo, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.play();
  });

  useEffect(() => {
    transition.stopAnimation();
    transition.setValue(0);

    const animation = Animated.timing(transition, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
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
            player={player}
            onOwnerNameChange={(value) => {
              setOwnerName(value);
              if (ownerError) setOwnerError(undefined);
            }}
            onOwnerContinue={continueWithOwnerName}
            onAdvance={advance}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
