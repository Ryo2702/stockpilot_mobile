# StockPilot Mobile --- Structural Code Standard

> Purpose: keep StockPilot maintainable as modules grow. This document
> defines where code belongs, how modules communicate, and what must
> never be placed in screens.

## 1. Core Rule

StockPilot uses a **feature-based architecture with explicit domain
boundaries**.

A screen is a presentation layer. It may render UI, collect user input,
invoke feature/domain operations, and display results. It must not
contain SQL, inventory rules, migration logic, purchase rules,
cross-store authorization rules, or complex data transformations.

The dependency direction is:

``` text
Routes / Screens
      ↓
Feature UI + Hooks
      ↓
Domain Services
      ↓
Repositories
      ↓
Expo SQLite

Validation ─────→ Services
Domain Errors ←── Services / Repositories
Infrastructure ← Purchase, Files, SecureStore, Camera
```

Dependencies flow downward. Database and infrastructure code must never
import screens or feature UI.

------------------------------------------------------------------------

## 2. Required Project Structure

``` text
src/
├── app/                         # Expo Router only
│   ├── _layout.tsx
│   ├── (onboarding)/
│   ├── (tabs)/
│   ├── catalog/
│   ├── inventory/
│   ├── stores/
│   └── settings/
│
├── features/                    # User-facing modules
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── screens/
│   │   ├── types.ts
│   │   └── index.ts
│   ├── stores/
│   ├── catalog/
│   ├── inventory/
│   ├── scanner/
│   ├── insights/
│   ├── settings/
│   └── purchase/
│
├── services/                    # Domain/business rules
│   ├── storeService.ts
│   ├── catalogService.ts
│   ├── inventoryService.ts
│   ├── insightService.ts
│   └── featureGate.ts
│
├── database/
│   ├── database.ts
│   ├── migrations/
│   ├── repositories/
│   │   ├── storeRepository.ts
│   │   ├── productRepository.ts
│   │   ├── inventoryRepository.ts
│   │   └── movementRepository.ts
│   └── types/
│
├── validation/
│   ├── storeSchema.ts
│   ├── productSchema.ts
│   └── stockSchema.ts
│
├── errors/
│   ├── DomainError.ts
│   └── errorCodes.ts
│
├── infrastructure/
│   ├── purchases/
│   ├── secureStorage/
│   ├── files/
│   └── camera/
│
├── components/
│   ├── ui/                      # Generic reusable UI
│   ├── layout/
│   └── feedback/
│
├── hooks/                       # Truly cross-feature hooks only
├── theme/
├── constants/
├── utils/                       # Pure generic helpers only
└── types/
```

Do not create a giant `helpers.ts`, `services.ts`, `types.ts`, or
`utils.ts` dumping ground. If a helper belongs to inventory, keep it
with inventory.

------------------------------------------------------------------------

## 3. Layer Responsibilities

### `src/app`

Expo Router files are adapters between navigation and feature screens.

Good:

``` tsx
import { CatalogScreen } from '@/features/catalog/screens/CatalogScreen';

export default CatalogScreen;
```

Bad:

``` tsx
export default function CatalogRoute() {
  // SQL
  // validation
  // stock calculations
  // file imports
  // purchase checks
  // 500 lines of UI
}
```

Route files should normally be tiny.

### `features`

A feature owns presentation behavior for one module.

Feature code may contain:

-   screens
-   feature-specific components
-   presentation hooks
-   view-model formatting
-   local UI state
-   feature-specific types

Feature code must not execute raw SQL.

### `services`

Services own business rules and use cases.

Examples:

-   create a store
-   create/update/archive a product
-   receive stock
-   remove stock
-   adjust stock
-   calculate stock health
-   generate an insight snapshot
-   check whether a paid feature is available

If a rule must remain true regardless of which screen triggers it, the
rule belongs here.

### `database/repositories`

Repositories own persistence queries.

Examples:

``` ts
productRepository.findById(storeId, productId)
productRepository.listByStore(storeId)
inventoryRepository.getForProduct(storeId, productId)
movementRepository.insert(tx, movement)
```

