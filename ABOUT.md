# StockPilot

> Smarter Inventory. Less Worry.

StockPilot is an offline-first inventory management application for independent business owners. It provides a simple way to manage products, inventory quantities, stock movements, stock health, and multiple stores from a mobile-first interface.

The app is designed for everyday operations: quickly see what is in stock, identify products that need attention, record inventory changes, switch store context, and keep working when the internet is unavailable.

## Tech stack

| Area | Technology |
| --- | --- |
| App framework | Expo SDK 57 |
| Mobile UI | React Native 0.86.3 |
| Web support | React Native Web 0.21 |
| Language | TypeScript 6 |
| Navigation | Expo Router 57 |
| Local database | SQLite through `expo-sqlite` |
| Authentication | Local 4–6 digit PIN; `expo-secure-store` on native and SQLite fallback on web |
| Icons | `lucide-react-native` |
| Validation | `zod` plus domain validation helpers |
| Barcode tools | `@bwip-js/react-native`, `expo-camera`, and `expo-print` |
| Testing | Jest 29 with `jest-expo` |

## Core features

- **Dashboard** — selected store, product totals, stock summary, low-stock and critical-stock counts, Stock Health, and recent activity.
- **Stock Health** — clear healthy, low-stock, and critical states using green, orange, and red status language.
- **Products** — create, search, filter, edit, archive, and inspect products with identifiers, categories, pricing, reorder levels, and stock context.
- **Inventory** — record stock-in, stock-out, and adjustments while preserving movement history and timestamps.
- **Barcode and QR scanning** — find products quickly and start an inventory action from the camera flow.
- **Multiple stores** — keep products, inventory, and stock movements separated by store.
- **Inventory Insights** — surface actionable stock risks, trends, movement comparisons, and products that may run out soon.
- **Backup and restore** — import and export local inventory data using supported files.
- **Offline-first operation** — core inventory workflows continue to work from the local database without a constant connection.
- **Security settings** — optional app PIN setup, locking, and change flow.

## Architecture

The project keeps UI, workflows, storage, and domain rules separate:

```text
src/
  app/          Expo Router entry and layout
  components/   Shared UI, onboarding, store, and authentication flows
  features/     Dashboard, catalog, inventory, insights, and settings screens
  services/     Business workflows and database-backed operations
  database/     SQLite schema, repositories, and ordered migrations
  domain/       Domain types, stock rules, currency, and typed errors
  validation/   Product, store, inventory, number, and PIN validation
  theme/        Theme provider, colors, spacing, typography, radii, and controls
```

SQLite is the source of truth for operational data. Store-scoped services validate store ownership before writes, and stock changes are recorded with their corresponding movement history.

## UI components

### Shared UI

- `Button` — primary, secondary, ghost, and danger actions with loading and disabled states.
- `Card` — default, interactive, selected, and critical surfaces.
- `IconButton` — compact icon actions.
- `ScreenHeader` — consistent screen titles and navigation affordances.
- `StatusBadge` — healthy, low-stock, critical, and informational status labels.
- `BottomNavigation` — primary mobile navigation.
- `ThemeToggle` — light, dark, and system appearance selection.
- `BarcodeScannerModal` — camera-based barcode scanning.
- `PrintBarcodeButton` — barcode generation and print flow.

### Product and inventory UI

- `CatalogScreen`, `CatalogItemCard`, `CatalogFormModal`, `ProductDetailsModal`, `CatalogFilters`, `CategorySelector`, and `ArchiveProductModal`.
- `InventoryScreen`, `InventoryScreenView`, `InventoryItemRow`, `InventoryViews`, `InventorySheets`, and `StockAdjustmentModal`.
- `StockHealthCard`, `OwnerStoreOverview`, `StoreStatusCards`, and `QuickActions` for the dashboard.
- `InsightsScreenView` and `InsightSheets` for actionable inventory reporting.

### Store, onboarding, and security UI

- `OnboardingScreen` with welcome, features, owner, store, setup, and existing-store steps.
- `OwnerStoreScreen`, `StoreSelector`, `StoreSwitchModal`, and store form/list components.
- `PinScreen` for first-time PIN setup and app unlock.
- `MoreScreen` and `SettingsScreen` for settings, backup, legal pages, security, and app actions.

## Installed packages

### Expo and platform services

- `expo` `~57.0.22`
- `@expo/ui` `~57.0.18`
- `expo-camera` `~57.0.5`
- `expo-constants` `~57.0.18`
- `expo-device` `~57.0.2`
- `expo-document-picker` `~57.0.2`
- `expo-file-system` `~57.0.7`
- `expo-font` `~57.0.4`
- `expo-glass-effect` `~57.0.3`
- `expo-image` `~57.0.5`
- `expo-linking` `~57.0.10`
- `expo-print` `~57.0.2`
- `expo-router` `~57.0.21`
- `expo-secure-store` `~57.0.4`
- `expo-sharing` `~57.0.21`
- `expo-splash-screen` `~57.0.9`
- `expo-sqlite` `~57.0.3`
- `expo-status-bar` `~57.0.1`
- `expo-symbols` `~57.0.3`
- `expo-system-ui` `~57.0.4`
- `expo-video` `~57.0.4`
- `expo-web-browser` `~57.0.3`

### React Native and UI

- `react` `19.2.3`
- `react-dom` `19.2.3`
- `react-native` `0.86.3`
- `react-native-web` `~0.21.0`
- `lucide-react-native` `^1.46.0`
- `react-native-svg` `^15.15.4`
- `react-native-safe-area-context` `~5.7.0`
- `react-native-screens` `~4.26.0`
- `react-native-gesture-handler` `~2.32.0`
- `react-native-reanimated` `4.5.1`
- `react-native-worklets` `0.10.1`

### Data, validation, and product services

- `zod` `^4.6.5` for runtime input validation.
- `@bwip-js/react-native` `^4.11.4` for barcode generation.
- `react-native-purchases` `^10.9.1` for purchase and entitlement integration.

### Development tools

- `typescript` `~6.0.3`
- `jest` `~29.7.0`
- `jest-expo` `~57.0.5`
- `@types/jest` `29.5.14`
- `@types/react` `~19.2.2`
- npm and the Expo CLI for installation, development, platform launching, and web export.

## Useful commands

```bash
npm install
npm run start
npm run android
npm run ios
npm run web
npm test
npm run lint
```

## Source of truth

- Package versions: `package.json`
- App entry and database initialization: `src/app/_layout.tsx`
- Database migrations: `src/database/migrations/`
- UI tokens: `src/theme/tokens.ts`
- Architecture boundaries: `ARCHITECTURE.md`
