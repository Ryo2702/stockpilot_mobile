# StockPilot Free Access

This list describes the features currently available without a premium purchase or active entitlement.

## Free features

- Onboarding and initial store setup
- Store type selection and store profile details
- Dashboard and stock health overview
- Product and catalog management:
  - Add products
  - Edit products
  - Archive and restore products
  - Product categories
  - SKU and barcode information
  - Cost and selling prices
  - Reorder and critical stock levels
- Inventory management:
  - Stock in
  - Stock out
  - Stock adjustments
  - Current stock quantities
  - Stock movement history
  - Healthy, low-stock, and out-of-stock status
- Barcode scanning and barcode printing
- Multiple store management and store switching
- Inventory import:
  - CSV
  - XLS
  - XLSX
  - DOCX
  - TXT
- Inventory export
- Point of sale:
  - Product search
  - Barcode product lookup
  - Custom sale quantities
  - Cart quantity changes
  - Checkout
  - Checkout confirmation
  - Receipts
  - Sales history
- Reports and analytics:
  - Inventory reports
  - Stock movement reports
  - Sales reports
  - Product search and filters
  - Report history
  - CSV report export
- Backup and restore
- Local backup sharing where the platform supports it
- Light and dark appearance modes
- Local PIN security
- Recovery questions
- Fingerprint unlock where supported by the device
- Settings, legal information, and app information

## Access status

The current build does not enforce a premium feature gate. These features are available through the normal application flow after onboarding and, when enabled, local security unlock.

The Premium and Restore Purchase screens are present as placeholders, but their actions are disabled because purchase verification is not available in this build.

## Source references

- [Home navigation](src/screens/home/HomeScreen.tsx)
- [Settings and access placeholders](src/features/settings/SettingsScreen.tsx)
- [POS module](src/features/pos)
- [Inventory module](src/features/inventory)
- [Catalog module](src/features/catalogs)
- [Insights and reports](src/features/insights)
