import { Children, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { Check, ChevronRight, type LucideIcon } from "lucide-react-native";

import { TextField, type TextFieldSize } from "@/components/ui/TextField";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";

import { createSettingsStyles } from "./settings.styles";

export function SettingsRow({
  icon: Icon,
  title,
  description,
  value,
  badge,
  onPress,
  destructive = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  value?: string;
  badge?: string;
  onPress?: () => void;
  destructive?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createSettingsStyles);
  const content = (
    <>
      <View style={styles.iconSlot}>
        <Icon
          color={destructive ? colors.semantic.danger : colors.primary[700]}
          size={20}
          strokeWidth={1.8}
        />
      </View>
      <View style={styles.rowCopy}>
        <Text
          style={[styles.rowTitle, destructive && styles.destructiveRowTitle]}
        >
          {title}
        </Text>
        {description || value ? (
          <Text numberOfLines={2} style={styles.rowDescription}>
            {description ?? value}
          </Text>
        ) : null}
      </View>
      {onPress || badge ? (
        <View style={styles.rowTrailing}>
          {badge ? <Text style={styles.rowBadge}>{badge}</Text> : null}
          {onPress ? (
            <ChevronRight color={colors.text.muted} size={18} />
          ) : null}
        </View>
      ) : null}
    </>
  );

  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        description || value ? title + ", " + (description ?? value) : title
      }
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {content}
    </Pressable>
  ) : (
    <View style={styles.row}>{content}</View>
  );
}

export function SettingsGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const styles = useThemeStyles(createSettingsStyles);
  const rows = Children.toArray(children);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.group}>
        {rows.map((child, index) => (
          <View key={index}>
            {child}
            {index < rows.length - 1 ? <View style={styles.separator} /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

export function RadioRow({
  label,
  description,
  selected,
  onPress,
}: {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createSettingsStyles);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.radioRow, pressed && styles.rowPressed]}
    >
      <View style={styles.choiceCopy}>
        <Text style={styles.radioLabel}>{label}</Text>
        {description ? (
          <Text style={styles.radioDescription}>{description}</Text>
        ) : null}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? (
          <Check color={colors.text.onPrimary} size={14} strokeWidth={2.5} />
        ) : null}
      </View>
    </Pressable>
  );
}

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  help,
  keyboardType,
  autoCapitalize = "sentences",
  secureTextEntry = false,
  maxLength,
  size = "full",
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  help?: string;
  keyboardType?:
    | "default"
    | "number-pad"
    | "decimal-pad"
    | "numbers-and-punctuation";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  secureTextEntry?: boolean;
  maxLength?: number;
  size?: TextFieldSize;
}) {
  return (
    <TextField
      accessibilityLabel={label}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
      error={error}
      helperText={help}
      keyboardType={keyboardType}
      label={label}
      maxLength={maxLength}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      size={size}
      value={value}
    />
  );
}
