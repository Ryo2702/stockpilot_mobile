import { VideoView } from "expo-video";
import { Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { useTheme } from "@/theme/ThemeProvider";

import { useOnboardingStyles } from "../onboarding.styles";
import type { OnboardingStepProps } from "./types";

type OwnerNameStepProps = Pick<
  OnboardingStepProps,
  "player" | "ownerName" | "ownerError" | "onOwnerNameChange" | "onOwnerContinue"
>;

export default function OwnerNameStep({
  player,
  ownerName,
  ownerError,
  onOwnerNameChange,
  onOwnerContinue,
}: OwnerNameStepProps) {
  const { colors } = useTheme();
  const styles = useOnboardingStyles();

  return (
    <View style={styles.ownerNameScreen}>
      <View pointerEvents="none" style={styles.ownerNameBackdropTop} />
      <View pointerEvents="none" style={styles.ownerNameBackdropBottom} />

      <View style={styles.brand}>
        <Text style={styles.brandName}>
          Stock<Text style={styles.brandNameAccent}>Pilot</Text>
        </Text>
        <Text style={styles.brandTagline}>Smarter Inventory. Less Worry.</Text>
      </View>

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
        <Text style={styles.heading}>Hello Owner!</Text>
        <Text style={styles.title}>What's your name?</Text>
        <Text style={styles.subtitle}>Let's personalize your experience</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.fieldLabel}>Your name</Text>
        <TextInput
          accessibilityLabel="Owner name"
          autoCapitalize="words"
          autoCorrect={false}
          onChangeText={onOwnerNameChange}
          onSubmitEditing={onOwnerContinue}
          placeholder="e.g. Juan, Maria or your Business name"
          placeholderTextColor={colors.text.muted}
          returnKeyType="next"
          style={[styles.input, ownerError ? styles.inputError : null]}
          value={ownerName}
        />
        {ownerError ? <Text style={styles.error}>{ownerError}</Text> : null}
        <Button title="Continue" size="lg" onPress={onOwnerContinue} style={styles.action} />
        <Text style={styles.helper}>Your name will be used locally on this device only.</Text>
      </View>
    </View>
  );
}
