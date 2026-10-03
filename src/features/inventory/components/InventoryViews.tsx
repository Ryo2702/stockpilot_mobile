import { AlertCircle, ArrowDownToLine, ArrowLeftRight, ArrowUpDown, ArrowUpFromLine, CircleCheck, Package, Search, SlidersHorizontal, TriangleAlert } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import PrintBarcodeButton from "@/components/ui/PrintBarcodeButton";
import { SearchField } from "@/components/ui/SearchField";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getCatalogCategoryOption } from "@/data/catalog.data";
import type { InventoryItem, InventoryMovement } from "@/domain/inventory";
import { getProductStockStatus } from "@/domain/product";
import type { OwnerStore } from "@/services/owner-store.service";
import { control, radii, spacing, typography, useThemeStyles } from "@/theme";
import { useTheme } from "@/theme/ThemeProvider";
import type { ThemeColors } from "@/theme/tokens";

import type { InventoryScreenController } from "../hooks/useInventoryScreen";
import { formatInventoryReason, getInventorySortLabel, inventoryStatusOptions, movementFilterOptions, movementPeriodOptions } from "../data/inventory.data";
import InventoryItemRow from "./InventoryItemRow";

type InventoryController = InventoryScreenController;

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  body: { gap: spacing[4] },
  searchRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  searchField: { minWidth: 0, flex: 1 },
  toolButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.md,
    backgroundColor: colors.background.surface,
  },
  pressed: { opacity: 0.72 },
  filterScroller: { marginHorizontal: -spacing[4] },
  filterChips: { gap: spacing[2], paddingHorizontal: spacing[4] },
  chip: {
    minHeight: control.sm,
    justifyContent: "center",
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radii.full,
    backgroundColor: colors.background.surface,
  },
  chipSelected: { borderColor: colors.primary[500], backgroundColor: colors.primary[50] },
  chipLabel: { ...typography.label, color: colors.text.secondary },
  chipLabelSelected: { color: colors.primary[700], fontWeight: "600" },
  summary: { flexDirection: "row", gap: spacing[2] },
  totalCard: { flex: 1.35, minWidth: 96, gap: spacing[1], padding: spacing[3] },
  countCard: { flex: 1, minWidth: 64, alignItems: "center", justifyContent: "center", gap: spacing[1], padding: spacing[2] },
  countHeading: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
  countLabel: { ...typography.caption, color: colors.text.secondary, textAlign: "center" },
  totalNumber: { ...typography.h2, color: colors.text.primary },
  countNumber: { ...typography.numericSmall, color: colors.text.primary },
  results: { ...typography.caption, color: colors.text.muted },
  sortCopy: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing[2] },
  sortLabel: { ...typography.caption, color: colors.text.muted },
  list: { gap: spacing[2] },
  empty: { alignItems: "center", gap: spacing[3], paddingVertical: spacing[8], paddingHorizontal: spacing[5] },
  emptyIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.full,
    backgroundColor: colors.gray[100],
  },
  emptyTitle: { ...typography.title, color: colors.text.primary, textAlign: "center" },
  emptyCopy: { ...typography.bodySmall, color: colors.text.secondary, textAlign: "center" },
  emptyActions: { width: "100%", gap: spacing[2], marginTop: spacing[1] },
  skeletonList: { gap: spacing[2] },
  skeletonRow: { height: 92, borderRadius: radii.md, backgroundColor: colors.background.subtle, borderWidth: 1, borderColor: colors.border.default },
  errorBlock: { alignItems: "center", gap: spacing[3], paddingVertical: spacing[6], paddingHorizontal: spacing[4] },
  errorCopy: { ...typography.bodySmall, color: colors.semantic.danger, textAlign: "center" },
  message: { flexDirection: "row", alignItems: "center", gap: spacing[2], padding: spacing[3], borderRadius: radii.md, backgroundColor: colors.primary[50] },
  messageText: { ...typography.caption, flex: 1, color: colors.primary[800] },
  detailIdentity: { gap: spacing[1] },
  detailName: { ...typography.h2, color: colors.text.primary },
  detailMeta: { ...typography.bodySmall, color: colors.text.secondary },
  technicalMeta: { ...typography.mono, color: colors.text.secondary },
  stockCard: { gap: spacing[3], padding: spacing[4] },
  stockHeading: { ...typography.caption, color: colors.text.muted },
  stockValue: { ...typography.display, color: colors.text.primary },
  stockUnits: { ...typography.bodySmall, color: colors.text.secondary },
  stockStatusRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing[2] },
  detailNote: { ...typography.caption, color: colors.text.secondary },
  detailRows: { gap: spacing[3] },
  detailRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing[3] },
  detailLabel: { ...typography.bodySmall, color: colors.text.muted },
  detailValue: { ...typography.label, color: colors.text.primary, textAlign: "right" },
  twoActions: { gap: spacing[2] },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing[2] },
  sectionTitle: { ...typography.section, color: colors.text.primary },
  link: { ...typography.label, color: colors.primary[600], fontWeight: "600" },
  movementList: { gap: spacing[2] },
  movementRow: { flexDirection: "row", alignItems: "center", gap: spacing[3], paddingVertical: spacing[2] },
  movementIcon: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: radii.md },
  movementCopy: { minWidth: 0, flex: 1, gap: spacing[1] },
  movementName: { ...typography.title, color: colors.text.primary },
  movementMeta: { ...typography.caption, color: colors.text.muted },
  movementAmount: { ...typography.numericSmall, textAlign: "right" },
  group: { gap: spacing[1] },
  groupTitle: { ...typography.label, color: colors.text.muted, fontWeight: "600" },
  line: { height: 1, backgroundColor: colors.border.default },
  detailType: { ...typography.label, fontWeight: "600" },
  info: { ...typography.caption, color: colors.text.secondary, padding: spacing[3], borderRadius: radii.md, backgroundColor: colors.background.subtle },
  archivedLabel: { ...typography.caption, color: colors.text.muted },
});

