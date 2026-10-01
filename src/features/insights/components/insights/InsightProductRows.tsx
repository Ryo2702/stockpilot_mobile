import { ArrowDownRight, ArrowUpRight, ChevronRight, Package } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { catalogCategoryOptions } from "@/data/catalog.data";
import type { InsightCategory, InsightProduct } from "@/services/insights";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";

import { HealthBadge } from "./InsightBasics";
import { createInsightsStyles } from "./insights.styles";
import { categoryName, formatQuantity, movementChange } from "./insights.utils";

export function ProductRow({ product, onPress, valueMode = "stock", comparisonLabel = "the previous period" }: { product: InsightProduct; onPress: (product: InsightProduct) => void; valueMode?: "stock" | "movement"; comparisonLabel?: string }) {
  const styles = useThemeStyles(createInsightsStyles); const { colors } = useTheme();
  return <Pressable accessibilityRole="button" onPress={() => onPress(product)} style={styles.productRow}><View style={styles.productCopy}><Text numberOfLines={1} style={styles.productName}>{product.name}</Text><Text numberOfLines={1} style={styles.productMeta}>{valueMode === "stock" ? `${categoryName(product.category)} · ` : "Stock Out · "}{product.sku ?? "No SKU"}</Text></View><View style={styles.productRight}><Text style={styles.productQuantity}>{valueMode === "stock" ? formatQuantity(product.quantity, product.unit) : formatQuantity(product.stockOut, product.unit)}</Text>{valueMode === "stock" ? <HealthBadge status={product.stockStatus} /> : <Text style={styles.productChange}>{movementChange(product.stockOut, product.previousStockOut, comparisonLabel)}</Text>}</View><ChevronRight size={18} color={colors.text.muted} /></Pressable>;
}

export function RankedProduct({ rank, product, comparisonLabel, onPress }: { rank: number; product: InsightProduct; comparisonLabel: string; onPress: (product: InsightProduct) => void }) {
  const styles = useThemeStyles(createInsightsStyles); const colors = useTheme().colors;
  const comparison = product.previousStockOut === 0 ? "No prior activity" : movementChange(product.stockOut, product.previousStockOut, comparisonLabel);
  const trendColor = product.stockOut > product.previousStockOut ? colors.semantic.danger : colors.semantic.success;
  const TrendIcon = product.stockOut > product.previousStockOut ? ArrowUpRight : ArrowDownRight;
  return <Pressable accessibilityRole="button" onPress={() => onPress(product)} style={styles.productRow}><Text style={styles.caption}>{rank}</Text><View style={styles.productCopy}><Text numberOfLines={1} style={styles.productName}>{product.name}</Text><Text style={styles.productMeta}>{categoryName(product.category)}</Text></View><View style={styles.productRight}><Text style={styles.productQuantity}>{formatQuantity(product.stockOut, product.unit)}</Text><View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>{product.previousStockOut > 0 ? <TrendIcon size={13} color={trendColor} /> : null}<Text style={[styles.productChange, product.previousStockOut > 0 && { color: trendColor }]}>{comparison}</Text></View></View><ChevronRight size={17} color={colors.text.muted} /></Pressable>;
}

export function CategoryRow({ category, onPress }: { category: InsightCategory; onPress: (category: InsightCategory) => void }) {
  const styles = useThemeStyles(createInsightsStyles); const colors = useTheme().colors;
  const option = catalogCategoryOptions.find((item) => item.value === category.category); const Icon = option?.icon ?? Package;
  return <Pressable accessibilityRole="button" onPress={() => onPress(category)} style={styles.categoryRow}><View style={styles.categoryIcon}><Icon size={18} color={colors.primary[600]} /></View><View style={styles.categoryCopy}><Text numberOfLines={1} style={styles.categoryName}>{option?.label ?? category.category}</Text><Text style={styles.categoryMeta}>{category.products} items · {category.stockOut} out</Text></View><Text style={styles.categoryValue}>{category.net > 0 ? "+" : ""}{category.net}</Text><ChevronRight size={17} color={colors.text.muted} /></Pressable>;
}
