import {
  Check,
  CircleAlert,
  CircleCheck,
  Database,
  Download,
  FileText,
  HardDrive,
  Info,
  MapPin,
  Package,
  Palette,
  ReceiptText,
  Ruler,
  ShieldCheck,
  SlidersHorizontal,
  Store,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react-native";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import {
  countryCodeOptions,
  currencyModeOptions,
  decimalPlaceOptions,
  storeTypeOptions,
} from "@/components/store/store.data";
import StoreSelector from "@/components/store/StoreSelector";
import { Button } from "@/components/ui/Button";
import { legalPages } from "@/data/legal.data";
import { spacing } from "@/theme";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";

import type { SettingsController, SettingsScreenProps } from "./settings.controller";
import { Field, RadioRow, SettingsGroup, SettingsRow } from "./settings.components";
import {
  currencyOptionLabel,
  formatBytes,
  getCurrencyLabel,
  getStoreTypeLabel,
  getUnitLabel,
  themeLabels,
  version,
} from "./settings.utils";
import { createSettingsStyles } from "./settings.styles";

type SettingsProps = { settings: SettingsController };
type StoreProps = SettingsProps & Pick<SettingsScreenProps, "ownerStore">;

export function SettingsHomeContent({
  ownerStore,
  onOpenStoreManagement,
  onOpenInventoryAction,
  settings,
}: StoreProps & Pick<SettingsScreenProps, "onOpenStoreManagement" | "onOpenInventoryAction">) {
  const styles = useThemeStyles(createSettingsStyles);
  const {
    productDefaults,
    preference,
    securityPin,
    storage,
    setPage,
    setSecurityError,
    setDeleteStoreError,
    setDeleteStoreDialogVisible,
  } = settings;

  return (
    <>
      <SettingsGroup label="Personal">
        <SettingsRow
          icon={UserRound}
          title="Your Name"
          value={ownerStore.ownerName}
          onPress={() => setPage("owner-name")}
        />
      </SettingsGroup>
      <SettingsGroup label="Store">
        <SettingsRow
          icon={Store}
          title="Manage Stores"
          description="Add, edit, archive, or switch stores"
          onPress={onOpenStoreManagement}
        />
        <SettingsRow
          icon={Store}
          title="Current Store"
          value={ownerStore.storeName}
          onPress={() => setPage("current-store")}
        />
        <SettingsRow
          icon={SlidersHorizontal}
          title="Edit Store"
          description="Edit name, type, currency and address"
          onPress={() => setPage("store-preferences")}
        />
        <SettingsRow
          icon={Trash2}
          title="Delete Store"
          description="Permanently delete this store and its inventory"
          destructive
          onPress={() => {
            setDeleteStoreError("");
            setDeleteStoreDialogVisible(true);
          }}
        />
      </SettingsGroup>
      <SettingsGroup label="Inventory">
        <SettingsRow
          icon={Package}
          title="Stock Preferences"
          description="Stock rules and defaults"
          onPress={() => setPage("stock-preferences")}
        />
        <SettingsRow
          icon={CircleAlert}
          title="Default Reorder Settings"
          value={productDefaults.defaultReorderLevel + " units"}
          onPress={() => setPage("reorder")}
        />
        <SettingsRow
          icon={Ruler}
          title="Default Unit"
          value={getUnitLabel(productDefaults.defaultUnit)}
          onPress={() => setPage("unit")}
        />
      </SettingsGroup>
      <SettingsGroup label="Appearance">
        <SettingsRow
          icon={Palette}
          title="StockPilot 2.0 Theme"
          value={themeLabels[preference]}
          onPress={() => setPage("appearance")}
        />
      </SettingsGroup>
      <SettingsGroup label="Security">
        <SettingsRow
          icon={ShieldCheck}
          title="Security"
          value={
            securityPin === undefined
              ? "Loading…"
              : securityPin
                ? "PIN enabled"
                : "Set up PIN"
          }
          onPress={() => {
            setSecurityError("");
            setPage("security");
          }}
        />
      </SettingsGroup>
      <SettingsGroup label="Legal & Help">
        <SettingsRow
          icon={FileText}
          title={legalPages.terms.title}
          onPress={() => setPage("terms")}
        />
        <SettingsRow
          icon={ShieldCheck}
          title={legalPages.privacy.title}
          onPress={() => setPage("privacy")}
        />
        <SettingsRow
          icon={Info}
          title={legalPages.faq.title}
          onPress={() => setPage("faq")}
        />
        <SettingsRow
          icon={CircleAlert}
          title={legalPages.rules.title}
          onPress={() => setPage("rules")}
        />
      </SettingsGroup>
      <SettingsGroup label="Data & Storage">
        <SettingsRow
          icon={Database}
          title="Backup & Restore"
          description="Manage local backup files"
          onPress={() => setPage("backup")}
        />
        <SettingsRow
          icon={Upload}
          title="Import Inventory"
          description="Import inventory from CSV"
          onPress={() => onOpenInventoryAction("import")}
        />
        <SettingsRow
          icon={Download}
          title="Export Inventory"
          description="Export store data as CSV"
          onPress={() => onOpenInventoryAction("export")}
        />
        <SettingsRow
          icon={HardDrive}
          title="Storage Usage"
          value={storage ? formatBytes(storage.totalBytes) : "Loading…"}
          onPress={() => setPage("storage")}
        />
      </SettingsGroup>
      <View style={styles.infoNote}>
        <Text style={styles.infoText}>
          Your StockPilot inventory is stored locally on this device.
        </Text>
      </View>
      <SettingsGroup label="Access">
        <SettingsRow
          icon={CircleCheck}
          title="Free Access"
          description="All current features included · no purchase required"
          badge="Free"
          onPress={() => setPage("free-access")}
        />
      </SettingsGroup>
      <SettingsGroup label="Application">
        <SettingsRow
          icon={Info}
          title="About StockPilot"
          onPress={() => setPage("about")}
        />
        <SettingsRow icon={FileText} title="App Version" value={version} />
      </SettingsGroup>
    </>
  )
}

