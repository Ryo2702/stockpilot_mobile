import {
  CheckCircle2,
  ChevronLeft,
  Download,
  EllipsisVertical,
  History,
  Minus,
  Package,
  Plus,
  ReceiptText,
  ScanLine,
  Search,
  ShoppingBasket,
  Trash2,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";

import { catalogCategoryOptions } from "@/data/catalog.data";
import type { CatalogCategory } from "@/domain/catalog";
import { formatCurrency, type CurrencySettings } from "@/domain/currency";
import { InventoryError } from "@/domain/inventory.errors";
import { getProductStockStatus } from "@/domain/product";
import type { PosCartItem, PosProduct, PosTransaction, PosTransactionSummary } from "@/domain/pos";
import { PosError } from "@/domain/pos.errors";
import BarcodeScannerModal from "@/components/ui/BarcodeScannerModal";
import { BottomNavigation, type BottomNavKey } from "@/components/ui/BottomNavigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import StoreSelector from "@/components/store/StoreSelector";
import ThemeToggle from "@/components/ui/ThemeToggle";
import useAsyncEffect from "@/hooks/useAsyncEffect";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import type { OwnerStore } from "@/services/owner-store.service";
import { getOwnerStoreDetails } from "@/services/owner-store.service";
import { checkoutPosTransaction, findPosProductByCode, getPosTransaction, listPosProducts, listPosTransactions } from "@/services/pos.service";
import { createPosReceiptPdf } from "@/services/pos-receipt.service";
import { control, radii, spacing, typography, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";
import type { StoreInput } from "@/validation/store.validation";

type PosScreenProps = {
  ownerStore: OwnerStore;
  ownerStores: OwnerStore[];
  onSelectStore: (store: OwnerStore) => Promise<void>;
  onCreateStore: (store: StoreInput) => Promise<OwnerStore>;
  onNavigate: (key: BottomNavKey) => void;
};

const defaultCurrency: CurrencySettings = {
  currencyMode: "iso",
  currencyCode: "PHP",
  currencyDecimalPlaces: 2,
};

export default function PosScreen({
  ownerStore,
  ownerStores,
  onSelectStore,
  onCreateStore,
  onNavigate,
}: PosScreenProps) {
  const db = useSQLiteContext();
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const [currency, setCurrency] = useState<CurrencySettings>(defaultCurrency);
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebouncedValue(search, 250);
  const [category, setCategory] = useState<CatalogCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [cart, setCart] = useState<PosCartItem[]>([]);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [actionError, setActionError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [receipt, setReceipt] = useState<PosTransaction | null>(null);
  const [receiptFileUri, setReceiptFileUri] = useState<string | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<PosTransactionSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    setCart([]);
    setSearch("");
    setCategory(null);
    setActionError("");
    setReceipt(null);
    setReceiptFileUri(null);
    setShowHistory(false);
    setHistory([]);
    setHistoryError("");
  }, [ownerStore.businessId, ownerStore.storeId]);

  useAsyncEffect((isActive) => {
    setLoading(true);
    Promise.all([
      getOwnerStoreDetails(db, ownerStore.businessId, ownerStore.storeId),
      listPosProducts(db, ownerStore, { search: debouncedSearch, category }),
    ])
      .then(([store, items]) => {
        if (!isActive()) return;
        setCurrency(store ? {
          currencyMode: store.currencyMode,
          currencyCode: store.currencyCode,
          customCurrencySymbol: store.customCurrencySymbol,
          currencyDecimalPlaces: store.currencyDecimalPlaces,
        } : defaultCurrency);
        setProducts(items);
      })
      .catch((error) => {
        if (isActive()) setActionError(error instanceof Error ? error.message : "Couldn't load POS products.");
      })
      .finally(() => {
        if (isActive()) setLoading(false);
      });
  }, [category, db, debouncedSearch, ownerStore.businessId, ownerStore.storeId, ownerStore, reloadKey]);

  useAsyncEffect((isActive) => {
    if (!showHistory) return;
    setHistoryLoading(true);
    setHistoryError("");
    listPosTransactions(db, ownerStore)
      .then((items) => {
        if (isActive()) setHistory(items);
      })
      .catch((error) => {
        if (isActive()) setHistoryError(error instanceof Error ? error.message : "Couldn't load purchase history.");
      })
      .finally(() => {
        if (isActive()) setHistoryLoading(false);
      });
  }, [db, ownerStore.businessId, ownerStore.storeId, ownerStore, showHistory]);

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.lineTotal, 0);

  const addProduct = (product: PosProduct) => {
    setActionError("");
    const unitPrice = product.currentPrice;
    if (unitPrice === null) {
      setActionError("Set a selling price before adding this product.");
      return;
    }
    if (product.quantity <= 0) {
      setActionError("This product is out of stock.");
      return;
    }
    const existing = cart.find((item) => item.id === product.id);
    if (existing && existing.quantity >= existing.availableQuantity) {
      setActionError(`Only ${existing.availableQuantity} units are available.`);
      return;
    }
    const quantity = (existing?.quantity ?? 0) + 1;
    setCart((items) => {
      if (existing) {
        return items.map((item) => item.id === product.id
          ? { ...item, availableQuantity: product.quantity, quantity, lineTotal: unitPrice * quantity }
          : item);
      }
      const { quantity: availableQuantity, ...productFields } = product;
      return [...items, { ...productFields, availableQuantity, quantity: 1, lineTotal: unitPrice }];
    });
  };

  const changeQuantity = (productId: string, delta: number) => {
    const item = cart.find(({ id }) => id === productId);
    if (!item) return;
    if (delta > 0 && item.quantity >= item.availableQuantity) {
      setActionError(`Only ${item.availableQuantity} units are available.`);
      return;
    }
    setActionError("");
    setCart((items) => items.flatMap((current) => {
      if (current.id !== productId) return [current];
      const quantity = current.quantity + delta;
      if (quantity <= 0) return [];
      return [{ ...current, quantity, lineTotal: (current.currentPrice ?? 0) * quantity }];
    }));
  };

  const handleBarcode = async (code: string) => {
    setScannerVisible(false);
    setActionError("");
    try {
      const product = await findPosProductByCode(db, ownerStore, code);
      if (!product) {
        setSearch(code.trim());
        setActionError("Barcode not found. Use the search results to find the product manually.");
        return;
      }
      addProduct(product);
    } catch (error) {
      setActionError(error instanceof PosError ? error.message : "Couldn't look up that barcode.");
    }
  };

  const checkout = async () => {
    setActionError("");
    setCheckoutLoading(true);
    try {
      const completed = await checkoutPosTransaction(
        db,
        ownerStore,
        cart.map(({ id, quantity }) => ({ productId: id, quantity })),
      );
      setCart([]);
      setReceipt(completed);
      setReceiptFileUri(null);
      setReloadKey((value) => value + 1);
    } catch (error) {
      setActionError(error instanceof InventoryError || error instanceof PosError ? error.message : "Checkout failed. Nothing was saved.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const createReceipt = async () => {
    if (!receipt) return null;
    if (receiptFileUri) return receiptFileUri;
    setReceiptLoading(true);
    try {
      const uri = await createPosReceiptPdf(receipt);
      if (!uri) {
        setActionError("Receipt save canceled.");
        return null;
      }
      setReceiptFileUri(uri);
      return uri;
    } catch {
      setActionError("Couldn't generate the receipt PDF.");
      return null;
    } finally {
      setReceiptLoading(false);
    }
  };

  const openHistoryTransaction = async (transactionId: string) => {
    setHistoryError("");
    setReceiptFileUri(null);
    setReceiptLoading(true);
    try {
      setReceipt(await getPosTransaction(db, ownerStore, transactionId));
    } catch {
      setHistoryError("Couldn't load the purchase details.");
    } finally {
      setReceiptLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ScreenHeader
            title="POS"
            context={<StoreSelector ownerStore={ownerStore} ownerStores={ownerStores} onSelectStore={onSelectStore} onCreateStore={onCreateStore} />}
            actions={(
              <View style={styles.headerActions}>
                <ThemeToggle />
                <IconButton icon={History} label="View purchase history" size={22} onPress={() => setShowHistory(true)} />
                <IconButton icon={EllipsisVertical} label="Open More menu" size={24} onPress={() => onNavigate("more")} style={styles.moreButton} />
              </View>
            )}
          />

          {showHistory ? <SalesHistory items={history} currency={currency} loading={historyLoading} error={historyError} onBack={() => setShowHistory(false)} onOpen={(id) => void openHistoryTransaction(id)} /> : <>
          <View style={styles.searchRow}>
            <Search color={colors.primary[700]} size={20} strokeWidth={2} />
            <TextInput
              accessibilityLabel="Search POS products"
              value={search}
              onChangeText={(value) => { setSearch(value); setActionError(""); }}
              placeholder="Search product, SKU, or barcode"
              placeholderTextColor={colors.text.muted}
              style={styles.searchInput}
              returnKeyType="search"
            />
            <IconButton icon={ScanLine} label="Scan product barcode" onPress={() => setScannerVisible(true)} style={styles.scanButton} />
          </View>

          <ScrollView horizontal contentContainerStyle={styles.categoryList} showsHorizontalScrollIndicator={false}>
            <CategoryChip label="All" selected={!category} onPress={() => setCategory(null)} />
            {catalogCategoryOptions.map((option) => (
              <CategoryChip key={option.value} label={option.label} selected={category === option.value} onPress={() => setCategory(option.value)} />
            ))}
          </ScrollView>

          {actionError ? <Text accessibilityRole="alert" style={styles.error}>{actionError}</Text> : null}

          <View style={styles.productsSection}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Products</Text>
              <Text style={styles.sectionMeta}>{loading ? "Loading…" : `${products.length} items`}</Text>
            </View>
            {loading ? <ActivityIndicator color={colors.primary[600]} /> : products.length ? (
              <View style={styles.productList}>
                {products.map((product) => <ProductRow key={product.id} product={product} currency={currency} onAdd={() => addProduct(product)} />)}
              </View>
            ) : (
              <Card style={styles.emptyCard}>
                <Package color={colors.text.muted} size={24} />
                <Text style={styles.emptyTitle}>{search ? "No matching products" : "No products yet"}</Text>
                <Text style={styles.emptyCopy}>{search ? "Try another name, SKU, barcode, or category." : "Add products to the selected store before opening a sale."}</Text>
              </Card>
            )}
          </View>

          <Card style={styles.cart}>
            <View style={styles.cartHeader}>
              <View style={styles.cartTitleRow}>
                <View style={styles.cartIcon}><ShoppingBasket color={colors.primary[700]} size={18} strokeWidth={2} /></View>
                <Text style={styles.sectionTitle}>Cart ({totalItems})</Text>
              </View>
              <ReceiptText color={colors.text.muted} size={19} strokeWidth={2} />
            </View>
            {cart.length ? (
              <View style={styles.cartItems}>
                {cart.map((item) => (
                  <CartLine key={item.id} item={item} currency={currency} onChangeQuantity={changeQuantity} onRemove={() => setCart((items) => items.filter(({ id }) => id !== item.id))} />
                ))}
              </View>
            ) : <Text style={styles.emptyCart}>Scan or add a product to start a transaction.</Text>}
            <View style={styles.totals}>
              <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalValue}>{formatCurrency(subtotal, currency)}</Text></View>
              <View style={styles.totalRow}><Text style={styles.totalTitle}>Total</Text><Text style={styles.totalTitle}>{formatCurrency(subtotal, currency)}</Text></View>
            </View>
            <Button title={`Checkout ${formatCurrency(subtotal, currency)}`} icon={ReceiptText} size="lg" disabled={!cart.length} loading={checkoutLoading} onPress={() => void checkout()} style={styles.checkoutButton} />
          </Card>
          </>}
        </ScrollView>
        <BottomNavigation activeKey="pos" onChange={onNavigate} />
      </View>

      <BarcodeScannerModal visible={scannerVisible} onClose={() => setScannerVisible(false)} onScanned={(code) => void handleBarcode(code)} />
      <ReceiptModal
        receipt={receipt}
        receiptLoading={receiptLoading}
        error={actionError}
        onClose={() => { setReceipt(null); setReceiptFileUri(null); setActionError(""); }}
        onDownload={() => void createReceipt()}
        onNewSale={() => { setReceipt(null); setReceiptFileUri(null); setActionError(""); setShowHistory(false); }}
      />
    </SafeAreaView>
  );
}

function CategoryChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const styles = useThemeStyles(createStyles);
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.categoryChip, selected && styles.categoryChipSelected]}><Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>{label}</Text></Pressable>;
}

