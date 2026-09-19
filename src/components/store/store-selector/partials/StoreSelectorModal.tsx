import { Modal, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { OwnerStore } from "@/services/owner-store.service";
import { useThemeStyles } from "@/theme/ThemeProvider";
import type { StoreInput } from "@/validation/store.validation";

import type { StoreSelectorController } from "../hooks/useStoreSelector";
import { createStoreSelectorStyles } from "../store-selector.styles";
import StoreCreateForm from "./StoreCreateForm";
import StoreList from "./StoreList";

type StoreSelectorModalProps = {
  ownerStore: OwnerStore;
  onCreateStore?: (store: StoreInput) => Promise<OwnerStore>;
  showAddStoreButton: boolean;
  disabled: boolean;
  selector: StoreSelectorController;
};

export default function StoreSelectorModal({
  ownerStore,
  onCreateStore,
  showAddStoreButton,
  disabled,
  selector,
}: StoreSelectorModalProps) {
  const styles = useThemeStyles(createStoreSelectorStyles);

  return (
    <Modal
      visible={selector.open}
      animationType="slide"
      onRequestClose={selector.dismiss}
    >
      <SafeAreaView style={styles.modalSafeArea} edges={["top", "bottom"]}>
        <View style={styles.modalContent}>
          {selector.view === "list" ? (
            <StoreList
              ownerStore={ownerStore}
              stores={selector.stores}
              switchingStoreId={selector.switchingStoreId}
              switchError={selector.switchError}
              showAddStoreButton={showAddStoreButton}
              canCreateStore={Boolean(onCreateStore)}
              disabled={disabled}
              onSelectStore={(store) => void selector.selectStore(store)}
              onClose={selector.dismiss}
              onAddStore={selector.openCreate}
            />
          ) : (
            <StoreCreateForm
              storeForm={selector.storeForm}
              storeErrors={selector.storeErrors}
              saving={selector.saving}
              onStoreFieldChange={selector.updateStoreField}
              onBack={selector.showList}
              onCreateStore={() => void selector.createStore()}
            />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