export function OwnerNameContent({ settings }: SettingsProps) {
  const styles = useThemeStyles(createSettingsStyles);
  const {
    ownerName,
    setOwnerName,
    ownerNameError,
    setOwnerNameError,
    saving,
    saveOwnerName,
  } = settings;

  return (
    <View style={styles.form}>
      <Text style={styles.infoText}>
        This name is used to personalize StockPilot on this device.
      </Text>
      <Field
        label="Your Name"
        value={ownerName}
        onChangeText={(value) => {
          setOwnerName(value);
          setOwnerNameError("");
        }}
        autoCapitalize="words"
        error={ownerNameError}
      />
      <Button
        title="Save Changes"
        loading={saving}
        onPress={() => void saveOwnerName()}
      />
    </View>
  )
}

export function StorePreferencesContent({ settings }: SettingsProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createSettingsStyles);
  const { storeDetailsLoading, storeDetails, storeForm, setPage } = settings;

  return storeDetailsLoading ? (
    <View style={styles.busyRow}>
      <ActivityIndicator color={colors.primary[600]} />
      <Text style={styles.busyText}>Loading store preferences…</Text>
    </View>
  ) : !storeDetails ? (
    <View style={styles.infoNote}>
      <Text style={styles.infoText}>
        Store preferences couldn't be loaded. Open Store Management and try
        again.
      </Text>
    </View>
  ) : (
    <>
      <Text style={styles.infoText}>{storeDetails.name}</Text>
      <SettingsGroup label="Store Details">
        <SettingsRow
          icon={Store}
          title="Store Name"
          value={storeDetails.name}
          onPress={() => setPage("store-name")}
        />
        <SettingsRow
          icon={Store}
          title="Store Type"
          value={getStoreTypeLabel(storeDetails.storeType)}
          onPress={() => setPage("store-type")}
        />
        <SettingsRow
          icon={ReceiptText}
          title="Currency"
          value={getCurrencyLabel(storeForm)}
          onPress={() => setPage("currency")}
        />
        <SettingsRow
          icon={MapPin}
          title="Address"
          value={storeDetails.city || storeDetails.addressLine1 || "Optional"}
          onPress={() => setPage("store-address")}
        />
      </SettingsGroup>
    </>
  )
}

