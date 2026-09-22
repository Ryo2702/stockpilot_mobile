import type { SQLiteDatabase } from "expo-sqlite";

import type { CatalogCategory } from "@/domain/catalog";
import type { ProductSort, ProductStockFilter } from "@/domain/product";

export type CatalogExecutor = Pick<SQLiteDatabase, "getAllAsync" | "getFirstAsync" | "runAsync">;
export type CatalogDatabase = CatalogExecutor & Pick<SQLiteDatabase, "withTransactionAsync">;

export type ProductQuery = {
  search?: string;
  category?: CatalogCategory | null;
  stockStatus?: ProductStockFilter;
  sort?: ProductSort;
  archived?: boolean;
  limit?: number;
  offset?: number;
};
