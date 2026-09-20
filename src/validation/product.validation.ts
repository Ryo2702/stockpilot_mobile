import { z } from "zod";

import { catalogCategoryValues } from "@/domain/catalog";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.trim() || undefined : value),
    z.string().max(max).optional(),
  );

const skuSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toUpperCase() || undefined : value),
  z.string().max(64, "SKU must be 64 characters or fewer.").optional(),
);

const unitSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() || "ea" : value),
  z.string().min(1, "Enter a unit.").max(32, "Unit must be 32 characters or fewer."),
);

const nonNegativeInteger = z.preprocess(
  (value) => (value === "" || value === undefined ? 0 : value),
  z.coerce.number().int().min(0, "Enter 0 or more.").max(Number.MAX_SAFE_INTEGER),
);

const requiredQuantity = z.preprocess(
  (value) => (value === "" || value === undefined ? undefined : value),
  z.coerce.number().int().min(0, "Quantity cannot be negative.").max(Number.MAX_SAFE_INTEGER),
);

const currentPrice = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().replace(",", ".") || null : value),
  z.coerce.number().finite().min(0, "Price cannot be negative.").max(Number.MAX_SAFE_INTEGER).nullable().optional(),
);

const productFields = {
  name: z
    .string()
    .trim()
    .min(1, "Product name is required.")
    .max(120, "Product names must be 120 characters or fewer.")
    .transform((value) => value.replace(/\s+/g, " ")),
  sku: skuSchema,
  barcode: optionalText(128),
  category: z.enum(catalogCategoryValues),
  unit: unitSchema,
  currentPrice,
  reorderLevel: nonNegativeInteger,
  criticalLevel: nonNegativeInteger,
  notes: optionalText(500),
};

function validateCriticalLevel(
  product: { criticalLevel: number; reorderLevel: number },
  context: z.RefinementCtx,
) {
  if (product.criticalLevel > product.reorderLevel) {
    context.addIssue({
      code: "custom",
      path: ["criticalLevel"],
      message: "Critical level cannot exceed reorder level.",
    });
  }
}

export const createProductSchema = z
  .object({ ...productFields, initialQuantity: requiredQuantity })
  .superRefine(validateCriticalLevel);

export const updateProductSchema = z.object(productFields).superRefine(validateCriticalLevel);

type ProductInput<T> = Omit<T, "currentPrice"> & { currentPrice?: number | string | null };

export type CreateProductInput = ProductInput<z.infer<typeof createProductSchema>>;
export type UpdateProductInput = ProductInput<z.infer<typeof updateProductSchema>>;
