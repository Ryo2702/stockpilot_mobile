import { Check, ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { control, radii, spacing, typography, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";
import type { CatalogCategory } from "@/domain/catalog";

import type { CatalogCategoryOption } from "../data/catalog.data";

type CategorySelectorProps = {
  categories: CatalogCategoryOption[];
  value: CatalogCategory;
  onChange: (category: CatalogCategory) => void;
};

export default function CategorySelector({ categories, value, onChange }: CategorySelectorProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const [open, setOpen] = useState(false);
  const selected = categories.find((category) => category.value === value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Category, ${selected?.label ?? "select category"}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.selector, pressed && styles.pressed]}
      >
        <Text style={[styles.selectorText, !selected && styles.placeholder]}>
          {selected?.label ?? "Select category"}
        </Text>
        <ChevronDown color={colors.text.secondary} size={18} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <SafeAreaView style={styles.sheet} edges={["bottom"]}>
            <Text style={styles.title}>Select category</Text>
            <ScrollView style={styles.options} showsVerticalScrollIndicator={false}>
              {categories.map(({ value: category, label, icon: Icon }) => {
                const isSelected = category === value;
                return (
                  <Pressable
                    key={category}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      onChange(category);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [styles.option, pressed && styles.pressed]}
                  >
                    <Icon color={isSelected ? colors.primary[600] : colors.text.secondary} size={19} />
                    <Text style={[styles.optionLabel, isSelected && styles.selectedLabel]}>{label}</Text>
                    {isSelected ? <Check color={colors.primary[600]} size={18} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable accessibilityRole="button" onPress={() => setOpen(false)} style={styles.close}>
              <Text style={styles.closeText}>Cancel</Text>
            </Pressable>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  selector: {
    minHeight: control.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
  },
  selectorText: {
    ...typography.bodySmall,
    color: colors.text.primary,
  },
  placeholder: {
    color: colors.text.muted,
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.32)",
  },
  sheet: {
    maxHeight: "75%",
    gap: spacing[2],
    padding: spacing[4],
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    backgroundColor: colors.background.surface,
  },
  options: {
    flexShrink: 1,
  },
  title: {
    ...typography.h3,
    paddingBottom: spacing[2],
    color: colors.text.primary,
  },
  option: {
    minHeight: control.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[2],
  },
  optionLabel: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.text.primary,
  },
  selectedLabel: {
    color: colors.primary[700],
    fontWeight: "600",
  },
  close: {
    minHeight: control.md,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  closeText: {
    ...typography.label,
    color: colors.text.secondary,
  },
  pressed: {
    opacity: 0.7,
  },
});
