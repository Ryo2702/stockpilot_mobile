import {
  EllipsisVertical,
  Package,
  ReceiptText,
  ScanLine,
  Search,
  ShoppingBasket,
} from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import StoreSelector from "@/components/store/StoreSelector";
import { BottomNavigation, type BottomNavKey } from "@/components/ui/BottomNavigation";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import ScreenHeader from "@/components/ui/ScreenHeader";
import { StatusBadge, type StockStatus } from "@/components/ui/StatusBadge";
import ThemeToggle from "@/components/ui/ThemeToggle";
import type { OwnerStore } from "@/services/owner-store.service";
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

type PosProduct = {
  name: string;
  available: number;
  price: string;
  status: StockStatus;
  statusLabel?: string;
  unavailable?: boolean;
};

const products: PosProduct[] = [
  { name: "Coca-Cola 1.5L", available: 24, price: "₱70.00", status: "healthy" },
  { name: "Bread Loaf", available: 12, price: "₱45.00", status: "healthy" },
  { name: "Milk 1L", available: 4, price: "₱60.00", status: "low" },
  {
    name: "Instant Noodles",
    available: 0,
    price: "₱12.00",
    status: "critical",
    statusLabel: "Out of Stock",
    unavailable: true,
  },
];

const categories = ["All", "Beverages", "Snacks", "Groceries"];

