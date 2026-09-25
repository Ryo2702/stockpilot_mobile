import { describe, expect, test } from "@jest/globals";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";

import { DB_SCHEMA } from "../src/database/db_schema";
import {
  createOwnerStore,
  createStoreForBusiness,
  getOwnerStore,
  getOwnerStoreOverview,
  getOwnerStores,
  type OwnerStoreDatabase,
} from "../src/services/owner-store.service";

function createDatabase() {
  const database = new DatabaseSync(":memory:");
  database.exec(DB_SCHEMA);

  const db = {
    getFirstAsync: async <T>(source: string, ...params: SQLInputValue[]) =>
      (database.prepare(source).get(...params) as T | undefined) ?? null,
    getAllAsync: async <T>(source: string, ...params: SQLInputValue[]) =>
      database.prepare(source).all(...params) as T[],
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

  test("persists the completed store setup fields", async () => {
    const { database, db } = createDatabase();

    try {
      await createOwnerStore(db, "Maria", {
        name: "Main Store",
        code: "MAIN-01",
        storeType: "other",
        customStoreType: "Boutique",
        currencyMode: "custom",
        currencyCode: "PHP",
        customCurrencyName: "Credits",
        customCurrencySymbol: "¤",
        currencyDecimalPlaces: 0,
        addressLine1: "1 Main Street",
        addressLine2: "Unit 2",
        barangay: "Central",
        city: "Manila",
        provinceState: "Metro Manila",
        postalCode: "1000",
        countryCode: "PH",
        status: "active",
      });

      expect(
        database
          .prepare(
            `SELECT code, store_type, custom_store_type, currency_mode, currency_code,
              custom_currency_name, custom_currency_symbol, currency_decimal_places,
              address_line_1, address_line_2, barangay, city, province_state, postal_code,
              country_code, status
             FROM stores`,
          )
          .get(),
      ).toEqual({
        code: "MAIN-01",
        store_type: "other",
        custom_store_type: "Boutique",
        currency_mode: "custom",
        currency_code: null,
        custom_currency_name: "Credits",
        custom_currency_symbol: "¤",
        currency_decimal_places: 0,
        address_line_1: "1 Main Street",
        address_line_2: "Unit 2",
        barangay: "Central",
        city: "Manila",
        province_state: "Metro Manila",
        postal_code: "1000",
        country_code: "PH",
        status: "active",
      });
    } finally {
      database.close();
    }
  });

  test("loads all stores for the store switcher", async () => {
    const { database, db } = createDatabase();

    try {
      const mainStore = await createOwnerStore(db, "Maria", "Main Store");
      const businessId = database.prepare("SELECT id FROM businesses").get() as { id: string };

      const backRoom = await createStoreForBusiness(db, businessId.id, {
        name: "Back Room",
        code: "BACK-01",
        storeType: "warehouse",
        currencyMode: "iso",
        currencyCode: "USD",
        currencyDecimalPlaces: 0,
        status: "active",
      });

      expect(
        database.prepare("SELECT code, store_type, currency_code FROM stores WHERE id = ?").get(backRoom.storeId),
      ).toEqual({ code: "BACK-01", store_type: "warehouse", currency_code: "USD" });

      database
        .prepare(
          `INSERT INTO products (id, business_id, store_id, name, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
        )
        .run("product-main", businessId.id, mainStore.storeId, "Main product", "now", "now");
      database
        .prepare(
          `INSERT INTO inventory (product_id, business_id, store_id, quantity, updated_at)
           VALUES (?, ?, ?, ?, ?)`,
        )
        .run("product-main", businessId.id, mainStore.storeId, 4, "now");

      expect((await getOwnerStores(db)).map(({ storeName }) => storeName)).toEqual(["Main Store", "Back Room"]);
      expect(await getOwnerStoreOverview(db, businessId.id, mainStore.storeId)).toMatchObject({
        productCount: 1,
        itemsInStock: 4,
      });
      expect(await getOwnerStoreOverview(db, businessId.id, backRoom.storeId)).toMatchObject({
        productCount: 0,
        itemsInStock: 0,
      });
    } finally {
      database.close();
    }
  });
});