Repositories do not decide business policy. They store and retrieve
data.

### `validation`

Zod schemas validate external/input boundaries before services operate
on data.

Validation answers:

> Is this input structurally valid?

Services answer:

> Is this operation allowed by StockPilot's business rules?

These are not the same problem.

------------------------------------------------------------------------

## 4. Strict Store Isolation

Every store-owned record must be accessed with a `storeId`.

Bad:

``` ts
getProduct(productId)
```

Preferred:

``` ts
getProduct(storeId, productId)
```

A repository query must scope both identifiers:

``` sql
SELECT *
FROM products
WHERE id = ?
  AND store_id = ?
LIMIT 1;
```

Never trust the currently selected store in the UI as security/domain
enforcement. Pass the store explicitly through the use case.

Do not silently aggregate independent stores. Cross-store summaries must
be explicit features.

------------------------------------------------------------------------

## 5. Inventory Transactions

All stock mutations go through `inventoryService`.

Allowed operations:

``` text
receiveStock
removeStock
adjustStock
```

A stock mutation must:

1.  validate input;
2.  confirm the product belongs to the target store;
3.  read the current quantity;
4.  calculate the next quantity;
5.  reject a negative result;
6.  update inventory;
7.  insert a stock movement;
8.  commit both changes atomically.

Use an exclusive SQLite transaction for mutations.

Never do this in a screen:

``` ts
await db.runAsync('UPDATE inventory ...');
```

And never update quantity without a movement record. Otherwise the
history becomes fiction, which is a surprisingly popular database design
pattern.

------------------------------------------------------------------------

## 6. No Negative Stock

This rule is enforced twice:

-   domain service validation;
-   database constraint.

Service:

``` ts
if (nextQuantity < 0) {
  throw new DomainError('INSUFFICIENT_STOCK');
}
```

Database:

``` sql
quantity INTEGER NOT NULL CHECK (quantity >= 0)
```

The service gives a useful error. The database is the final guard.

------------------------------------------------------------------------

## 7. Typed Domain Errors

Do not throw arbitrary user-facing strings.

Use stable error codes:

``` ts
type DomainErrorCode =
  | 'STORE_NOT_FOUND'
  | 'PRODUCT_NOT_FOUND'
  | 'DUPLICATE_PRODUCT'
  | 'INVALID_QUANTITY'
  | 'INSUFFICIENT_STOCK'
  | 'STORE_SCOPE_VIOLATION'
  | 'FEATURE_LOCKED'
  | 'PURCHASE_UNAVAILABLE';
```

UI maps codes to presentation messages.

This prevents business logic from becoming coupled to English copy.

------------------------------------------------------------------------

## 8. Forms

Use:

``` text
React Hook Form
      ↓
Zod
      ↓
Service input
```

Screens must not manually reproduce validation already defined in a
schema.

Example:

``` ts
const form = useForm<CreateProductInput>({
  resolver: zodResolver(createProductSchema),
});
```

After validation:

``` ts
await catalogService.createProduct(storeId, values);
```

------------------------------------------------------------------------

## 9. Database Migrations

Never edit an already-released migration.

Use ordered migrations:

``` text
001_initial.ts
002_store_profile_fields.ts
003_product_indexes.ts
```

Each migration has a unique version and runs once.

Migration code must be deterministic. Application screens must never
create or alter tables.

Current StockPilot schema direction:

``` text
stores
├── products
│   └── inventory
│       └── stock_movements
├── insight_snapshots
└── settings
```

`stores` is the top-level business entity. There is no separate
`businesses` table.

------------------------------------------------------------------------

## 10. Store Model Boundary

Store profile data includes:

``` text
id
name
business_type
currency
address fields
latitude / longitude
logo_uri
created_at
updated_at
```

Keep currency as an ISO 4217 code such as `PHP`, `USD`, or `JPY`.

Store logos should be stored as files. SQLite stores only the local
`logo_uri`, not base64 image data.

------------------------------------------------------------------------

## 11. Purchase Boundary

