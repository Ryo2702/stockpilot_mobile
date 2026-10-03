import { EllipsisVertical, History } from "lucide-react-native";
import { Text, View } from "react-native";
import { IconButton } from "@/components/ui/IconButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useThemeStyles } from "@/theme";
import { createPosStyles } from "../pos.styles";
import type { PosScreenProps } from "../pos.types";

export function PosHeader({ ownerStore, totalItems, onHistory, onMore }: Pick<PosScreenProps, "ownerStore"> & { totalItems: number; onHistory: () => void; onMore: () => void }) {
  const styles = useThemeStyles(createPosStyles);
  return <ScreenHeader title="POS" titleAccessory={<Text style={styles.transactionIndicator}>{totalItems ? `${totalItems} items in cart` : "New sale"}</Text>} context={<View style={styles.storeContext}><Text style={styles.storeContextLabel}>Business · {ownerStore.ownerName}</Text><Text style={styles.storeContextLabel}>Store · {ownerStore.storeName}</Text></View>} actions={<View style={styles.headerActions}><ThemeToggle /><IconButton icon={History} label="View purchase history" size={22} onPress={onHistory} /><IconButton icon={EllipsisVertical} label="Open More menu" size={24} onPress={onMore} style={styles.moreButton} /></View>} />;
}
