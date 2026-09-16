import { z } from "zod";

export const storeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Store name is required")
    .max(50, "Store name must be less than 50 characters")
    .transform((value) => value.replace(/\s+/g, " ")),
});

export type StoreSchema = z.infer<typeof storeSchema>;
