import { ArrowLeft } from "lucide-react-native";
import { ScrollView, Text, View } from "react-native";

import StoreFormFields from "@/components/store/partials/StoreFormFields";
import type { StoreErrors, StoreFieldChange, StoreForm } from "@/components/store/store.types";
import { Button } from "@/components/ui/Button";
import { MAX_STORES_PER_BUSINESS } from "@/services/owner-store.service";
import { useThemeStyles } from "@/theme/ThemeProvider";

import { createStoreSelectorStyles } from "../store-selector.styles";

type StoreCreateFormProps = {
  storeForm: StoreForm;
  storeErrors: StoreErrors;
  saving: boolean;
  onStoreFieldChange: StoreFieldChange;
  onBack: () => void;
  onCreateStore: () => void;
};

export default function StoreCreateForm({
  storeForm,
  storeErrors,
  saving,
  onStoreFieldChange,
  onBack,
  onCreateStore,
}: StoreCreateFormProps) {
  const styles = useThemeStyles(createStoreSelectorStyles);

  return (
    <>
      <View style={styles.modalHeader}>
        <Button
          title="Back"
          icon={ArrowLeft}
          size="sm"
          variant="ghost"
          accessibilityLabel="Back to store list"
          onPress={onBack}
          style={styles.backButton}
        />
        <Text style={styles.modalTitle}>Add store</Text>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.createForm}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.createIntro}>
          Each store has its own setup and inventory data. You can have up to {MAX_STORES_PER_BUSINESS} active stores for now.
        </Text>
        <StoreFormFields
          storeForm={storeForm}
          storeErrors={storeErrors}
          onStoreFieldChange={onStoreFieldChange}
        />
        {storeErrors.form ? <Text style={styles.error}>{storeErrors.form}</Text> : null}
        <Button
          title="Create store"
          loading={saving}
          onPress={onCreateStore}
          style={styles.createButton}
        />
        <Button title="Exit" variant="ghost" onPress={onBack} style={styles.exitButton} />
      </ScrollView>
    </>
  );
}