export function StoreNameContent({ settings }: SettingsProps) {
  const styles = useThemeStyles(createSettingsStyles);
  const { storeForm, storeErrors, formError, saving, updateStoreField, saveStoreForm } = settings;

  return (
    <View style={styles.form}>
      <Text style={styles.infoText}>
        Update the name used for this store throughout StockPilot.
      </Text>
      <Field
        label="Store Name"
        value={storeForm.name ?? ""}
        onChangeText={(value) => updateStoreField("name", value)}
        placeholder="e.g. Main Store"
        autoCapitalize="words"
        error={storeErrors.name}
      />
      {formError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {formError}
        </Text>
      ) : null}
      <Button
        title="Save Changes"
        loading={saving}
        onPress={() => void saveStoreForm()}
      />
    </View>
  )
}

export function StoreTypeContent({ settings }: SettingsProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createSettingsStyles);
  const { storeForm, storeErrors, formError, saving, updateStoreField, saveStoreForm } = settings;

  return (
    <View style={styles.form}>
      <Text style={styles.infoText}>
        Choose a store type already supported by StockPilot.
      </Text>
      <SettingsGroup label="Store Type">
        {storeTypeOptions.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{
              selected: storeForm.storeType === option.value,
            }}
            onPress={() => updateStoreField("storeType", option.value)}
            style={({ pressed }) => [
              styles.radioRow,
              pressed && styles.rowPressed,
            ]}
          >
            <Store color={colors.text.muted} size={20} strokeWidth={1.8} />
            <Text style={styles.radioLabel}>{option.label}</Text>
            <View
              style={[
                styles.radio,
                storeForm.storeType === option.value && styles.radioSelected,
              ]}
            >
              {storeForm.storeType === option.value ? (
                <Check
                  color={colors.text.onPrimary}
                  size={14}
                  strokeWidth={2.5}
                />
              ) : null}
            </View>
          </Pressable>
        ))}
      </SettingsGroup>
      {storeForm.storeType === "other" ? (
        <Field
          label="Describe your store type"
          value={storeForm.customStoreType ?? ""}
          onChangeText={(value) => updateStoreField("customStoreType", value)}
          error={storeErrors.customStoreType}
        />
      ) : null}
      {formError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {formError}
        </Text>
      ) : null}
      <Button
        title="Save Changes"
        loading={saving}
        onPress={() => void saveStoreForm()}
      />
    </View>
  )
}

export function CurrencyContent({ settings }: SettingsProps) {
  const styles = useThemeStyles(createSettingsStyles);
  const { storeForm, storeErrors, formError, saving, updateStoreField, saveStoreForm, currencySearch, setCurrencySearch, currencyMatches } = settings;

  return (
    <View style={styles.form}>
      <SettingsGroup label="Currency Type">
        {currencyModeOptions.map((option) => (
          <RadioRow
            key={option.value}
            label={option.label}
            selected={(storeForm.currencyMode ?? "iso") === option.value}
            onPress={() => updateStoreField("currencyMode", option.value)}
          />
        ))}
      </SettingsGroup>
      {storeForm.currencyMode !== "custom" ? (
        <>
          <Field
            label="Search currencies"
            value={currencySearch}
            onChangeText={setCurrencySearch}
            placeholder="Search name, code or symbol"
            autoCapitalize="none"
          />
          <SettingsGroup label="Currency">
            <ScrollView
              style={{ maxHeight: 320 }}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {currencyMatches.map((option) => (
                <RadioRow
                  key={option.value}
                  label={currencyOptionLabel(option.value, option.label)}
                  selected={
                    (storeForm.currencyCode ?? "PHP").toUpperCase() ===
                    option.value
                  }
                  onPress={() => updateStoreField("currencyCode", option.value)}
                />
              ))}
              {!currencyMatches.length ? (
                <Text style={[styles.infoText, { padding: spacing[3] }]}>
                  No matching currencies.
                </Text>
              ) : null}
            </ScrollView>
          </SettingsGroup>
        </>
      ) : (
        <>
          <Field
            label="Currency Name"
            size="medium"
            value={storeForm.customCurrencyName ?? ""}
            onChangeText={(value) =>
              updateStoreField("customCurrencyName", value)
            }
            placeholder="e.g. Credits"
            autoCapitalize="words"
            error={storeErrors.customCurrencyName}
          />
          <Field
            label="Symbol"
            size="short"
            value={storeForm.customCurrencySymbol ?? ""}
            onChangeText={(value) =>
              updateStoreField("customCurrencySymbol", value)
            }
            placeholder="e.g. ¤"
            autoCapitalize="none"
            error={storeErrors.customCurrencySymbol}
          />
        </>
      )}
      <SettingsGroup label="Decimal Places">
        {decimalPlaceOptions.map((value) => (
          <RadioRow
            key={value}
            label={String(value)}
            selected={(storeForm.currencyDecimalPlaces ?? 2) === value}
            onPress={() => updateStoreField("currencyDecimalPlaces", value)}
          />
        ))}
      </SettingsGroup>
      {formError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {formError}
        </Text>
      ) : null}
      <Button
        title="Save Changes"
        loading={saving}
        onPress={() => void saveStoreForm()}
      />
    </View>
  )
}

