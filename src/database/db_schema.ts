import { businessesSchema } from "./schema/businesses";
import { insightSnapshotsSchema } from "./schema/insight_snapshots";
import { inventorySchema } from "./schema/inventory";
import { productsSchema } from "./schema/products";
import { posTransactionsSchema } from "./schema/pos_transactions";
import { schemaMigrationsSchema } from "./schema/schema_migrations";
import { settingsSchema } from "./schema/settings";
import { stockMovementsSchema } from "./schema/stock_movements";
import { storesIndexesSchema, storesSchema } from "./schema/stores";
import { storeSettingsSchema } from "./schema/store_settings";

export const DB_TABLES_SCHEMA = [
  businessesSchema,
  storesSchema,
  storeSettingsSchema,
  productsSchema,
  inventorySchema,
  stockMovementsSchema,
  posTransactionsSchema,
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
