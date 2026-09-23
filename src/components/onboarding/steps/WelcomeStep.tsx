import { VideoView } from "expo-video";
import { Check } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { onboardingLegalNotice } from "@/data/legal.data";
import { useTheme } from "@/theme/ThemeProvider";

import { useOnboardingStyles } from "../onboarding.styles";
import type { OnboardingStepProps } from "./types";

type WelcomeStepProps = Pick<OnboardingStepProps, "player" | "ownerName" | "onAdvance">;

export default function WelcomeStep({ player, ownerName, onAdvance }: WelcomeStepProps) {
  const { colors } = useTheme();
  const styles = useOnboardingStyles();
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel="Agree to the Terms and Conditions and Privacy Policy"
          accessibilityState={{ checked: acceptedTerms }}
          onPress={() => setAcceptedTerms((current) => !current)}
          style={styles.legalConsent}
        >
          <View style={[styles.checkbox, acceptedTerms && styles.checkboxSelected]}>
            {acceptedTerms ? <Check color={colors.text.onPrimary} size={15} strokeWidth={3} /> : null}
          </View>
          <Text style={styles.legalText}>{onboardingLegalNotice}</Text>
        </Pressable>
        <Button
          title="Get Started"
          size="lg"
          disabled={!acceptedTerms}
          onPress={onAdvance}
          style={styles.action}
        />
      </View>
    </>
  );
}
