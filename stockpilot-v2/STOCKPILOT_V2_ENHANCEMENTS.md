# StockPilot — Version 2.0.0 Enhancement Specification

**Version:** 2.0.0  
**Document Type:** Product Enhancement / Implementation Specification  
**Project:** StockPilot  
**Status:** Planned Enhancement  

---

## 1. Overview

StockPilot Version 2.0.0 expands the application from inventory tracking into a more complete inventory and point-of-sale workflow.

The release focuses on:

- Faster inventory imports
- Barcode-assisted product lookup
- A built-in POS workflow
- Downloadable soft receipts
- Manual product search when barcodes are unavailable
- Stronger reporting and stock-value analytics
- Cleaner UI/UX
- Removal of unused QR-code and package-related functionality

The application should remain simple for independent business owners and should avoid adding unnecessary complexity to normal inventory operations.

---

## 2. Version 2.0.0 Goals

The primary goals of this release are:

1. Reduce manual work when importing inventory.
2. Allow inventory items to be sold directly through StockPilot.
3. Make barcode scanning optional rather than mandatory.
4. Provide useful sales and inventory-value reporting.
5. Improve navigation, visual consistency, and transaction workflows.
6. Remove features that no longer contribute to the core product direction.

---

# 3. Enhanced Inventory Import

## 3.1 Supported Import Formats

Version 2.0.0 must support importing inventory data from:

- `.xlsx`
- `.xls`
- `.docx`
- `.txt`

CSV support may remain available if it already exists.

The import workflow should convert supported source files into a normalized inventory preview before anything is written to the database.

---

## 3.2 Import Flow

Recommended flow:

```text
Select File
    ↓
Read File
    ↓
Extract Rows / Product Data
    ↓
Normalize Data
    ↓
Validate Fields
    ↓
Match Existing Products
    ↓
Show Import Preview
    ↓
Resolve Errors / Duplicates
    ↓
Confirm Import
    ↓
Transactional Database Write
    ↓
Import Summary
```

The application must never silently insert malformed inventory records.

---

## 3.3 Import Preview

Before committing an import, show:

- Product name
- SKU, if available
- Barcode, if available
- Quantity
- Cost price
- Selling price
- Category
- Unit
- Existing product match
- Validation status

Each row should have a visible status such as:

- Ready
- Existing product
- Missing required field
- Invalid quantity
- Invalid price
- Duplicate barcode
- Duplicate SKU

---

## 3.4 Existing Product Handling

When an imported product already exists, StockPilot should allow the import service to identify it using available identifiers.

Recommended matching priority:

```text
Barcode
→ SKU
→ Normalized Product Name
```

Do not automatically merge uncertain matches.

If a match is ambiguous, require the user to review it before import.

---

## 3.5 DOCX and TXT Import

DOCX and TXT documents may not contain structured spreadsheet columns.

The importer should attempt to extract recognizable product rows using deterministic parsing rules.

Examples of recognizable structures:

```text
Coke 1.5L | 20 | 75.00
Sprite 1.5L | 12 | 72.00
Rice 25kg | 8 | 1250.00
```

or

```text
Product: Coke 1.5L
Quantity: 20
Price: 75.00
```

If the structure cannot be confidently parsed, the user must be shown the extracted content and allowed to correct the mapping before the import is saved.

Do not invent missing quantities or prices.

---

# 4. Point-of-Sale Module

## 4.1 Purpose

Version 2.0.0 introduces a POS module for selling products that already exist inside the selected store inventory.

The POS should remain tightly connected to StockPilot inventory rather than becoming a separate sales system.

---

## 4.2 POS Main Screen

Recommended sections:

### Header

Display:

- Current business
- Current store
- POS title
- Current transaction indicator

### Product Lookup

Provide:

- Barcode scanner
- Search input
- Search results
- Recently selected products where useful

### Cart

Each cart line should include:

- Product name
- Quantity
- Unit selling price
- Line subtotal
- Increase quantity
- Decrease quantity
- Remove action

### Transaction Summary

Display:

- Total items
- Subtotal
- Discounts, if supported
- Total amount

Avoid adding tax, discount, customer, or payment complexity unless those features are explicitly implemented.

---

# 5. Barcode Scanning

