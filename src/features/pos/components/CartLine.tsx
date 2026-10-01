import { Minus, Plus, Trash2 } from "lucide-react-native";
import { Text, View } from "react-native";
import { IconButton } from "@/components/ui/IconButton";
import { formatCurrency, type CurrencySettings } from "@/domain/currency";
import type { PosCartItem } from "@/domain/pos";
import { useThemeStyles } from "@/theme";
import { createPosStyles } from "../pos.styles";

export function CartLine({ item, currency, onChangeQuantity, onRemove }: { item: PosCartItem; currency: CurrencySettings; onChangeQuantity: (id: string, delta: number) => void; onRemove: () => void }) {
  const styles = useThemeStyles(createPosStyles);
  return <View style={styles.cartLine}><View style={styles.cartLineCopy}><Text numberOfLines={1} style={styles.cartItemName}>{item.name}</Text><Text style={styles.cartItemDetail}>{item.quantity} × {formatCurrency(item.currentPrice ?? 0, currency)}</Text></View><View style={styles.cartLineActions}><IconButton icon={Minus} label={`Decrease ${item.name}`} size={16} onPress={() => onChangeQuantity(item.id, -1)} /><Text style={styles.cartLineTotal}>{formatCurrency(item.lineTotal, currency)}</Text><IconButton icon={Plus} label={`Increase ${item.name}`} size={16} onPress={() => onChangeQuantity(item.id, 1)} /><IconButton icon={Trash2} label={`Remove ${item.name}`} size={16} variant="danger" onPress={onRemove} /></View></View>;
}
