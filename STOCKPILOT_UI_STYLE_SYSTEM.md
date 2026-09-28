# StockPilot UI Style System

## StockPilot 2.0 — Mocha + Latte + Oat

**Scope:** React Native / Expo visual-system rules for the existing StockPilot product.

**Purpose:** Keep every current workflow visually consistent, easy to scan, and comfortable for repeated daily use. This document does not change business logic, data models, navigation structure, or product workflows.

StockPilot is an inventory, POS, reporting, and stock-management application. Its coffee-inspired palette should feel warm and trustworthy—not decorative, rustic, or café-like.

## 1. Design principles

1. Prioritize hierarchy before color.
2. Keep typography and icon weight consistent.
3. Make the current screen, its important information, and its next action clear within one to two seconds.
4. Use whitespace to separate unrelated work.
5. Give each screen one dominant visual priority.
6. Keep operational screens fast, compact, and practical.
7. Keep secondary information quiet.
8. Use semantic colors only for actual semantic meaning.
9. Favor rows, grouping, spacing, and type over decorative cards.
10. Preserve current navigation and workflows; visual consistency must not become an information-architecture rewrite.

The experience should be professional, modern, lightweight, clean, focused, warm, and suitable for daily business use.

## 2. Source of truth

The React Native token system is the implementation source of truth:

- `src/theme/tokens.ts` defines light and dark color tokens, spacing, radii, controls, and typography.
- `src/theme/ThemeProvider.tsx` resolves the persisted Light, Dark, or System appearance preference.
- Shared controls in `src/components/ui` consume those tokens before a feature introduces local styling.
- `src/features/settings/SettingsScreen.tsx` exposes the StockPilot 2.0 theme module and color-mode preference.

Do not add CSS variables, Tailwind configuration, another palette, or a parallel theme store to the mobile app. Use `useTheme()` or `useThemeStyles()` and existing tokens instead of hard-coded colors.

## 3. Brand palette

| Role | Name | Hex | Use |
| --- | --- | --- | --- |
| Brand anchor | Mocha Brown | `#6F4E37` | Page titles, important headings, active navigation, key totals, high-emphasis values, important icons, wordmark “Stock” |
| Interactive accent | Latte Caramel | `#C89F7A` | Primary actions, selected controls, active filters and tabs, focus borders, links, progress, chart series, wordmark “Pilot” |
| Quiet warm surface | Oat Cream | `#F6F0E8` | Secondary backgrounds, search, grouped settings, selected soft surfaces, information panels, filters, empty-state icon containers |

Mocha is an anchor, not a page background. Latte communicates interaction or selection, not a warning. Oat supports layout and must not overpower content.

### 3.1 Light appearance neutrals

| Token role | Hex |
| --- | --- |
| Screen background / structural white | `#FFFFFF` |
| Warm surface | `#F6F0E8` |
| Primary text | `#241C17` |
| Secondary text | `#746A62` |
| Muted text | `#9B928A` |
| Border | `#E6DED6` |
| Strong border | `#DDD4CB` |
| Disabled surface | `#F1ECE6` |
| Disabled text | `#AAA19A` |

Target balance: 60–70% white, 15–20% Oat Cream, 8–12% Mocha, and 5–8% Latte. The interface must look light first and warm second.

### 3.2 Token mapping

The existing `primary` scale remains the compatibility path for current screens:

| Token | Light role |
| --- | --- |
| `primary[50]` | Oat Cream soft surface |
| `primary[100]` / `primary[200]` | warm supporting and border tones |
| `primary[500]` / `primary[600]` | Latte Caramel interactive accent |
| `primary[700]` | Mocha Brown anchor |
| `primary[800]` / `primary[900]` | dark Mocha / primary text |

Use `primary[700]` for an anchored heading or icon, `primary[600]` for a selected or interactive control, and semantic tokens for inventory states. Do not use a token's numerical position as a reason to create a new color.

## 4. Semantic inventory colors

Inventory meaning stays independent from the brand palette.

