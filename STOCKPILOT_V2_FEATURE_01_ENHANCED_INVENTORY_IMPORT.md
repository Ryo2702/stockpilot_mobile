# StockPilot 2.0.0 — Feature 01: Enhanced Inventory Import

## Delivered

- Mobile-first **Import Inventory** screen with store context, three-step progress, file details, field mapping, product preview, filters, search, editing, confirmation, progress, success, partial-issue, and failure states.
- File readers for XLSX, XLS, DOCX, TXT, and existing CSV imports. The parser recognizes spreadsheet headers, pipe/tab-delimited rows, and labeled DOCX/TXT product blocks.
- Review statuses for ready products, existing products, possible matches, missing fields, invalid quantity/price, duplicate SKU, and duplicate barcode.
- Matching priority: barcode, then SKU, then normalized product name. Exact existing matches require explicit approval before stock is updated.
- No records are written during selection, parsing, mapping, or review. Approved rows are revalidated and written in one inventory transaction.
- Cost price is stored in the new `products.cost_price` column; selling price continues to use the existing `products.current_price` field.

## Version and checks

- App and package version: `2.0.0`
- Parser dependencies: SheetJS `xlsx` 0.20.3 and `fflate`
- Verified with `npx tsc --noEmit` and `npm test -- --runInBand src/services/inventory/inventory-file-import.service.test.ts`.

## Intentional limit

- Imports are capped at 10 MB. Add streaming parsers only if larger imports become a real need.
