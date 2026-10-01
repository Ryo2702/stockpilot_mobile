import type { ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { X } from "lucide-react-native";
import { IconButton } from "@/components/ui/IconButton";
import { useThemeStyles } from "@/theme";
import { createSheetStyles } from "./sheet.styles";

export function SheetFrame({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const styles = useThemeStyles(createSheetStyles);
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.root}>
      <Pressable accessibilityLabel="Close sheet" onPress={onClose} style={styles.backdrop} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.sheetHeader}><Text style={styles.title}>{title}</Text><IconButton icon={X} label={`Close ${title}`} onPress={onClose} style={styles.close} /></View>
        {children}
      </View>
    </View>
  </Modal>;
}
