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

Every store-scoped write receives a `storeId`; services verify that referenced items belong to that store before mutation. SQL queries never accept an unverified cross-store product/store pairing. Tables carry store ownership explicitly, and foreign keys reinforce it.

There is no global mutable "current inventory" shared between stores. Changing the selected store only changes the query context.

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
  domain/
    errors.ts
    stock-health.ts
    types.ts
  features/
    inventory/
    items/
    stores/
  purchases/
    feature-gate.ts
    purchase.service.ts
    purchase.types.ts
  services/
    business.service.ts
    inventory.service.ts
    product.service.ts
    stock.service.ts
    store.service.ts
  validation/
    inventory.schemas.ts
    product.schemas.ts
    store.schemas.ts
__tests__/
  stock-health.test.ts
  stock-transaction.test.ts
  migrations.test.ts
```
