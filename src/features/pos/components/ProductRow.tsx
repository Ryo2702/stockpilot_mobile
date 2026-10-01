import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, type CurrencySettings } from "@/domain/currency";
import { getProductStockStatus } from "@/domain/product";
import type { PosProduct } from "@/domain/pos";
import { useThemeStyles } from "@/theme/ThemeProvider";
import { createPosStyles } from "../pos.styles";

export function ProductRow({ product, currency, onAdd }: { product: PosProduct; currency: CurrencySettings; onAdd: () => void }) {
  const styles = useThemeStyles(createPosStyles);
  const status = getProductStockStatus(product.quantity, product.reorderLevel);
  const canAdd = product.quantity > 0 && product.currentPrice !== null;
  const availability = product.quantity <= 0 ? "Out of stock" : product.quantity <= product.reorderLevel ? `Only ${product.quantity} left` : `${product.quantity} available`;
  const identifiers = [product.sku ? `SKU: ${product.sku}` : null, product.barcode ? `Barcode: ${product.barcode}` : null].filter(Boolean).join(" · ");
  return <View style={styles.productRow}><View style={styles.productCopy}><Text numberOfLines={1} style={styles.productName}>{product.name}</Text><View style={styles.productMetaRow}><Text style={styles.productAvailability}>{availability}</Text><StatusBadge status={status} label={product.quantity <= 0 ? "Out of stock" : undefined} /></View>{identifiers ? <Text numberOfLines={1} style={styles.productIdentifier}>{identifiers}</Text> : null}{product.currentPrice === null ? <Text style={styles.productAvailability}>Selling price not set</Text> : null}</View><View style={styles.productAction}><Text style={styles.productPrice}>{product.currentPrice === null ? "—" : formatCurrency(product.currentPrice, currency)}</Text><Button title="Add" size="sm" disabled={!canAdd} onPress={onAdd} style={styles.addButton} /></View></View>;
}
