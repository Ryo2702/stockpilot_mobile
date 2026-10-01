import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { insightPeriods, type InsightCustomRange, type InsightPeriod } from "@/services/insights";
import { spacing, useThemeStyles } from "@/theme";
import { SheetFrame } from "./SheetFrame";
import { createSheetStyles } from "./sheet.styles";
import { isValidDate, periodLabels, todayString } from "./sheet.utils";

export function InsightPeriodSheet({ visible, selected, customRange, onClose, onSelect }: { visible: boolean; selected: InsightPeriod; customRange: InsightCustomRange | null; onClose: () => void; onSelect: (period: InsightPeriod, range?: InsightCustomRange) => void }) {
  const styles = useThemeStyles(createSheetStyles);
  const [customOpen, setCustomOpen] = useState(selected === "custom");
  const [start, setStart] = useState(customRange?.start ?? todayString());
  const [end, setEnd] = useState(customRange?.end ?? todayString());
  const [error, setError] = useState("");
  return <SheetFrame visible={visible} onClose={onClose} title="Choose Period">
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>{insightPeriods.map((period) => <Pressable key={period} accessibilityRole="button" onPress={() => {
      if (period === "custom") { setCustomOpen(true); setStart(customRange?.start ?? todayString()); setEnd(customRange?.end ?? todayString()); setError(""); return; }
      setCustomOpen(false); onSelect(period);
    }} style={[styles.option, selected === period && styles.optionSelected]}><Text style={[styles.optionText, selected === period && styles.optionTextSelected]}>{periodLabels[period]}</Text>{selected === period ? <Text style={styles.optionTextSelected}>Selected</Text> : null}</Pressable>)}</ScrollView>
    {customOpen ? <View style={{ gap: spacing[3] }}><View style={styles.divider} /><Text style={styles.fieldLabel}>Custom date range</Text><View style={styles.fields}>
      <TextField accessibilityLabel="Start date" autoCapitalize="none" keyboardType="numbers-and-punctuation" label="Start date" onChangeText={setStart} placeholder="YYYY-MM-DD" value={start} size="short" />
      <TextField accessibilityLabel="End date" autoCapitalize="none" keyboardType="numbers-and-punctuation" label="End date" onChangeText={setEnd} placeholder="YYYY-MM-DD" value={end} size="short" />
    </View>{error ? <Text style={styles.error}>{error}</Text> : null}<Button title="Apply Range" onPress={() => { if (!isValidDate(start) || !isValidDate(end) || end < start) { setError("Enter a valid range using YYYY-MM-DD."); return; } onSelect("custom", { start, end }); setCustomOpen(false); }} /></View> : null}
  </SheetFrame>;
}
