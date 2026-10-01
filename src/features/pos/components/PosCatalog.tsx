import { Package, ScanLine, Search } from "lucide-react-native";
import { ActivityIndicator, ScrollView, Text, TextInput, View } from "react-native";
import { catalogCategoryOptions } from "@/data/catalog.data";
import type { CatalogCategory } from "@/domain/catalog";
import type { CurrencySettings } from "@/domain/currency";
import type { PosProduct } from "@/domain/pos";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";
import { CategoryChip } from "./CategoryChip";
import { ProductRow } from "./ProductRow";
import { createPosStyles } from "../pos.styles";

export function PosCatalog({ products, currency, search, onSearch, category, onCategory, loading, error, onScan, onClearSearch, onAdd }: { products: PosProduct[]; currency: CurrencySettings; search: string; onSearch: (value: string) => void; category: CatalogCategory | null; onCategory: (value: CatalogCategory | null) => void; loading: boolean; error: string; onScan: () => void; onClearSearch: () => void; onAdd: (product: PosProduct) => void }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createPosStyles);
  return <><View style={styles.searchRow}><Search color={colors.primary[700]} size={20} strokeWidth={2} /><TextInput accessibilityLabel="Search POS products" value={search} onChangeText={onSearch} placeholder="Search product, SKU, or barcode" placeholderTextColor={colors.text.muted} style={styles.searchInput} returnKeyType="search" /><IconButton icon={ScanLine} label="Scan product barcode" onPress={onScan} style={styles.scanButton} /></View><ScrollView horizontal contentContainerStyle={styles.categoryList} showsHorizontalScrollIndicator={false}><CategoryChip label="All" selected={!category} onPress={() => onCategory(null)} />{catalogCategoryOptions.map((option) => <CategoryChip key={option.value} label={option.label} selected={category === option.value} onPress={() => onCategory(option.value)} />)}</ScrollView>{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}<View style={styles.productsSection}><View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Products</Text><Text style={styles.sectionMeta}>{loading ? "Loading…" : `${products.length} items`}</Text></View>{loading ? <ActivityIndicator color={colors.primary[600]} /> : products.length ? <View style={styles.productList}>{products.map((product) => <ProductRow key={product.id} product={product} currency={currency} onAdd={() => onAdd(product)} />)}</View> : <Card style={styles.emptyCard}><Package color={colors.text.muted} size={24} /><Text style={styles.emptyTitle}>{search ? "No matching products" : "No products yet"}</Text><Text style={styles.emptyCopy}>{search ? "Check the product name, SKU, or barcode and try again." : "Add products to the selected store before opening a sale."}</Text>{search ? <Button title="Clear Search" variant="secondary" onPress={onClearSearch} /> : null}</Card>}</View></>;
}
