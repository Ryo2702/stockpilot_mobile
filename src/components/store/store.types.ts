import type { StoreSchema } from "@/validation/store.validation";

export type StoreForm = Partial<StoreSchema>;

export type StoreErrors = Partial<Record<keyof StoreSchema | "form", string>>;

export type StoreFieldChange = <K extends keyof StoreSchema>(
  field: K,
  value: StoreSchema[K],
) => void;
