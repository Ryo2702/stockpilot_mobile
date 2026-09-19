import { Info, LogOut, Settings } from "lucide-react-native";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { useThemeStyles } from "@/theme/ThemeProvider";

import { createOwnerStoreStyles } from "./owner-store.styles";

type OwnerStoreMenuProps = {
  visible: boolean;
  onClose: () => void;
  onExit: () => void;
};

export default function OwnerStoreMenu({ visible, onClose, onExit }: OwnerStoreMenuProps) {
  const styles = useThemeStyles(createOwnerStoreStyles);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.menuSafeArea} edges={["top", "right", "left"]}>
        <Pressable
          accessibilityLabel="Close StockPilot menu"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.menuCard}>
          <Text style={styles.menuTitle}>StockPilot</Text>
          <Button
            title="Settings"
            icon={Settings}
            variant="ghost"
            onPress={() => {
              onClose();
              Alert.alert("Settings", "Settings will be available here.");
            }}
            style={styles.menuButton}
          />
          <Button
            title="About"
            icon={Info}
            variant="ghost"
            onPress={() => {
              onClose();
              Alert.alert("About StockPilot", "StockPilot keeps your store inventory on this device.");
            }}
            style={styles.menuButton}
          />
          <Button
            title="Exit"
            icon={LogOut}
            variant="secondary"
            onPress={() => {
              onClose();
              onExit();
            }}
            style={styles.menuButton}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
