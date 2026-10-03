import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSQLiteContext } from "expo-sqlite";
import BarcodeScannerModal from "@/components/ui/BarcodeScannerModal";
import { BottomNavigation } from "@/components/ui/BottomNavigation";
import type { PosTransaction } from "@/domain/pos";
import { useThemeStyles } from "@/theme";
import { createPosStyles } from "./pos.styles";
import type { PosScreenProps } from "./pos.types";
import usePosCart from "./hooks/usePosCart";
import usePosCatalog from "./hooks/usePosCatalog";
import usePosHistory from "./hooks/usePosHistory";
import usePosReceipt from "./hooks/usePosReceipt";
import { PosCart } from "./components/PosCart";
import { PosCatalog } from "./components/PosCatalog";
import { PosHeader } from "./components/PosHeader";
import { ReceiptModal } from "./components/ReceiptModal";
import { SalesHistory } from "./components/SalesHistory";

export default function PosScreen({ ownerStore, onNavigate }: PosScreenProps) {
  const db = useSQLiteContext();
  const styles = useThemeStyles(createPosStyles);
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const history = usePosHistory(ownerStore, showHistory);
  const receipt = usePosReceipt({ db, ownerStore, onError: setActionError, onHistoryError: history.setError });
  const cart = usePosCart({ db, ownerStore, onError: setActionError, onComplete: (value: PosTransaction) => { receipt.showReceipt(value); setReloadKey((key) => key + 1); } });
  const catalog = usePosCatalog({ ownerStore, reloadKey, onError: setActionError, onAddProduct: cart.addProduct });

  useEffect(() => { setActionError(""); setScannerVisible(false); setShowHistory(false); }, [ownerStore.businessId, ownerStore.storeId]);

  return <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}><View style={styles.screen}><ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <PosHeader ownerStore={ownerStore} totalItems={cart.totalItems} onHistory={() => setShowHistory(true)} onMore={() => onNavigate("more")} />
    {showHistory ? <SalesHistory items={history.history} currency={catalog.currency} loading={history.loading} error={history.error} onBack={() => setShowHistory(false)} onOpen={(id) => void receipt.openTransaction(id)} /> : <><PosCatalog products={catalog.products} currency={catalog.currency} search={catalog.search} onSearch={(value) => { catalog.setSearch(value); setActionError(""); }} category={catalog.category} onCategory={(value) => { catalog.setCategory(value); setActionError(""); }} loading={catalog.loading} error={actionError} onScan={() => setScannerVisible(true)} onClearSearch={() => { catalog.setSearch(""); setActionError(""); }} onAdd={cart.addProduct} page={catalog.page} hasNextPage={catalog.hasNextPage} onPreviousPage={catalog.previousPage} onNextPage={catalog.nextPage} /><PosCart cart={cart.cart} currency={catalog.currency} totalItems={cart.totalItems} subtotal={cart.subtotal} checkoutLoading={cart.checkoutLoading} onChangeQuantity={cart.changeQuantity} onRemove={cart.removeProduct} onCheckout={() => void cart.checkout()} showCheckoutButton={false} /><View style={styles.checkoutSpacer} /></>}
  </ScrollView>{showHistory ? null : <PosCart cart={cart.cart} currency={catalog.currency} totalItems={cart.totalItems} subtotal={cart.subtotal} checkoutLoading={cart.checkoutLoading} onChangeQuantity={cart.changeQuantity} onRemove={cart.removeProduct} onCheckout={() => void cart.checkout()} sticky />}<BottomNavigation activeKey="pos" onChange={onNavigate} /></View><BarcodeScannerModal visible={scannerVisible} onClose={() => setScannerVisible(false)} onScanned={(code) => { setScannerVisible(false); void catalog.handleBarcode(code); }} /><ReceiptModal receipt={receipt.receipt} receiptLoading={receipt.loading} saved={Boolean(receipt.fileUri)} error={actionError} onClose={receipt.close} onDownload={() => void receipt.createReceipt()} onNewSale={() => { receipt.close(); setShowHistory(false); }} /></SafeAreaView>;
}
