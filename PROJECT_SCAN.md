# StockPilot Project Scan

> Source scan completed on 2026-10-03. This document describes the current implementation in the repository; older feature specifications may describe planned or historical behavior.

## Overview

StockPilot is an offline-first inventory management application for small businesses. It runs on iOS, Android, and the web through Expo and React Native. Operational data is stored locally in SQLite so the core catalog, inventory, stock movement, POS, and reporting workflows do not require a network connection.

The app is organized around a selected business/store context. Screens read through hooks and services, while database writes and business rules stay below the UI layer.

## Technology

| Area | Current implementation |
| --- | --- |
| Framework | Expo SDK 57 (`expo` `~57.0.22`) |
| UI runtime | React Native `0.86.3`, React `19.2.3` |
| Web | React Native Web `~0.21.0` with Metro |
| Navigation | Expo Router `~57.0.21` |
| Language | TypeScript `~6.0.3` with strict mode |
| Database | SQLite through `expo-sqlite` |
| Validation | Zod and feature-specific validation helpers |
| Icons | `lucide-react-native` |
| Barcode | `expo-camera` for scanning and `@bwip-js/react-native` for barcode generation |
| Files | Document picker, file system, XLSX, DOCX/TXT/CSV import support |
| Security | Local PIN, recovery questions, optional native fingerprint authentication |
| Tests | Jest with `jest-expo` |

Package versions and scripts are defined in [`package.json`](package.json). App and platform configuration is in [`app.json`](app.json) and [`metro.config.js`](metro.config.js).

## Runtime flow

1. [`src/app/_layout.tsx`](src/app/_layout.tsx) loads Manrope, Inter, and IBM Plex Mono fonts.
2. The root layout initializes SQLite with [`migrate`](src/database/migrate.ts), applies the theme provider, and mounts the Expo Router stack.
3. [`src/app/index.tsx`](src/app/index.tsx) enters [`HomeScreen`](src/screens/home/HomeScreen.tsx).
4. `HomeScreen` loads stores, the active store selection, PIN settings, and fingerprint availability.
5. The app shows onboarding when no store exists, PIN setup/unlock when required, or the selected operational screen after authentication.
6. Feature screens are lazy-loaded and switch locally through the home shell rather than using separate feature routes.

The web runtime uses a browser lock around SQLite so two tabs do not open the same local database at once.

## Application areas

| Area | Location | Responsibility |
| --- | --- | --- |
| Onboarding | `src/components/onboarding` | Welcome flow, owner name, store setup, store type, existing-store selection, and initial security setup |
| Store context | `src/components/store`, `src/services/owner-store.service.ts` | Store creation, editing, switching, deletion, owner identity, and active-store persistence |
| Dashboard | `src/features/dashboard` and `src/components/store` | Store overview, stock health, KPI/status cards, quick actions, and recent activity |
| Catalog / Products | `src/features/catalogs` | Product CRUD, categories, search, filters, archive/restore, product details, identifiers, prices, and barcode entry |
| Inventory | `src/features/inventory` | Inventory list, stock adjustments, movement history, import preview/review/commit, and CSV export |
| POS | `src/features/pos` and `src/services/pos.service.ts` | Product lookup, barcode lookup, cart, custom quantities, stock-safe checkout confirmation, receipts, and sales history |
| Insights / Reports | `src/features/insights`, `src/services/insights` | Stock health, movement trends, sales analytics, report filters, report history, CSV reports, and insight sheets |
| More / Settings | `src/features/settings` | Preferences, appearance, backups, import/export entry points, security, legal/about screens, and returning to onboarding |
| Shared UI | `src/components/ui` | Buttons, cards, fields, search, status badges, headers, bottom navigation, scanner modal, and barcode printing |

## Navigation

The primary bottom navigation is defined in [`src/components/ui/BottomNavigation.tsx`](src/components/ui/BottomNavigation.tsx):

- Dashboard
- Inventory
- POS
- Catalog
- Insights

