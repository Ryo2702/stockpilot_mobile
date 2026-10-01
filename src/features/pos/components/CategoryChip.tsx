import { Pressable, Text } from "react-native";
import { useThemeStyles } from "@/theme";
import { createPosStyles } from "../pos.styles";

export function CategoryChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const styles = useThemeStyles(createPosStyles);
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.categoryChip, selected && styles.categoryChipSelected]}><Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>{label}</Text></Pressable>;
}
