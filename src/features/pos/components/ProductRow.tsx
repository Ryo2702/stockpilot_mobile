import { useState } from "react";
import { Modal, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { formatCurrency, type CurrencySettings } from "@/domain/currency";
import { getProductStockStatus } from "@/domain/product";
import type { PosProduct } from "@/domain/pos";
import { useThemeStyles } from "@/theme/ThemeProvider";
import { createPosStyles } from "../pos.styles";

export function ProductRow({ product, currency, onAdd }: { product: PosProduct; currency: CurrencySettings; onAdd: (quantity: number) => void }) {
  const styles = useThemeStyles(createPosStyles);
  const [quantityOpen, setQuantityOpen] = useState(false);
  const [quantityInput, setQuantityInput] = useState("1");
  const [quantityError, setQuantityError] = useState("");
  const status = getProductStockStatus(product.quantity, product.reorderLevel);
  const canAdd = product.quantity > 0 && product.currentPrice !== null;
  const availability = product.quantity <= 0 ? "Out of stock" : product.quantity <= product.reorderLevel ? `Only ${product.quantity} left` : `${product.quantity} available`;
  const identifiers = [product.sku ? `SKU: ${product.sku}` : null, product.barcode ? `Barcode: ${product.barcode}` : null].filter(Boolean).join(" · ");
  const closeQuantityPicker = () => {
    setQuantityOpen(false);
    setQuantityError("");
  };
  const confirmQuantity = () => {
    const quantity = Number(quantityInput);
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      setQuantityError("Enter a whole quantity greater than zero.");
      return;
    }
    if (quantity > product.quantity) {
      setQuantityError(`Only ${product.quantity} ${product.unit} available.`);
      return;
    }
    onAdd(quantity);
    closeQuantityPicker();
  };
  return <><View style={styles.productRow}><View style={styles.productCopy}><Text style={styles.productName}>{product.name}</Text><View style={styles.productMetaRow}><Text style={styles.productAvailability}>{availability}</Text><StatusBadge status={status} label={product.quantity <= 0 ? "Out of stock" : undefined} /></View>{identifiers ? <Text style={styles.productIdentifier}>{identifiers}</Text> : null}{product.currentPrice === null ? <Text style={styles.productAvailability}>Selling price not set</Text> : null}</View><View style={styles.productAction}><Text style={styles.productPrice}>{product.currentPrice === null ? "—" : formatCurrency(product.currentPrice, currency)}</Text><Button title="Add" size="sm" disabled={!canAdd} onPress={() => { setQuantityInput("1"); setQuantityError(""); setQuantityOpen(true); }} style={styles.addButton} /></View></View><Modal transparent visible={quantityOpen} animationType="fade" onRequestClose={closeQuantityPicker}><View style={styles.quantityOverlay}><Card style={styles.quantityDialog}><Text style={styles.quantityTitle}>Add to sale</Text><Text style={styles.quantityProductName}>{product.name}</Text><TextField accessibilityLabel={`Quantity for ${product.name}`} autoFocus keyboardType="number-pad" label="Quantity" onChangeText={(value) => { setQuantityInput(value.replace(/\D/g, "")); setQuantityError(""); }} onSubmitEditing={confirmQuantity} returnKeyType="done" value={quantityInput} error={quantityError} helperText={!quantityError ? `${product.quantity} ${product.unit} available` : undefined} size="short" /><View style={styles.quantityActions}><Button title="Cancel" variant="secondary" onPress={closeQuantityPicker} style={styles.quantityAction} /><Button title="Add to sale" onPress={confirmQuantity} style={styles.quantityAction} /></View></Card></View></Modal></>;
}
