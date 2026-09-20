import { Check, ChevronDown } from "lucide-react-native";
import { useState, type PropsWithChildren } from "react";
import { Image, Modal, Pressable, ScrollView, Text, TextInput, View, type TextInputProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getCurrencySymbol } from "@/domain/currency";
import { useTheme } from "@/theme/ThemeProvider";

import {
  countryCodeOptions,
  currencyModeOptions,
  currencyOptions,
  decimalPlaceOptions,
  storeTypeOptions,
} from "../store.data";
import type { StoreErrors, StoreFieldChange, StoreForm } from "../store.types";
import { useOnboardingStyles } from "../../onboarding/onboarding.styles";

type StoreFormFieldsProps = {
  storeForm: StoreForm;
  storeErrors: StoreErrors;
  onStoreFieldChange: StoreFieldChange;
  allowCustomCurrency?: boolean;
};

type TextFieldProps = TextInputProps & {
  label: string;
  optional?: boolean;
  error?: string;
};

function TextField({ label, optional, error, style, ...props }: TextFieldProps) {
  const { colors } = useTheme();
  const styles = useOnboardingStyles();

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label} {optional ? <Text style={styles.optional}>(optional)</Text> : null}
      </Text>
      <TextInput {...props} placeholderTextColor={colors.text.muted} style={[styles.input, error ? styles.inputError : null, style]} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function ColumnGroup({ children }: PropsWithChildren) {
  const styles = useOnboardingStyles();
  return <View style={styles.columnGroup}>{children}</View>;
}

function Column({ children }: PropsWithChildren) {
  const styles = useOnboardingStyles();
  return <View style={styles.column}>{children}</View>;
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const styles = useOnboardingStyles();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.choicePressed]}
    >
      <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

