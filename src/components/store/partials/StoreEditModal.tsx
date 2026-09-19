import { ArrowLeft } from "lucide-react-native";
import { Modal, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import StoreFormFields from "@/components/store/partials/StoreFormFields";
import type { StoreErrors, StoreFieldChange, StoreForm } from "@/components/store/store.types";
import { Button } from "@/components/ui/Button";
import { useThemeStyles } from "@/theme/ThemeProvider";

import { createStoreSelectorStyles } from "../store-selector/store-selector.styles";

type StoreEditModalProps = {
  visible: boolean;
  storeForm: StoreForm;
  storeErrors: StoreErrors;
  saving: boolean;
  onStoreFieldChange: StoreFieldChange;
  onClose: () => void;
  onSave: () => void;
};

export default function StoreEditModal({
  visible,
  storeForm,
  storeErrors,
  saving,
  onStoreFieldChange,
  onClose,
  onSave,
}: StoreEditModalProps) {
  const styles = useThemeStyles(createStoreSelectorStyles);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafeArea} edges={["top", "bottom"]}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Button
              title="Back"
              icon={ArrowLeft}
              size="sm"
              variant="ghost"
              accessibilityLabel="Back to store overview"
              onPress={onClose}
              style={styles.backButton}
            />
            <Text style={styles.modalTitle}>Edit store</Text>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.createForm}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <StoreFormFields
              storeForm={storeForm}
              storeErrors={storeErrors}
              onStoreFieldChange={onStoreFieldChange}
            />
            {storeErrors.form ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {storeErrors.form}
              </Text>
            ) : null}
            <Button
              title="Save changes"
              loading={saving}
              onPress={onSave}
              style={styles.createButton}
            />
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
