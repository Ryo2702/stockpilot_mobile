import { useState, type ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";

import { control, radii, spacing, typography } from "@/theme";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";

export type TextFieldSize = "short" | "medium" | "full";

type TextFieldProps = Omit<TextInputProps, "style"> & {
  label: string;
  size?: TextFieldSize;
  optional?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  prefix?: ReactNode;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

export function TextField({
  label,
  size = "full",
  optional,
  required,
  error,
  helperText,
  prefix,
  multiline,
  onFocus,
  onBlur,
  style,
  containerStyle,
  ...props
}: TextFieldProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const [focused, setFocused] = useState(false);
  const labelNote = required ? "(required)" : optional ? "(optional)" : "";
  const inputStyles = [
    styles.input,
    multiline && styles.multiline,
    error && styles.errorInput,
    focused && styles.focusedInput,
    style,
  ];

  return (
    <View style={[styles.field, styles[size], containerStyle]}>
      <Text style={styles.label}>
        {label} {labelNote ? <Text style={styles.labelNote}>{labelNote}</Text> : null}
      </Text>
      {prefix ? (
        <View style={[styles.prefixShell, error && styles.errorInput, focused && styles.focusedInput]}>
          <Text style={styles.prefix}>{prefix}</Text>
          <TextInput
            {...props}
            multiline={multiline}
            onBlur={(event) => {
              setFocused(false);
              onBlur?.(event);
            }}
            onFocus={(event) => {
              setFocused(true);
              onFocus?.(event);
            }}
            placeholderTextColor={colors.text.muted}
            style={[inputStyles, styles.prefixedInput]}
          />
        </View>
      ) : (
        <TextInput
          {...props}
          multiline={multiline}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={colors.text.muted}
          style={inputStyles}
        />
      )}
      {error ? <Text style={styles.error}>{error}</Text> : helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  field: { gap: spacing[1] },
  short: { width: 120, maxWidth: "100%" },
  medium: { width: 180, maxWidth: "100%" },
  full: { width: "100%" },
  label: { ...typography.label, color: colors.text.primary },
  labelNote: { ...typography.caption, color: colors.text.muted },
  input: {
    minHeight: control.lg,
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
    color: colors.text.primary,
    ...typography.bodySmall,
  },
  multiline: { minHeight: 92, paddingTop: spacing[3], textAlignVertical: "top" },
  prefixShell: {
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
  prefix: { ...typography.bodySmall, color: colors.text.secondary },
  prefixedInput: {
    minWidth: 0,
    flex: 1,
    paddingHorizontal: 0,
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: "transparent",
  },
  focusedInput: { borderColor: colors.border.focus },
  errorInput: { borderColor: colors.semantic.danger },
  helper: { ...typography.caption, color: colors.text.secondary },
  error: { ...typography.caption, color: colors.semantic.danger },
});
