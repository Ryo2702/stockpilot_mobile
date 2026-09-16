import { useVideoPlayer, VideoView } from "expo-video";
import { CircleCheck, Lightbulb, Package, Store, Zap, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { colors, control, radii, spacing, typography } from "@/theme";

const mascotVideo = require("../../assets/mascot-clean.mp4");
const ownerNameSchema = z.string().trim().min(2, "Please enter your name.").max(50, "Keep your name under 50 characters.");

const features: Array<{ title: string; description: string; icon: LucideIcon; color: string; background: string }> = [
  { title: "Multiple Stores", description: "Manage all your stores independently.", icon: Store, color: colors.primary[600], background: colors.primary[50] },
  { title: "Track Inventory", description: "Know what's in stock, low, or out of stock.", icon: Package, color: colors.semantic.success, background: colors.semantic.successBackground },
  { title: "Get Insights", description: "See helpful insights to make better decisions.", icon: Lightbulb, color: colors.semantic.warning, background: colors.semantic.warningBackground },
  { title: "Work Offline", description: "Your data stays on your device, always.", icon: Zap, color: "#8b5cf6", background: "#f5f3ff" },
];

const nextSteps = ["Create your first store", "Add your products", "Start managing your inventory"];

export default function Index() {
  const [step, setStep] = useState(0);
  const [ownerName, setOwnerName] = useState("");
  const [ownerError, setOwnerError] = useState<string>();
  const player = useVideoPlayer(mascotVideo, (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
    videoPlayer.play();
  });

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
        <View style={styles.content}>
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
                autoCapitalize="words"
                autoCorrect={false}
                onChangeText={(value) => {
                  setOwnerName(value);
                  if (ownerError) setOwnerError(undefined);
                }}
                onSubmitEditing={continueWithOwnerName}
                placeholder="e.g. Juan, Maria or your Business name"
                placeholderTextColor={colors.text.muted}
                returnKeyType="next"
                style={[styles.input, ownerError ? styles.inputError : null]}
                value={ownerName}
              />
              {ownerError ? <Text style={styles.error}>{ownerError}</Text> : null}
              <Button title="Continue" size="lg" onPress={continueWithOwnerName} style={styles.action} />
              <Text style={styles.helper}>Your name will be used locally on this device only.</Text>
            </View>
          ) : null}

          {step === 1 ? (
            <View style={styles.actions}>
              <Button title="Get Started" size="lg" onPress={advance} style={styles.action} />
              <Button title="Maybe Later" size="lg" variant="secondary" onPress={advance} style={styles.action} />
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
              <Button title="Continue" size="lg" onPress={advance} style={styles.action} />
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
              <Button title="Create Your First Store" size="lg" onPress={advance} style={styles.action} />
              <Button title="Maybe Later" size="lg" variant="secondary" onPress={advance} style={styles.action} />
            </View>
          ) : null}

          {step === 4 ? (
            <View style={styles.actions}>
              <Button title="Explore Store" size="lg" style={styles.action} />
              <Button title="Explore App" size="lg" variant="secondary" style={styles.action} />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.surface,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[8],
  },
  content: {
    width: "100%",
    alignSelf: "center",
    maxWidth: 420,
    gap: spacing[8],
  },
  hero: {
    alignItems: "center",
  },
  mascot: {
    width: 150,
    height: 150,
    marginBottom: spacing[4],
  },
  heading: {
    ...typography.h2,
    color: colors.text.primary,
    textAlign: "center",
  },
  featureHeading: {
    maxWidth: 260,
  },
  title: {
    ...typography.title,
    marginTop: spacing[1],
    color: colors.text.primary,
    textAlign: "center",
  },
  subtitle: {
    ...typography.caption,
    maxWidth: 300,
    marginTop: spacing[2],
    color: colors.text.secondary,
    textAlign: "center",
  },
  form: {
    gap: spacing[3],
  },
  input: {
    minHeight: control.lg,
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radii.md,
    color: colors.text.primary,
    backgroundColor: colors.background.surface,
    ...typography.caption,
  },
  inputError: {
    borderColor: colors.semantic.danger,
  },
  error: {
    ...typography.caption,
    marginTop: -spacing[2],
    color: colors.semantic.danger,
  },
  helper: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: "center",
  },
  actions: {
    gap: spacing[3],
  },
  action: {
    width: "100%",
  },
  featureList: {
    gap: spacing[4],
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  featureIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
  },
  featureCopy: {
    flex: 1,
  },
  featureTitle: {
    ...typography.label,
    color: colors.text.primary,
  },
  featureDescription: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  nextCard: {
    gap: spacing[3],
  },
  nextTitle: {
    ...typography.label,
    color: colors.text.primary,
  },
  nextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  stepNumber: {
    width: 22,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    backgroundColor: colors.primary[600],
  },
  stepNumberText: {
    ...typography.caption,
    color: colors.text.onPrimary,
    fontWeight: "700",
  },
  nextLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
});
