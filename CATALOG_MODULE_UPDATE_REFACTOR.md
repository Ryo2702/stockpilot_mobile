# StockPilot — Catalog Module Update / Refactor

> **Status:** Update / Refactor  
> **Scope:** Rename the user-facing **Products** module to **Catalog** while keeping the underlying domain entity as **Product**.  
> **Architecture:** Offline-first, local-only, Expo Router + Expo SQLite, strict store isolation.  
> **Important:** The existing **category system is already designed from the active store type**. The Catalog module must consume that existing category source and must not create a second category system.

---

## 1. Refactor Goal

Refactor the current **Products** module into a **Catalog** module.

Use:

- **Catalog** as the module/navigation name.
- **Product** as the individual record/entity name.
- **Add Product** for creation.
- **Product Details** for a single item.
- **Edit Product** for metadata editing.
- **Archive Product** for normal removal.
- **Restore Product** for recovering archived products.

Do **not** rename the database `products` table to `catalogs`.

A catalog is the collection of products belonging to one store. A product remains the actual domain record.

```text
Store
└── Catalog
    └── Product
        ├── Inventory
        └── Stock Movements
```

---

## 2. Naming Update / Refactor

| Current | Update / Refactor |
|---|---|
| Products | Catalog |
| Products tab | Catalog tab |
| Products screen | Catalog screen |
| Search products | Search catalog |
| Product list | Catalog list |
| Products found | Catalog items |
| Add Product | Keep as Add Product |
| Product Detail | Keep as Product Details |
| Edit Product | Keep as Edit Product |
| Delete Product | Refactor to Archive Product |
| Archived Products | Archived Catalog Items |

Do not rename individual products to “catalogs.”

Correct:

```text
Catalog
124 products
```

Incorrect:

```text
124 catalogs
```

---

## 3. Updated Mobile Navigation

Refactor the bottom navigation to:

```text
Home
Inventory
Catalog
Camera
Insights
More
```

The Camera action remains the visually distinct blue primary navigation action.

```text
Home      → dashboard and store overview
Inventory → stock quantities and stock operations
Catalog   → product identity and metadata
Camera    → barcode / QR / product photo / list scan
Insights  → actionable inventory insights
More      → settings, backup, import/export, purchase, app information
```

---

## 4. Catalog Ownership

Every store has its own independent catalog.

```text
Business
├── Store A
│   └── Catalog A
│       ├── Product 1
│       └── Product 2
│
└── Store B
    └── Catalog B
        ├── Product 1
        └── Product 3
```

Products from one store must never appear in another store unless the user explicitly performs a supported transfer/import operation.

Every Catalog query must be scoped by `store_id`.

Never depend only on a UI filter for store isolation.

---

# 5. Existing Category System

## Important Refactor Rule

The **category system already exists and is based on the store type**.

Therefore:

**Do not create category CRUD inside the Catalog module.**

The Catalog module must consume the category options already resolved for the active store.

Example:

```text
Store Type: Grocery
→ Grocery category set

Store Type: Restaurant
→ Restaurant category set

Store Type: Pharmacy
→ Pharmacy category set
```

The Catalog module only needs to ask:

```text
What categories are valid for this active store?
```

It must not redefine:

- category templates
- store-type/category mappings
- default category generation
- category ownership
- custom-category policy

Those remain owned by the existing Store / Category design.

### 5.1 Category Field Behavior

On **Add Product** and **Edit Product**, Category must use a selector.

```text
Category
[ Select category                     ▼ ]
```

Do not use a free-text category field when the current store-type design already provides category options.

The selector should load categories from the active store context.

If the existing category design supports custom categories, Catalog should display them through the same existing category source.

Catalog must not implement a separate “Create Category” workflow unless that capability already belongs to the Store/Category module.

### 5.2 Category Validation

When saving a product:

```text
Product category
        ↓
Resolve active store
        ↓
Resolve store type
        ↓
Load allowed categories
        ↓
Validate selected category
        ↓
Save product
```

A product must not silently accept a category that belongs to a different store type.

The validation belongs in the service layer, not only in the form.

---

# 6. Catalog Screens

