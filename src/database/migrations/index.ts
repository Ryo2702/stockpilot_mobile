import { initialMigration } from "./001_initial";
import { expandStoresMigration } from "./002_expand_stores";
import { productsDomainMigration } from "./003_products_domain_compatibility";
import { catalogCategoriesMigration } from "./004_catalog_categories";
import { restoreProductsTableMigration } from "./005_restore_products_table";
import { productMetadataMigration } from "./006_product_metadata";

export const migrations = [
  initialMigration,
  expandStoresMigration,
  productsDomainMigration,
  catalogCategoriesMigration,
  restoreProductsTableMigration,
  productMetadataMigration,
];
