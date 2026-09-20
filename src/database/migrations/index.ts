import { initialMigration } from "./001_initial";
import { expandStoresMigration } from "./002_expand_stores";
import { productsDomainMigration } from "./003_products_domain_compatibility";
import { catalogCategoriesMigration } from "./004_catalog_categories";
import { restoreProductsTableMigration } from "./005_restore_products_table";
import { productMetadataMigration } from "./006_product_metadata";
import { productCurrentPriceMigration } from "./007_product_current_price";
import { inventoryMovementsMigration } from "./008_inventory_movements";
import { storeTypesMigration } from "./009_store_types";

export const migrations = [
  initialMigration,
  expandStoresMigration,
  productsDomainMigration,
  catalogCategoriesMigration,
  restoreProductsTableMigration,
  productMetadataMigration,
  productCurrentPriceMigration,
  inventoryMovementsMigration,
  storeTypesMigration,
];
