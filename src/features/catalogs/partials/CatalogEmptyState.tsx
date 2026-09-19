import { Plus } from "lucide-react-native";
import { Image, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { colors, spacing, typography } from "@/theme";

const boxMascot = require("../../../../assets/images/stockpilot/empty state png/box.png");
const searchMascot = require("../../../../assets/images/stockpilot/empty state png/search.png");
const archiveMascot = require("../../../../assets/images/stockpilot/empty state png/archive.png");

type CatalogEmptyStateProps = {
  archived: boolean;
  filtered: boolean;
  onAddProduct: () => void;
  onImportInventory: () => void;
};

export default function CatalogEmptyState({
  archived,
  filtered,
  onAddProduct,
  onImportInventory,
}: CatalogEmptyStateProps) {
  const image = archived ? archiveMascot : filtered ? searchMascot : boxMascot;

  return (
    <View style={styles.empty}>
      <Image accessible={false} source={image} resizeMode="contain" style={styles.image} />
      <Text style={styles.title}>
        {archived ? "No archived products" : filtered ? "No matching products" : "No products yet"}
      </Text>
      <Text style={styles.copy}>
        {archived
          ? "Archived products will appear here and can be restored."
          : filtered
            ? "Try changing your search or filters."
            : "Start building this store's catalog by adding your first product."}
      </Text>
      {!archived && !filtered ? (
        <View style={styles.actions}>
          <Button title="Add Product" icon={Plus} onPress={onAddProduct} />
          <Button title="Import Inventory" variant="secondary" onPress={onImportInventory} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    padding: spacing[8],
  },
  image: {
    width: 148,
    height: 148,
    backgroundColor: colors.background.surface,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
    textAlign: "center",
  },
  copy: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: "center",
  },
  actions: {
    width: "100%",
    gap: spacing[2],
  },
});
