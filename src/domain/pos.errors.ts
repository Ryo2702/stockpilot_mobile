export type PosErrorCode =
  | "EMPTY_CART"
  | "PRODUCT_NOT_FOUND"
  | "PRODUCT_PRICE_MISSING"
  | "TRANSACTION_NOT_FOUND"
  | "INVALID_CART";

export class PosError extends Error {
  constructor(public readonly code: PosErrorCode, message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class EmptyCartError extends PosError {
  constructor() {
    super("EMPTY_CART", "Add at least one product before checkout.");
  }
}

export class PosProductNotFoundError extends PosError {
  constructor() {
    super("PRODUCT_NOT_FOUND", "This product is no longer active in the selected store.");
  }
}

export class ProductPriceMissingError extends PosError {
  constructor() {
    super("PRODUCT_PRICE_MISSING", "Set a selling price before selling this product.");
  }
}

export class PosTransactionNotFoundError extends PosError {
  constructor() {
    super("TRANSACTION_NOT_FOUND", "This receipt is no longer available.");
  }
}

export class InvalidCartError extends PosError {
  constructor() {
    super("INVALID_CART", "Cart quantities must be whole numbers greater than zero.");
  }
}
