import { Text, View } from "react-native";

import { Button } from "@/components/ui/Button";

import { features } from "../onboarding.data";
import { onboardingStyles as styles } from "../onboarding.styles";
import type { OnboardingStepProps } from "./types";

type FeaturesStepProps = Pick<OnboardingStepProps, "onAdvance">;

export default function FeaturesStep({ onAdvance }: FeaturesStepProps) {
  return (
    <>
      <View style={styles.hero}>
        <Text style={[styles.heading, styles.featureHeading]}>Everything you need in one app</Text>
      </View>

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
    </>
  );
}