function SalesHistory({
  items,
  currency,
  loading,
  error,
  onBack,
  onOpen,
}: {
  items: PosTransactionSummary[];
  currency: CurrencySettings;
  loading: boolean;
  error: string;
  onBack: () => void;
  onOpen: (id: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  return (
    <View style={styles.historySection}>
      <View style={styles.historyHeader}>
        <IconButton icon={ChevronLeft} label="Back to POS" onPress={onBack} />
        <View style={styles.historyHeaderCopy}>
          <Text style={styles.sectionTitle}>Purchase History</Text>
          <Text style={styles.sectionMeta}>Completed sales for this store</Text>
        </View>
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color={colors.primary[600]} /> : items.length ? (
        <View style={styles.historyList}>
          {items.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`View receipt ${item.receiptNumber}`}
              onPress={() => onOpen(item.id)}
              style={({ pressed }) => [styles.historyCard, pressed && styles.pressed]}
            >
              <View style={styles.historyCardCopy}>
                <Text style={styles.historyReceipt}>{item.receiptNumber}</Text>
                <Text style={styles.historyMeta}>{new Date(item.createdAt).toLocaleString()}</Text>
                <Text style={styles.historyMeta}>{item.itemCount} {item.itemCount === 1 ? "product" : "products"} · {item.totalItems} units</Text>
              </View>
              <Text style={styles.historyTotal}>{formatCurrency(item.total, currency)}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Card style={styles.emptyCard}>
          <ReceiptText color={colors.text.muted} size={24} />
          <Text style={styles.emptyTitle}>No completed sales yet</Text>
          <Text style={styles.emptyCopy}>Completed POS transactions will appear here.</Text>
        </Card>
      )}
    </View>
  );
}

function ProductRow({ product, currency, onAdd }: { product: PosProduct; currency: CurrencySettings; onAdd: () => void }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const status = getProductStockStatus(product.quantity, product.reorderLevel);
  const canAdd = product.quantity > 0 && product.currentPrice !== null;
  return (
    <View style={styles.productRow}>
      <View style={styles.productIcon}><Package color={colors.primary[700]} size={18} strokeWidth={2} /></View>
      <View style={styles.productCopy}>
        <Text numberOfLines={1} style={styles.productName}>{product.name}</Text>
        <Text style={styles.productAvailability}>{product.quantity} available{product.sku ? ` · SKU ${product.sku}` : ""}</Text>
        <StatusBadge status={status} label={product.quantity <= 0 ? "Out of Stock" : product.currentPrice === null ? "Price Not Set" : undefined} />
      </View>
      <View style={styles.productAction}>
        <Text style={styles.productPrice}>{product.currentPrice === null ? "—" : formatCurrency(product.currentPrice, currency)}</Text>
        <Button title="Add" size="sm" disabled={!canAdd} onPress={onAdd} style={styles.addButton} />
      </View>
    </View>
  );
}

function CartLine({ item, currency, onChangeQuantity, onRemove }: { item: PosCartItem; currency: CurrencySettings; onChangeQuantity: (id: string, delta: number) => void; onRemove: () => void }) {
  const styles = useThemeStyles(createStyles);
  return (
    <View style={styles.cartLine}>
      <View style={styles.cartLineCopy}>
        <Text numberOfLines={1} style={styles.cartItemName}>{item.name}</Text>
        <Text style={styles.cartItemDetail}>{item.quantity} × {formatCurrency(item.currentPrice ?? 0, currency)}</Text>
      </View>
      <View style={styles.cartLineActions}>
        <IconButton icon={Minus} label={`Decrease ${item.name}`} size={16} onPress={() => onChangeQuantity(item.id, -1)} />
        <Text style={styles.cartLineTotal}>{formatCurrency(item.lineTotal, currency)}</Text>
        <IconButton icon={Plus} label={`Increase ${item.name}`} size={16} onPress={() => onChangeQuantity(item.id, 1)} />
        <IconButton icon={Trash2} label={`Remove ${item.name}`} size={16} variant="danger" onPress={onRemove} />
      </View>
    </View>
  );
}

function ReceiptModal({ receipt, receiptLoading, error, onClose, onDownload, onNewSale }: { receipt: PosTransaction | null; receiptLoading: boolean; error: string; onClose: () => void; onDownload: () => void; onNewSale: () => void }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  return (
    <Modal visible={Boolean(receipt)} animationType="slide" onRequestClose={onClose}>
      {receipt ? <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.receiptHeader}>
          <IconButton icon={ChevronLeft} label="Close receipt" onPress={onClose} />
          <Text style={styles.receiptTitle}>Receipt</Text>
        </View>
        <ScrollView contentContainerStyle={styles.receiptContent}>
          <Card style={styles.receiptCard}>
            <CheckCircle2 color={colors.semantic.success} size={32} />
            <Text style={styles.receiptSuccess}>Sale completed</Text>
            <Text style={styles.receiptBusiness}>{receipt.businessName}</Text>
            <Text style={styles.receiptStore}>{receipt.storeName}</Text>
            {receipt.storeAddress ? <Text style={styles.receiptMeta}>{receipt.storeAddress}</Text> : null}
            <Text style={styles.receiptMeta}>Receipt {receipt.receiptNumber}</Text>
            <Text style={styles.receiptMeta}>{new Date(receipt.createdAt).toLocaleString()}</Text>
            <View style={styles.receiptRule} />
            {receipt.items.map((item) => <View key={item.id} style={styles.receiptLine}><View style={styles.receiptLineCopy}><Text style={styles.receiptItemName}>{item.productName}</Text><Text style={styles.receiptMeta}>{item.sku ? `SKU ${item.sku} · ` : ""}{item.quantity} × {formatCurrency(item.unitPrice, receipt.currency)}</Text></View><Text style={styles.receiptLineTotal}>{formatCurrency(item.lineTotal, receipt.currency)}</Text></View>)}
            <View style={styles.receiptRule} />
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalValue}>{formatCurrency(receipt.subtotal, receipt.currency)}</Text></View>
            <View style={styles.totalRow}><Text style={styles.totalTitle}>Total</Text><Text style={styles.totalTitle}>{formatCurrency(receipt.total, receipt.currency)}</Text></View>
            <Text style={styles.thankYou}>Thank you for shopping with us.</Text>
          </Card>
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <View style={styles.receiptActions}>
            <Button title="Save PDF" icon={Download} loading={receiptLoading} onPress={onDownload} />
            <Button title="New Sale" variant="ghost" onPress={onNewSale} />
          </View>
        </ScrollView>
      </SafeAreaView> : null}
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background.app },
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: { flexGrow: 1, gap: spacing[4], width: "100%", maxWidth: 760, alignSelf: "center", paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: spacing[8] },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  moreButton: { width: 44, height: 44 },
  searchRow: { minHeight: control.lg, flexDirection: "row", alignItems: "center", gap: spacing[2], paddingLeft: spacing[3], paddingRight: spacing[1], borderWidth: 1, borderColor: colors.border.default, borderRadius: radii.lg, backgroundColor: colors.background.subtle },
  searchInput: { ...typography.bodySmall, flex: 1, minHeight: control.lg, color: colors.text.primary },
  scanButton: { width: control.lg, height: control.lg },
  categoryList: { gap: spacing[2], paddingRight: spacing[4] },
  categoryChip: { minHeight: control.sm, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing[3], borderWidth: 1, borderColor: colors.border.default, borderRadius: radii.full, backgroundColor: colors.background.subtle },
  categoryChipSelected: { borderColor: colors.primary[600], backgroundColor: colors.primary[50] },
  categoryLabel: { ...typography.caption, color: colors.text.secondary, fontWeight: "600" },
  categoryLabelSelected: { color: colors.primary[700] },
  error: { ...typography.bodySmall, color: colors.semantic.danger, paddingHorizontal: spacing[1] },
  historySection: { gap: spacing[3] },
  historyHeader: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  historyHeaderCopy: { flex: 1, gap: spacing[1] },
  historyList: { gap: spacing[2] },
  historyCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing[3], padding: spacing[4], borderWidth: 1, borderColor: colors.border.default, borderRadius: radii.lg, backgroundColor: colors.background.surface },
  historyCardCopy: { flex: 1, minWidth: 0, gap: spacing[1] },
  historyReceipt: { ...typography.body, color: colors.text.primary, fontWeight: "700" },
  historyMeta: { ...typography.caption, color: colors.text.secondary },
  historyTotal: { ...typography.body, color: colors.text.primary, fontWeight: "700" },
  pressed: { opacity: 0.76 },
  productsSection: { gap: spacing[3] },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing[3] },
  sectionTitle: { ...typography.title, color: colors.text.primary },
  sectionMeta: { ...typography.caption, color: colors.text.muted },
  productList: { gap: spacing[2] },
  productRow: { minHeight: 92, flexDirection: "row", alignItems: "center", gap: spacing[3], padding: spacing[3], borderWidth: 1, borderColor: colors.border.default, borderRadius: radii.lg, backgroundColor: colors.background.surface },
  productIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: radii.md, backgroundColor: colors.primary[50] },
  productCopy: { flex: 1, minWidth: 0, gap: spacing[1] },
  productName: { ...typography.body, color: colors.text.primary, fontWeight: "600" },
  productAvailability: { ...typography.caption, color: colors.text.secondary },
  productAction: { alignItems: "flex-end", gap: spacing[2] },
  productPrice: { ...typography.bodySmall, color: colors.text.primary, fontWeight: "700" },
  addButton: { minWidth: 68 },
  emptyCard: { alignItems: "center", gap: spacing[2], padding: spacing[6] },
  emptyTitle: { ...typography.title, color: colors.text.primary },
  emptyCopy: { ...typography.bodySmall, color: colors.text.secondary, textAlign: "center" },
  cart: { gap: spacing[3], padding: spacing[4] },
  cartHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cartTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  cartIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: radii.md, backgroundColor: colors.primary[50] },
  cartItems: { gap: spacing[2] },
  emptyCart: { ...typography.bodySmall, color: colors.text.muted, paddingVertical: spacing[2] },
  cartLine: { flexDirection: "row", alignItems: "center", gap: spacing[2], paddingVertical: spacing[2], borderBottomWidth: 1, borderBottomColor: colors.border.default },
  cartLineCopy: { flex: 1, minWidth: 0 },
  cartItemName: { ...typography.bodySmall, color: colors.text.primary, fontWeight: "600" },
  cartItemDetail: { ...typography.caption, color: colors.text.secondary },
  cartLineActions: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
  cartLineTotal: { ...typography.bodySmall, minWidth: 70, color: colors.text.primary, textAlign: "right", fontWeight: "700" },
  totals: { gap: spacing[2], paddingTop: spacing[2] },
  totalRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing[3] },
  totalLabel: { ...typography.bodySmall, color: colors.text.secondary },
  totalValue: { ...typography.bodySmall, color: colors.text.primary },
  totalTitle: { ...typography.title, color: colors.text.primary },
  checkoutButton: { width: "100%" },
  receiptHeader: { minHeight: control.lg, flexDirection: "row", alignItems: "center", gap: spacing[2], paddingHorizontal: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.border.default, backgroundColor: colors.background.surface },
  receiptTitle: { ...typography.h3, color: colors.text.primary },
  receiptContent: { width: "100%", maxWidth: 560, alignSelf: "center", gap: spacing[4], padding: spacing[4], paddingBottom: spacing[8] },
  receiptCard: { alignItems: "center", gap: spacing[2], padding: spacing[5] },
  receiptSuccess: { ...typography.h3, color: colors.text.primary },
  receiptBusiness: { ...typography.title, color: colors.text.primary, marginTop: spacing[2] },
  receiptStore: { ...typography.bodySmall, color: colors.text.secondary },
  receiptMeta: { ...typography.caption, color: colors.text.secondary, textAlign: "center" },
  receiptRule: { width: "100%", borderTopWidth: 1, borderTopColor: colors.border.default, marginVertical: spacing[3] },
  receiptLine: { width: "100%", flexDirection: "row", justifyContent: "space-between", gap: spacing[3], paddingVertical: spacing[2] },
  receiptLineCopy: { flex: 1, minWidth: 0 },
  receiptItemName: { ...typography.bodySmall, color: colors.text.primary, fontWeight: "600" },
  receiptLineTotal: { ...typography.bodySmall, color: colors.text.primary, fontWeight: "700" },
  thankYou: { ...typography.bodySmall, color: colors.text.secondary, marginTop: spacing[4] },
  receiptActions: { gap: spacing[2] },
});
