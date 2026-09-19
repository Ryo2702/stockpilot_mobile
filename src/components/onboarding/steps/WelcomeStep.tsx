import { VideoView } from "expo-video";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";

import { useOnboardingStyles } from "../onboarding.styles";
import type { OnboardingStepProps } from "./types";

type WelcomeStepProps = Pick<OnboardingStepProps, "player" | "ownerName" | "onAdvance">;

export default function WelcomeStep({ player, ownerName, onAdvance }: WelcomeStepProps) {
  const styles = useOnboardingStyles();

  return (
    <>
      <View style={styles.hero}>
        <VideoView
          player={player}
          style={styles.mascot}
          contentFit="contain"
          nativeControls={false}
          playsInline
          surfaceType="textureView"
          accessibilityLabel="StockPilot mascot animation"
        />
        <Text style={styles.heading}>Hi, {ownerName}!</Text>
        <Text style={styles.title}>Welcome to StockPilot</Text>
        <Text style={styles.subtitle}>Let's set up your store so you can start managing your inventory.</Text>
      </View>

      <View style={styles.actions}>
        <Button title="Get Started" size="lg" onPress={onAdvance} style={styles.action} />
        <Button title="Maybe Later" size="lg" variant="secondary" onPress={onAdvance} style={styles.action} />
      </View>
    </>
  );
}
