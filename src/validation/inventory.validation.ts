import { z } from "zod";

import { inventorySortValues } from "@/domain/inventory";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.trim() || undefined : value),
    z.string().max(max, `Use ${max} characters or fewer.`).optional(),
  );

const quantitySchema = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.coerce.number().int("Enter a whole number.").min(0, "Quantity cannot be negative.").max(Number.MAX_SAFE_INTEGER),
);

export const stockAdjustmentTypes = ["stock_in", "stock_out", "set_current_stock"] as const;

const stockInReasons = [
  "purchase",
  "supplier_delivery",
  "returned_item",
  "correction",
  "opening_stock",
  "other",
] as const;
const stockOutReasons = ["sale", "damaged", "expired", "lost", "internal_use", "correction", "other"] as const;
const countReasons = ["physical_count", "correction"] as const;

export const stockAdjustmentSchema = z
  .object({
    type: z.enum(stockAdjustmentTypes),
    quantity: quantitySchema,
    reason: z.string().trim().min(1, "Choose a reason.").max(40),
    reference: optionalText(100),
    note: optionalText(500),
  })
  .superRefine((value, context) => {
    const reasons: readonly string[] = value.type === "stock_in"
      ? stockInReasons
      : value.type === "stock_out"
        ? stockOutReasons
        : countReasons;
    if (!reasons.includes(value.reason)) {
      context.addIssue({ code: "custom", path: ["reason"], message: "Choose a valid reason for this action." });
    }
    if (value.type !== "set_current_stock" && value.quantity === 0) {
      context.addIssue({ code: "custom", path: ["quantity"], message: "Enter a quantity greater than zero." });
    }
  });

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;

export const inventoryPreferencesSchema = z.object({
  defaultSort: z.enum(inventorySortValues),
  defaultReorderLevel: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).optional(),
  defaultUnit: z.string().trim().min(1).max(32).optional(),
});
