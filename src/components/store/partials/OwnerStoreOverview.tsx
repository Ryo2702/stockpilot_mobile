import { Boxes, PackageOpen, Store } from "lucide-react-native";
import { Image, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { BottomNavKey } from "@/components/ui/BottomNavigation";
import type {
  OwnerStore,
  OwnerStoreDetails,
  OwnerStoreOverview as OwnerStoreOverviewData,
} from "@/services/owner-store.service";
import { useTheme, useThemeStyles } from "@/theme/ThemeProvider";

import { storeTypeOptions } from "../store.data";
import { createOwnerStoreStyles } from "./owner-store.styles";

const emptyStockMascot = require("../../../../assets/images/stockpilot/empty state png/empty.png");

type OwnerStoreOverviewProps = {
  ownerStore: OwnerStore;
  storeDetails: OwnerStoreDetails | null;
  overview: OwnerStoreOverviewData | null;
  onNavigate?: (key: BottomNavKey) => void;
};

export default function OwnerStoreOverview({
  ownerStore,
  storeDetails,
  overview,
  onNavigate,
}: OwnerStoreOverviewProps) {
  const { colors } = useTheme();
  const styles = useThemeStyles(createOwnerStoreStyles);
  const storeTypeLabel = storeDetails
    ? storeDetails.storeType === "other"
      ? storeDetails.customStoreType
      : storeTypeOptions.find(({ value }) => value === storeDetails.storeType)?.label
    : null;
  const currencyLabel =
    storeDetails?.currencyMode === "custom"
      ? `${storeDetails.customCurrencySymbol} ${storeDetails.customCurrencyName}`
      : storeDetails?.currencyCode;
  const address = storeDetails
    ? [
        storeDetails.addressLine1,
        storeDetails.addressLine2,
        storeDetails.barangay,
        storeDetails.city,
        storeDetails.provinceState,
        storeDetails.postalCode,
        storeDetails.countryCode,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <>
      <Card variant="selected" style={styles.storeCard}>
        <View style={styles.storeHeader}>
          <View style={styles.storeIcon}>
            <Store color={colors.primary[600]} size={24} strokeWidth={2} />
          </View>
          <View style={styles.storeCopy}>
            <Text style={styles.cardLabel}>
              Current store
            </Text>
            <Text style={styles.storeName}>
              {ownerStore.storeName}
            </Text>
          </View>
        </View>
        <Text style={styles.cardDescription}>
          Your store is ready. Add products to start managing inventory.
        </Text>
        {storeDetails ? (
          <View style={styles.storeDetails}>
            <Text style={styles.storeDetailText}>
              {storeTypeLabel} · {currencyLabel}
            </Text>
            {storeDetails.code ? (
              <Text style={styles.storeDetailText}>Code · {storeDetails.code}</Text>
            ) : null}
            {address ? <Text style={styles.storeDetailText}>{address}</Text> : null}
          </View>
        ) : null}
      </Card>

      {overview?.productCount === 0 ? (
        <View style={styles.stockHealth}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Stock Health
            </Text>
          </View>
          <Card style={styles.stockHealthEmpty}>
            <Image
              accessible={false}
              source={emptyStockMascot}
              resizeMode="contain"
              style={styles.stockHealthImage}
            />
            <Text style={styles.stockHealthCopy}>
              Add a product to start tracking stock.
            </Text>
            <Button title="Add Product" onPress={() => onNavigate?.("catalog")} />
          </Card>
        </View>
      ) : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Store overview
        </Text>
        <Text style={styles.sectionHint}>
          For {ownerStore.storeName}
        </Text>
      </View>
      <View style={styles.overviewRow}>
        <Card style={styles.overviewCard}>
          <PackageOpen color={colors.primary[600]} size={22} />
          <Text style={styles.overviewValue}>
            {overview?.productCount ?? "—"}
          </Text>
          <Text style={styles.overviewLabel}>
            Products
          </Text>
        </Card>
        <Card style={styles.overviewCard}>
          <Boxes color={colors.semantic.warning} size={22} />
          <Text style={styles.overviewValue}>
            {overview?.itemsInStock ?? "—"}
          </Text>
          <Text style={styles.overviewLabel}>
            Items in stock
          </Text>
        </Card>
      </View>
    </>
  );
}
