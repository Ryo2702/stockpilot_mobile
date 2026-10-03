import { useEffect, useState } from "react";
import type { SQLiteDatabase } from "expo-sqlite";
import { InventoryError } from "@/domain/inventory.errors";
import type { PosCartItem, PosProduct, PosTransaction } from "@/domain/pos";
import { PosError } from "@/domain/pos.errors";
import type { OwnerStore } from "@/services/owner-store.service";
import { checkoutPosTransaction } from "@/services/pos.service";

export default function usePosCart({ db, ownerStore, onError, onComplete }: { db: SQLiteDatabase; ownerStore: OwnerStore; onError: (message: string) => void; onComplete: (receipt: PosTransaction) => void }) {
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  useEffect(() => setCart([]), [ownerStore.businessId, ownerStore.storeId]);

  const addProduct = (product: PosProduct, requestedQuantity = 1) => {
    onError("");
    const unitPrice = product.currentPrice;
    if (unitPrice === null) return onError("Set a selling price before adding this product.");
    if (product.quantity <= 0) return onError("This product is out of stock.");
    if (!Number.isSafeInteger(requestedQuantity) || requestedQuantity <= 0) return onError("Enter a whole quantity greater than zero.");
    const existing = cart.find((item) => item.id === product.id);
    const quantity = (existing?.quantity ?? 0) + requestedQuantity;
    if (quantity > product.quantity) return onError(`Only ${product.quantity} units are available.`);
    setCart((items) => existing ? items.map((item) => item.id === product.id ? { ...item, availableQuantity: product.quantity, quantity, lineTotal: unitPrice * quantity } : item) : [...items, { ...product, availableQuantity: product.quantity, quantity: requestedQuantity, lineTotal: unitPrice * requestedQuantity }]);
  };

  const changeQuantity = (productId: string, delta: number) => {
    const item = cart.find(({ id }) => id === productId);
    if (!item) return;
    if (delta > 0 && item.quantity >= item.availableQuantity) return onError(`Only ${item.availableQuantity} units are available.`);
    onError("");
    setCart((items) => items.flatMap((current) => { if (current.id !== productId) return [current]; const quantity = current.quantity + delta; return quantity > 0 ? [{ ...current, quantity, lineTotal: (current.currentPrice ?? 0) * quantity }] : []; }));
  };

  const checkout = async () => {
    onError(""); setCheckoutLoading(true);
    try { const completed = await checkoutPosTransaction(db, ownerStore, cart.map(({ id, quantity }) => ({ productId: id, quantity }))); setCart([]); onComplete(completed); }
    catch (error) { onError(error instanceof InventoryError || error instanceof PosError ? error.message : "Checkout failed. Nothing was saved."); }
    finally { setCheckoutLoading(false); }
  };

  return { cart, totalItems: cart.reduce((total, item) => total + item.quantity, 0), subtotal: cart.reduce((total, item) => total + item.lineTotal, 0), checkoutLoading, addProduct, changeQuantity, removeProduct: (id: string) => setCart((items) => items.filter((item) => item.id !== id)), checkout };
}