## 5.1 Barcode POS Lookup

The POS can scan a physical product barcode.

Flow:

```text
Open POS
    ↓
Start Barcode Scanner
    ↓
Scan Barcode
    ↓
Search Selected Store Inventory
    ↓
Product Found?
   ↙       ↘
 Yes       No
 ↓          ↓
Add to     Show Not Found
Cart       + Manual Search
```

---

## 5.2 Barcode Rules

A barcode should identify a product only within the appropriate inventory context.

Required behavior:

- Scan barcode
- Search current store inventory
- Find associated product
- Verify available stock
- Add product to cart
- Prevent checkout quantities above available stock

The scanner must not create new products automatically during POS transactions.

---

# 6. Manual Product Search

Barcode availability must not be required.

If a product:

- Has no barcode
- Has a damaged barcode
- Cannot be scanned
- Uses a barcode not stored in StockPilot

the user must still be able to search for the product manually.

---

## 6.1 Search Fields

Manual search may match:

- Product name
- SKU
- Barcode text
- Category

Search should be restricted to the currently selected store.

---

## 6.2 Search Result Information

Each result should show enough information to avoid selling the wrong item:

- Product name
- Available stock
- Selling price
- SKU where available
- Barcode where available
- Stock status

Selecting a result adds the item to the current POS cart.

---

# 7. POS Checkout

Before checkout:

1. Revalidate every cart item.
2. Re-read current stock quantities.
3. Verify that requested quantities are available.
4. Calculate the final transaction total.
5. Commit the sale and stock deductions in one database transaction.

A failed stock update must prevent the sale from being partially saved.

---

## 7.1 Inventory Deduction

Successful POS transactions must create corresponding stock movement records.

Example movement:

```text
Type: SALE
Quantity Change: -2
Reference: POS Transaction ID
Product: Coca-Cola 1.5L
Store: Main Store
```

The inventory service remains the only layer allowed to mutate stock quantities.

The POS screen must never directly update stock values.

---

# 8. Soft Receipt

After a successful sale, StockPilot should generate a digital receipt.

The receipt should be viewable immediately and downloadable.

---

## 8.1 Receipt Content

Recommended receipt fields:

```text
Business Name
Store Name
Store Address

Receipt Number
Transaction Date
Transaction Time

--------------------------------
Product        Qty       Amount
--------------------------------

Subtotal
Total

Thank you message
```

Optional fields can include:

- SKU
- Payment method
- Cash received
- Change

Only display optional fields when the corresponding POS functionality exists.

---

## 8.2 Receipt Download

The user should be able to:

- View receipt
- Download receipt
- Share receipt using supported device sharing features

Recommended output:

```text
PDF
```

A lightweight image export may also be added later, but PDF should be the primary receipt format.

---

# 9. Reports and Analytics Enhancement

Version 2.0.0 should expand inventory reporting beyond quantity-based stock metrics.

Reporting should include financial values derived from product pricing.

---

## 9.1 Core Inventory Metrics

Recommended dashboard/report metrics:

- Total products
- Total units in stock
- Low-stock products
- Out-of-stock products
- Total inventory cost value
- Total inventory selling value
- Potential gross value
- Sales value
- Units sold
- Stock added
- Stock removed

---

## 9.2 Inventory Cost Value

Calculate:

```text
Inventory Cost Value =
SUM(Current Quantity × Cost Price)
```

This represents the approximate amount invested in currently available stock.

---

## 9.3 Inventory Selling Value

Calculate:

```text
Inventory Selling Value =
SUM(Current Quantity × Selling Price)
```

This represents the theoretical revenue if the currently available inventory were sold at its stored selling prices.

It should not be presented as guaranteed revenue.

---

## 9.4 Potential Gross Margin

Where both cost price and selling price are available:

```text
Potential Gross Margin =
Inventory Selling Value - Inventory Cost Value
```

This is a theoretical inventory-level figure and must remain distinct from realized profit.

---

## 9.5 POS Sales Analytics

Once POS transactions exist, reports can include:

- Gross sales
- Number of transactions
- Units sold
- Average transaction value
- Top-selling products
- Slow-moving products
- Sales by day
- Sales by week
- Sales by month
- Sales by store

---

## 9.6 Reporting Filters

