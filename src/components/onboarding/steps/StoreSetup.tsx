import { Store } from "lucide-react-native";
import { Text, View } from "react-native";

import StoreFormFields from "@/components/store/partials/StoreFormFields";
import { Button } from "@/components/ui/Button";
import { colors } from "@/theme";

import { onboardingStyles as styles } from "../onboarding.styles";
import type { OnboardingStepProps } from "./types";

type StoreSetupProps = Pick<
  OnboardingStepProps,
  "storeForm" | "storeErrors" | "saving" | "onStoreFieldChange" | "onCreateStore"
>;

export default function StoreSetup({
  storeForm,
  storeErrors,
  saving,
  onStoreFieldChange,
  onCreateStore,
}: StoreSetupProps) {
  return (
    <>
      <View style={styles.hero}>
        <Store color={colors.primary[600]} size={72} strokeWidth={1.8} />
        <Text style={styles.heading}>Start with a Store?</Text>
        <Text style={styles.subtitle}>
          You can create a store now or explore the app first. You can always add stores later.
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.formIntro}>Add your store details now. Optional fields can be filled in later.</Text>
        <StoreFormFields
          storeForm={storeForm}
          storeErrors={storeErrors}
          onStoreFieldChange={onStoreFieldChange}
        />
        {storeErrors.form ? <Text style={styles.error}>{storeErrors.form}</Text> : null}
        <Button title="Create Store" size="lg" loading={saving} onPress={onCreateStore} style={styles.action} />
      </View>
    </>
  );
}
