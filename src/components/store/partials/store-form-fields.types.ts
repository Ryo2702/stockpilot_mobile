import type { StoreErrors, StoreFieldChange, StoreForm } from "../store.types";

export type StoreFormFieldsProps = {
  storeForm: StoreForm;
  storeErrors: StoreErrors;
  onStoreFieldChange: StoreFieldChange;
  allowCustomCurrency?: boolean;
};
