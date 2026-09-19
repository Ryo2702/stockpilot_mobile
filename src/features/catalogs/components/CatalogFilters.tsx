import { ArrowDownAZ, ArrowUpAZ, ChevronDown, Search, Tag } from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { CatalogCategory } from "@/domain/catalog";
import type { ProductSort, ProductStockFilter } from "@/domain/product";
import { colors, control, radii, spacing, typography } from "@/theme";

import type { CatalogCategoryOption } from "../data/catalog.data";

const stockFilters: ProductStockFilter[] = ["all", "healthy", "low", "critical"];
const sortOptions: Array<{ value: ProductSort; label: string }> = [
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "stock_asc", label: "Stock: Low to High" },
  { value: "stock_desc", label: "Stock: High to Low" },
  { value: "updated_desc", label: "Recently Updated" },
];

type CatalogFiltersProps = {
  search: string;
  category: CatalogCategory | null;
  stockStatus: ProductStockFilter;
  sort: ProductSort;
  categories: CatalogCategoryOption[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: CatalogCategory | null) => void;
  onStockStatusChange: (value: ProductStockFilter) => void;
  onSortChange: (value: ProductSort) => void;
};

export default function CatalogFilters({
  search,
  category,
  stockStatus,
  sort,
  categories,
  onSearchChange,
  onCategoryChange,
  onStockStatusChange,
  onSortChange,
}: CatalogFiltersProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const sortLabel = sortOptions.find((option) => option.value === sort)?.label ?? "Name A–Z";
  const SortIcon = sort === "name_desc" ? ArrowUpAZ : ArrowDownAZ;

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search color={colors.text.muted} size={18} />
          <TextInput
            accessibilityLabel="Search catalog, SKU, barcode, or category"
            onChangeText={onSearchChange}
            placeholder="Search catalog, SKU, or barcode"
            placeholderTextColor={colors.text.muted}
            returnKeyType="search"
            style={styles.searchInput}
            value={search}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sort by ${sortLabel}`}
          accessibilityState={{ expanded: sortOpen }}
          onPress={() => setSortOpen(true)}
          style={({ pressed }) => [styles.sortButton, pressed && styles.pressed]}
        >
          <SortIcon color={colors.text.secondary} size={18} />
          <ChevronDown color={colors.text.secondary} size={15} />
        </Pressable>
      </View>
      <Text style={styles.sortLabel}>{sortLabel}</Text>

      <ScrollView contentContainerStyle={styles.categoryList} horizontal showsHorizontalScrollIndicator={false}>
        {stockFilters.map((filter) => (
          <CategoryChip
            key={filter}
            label={filter === "all" ? "All" : titleCase(filter)}
            selected={stockStatus === filter}
            onPress={() => onStockStatusChange(filter)}
          />
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.categoryList} horizontal showsHorizontalScrollIndicator={false}>
        <CategoryChip
          icon={Tag}
          label="All categories"
          selected={category === null}
          onPress={() => onCategoryChange(null)}
        />
        {categories.map(({ value, label, icon }) => (
          <CategoryChip
            key={value}
            icon={icon}
            label={label}
            selected={category === value}
            onPress={() => onCategoryChange(value)}
          />
        ))}
      </ScrollView>

      <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.sortSheet}>
            <Text style={styles.sortTitle}>Sort catalog</Text>
            {sortOptions.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: sort === option.value }}
                onPress={() => {
                  onSortChange(option.value);
                  setSortOpen(false);
                }}
                style={({ pressed }) => [styles.sortOption, pressed && styles.pressed]}
              >
                <Text style={[styles.sortOptionText, sort === option.value && styles.selectedText]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
            <Pressable accessibilityRole="button" onPress={() => setSortOpen(false)} style={styles.cancelSort}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function titleCase(value: string) {
  return `${value[0]?.toUpperCase() ?? ""}${value.slice(1)}`;
}

function CategoryChip({
  icon: Icon,
  label,
  selected,
  onPress,
}: {
  icon?: CatalogCategoryOption["icon"];
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selectedChip, pressed && styles.pressed]}
    >
      {Icon ? <Icon color={selected ? colors.primary[700] : colors.text.secondary} size={15} /> : null}
      <Text style={[styles.chipLabel, selected && styles.selectedChipLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing[2],
  },
  searchRow: {
    flexDirection: "row",
    gap: spacing[2],
  },
  searchBox: {
    minHeight: control.md,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
  },
  searchInput: {
    minWidth: 0,
    flex: 1,
    ...typography.bodySmall,
    color: colors.text.primary,
  },
  sortButton: {
    minWidth: control.md,
    height: control.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
  },
  sortLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  categoryList: {
    gap: spacing[2],
  },
  chip: {
    minHeight: control.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.full,
    backgroundColor: colors.background.surface,
  },
  selectedChip: {
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
  },
  chipLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  selectedChipLabel: {
    color: colors.primary[700],
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.32)",
  },
  sortSheet: {
    gap: spacing[2],
    padding: spacing[4],
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    backgroundColor: colors.background.surface,
  },
  sortTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  sortOption: {
    minHeight: control.md,
    justifyContent: "center",
    paddingHorizontal: spacing[2],
  },
  sortOptionText: {
    ...typography.bodySmall,
    color: colors.text.primary,
  },
  selectedText: {
    color: colors.primary[700],
    fontWeight: "600",
  },
  cancelSort: {
    minHeight: control.md,
    alignItems: "center",
    justifyContent: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  cancelText: {
    ...typography.label,
    color: colors.text.secondary,
  },
  pressed: {
    opacity: 0.7,
  },
});