| Meaning | Color | Required presentation |
| --- | --- | --- |
| Healthy / success | `#22C55E` | color + “Healthy” or “Success” label + optional icon |
| Low stock / warning | `#F59E0B` | color + “Low Stock” or warning label + optional icon |
| Critical / out of stock / error | `#EF4444` | color + explicit label + optional icon |

Never communicate status with color alone. Latte is never a warning color and Mocha is never a critical color.

## 5. Typography and spacing

Keep the project’s existing font family. Do not introduce decorative display fonts or uppercase every label.

| Role | Size | Weight |
| --- | --- | --- |
| Page title | 24–28px | Bold |
| Primary metric | 24–32px | Bold |
| Section title | 16–18px | Semibold |
| Product name | 15–17px | Semibold |
| Body | 14–16px | Regular |
| Metadata | 12–14px | Regular |
| Helper text | 12–13px | Regular |
| Button label | 14–16px | Semibold |

Prices, totals, quantities, and inventory values must remain especially readable.

Use the shared spacing scale:

| Space | Use |
| --- | --- |
| 4px | micro spacing |
| 8px | related elements |
| 12px | compact groups |
| 16px | standard separation |
| 24px | section separation |
| 32px | major separation |
| 48px+ | intentional breathing room only |

Operational surfaces such as Inventory, POS, Catalog, and Search use compact rows. Onboarding, empty states, and success screens may use more whitespace. Reports use compact metrics with deliberate section spacing.

### Motion

- Use a single, short 160ms fade when the main in-app section changes.
- Keep existing native modal fades and slides; they already communicate the destination without extra choreography.
- Do not add bounce, parallax, looping decoration, or animation that delays operational work.

## 6. Theme module and dark mode

Settings contains one **StockPilot 2.0 Theme** module:

- The visual identity is always Mocha + Latte + Oat; it is not a selectable legacy skin.
- The persisted color-mode options are **Light**, **Dark**, and **System**.
- System follows the device appearance.
- Do not add another color-picker, blue theme, or second appearance preference.

### 6.1 Dark appearance

| Role | Hex |
| --- | --- |
| Background | `#181411` |
| Surface | `#211B17` |
| Elevated / subtle surface | `#2A221D` |
| Primary text | `#F6F0E8` |
| Secondary text | `#C5BBB2` |
| Muted text | `#968C84` |
| Border | `#3A302A` |
| Interactive accent | `#C89F7A` |

Use the lighter Mocha-compatible token for dark selected text where necessary. Do not use raw `#6F4E37` as body text on dark surfaces. Semantic inventory colors remain semantically unchanged and need a dark supporting surface when required for contrast.

## 7. Shared component rules

### Buttons

- **Primary:** Latte Caramel background with `#241C17` text. Reserve it for one dominant action per local context.
- **Secondary:** white surface, warm neutral border, Mocha text.
- **Tertiary:** transparent surface, Mocha text.
- **Destructive:** semantic red only; never Mocha or Latte.
- Disabled controls use disabled neutral colors and remain visibly unavailable.

Examples of primary actions: Get Started, Continue, Add Product, Checkout, Complete Sale, Import, Export, and Save. Do not make every visible action primary.

### Inputs and search

- Default input: white, `#E6DED6` border, `#241C17` text, `#9B928A` placeholder.
- Focused input: white with Latte border; an optional very soft warm surface is acceptable.
- Error: semantic red border. Latte does not represent validation failure.
- Search: Oat Cream by default with no strong border; use white plus Latte border only on focus.

### Selected controls

- Selected chips, tabs, filters, radio buttons, checkboxes, and store selectors use Oat surface + Latte border + Mocha text/check where possible.
- A selected state must combine color with border, check/icon, and/or text—not color alone.
- Avoid solid Latte fills unless the control needs unusually strong emphasis.

### Cards, panels, and sheets

