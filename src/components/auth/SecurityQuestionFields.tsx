import { Check, ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  securityQuestionOptions,
  securityRecoveryQuestionCount,
  type SecurityQuestionId,
} from "@/data/security-questions";
import { Button } from "@/components/ui/Button";
import { control, radii, spacing, typography, useTheme, useThemeStyles } from "@/theme";
import type { ThemeColors } from "@/theme/tokens";

export type SecurityQuestionDraft = {
  questionId: SecurityQuestionId | null;
  answer: string;
};

export function createSecurityQuestionDrafts(questionIds: readonly SecurityQuestionId[] = []): SecurityQuestionDraft[] {
  return Array.from({ length: securityRecoveryQuestionCount }, (_, index): SecurityQuestionDraft => ({
    questionId: questionIds[index] ?? null,
    answer: "",
  }));
}

export function toSecurityRecoveryAnswers(drafts: SecurityQuestionDraft[]) {
  if (drafts.length !== securityRecoveryQuestionCount || drafts.some(({ questionId, answer }) => !questionId || answer.trim().length < 2)) {
    return null;
  }
  return drafts.map(({ questionId, answer }) => ({ questionId: questionId!, answer }));
}

type SecurityQuestionFieldsProps = {
  drafts: SecurityQuestionDraft[];
  onChange: (drafts: SecurityQuestionDraft[]) => void;
  questionsLocked?: boolean;
};

export function SecurityQuestionFields({
  drafts,
  onChange,
  questionsLocked = false,
}: SecurityQuestionFieldsProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const selectedIds = new Set(drafts.map(({ questionId }) => questionId).filter(Boolean));

  const setDraft = (index: number, value: Partial<SecurityQuestionDraft>) => {
    onChange(drafts.map((draft, current) => current === index ? { ...draft, ...value } : draft));
  };

  return (
    <View style={styles.fields}>
      {drafts.map((draft, index) => {
        const label = draft.questionId
          ? securityQuestionOptions.find((question) => question.id === draft.questionId)?.label
          : undefined;
        return (
          <View key={index} style={styles.field}>
            <Text style={styles.label}>Question {index + 1}</Text>
            {questionsLocked ? (
              <View style={styles.questionReadOnly}>
                <Text style={styles.questionText}>{label}</Text>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Choose security question ${index + 1}`}
                onPress={() => setPickerIndex(index)}
                style={({ pressed }) => [styles.questionSelect, pressed && styles.pressed]}
              >
                <Text numberOfLines={2} style={[styles.questionText, !label && styles.placeholder]}>
                  {label ?? "Choose a question"}
                </Text>
                <ChevronDown color={colors.text.muted} size={18} />
              </Pressable>
            )}
            <TextInput
              accessibilityLabel={label ? `Answer for: ${label}` : `Answer for question ${index + 1}`}
              autoCapitalize="sentences"
              autoCorrect={false}
              onChangeText={(answer) => setDraft(index, { answer })}
              placeholder="Your answer"
              placeholderTextColor={colors.text.muted}
              secureTextEntry
              style={styles.answer}
              value={draft.answer}
            />
          </View>
        );
      })}

      <Modal
        animationType="fade"
        transparent
        visible={pickerIndex !== null}
        onRequestClose={() => setPickerIndex(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Choose a security question</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.options}>
              {securityQuestionOptions.map((question) => {
                const selected = pickerIndex !== null && drafts[pickerIndex]?.questionId === question.id;
                const unavailable = !selected && selectedIds.has(question.id);
                return (
                  <Pressable
                    key={question.id}
                    accessibilityRole="button"
                    accessibilityState={{ disabled: unavailable, selected }}
                    disabled={unavailable}
                    onPress={() => {
                      if (pickerIndex === null) return;
                      if (drafts[pickerIndex]?.questionId !== question.id) {
                        setDraft(pickerIndex, { questionId: question.id, answer: "" });
                      }
                      setPickerIndex(null);
                    }}
                    style={({ pressed }) => [styles.option, unavailable && styles.optionDisabled, pressed && !unavailable && styles.pressed]}
                  >
                    <Text style={styles.optionLabel}>{question.label}</Text>
                    {selected ? <Check color={colors.primary[600]} size={18} strokeWidth={2.5} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Button title="Cancel" variant="secondary" onPress={() => setPickerIndex(null)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  fields: { gap: spacing[4] },
  field: { gap: spacing[2] },
  label: { ...typography.label, color: colors.text.primary },
  questionSelect: {
    minHeight: control.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
  },
  questionReadOnly: {
    minHeight: control.lg,
    justifyContent: "center",
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.gray[50],
  },
  questionText: { ...typography.bodySmall, flex: 1, color: colors.text.primary },
  placeholder: { color: colors.text.muted },
  answer: {
    minHeight: control.lg,
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
    color: colors.text.primary,
    ...typography.body,
  },
  overlay: { flex: 1, justifyContent: "center", padding: spacing[5], backgroundColor: "rgba(36, 28, 23, 0.45)" },
  dialog: {
    width: "100%",
    maxWidth: 440,
    maxHeight: "80%",
    alignSelf: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radii.lg,
    backgroundColor: colors.background.surface,
  },
  dialogTitle: { ...typography.h3, color: colors.text.primary },
  options: { marginHorizontal: -spacing[4] },
  option: {
    minHeight: control.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  optionLabel: { ...typography.bodySmall, flex: 1, color: colors.text.primary },
  optionDisabled: { opacity: 0.42 },
  pressed: { opacity: 0.72 },
});