RevenueCat must be hidden behind a StockPilot purchase service.

Screens must not import `react-native-purchases` directly.

Use:

``` text
Screen
  ↓
featureGate / purchaseService
  ↓
RevenueCat adapter
  ↓
SecureStore cache
```

StockPilot has one lifetime entitlement:

``` text
stockpilot_lifetime
```

Do not scatter entitlement string comparisons across components.

------------------------------------------------------------------------

## 12. Component Rules

Create generic UI primitives only when they are genuinely reused.

Examples:

``` text
Button
IconButton
TextField
SearchField
Card
StatusBadge
ListRow
BottomSheet
Dialog
Toast
EmptyState
StoreSelector
StockHealthCard
```

A component should have one clear responsibility.

Avoid giant components with boolean APIs such as:

``` tsx
<Card
  isInventory
  isCritical
  isDashboard
  showProduct
  showStore
  useCompactMode
  enableActions
/>
```

Split behavior into explicit components instead.

------------------------------------------------------------------------

## 13. Hooks

Hooks coordinate React behavior. They are not secret service layers.

Good:

``` text
useCatalogScreen
useSelectedStore
useProductForm
```

A hook may call a service and manage loading/error/UI state.

Bad:

``` text
useEverything()
```

Do not bury SQL or core inventory rules inside hooks.

------------------------------------------------------------------------

## 14. State Management

Prefer the smallest state scope possible:

``` text
Component state
→ Feature hook/context
→ App-level context only when genuinely global
→ SQLite for persistent domain state
```

SQLite is the source of truth for persistent inventory data.

Do not duplicate the full database into a global JavaScript store. Two
sources of truth are twice the opportunity to be wrong.

Good global candidates:

``` text
selected store ID
theme
onboarding completion
purchase access snapshot
```

Products and inventory remain database-backed.

------------------------------------------------------------------------

## 15. File Size and Refactoring Signals

There is no magical line-count law, but refactor when a file has
multiple responsibilities.

Strong warning signs:

-   a screen performs SQL;
-   a component performs domain calculations;
-   one file handles navigation, validation, persistence, and UI;
-   the same rule is copied into two modules;
-   functions require many unrelated boolean flags;
-   imports cross several feature boundaries unnecessarily;
-   changing one business rule requires editing multiple screens;
-   a `utils` file keeps growing;
-   circular dependencies appear.

A 300-line file with one coherent job can be acceptable. A 90-line file
doing six jobs is already spaghetti.

------------------------------------------------------------------------

## 16. Naming Rules

Use names that reveal intent.

Prefer:

``` text
inventoryService.removeStock
productRepository.findByBarcode
calculateStockHealth
createProductSchema
InsufficientStockError
```

Avoid:

``` text
handleData
processThing
doAction
helper
common
manager
misc
```

Use `handleX` primarily for UI event handlers:

``` ts
handleSavePress()
handleScanResult()
```

Domain functions should describe the business action itself.

------------------------------------------------------------------------

## 17. Import Boundaries

Preferred direction:

``` text
app
↓
features
↓
services
↓
repositories
↓
database
```

Shared infrastructure can be called through adapters/services.

Forbidden dependency examples:

``` text
database → feature screen
service → React component
repository → navigation
validation → screen
```

Keep imports one-directional to reduce circular dependencies.

------------------------------------------------------------------------

## 18. Testing Strategy

Test business rules without rendering screens whenever possible.

### Unit tests

``` text
stock health
validation
feature gates
pure calculations
typed error mapping
```

### Service tests

``` text
receive stock
remove stock
negative-stock rejection
store isolation
movement creation
transaction rollback
```

### Migration tests

``` text
fresh database migrates completely
migration versions run in order
existing database upgrades correctly
constraints/indexes exist
```

### UI tests

Reserve these for meaningful interaction:

``` text
form submission
error presentation
store switching
scanner result flow
locked feature presentation
```

Do not test implementation trivia.

------------------------------------------------------------------------

## 19. Feature Implementation Template

Every substantial module should follow this sequence:

``` text
1. Define domain requirement
2. Define/update schema migration
3. Add repository operations
4. Add Zod validation
5. Implement domain service
6. Add typed errors
7. Add service/unit tests
8. Add feature hook
9. Build UI components
10. Connect route
```

Do not start by writing a screen and then invent the architecture around
whatever accumulated inside it.

------------------------------------------------------------------------

## 20. Example: Create Product Flow

``` text
CreateProductScreen
        ↓
useProductForm
        ↓
createProductSchema
        ↓
catalogService.createProduct()
        ↓
productRepository.insert()
        ↓
Expo SQLite
```

The screen knows nothing about SQL.

The repository knows nothing about buttons.

The validation schema knows nothing about navigation.

The service owns the business operation.

That separation is the target.

------------------------------------------------------------------------

## 21. Example: Stock Out Flow

``` text
InventoryScreen
      ↓
useStockAdjustment
      ↓
stockAdjustmentSchema
      ↓
inventoryService.removeStock()
      ↓
exclusive SQLite transaction
      ├── inventoryRepository.updateQuantity()
      └── movementRepository.insert()
```

If any step inside the transaction fails, everything rolls back.

------------------------------------------------------------------------

## 22. Code Review Checklist

Before accepting a module, verify:

-   [ ] Route files contain navigation composition only.
-   [ ] Screens contain no raw SQL.
-   [ ] Business rules live in services.
-   [ ] Persistent queries live in repositories.
-   [ ] Inputs are validated with Zod.
-   [ ] Every store-owned query is scoped by `storeId`.
-   [ ] Stock cannot become negative.
-   [ ] Stock changes and movement records are atomic.
-   [ ] Domain errors use typed codes.
-   [ ] RevenueCat is accessed only through the purchase boundary.
-   [ ] SQLite remains the persistent source of truth.
-   [ ] No released migration was modified.
-   [ ] Feature-specific code stays inside its feature.
-   [ ] Generic components contain no StockPilot business rules.
-   [ ] Important domain behavior has tests.
-   [ ] No duplicated business rule exists in multiple screens.

------------------------------------------------------------------------

## 23. Rules for AI-Assisted Coding

When an AI tool generates or refactors StockPilot code, it must follow
these constraints:

``` text
DO:
- inspect existing architecture before creating files;
- reuse existing services, repositories, schemas, and components;
- preserve store isolation;
- add migrations for schema changes;
- add or update tests with business-rule changes;
- keep route files thin;
- keep domain rules framework-independent where practical;
- use typed TypeScript interfaces and errors;
- make the smallest coherent change.

DO NOT:
- place SQL in screens;
- bypass services for convenience;
- create duplicate helpers/services;
- introduce a new state library without architectural need;
- create a second source of truth for SQLite data;
- hard-code the selected store into repositories;
- silently change released migrations;
- use `any` to escape type design;
- swallow exceptions;
- create giant all-purpose hooks/components;
- refactor unrelated modules during a focused task.
```

Before implementation, the AI should identify:

``` text
affected feature
affected service
affected repository
schema/migration impact
validation impact
store-isolation impact
tests that must change
```

This prevents "quick fixes" from slowly turning the project into an
archaeological site.

------------------------------------------------------------------------

## 24. Definition of Done

A feature is structurally complete only when:

``` text
UI
+ validation
+ service/business rules
+ persistence
+ typed errors
+ store isolation
+ tests
+ migration when required
```

are consistent.

A screen that merely appears to work is not finished if it bypasses
these boundaries.

------------------------------------------------------------------------

## 25. Architecture Principle

StockPilot should optimize for **predictable change**, not maximum
abstraction.

Do not create interfaces, factories, adapters, providers, repositories,
coordinators, and managers merely to make the folder tree look
sophisticated. Add a boundary when it protects a real responsibility.

The desired codebase is:

``` text
boring
explicit
typed
testable
store-scoped
transaction-safe
easy to change
```

That is structural code. Anything that makes a simple inventory rule
require a guided tour through twelve abstractions has merely invented a
more formally dressed version of spaghetti.
