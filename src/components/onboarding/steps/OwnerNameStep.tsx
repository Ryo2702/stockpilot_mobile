import { useState } from "react";
import { Image, Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { useTheme } from "@/theme/ThemeProvider";

import { mascotImage } from "../onboarding.data";
import { useOnboardingStyles } from "../onboarding.styles";
import type { OnboardingStepProps } from "./types";

type OwnerNameStepProps = Pick<
  OnboardingStepProps,
  "ownerName" | "ownerError" | "onOwnerNameChange" | "onOwnerContinue"
>;

export default function OwnerNameStep({
  ownerName,
  ownerError,
  onOwnerNameChange,
  onOwnerContinue,
}: OwnerNameStepProps) {
  const { colors } = useTheme();
  const styles = useOnboardingStyles();
  const [isNameFocused, setIsNameFocused] = useState(false);

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
        <Image
          source={mascotImage}
          style={styles.mascot}
          resizeMode="contain"
          accessibilityLabel="StockPilot mascot"
        />
        <Text style={styles.heading}>Hello Owner!</Text>
        <Text style={styles.title}>What's your name?</Text>
        <Text style={styles.subtitle}>Let's personalize your experience.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.fieldLabel}>Your name</Text>
        <TextInput
          accessibilityLabel="Owner name"
          autoCapitalize="words"
          autoCorrect={false}
          onBlur={() => setIsNameFocused(false)}
          onChangeText={onOwnerNameChange}
          onFocus={() => setIsNameFocused(true)}
          onSubmitEditing={onOwnerContinue}
          placeholder="e.g. Juan, Maria or your Business name"
          placeholderTextColor={colors.text.muted}
          returnKeyType="next"
          style={[styles.input, isNameFocused && styles.inputFocused, ownerError ? styles.inputError : null]}
          value={ownerName}
        />
        {ownerError ? <Text style={styles.error}>{ownerError}</Text> : null}
        <Button title="Continue" size="lg" onPress={onOwnerContinue} style={styles.action} />
        <Text style={styles.helper}>Your name will be used locally on this device only.</Text>
      </View>
    </View>
  );
}
