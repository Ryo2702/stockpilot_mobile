import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { control, radii, spacing, typography, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";

type BarcodeScannerModalProps = {
  visible: boolean;
  onClose: () => void;
  onScanned: (value: string) => void;
};

export default function BarcodeScannerModal({ visible, onClose, onScanned }: BarcodeScannerModalProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const { height } = useWindowDimensions();
  const previewHeight = Math.min(360, Math.max(112, (height - 152) * 0.65));
  const frameHeight = Math.min(108, previewHeight * 0.4);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraError, setCameraError] = useState(false);
  const handledScan = useRef(false);

  useEffect(() => {
    if (visible) {
      handledScan.current = false;
      setCameraError(false);
    }
  }, [visible]);

  const handleScanned = ({ data }: BarcodeScanningResult) => {
    if (handledScan.current) return;
    handledScan.current = true;
    onScanned(data);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <IconButton icon={ChevronLeft} label="Close barcode scanner" onPress={onClose} />
          <Text style={styles.title}>Scan Barcode</Text>
        </View>
        <View style={[styles.content, { paddingVertical: Math.min(spacing[4], height * 0.025) }]}>
          {!visible ? null : !permission ? (
            <ActivityIndicator color={colors.primary[600]} />
          ) : !permission.granted ? (
            <View style={styles.message}>
              <Text style={styles.messageText}>Allow camera access to scan a barcode or QR code.</Text>
              <Button title="Allow Camera Access" onPress={() => void requestPermission()} />
            </View>
          ) : cameraError ? (
            <View style={styles.message}>
              <Text style={styles.messageText}>The camera could not start. Close the scanner and try again.</Text>
            </View>
          ) : (
            <>
              <View style={[styles.preview, { height: previewHeight }]}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  onBarcodeScanned={handleScanned}
                  onMountError={() => setCameraError(true)}
                />
                <View pointerEvents="none" style={[styles.scanFrame, { height: frameHeight }]} />
              </View>
              <Text style={styles.instructions}>Align a barcode or QR code inside the frame.</Text>
            </>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.app,
  },
  header: {
    minHeight: control.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    backgroundColor: colors.background.surface,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[4],
    padding: spacing[4],
  },
  preview: {
    width: "100%",
    maxWidth: 520,
    overflow: "hidden",
    borderRadius: radii.lg,
    backgroundColor: colors.text.primary,
  },
  camera: {
    flex: 1,
  },
  scanFrame: {
    position: "absolute",
    top: "35%",
    left: "12%",
    width: "76%",
    borderWidth: 2,
    borderColor: colors.primary[500],
    borderRadius: radii.md,
  },
  instructions: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: "center",
  },
  message: {
    maxWidth: 360,
    alignItems: "center",
    gap: spacing[4],
  },
  messageText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: "center",
  },
});
