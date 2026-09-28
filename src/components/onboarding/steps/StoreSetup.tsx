import { ArrowLeft, Store } from "lucide-react-native";
import { Text, View } from "react-native";

import StoreFormFields from "@/components/store/partials/StoreFormFields";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { useTheme } from "@/theme/ThemeProvider";

import { useOnboardingStyles } from "../onboarding.styles";
import type { OnboardingStepProps } from "./types";

type StoreSetupProps = Pick<
  OnboardingStepProps,
  "storeForm" | "storeErrors" | "saving" | "onStoreFieldChange" | "onCreateStore" | "onBack"
>;

export default function StoreSetup({
  storeForm,
  storeErrors,
  saving,
  onStoreFieldChange,
  onCreateStore,
  onBack,
}: StoreSetupProps) {
  const { colors } = useTheme();
  const styles = useOnboardingStyles();

  return (
    <View style={styles.storeSetup}>
      <View style={styles.storeSetupHeader}>
        <View style={styles.storeSetupHeaderRow}>
          <IconButton
            icon={ArrowLeft}
            label="Back to store introduction"
            onPress={onBack}
            style={styles.storeSetupBackButton}
          />
          <View style={styles.storeSetupTitleRow}>
            <View style={styles.storeSetupIcon}>
              <Store color={colors.primary[700]} size={22} strokeWidth={2} />
            </View>
            <Text style={styles.storeSetupTitle}>Start with a Store</Text>
          </View>
        </View>
        <Text style={styles.storeSetupSubtitle}>Create your first store now. You can update the details later.</Text>
      </View>

      <StoreFormFields
        storeForm={storeForm}
        storeErrors={storeErrors}
        onStoreFieldChange={onStoreFieldChange}
        allowCustomCurrency={false}
      />
      {storeErrors.form ? <Text style={styles.error}>{storeErrors.form}</Text> : null}
      <Button title="Create Store" size="lg" loading={saving} onPress={onCreateStore} style={styles.storeSetupCreateAction} />
    </View>
  );
}
