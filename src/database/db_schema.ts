import { businessesSchema } from "./schema/businesses";
import { insightSnapshotsSchema } from "./schema/insight_snapshots";
import { inventorySchema } from "./schema/inventory";
import { productsSchema } from "./schema/products";
import { schemaMigrationsSchema } from "./schema/schema_migrations";
import { settingsSchema } from "./schema/settings";
import { stockMovementsSchema } from "./schema/stock_movements";
import { storesSchema } from "./schema/stores";

export const DB_SCHEMA = [
  "PRAGMA foreign_keys = ON;",
  "PRAGMA journal_mode = WAL;",
  schemaMigrationsSchema,
  businessesSchema,
  storesSchema,
  productsSchema,
  inventorySchema,
  stockMovementsSchema,
  settingsSchema,
  insightSnapshotsSchema,
].join("\n\n");