```text
Catalog
├── Catalog List
├── Search / Filter / Sort
├── Add Product
├── Product Details
├── Edit Product
├── Archive Confirmation
├── Archived Catalog
├── Restore Product
├── Empty State
└── Success Feedback
```

---

# 7. Screen 01 — Catalog List

## Purpose

Browse products belonging only to the active store.

Header:

```text
Catalog

Main Store ▼
```

Search:

```text
Search catalog, SKU, or barcode
```

Filters:

```text
All
Healthy
Low
Critical
```

Optional additional filters:

```text
Category
Archived
```

Sort options:

```text
Name A–Z
Name Z–A
Stock: Low to High
Stock: High to Low
Recently Updated
```

Each product row should show:

- Product name
- SKU when available
- Category
- Current quantity
- Unit
- Stock status
- Chevron or row action

Do not require product photos for catalog rows.

---

# 8. Screen 02 — Search / Filter / Sort

Searchable fields:

```text
Product name
SKU
Barcode
Category name
```

Search must remain store-scoped.

```sql
WHERE p.store_id = ?
  AND p.archived_at IS NULL
```

Never perform an unscoped query such as:

```sql
SELECT * FROM products;
```

Recommended filter sheet:

```text
Filter & Sort

Stock Status
[ All ] [ Healthy ] [ Low ] [ Critical ]

Category
[ Store-type category selector ▼ ]

Sort By
[ Name A–Z ▼ ]

[ Reset ] [ Apply ]
```

---

# 9. Screen 03 — Add Product

## Required Fields

Visible immediately:

```text
Product Name *
Initial Quantity *
```

Recommended form:

```text
Add Product

Product Photo
Optional

Product Name *
[                              ]

Barcode
[                              ] [ Scan ]

SKU
[                              ]

Category
[ Select from active store      ▼ ]

Unit
[                              ]

Initial Quantity *
[                              ]

Reorder Level
[                              ]

Notes
[                              ]

[ Cancel ] [ Save Product ]
```

Category is loaded from the existing store-type category design.

Do not let this screen own category creation.

---

# 10. Screen 04 — Product Details

Display:

```text
Product Details

Rice 25kg
SKU: RC250
Barcode: 4800012345678

Current Stock
25 kg

Stock Status
Critical

Reorder Level
50 kg

Category
Grains

Unit
kg

Notes
Premium jasmine rice.

[ View Stock History ]
[ Edit Product ]

[ Archive Product ]
```

The Catalog module may display stock quantity, but must not directly own stock mutation rules.

---

# 11. Screen 05 — Edit Product

Edit only product identity and metadata.

Allowed fields:

```text
Product Name
Barcode
SKU
Category
Unit
Reorder Level
Notes
Product Photo
```

Do not allow direct editing of current quantity.

Stock quantity must be changed through Inventory / Stock Movement services.

Correct:

```text
CatalogService.updateProduct(...)
```

for metadata.

Correct:

```text
InventoryService.adjustStock(...)
```

for quantity changes.

---

# 12. CRUD Setup

## CREATE

```text
Validate input
    ↓
Verify active store
    ↓
Validate category against active store type
    ↓
Check duplicate SKU
    ↓
Check duplicate barcode
    ↓
Create product
    ↓
Create inventory record
    ↓
Create INITIAL movement if initial quantity > 0
    ↓
Commit transaction
```

The creation flow should be transactional.

If any required database write fails, do not leave a half-created product.

## READ — Catalog List

Read products only from the active store.

```sql
SELECT
  p.id,
  p.store_id,
  p.name,
  p.sku,
  p.barcode,
  p.category,
  p.unit,
  p.reorder_level,
  p.notes,
  p.archived_at,
  p.created_at,
  p.updated_at,
  i.quantity AS current_quantity
FROM products p
INNER JOIN inventory i
  ON i.product_id = p.id
  AND i.store_id = p.store_id
WHERE p.store_id = ?
  AND p.archived_at IS NULL
ORDER BY p.name COLLATE NOCASE ASC
LIMIT ? OFFSET ?;
```

If the existing schema stores category by ID instead of text, keep that existing schema and join/resolve the category from the existing category source.