function StoreDetailsSection({ storeForm, storeErrors, onStoreFieldChange }: StoreFormFieldsProps) {
  const { colors } = useTheme();
  const styles = useOnboardingStyles();

  return (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Store details</Text>
      <ColumnGroup>
        <Column>
          <TextField
            accessibilityLabel="Store name"
            label="Store name"
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={(value) => onStoreFieldChange("name", value)}
            placeholder="e.g. Main Store"
            value={storeForm.name ?? ""}
            error={storeErrors.name}
          />
        </Column>
        <Column>
          <TextField
            accessibilityLabel="Store code"
            label="Store code"
            optional
            autoCapitalize="characters"
            autoCorrect={false}
            onChangeText={(value) => onStoreFieldChange("code", value)}
            placeholder="e.g. MAIN-01"
            value={storeForm.code ?? ""}
            error={storeErrors.code}
          />
        </Column>
      </ColumnGroup>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Store type</Text>
        <View style={styles.storeTypeList}>
          {storeTypeOptions.map(({ value, label, image }) => {
            const selected = storeForm.storeType === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="radio"
                accessibilityLabel={label}
                accessibilityHint="Select this store type"
                accessibilityState={{ selected }}
                onPress={() => onStoreFieldChange("storeType", value)}
                style={({ pressed }) => [
                  styles.storeTypeChoice,
                  selected && styles.storeTypeChoiceSelected,
                  pressed && styles.choicePressed,
                ]}
              >
                <Image accessible={false} source={image} resizeMode="contain" style={styles.storeTypeImage} />
                {selected ? (
                  <View style={styles.storeTypeCheck}>
                    <Check color={colors.text.onPrimary} size={12} strokeWidth={3} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
        {storeForm.storeType === "other" ? (
          <TextField
            accessibilityLabel="Custom store type"
            label="Custom store type"
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={(value) => onStoreFieldChange("customStoreType", value)}
            placeholder="Describe your store type"
            value={storeForm.customStoreType ?? ""}
            error={storeErrors.customStoreType}
          />
        ) : null}
      </View>
    </View>
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
  const selectedCode = value?.trim().toUpperCase();
  const selected = options.find((option) => option.value === selectedCode);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = searchPlaceholder && normalizedQuery
    ? options.filter(({ value: code, label: optionLabel }) =>
        `${optionLabel} ${code}`.toLowerCase().includes(normalizedQuery),
      )
    : options;

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${selected?.label ?? `select ${label.toLowerCase()}`}`}
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
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setQuery("");
          setOpen(false);
        }}
      >
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
                        setQuery("");
                        setOpen(false);
                      }}
                      style={({ pressed }) => [styles.dropdownOption, pressed && styles.choicePressed]}
                    >
                      <Text style={[styles.dropdownOptionLabel, isSelected && styles.dropdownSelectedLabel]}>
                        {option.label}
                      </Text>
                      {isSelected ? <Check color={colors.primary[600]} size={18} /> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : (
              <Text style={styles.dropdownPlaceholder}>No matching options.</Text>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setQuery("");
                setOpen(false);
              }}
              style={styles.dropdownClose}
            >
              <Text style={styles.dropdownCloseText}>Cancel</Text>
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

function CurrencyDropdown({
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
    ? [
        {
          value: selectedCode,
          label: `${selectedCode} (${getCurrencySymbol({ currencyMode: "iso", currencyCode: selectedCode })})`,
        },
        ...currencyOptions,
      ]
    : currencyOptions;

  return (
    <DropdownField
      label="Currency"
      value={selectedCode}
      error={error}
      onChange={onChange}
      options={options}
    />
  );
}

function CountryCodeDropdown({
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
      label="Country code"
      value={selectedCode}
      error={error}
      onChange={onChange}
      options={options}
      searchPlaceholder="Search countries or codes"
    />
  );
}

function CurrencySection({
  storeForm,
  storeErrors,
  onStoreFieldChange,
  allowCustomCurrency = true,
}: StoreFormFieldsProps) {
  const styles = useOnboardingStyles();
  const currencyMode = allowCustomCurrency ? storeForm.currencyMode ?? "iso" : "iso";

  return (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Currency</Text>
      {allowCustomCurrency ? (
        <View style={styles.choiceList}>
          {currencyModeOptions.map(({ value, label }) => (
            <Choice
              key={value}
              label={label}
              selected={currencyMode === value}
              onPress={() => onStoreFieldChange("currencyMode", value)}
            />
          ))}
        </View>
      ) : null}
      {currencyMode === "iso" ? (
        <CurrencyDropdown
          value={storeForm.currencyCode}
          error={storeErrors.currencyCode}
          onChange={(value) => onStoreFieldChange("currencyCode", value)}
        />
      ) : (
        <ColumnGroup>
          <Column>
            <TextField
              accessibilityLabel="Custom currency name"
              label="Currency name"
              autoCapitalize="words"
              onChangeText={(value) => onStoreFieldChange("customCurrencyName", value)}
              placeholder="e.g. Credits"
              value={storeForm.customCurrencyName ?? ""}
              error={storeErrors.customCurrencyName}
            />
          </Column>
          <Column>
            <TextField
              accessibilityLabel="Custom currency symbol"
              label="Symbol"
              autoCapitalize="none"
              onChangeText={(value) => onStoreFieldChange("customCurrencySymbol", value)}
              placeholder="e.g. ¤"
              value={storeForm.customCurrencySymbol ?? ""}
              error={storeErrors.customCurrencySymbol}
            />
          </Column>
        </ColumnGroup>
      )}
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Decimal places</Text>
        <View style={styles.choiceList}>
          {decimalPlaceOptions.map((value) => (
            <Choice
              key={value}
              label={String(value)}
              selected={(storeForm.currencyDecimalPlaces ?? 2) === value}
              onPress={() => onStoreFieldChange("currencyDecimalPlaces", value)}
            />
          ))}
        </View>
        {storeErrors.currencyDecimalPlaces ? (
          <Text style={styles.error}>{storeErrors.currencyDecimalPlaces}</Text>
        ) : null}
      </View>
    </View>
  );
}

function AddressSection({ storeForm, storeErrors, onStoreFieldChange }: StoreFormFieldsProps) {
  const styles = useOnboardingStyles();

  return (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>
        Address <Text style={styles.optional}>(optional)</Text>
      </Text>
      <TextField
        accessibilityLabel="Address line 1"
        label="Address line 1"
        onChangeText={(value) => onStoreFieldChange("addressLine1", value)}
        placeholder="Street, building, or unit"
        value={storeForm.addressLine1 ?? ""}
        error={storeErrors.addressLine1}
      />
      <TextField
        accessibilityLabel="Address line 2"
        label="Address line 2"
        optional
        onChangeText={(value) => onStoreFieldChange("addressLine2", value)}
        placeholder="Additional address details"
        value={storeForm.addressLine2 ?? ""}
        error={storeErrors.addressLine2}
      />
      <ColumnGroup>
        <Column>
          <TextField
            accessibilityLabel="Barangay"
            label="Barangay"
            onChangeText={(value) => onStoreFieldChange("barangay", value)}
            placeholder="Barangay"
            value={storeForm.barangay ?? ""}
            error={storeErrors.barangay}
          />
        </Column>
        <Column>
          <TextField
            accessibilityLabel="City"
            label="City"
            onChangeText={(value) => onStoreFieldChange("city", value)}
            placeholder="City"
            value={storeForm.city ?? ""}
            error={storeErrors.city}
          />
        </Column>
      </ColumnGroup>
      <ColumnGroup>
        <Column>
          <TextField
            accessibilityLabel="Province or state"
            label="Province / state"
            onChangeText={(value) => onStoreFieldChange("provinceState", value)}
            placeholder="Province / state"
            value={storeForm.provinceState ?? ""}
            error={storeErrors.provinceState}
          />
        </Column>
        <Column>
          <TextField
            accessibilityLabel="Postal code"
            label="Postal code"
            keyboardType="numbers-and-punctuation"
            onChangeText={(value) => onStoreFieldChange("postalCode", value)}
            placeholder="Postal code"
            value={storeForm.postalCode ?? ""}
            error={storeErrors.postalCode}
          />
        </Column>
      </ColumnGroup>
      <CountryCodeDropdown
        value={storeForm.countryCode}
        onChange={(value) => onStoreFieldChange("countryCode", value)}
        error={storeErrors.countryCode}
      />
    </View>
  );
}

export default function StoreFormFields({
  storeForm,
  storeErrors,
  onStoreFieldChange,
  allowCustomCurrency,
}: StoreFormFieldsProps) {
  return (
    <>
      <StoreDetailsSection
        storeForm={storeForm}
        storeErrors={storeErrors}
        onStoreFieldChange={onStoreFieldChange}
      />
      <CurrencySection
        storeForm={storeForm}
        storeErrors={storeErrors}
        onStoreFieldChange={onStoreFieldChange}
        allowCustomCurrency={allowCustomCurrency}
      />
      <AddressSection
        storeForm={storeForm}
        storeErrors={storeErrors}
        onStoreFieldChange={onStoreFieldChange}
      />
    </>
  );
}
