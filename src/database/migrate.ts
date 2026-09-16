import { DB_SCHEMA } from "./db_schema";

export type DatabaseExecutor = {
  execAsync: (source: string) => Promise<void>;
};

export async function migrate(db: DatabaseExecutor) {
  await db.execAsync(DB_SCHEMA);
}
