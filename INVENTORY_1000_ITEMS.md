# 1,000-Item Inventory CSV

File: [inventory-1000-items.csv](./inventory-1000-items.csv)

- Contains 1,000 unique demo items for `Demo Store`.
- Uses the existing inventory import columns.
- Includes `stock_in` and `stock_out` totals for each item.
- `quantity` is calculated as `stock_in - stock_out`.
- The current app importer uses `quantity` and records the import adjustment; the supplemental movement totals remain available in the CSV for test data and reporting.
