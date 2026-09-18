import { businessesSchema } from "./schema/businesses";
import { catalogsSchema } from "./schema/catalogs";
import { insightSnapshotsSchema } from "./schema/insight_snapshots";
import { inventorySchema } from "./schema/inventory";
import { schemaMigrationsSchema } from "./schema/schema_migrations";
import { settingsSchema } from "./schema/settings";
import { stockMovementsSchema } from "./schema/stock_movements";
import { storesIndexesSchema, storesSchema } from "./schema/stores";
import { storeSettingsSchema } from "./schema/store_settings";

export const DB_TABLES_SCHEMA = [
  businessesSchema,
  storesSchema,
  storeSettingsSchema,
  catalogsSchema,
  inventorySchema,
  stockMovementsSchema,
  settingsSchema,
  insightSnapshotsSchema,
].join("\n\n");

export const DB_SCHEMA = [
  "PRAGMA foreign_keys = ON;",
  "PRAGMA journal_mode = WAL;",
  schemaMigrationsSchema,
  DB_TABLES_SCHEMA,
  storesIndexesSchema,
].join("\n\n");