The More screen contains settings and utility actions. Camera navigation redirects to Catalog and starts a barcode scan request. Inventory import/export actions are passed from the home shell into the Inventory screen.

## Data architecture

The repository follows these boundaries:

```text
UI components and screens
        ↓
feature hooks and screen adapters
        ↓
services and repositories
        ↓
domain validation and typed errors
        ↓
SQLite schema, migrations, and transactions
```

### UI and features

Feature screens compose hooks and presentational components. They should not perform SQL mutations directly. Shared controls use the theme provider and semantic color/typography tokens.

### Services

Important service groups include:

- `services/catalog` — product queries and mutations.
- `services/inventory` — inventory reads, stock changes, movement history, import analysis, import commit, and export.
- `services/pos.service.ts` — POS product lookup, transactional checkout, receipt data, and sales history.
- `services/insights` — derived inventory, movement, revenue, and report data.
- `services/owner-store.service.ts` — business/store lifecycle and store-scoped records.
- `services/settings.service.ts` — theme, active store, PIN, recovery, and fingerprint settings.
- `services/backup.service.ts` — local backup creation, restore, sharing, and storage information.
- `services/pos-receipt.service.ts` — receipt HTML and PDF creation.
- `services/event-tracking.service.ts` — best-effort local application event logging.

### Domain and validation

[`src/domain`](src/domain) contains product, store, inventory, POS, currency, stock-health, and typed error definitions. [`src/validation`](src/validation) validates product, store, inventory, numeric, and PIN input before service execution.

Validation at the UI boundary is not considered sufficient for data integrity; services repeat important invariant checks.

## SQLite model

SQLite is initialized from [`src/database/db_schema.ts`](src/database/db_schema.ts) and upgraded through ordered migrations in [`src/database/migrations`](src/database/migrations). The current migration list reaches version 12:

1. Initial business, store, product, inventory, movement, and settings schema
2. Expanded stores and store settings
3. Product/catalog domain compatibility
4. Product categories
5. Restored `products` table naming and related references
6. Product metadata: barcode, unit, and notes
7. Current selling price
8. Movement type and reference
9. Additional store types
10. Product cost price
11. POS transactions and transaction items
12. Local application events

Current operational tables are:

| Table | Purpose |
| --- | --- |
| `app_events` | Local application event records, including shared button presses |
| `schema_migrations` | Applied migration records |
| `businesses` | Owner business records |
| `stores` | Store identity, type, currency, address, and status |
| `store_settings` | Store-scoped non-secret preferences |
| `products` | Product metadata, identifiers, category, pricing, thresholds, and active state |
| `inventory` | Authoritative current quantity per product |
| `stock_movements` | Append-only stock history |
| `pos_transactions` | Completed sales and receipt totals |
| `pos_transaction_items` | Product/quantity/price snapshots for each sale |
| `settings` | Application-level non-secret settings |
| `insight_snapshots` | Derived reporting snapshots |

The database enables foreign keys and WAL mode. Product, inventory, movement, and POS queries include both `business_id` and `store_id` to preserve store isolation.

Shared `Button` and `IconButton` controls record a local `button_pressed` event with non-sensitive UI metadata. Event logging is fire-and-forget and cannot prevent the original button action from running.

## Core business rules

- A business can own multiple stores; each store has an isolated catalog and inventory.
- Product quantities cannot become negative.
- A successful stock change updates inventory and records its stock movement in the same transaction.
- Stock health is derived from quantity and thresholds: healthy, low, or critical.
- Product SKU and barcode values are unique within a store when present.
- Product critical level cannot exceed reorder level.
- POS checkout accepts only positive integer quantities, verifies current stock and price, deducts inventory, creates a sale movement, and stores price snapshots.
- Receipt and transaction queries remain scoped to the selected store.
- Insight data is derived and is not the authoritative inventory balance.
- Database migrations are forward-only and must be safe to apply to existing local data.
- Sensitive small values use native secure storage where available; inventory data remains in SQLite.

The full rule list is in [`BUSINESS_RULES.md`](BUSINESS_RULES.md).

