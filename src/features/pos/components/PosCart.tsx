import { ReceiptText, ShoppingBasket } from "lucide-react-native";
import { useState } from "react";
import { Modal, Text, View } from "react-native";
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
  const [checkoutConfirmOpen, setCheckoutConfirmOpen] = useState(false);
  const closeCheckoutConfirm = () => {
    if (!checkoutLoading) setCheckoutConfirmOpen(false);
  };
  const confirmCheckout = () => {
    setCheckoutConfirmOpen(false);
    onCheckout();
  };

  return <><Card style={styles.cart}><View style={styles.cartHeader}><View style={styles.cartTitleRow}><View style={styles.cartIcon}><ShoppingBasket color={colors.primary[700]} size={18} strokeWidth={2} /></View><Text style={styles.sectionTitle}>Cart ({totalItems})</Text></View><ReceiptText color={colors.text.muted} size={19} strokeWidth={2} /></View>{cart.length ? <View style={styles.cartItems}>{cart.map((item) => <CartLine key={item.id} item={item} currency={currency} onChangeQuantity={onChangeQuantity} onRemove={() => onRemove(item.id)} />)}</View> : <View style={styles.emptyCart}><Text style={styles.emptyCartTitle}>No items in this sale</Text><Text style={styles.emptyCartCopy}>Scan a barcode or search for a product to begin.</Text></View>}<View style={styles.totals}><View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalValue}>{formatCurrency(subtotal, currency)}</Text></View><View style={styles.totalRow}><Text style={styles.totalTitle}>Total</Text><Text style={styles.totalTitleValue}>{formatCurrency(subtotal, currency)}</Text></View></View><Button title={`Checkout ${formatCurrency(subtotal, currency)}`} icon={ReceiptText} size="lg" disabled={!cart.length} loading={checkoutLoading} onPress={() => setCheckoutConfirmOpen(true)} style={styles.checkoutButton} /></Card><Modal transparent visible={checkoutConfirmOpen} animationType="fade" onRequestClose={closeCheckoutConfirm}><View style={styles.checkoutOverlay}><Card style={styles.checkoutDialog}><Text style={styles.checkoutDialogTitle}>Complete checkout?</Text><Text style={styles.checkoutDialogCopy}>Complete this sale for {totalItems} item{totalItems === 1 ? "" : "s"} totaling {formatCurrency(subtotal, currency)}?</Text><View style={styles.checkoutDialogActions}><Button title="No" variant="secondary" disabled={checkoutLoading} onPress={closeCheckoutConfirm} style={styles.checkoutDialogAction} /><Button title="Yes, checkout" disabled={checkoutLoading} onPress={confirmCheckout} style={styles.checkoutDialogAction} /></View></Card></View></Modal></>;
}