export default function PosScreen({
  ownerStore,
  ownerStores,
  onSelectStore,
  onCreateStore,
  onNavigate,
}: PosScreenProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader
            title="POS"
            context={(
              <StoreSelector
                ownerStore={ownerStore}
                ownerStores={ownerStores}
                onSelectStore={onSelectStore}
                onCreateStore={onCreateStore}
              />
            )}
            actions={(
              <View style={styles.headerActions}>
                <ThemeToggle />
                <IconButton
                  icon={EllipsisVertical}
                  label="Open More menu"
                  size={24}
                  onPress={() => onNavigate("more")}
                  style={styles.moreButton}
                />
              </View>
            )}
          />

          <View style={styles.searchField}>
            <Search color={colors.primary[700]} size={20} strokeWidth={2} />
            <Text style={styles.searchPlaceholder}>Search product, SKU, or barcode</Text>
            <ScanLine color={colors.primary[700]} size={20} strokeWidth={2} />
          </View>

          <ScrollView
            horizontal
            contentContainerStyle={styles.categoryList}
            showsHorizontalScrollIndicator={false}
          >
            {categories.map((category) => {
              const selected = category === "All";
              return (
                <View key={category} style={[styles.categoryChip, selected && styles.categoryChipSelected]}>
                  <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>{category}</Text>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.productsSection}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Products</Text>
              <Text style={styles.sectionMeta}>4 items</Text>
            </View>
            <View style={styles.productList}>
              {products.map((product) => (
                <View key={product.name} style={styles.productRow}>
                  <View style={styles.productIcon}>
                    <Package color={colors.primary[700]} size={18} strokeWidth={2} />
                  </View>
                  <View style={styles.productCopy}>
                    <Text numberOfLines={1} style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productAvailability}>{product.available} available</Text>
                    <StatusBadge status={product.status} label={product.statusLabel} />
                  </View>
                  <View style={styles.productAction}>
                    <Text style={styles.productPrice}>{product.price}</Text>
                    <View style={[styles.addButton, product.unavailable && styles.addButtonDisabled]}>
                      <Text style={[styles.addButtonLabel, product.unavailable && styles.addButtonLabelDisabled]}>Add</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <Card style={styles.cart}>
            <View style={styles.cartHeader}>
              <View style={styles.cartTitleRow}>
                <View style={styles.cartIcon}>
                  <ShoppingBasket color={colors.primary[700]} size={18} strokeWidth={2} />
                </View>
                <Text style={styles.sectionTitle}>Cart (3)</Text>
              </View>
              <ReceiptText color={colors.text.muted} size={19} strokeWidth={2} />
            </View>

            <View style={styles.cartItems}>
              <CartLine label="Coca-Cola 1.5L" detail="2 × ₱70.00" total="₱140.00" />
              <CartLine label="Bread" detail="1 × ₱45.00" total="₱45.00" />
              <CartLine label="Milk" detail="1 × ₱60.00" total="₱60.00" />
            </View>

            <View style={styles.totals}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>₱245.00</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalTitle}>Total</Text>
                <Text style={styles.totalTitle}>₱245.00</Text>
              </View>
            </View>

            <View style={styles.checkoutButton}>
              <Text style={styles.checkoutLabel}>Checkout ₱245.00</Text>
            </View>
          </Card>
        </ScrollView>

        <BottomNavigation activeKey="pos" onChange={onNavigate} />
      </View>
    </SafeAreaView>
  );
}

function CartLine({ label, detail, total }: { label: string; detail: string; total: string }) {
  const styles = useThemeStyles(createStyles);

  return (
    <View style={styles.cartLine}>
      <View style={styles.cartLineCopy}>
        <Text style={styles.cartItemName}>{label}</Text>
        <Text style={styles.cartItemDetail}>{detail}</Text>
      </View>
      <Text style={styles.cartLineTotal}>{total}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.app,
  },
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: spacing[4],
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[8],
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  moreButton: {
    width: 44,
    height: 44,
  },
  searchField: {
    minHeight: control.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.lg,
    backgroundColor: colors.background.subtle,
  },
  searchPlaceholder: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.text.muted,
  },
  categoryList: {
    gap: spacing[2],
    paddingRight: spacing[4],
  },
  categoryChip: {
    minHeight: control.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.full,
    backgroundColor: colors.background.subtle,
  },
  categoryChipSelected: {
    borderColor: colors.primary[600],
    backgroundColor: colors.primary[50],
  },
  categoryLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: "600",
  },
  categoryLabelSelected: {
    color: colors.primary[700],
  },
  productsSection: {
    gap: spacing[3],
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
  },
  sectionTitle: {
    ...typography.title,
    color: colors.text.primary,
  },
  sectionMeta: {
    ...typography.caption,
    color: colors.text.muted,
  },
  productList: {
    gap: spacing[2],
  },
  productRow: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.lg,
    backgroundColor: colors.background.surface,
  },
  productIcon: {
    width: control.md,
    height: control.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.primary[50],
  },
  productCopy: {
    minWidth: 0,
    flex: 1,
    gap: spacing[1],
  },
  productName: {
    ...typography.label,
    color: colors.text.primary,
    fontWeight: "600",
  },
  productAvailability: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  productAction: {
    alignItems: "flex-end",
    gap: spacing[2],
  },
  productPrice: {
    ...typography.label,
    color: colors.text.primary,
    fontWeight: "700",
  },
  addButton: {
    minWidth: 54,
    minHeight: control.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing[2],
    borderWidth: 1,
    borderColor: colors.primary[600],
    borderRadius: radii.md,
    backgroundColor: colors.primary[50],
  },
  addButtonDisabled: {
    borderColor: colors.border.default,
    backgroundColor: colors.background.disabled,
  },
  addButtonLabel: {
    ...typography.caption,
    color: colors.primary[700],
    fontWeight: "600",
  },
  addButtonLabelDisabled: {
    color: colors.text.disabled,
  },
  cart: {
    gap: spacing[3],
  },
  cartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cartTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  cartIcon: {
    width: control.md,
    height: control.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.primary[50],
  },
  cartItems: {
    gap: spacing[2],
  },
  cartLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
  },
  cartLineCopy: {
    minWidth: 0,
    flex: 1,
  },
  cartItemName: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: "600",
  },
  cartItemDetail: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  cartLineTotal: {
    ...typography.label,
    color: colors.text.primary,
    fontWeight: "600",
  },
  totals: {
    gap: spacing[2],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  totalValue: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: "600",
  },
  totalTitle: {
    ...typography.title,
    color: colors.text.primary,
  },
  checkoutButton: {
    minHeight: control.lg,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: colors.primary[600],
  },
  checkoutLabel: {
    ...typography.label,
    color: colors.text.onPrimary,
    fontWeight: "700",
  },
});
