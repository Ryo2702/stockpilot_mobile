import { Check, Plus } from "lucide-react-native";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { Button } from "@/components/ui/Button";
import { useTheme } from "@/theme/ThemeProvider";

import {
  currencyModeOptions,
  decimalPlaceOptions,
  storeTypeOptions,
} from "../store.data";
import type { StoreFormFieldsProps } from "./store-form-fields.types";
import {
  Choice,
  Column,
  ColumnGroup,
  CountryCodeDropdown,
  CurrencyDropdown,
  TextField,
} from "./StoreFormControls";
import { useOnboardingStyles } from "../../onboarding/onboarding.styles";

function SectionHeading({
  number,
  title,
  optional = false,
}: {
  number: number;
  title: string;
  optional?: boolean;
}) {
  const styles = useOnboardingStyles();

  return (
    <View style={styles.compactSectionHeading}>
      <View style={styles.sectionNumber}>
        <Text style={styles.sectionNumberText}>{number}</Text>
      </View>
      <Text style={styles.compactSectionTitle}>{title}</Text>
      {optional ? <Text style={styles.sectionOptional}>Optional</Text> : null}
    </View>
  );
}

export function StoreDetailsSection({
  storeForm,
  storeErrors,
  onStoreFieldChange,
}: StoreFormFieldsProps) {
  const styles = useOnboardingStyles();

  return (
    <View style={styles.formSection}>
      <SectionHeading number={1} title="Store details" />
      <ColumnGroup>
        <Column>
          <TextField
            accessibilityLabel="Store name"
            autoCapitalize="words"
            autoCorrect={false}
            error={storeErrors.name}
            label="Store name"
            onChangeText={(value) => onStoreFieldChange("name", value)}
            placeholder="e.g. Main Store"
            value={storeForm.name ?? ""}
          />
        </Column>
        <Column>
          <TextField
            accessibilityLabel="Store code"
            autoCapitalize="characters"
            autoCorrect={false}
            error={storeErrors.code}
            label="Store code"
            onChangeText={(value) => onStoreFieldChange("code", value)}
            optional
            placeholder="e.g. MAIN-01"
            value={storeForm.code ?? ""}
          />
        </Column>
      </ColumnGroup>
    </View>
  );
}

