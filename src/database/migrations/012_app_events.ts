import { appEventsSchema } from "../schema/app_events";
import type { DatabaseExecutor, Migration } from "../migrate";

export const appEventsMigration: Migration = {
  version: 12,
  name: "app_events",
  up(db: DatabaseExecutor) {
    return db.execAsync(appEventsSchema);
  },
};
