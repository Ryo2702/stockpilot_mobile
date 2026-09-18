import { initialMigration } from "./001_initial";
import { expandStoresMigration } from "./002_expand_stores";
import { renameProductsMigration } from "./003_rename_products_to_catalogs";

export const migrations = [initialMigration, expandStoresMigration, renameProductsMigration];
