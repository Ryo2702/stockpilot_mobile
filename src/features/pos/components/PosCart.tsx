import { ReceiptText, ShoppingBasket } from "lucide-react-native";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCurrency, type CurrencySettings } from "@/domain/currency";
import type { PosCartItem } from "@/domain/pos";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";
import { CartLine } from "./CartLine";
import { createPosStyles } from "../pos.styles";

export function PosCart({ cart, currency, totalItems, subtotal, checkoutLoading, onChangeQuantity, onRemove, onCheckout }: { cart: PosCartItem[]; currency: CurrencySettings; totalItems: number; subtotal: number; checkoutLoading: boolean; onChangeQuantity: (id: string, delta: number) => void; onRemove: (id: string) => void; onCheckout: () => void }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createPosStyles);
  return <Card style={styles.cart}><View style={styles.cartHeader}><View style={styles.cartTitleRow}><View style={styles.cartIcon}><ShoppingBasket color={colors.primary[700]} size={18} strokeWidth={2} /></View><Text style={styles.sectionTitle}>Cart ({totalItems})</Text></View><ReceiptText color={colors.text.muted} size={19} strokeWidth={2} /></View>{cart.length ? <View style={styles.cartItems}>{cart.map((item) => <CartLine key={item.id} item={item} currency={currency} onChangeQuantity={onChangeQuantity} onRemove={() => onRemove(item.id)} />)}</View> : <View style={styles.emptyCart}><Text style={styles.emptyCartTitle}>No items in this sale</Text><Text style={styles.emptyCartCopy}>Scan a barcode or search for a product to begin.</Text></View>}<View style={styles.totals}><View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalValue}>{formatCurrency(subtotal, currency)}</Text></View><View style={styles.totalRow}><Text style={styles.totalTitle}>Total</Text><Text style={styles.totalTitle}>{formatCurrency(subtotal, currency)}</Text></View></View><Button title={`Checkout ${formatCurrency(subtotal, currency)}`} icon={ReceiptText} size="lg" disabled={!cart.length} loading={checkoutLoading} onPress={onCheckout} style={styles.checkoutButton} /></Card>;
}
