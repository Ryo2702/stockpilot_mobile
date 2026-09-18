import { describe, expect, test } from "@jest/globals";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

import { DB_SCHEMA } from "../src/database/db_schema";
import {
  createOwnerStore,
  getOwnerStore,
  type OwnerStoreDatabase,
} from "../src/services/owner-store.service";

function createDatabase() {
  const database = new DatabaseSync(":memory:");
  database.exec(DB_SCHEMA);

  const db = {
    getFirstAsync: async <T>(source: string, ...params: SQLInputValue[]) =>
      (database.prepare(source).get(...params) as T | undefined) ?? null,
    runAsync: async (source: string, ...params: SQLInputValue[]) => {
      database.prepare(source).run(...params);
    },
    withTransactionAsync: async (task: () => Promise<void>) => {
      database.exec("BEGIN");
      try {
        await task();
        database.exec("COMMIT");
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },
  } as unknown as OwnerStoreDatabase;

  return { database, db };
}

describe("owner store service", () => {
  test("creates once and loads the saved owner store", async () => {
    const { database, db } = createDatabase();

    try {
      const created = await createOwnerStore(db, "Maria", "Main Store");

      expect(await getOwnerStore(db)).toEqual(created);
      expect(await createOwnerStore(db, "Someone Else", "Another Store")).toEqual(created);
    } finally {
      database.close();
    }
  });
});
