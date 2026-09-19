import { ArrowLeft, Check, Plus, Store } from "lucide-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import type { OwnerStore } from "@/services/owner-store.service";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";

import { createStoreSelectorStyles } from "../store-selector.styles";

type StoreListProps = {
  ownerStore: OwnerStore;
  stores: OwnerStore[];
  switchingStoreId: string | null;
  switchError: string;
  showAddStoreButton: boolean;
  canCreateStore: boolean;
  disabled: boolean;
  onSelectStore: (store: OwnerStore) => void;
  onClose: () => void;
  onAddStore: () => void;
};

export default function StoreList({
  ownerStore,
  stores,
  switchingStoreId,
  switchError,
  showAddStoreButton,
  canCreateStore,
  disabled,
  onSelectStore,
  onClose,
  onAddStore,
}: StoreListProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStoreSelectorStyles);

  return (
    <>
      <View style={styles.modalHeader}>
        <Button
          title="Back"
          icon={ArrowLeft}
          size="sm"
          variant="ghost"
          accessibilityLabel="Back to OwnerStoreScreen"
          onPress={onClose}
          style={styles.backButton}
        />
        <Text style={styles.modalTitle}>Select store</Text>
      </View>
      {switchError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {switchError}
        </Text>
      ) : null}
      <ScrollView
        style={styles.storeListScroll}
        contentContainerStyle={styles.storeList}
        showsVerticalScrollIndicator={false}
      >
        {stores.map((store) => {
          const selected =
            store.storeId === ownerStore.storeId && store.businessId === ownerStore.businessId;

          return (
            <Pressable
              key={store.storeId}
              accessibilityRole="menuitem"
              accessibilityState={{ selected }}
              disabled={Boolean(switchingStoreId)}
              onPress={() => onSelectStore(store)}
              style={({ pressed }) => [styles.storeItem, pressed && styles.itemPressed]}
            >
              <Store color={selected ? colors.primary[600] : colors.text.muted} size={20} />
              <Text style={[styles.storeItemLabel, selected && styles.storeItemLabelSelected]}>
                {store.storeName}
              </Text>
              {selected ? <Check color={colors.primary[600]} size={20} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
      {canCreateStore && !showAddStoreButton ? (
        <Button
          title="Add store"
          icon={Plus}
          size="md"
          variant="secondary"
          disabled={disabled}
          onPress={onAddStore}
          style={styles.addButton}
        />
      ) : null}
    </>
  );
}
