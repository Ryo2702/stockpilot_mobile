import { Search, X } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
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

type SearchFieldProps = Omit<TextInputProps, "style"> & {
  onClear?: () => void;
  action?: ReactNode;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function SearchField({ onClear, action, onFocus, onBlur, style, inputStyle, value, ...props }: SearchFieldProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const [focused, setFocused] = useState(false);
  const handleFocus: NonNullable<TextInputProps["onFocus"]> = (event) => {
    setFocused(true);
    onFocus?.(event);
  };
  const handleBlur: NonNullable<TextInputProps["onBlur"]> = (event) => {
    setFocused(false);
    onBlur?.(event);
  };

  return (
    <View style={[styles.container, focused && styles.focused, style]}>
      <Search color={colors.text.muted} size={18} />
      <TextInput
        {...props}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholderTextColor={colors.text.muted}
        style={[styles.input, inputStyle]}
        value={value}
      />
      {value && onClear ? (
        <Pressable accessibilityLabel="Clear search" accessibilityRole="button" hitSlop={4} onPress={onClear} style={styles.clear}>
          <X color={colors.text.muted} size={17} />
        </Pressable>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    minHeight: control.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.input,
  },
  focused: { borderColor: colors.border.focus, backgroundColor: colors.background.input },
  input: { minWidth: 0, flex: 1, minHeight: control.lg, ...typography.input, color: colors.text.primary },
  clear: { width: control.sm, height: control.sm, alignItems: "center", justifyContent: "center" },
  action: { flexShrink: 0 },
});