Reports should support filtering by:

- Store
- Date range
- Product
- Category

Multiple stores must never be mixed unless the user intentionally selects an all-stores or business-level view.

---

# 10. Data Model Enhancements

Version 2.0.0 may require additional local database entities.

Recommended additions are shown below.

---

## 10.1 POS Transactions

```text
pos_transactions

id
business_id
store_id
receipt_number
subtotal
total
created_at
updated_at
```

---

## 10.2 POS Transaction Items

```text
pos_transaction_items

id
transaction_id
product_id
quantity
unit_cost
unit_price
line_total
created_at
```

Store the transaction-time price instead of relying only on the product's current price.

This preserves historical receipt accuracy when prices change later.

---

## 10.3 Product Pricing

Products should support, where not already available:

```text
cost_price
selling_price
barcode
sku
```

Price fields should use a consistent storage strategy and should not rely on floating-point calculations without controlled rounding.

---

# 11. Removed Features

Version 2.0.0 removes the following features from the active product scope.

## QR Code Functionality

Remove:

- QR-code product scanning
- QR-code inventory lookup
- QR-code-specific actions
- QR-code UI controls that are no longer used

Barcode scanning remains supported.

---

## Package Feature

Remove the existing package-related feature/module if it is no longer part of the StockPilot product direction.

Removal must include:

- UI routes
- Navigation entries
- Feature services
- Unused database dependencies
- Validation schemas
- Package-specific actions
- Dead code
- Tests that exist only for the removed feature

Database migrations that have already shipped must not be rewritten destructively.

Instead, create a forward migration when schema cleanup is required.

---

# 12. UI/UX Enhancement

Version 2.0.0 should improve the existing visual system without replacing familiar workflows unnecessarily.

The design should remain clean, professional, mobile-first, and optimized for small business owners.

Avoid decorative UI that makes routine inventory operations slower.

---

## 12.1 Navigation

Recommended primary navigation:

```text
Dashboard
Inventory
POS
Reports
Settings
```

Product management may remain inside Inventory where appropriate.

Avoid adding excessive top-level navigation.

---

## 12.2 POS UX

The POS experience should prioritize speed.

Important actions should require minimal taps:

```text
Scan / Search
→ Select
→ Quantity
→ Checkout
→ Receipt
```

The user should always be able to see:

- Cart
- Total
- Available stock
- Checkout action

---

## 12.3 Import UX

Import screens should clearly separate:

1. File selection
2. Parsing
3. Mapping
4. Validation
5. Preview
6. Confirmation
7. Result

Do not write records while the user is still reviewing the import preview.

---

## 12.4 Visual Consistency

Maintain consistent:

- Typography
- Spacing
- Radius
- Inputs
- Cards
- Buttons
- Dialogs
- Empty states
- Error states
- Loading states
- Stock status indicators

Use status colors only when they communicate meaningful state.

Do not turn every analytics card into a different color just because software apparently enjoys becoming a carnival when nobody stops it.

---

# 13. Architecture Rules

Version 2.0.0 must preserve the existing StockPilot architectural direction.

Recommended rules:

- Screens contain presentation logic only.
- Domain logic belongs in services.
- Database access belongs in the database/repository layer.
- Stock mutation must be transactional.
- Negative stock is prohibited.
- Store isolation is mandatory.
- POS must use inventory services for stock deduction.
- Imports must use validation before persistence.
- Reports should read derived data instead of mutating inventory.
- Receipt generation must use saved transaction snapshots.
- Removed features must not leave reachable dead routes.

---

# 14. Suggested Module Structure

```text
src/
├── app/
│   ├── inventory/
│   ├── pos/
│   ├── reports/
│   └── settings/
│
├── features/
│   ├── inventory/
│   │   ├── import/
│   │   ├── products/
│   │   └── stock/
│   │
│   ├── pos/
│   │   ├── barcode/
│   │   ├── cart/
│   │   ├── checkout/
│   │   └── receipt/
│   │
│   └── reports/
│       ├── inventory-value/
│       └── sales/
│
├── services/
│   ├── import.service.ts
│   ├── inventory.service.ts
│   ├── pos.service.ts
│   ├── receipt.service.ts
│   └── reports.service.ts
│
├── database/
│   ├── migrations/
│   ├── repositories/
│   └── queries/
│
└── validation/
    ├── import.schema.ts
    ├── pos.schema.ts
    └── product.schema.ts
```

