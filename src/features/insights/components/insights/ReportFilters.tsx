import { Pressable, ScrollView, Text, View } from "react-native";

import { SearchField } from "@/components/ui/SearchField";
import { catalogCategoryOptions } from "@/data/catalog.data";
import type { OwnerStore } from "@/services/owner-store.service";
import type { InsightFilters } from "@/services/insights";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";

import { createInsightsStyles } from "./insights.styles";

type Props = {
  ownerStore: OwnerStore;
  ownerStores: OwnerStore[];
  filters: InsightFilters;
  onChange: (next: Partial<InsightFilters>) => void;
};

export function ReportFilters({ ownerStore, ownerStores, filters, onChange }: Props) {
  const styles = useThemeStyles(createInsightsStyles);
  const storeOptions = [{ storeId: "all", storeName: "All stores" }, ...ownerStores];
  return <View style={styles.filterGroup}>
    <Text style={styles.sectionTitle}>Report filters</Text>
    <Text style={styles.sectionSubtitle}>Choose the store scope, category, or product before generating a report.</Text>
    <SearchField accessibilityLabel="Filter product" onChangeText={(productQuery) => onChange({ productQuery })} onClear={() => onChange({ productQuery: "" })} placeholder="Filter product, SKU, or barcode" returnKeyType="search" value={filters.productQuery} />
    <Text style={styles.filterLabel}>Store scope</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>{storeOptions.map((store) => <FilterChip key={store.storeId} label={store.storeName} selected={filters.storeId === store.storeId || (store.storeId === "all" && filters.storeId === "all")} onPress={() => onChange({ storeId: store.storeId })} styles={styles} />)}</ScrollView>
    <Text style={styles.filterLabel}>Category</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}><FilterChip label="All categories" selected={!filters.category} onPress={() => onChange({ category: null })} styles={styles} />{catalogCategoryOptions.map((category) => <FilterChip key={category.value} label={category.label} selected={filters.category === category.value} onPress={() => onChange({ category: category.value })} styles={styles} />)}</ScrollView>
    <Text style={styles.caption}>Date range: use the Reporting period control above. Current store: {ownerStore.storeName}.</Text>
  </View>;
}

function FilterChip({ label, selected, onPress, styles }: { label: string; selected: boolean; onPress: () => void; styles: ReturnType<typeof createInsightsStyles> }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={[styles.filterChip, selected && { backgroundColor: colors.primary[50], borderColor: colors.primary[500] }]}><Text style={[styles.filterChipText, selected && { color: colors.primary[700], fontWeight: "600" }]}>{label}</Text></Pressable>;
}
