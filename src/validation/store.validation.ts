import { z } from "zod";

export const ownerNameSchema = z
  .string()
  .trim()
  .min(2, "Please enter your name.")
  .max(50, "Keep your name under 50 characters.");

export const storeTypeValues = [
  "retail",
  "grocery",
  "convenience",
  "pharmacy",
  "hardware",
  "apparel",
  "electronics",
  "food_beverage",
  "wholesale",
  "warehouse",
  "other",
] as const;

export const currencyModeValues = ["iso", "custom"] as const;
export const storeStatusValues = ["active", "archived"] as const;

export type StoreType = (typeof storeTypeValues)[number];
export type CurrencyMode = (typeof currencyModeValues)[number];

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

const optionalUppercase = (pattern: RegExp, message: string) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.trim().toUpperCase() || undefined : value),
    z.string().regex(pattern, message).optional(),
  );

export const storeSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "Store name is required")
      .max(50, "Store name must be less than 50 characters")
      .transform((value) => value.replace(/\s+/g, " ")),
    code: optionalText(30),
    storeType: z.enum(storeTypeValues).default("retail"),
    customStoreType: optionalText(50),
    currencyMode: z.enum(currencyModeValues).default("iso"),
    currencyCode: optionalUppercase(/^[A-Z]{3}$/, "Use a 3-letter currency code.").default("PHP"),
    customCurrencyName: optionalText(50),
    customCurrencySymbol: optionalText(10),
    currencyDecimalPlaces: z.coerce.number().int().min(0).max(4).default(2),
    addressLine1: optionalText(120),
    addressLine2: optionalText(120),
    barangay: optionalText(80),
    city: optionalText(80),
    provinceState: optionalText(80),
    postalCode: optionalText(20),
    countryCode: optionalUppercase(/^[A-Z]{2}$/, "Use a 2-letter country code.").default("PH"),
    status: z.enum(storeStatusValues).default("active"),
  })
  .superRefine((store, context) => {
    if (store.storeType === "other" && !store.customStoreType) {
      context.addIssue({
        code: "custom",
        path: ["customStoreType"],
        message: "Describe your store type.",
      });
    }

    if (store.currencyMode === "custom") {
      if (!store.customCurrencyName) {
        context.addIssue({
          code: "custom",
          path: ["customCurrencyName"],
          message: "Enter a custom currency name.",
        });
      }
      if (!store.customCurrencySymbol) {
        context.addIssue({
          code: "custom",
          path: ["customCurrencySymbol"],
          message: "Enter a custom currency symbol.",
        });
      }
    }
  });

export type StoreSchema = z.infer<typeof storeSchema>;
export type StoreInput = z.input<typeof storeSchema>;
