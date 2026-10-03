import { CircleAlert, CircleCheck, Package, Palette, Ruler } from "lucide-react-native";
import { ActivityIndicator, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { productUnitOptions } from "@/data/catalog.data";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";

import type { SettingsController } from "./settings.controller";
import { Field, RadioRow, SettingsGroup, SettingsRow } from "./settings.components";
import { themeLabels } from "./settings.utils";
import { createSettingsStyles } from "./settings.styles";

type Props = { settings: SettingsController };

export function StockPreferencesContent() {
  const styles = useThemeStyles(createSettingsStyles);

  return (
    <>
      <SettingsGroup label="Stock Rules">
        <SettingsRow
          icon={CircleAlert}
          title="Critical Stock"
          value="Zero quantity"
        />
        <SettingsRow
          icon={Package}
          title="Low Stock"
          value="At or below reorder level"
        />
        <SettingsRow icon={CircleCheck} title="Zero Stock" value="Allowed" />
        <SettingsRow
          icon={CircleAlert}
          title="Negative Stock"
          value="Never allowed"
        />
      </SettingsGroup>
      <View style={styles.infoNote}>
        <Text style={styles.infoText}>
          Stock quantities cannot be reduced below zero. Reorder defaults apply
          only to new products.
        </Text>
      </View>
    </>
  )
}

export function ReorderContent({ settings }: Props) {
  const styles = useThemeStyles(createSettingsStyles);
  const { reorderDraft, setReorderDraft, setReorderError, reorderError, saving, saveReorderLevel } = settings;

  return (
    <View style={styles.form}>
      <Text style={styles.infoText}>
        Uses each product's unit as the initial reorder level for new products.
        Each product can be changed individually later. Existing products won't
        be changed.
      </Text>
      <Field
        label="Default Reorder Level"
        value={reorderDraft}
        onChangeText={(value) => {
          setReorderDraft(value);
          setReorderError("");
        }}
        keyboardType="number-pad"
        error={reorderError}
      />
      <Button
        title="Save Changes"
        loading={saving}
        onPress={() => void saveReorderLevel()}
      />
    </View>
  )
}

export function UnitContent({ settings }: Props) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createSettingsStyles);
  const { productDefaults, saving, formError, saveDefaultUnit } = settings;
  const unitOptions =
      productDefaults.defaultUnit &&
      !productUnitOptions.some(
        (option) => option.value === productDefaults.defaultUnit,
      )
        ? [
            ...productUnitOptions,
            {
              value: productDefaults.defaultUnit,
              label: productDefaults.defaultUnit,
            },
          ]
        : productUnitOptions;

  return (
    <>
      <Text style={styles.infoText}>
        Used as the initial unit for new products. Each product can be changed
        individually later.
      </Text>
      <SettingsGroup label="Unit">
        {unitOptions.map((option) => (
          <RadioRow
            key={option.value}
            label={option.label}
            selected={productDefaults.defaultUnit === option.value}
            onPress={() => void saveDefaultUnit(option.value)}
          />
        ))}
      </SettingsGroup>
      {saving ? (
        <View style={styles.busyRow}>
          <ActivityIndicator color={colors.primary[600]} />
          <Text style={styles.busyText}>Saving default unit…</Text>
        </View>
      ) : null}
      {formError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {formError}
        </Text>
      ) : null}
    </>
  )
}

export function AppearanceContent({ settings }: Props) {
  const { preference, saveTheme, formError } = settings;
  const styles = useThemeStyles(createSettingsStyles);

  return (
    <>
      <SettingsGroup label="StockPilot 2.0">
        <SettingsRow
          icon={Palette}
          title="Mocha + Latte + Oat"
          description="A warm, focused visual system for daily stock work."
        />
      </SettingsGroup>
      <SettingsGroup label="Color Mode">
        <RadioRow
          label="Light"
          selected={preference === "light"}
          onPress={() => void saveTheme("light")}
        />
        <RadioRow
          label="Dark"
          selected={preference === "dark"}
          onPress={() => void saveTheme("dark")}
        />
        <RadioRow
          label="System"
          description="Follows your device appearance"
          selected={preference === "system"}
          onPress={() => void saveTheme("system")}
        />
      </SettingsGroup>
      {formError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {formError}
        </Text>
      ) : null}
    </>
  )
}
