# StockPilot: Product Summary and Website Brief

## Product in one sentence

StockPilot is a mobile-first, offline-first inventory app for independent business owners: track products, stock movement, stock health, and separate stores directly on the device—even without internet.

**Tagline:** _Smarter Inventory. Less Worry._

## Who it is for

Independent retailers and small operators that need a simple daily inventory tool: retail, grocery, mini/convenience stores, cafés, pharmacies, hardware, apparel, electronics, food and beverage, wholesale, warehouses, motor shops, and similar businesses.

## Shipped product features

| Area | What StockPilot does |
| --- | --- |
| Dashboard | Shows the selected store, product and unit totals, healthy/low/critical stock counts, stock-health guidance, recent activity, and quick actions. |
| Products | Add, edit, search, filter, sort, archive, and restore products. A product can have a SKU, barcode, category, unit, price, notes, reorder level, and critical level. |
| Inventory | Record stock-in, stock-out, or a physical-count adjustment with a reason, reference, and note. Current stock cannot go below zero. |
| Movement trail | Each successful inventory change creates an immutable dated movement record, so changes remain traceable. |
| Stock health | Classifies items as healthy, low, or critical from their current quantity and configured thresholds. |
| Barcode tools | Scans QR codes and common retail barcodes with the camera; looks up the matching local product and can print a Code 128 label. |
| Insights | Provides stock-risk and movement views, period comparisons, trends, category breakdowns, top/slow/no-movement products, restock estimates, saved local reports, and CSV report export. |
| Multiple stores | Keeps each store's products, quantities, movements, and insights separate; one business currently supports up to **3 active stores**. |
| Import, export, and backup | Imports reviewed/validated inventory CSV files, exports a store CSV, and creates, shares, inspects, and restores portable local `.spbackup` files. |
| Settings | Supports store type/currency/address settings, product defaults, light/dark/system appearance, storage information, local legal/help pages, and an optional 4–6 digit PIN. |

## Product core and trust points

- **Offline and local by design.** Operational data lives in an on-device SQLite database; there is no required internet connection for core inventory work.
- **Reliable quantities.** Inventory updates and their movement records are committed together, with validation preventing negative stock.
- **Store isolation.** A product or inventory record cannot be changed through another store's context.
- **Portable data.** People control when they export a CSV or save/share a database backup.
- **Private by default.** On native devices, the optional PIN uses SecureStore; on web, it falls back to the local database.

## Website-safe positioning

Suggested hero:

> **Simple inventory management for independent businesses.**  
> Track products, keep stock healthy, and stay in control—even offline.

Use these supported messages:

- Know what is in stock, low, or critical.
- Scan items and record stock changes quickly.
- Keep a clear history of every inventory movement.
- Manage up to three stores independently.
- Keep your operational data on your device and export it when you choose.

Do **not** claim the following, because they are not implemented in this app:

- Cloud sync, hosted accounts, a web dashboard, automatic server backups, or cross-device sync.
- Team collaboration, staff roles, multi-user access, or real-time updates.
- AI assistance, sales/POS analytics, push alerts, or online barcode lookup.
- Unlimited stores; the active-store cap is three.
- A live paid plan or working purchase flow; the Premium and Restore Purchase screens are placeholders.

## Recommended one-page website

1. **Hero** — value proposition, app icon/mascot, and a single real CTA.
2. **At a glance** — dashboard and stock-health outcome.
3. **Feature stories** — products and movements, barcode scanning, multiple stores, insights, and offline/local data.
4. **How it works** — create a store, add/import products, then manage daily stock.
5. **Privacy and portability** — explain device-local data, user-controlled CSV/backup export, and camera/file permissions.
6. **FAQ and final CTA** — answer offline, backup, store-limit, and supported-device questions; link Terms and Privacy Policy.

Keep the first version a static marketing site. It needs no backend unless the CTA is a waitlist/contact form.

## Existing website assets

All `highlight/*.png` files are 1672 × 941 product visuals ready for a responsive landing page:

| Website use | Existing asset |
| --- | --- |
| Hero / overview | `highlight/about-stockpilot.png` or `highlight/core-features-overview.png` |
| Dashboard / stock health | `highlight/dashboard.png`, `highlight/stock-health.png` |
| Product catalog / daily inventory | `highlight/products.png`, `highlight/inventory.png` |
| Barcode scanner | `highlight/scanner.png` |
| Multiple stores | `highlight/multiple-stores.png` |
| Insights | `highlight/insights.png` |
| Offline/local-data section | `highlight/offline-first.png` |
| Brand | `assets/app-icon.png`, `assets/images/stockpilot/headMascot-transparent.png`, `assets/mascot-clean.mp4` |

**Asset QA before publishing:** Some highlight mockups show unsupported AI, an old navigation layout, or product deletion. Replace, crop, or update those visuals so the website reflects the current app, which archives/restores products instead of deleting them.

## What is still needed before launch

- A public destination for the primary CTA: App Store/Google Play/TestFlight links, a web demo, or a waitlist form/email.
- A support email/contact route and approved public Terms and Privacy Policy URLs.
- A confirmed launch/pricing statement. Do not publish pricing or purchase CTAs while the purchase flow is disabled.
- Current approved screenshots (especially any that must replace the outdated highlight mockups), plus optional testimonials or real customer metrics.
- A domain, HTTPS hosting, canonical URL, title/description, Open Graph image, favicon, descriptive image alt text, and compressed WebP/AVIF image variants.

## Technical context

The app is built with Expo SDK 57, React Native, TypeScript, Expo Router, Expo SQLite, SecureStore, Expo Camera, file/document tools, printing/sharing, and React Native Web. The current Expo web route initializes the local app database and intentionally permits only one open database tab, so it should not be reused as the public SEO marketing homepage.

## Source of truth in this repository

- `ABOUT.md` — product overview and stack
- `src/screens/home/HomeScreen.tsx` — actual navigation and app flow
- `src/features/` — dashboard, catalog, inventory, insights, and settings UI
- `src/services/` — inventory, catalog, store, backup, and settings workflows
- `src/database/schema/` — local data model
- `src/components/ui/BarcodeScannerModal.tsx` — supported scan formats