- Normal card: white with a subtle warm border.
- Highlighted card: Oat Cream.
- Important card: white or Oat Cream with a small Latte accent, not a full Mocha fill.
- Information panel: Oat Cream, Mocha icon and title, neutral body copy.
- Dialogs and bottom sheets: white background, neutral handle/divider, Mocha title, Latte primary action.
- Avoid nested cards, excessive shadows, and turning every settings row into a card.

### Loading, empty, and error states

- Skeletons use neutral gray only.
- Progress uses Latte.
- Empty states use intentional whitespace, a small Oat icon container, Mocha icon/title, neutral description, and Latte CTA.
- Keep navigation visible where possible.
- Error and destructive states use semantic red with clear text.

### Icons

Use Lucide-style icons with consistent stroke weights.

- 18–20px for inline actions.
- 20–24px for navigation and settings.
- 24–28px for important action icons.
- Default important icons use Mocha; muted icons use neutral gray; interactive icons use Mocha with an Oat or Latte supporting surface.
- Use an existing Lucide icon before creating custom SVG artwork.

## 8. Navigation and identity

Maintain the current application routes and workflows. Do not replace the existing navigation with a new information architecture merely to match a palette.

- Navigation background is white with an `#E6DED6` divider/border.
- Inactive icons and labels use neutral gray.
- Active icons and labels use Mocha, with an optional Latte indicator and Oat supporting surface.
- Keep camera/POS entry points prominent enough to find, but do not turn them into an oversized floating control.
- The current page must be identifiable immediately through active icon, label, and selected treatment.

The StockPilot wordmark uses Mocha for **Stock** and Latte for **Pilot**. The existing black StockPilot mascot remains black. Never recolor it brown or caramel; use the palette around it instead.

## 9. Screen application

### Onboarding, owner setup, and store setup

- Onboarding follows the active appearance: light uses white with sparse Oat supporting surfaces, while dark preserves its existing warm-dark background, surfaces, warm-light text, and caramel actions.
- Titles use Mocha and descriptions use neutral secondary text.
- Primary CTAs use Latte with dark text.
- In dark mode, keep the existing black mascot on its transparent asset, subtle off-screen background forms, 20px horizontal padding, 52px primary actions, and the same short step transition; refine hierarchy and spacing before changing color.
- First-store setup uses four compact groups: Store details, Store type, Currency & Format, and optional Location.
- Store name is required; Store code and Location are not. Keep name/code responsive and side by side only where width permits.
- Store types use the existing mascots in a compact horizontal selector—never a full vertical grid. Selected cards use Oat, Latte border/badge, and Mocha check.
- Currency and decimal places share a responsive row; small screens may stack them rather than shrink touch targets.
- Location starts collapsed with an Add Location action. Reveal address fields only after the owner asks for them, and provide Remove Location when expanded.
- Keep the current circular store selector: selected = Oat surface + Latte border + Mocha check; unselected = white with neutral border.
- Store-type chips follow the same selected-state system.
- Local-only information panels use Oat with Mocha icon.
- Do not overdecorate setup screens or add coffee imagery.

### Dashboard

- Preserve the existing dashboard structure.
- Greeting is secondary neutral; owner and major headings are Mocha.
- Store selector remains white with Mocha icon.
- Total Products is the dominant inventory metric: Oat surface, Mocha metric/icon, restrained Latte accent.
- Healthy, Low Stock, and Critical/Out of Stock remain semantic green, amber, and red; their cards are smaller than Total Products.
- Keep Stock Health useful but secondary. The mascot remains black.
- Inventory Value is an Oat-supported secondary section. Cost uses Mocha; selling value may use Latte.
- Today’s Sales main value uses Mocha. Charts use Latte as primary series and Mocha as supporting series. One obvious POS action may use Latte.
- Quick actions are mostly white or neutral; only the action that needs emphasis receives stronger Latte treatment.

### Inventory, Catalog, and product detail

