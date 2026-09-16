import type { VideoPlayer } from "expo-video";
import { VideoView } from "expo-video";
import { CircleCheck, Store } from "lucide-react-native";
import { Text, TextInput, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { colors } from "@/theme";

import { features, nextSteps } from "./onboarding.data";
import { onboardingStyles as styles } from "./onboarding.styles";

type OnboardingStepProps = {
  step: number;
  ownerName: string;
  ownerError?: string;
  player: VideoPlayer;
  onOwnerNameChange: (value: string) => void;
  onOwnerContinue: () => void;
  onAdvance: () => void;
};

export default function OnboardingStep({
  step,
  ownerName,
  ownerError,
  player,
  onOwnerNameChange,
  onOwnerContinue,
  onAdvance,
}: OnboardingStepProps) {
  return (
    <>
      <View style={styles.hero}>
        {step < 2 ? (
          <VideoView
            player={player}
            style={styles.mascot}
            contentFit="contain"
            nativeControls={false}
            playsInline
            accessibilityLabel="StockPilot mascot animation"
          />
        ) : null}
        {step === 3 ? <CircleCheck color={colors.primary[600]} size={72} strokeWidth={1.8} /> : null}
        {step === 4 ? <Store color={colors.primary[600]} size={72} strokeWidth={1.8} /> : null}

        {step === 0 ? (
          <>
            <Text style={styles.heading}>Hello Owner!</Text>
            <Text style={styles.title}>What's your name?</Text>
            <Text style={styles.subtitle}>Let's personalize your experience</Text>
          </>
        ) : null}
        {step === 1 ? (
          <>
            <Text style={styles.heading}>Hi, {ownerName}!</Text>
            <Text style={styles.title}>Welcome to StockPilot</Text>
            <Text style={styles.subtitle}>Let's set up your store so you can start managing your inventory.</Text>
          </>
        ) : null}
        {step === 2 ? <Text style={[styles.heading, styles.featureHeading]}>Everything you need in one app</Text> : null}
        {step === 3 ? (
          <>
            <Text style={styles.heading}>You're all set!</Text>
            <Text style={styles.subtitle}>Now let's create your first store to get started.</Text>
          </>
        ) : null}
        {step === 4 ? (
          <>
            <Text style={styles.heading}>Start with a Store?</Text>
            <Text style={styles.subtitle}>You can create a store now or explore the app first. You can always add stores later.</Text>
          </>
        ) : null}
      </View>

      {step === 0 ? (
        <View style={styles.form}>
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
      ) : null}

      {step === 1 ? (
        <View style={styles.actions}>
          <Button title="Get Started" size="lg" onPress={onAdvance} style={styles.action} />
          <Button title="Maybe Later" size="lg" variant="secondary" onPress={onAdvance} style={styles.action} />
        </View>
      ) : null}

      {step === 2 ? (
        <View style={styles.featureList}>
          {features.map(({ title, description, icon: Icon, color, background }) => (
            <View key={title} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: background }]}>
                <Icon color={color} size={19} strokeWidth={2} />
              </View>
              <View style={styles.featureCopy}>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureDescription}>{description}</Text>
              </View>
            </View>
          ))}
          <Button title="Continue" size="lg" onPress={onAdvance} style={styles.action} />
        </View>
      ) : null}

      {step === 3 ? (
        <View style={styles.actions}>
          <Card variant="selected" style={styles.nextCard}>
            <Text style={styles.nextTitle}>What's next?</Text>
            {nextSteps.map((label, index) => (
              <View key={label} style={styles.nextRow}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.nextLabel}>{label}</Text>
              </View>
            ))}
          </Card>
          <Button title="Create Your First Store" size="lg" onPress={onAdvance} style={styles.action} />
          <Button title="Maybe Later" size="lg" variant="secondary" onPress={onAdvance} style={styles.action} />
        </View>
      ) : null}

      {step === 4 ? (
        <View style={styles.actions}>
          <Button title="Explore Store" size="lg" style={styles.action} />
          <Button title="Explore App" size="lg" variant="secondary" style={styles.action} />
        </View>
      ) : null}
    </>
  );
}