## POS flow

The POS module is implemented in [`src/features/pos`](src/features/pos):

1. Search products by name, SKU, barcode, or category.
2. Scan a barcode to find a product.
3. Add a product with a selected custom quantity.
4. Adjust or remove cart lines.
5. Press Checkout to open a Yes/No confirmation dialog.
6. Confirming calls `checkoutPosTransaction`, which performs the stock and sale writes transactionally.
7. The completed transaction opens a receipt modal and can be saved as a PDF or reviewed in sales history.

## Reporting flow

Insights are loaded by [`useInsightsScreen`](src/features/insights/hooks/useInsightsScreen.ts) and displayed in overview, trends, and reports areas. Report filters include period, date range, product search, category, and report type. Available report types and report history are defined in [`src/services/insights/reports.ts`](src/services/insights/reports.ts).

Reports are derived from current store data and POS/movement history. An empty product or result set still leaves the report controls available so a user can select another available report or adjust filters.

## Design system

The centralized theme is in [`src/theme/tokens.ts`](src/theme/tokens.ts), with access helpers in [`src/theme/ThemeProvider.tsx`](src/theme/ThemeProvider.tsx).

- Manrope is used for page headings, section headings, KPIs, and important totals.
- Inter is used for general interface text, labels, buttons, forms, navigation, and descriptions.
- IBM Plex Mono is reserved for SKUs, barcodes, receipt numbers, and other technical identifiers.
- Light mode uses deep blue, warm sand, soft ivory, white surfaces, and semantic stock colors.
- Dark mode uses layered charcoal surfaces with lighter blue interaction colors and readable semantic states.
- Spacing, radii, control sizes, and typography are shared tokens rather than per-screen constants.

Shared component styling is defined in `src/components/ui` and feature-specific styles are kept beside their feature. Avoid adding direct one-off colors or typography values when a semantic theme token exists.

## Development commands

```bash
npm install
npm run start
npm run android
npm run ios
npm run web
npm test
npm run lint
npx tsc --noEmit
```

Use Node.js `22.23.1`, as specified by `.node-version` and the project README.

## Test coverage in the repository

The current test files cover:

- database migration setup, repair, and fresh rebuild behavior;
- catalog creation, lookup, store isolation, archive/restore, and stock status;
- inventory stock transactions and no-negative-stock behavior;
- CSV and multi-format inventory import analysis/commit rules;
- POS checkout, valuation, sales analytics, and rollback on insufficient stock;
- owner-store lifecycle and store validation;
- PIN and security recovery input behavior.

The Jest configuration is in [`package.json`](package.json), using the `jest-expo` preset.

## Repository guidance

The most relevant project documents are:

- [`README.md`](README.md) — setup and high-level structure.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — runtime boundaries and persistence rules.
- [`BUSINESS_RULES.md`](BUSINESS_RULES.md) — domain invariants.
- [`DATABASE_SCHEMA.md`](DATABASE_SCHEMA.md) — schema reference.
- [`STOCKPILOT_UI_STYLE_SYSTEM.md`](STOCKPILOT_UI_STYLE_SYSTEM.md) — UI tokens and component guidance.
- [`USER_GUIDE.md`](USER_GUIDE.md) — end-user workflows.
- [`STOCKPILOT_STRUCTURAL_CODE_STANDARD.md`](STOCKPILOT_STRUCTURAL_CODE_STANDARD.md) — structural and review rules.

## Alignment notes from this scan

- The source currently uses `products` as the operational table name after migration 005. Any documentation that still says `catalogs` for the physical table should be treated as historical terminology.
- [`ARCHITECTURE.md`](ARCHITECTURE.md) describes a `src/purchases` and `FeatureGate` boundary, but no `src/purchases` directory was present in this source scan. Confirm that boundary before adding purchase-gated behavior.
- Product and POS UI live in separate feature modules, while both depend on the shared catalog and inventory services. New stock-changing functionality should continue through those services rather than writing SQL from screens.