export function AddressContent({ settings }: SettingsProps) {
  const styles = useThemeStyles(createSettingsStyles);
  const { storeForm, storeErrors, formError, saving, updateStoreField, saveStoreForm } = settings;

  return (
    <View style={styles.form}>
      <Text style={styles.infoText}>Address details are optional.</Text>
      <Field
        label="Address Line 1"
        value={storeForm.addressLine1 ?? ""}
        onChangeText={(value) => updateStoreField("addressLine1", value)}
        error={storeErrors.addressLine1}
      />
      <Field
        label="Address Line 2"
        value={storeForm.addressLine2 ?? ""}
        onChangeText={(value) => updateStoreField("addressLine2", value)}
        error={storeErrors.addressLine2}
      />
      <Field
        label="Barangay"
        value={storeForm.barangay ?? ""}
        onChangeText={(value) => updateStoreField("barangay", value)}
        error={storeErrors.barangay}
      />
      <Field
        label="City"
        value={storeForm.city ?? ""}
        onChangeText={(value) => updateStoreField("city", value)}
        error={storeErrors.city}
      />
      <Field
        label="Province / State"
        value={storeForm.provinceState ?? ""}
        onChangeText={(value) => updateStoreField("provinceState", value)}
        error={storeErrors.provinceState}
      />
      <Field
        label="Postal Code"
        size="short"
        value={storeForm.postalCode ?? ""}
        onChangeText={(value) => updateStoreField("postalCode", value)}
        error={storeErrors.postalCode}
      />
      <Field
        label="Country Code"
        value={storeForm.countryCode ?? ""}
        onChangeText={(value) => updateStoreField("countryCode", value)}
        placeholder="PH"
        autoCapitalize="characters"
        help={
          countryCodeOptions.find(
            (option) => option.value === storeForm.countryCode,
          )?.label
        }
        error={storeErrors.countryCode}
      />
      {formError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {formError}
        </Text>
      ) : null}
      <Button
        title="Save Changes"
        loading={saving}
        onPress={() => void saveStoreForm()}
      />
    </View>
  )
}

export function CurrentStoreContent({
  ownerStore,
  ownerStores,
  onSelectStore,
  onCreateStore,
}: Pick<SettingsScreenProps, "ownerStore" | "ownerStores" | "onSelectStore" | "onCreateStore">) {
  const styles = useThemeStyles(createSettingsStyles);

  return (
    <View style={styles.form}>
      <Text style={styles.infoText}>
        Choose which store StockPilot is showing.
      </Text>
      <StoreSelector
        ownerStore={ownerStore}
        ownerStores={ownerStores}
        onSelectStore={onSelectStore}
        onCreateStore={onCreateStore}
        showAddStoreButton
        openOnMount
      />
    </View>
  );
}
