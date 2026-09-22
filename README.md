# StockPilot

StockPilot is an offline-first inventory app built with Expo SDK 57 and React Native. Inventory, catalogs, stores, and stock movements are stored locally with SQLite.

## Requirements

- Node.js `22.23.1` (see `.node-version`)
- npm
- Android Studio for Android development, or Xcode for iOS development

## Setup

```bash
npm install
npx expo start
```

Use the Expo CLI prompts to open the app on a development build, emulator, simulator, or web.

Platform-specific commands:

```bash
npm run android
npm run ios
npm run web
```

## Checks

```bash
npm test
npm run lint
```

## Project structure

- `src/app` — Expo Router entry points
- `src/features` — feature UI
- `src/services` — business workflows and writes
- `src/database` — SQLite schema, repositories, and migrations
- `src/domain` — domain rules and types
- `src/validation` — input validation

See [ARCHITECTURE.md](ARCHITECTURE.md) for runtime boundaries and [BUSINESS_RULES.md](BUSINESS_RULES.md) for domain invariants.

## Database

SQLite is the source of truth. Schema changes belong in an ordered migration under `src/database/migrations`; do not edit existing migrations after they have been used.