Do not migrate category storage merely for this Catalog refactor unless the current database schema actually requires it.

## READ — Product Detail

Require both:

```text
storeId
productId
```

```sql
SELECT
  p.*,
  i.quantity AS current_quantity
FROM products p
INNER JOIN inventory i
  ON i.product_id = p.id
  AND i.store_id = p.store_id
WHERE p.id = ?
  AND p.store_id = ?
  AND p.archived_at IS NULL
LIMIT 1;
```

## UPDATE

Update metadata only.

```ts
await catalogService.updateProduct(
  activeStoreId,
  productId,
  {
    name: 'Rice 25kg',
    categoryId: selectedCategoryId,
    reorderLevel: 20,
    notes: 'Premium jasmine rice.',
  },
);
```

Use the field name that already exists in the real database schema.

If the current schema uses `category`, keep it.

If the current schema already uses `category_id`, keep that.

Do not invent a second category field during this refactor.

## DELETE → ARCHIVE

Normal product removal should be refactored from **Delete Product** to **Archive Product**.

```sql
UPDATE products
SET
  archived_at = ?,
  updated_at = ?
WHERE id = ?
  AND store_id = ?
  AND archived_at IS NULL;
```

Do not destroy:

- inventory history
- stock movements
- import history
- insight references
- reporting history

Confirmation copy:

```text
Archive Product?

This will remove "Rice 25kg" from the active catalog.
Its stock history will be kept and the product can be restored later.

[ Cancel ]
[ Archive Product ]
```

## RESTORE

```sql
UPDATE products
SET
  archived_at = NULL,
  updated_at = ?
WHERE id = ?
  AND store_id = ?
  AND archived_at IS NOT NULL;
```

Restore must keep the same product ID and historical records.

---

# 13. Recommended Service Contract

```ts
export interface CatalogService {
  createProduct(input: CreateProductInput): Promise<Product>;

  getProduct(
    storeId: string,
    productId: string,
  ): Promise<ProductDetail>;

  listProducts(
    input: CatalogQuery,
  ): Promise<CatalogPage>;

  updateProduct(
    storeId: string,
    productId: string,
    input: UpdateProductInput,
  ): Promise<Product>;

  archiveProduct(
    storeId: string,
    productId: string,
  ): Promise<void>;

  restoreProduct(
    storeId: string,
    productId: string,
  ): Promise<void>;
}
```

Category management should **not** be added to this interface.

Do not add `createCategory()`, `updateCategory()`, or `deleteCategory()` unless those operations already exist in the Store / Category module.

Catalog should only resolve/select existing valid categories.

---

# 14. Recommended Feature Structure

```text
src/
├── app/
│   └── (tabs)/
│       └── catalog/
│           ├── _layout.tsx
│           ├── index.tsx
│           ├── new.tsx
│           ├── archived.tsx
│           └── [productId]/
│               ├── index.tsx
│               └── edit.tsx
│
├── features/
│   └── catalog/
│       ├── components/
│       │   ├── CatalogRow.tsx
│       │   ├── CatalogSearch.tsx
│       │   ├── CatalogFilters.tsx
│       │   ├── CatalogEmptyState.tsx
│       │   ├── ProductForm.tsx
│       │   ├── CategorySelector.tsx
│       │   └── ArchiveProductDialog.tsx
│       │
│       ├── errors/
│       │   └── catalog.errors.ts
│       │
│       ├── repositories/
│       │   └── catalog.repository.ts
│       │
│       ├── schemas/
│       │   └── catalog.schema.ts
│       │
│       ├── services/
│       │   └── catalog.service.ts
│       │
│       └── types/
│           └── catalog.types.ts
│
├── features/
│   ├── inventory/
│   │   └── services/
│   │       └── inventory.service.ts
│   ├── stores/
│   │   └── ...
│   └── categories/
│       └── EXISTING CATEGORY IMPLEMENTATION
│
└── database/
    └── migrations/
```

`CategorySelector.tsx` is only a UI consumer of the existing category source.

It must not duplicate category business logic.

---

# 15. Domain Responsibility

