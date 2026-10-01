# StockPilot Skill — Code Organization & File Size Discipline

## Skill Name

`stockpilot-code-organization`

## Purpose

Keep the StockPilot codebase modular, readable, maintainable, and easy to navigate.

This skill enforces one hard rule:

> **No handwritten source code file may reach 100 lines.**

Preferred target:

```text
40–80 lines per file
```

Warning threshold:

```text
70 lines
```

Refactor threshold:

```text
80 lines
```

Hard stop:

```text
99 lines maximum
```

If a file would become 100 lines or more, stop and split responsibilities before continuing.

---

# Activation

Use this skill whenever creating, editing, refactoring, or reviewing StockPilot code.

Apply it to:

- React Native screens
- Expo Router routes
- React components
- Hooks
- Services
- Repositories
- SQLite queries
- Validation schemas
- Utilities
- Types
- State modules
- Tests
- Feature modules

---

# Core Principle

Every file must have one clear responsibility.

A developer should be able to explain the file in one short sentence.

Good:

```text
POSCartItem.tsx
Renders and controls one POS cart item.
```

Good:

```text
usePOSCart.ts
Owns POS cart state and cart actions.
```

Good:

```text
posCheckout.service.ts
Validates and commits a POS sale.
```

Bad:

```text
POSScreen.tsx
Handles search, barcode scanning, cart state, checkout,
stock validation, receipts, database writes, formatting,
and navigation.
```

---

# Physical Line Rule

Count physical lines, including:

- imports
- exports
- JSX / TSX
- functions
- types
- constants
- comments
- blank lines

Do not compress code to cheat the limit.

Bad:

```ts
const run = () => { const a = 1; const b = 2; if (a) { doSomething(); } };
```

A compressed 99-line file is still badly organized if it contains too many responsibilities.

---

# Exceptions

Only automatically generated files may exceed the limit.

Examples:

- lock files
- generated native files
- generated API clients
- generated type definitions
- generated migration snapshots

Handwritten source files remain below 100 lines.

Do not label manually maintained code as generated simply to bypass this rule.

---

# Screen Files

Screens should mainly compose components and connect feature hooks.

Target:

```text
40–70 lines
```

A screen may:

- read route params
- use hooks
- compose sections
- handle navigation
- render loading and error states

A screen should not contain:

- direct SQL
- database mutations
- complex business rules
- large validation logic
- several reusable components
- large formatting helpers

Preferred:

```text
POSScreen
├── POSHeader
├── POSSearchBar
├── POSProductResults
├── POSCart
└── POSCheckoutBar
```

Do not implement all of these inline inside the screen.

---

# Component Rules

Each reusable UI component should normally have its own file.

Preferred size:

```text
20–70 lines
```

Examples:

```text
POSHeader.tsx
POSSearchBar.tsx
POSProductRow.tsx
POSCart.tsx
POSCartItem.tsx
POSQuantityControl.tsx
POSCheckoutBar.tsx
```

If a component starts containing several independent sections, split those sections into meaningful components.

Do not create meaningless one-line components simply to reduce line count.

---

# Hook Rules

One hook should manage one stateful concern.

Preferred size:

```text
30–75 lines
```

Good:

```text
usePOSCart.ts
usePOSSearch.ts
useImportPreview.ts
useStoreSelector.ts
```

Bad:

```text
usePOS.ts
```

when it controls:

- product search
- barcode scanning
- cart
- checkout
- receipt generation
- store switching
- persistence

Split by responsibility.

---

# Service Rules

Services own business logic.

Preferred size:

```text
30–80 lines
```

Prefer:

```text
pos/
├── posCart.service.ts
├── posCheckout.service.ts
└── posReceipt.service.ts
```

instead of one giant:

```text
pos.service.ts
```

that manages the entire feature.

A service must not contain React UI code.

---

# Repository Rules

Database access belongs in repositories or dedicated database modules.

Good:

```text
database/repositories/
├── product.repository.ts
├── inventory.repository.ts
├── stockMovement.repository.ts
└── posTransaction.repository.ts
```

Do not create a single application-wide repository containing every query.

If a repository approaches 80 lines, review whether read and write responsibilities should be separated.

Only split when the boundary is meaningful.

---

# SQL Query Organization

Large SQL statements should not clutter UI, hooks, or services.

Use dedicated query files where useful.

Example:

```text
database/queries/
├── productSearch.query.ts
├── inventoryValue.query.ts
└── posSalesReport.query.ts
```

Never combine:

```text
UI + SQL + validation + domain logic
```

inside one file.

---

# Validation Rules

Validation belongs in dedicated schema files.

Example:

```text
validation/
├── product.schema.ts
├── pos.schema.ts
└── import.schema.ts
```

If one schema becomes too large, split by workflow.

Example:

```text
importFile.schema.ts
importRow.schema.ts
importMapping.schema.ts
```

---

# Type Organization

Keep types close to the feature that owns them.

Example:

```text
features/pos/types/
├── cart.types.ts
└── transaction.types.ts
```

Avoid one giant global:

```text
types.ts
```

with unrelated application types.

---

# Constants

Use domain-specific constant files.

Good:

```text
pos.constants.ts
stockStatus.constants.ts
import.constants.ts
```

Avoid generic dumping grounds such as:

```text
constants.ts
common.ts
misc.ts
```

when they contain unrelated values.

---

# Utilities

Utility files must have a specific purpose.

Good:

```text
currency.utils.ts
barcode.utils.ts
date.utils.ts
```

Avoid:

```text
helpers.ts
utils.ts
common.ts
stuff.ts
```

Generic files eventually become junk drawers with imports.

---

# Function Size

Even when a file stays below 100 lines, functions should remain small.

Preferred:

```text
5–30 lines
```

Review carefully above:

```text
30 lines
```

Strongly consider extraction above:

```text
40 lines
```

A 95-line file containing one 90-line function does not satisfy the intent of this skill.

---

# Dependency Direction

Use predictable dependency flow.

Preferred:

```text
Screen
↓
Components
↓
Hooks / State
↓
Services
↓
Repositories
↓
Database
```

Avoid circular dependencies.

Never allow:

```text
Component → Service → Component
```

or:

```text
Feature A → Feature B → Feature A
```

---

# StockPilot Feature Structure

Prefer feature-based organization.

```text
src/
├── app/
│   ├── dashboard/
│   ├── inventory/
│   ├── pos/
│   ├── reports/
│   └── settings/
│
├── features/
│   ├── inventory/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── validation/
│   │
│   ├── import/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── parsers/
│   │   ├── services/
│   │   ├── types/
│   │   └── validation/
│   │
│   ├── pos/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   └── validation/
│   │
│   └── reports/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types/
│
├── database/
│   ├── migrations/
│   ├── repositories/
│   └── queries/
│
└── shared/
    ├── components/
    ├── hooks/
    ├── utils/
    └── constants/
```

Preserve existing project structure when it is already clean.

Do not reorganize working code solely for visual symmetry.

---

# POS Example

Bad:

```text
POSScreen.tsx — 500+ lines
```

containing:

- search
- product results
- barcode logic
- cart state
- quantity controls
- checkout
- receipt logic
- SQL
- stock validation

Correct direction:

```text
features/pos/
├── POSScreen.tsx
├── components/
│   ├── POSHeader.tsx
│   ├── POSSearchBar.tsx
│   ├── POSProductList.tsx
│   ├── POSProductRow.tsx
│   ├── POSCart.tsx
│   ├── POSCartItem.tsx
│   ├── POSQuantityControl.tsx
│   └── POSCheckoutBar.tsx
├── hooks/
│   ├── usePOSCart.ts
│   └── usePOSSearch.ts
├── services/
│   ├── posCart.service.ts
│   └── posCheckout.service.ts
└── types/
    ├── cart.types.ts
    └── transaction.types.ts
```

---

# Import Feature Example

Bad:

```text
ImportInventory.tsx — 600+ lines
```

Correct direction:

```text
features/import/
├── ImportScreen.tsx
├── components/
│   ├── ImportFilePicker.tsx
│   ├── ImportFileCard.tsx
│   ├── ImportStepper.tsx
│   ├── ImportPreview.tsx
│   ├── ImportPreviewRow.tsx
│   ├── ImportStatusChip.tsx
│   └── ImportSummary.tsx
├── parsers/
│   ├── excel.parser.ts
│   ├── docx.parser.ts
│   └── text.parser.ts
├── services/
│   ├── importNormalize.service.ts
│   ├── importMatch.service.ts
│   └── importCommit.service.ts
└── validation/
    └── importRow.schema.ts
```

---

# Extraction Decision

When a file reaches about 70 lines, inspect it before adding more code.

Ask:

```text
Does this file contain multiple components?
Does it contain business logic?
Does it contain database logic?
Does it contain reusable transformations?
Does it contain large constants?
Does it contain unrelated types?
Does it contain parsing logic?
Does it contain repeated JSX?
Does it manage several independent state concerns?
```

If yes, extract the relevant responsibility.

---

# Refactoring Order

When a file grows too large, consider extraction in this order:

```text
1. Types
2. Constants
3. Reusable UI components
4. Formatting helpers
5. Validation schemas
6. Hooks
7. Business logic
8. Database queries
9. Feature services
```

Do not split randomly just to satisfy the counter.

Every extracted file needs a meaningful responsibility.

---

# Avoid Micro-File Abuse

Do not create useless files like:

```text
getName.ts
getPrice.ts
getQuantity.ts
```

when the functions are trivial and logically belong together.

The objective is:

```text
high cohesion
+
clear responsibility
+
small files
```

not maximum file count.

---

# Import Organization

Keep imports ordered consistently.

Recommended order:

```text
1. React / framework
2. Third-party packages
3. Shared project modules
4. Feature modules
5. Relative local modules
6. Type-only imports
```

Remove unused imports immediately.

A very large import section often indicates the file owns too many responsibilities.

---

# Export Rules

Prefer named exports for reusable modules.

Example:

```ts
export function POSCart() {}
```

Use default exports when framework conventions make them appropriate, such as route modules where required.

Avoid barrel files when they cause circular imports or obscure ownership.

---

# Naming Rules

File names must describe responsibility.

Good:

```text
POSCartItem.tsx
usePOSCart.ts
posCheckout.service.ts
inventory.repository.ts
currency.utils.ts
```

Bad:

```text
main.ts
helper.ts
logic.ts
common.ts
new.ts
final.ts
final2.ts
```

---

# Feature Isolation

Feature-specific code stays inside its feature.

Example:

```text
features/pos/
```

owns POS-specific:

- components
- hooks
- services
- validation
- types

Do not move code into `shared/` merely because two files in the same feature use it.

Move code to `shared/` only when multiple independent features genuinely depend on it.

---

# Avoid Premature Abstraction

Do not create abstractions before a real boundary exists.

Extract when:

- logic repeats
- responsibility is distinct
- complexity is increasing
- the abstraction has a clear name

Two similar lines are not automatically a new utility module.

---

# Comments

Comments should explain:

- why a rule exists
- business constraints
- unusual implementation decisions
- non-obvious behavior

Do not comment obvious code.

Bad:

```ts
// Increase quantity
quantity += 1;
```

Useful:

```ts
// Revalidate at checkout because stock may change after the item
// was first added to the cart.
```

---

# Tests

Test files must also remain below 100 lines.

Split tests by behavior.

Good:

```text
posCart.addItem.test.ts
posCart.quantity.test.ts
posCheckout.stock.test.ts
```

Avoid one massive feature test file.

---

# Migration Discipline

Do not rewrite old shipped migrations purely to satisfy the line rule.

For new handwritten migrations:

- keep one migration focused on one schema change
- split unrelated schema changes
- preserve migration order
- keep migration intent obvious

Historical correctness is more important than cosmetically rewriting old migrations.

---

# Before Writing Code

Before implementation:

```text
1. Identify responsibilities.
2. Decide which layer owns each responsibility.
3. Inspect existing modules before creating new ones.
4. Reuse existing services and components where appropriate.
5. Plan small files before implementation.
6. Keep expected files under 80 lines where practical.
```

Do not start with one giant file and promise to refactor later.

That promise has an impressive mortality rate.

---

# During Implementation

After each meaningful change:

```text
Check line count
↓
Check responsibility
↓
Check dependency direction
↓
Check duplicated logic
↓
Continue
```

At 70–80 lines, review and extract before adding another major block.

---

# Completion Rule

For every newly created or modified handwritten source file:

```text
0–69 lines
GOOD

70–79 lines
REVIEW

80–99 lines
REFACTOR UNLESS HIGHLY COHESIVE

100+ lines
FAIL
```

A task is not complete while a newly created or modified handwritten source file has 100 or more lines.

---

# Line Count Command

Use:

```bash
find src -type f \
  \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -exec wc -l {} + \
  | sort -nr
```

Review every handwritten source file approaching the limit.

---

# Recommended CI Enforcement

Create a project script that:

```text
1. scans handwritten source files
2. excludes generated files
3. counts physical lines
4. warns at 80+ lines
5. fails at 100+ lines
```

Expected output:

```text
WARN  src/features/pos/hooks/usePOSCart.ts — 84 lines
FAIL  src/features/pos/POSScreen.tsx — 127 lines
```

Do not silently allow oversized files.

---

# AI Agent Rules

When an AI coding agent uses this skill, it must:

- inspect the existing project structure first
- preserve working architecture
- avoid duplicate modules
- reuse existing services and components
- keep handwritten files below 100 physical lines
- review files at 70 lines
- refactor files approaching 80 lines
- never compress formatting to bypass the limit
- avoid giant components
- avoid giant hooks
- avoid giant services
- avoid generic dumping-ground files
- keep business logic out of screens
- keep database access out of UI components
- keep validation outside presentation code
- preserve public APIs where practical
- avoid unrelated rewrites

---

# Completion Checklist

Before marking any coding task complete:

```text
[ ] No new handwritten source file is 100+ lines
[ ] Modified handwritten files are below 100 lines
[ ] Files at 70+ lines were reviewed
[ ] Files near 80 lines were split when responsibilities differed
[ ] Every file has one clear responsibility
[ ] Screens mainly compose components
[ ] Business logic lives outside screens
[ ] Database access lives outside UI
[ ] Validation is separated from presentation
[ ] Types are organized by feature
[ ] Repeated UI is extracted where useful
[ ] No meaningless micro-files were introduced
[ ] No circular dependency was introduced
[ ] Existing StockPilot architecture was preserved
```

---

# Final Rule

Prefer:

```text
small, meaningful, cohesive modules
```

over:

```text
large files with unrelated responsibilities
```

The line limit is a guardrail, not a formatting game.

For StockPilot, preserve this direction:

```text
Screen
→ Components
→ Hooks
→ Services
→ Repositories
→ Database
```

Keep responsibilities clear, dependencies predictable, and every handwritten source file below 100 physical lines.