export function StoreTypeSection({
  storeForm,
  storeErrors,
  onStoreFieldChange,
}: StoreFormFieldsProps) {
  const { colors } = useTheme();
  const styles = useOnboardingStyles();

  return (
    <View style={styles.formSection}>
      <SectionHeading number={2} title="Store type" />
      <ScrollView
        horizontal
        contentContainerStyle={styles.storeTypeScroller}
        showsHorizontalScrollIndicator={false}
      >
        {storeTypeOptions.map(({ value, label, image }) => {
          const selected = storeForm.storeType === value;
          return (
            <Pressable
              key={value}
              accessibilityHint="Select this store type"
              accessibilityLabel={label}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onStoreFieldChange("storeType", value)}
              style={({ pressed }) => [
                styles.compactStoreTypeChoice,
                selected && styles.compactStoreTypeChoiceSelected,
                pressed && styles.choicePressed,
              ]}
            >
              <Image accessible={false} source={image} resizeMode="contain" style={styles.compactStoreTypeImage} />
              <Text numberOfLines={2} style={[styles.compactStoreTypeLabel, selected && styles.compactStoreTypeLabelSelected]}>
                {label}
              </Text>
              {selected ? (
                <View style={styles.compactStoreTypeCheck}>
                  <Check color={colors.primary[700]} size={12} strokeWidth={3} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
      {storeForm.storeType === "other" ? (
        <TextField
          accessibilityLabel="Custom store type"
          autoCapitalize="words"
          autoCorrect={false}
          error={storeErrors.customStoreType}
          label="Custom store type"
          onChangeText={(value) => onStoreFieldChange("customStoreType", value)}
          placeholder="Describe your store type"
          value={storeForm.customStoreType ?? ""}
        />
      ) : null}
    </View>
  );
}

function DecimalPlaces({
  storeForm,
  storeErrors,
  onStoreFieldChange,
  style,
}: StoreFormFieldsProps & { style?: StyleProp<ViewStyle> }) {
  const styles = useOnboardingStyles();

  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>Decimal places</Text>
      <View style={styles.decimalChoices}>
        {decimalPlaceOptions.map((value) => (
          <Choice
            key={value}
            label={String(value)}
            onPress={() => onStoreFieldChange("currencyDecimalPlaces", value)}
            selected={(storeForm.currencyDecimalPlaces ?? 2) === value}
            style={styles.decimalChoice}
          />
        ))}
      </View>
      {storeErrors.currencyDecimalPlaces ? <Text style={styles.error}>{storeErrors.currencyDecimalPlaces}</Text> : null}
    </View>
  );
}

export function CurrencySection({
  storeForm,
  storeErrors,
  onStoreFieldChange,
  allowCustomCurrency = true,
}: StoreFormFieldsProps) {
  const styles = useOnboardingStyles();
  const currencyMode = allowCustomCurrency ? storeForm.currencyMode ?? "iso" : "iso";

  return (
    <View style={styles.formSection}>
      <SectionHeading number={3} title="Currency & Format" />
      {allowCustomCurrency ? (
        <View style={styles.choiceList}>
          {currencyModeOptions.map(({ value, label }) => (
            <Choice
              key={value}
              label={label}
              onPress={() => onStoreFieldChange("currencyMode", value)}
              selected={currencyMode === value}
            />
          ))}
        </View>
      ) : null}
      {currencyMode === "iso" ? (
        <View style={styles.currencyFormatRow}>
          <View style={styles.currencyFormatCurrency}>
            <CurrencyDropdown
              error={storeErrors.currencyCode}
              onChange={(value) => onStoreFieldChange("currencyCode", value)}
              value={storeForm.currencyCode}
            />
          </View>
          <DecimalPlaces
            storeForm={storeForm}
            storeErrors={storeErrors}
            onStoreFieldChange={onStoreFieldChange}
            style={styles.currencyFormatDecimals}
          />
        </View>
      ) : (
        <>
          <ColumnGroup>
            <Column>
              <TextField
                accessibilityLabel="Custom currency name"
                autoCapitalize="words"
                error={storeErrors.customCurrencyName}
                label="Currency name"
                onChangeText={(value) => onStoreFieldChange("customCurrencyName", value)}
                placeholder="e.g. Credits"
                value={storeForm.customCurrencyName ?? ""}
              />
            </Column>
            <Column>
              <TextField
                accessibilityLabel="Custom currency symbol"
                autoCapitalize="none"
                error={storeErrors.customCurrencySymbol}
                label="Symbol"
                onChangeText={(value) => onStoreFieldChange("customCurrencySymbol", value)}
                placeholder="e.g. ¤"
                value={storeForm.customCurrencySymbol ?? ""}
              />
            </Column>
          </ColumnGroup>
          <DecimalPlaces
            storeForm={storeForm}
            storeErrors={storeErrors}
            onStoreFieldChange={onStoreFieldChange}
          />
        </>
      )}
    </View>
  );
}

export function LocationSection({
  storeForm,
  storeErrors,
  onStoreFieldChange,
}: StoreFormFieldsProps) {
  const { colors } = useTheme();
  const styles = useOnboardingStyles();
  const [expanded, setExpanded] = useState(Boolean(
    storeForm.addressLine1 || storeForm.addressLine2 || storeForm.barangay || storeForm.city || storeForm.provinceState || storeForm.postalCode,
  ));
  const removeLocation = () => {
    onStoreFieldChange("addressLine1", "");
    onStoreFieldChange("addressLine2", "");
    onStoreFieldChange("barangay", "");
    onStoreFieldChange("city", "");
    onStoreFieldChange("provinceState", "");
    onStoreFieldChange("postalCode", "");
    onStoreFieldChange("countryCode", "PH");
    setExpanded(false);
  };

  return (
    <View style={styles.formSection}>
      <SectionHeading number={4} title="Location" optional />
      {expanded ? (
        <>
          <TextField
            accessibilityLabel="Address line 1"
            error={storeErrors.addressLine1}
            label="Address line 1"
            onChangeText={(value) => onStoreFieldChange("addressLine1", value)}
            placeholder="Street, building, or unit"
            value={storeForm.addressLine1 ?? ""}
          />
          <TextField
            accessibilityLabel="Address line 2"
            error={storeErrors.addressLine2}
            label="Address line 2"
            onChangeText={(value) => onStoreFieldChange("addressLine2", value)}
            optional
            placeholder="Additional address details"
            value={storeForm.addressLine2 ?? ""}
          />
          <ColumnGroup>
            <Column>
              <TextField
                accessibilityLabel="Barangay"
                error={storeErrors.barangay}
                label="Barangay"
                onChangeText={(value) => onStoreFieldChange("barangay", value)}
                placeholder="Barangay"
                value={storeForm.barangay ?? ""}
              />
            </Column>
            <Column>
              <TextField
                accessibilityLabel="City"
                error={storeErrors.city}
                label="City"
                onChangeText={(value) => onStoreFieldChange("city", value)}
                placeholder="City"
                value={storeForm.city ?? ""}
              />
            </Column>
          </ColumnGroup>
          <ColumnGroup>
            <Column>
              <TextField
                accessibilityLabel="Province or state"
                error={storeErrors.provinceState}
                label="Province / state"
                onChangeText={(value) => onStoreFieldChange("provinceState", value)}
                placeholder="Province / state"
                value={storeForm.provinceState ?? ""}
              />
            </Column>
            <Column>
              <TextField
                accessibilityLabel="Postal code"
                error={storeErrors.postalCode}
                keyboardType="numbers-and-punctuation"
                label="Postal code"
                onChangeText={(value) => onStoreFieldChange("postalCode", value)}
                placeholder="Postal code"
                value={storeForm.postalCode ?? ""}
              />
            </Column>
          </ColumnGroup>
          <CountryCodeDropdown
            error={storeErrors.countryCode}
            onChange={(value) => onStoreFieldChange("countryCode", value)}
            value={storeForm.countryCode}
          />
          <Button title="Remove Location" size="sm" variant="ghost" onPress={removeLocation} style={styles.locationRemove} />
        </>
      ) : (
        <Pressable
          accessibilityHint="Show optional address fields"
          accessibilityLabel="Add Location"
          accessibilityRole="button"
          onPress={() => setExpanded(true)}
          style={({ pressed }) => [styles.locationCollapsed, pressed && styles.choicePressed]}
        >
          <View style={styles.locationAddIcon}>
            <Plus color={colors.primary[700]} size={18} strokeWidth={2.2} />
          </View>
          <View style={styles.locationCopy}>
            <Text style={styles.locationAddTitle}>Add Location</Text>
            <Text style={styles.locationDescription}>Add an address if you want it shown on reports or receipts.</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}
