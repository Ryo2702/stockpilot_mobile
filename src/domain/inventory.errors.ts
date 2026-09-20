export type InventoryErrorCode =
  | "INVENTORY_STORE_NOT_FOUND"
  | "INVENTORY_ITEM_NOT_FOUND"
  | "INVENTORY_MOVEMENT_NOT_FOUND"
  | "INVALID_STOCK_ADJUSTMENT"
  | "INVALID_INVENTORY_PREFERENCE"
  | "INSUFFICIENT_STOCK"
  | "NO_STOCK_CHANGE";

export class InventoryError extends Error {
  constructor(
    public readonly code: InventoryErrorCode,
    message: string,
    public readonly currentStock?: number,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InventoryStoreNotFoundError extends InventoryError {
  constructor() {
    super("INVENTORY_STORE_NOT_FOUND", "The selected store is no longer available.");
  }
}

export class InventoryItemNotFoundError extends InventoryError {
  constructor() {
    super("INVENTORY_ITEM_NOT_FOUND", "This product is not active in the selected store.");
  }
}

export class InventoryMovementNotFoundError extends InventoryError {
  constructor() {
    super("INVENTORY_MOVEMENT_NOT_FOUND", "This stock movement isn't available in the selected store.");
  }
}

export class InvalidStockAdjustmentError extends InventoryError {
  constructor(message: string) {
    super("INVALID_STOCK_ADJUSTMENT", message);
  }
}

export class InvalidInventoryPreferenceError extends InventoryError {
  constructor() {
    super("INVALID_INVENTORY_PREFERENCE", "Choose a valid default sort.");
  }
}

export class InsufficientStockError extends InventoryError {
  constructor(currentStock: number) {
    super("INSUFFICIENT_STOCK", `Only ${currentStock} units are currently available.`, currentStock);
  }
}

export class NoStockChangeError extends InventoryError {
  constructor() {
    super("NO_STOCK_CHANGE", "The counted quantity matches current stock. No movement was recorded.");
  }
}