export function InventoryMessage({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const styles = useThemeStyles(createStyles);
  if (!message) return null;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Dismiss message" onPress={onDismiss} style={styles.message}>
      <Text style={styles.messageText}>{message}</Text>
    </Pressable>
  );
}

export function InventoryListContent({
  ownerStore,
  inventory,
  archived,
  onOpenFilters,
  onOpenSort,
  onOpenItem,
  onAddProduct,
  onImport,
  onOpenCatalog,
}: {
  ownerStore: OwnerStore;
  inventory: InventoryController;
  archived: boolean;
  onOpenFilters: () => void;
  onOpenSort: () => void;
  onOpenItem: (item: InventoryItem) => void;
  onAddProduct: () => void;
  onImport: () => void;
  onOpenCatalog: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);

  return (
    <View style={styles.body}>
      {!archived && inventory.counts ? <InventorySummary counts={inventory.counts} /> : null}
      <View style={styles.searchRow}>
        <SearchField
          accessibilityLabel={archived ? "Search archived inventory" : "Search inventory, SKU, or barcode"}
          onChangeText={inventory.setSearch}
          onClear={() => inventory.setSearch("")}
          placeholder={archived ? "Search archived products" : "Search inventory, SKU, or barcode"}
          returnKeyType="search"
          style={styles.searchField}
          value={inventory.search}
        />
        {!archived ? (
          <>
            <ToolButton label="Filter inventory" onPress={onOpenFilters}>
              <SlidersHorizontal color={inventory.isFiltered ? colors.primary[600] : colors.text.secondary} size={18} />
            </ToolButton>
            <ToolButton label="Sort inventory" onPress={onOpenSort}>
              <ArrowUpDown color={colors.text.secondary} size={18} />
            </ToolButton>
          </>
        ) : null}
      </View>

      {!archived ? (
        <>
          <ScrollView horizontal style={styles.filterScroller} contentContainerStyle={styles.filterChips} showsHorizontalScrollIndicator={false}>
            {inventoryStatusOptions.map((option) => (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected: inventory.stockStatus === option.value }}
                onPress={() => inventory.setStockStatus(option.value)}
                style={({ pressed }) => [styles.chip, inventory.stockStatus === option.value && styles.chipSelected, pressed && styles.pressed]}
              >
                <Text style={[styles.chipLabel, inventory.stockStatus === option.value && styles.chipLabelSelected]}>{option.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.sortCopy}>
            <Text style={styles.sortLabel}>Sort: {getInventorySortLabel(inventory.sort)}</Text>
            <Text style={styles.sortLabel}>Active store: {ownerStore.storeName}</Text>
          </View>
        </>
      ) : null}

      {inventory.loadError && !inventory.items.length ? (
        <View style={styles.errorBlock}>
          <AlertCircle color={colors.semantic.danger} size={22} />
          <Text accessibilityRole="alert" style={styles.errorCopy}>{inventory.loadError}</Text>
          <Button title="Try Again" variant="secondary" onPress={inventory.reload} />
        </View>
      ) : inventory.loading && !inventory.items.length ? (
        <View style={styles.skeletonList}>
          {[0, 1, 2, 3].map((key) => <View key={key} style={styles.skeletonRow} />)}
        </View>
      ) : inventory.items.length ? (
        <View style={styles.list}>
          <Text style={styles.results}>{inventory.totalCount.toLocaleString()} {inventory.totalCount === 1 ? "product" : "products"}</Text>
          {inventory.loadError ? <Text accessibilityRole="alert" style={styles.errorCopy}>{inventory.loadError}</Text> : null}
          {inventory.items.map((item) => (
            <InventoryItemRow key={item.id} item={item} archived={archived} onPress={() => onOpenItem(item)} />
          ))}
          {inventory.hasMore ? (
            <Button title={inventory.loadingMore ? "Loading…" : "Load more"} loading={inventory.loadingMore} variant="secondary" onPress={() => void inventory.loadMore()} />
          ) : null}
        </View>
      ) : inventory.isFiltered ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Search color={colors.text.muted} size={22} /></View>
          <Text style={styles.emptyTitle}>No matching inventory</Text>
          <Text style={styles.emptyCopy}>Try changing your search or filters.</Text>
          <Button title="Clear Filters" variant="secondary" onPress={inventory.clearFilters} />
        </View>
      ) : archived ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Package color={colors.text.muted} size={22} /></View>
          <Text style={styles.emptyTitle}>No archived products</Text>
          <Text style={styles.emptyCopy}>Products archived from Catalog will appear here. Open Catalog to restore an item.</Text>
          <Button title="Open Catalog" variant="secondary" onPress={onOpenCatalog} />
        </View>
      ) : (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Package color={colors.text.muted} size={22} /></View>
          <Text style={styles.emptyTitle}>No inventory yet</Text>
          <Text style={styles.emptyCopy}>Add products to this store before tracking stock.</Text>
          <View style={styles.emptyActions}>
            <Button title="Add Product" onPress={onAddProduct} />
            <Button title="Import Inventory" variant="secondary" onPress={onImport} />
          </View>
        </View>
      )}
    </View>
  );
}