- Keep these screens operational, dense, and row-oriented.
- Page titles use Mocha; store selectors stay white.
- Search uses Oat by default and white + Latte border on focus.
- Product rows are white. Product names are dark neutral, key price/quantity values may use Mocha, metadata stays neutral, and stock status stays semantic.
- Selected category/filter chips use Oat + Latte border + Mocha text.
- Add Product and primary stock actions use Latte with dark text.
- Product detail keeps Mocha for title/current quantity/cost, Latte for selling value, and semantic green only for clearly labeled positive potential margin.
- Archive and delete remain semantic destructive red.

### POS, scanner, cart, checkout, and receipt

- POS should be among the cleanest screens: Mocha title, white store context, Oat search, compact product rows, and a clear Latte add/checkout action.
- Selected category chips use Latte text treatment appropriate to contrast; unselected chips use Oat.
- Cart stays white; quantity controls use Oat; remove uses semantic red.
- The total is large, bold, and Mocha. Checkout is the strongest bottom action.
- Keep the scanner preview predominantly dark. Its frame uses Latte, not Oat; result sheets return to white with semantic stock status.
- Checkout avoids unrequested payment-method controls.
- Success is calm: semantic-green indicator, Mocha title/amount, Oat information panel, Latte receipt action, neutral new-sale action.
- Exported printable receipts remain predominantly white with Mocha name/total and only small Latte accents.

### Reports and analytics

- Preserve analytical density and existing report flows.
- Use Mocha for title, key values, ranking numbers, and supporting chart series.
- Use Latte for active tabs, primary chart series, progress fills, and selected filters.
- Use neutral grid/tracks and avoid random multi-color charts.
- Positive and negative change use semantic green and red.
- Gross Sales is the strongest metric; Transactions, Units Sold, and Average Sale stay quieter.
- Favor ranked product-performance lists over oversized decorative charts.

### Import and export

- Stepper: active Latte, completed Mocha, inactive neutral.
- File and store icons use Mocha; upload/select/import/export CTAs use Latte with dark text.
- Preview rows are white. Ready is semantic green, existing products use neutral/Oat treatment, warnings use semantic amber, and errors use semantic red.
- Export selected scope/format uses Oat + Latte border. Generated-file state uses Oat.

### Settings

- Settings remains mostly neutral and row-based.
- Page and section titles use Mocha.
- Icon containers use Oat and important icons use Mocha.
- Rows remain white with neutral chevrons and dividers.
- Active switches use Latte.
- The StockPilot 2.0 Theme module identifies the global Mocha + Latte + Oat identity and lets the user choose Light, Dark, or System.
- Save actions use Latte. Do not use warm accent colors to make every row loud.

## 10. Accessibility

- Never rely on color alone for state or inventory health.
- Use dark ink (`#241C17`) on Latte surfaces; do not use very light text there.
- Preserve accessible labels for icon-only controls.
- Maintain sufficient contrast for text, controls, focus borders, and semantic status labels in both appearances.
- Use clear labels such as Healthy, Low Stock, Critical, Out of Stock, Success, or Error alongside their semantic color.

## 11. Do not

- Do not return to StockPilot blue or introduce another brand accent.
- Do not use gradients, glassmorphism, neon, wood textures, coffee cups, coffee beans, rustic decoration, vintage café typography, or restaurant illustrations.
- Do not use giant Mocha page backgrounds.
- Do not make every surface Oat Cream, every button Latte, every metric emphasized, or every component a card.
- Do not add notification UI, workflow steps, controls, or features solely for visual decoration.
- Do not recolor the black mascot.
- Do not use color where typography, spacing, position, scale, alignment, or grouping communicates the hierarchy more clearly.

## 12. Final constraint

All current StockPilot 2.0 areas—onboarding, owner and store setup, dashboard, inventory, catalog, POS, scanner, cart, checkout, receipt, reports, analytics, product detail, import/export, settings, forms, search, filters, dialogs, sheets, empty states, loading states, and errors—must feel like one product.

Design importance, in order:

1. Typography
2. Position
3. Spacing
4. Scale
5. Color

Color supports hierarchy. It does not create hierarchy by itself.
