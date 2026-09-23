export type StoreScope = {
  businessId: string;
  storeId: string;
};

export type NamedStoreScope = StoreScope & {
  storeName: string;
};
