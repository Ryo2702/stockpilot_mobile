import { View } from "react-native";

import { useOnboardingStyles } from "../../onboarding/onboarding.styles";
import type { StoreFormFieldsProps } from "./store-form-fields.types";
import {
  CurrencySection,
  LocationSection,
  StoreDetailsSection,
  StoreTypeSection,
} from "./StoreFormSections";

export type { StoreFormFieldsProps } from "./store-form-fields.types";

export default function StoreFormFields(props: StoreFormFieldsProps) {
  const styles = useOnboardingStyles();

  return (
    <View style={styles.storeFormFields}>
      <StoreDetailsSection {...props} />
      <StoreTypeSection {...props} />
      <CurrencySection {...props} />
      <LocationSection {...props} />
    </View>
  );
}
