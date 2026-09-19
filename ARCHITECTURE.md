# StockPilot Mobile Architecture

## Source of truth

This mobile architecture replaces the former web SaaS/subscription foundation. StockPilot is an offline-first, local-only Expo application.

## Runtime boundaries

- **Expo Router (`src/app`)**: routes and layouts only.
- **Features (`src/features`)**: feature-specific UI adapters/hooks. No domain mutations in screens.
- **Services (`src/services`)**: all business rules and write workflows.
- **Database (`src/database`)**: SQLite connection, migrations, repositories/helpers.
- **Validation (`src/validation`)**: input validation before services write.
- **Domain (`src/domain`)**: domain types, typed errors, pure rules.
- **Purchases (`src/purchases`)**: RevenueCat adapter and centralized feature gate.

## Local persistence

`expo-sqlite` is the operational source of truth. Enable foreign keys and WAL at database initialization. All schema changes are versioned migrations recorded in `schema_migrations`.

`expo-secure-store` is reserved for small sensitive or security-relevant values such as the RevenueCat last-verified lifetime entitlement cache. It is not a replacement for SQLite and must not contain inventory data.

## Store isolation

Every store-scoped write receives a `storeId`; services verify that referenced products belong to that store before mutation. SQL queries never accept an unverified cross-store product/store pairing. Tables carry store ownership explicitly, and foreign keys reinforce it.

There is no global mutable "current inventory" shared between stores. Changing the selected store only changes the query context.

## Catalog feature

`src/features/catalogs` owns the Catalog screens and their presentation components. Catalog is the store's product collection; Product remains the domain record and SQLite row in `products`. `CatalogService` reads and writes products scoped by both business and store IDs. Archive and restore preserve product IDs, inventory rows, and stock movement history.

Category selectors consume the active store's category options. Search, stock status, category, archive, pagination, and sort filters run in store-scoped product queries. Product creation writes the product, inventory row, and initial stock movement in one transaction; metadata edits never change current stock.

The Camera action and product form use `expo-camera` to scan barcodes and QR codes. The camera preview mounts only while the scanner is open.

## Stock transaction boundary

All quantity changes go through `StockService.adjustStock()` or a higher-level service that calls it. The workflow uses `withExclusiveTransactionAsync`:

1. Load the product + inventory row for the requested store.
2. Reject missing or mismatched store/product references.
3. Calculate the next quantity.
4. Reject any result below zero.
5. Update inventory.
6. Append the immutable stock movement row.
7. Commit together or roll back together.

Screens never update `inventory` directly.

## Feature gating

Feature access is decided only by `FeatureGate`. Screens can ask for access, but cannot infer purchase state themselves. The only paid entitlement identifier is:

`stockpilot_lifetime`

## Testing foundation

Use `jest-expo` for the Expo test environment. Domain rules are written as pure functions where possible so stock health can be tested without native modules. Database integration tests can inject a test database adapter and validate migration ordering and transactional behavior.

## Folder structure

```text
src/
  app/
    _layout.tsx
    index.tsx
  database/
    db.ts
    migrate.ts
    migrations/
      001_initial.ts
      003_products_domain_compatibility.ts
      004_catalog_categories.ts
      005_restore_products_table.ts
      006_product_metadata.ts
  domain/
    catalog.ts
    product.ts
    errors.ts
    stock-health.ts
    types.ts
  features/
    catalogs/
      CatalogScreen.tsx
      catalog.data.ts
      partials/
        BarcodeScannerModal.tsx
        CatalogFilters.tsx
        CatalogFormModal.tsx
        CatalogItemCard.tsx
        CategorySelector.tsx
        ProductDetailsModal.tsx
      errors/
        catalog.errors.ts
    inventory/
    items/
    stores/
  purchases/
    feature-gate.ts
    purchase.service.ts
    purchase.types.ts
  services/
    catalog.service.ts
    business.service.ts
    inventory.service.ts
    product.service.ts
    stock.service.ts
    store.service.ts
  validation/
    product.validation.ts
    inventory.schemas.ts
    product.schemas.ts
    store.schemas.ts
__tests__/
  stock-health.test.ts
  stock-transaction.test.ts
  migrations.test.ts
```
