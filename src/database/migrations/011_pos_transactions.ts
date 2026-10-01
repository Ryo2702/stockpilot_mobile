import { posTransactionsSchema } from "../schema/pos_transactions";
import type { DatabaseExecutor, Migration } from "../migrate";

export const posTransactionsMigration: Migration = {
  version: 11,
  name: "pos_transactions",
  up(db: DatabaseExecutor) {
    return db.execAsync(posTransactionsSchema);
  },
};
