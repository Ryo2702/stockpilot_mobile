import { Modal, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import type { OwnerStore } from "@/services/owner-store.service";
import { useThemeStyles } from "@/theme/ThemeProvider";

import type { SettingsController } from "./settings.controller";
import { formatDateTime } from "./settings.utils";
import { createSettingsStyles } from "./settings.styles";

export default function SettingsDialogs({
  ownerStore,
  settings,
}: {
  ownerStore: OwnerStore;
  settings: SettingsController;
}) {
  const styles = useThemeStyles(createSettingsStyles);
  const {
    restoreDialogVisible,
    setRestoreDialogVisible,
    restoreBusy,
    setRestoreCandidate,
    restoreCandidate,
    restoreError,
    confirmRestore,
    deleteStoreDialogVisible,
    deleteStoreBusy,
    setDeleteStoreDialogVisible,
    setDeleteStoreError,
    deleteStoreError,
    confirmDeleteStore,
  } = settings;

  return (
    <>
<Modal
        visible={restoreDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!restoreBusy) {
            setRestoreDialogVisible(false);
            setRestoreCandidate(null);
          }
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Restore Backup?</Text>
            <Text style={styles.dialogCopy}>
              This backup may replace your current StockPilot data.
            </Text>
            {restoreCandidate ? (
              <View style={styles.form}>
                <Text style={styles.filename}>{restoreCandidate.name}</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Backup Date</Text>
                  <Text style={styles.summaryValue}>
                    {formatDateTime(restoreCandidate.createdAt)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Stores</Text>
                  <Text style={styles.summaryValue}>
                    {restoreCandidate.summary.storeCount}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Products</Text>
                  <Text style={styles.summaryValue}>
                    {restoreCandidate.summary.productCount}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Stock Movements</Text>
                  <Text style={styles.summaryValue}>
                    {restoreCandidate.summary.movementCount.toLocaleString()}
                  </Text>
                </View>
              </View>
            ) : null}
            {restoreError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {restoreError}
              </Text>
            ) : null}
            <View style={styles.dialogActions}>
              <Button
                title="Cancel"
                variant="secondary"
                disabled={restoreBusy}
                onPress={() => {
                  setRestoreDialogVisible(false);
                  setRestoreCandidate(null);
                }}
                style={styles.dialogButton}
              />
              <Button
                title="Restore Backup"
                variant="danger"
                loading={restoreBusy}
                onPress={() => void confirmRestore()}
                style={styles.dialogButton}
              />
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={deleteStoreDialogVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!deleteStoreBusy) setDeleteStoreDialogVisible(false);
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>
              Delete {ownerStore.storeName}?
            </Text>
            <Text style={styles.dialogCopy}>
              This permanently deletes the store, its products, stock levels,
              and movement history.
            </Text>
            {deleteStoreError ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {deleteStoreError}
              </Text>
            ) : null}
            <View style={styles.dialogActions}>
              <Button
                title="Cancel"
                variant="secondary"
                disabled={deleteStoreBusy}
                onPress={() => {
                  setDeleteStoreDialogVisible(false);
                  setDeleteStoreError("");
                }}
                style={styles.dialogButton}
              />
              <Button
                title="Delete Store"
                variant="danger"
                loading={deleteStoreBusy}
                onPress={() => void confirmDeleteStore()}
                style={styles.dialogButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