```text
CatalogService
= product identity and metadata

Category / Store-Type Service
= available categories for the active store type

InventoryService
= current stock state

StockMovementService
= stock-changing transactions and movement history
```

Keep these boundaries strict.

---

# 16. Stock Status

Recommended derived rule:

```text
quantity <= 0
→ critical

quantity > 0 AND quantity <= reorderLevel
→ low

quantity > reorderLevel
→ healthy
```

UI colors:

```text
Healthy  #22C55E
Low      #F59E0B
Critical #EF4444
```

Always pair color with text.

---

# 17. Validation

### Product Name

```text
Required
Trim whitespace
Maximum reasonable length
```

### SKU

```text
Optional
Unique inside the active store when present
```

### Barcode

```text
Optional
Unique inside the active store when present
```

### Category

```text
Must come from the existing allowed categories
for the active store / store type.
```

### Initial Quantity

```text
Required on product creation
Must be >= 0
```

### Reorder Level

```text
Must be >= 0
```

### Unit

```text
Required or defaulted by existing domain rules
```

### Notes

```text
Optional
Length limited
```

---

# 18. Example Zod 4 Schema

Adapt field names to the real existing database schema.

```ts
import * as z from 'zod';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => value || undefined)
    .optional();

export const createProductSchema = z.object({
  storeId: z.string().min(1),

  name: z
    .string()
    .trim()
    .min(1, 'Product name is required.')
    .max(120),

  sku: optionalText(64),
  barcode: optionalText(128),

  categoryId: z
    .string()
    .min(1, 'Select a category.'),

  unit: z
    .string()
    .trim()
    .min(1)
    .max(32),

  initialQuantity: z
    .number()
    .finite()
    .min(0, 'Initial quantity cannot be negative.'),

  reorderLevel: z
    .number()
    .finite()
    .min(0, 'Reorder level cannot be negative.'),

  notes: optionalText(500),
});

export type CreateProductInput =
  z.infer<typeof createProductSchema>;
```

If the existing category implementation does **not** use `categoryId`, replace it with the field already used by the project.

Do not change the category schema merely because this example uses an ID.

The service must additionally verify that the selected category is valid for the active store type.

---

# 19. Typed Domain Errors

```ts
export class CatalogError extends Error {}

export class ProductNotFoundError
  extends CatalogError {}

export class StoreNotFoundError
  extends CatalogError {}

export class DuplicateSkuError
  extends CatalogError {}

export class DuplicateBarcodeError
  extends CatalogError {}

export class InvalidCategoryForStoreError
  extends CatalogError {}

export class ArchivedProductError
  extends CatalogError {}

export class InvalidCatalogInputError
  extends CatalogError {}
```

Example UI mapping:

```text
DuplicateSkuError
→ This SKU already exists in this store.

DuplicateBarcodeError
→ This barcode is already assigned to another product in this store.

InvalidCategoryForStoreError
→ This category is not available for the current store type.
```

Do not expose raw SQLite error text directly to users.

---

# 20. Transaction Rules

Creating a product with initial inventory should use one database transaction.

```text
BEGIN
  validate store
  validate category
  insert product
  insert inventory row
  insert INITIAL movement when quantity > 0
COMMIT
```

On failure:

```text
ROLLBACK
```

For Expo SQLite on native platforms, use an exclusive transaction for ordered writes that must remain in one transaction.

```ts
await db.withExclusiveTransactionAsync(async (tx) => {
  // writes executed with tx
});
```

Use bound parameters instead of concatenating user input into SQL.

---

# 21. Database Refactor Rules

## Do

Keep:

```text
products
inventory
stock_movements
```

Keep the existing category schema/source.

Preserve historical product IDs.

Preserve store isolation.

Preserve stock movement history.

## Do Not

Do not rename:

```text
products → catalogs
```

Do not create a `catalogs` table only to support the new UI name.

Do not create a second category system.

Do not allow Catalog screens to write quantity directly.

Do not hard-delete normal products with stock history.

Do not query products without `store_id`.

---

# 22. Catalog Empty State

```text
No products yet

Start building this store's catalog by adding
your first product.

[ Add Product ]
[ Import Inventory ]
```

