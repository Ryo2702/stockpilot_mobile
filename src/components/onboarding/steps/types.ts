import type { VideoPlayer } from "expo-video";

import type { StoreErrors, StoreFieldChange, StoreForm } from "@/components/store/store.types";

export type { StoreErrors, StoreFieldChange, StoreForm } from "@/components/store/store.types";

export type OnboardingStepProps = {
  step: number;
  ownerName: string;
  ownerError?: string;
  storeForm: StoreForm;
  storeErrors: StoreErrors;
  saving: boolean;
  player: VideoPlayer;
  onOwnerNameChange: (value: string) => void;
  onOwnerContinue: () => void;
  onStoreFieldChange: StoreFieldChange;
  onCreateStore: () => void;
  onAdvance: () => void;
};
