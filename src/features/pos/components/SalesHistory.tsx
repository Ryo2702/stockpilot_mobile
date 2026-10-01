import { ChevronLeft, ReceiptText } from "lucide-react-native";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { formatCurrency, type CurrencySettings } from "@/domain/currency";
import type { PosTransactionSummary } from "@/domain/pos";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";
import { createPosStyles } from "../pos.styles";

export function SalesHistory({ items, currency, loading, error, onBack, onOpen }: { items: PosTransactionSummary[]; currency: CurrencySettings; loading: boolean; error: string; onBack: () => void; onOpen: (id: string) => void }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createPosStyles);
  return <View style={styles.historySection}><View style={styles.historyHeader}><IconButton icon={ChevronLeft} label="Back to POS" onPress={onBack} /><View style={styles.historyHeaderCopy}><Text style={styles.sectionTitle}>Purchase History</Text><Text style={styles.sectionMeta}>Completed sales for this store</Text></View></View>{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}{loading ? <ActivityIndicator color={colors.primary[600]} /> : items.length ? <View style={styles.historyList}>{items.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`View receipt ${item.receiptNumber}`} onPress={() => onOpen(item.id)} style={({ pressed }) => [styles.historyCard, pressed && styles.pressed]}><View style={styles.historyCardCopy}><Text style={styles.historyReceipt}>{item.receiptNumber}</Text><Text style={styles.historyMeta}>{new Date(item.createdAt).toLocaleString()}</Text><Text style={styles.historyMeta}>{item.itemCount} {item.itemCount === 1 ? "product" : "products"} · {item.totalItems} units</Text></View><Text style={styles.historyTotal}>{formatCurrency(item.total, currency)}</Text></Pressable>)}</View> : <Card style={styles.emptyCard}><ReceiptText color={colors.text.muted} size={24} /><Text style={styles.emptyTitle}>No completed sales yet</Text><Text style={styles.emptyCopy}>Completed POS transactions will appear here.</Text></Card>}</View>;
}
