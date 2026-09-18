import OwnerNameStep from "./steps/OwnerNameStep";
import FeaturesStep from "./steps/FeaturesStep";
import StoreIntroStep from "./steps/StoreIntroStep";
import StoreSetup from "./steps/StoreSetup";
import WelcomeStep from "./steps/WelcomeStep";
import type { OnboardingStepProps } from "./steps/types";

export default function OnboardingStep(props: OnboardingStepProps) {
  switch (props.step) {
    case 0:
      return <OwnerNameStep {...props} />;
    case 1:
      return <WelcomeStep {...props} />;
    case 2:
      return <FeaturesStep {...props} />;
    case 3:
      return <StoreIntroStep {...props} />;
    case 4:
      return <StoreSetup {...props} />;
    default:
      return null;
  }
}
