import type { SQLiteDatabase } from "expo-sqlite";

export type InventoryFileImportExecutor = Pick<
  SQLiteDatabase,
  "getAllAsync" | "getFirstAsync" | "runAsync"
>;

export type InventoryFileImportDatabase = InventoryFileImportExecutor & Pick<
  SQLiteDatabase,
  "withTransactionAsync" | "withExclusiveTransactionAsync"
>;

export const supportedInventoryFileExtensions = ["xlsx", "xls", "docx", "txt", "csv"] as const;
export type InventoryFileType = (typeof supportedInventoryFileExtensions)[number];

export const inventoryFileImportFields = [
  "name",
  "quantity",
  "costPrice",
  "sellingPrice",
  "sku",
  "barcode",
  "category",
  "unit",
  "ignore",
] as const;
export type InventoryFileImportField = (typeof inventoryFileImportFields)[number];

export const inventoryFileImportFieldLabels: Record<InventoryFileImportField, string> = {
  name: "Product Name",
  quantity: "Quantity",
  costPrice: "Cost Price",
  sellingPrice: "Selling Price",
  sku: "SKU",
  barcode: "Barcode",
  category: "Category",
  unit: "Unit",
  ignore: "Ignore Column",
};

export type InventoryFileImportSource = {
  fileName: string;
  fileSize: number | null;
  content: string | Uint8Array;
};

export type InventoryFileImportFieldMapping = {
  column: number;
  label: string;
  field: InventoryFileImportField;
};

export type InventoryFileImportIssueCode =
  | "missing_required_field"
  | "invalid_quantity"
  | "invalid_price"
  | "duplicate_sku"
  | "duplicate_barcode"
  | "possible_match"
  | "needs_review";

export type InventoryFileImportStatus =
  | "ready"
  | "existing_product"
  | InventoryFileImportIssueCode;

export type InventoryFileImportIssue = {
  code: InventoryFileImportIssueCode;
  message: string;
};

export type ExistingInventoryFileProduct = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  quantity: number;
  match: "barcode" | "sku" | "name";
  isActive: boolean;
};

export type InventoryFileImportProduct = {
  id: string;
  rowNumber: number;
  name: string;
  sku: string;
  barcode: string;
  quantity: string;
  costPrice: string;
  sellingPrice: string;
  category: string;
  unit: string;
  status: InventoryFileImportStatus;
  issues: InventoryFileImportIssue[];
  existing: ExistingInventoryFileProduct | null;
  approveExisting: boolean;
  canImport: boolean;
};

export type InventoryFileImportSourceRecord = {
  id: string;
  rowNumber: number;
  values: string[];
};

export type InventoryFileImportReview = {
  fileName: string;
  fileType: InventoryFileType;
  fileSize: number | null;
  detectedCount: number;
  columns: string[];
  mapping: InventoryFileImportFieldMapping[];
  sourceRecords: InventoryFileImportSourceRecord[];
  rows: InventoryFileImportProduct[];
  readyCount: number;
  existingCount: number;
  needsReviewCount: number;
  fingerprint: string;
};

export type InventoryFileImportProgress = {
  phase: "reading" | "preparing" | "importing";
  processed: number;
  total: number;
};

export type InventoryFileImportResult = {
  importedCount: number;
  createdProductCount: number;
  updatedProductCount: number;
  remainingReviewCount: number;
};

export type ExistingInventoryFileProductRecord = {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  quantity: number;
  isActive: number;
};

export type InventoryFileImportMetadata = Pick<
  InventoryFileImportReview,
  "fileName" | "fileType" | "fileSize" | "columns" | "mapping" | "sourceRecords"
>;

export type ParsedInventoryFile = {
  columns: string[];
  records: string[][];
  positional: boolean;
};
