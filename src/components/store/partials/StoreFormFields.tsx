import type { PropsWithChildren } from "react";
import { Pressable, Text, TextInput, View, type TextInputProps } from "react-native";

import { colors } from "@/theme";

import { currencyModeOptions, decimalPlaceOptions, storeTypeOptions } from "../store.data";
import type { StoreErrors, StoreFieldChange, StoreForm } from "../store.types";
import { onboardingStyles as styles } from "../../onboarding/onboarding.styles";

type StoreFormFieldsProps = {
  storeForm: StoreForm;
  storeErrors: StoreErrors;
  onStoreFieldChange: StoreFieldChange;
};

type TextFieldProps = TextInputProps & {
  label: string;
  optional?: boolean;
  error?: string;
};

function TextField({ label, optional, error, style, ...props }: TextFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label} {optional ? <Text style={styles.optional}>(optional)</Text> : null}
      </Text>
      <TextInput {...props} style={[styles.input, error ? styles.inputError : null, style]} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function ColumnGroup({ children }: PropsWithChildren) {
  return <View style={styles.columnGroup}>{children}</View>;
}

function Column({ children }: PropsWithChildren) {
  return <View style={styles.column}>{children}</View>;
}

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
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
            placeholderTextColor={colors.text.muted}
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
            placeholderTextColor={colors.text.muted}
            value={storeForm.code ?? ""}
            error={storeErrors.code}
          />
        </Column>
      </ColumnGroup>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Store type</Text>
        <View style={styles.choiceList}>
          {storeTypeOptions.map(({ value, label }) => (
            <Choice
              key={value}
              label={label}
              selected={storeForm.storeType === value}
              onPress={() => onStoreFieldChange("storeType", value)}
            />
          ))}
        </View>
        {storeForm.storeType === "other" ? (
          <TextField
            accessibilityLabel="Custom store type"
            label="Custom store type"
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={(value) => onStoreFieldChange("customStoreType", value)}
            placeholder="Describe your store type"
            placeholderTextColor={colors.text.muted}
            value={storeForm.customStoreType ?? ""}
            error={storeErrors.customStoreType}
          />
        ) : null}
      </View>
    </View>
  );
}

function CurrencySection({ storeForm, storeErrors, onStoreFieldChange }: StoreFormFieldsProps) {
  const currencyMode = storeForm.currencyMode ?? "iso";

  return (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Currency</Text>
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
      {currencyMode === "iso" ? (
        <TextField
          accessibilityLabel="Currency code"
          label="Currency code"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={3}
          onChangeText={(value) => onStoreFieldChange("currencyCode", value)}
          placeholder="e.g. PHP"
          placeholderTextColor={colors.text.muted}
          value={storeForm.currencyCode ?? ""}
          error={storeErrors.currencyCode}
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
              placeholderTextColor={colors.text.muted}
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
              placeholderTextColor={colors.text.muted}
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
        placeholderTextColor={colors.text.muted}
        value={storeForm.addressLine1 ?? ""}
        error={storeErrors.addressLine1}
      />
      <TextField
        accessibilityLabel="Address line 2"
        label="Address line 2"
        optional
        onChangeText={(value) => onStoreFieldChange("addressLine2", value)}
        placeholder="Additional address details"
        placeholderTextColor={colors.text.muted}
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
            placeholderTextColor={colors.text.muted}
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
            placeholderTextColor={colors.text.muted}
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
            placeholderTextColor={colors.text.muted}
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
            placeholderTextColor={colors.text.muted}
            value={storeForm.postalCode ?? ""}
            error={storeErrors.postalCode}
          />
        </Column>
      </ColumnGroup>
      <TextField
        accessibilityLabel="Country code"
        label="Country code"
        autoCapitalize="characters"
        autoCorrect={false}
        maxLength={2}
        onChangeText={(value) => onStoreFieldChange("countryCode", value)}
        placeholder="e.g. PH"
        placeholderTextColor={colors.text.muted}
        value={storeForm.countryCode ?? ""}
        error={storeErrors.countryCode}
      />
    </View>
  );
}

export default function StoreFormFields({ storeForm, storeErrors, onStoreFieldChange }: StoreFormFieldsProps) {
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
      />
      <AddressSection
        storeForm={storeForm}
        storeErrors={storeErrors}
        onStoreFieldChange={onStoreFieldChange}
      />
    </>
  );
}
