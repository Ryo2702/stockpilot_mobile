import { CircleCheck } from "lucide-react-native";
import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTheme } from "@/theme/ThemeProvider";

import { nextSteps } from "../onboarding.data";
import { useOnboardingStyles } from "../onboarding.styles";
import type { OnboardingStepProps } from "./types";

type StoreIntroStepProps = Pick<OnboardingStepProps, "onAdvance">;

export default function StoreIntroStep({ onAdvance }: StoreIntroStepProps) {
  const { colors } = useTheme();
  const styles = useOnboardingStyles();

  return (
    <>
      <View style={styles.hero}>
        <CircleCheck color={colors.primary[600]} size={72} strokeWidth={1.8} />
        <Text style={styles.heading}>You're all set!</Text>
        <Text style={styles.subtitle}>Now let's create your first store to get started.</Text>
      </View>

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
    </>
  );
}
