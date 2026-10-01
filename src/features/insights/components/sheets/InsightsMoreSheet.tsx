import { ChevronRight, Menu } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import { SheetFrame } from "./SheetFrame";
import { createSheetStyles } from "./sheet.styles";
import { reportActionRows } from "./sheet.utils";

export function InsightsMoreSheet({ visible, onClose, onAction, onMore }: { visible: boolean; onClose: () => void; onAction: (action: "generate" | "export" | "history") => void; onMore: () => void }) {
  const styles = useThemeStyles(createSheetStyles);
  const { colors } = useTheme();
  return <SheetFrame visible={visible} onClose={onClose} title="Insights Actions"><View>{reportActionRows.map(({ id, label, icon: Icon }) => <Pressable key={id} accessibilityRole="button" onPress={() => onAction(id)} style={styles.actionRow}><View style={styles.actionIcon}><Icon size={18} color={colors.primary[600]} /></View><Text style={styles.actionText}>{label}</Text><ChevronRight size={18} color={colors.text.muted} /></Pressable>)}<Pressable accessibilityRole="button" onPress={() => { onClose(); onMore(); }} style={styles.actionRow}><View style={styles.actionIcon}><Menu size={18} color={colors.primary[600]} /></View><Text style={styles.actionText}>More</Text><ChevronRight size={18} color={colors.text.muted} /></Pressable></View></SheetFrame>;
}
