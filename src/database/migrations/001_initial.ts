import { DB_TABLES_SCHEMA } from "../db_schema";
import type { DatabaseExecutor, Migration } from "../migrate";

export const initialMigration: Migration = {
  version: 1,
  name: "initial",
  up(db: DatabaseExecutor) {
    return db.execAsync(DB_TABLES_SCHEMA);
  },
};
