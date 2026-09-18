import { initialMigration } from "./001_initial";
import { expandStoresMigration } from "./002_expand_stores";

export const migrations = [initialMigration, expandStoresMigration];
