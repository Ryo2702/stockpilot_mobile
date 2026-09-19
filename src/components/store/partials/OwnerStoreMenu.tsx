import { Info, LogOut, Pencil, Settings, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { useThemeStyles } from "@/theme/ThemeProvider";

import { createOwnerStoreStyles } from "./owner-store.styles";

type OwnerStoreMenuProps = {
  visible: boolean;
  storeName: string;
  onClose: () => void;
  onEditStore?: () => void;
  onDeleteStore?: () => Promise<void>;
  onExit: () => void;
};

export default function OwnerStoreMenu({
  visible,
  storeName,
  onClose,
  onEditStore,
  onDeleteStore,
  onExit,
}: OwnerStoreMenuProps) {
  const styles = useThemeStyles(createOwnerStoreStyles);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const closeMenu = () => {
    setConfirmingDelete(false);
    setDeleteError("");
    onClose();
  };

  const handleDelete = async () => {
    if (!onDeleteStore) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await onDeleteStore();
      closeMenu();
    } catch {
      setDeleteError("Couldn't delete this store. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={closeMenu}
    >
      <SafeAreaView style={styles.menuSafeArea} edges={["top", "right", "left"]}>
        <Pressable
          accessibilityLabel="Close StockPilot menu"
          disabled={deleting}
          onPress={closeMenu}
          style={StyleSheet.absoluteFill}
        />
        <ScrollView
          style={[styles.menuCard, confirmingDelete && styles.menuConfirmCard]}
          contentContainerStyle={styles.menuContent}
          showsVerticalScrollIndicator={false}
        >
          {confirmingDelete ? (
            <>
              <Text style={styles.menuTitle}>Delete {storeName}?</Text>
              <Text style={styles.menuDescription}>
                This permanently deletes the store, its products, stock levels, and movement history.
              </Text>
              {deleteError ? (
                <Text accessibilityRole="alert" style={styles.menuError}>
                  {deleteError}
                </Text>
              ) : null}
              <View style={styles.menuActions}>
                <Button
                  title="Cancel"
                  size="sm"
                  variant="secondary"
                  disabled={deleting}
                  onPress={() => setConfirmingDelete(false)}
                  style={styles.menuActionButton}
                />
                <Button
                  title="Delete"
                  size="sm"
                  variant="danger"
                  loading={deleting}
                  onPress={() => void handleDelete()}
                  style={styles.menuActionButton}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.menuTitle}>StockPilot</Text>
              <Button
                title="Edit store"
                icon={Pencil}
                variant="ghost"
                disabled={!onEditStore}
                onPress={() => {
                  closeMenu();
                  onEditStore?.();
                }}
                style={styles.menuButton}
              />
              <Button
                title="Settings"
                icon={Settings}
                variant="ghost"
                onPress={() => {
                  closeMenu();
                  Alert.alert("Settings", "Settings will be available here.");
                }}
                style={styles.menuButton}
              />
              <Button
                title="About"
                icon={Info}
                variant="ghost"
                onPress={() => {
                  closeMenu();
                  Alert.alert("About StockPilot", "StockPilot keeps your store inventory on this device.");
                }}
                style={styles.menuButton}
              />
              <Button
                title="Delete store"
                icon={Trash2}
                variant="ghost"
                disabled={!onDeleteStore}
                onPress={() => {
                  setDeleteError("");
                  setConfirmingDelete(true);
                }}
                style={styles.menuButton}
              />
              <Button
                title="Exit"
                icon={LogOut}
                variant="secondary"
                onPress={() => {
                  closeMenu();
                  onExit();
                }}
                style={styles.menuButton}
              />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