Exact paths may be adjusted to match the established StockPilot project structure.

---

# 15. Error Handling

Version 2.0.0 should define clear domain errors for new workflows.

Examples:

```text
PRODUCT_NOT_FOUND
BARCODE_NOT_FOUND
INSUFFICIENT_STOCK
INVALID_IMPORT_FILE
IMPORT_PARSE_FAILED
IMPORT_VALIDATION_FAILED
DUPLICATE_BARCODE
DUPLICATE_SKU
EMPTY_CART
TRANSACTION_FAILED
RECEIPT_GENERATION_FAILED
```

User-facing error messages should be understandable and should not expose internal database errors.

---

# 16. Acceptance Criteria

Version 2.0.0 is considered functionally complete when the following conditions are met.

## Import

- Excel files can be selected and parsed.
- DOCX files can be selected and parsed when recognizable inventory data exists.
- TXT files can be selected and parsed when recognizable inventory data exists.
- Imported data is previewed before database insertion.
- Invalid rows are identified.
- Existing-product matches are identified.
- Import writes occur transactionally where required.

## POS

- A barcode can locate an existing product.
- Scanned products can be added to a cart.
- Products without barcodes can be found through manual search.
- Cart quantities cannot exceed stock.
- Checkout deducts inventory.
- Checkout creates stock movement history.
- Failed checkout does not partially deduct inventory.

## Receipt

- Successful transactions produce a receipt.
- Receipt values match the saved transaction.
- Receipt remains historically accurate after product price changes.
- Receipt can be downloaded.

## Reports

- Inventory cost value is available.
- Inventory selling value is available.
- Sales metrics are calculated from completed POS transactions.
- Reports can be filtered by store.
- Store data remains isolated.

## Removal

- QR-code functionality is removed from active workflows.
- Package functionality is removed from active workflows.
- Removed routes are inaccessible.
- Dead feature code is cleaned up where safe.

## UI/UX

- POS is accessible from primary navigation.
- Barcode and manual product lookup are both available.
- Import flow provides clear validation states.
- Reports clearly separate stock quantity, stock value, and sales data.
- Existing StockPilot visual language remains consistent.

---

# 17. Recommended Implementation Order

```text
01. Database migration
02. Product price/barcode model updates
03. Inventory import parser enhancement
04. Import validation + preview
05. POS domain service
06. Barcode product lookup
07. Manual product search
08. Cart state
09. Transactional checkout
10. Stock movement integration
11. Receipt generation
12. POS transaction history
13. Sales reporting
14. Inventory-value analytics
15. QR-code feature removal
16. Package feature removal
17. UI/UX refinement
18. Regression testing
19. Version 2.0.0 release validation
```

---

# 18. Non-Goals for Version 2.0.0

Unless separately approved, Version 2.0.0 should not automatically expand into:

- Customer CRM
- Employee management
- Payroll
- Accounting software
- Online ordering
- E-commerce
- Cloud synchronization
- Multi-user collaboration
- QR-code inventory workflows
- Package management
- AI-dependent import requirements

Keeping these outside the release prevents Version 2.0.0 from becoming the traditional software-development ritual of turning six useful features into thirty-seven unfinished ones.

---

# 19. Version 2.0.0 Summary

```text
ENHANCED
✓ Excel inventory import
✓ DOCX inventory import
✓ TXT inventory import
✓ Import preview and validation
✓ Inventory price analytics
✓ UI/UX improvements

NEW
✓ POS module
✓ Barcode-based product lookup
✓ Manual product search fallback
✓ Transaction-based stock deduction
✓ Downloadable soft receipt
✓ Sales analytics

REMOVED
✗ QR-code functionality
✗ Package feature
```

StockPilot 2.0.0 should remain inventory-first while adding the minimum sales workflow needed to connect stock management, product pricing, checkout, receipts, and reporting into one coherent local business tool.

---

## Data Sources

This specification is based on the Version 2.0.0 enhancement requirements provided directly by the StockPilot project owner in the current project conversation on September 28, 2026. No external data sources were required for this product-scope document.