Do not present an empty catalog as an error.

---

# 23. Catalog Archived State

Archived items should be accessible from a secondary action:

```text
Catalog
    ⋯
    Archived Products
```

Do not mix archived products into the standard catalog by default.

---

# 24. Success Feedback

After create:

```text
Product Added

"Rice 25kg" has been added to your catalog.

[ View Product ]
[ Add Another ]
```

After update:

```text
Product Updated
```

After archive:

```text
Product archived
[ Undo ]
```

After restore:

```text
Product restored
```

Use compact feedback instead of large blocking modals for minor operations.

---

# 25. Refactor Implementation Order

```text
1. Rename user-facing Products navigation to Catalog.

2. Rename route/screen labels.

3. Refactor product-list UI components to Catalog naming.

4. Keep Product as the domain entity.

5. Connect CategorySelector to the existing store-type category source.

6. Add/confirm store-scoped Catalog repository queries.

7. Implement CatalogService CRUD boundaries.

8. Move stock mutation out of product update logic if any exists.

9. Refactor Delete Product into Archive Product.

10. Add Archived Catalog + Restore.

11. Add typed Catalog domain errors.

12. Add validation for store/category compatibility.

13. Add transaction-based product + inventory creation.

14. Add CRUD tests.

15. Add strict cross-store isolation tests.
```

---

# 26. Required Tests

```text
CREATE
✓ creates product in selected store
✓ creates inventory row
✓ creates initial movement when quantity > 0
✓ rejects negative initial stock
✓ rejects invalid store category
✓ rejects duplicate SKU within same store
✓ rejects duplicate barcode within same store

READ
✓ returns products only from active store
✓ does not return archived products by default
✓ cannot read another store's product through current store context

UPDATE
✓ updates metadata
✓ validates category against active store type
✓ does not directly modify stock quantity

ARCHIVE
✓ archives product
✓ keeps movement history
✓ removes item from normal Catalog list

RESTORE
✓ restores same product record
✓ retains historical stock movements

STORE ISOLATION
✓ Store A query never returns Store B products
✓ Product ID from Store B cannot be edited from Store A context
```

---

# 27. Final Refactored Architecture

```text
CATALOG MODULE
│
├── Catalog List
│   ├── Search
│   ├── Filter
│   ├── Sort
│   └── Product Rows
│
├── Add Product
│   └── CategorySelector
│       └── Existing Store-Type Category Source
│
├── Product Details
│
├── Edit Product
│
├── Archive Product
│
└── Archived Products / Restore
        │
        ▼
CatalogService
        │
        ├── validation
        ├── store isolation
        ├── category validation
        ├── duplicate rules
        └── archive rules
        │
        ▼
CatalogRepository
        │
        ▼
Expo SQLite
        │
        ├── products
        ├── inventory
        └── stock_movements
```

Ownership boundary:

```text
Store / Category design
    ↓ supplies valid categories

Catalog
    ↓ owns product metadata

Inventory
    ↓ owns stock state

Stock Movements
    ↓ owns stock-changing history
```

---

# 28. Definition of Done

The Catalog update/refactor is complete when:

- The user sees **Catalog** instead of **Products** as the module name.
- Individual records are still called **Products**.
- The database still uses the existing product domain model.
- Product CRUD is store-scoped.
- Category options come from the existing store-type category system.
- No duplicate category architecture is introduced.
- Product creation and initial inventory writes are transactional.
- Product editing cannot bypass inventory transaction rules.
- Normal removal uses archive/restore.
- Archived product history remains intact.
- Cross-store access is prevented at the service/repository level.
- Catalog, Inventory, and Stock Movement responsibilities remain separate.

---

# Data Sources

- StockPilot project decisions: offline-first, local-only, multiple independent stores, Expo Router, Expo SQLite, service-layer domain rules, strict store isolation, and category selection based on the configured store type.
- Expo Router: https://docs.expo.dev/router/introduction/
- Expo Router core concepts: https://docs.expo.dev/router/basics/core-concepts/
- Expo SQLite: https://docs.expo.dev/versions/latest/sdk/sqlite/
- Zod 4: https://zod.dev/packages/zod
