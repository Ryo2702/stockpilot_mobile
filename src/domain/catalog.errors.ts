export class CatalogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ProductNotFoundError extends CatalogError {
  constructor() {
    super("This item is no longer available in the selected store.");
  }
}

export class StoreNotFoundError extends CatalogError {
  constructor() {
    super("The selected store could not be found.");
  }
}

export class DuplicateSkuError extends CatalogError {
  constructor() {
    super("This SKU is already used in this store.");
  }
}

export class DuplicateBarcodeError extends CatalogError {
  constructor() {
    super("This barcode is already assigned to another item in this store.");
  }
}

export class InvalidCatalogInputError extends CatalogError {
  constructor(message: string) {
    super(message);
  }
}
