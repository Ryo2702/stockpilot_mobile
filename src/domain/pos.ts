import type { CurrencySettings } from "./currency";
import type { Product } from "./product";

export type PosProduct = Product & { costPrice: number | null };

export type PosCartItem = Omit<PosProduct, "quantity"> & {
  availableQuantity: number;
  quantity: number;
  lineTotal: number;
};

export type PosTransactionItem = {
  id: string;
  productId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  unitCost: number | null;
  unitPrice: number;
  lineTotal: number;
};

export type PosTransaction = {
  id: string;
  businessName: string;
  storeName: string;
  storeAddress: string | null;
  receiptNumber: string;
  subtotal: number;
  total: number;
  createdAt: string;
  currency: CurrencySettings;
  items: PosTransactionItem[];
};

export type PosTransactionSummary = {
  id: string;
  receiptNumber: string;
  subtotal: number;
  total: number;
  createdAt: string;
  itemCount: number;
  totalItems: number;
};
