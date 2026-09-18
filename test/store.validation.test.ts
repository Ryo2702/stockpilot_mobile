import { describe, expect, test } from "@jest/globals";

import { storeSchema } from "../src/validation/store.validation";

describe("store validation", () => {
  test("normalizes defaults and enforces structural conditional fields", () => {
    expect(storeSchema.parse({ name: "  Main   Store " })).toMatchObject({
      name: "Main Store",
      storeType: "retail",
      currencyMode: "iso",
      currencyCode: "PHP",
      currencyDecimalPlaces: 2,
      countryCode: "PH",
      status: "active",
    });

    expect(storeSchema.safeParse({ name: "Main Store", storeType: "other" }).success).toBe(false);
    expect(
      storeSchema.safeParse({
        name: "Main Store",
        currencyMode: "custom",
        customCurrencyName: "Credits",
        customCurrencySymbol: "¤",
      }).success,
    ).toBe(true);
  });
});
