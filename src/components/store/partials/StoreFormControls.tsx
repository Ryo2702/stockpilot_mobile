import { Check, ChevronDown } from "lucide-react-native";
import { useState, type PropsWithChildren } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCurrencySymbol } from "@/domain/currency";
import { useTheme } from "@/theme/ThemeProvider";

import { countryCodeOptions, currencyOptions } from "../store.data";
import { useOnboardingStyles } from "../../onboarding/onboarding.styles";

type TextFieldProps = TextInputProps & {
  label: string;
  optional?: boolean;
  error?: string;
};

export function TextField({ label, optional, error, style, ...props }: TextFieldProps) {
  const { colors } = useTheme();
  const styles = useOnboardingStyles();

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label} {optional ? <Text style={styles.optional}>(optional)</Text> : null}
      </Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.text.muted}
        style={[styles.input, error ? styles.inputError : null, style]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export function ColumnGroup({ children }: PropsWithChildren) {
  const styles = useOnboardingStyles();
  return <View style={styles.columnGroup}>{children}</View>;
}

export function Column({ children }: PropsWithChildren) {
  const styles = useOnboardingStyles();
  return <View style={styles.column}>{children}</View>;
}

export function Choice({
  label,
  selected,
  onPress,
  style,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useOnboardingStyles();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        style,
        selected && styles.choiceSelected,
        pressed && styles.choicePressed,
      ]}
    >
      <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

type DropdownOption = { value: string; label: string };

function DropdownField({
  label,
  value,
  error,
  onChange,
  options,
  searchPlaceholder,
}: {
  label: string;
  value?: string;
  error?: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  searchPlaceholder?: string;
}) {
  const { colors } = useTheme();
  const styles = useOnboardingStyles();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selectedCode = value?.trim().toUpperCase();
  const selected = options.find((option) => option.value === selectedCode);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = searchPlaceholder && normalizedQuery
    ? options.filter(({ value: code, label: optionLabel }) =>
        `${optionLabel} ${code}`.toLowerCase().includes(normalizedQuery),
      )
    : options;
  const close = () => {
    setQuery("");
    setOpen(false);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        accessibilityLabel={`${label}, ${selected?.label ?? `select ${label.toLowerCase()}`}`}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => {
          setQuery("");
          setOpen(true);
        }}
        style={({ pressed }) => [styles.dropdownSelector, pressed && styles.choicePressed]}
      >
        <Text numberOfLines={1} style={[styles.dropdownText, !selected && styles.dropdownPlaceholder]}>
          {selected?.label ?? `Select ${label.toLowerCase()}`}
        </Text>
        <ChevronDown color={colors.text.secondary} size={18} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.dropdownOverlay}>
          <SafeAreaView style={styles.dropdownSheet} edges={["bottom"]}>
            <Text style={styles.dropdownTitle}>Select {label.toLowerCase()}</Text>
            {searchPlaceholder ? (
              <TextInput
                accessibilityLabel={searchPlaceholder}
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor={colors.text.muted}
                style={styles.input}
                value={query}
              />
            ) : null}
            {filteredOptions.length ? (
              <ScrollView
                style={styles.dropdownOptions}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {filteredOptions.map((option) => {
                  const isSelected = option.value === selectedCode;
                  return (
                    <Pressable
                      key={option.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => {
                        onChange(option.value);
                        close();
                      }}
                      style={({ pressed }) => [styles.dropdownOption, pressed && styles.choicePressed]}
                    >
                      <Text style={[styles.dropdownOptionLabel, isSelected && styles.dropdownSelectedLabel]}>
                        {option.label}
                      </Text>
                      {isSelected ? <Check color={colors.primary[700]} size={18} /> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={styles.dropdownPlaceholder}>No matching options.</Text>
            )}
            <Pressable accessibilityRole="button" onPress={close} style={styles.dropdownClose}>
              <Text style={styles.dropdownCloseText}>Cancel</Text>
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

export function CurrencyDropdown({
  value,
  error,
  onChange,
}: {
  value?: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const selectedCode = value?.trim().toUpperCase();
  const options = selectedCode && !currencyOptions.some((option) => option.value === selectedCode)
    ? [{ value: selectedCode, label: `${selectedCode} (${getCurrencySymbol({ currencyMode: "iso", currencyCode: selectedCode })})` }, ...currencyOptions]
    : currencyOptions;

  return (
    <DropdownField
      error={error}
      label="Currency"
      onChange={onChange}
      options={options}
      searchPlaceholder="Search currencies or codes"
      value={selectedCode}
    />
  );
}

export function CountryCodeDropdown({
  value,
  error,
  onChange,
}: {
  value?: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  const selectedCode = value?.trim().toUpperCase();
  const options = selectedCode && !countryCodeOptions.some((option) => option.value === selectedCode)
    ? [{ value: selectedCode, label: `Unknown country (${selectedCode})` }, ...countryCodeOptions]
    : countryCodeOptions;

  return (
    <DropdownField
      error={error}
      label="Country"
      onChange={onChange}
      options={options}
      searchPlaceholder="Search countries or codes"
      value={selectedCode}
    />
  );
}