function InventorySummary({ counts }: { counts: NonNullable<InventoryController["counts"]> }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const values = [
    { label: "Healthy", value: counts.healthy, color: colors.semantic.success, Icon: CircleCheck },
    { label: "Low", value: counts.low, color: colors.semantic.warning, Icon: TriangleAlert },
    { label: "Critical", value: counts.critical, color: colors.semantic.danger, Icon: AlertCircle },
  ];
  return (
    <View style={styles.summary}>
      <Card style={styles.totalCard}>
        <Text style={styles.countLabel}>Total Products</Text>
        <Text style={styles.totalNumber}>{counts.total.toLocaleString()}</Text>
      </Card>
      {values.map(({ label, value, color, Icon }) => (
        <Card key={label} style={styles.countCard}>
          <View style={styles.countHeading}><Icon color={color} size={14} strokeWidth={2.2} /><Text style={styles.countLabel}>{label}</Text></View>
          <Text style={styles.countNumber}>{value.toLocaleString()}</Text>
        </Card>
      ))}
    </View>
  );
}

function ToolButton({ label, onPress, children }: { label: string; onPress: () => void; children: ReactNode }) {
  const styles = useThemeStyles(createStyles);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.toolButton, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

export function InventoryDetailContent({
  inventory,
  onOpenMovement,
  onOpenAllMovements,
  onOpenCatalog,
}: {
  inventory: InventoryController;
  onOpenMovement: (movement: InventoryMovement) => void;
  onOpenAllMovements: (productId: string) => void;
  onOpenCatalog: (productId: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const detail = inventory.detail;
  if (inventory.detailLoading && !detail) return <LoadingContent />;
  if (!detail) {
    return (
      <View style={styles.errorBlock}>
        <AlertCircle color={colors.semantic.danger} size={22} />
        <Text accessibilityRole="alert" style={styles.errorCopy}>{inventory.detailError || "Inventory detail couldn't be loaded."}</Text>
        <Button title="Try Again" variant="secondary" onPress={inventory.reload} />
      </View>
    );
  }
  const { item, summary, recentMovements } = detail;
  const status = getProductStockStatus(item.quantity, item.reorderLevel);
  const category = getCatalogCategoryOption(item.category);

  return (
    <View style={styles.body}>
      <View style={styles.detailIdentity}>
        <Text style={styles.detailName}>{item.name}</Text>
        <Text style={styles.technicalMeta}>{item.sku ? `SKU: ${item.sku}` : "No SKU"}</Text>
        <Text style={styles.technicalMeta}>Barcode: {item.barcode ?? "—"}</Text>
        <Text style={styles.detailMeta}>{category.label}</Text>
      </View>
      <PrintBarcodeButton name={item.name} barcode={item.barcode ?? item.sku} />
      <Card style={styles.stockCard}>
        <Text style={styles.stockHeading}>Current Stock</Text>
        <Text style={styles.stockValue}>{item.quantity.toLocaleString()} <Text style={styles.stockUnits}>{item.unit}</Text></Text>
        <View style={styles.stockStatusRow}>
          {item.isActive ? (
            <StatusBadge status={status} label={status === "low" ? "Low" : status === "critical" ? "Critical" : "Healthy"} />
          ) : <Text style={styles.archivedLabel}>Archived</Text>}
          <Text style={styles.detailMeta}>Reorder Level · {item.reorderLevel} {item.unit}</Text>
        </View>
        {status === "critical" ? <Text style={styles.detailNote}>Stock is at zero.</Text> : status === "low" ? <Text style={styles.detailNote}>Below reorder level.</Text> : null}
      </Card>
      {item.isActive ? (
        <View style={styles.twoActions}>
          <Button title="Adjust Stock" onPress={inventory.openAdjustment} />
          <Button title="View Product in Catalog" icon={Package} variant="secondary" onPress={() => onOpenCatalog(item.id)} />
        </View>
      ) : (
        <Text style={styles.info}>Archived products cannot receive stock adjustments. Restore this product in Catalog to make it active again.</Text>
      )}
      <Card style={styles.detailRows}>
        <Text style={styles.sectionTitle}>Last 30 Days</Text>
        <DetailRow label="Stock In" value={`+${summary.stockIn} ${item.unit}`} />
        <DetailRow label="Stock Out" value={`−${summary.stockOut} ${item.unit}`} />
        <DetailRow label="Adjustments" value={String(summary.adjustments)} />
      </Card>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Movements</Text>
        <Pressable accessibilityRole="button" onPress={() => onOpenAllMovements(item.id)}>
          <Text style={styles.link}>View All Movements</Text>
        </Pressable>
      </View>
      {recentMovements.length ? (
        <View style={styles.movementList}>
          {recentMovements.map((movement) => (
            <MovementRow key={movement.id} movement={movement} onPress={() => onOpenMovement(movement)} />
          ))}
        </View>
      ) : <Text style={styles.emptyCopy}>No stock movements recorded for this product.</Text>}
    </View>
  );
}

export function MovementHistoryContent({
  inventory,
  onOpenMovement,
}: {
  inventory: InventoryController;
  onOpenMovement: (movement: InventoryMovement) => void;
}) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const hasFilters = inventory.movementType !== "all" || inventory.movementPeriod !== "all" || Boolean(inventory.movementSearch.trim() || inventory.movementProductId);
  return (
    <View style={styles.body}>
      {inventory.movementProductId && inventory.detail?.item.id === inventory.movementProductId ? (
        <Text style={styles.results}>Showing movements for {inventory.detail.item.name}</Text>
      ) : null}
      <View style={styles.searchRow}>
        <SearchField
          accessibilityLabel="Search movements"
          onChangeText={inventory.setMovementSearch}
          onClear={() => inventory.setMovementSearch("")}
          placeholder="Search movements"
          returnKeyType="search"
          style={styles.searchField}
          value={inventory.movementSearch}
        />
      </View>
      <ScrollView horizontal style={styles.filterScroller} contentContainerStyle={styles.filterChips} showsHorizontalScrollIndicator={false}>
        {movementFilterOptions.map((option) => (
          <FilterChip key={option.value} label={option.label} selected={inventory.movementType === option.value} onPress={() => inventory.setMovementType(option.value)} />
        ))}
      </ScrollView>
      <ScrollView horizontal style={styles.filterScroller} contentContainerStyle={styles.filterChips} showsHorizontalScrollIndicator={false}>
        {movementPeriodOptions.map((option) => (
          <FilterChip key={option.value} label={option.label} selected={inventory.movementPeriod === option.value} onPress={() => inventory.setMovementPeriod(option.value)} />
        ))}
      </ScrollView>
      <Text style={styles.results}>{inventory.movementTotal.toLocaleString()} {inventory.movementTotal === 1 ? "movement" : "movements"}</Text>
      {inventory.movementLoading && !inventory.movementItems.length ? <LoadingContent /> : inventory.movementError && !inventory.movementItems.length ? (
        <View style={styles.errorBlock}>
          <AlertCircle color={colors.semantic.danger} size={22} />
          <Text accessibilityRole="alert" style={styles.errorCopy}>{inventory.movementError}</Text>
          <Button title="Try Again" variant="secondary" onPress={inventory.reload} />
        </View>
      ) : inventory.movementItems.length ? (
        <View style={styles.body}>
          {inventory.movementError ? <Text accessibilityRole="alert" style={styles.errorCopy}>{inventory.movementError}</Text> : null}
          {groupMovements(inventory.movementItems).map((group) => (
            <View key={group.title} style={styles.group}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <View style={styles.line} />
              <View style={styles.movementList}>
                {group.items.map((movement) => (
                  <MovementRow key={movement.id} movement={movement} onPress={() => onOpenMovement(movement)} />
                ))}
              </View>
            </View>
          ))}
          {inventory.movementHasMore ? (
            <Button title={inventory.movementLoadingMore ? "Loading…" : "Load older movements"} loading={inventory.movementLoadingMore} variant="secondary" onPress={() => void inventory.loadMoreMovements()} />
          ) : null}
        </View>
      ) : (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Search color={colors.text.muted} size={22} /></View>
          <Text style={styles.emptyTitle}>{hasFilters ? "No matching movements" : "No stock movements yet"}</Text>
          <Text style={styles.emptyCopy}>{hasFilters ? "Try changing your search or filters." : "Stock changes recorded for this store will appear here."}</Text>
          {hasFilters || inventory.movementProductId ? <Button title="Clear Filters" variant="secondary" onPress={inventory.clearMovementFilters} /> : null}
        </View>
      )}
    </View>
  );
}

export function MovementDetailContent({ inventory }: { inventory: InventoryController }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const movement = inventory.movementDetail;
  if (!movement) {
    return (
      <View style={styles.errorBlock}>
        <AlertCircle color={colors.semantic.danger} size={22} />
        <Text accessibilityRole="alert" style={styles.errorCopy}>{inventory.movementDetailError || "Movement detail couldn't be loaded."}</Text>
        <Button title="Back" variant="secondary" onPress={inventory.backFromMovementDetail} />
      </View>
    );
  }
  const isAdjustment = movement.type === "adjustment";
  const color = isAdjustment ? colors.primary[600] : movement.type === "stock_in" ? colors.semantic.success : colors.semantic.danger;
  const Icon = isAdjustment ? ArrowLeftRight : movement.type === "stock_in" ? ArrowDownToLine : ArrowUpFromLine;
  const createdAt = new Date(movement.createdAt);
  return (
    <View style={styles.body}>
      <View style={styles.detailIdentity}>
        <Text style={styles.detailName}>{movement.productName}</Text>
        <Text style={styles.technicalMeta}>{movement.sku ? `SKU: ${movement.sku}` : "No SKU"}</Text>
      </View>
      <Card style={styles.stockCard}>
        <View style={styles.stockStatusRow}>
          <Icon color={color} size={20} />
          <Text style={[styles.detailType, { color }]}>{movementTypeLabel(movement.type)}</Text>
        </View>
        <Text style={styles.detailMeta}>{Number.isNaN(createdAt.getTime()) ? movement.createdAt : createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</Text>
        <Text style={styles.detailMeta}>{Number.isNaN(createdAt.getTime()) ? "" : createdAt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}</Text>
      </Card>
      <Card style={styles.detailRows}>
        <DetailRow label="Quantity Before" value={`${movement.quantityBefore} ${movement.unit}`} />
        <DetailRow label="Change" value={`${movement.delta > 0 ? "+" : ""}${movement.delta} ${movement.unit}`} />
        <DetailRow label="Quantity After" value={`${movement.quantityAfter} ${movement.unit}`} />
        <View style={styles.line} />
        <DetailRow label="Reason" value={formatInventoryReason(movement.reason)} />
        <DetailRow label="Reference" value={movement.reference || "—"} />
        <DetailRow label="Notes" value={movement.note || "—"} />
      </Card>
      <Text style={styles.info}>This movement record cannot be edited. Create a correcting adjustment if a change is needed.</Text>
    </View>
  );
}

function MovementRow({ movement, onPress }: { movement: InventoryMovement; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createStyles);
  const color = movement.type === "stock_in" ? colors.semantic.success : movement.type === "stock_out" ? colors.semantic.danger : colors.primary[600];
  const background = movement.type === "stock_in" ? colors.semantic.successBackground : movement.type === "stock_out" ? colors.semantic.dangerBackground : colors.primary[50];
  const Icon = movement.type === "adjustment" ? ArrowLeftRight : movement.type === "stock_in" ? ArrowDownToLine : ArrowUpFromLine;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.movementRow, pressed && styles.pressed]}>
      <View style={[styles.movementIcon, { backgroundColor: background }]}><Icon color={color} size={17} /></View>
      <View style={styles.movementCopy}>
        <Text numberOfLines={1} style={styles.movementName}>{movement.productName}</Text>
        <Text numberOfLines={1} style={styles.movementMeta}>
          {movementTypeLabel(movement.type)} · {formatInventoryReason(movement.reason)} · {formatMovementDate(movement.createdAt)}
        </Text>
      </View>
      <Text style={[styles.movementAmount, { color }]}>
        {movement.delta > 0 ? "+" : ""}{movement.delta} {movement.unit}
      </Text>
    </Pressable>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const styles = useThemeStyles(createStyles);
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function FilterChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const styles = useThemeStyles(createStyles);
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}>
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

function LoadingContent() {
  const styles = useThemeStyles(createStyles);
  return <View style={styles.skeletonList}>{[0, 1, 2].map((key) => <View key={key} style={styles.skeletonRow} />)}</View>;
}

function movementTypeLabel(type: InventoryMovement["type"]) {
  if (type === "stock_in") return "Stock In";
  if (type === "stock_out") return "Stock Out";
  return "Adjustment";
}

function formatMovementDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function groupMovements(items: InventoryMovement[]) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const groups = new Map<string, InventoryMovement[]>();
  for (const item of items) {
    const date = new Date(item.createdAt);
    const title = Number.isNaN(date.getTime())
      ? "Unknown Date"
      : date.toDateString() === today.toDateString()
        ? "Today"
        : date.toDateString() === yesterday.toDateString()
          ? "Yesterday"
          : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    const existing = groups.get(title);
    if (existing) existing.push(item);
    else groups.set(title, [item]);
  }
  return [...groups].map(([title, groupItems]) => ({ title, items: groupItems }));
}
