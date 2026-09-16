# StockPilot UI Style System

**Scope:** CSS/design-system rules only.\
**Purpose:** Define the visual foundation, theme, typography, spacing,
icons, and reusable UI component styling for StockPilot.

> This document does **not** define backend logic, APIs, database
> behavior, authentication, or business logic.

------------------------------------------------------------------------

## 1. Design Direction

StockPilot should feel like a clean, practical inventory application
built for daily use.

### Principles

-   Clean and professional
-   Mobile-first
-   High readability
-   Minimal visual noise
-   Flat surfaces
-   No gradients
-   Consistent spacing
-   Clear visual hierarchy
-   Strong but controlled use of blue
-   Status colors only when they communicate meaning
-   Avoid the generic "AI dashboard" appearance
-   Prefer functional UI over decorative UI
-   Keep components visually consistent across every module

The interface should primarily use neutral white/gray surfaces with blue
as the main interactive color.

------------------------------------------------------------------------

## 2. Icon System

Use **Lucide Icons** as the default icon library.

### Rules

-   Do not create custom SVG icons when a suitable Lucide icon exists.
-   Do not fetch icons from an API.
-   Do not use emoji as interface icons.
-   Keep icon stroke width visually consistent.
-   Use icons primarily at `16px`, `18px`, `20px`, and `24px`.
-   Icons inside buttons should normally match the text color.
-   Icon-only buttons must have an accessible label.
-   Custom SVG is reserved for genuine brand assets such as the
    StockPilot logo or mascot.

### Suggested Lucide Icons

  Action          Icon
  --------------- ---------------------
  Dashboard       `LayoutDashboard`
  Store           `Store`
  Products        `Package`
  Inventory       `Boxes`
  Camera          `Camera`
  Insights        `Lightbulb`
  Search          `Search`
  Notifications   `Bell`
  Settings        `Settings`
  Add             `Plus`
  Edit            `Pencil`
  Delete          `Trash2`
  Archive         `Archive`
  Filter          `SlidersHorizontal`
  Sort            `ArrowUpDown`
  Back            `ArrowLeft`
  Forward         `ChevronRight`
  Close           `X`
  More actions    `Ellipsis`
  Success         `CircleCheck`
  Warning         `TriangleAlert`
  Error           `CircleAlert`
  Info            `Info`

------------------------------------------------------------------------

## 3. Theme Tokens

Use CSS custom properties as the source of truth.

``` css
:root {
  /* Brand */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;

  /* Neutral */
  --color-white: #ffffff;
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;

  /* Semantic */
  --color-success: #22c55e;
  --color-success-bg: #f0fdf4;

  --color-warning: #f59e0b;
  --color-warning-bg: #fffbeb;

  --color-danger: #ef4444;
  --color-danger-bg: #fef2f2;

  --color-info: #3b82f6;
  --color-info-bg: #eff6ff;

  /* Surfaces */
  --background-app: #f8fafc;
  --background-surface: #ffffff;
  --background-subtle: #f9fafb;

  /* Text */
  --text-primary: #111827;
  --text-secondary: #4b5563;
  --text-muted: #6b7280;
  --text-disabled: #9ca3af;
  --text-on-primary: #ffffff;

  /* Border */
  --border-default: #e5e7eb;
  --border-strong: #d1d5db;
  --border-focus: #2563eb;

  /* Radius */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadow */
  --shadow-sm: 0 1px 2px rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 12px rgb(0 0 0 / 0.08);

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Controls */
  --control-sm: 32px;
  --control-md: 40px;
  --control-lg: 48px;

  /* Animation */
  --duration-fast: 120ms;
  --duration-normal: 180ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1);
}
```

------------------------------------------------------------------------

## 4. Typography

Use a clean sans-serif UI typeface.

Recommended stack:

``` css
--font-sans:
  Inter,
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  sans-serif;
```

Base:

``` css
body {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.5;
  color: var(--text-primary);
  background: var(--background-app);
  -webkit-font-smoothing: antialiased;
}
```

### Type Scale

  Style          Size   Weight   Line Height
  ------------ ------ -------- -------------
  Display        32px      700          40px
  H1             28px      700          36px
  H2             24px      700          32px
  H3             20px      600          28px
  Title          18px      600          26px
  Body           16px      400          24px
  Body Small     14px      400          20px
  Label          14px      500          20px
  Caption        12px      400          16px

Avoid excessive bold text. Weight should indicate hierarchy, not
decorate every second sentence like the interface is shouting for
attention.

------------------------------------------------------------------------

## 5. Spacing System

Use a **4px base unit**.

Primary layout spacing should normally use:

``` text
4px
8px
12px
16px
20px
24px
32px
40px
48px
```

Recommended defaults:

-   Screen horizontal padding: `16px`
-   Large screen/container padding: `24px`
-   Card padding: `16px`
-   Dense card padding: `12px`
-   Section gap: `24px`
-   Component gap: `12px`
-   Inline icon/text gap: `8px`
-   Form field gap: `16px`

Do not invent arbitrary spacing such as `13px`, `19px`, or `27px` unless
there is a genuine visual reason.

------------------------------------------------------------------------

## 6. Borders and Radius

Default border:

``` css
border: 1px solid var(--border-default);
```

Recommended radius:

-   Small controls: `6px`
-   Inputs/buttons: `8px`
-   Cards: `12px`
-   Large panels/modals: `16px`
-   Pills/badges: `9999px`

Do not make every container excessively rounded. StockPilot is an
inventory tool, not a collection of floating marshmallows.

------------------------------------------------------------------------

## 7. Buttons

### Primary Button

``` css
.button-primary {
  min-height: var(--control-md);
  padding: 0 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  border: 1px solid var(--color-primary-600);
  border-radius: var(--radius-md);

  background: var(--color-primary-600);
  color: var(--color-white);

  font: inherit;
  font-size: 14px;
  font-weight: 600;

  cursor: pointer;
  transition:
    background var(--duration-normal) var(--ease-standard),
    border-color var(--duration-normal) var(--ease-standard);
}

.button-primary:hover {
  background: var(--color-primary-700);
  border-color: var(--color-primary-700);
}
```

### Secondary Button

White surface, neutral border, dark text.

### Ghost Button

Transparent background with no visible border until interaction.

### Danger Button

Use red only for destructive actions such as permanent deletion.

### Button Sizes

-   Small: `32px`
-   Medium: `40px`
-   Large/mobile primary action: `48px`

Do not use color to distinguish every possible action. Primary blue
should identify the most important action.

------------------------------------------------------------------------

## 8. Icon Buttons

``` css
.icon-button {
  width: 40px;
  height: 40px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  border: 1px solid transparent;
  border-radius: var(--radius-md);

  background: transparent;
  color: var(--text-secondary);
}
```

Use Lucide for the icon itself.

Examples:

-   Search
-   Filter
-   Notifications
-   Settings
-   More actions
-   Close
-   Back

------------------------------------------------------------------------

## 9. Input Fields

Inputs should be quiet, readable, and predictable.

``` css
.input {
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;

  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);

  background: var(--background-surface);
  color: var(--text-primary);

  font: inherit;
  font-size: 14px;

  outline: none;
}

.input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgb(37 99 235 / 0.12);
}

.input::placeholder {
  color: var(--text-disabled);
}
```

Field structure:

``` text
Label
Input
Helper/Error message
```

Use Lucide icons for optional leading/trailing controls such as
`Search`, `Eye`, `Calendar`, or `X`.

------------------------------------------------------------------------

## 10. Search Field

Search is a specialized input, not an entirely different species of
component.

Structure:

``` text
[Search icon] Search products...
```

Use the Lucide `Search` icon.

Optional clear action uses `X`.

------------------------------------------------------------------------

## 11. Cards

Default card:

``` css
.card {
  padding: 16px;

  background: var(--background-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
}
```

Cards should use borders before shadows.

Use shadows only when elevation is actually meaningful, such as:

-   floating menus
-   dialogs
-   popovers

Do not put a shadow under every dashboard card.

### Card Types

-   Standard Card
-   Summary Card
-   Product Card
-   Inventory Card
-   Store Card
-   Insight Card
-   Empty-State Card
-   Stock Health Card

------------------------------------------------------------------------

## 12. Status Badges

Use semantic status colors consistently.

### Healthy

Green:

``` text
#22C55E
```

### Low Stock

Orange:

``` text
#F59E0B
```

### Critical / Out of Stock

Red:

``` text
#EF4444
```

Example:

``` css
.badge {
  min-height: 24px;
  padding: 2px 8px;

  display: inline-flex;
  align-items: center;
  gap: 4px;

  border-radius: var(--radius-full);

  font-size: 12px;
  font-weight: 600;
}
```

Status colors should communicate inventory state, not decorate unrelated
components.

------------------------------------------------------------------------

## 13. Navigation

Navigation should clearly indicate location without overwhelming the
content.

### Bottom Navigation

Primary mobile navigation can contain:

-   Dashboard
-   Products
-   Camera
-   Inventory
-   Insights

Use Lucide icons.

The Camera action may use a blue filled circular or rounded button to
distinguish scanning as a primary action.

### Active State

Use:

-   Primary blue icon
-   Primary blue label
-   Optional subtle blue background

Inactive navigation uses muted gray.

------------------------------------------------------------------------

## 14. Header / App Bar

Typical structure:

``` text
[Back / Brand]        [Search] [Bell] [More]
Title
Optional subtitle
```

Mobile app bar:

-   Height: approximately `56px`
-   Horizontal padding: `16px`
-   Icon controls: `40px`
-   Title: `18–20px`, semibold

Use Lucide icons for all utility actions.

------------------------------------------------------------------------

## 15. Notification Badge

Use a small red badge only when unread notifications exist.

``` css
.notification-badge {
  min-width: 16px;
  height: 16px;
  padding: 0 4px;

  display: inline-flex;
  align-items: center;
  justify-content: center;

  border-radius: var(--radius-full);
  background: var(--color-danger);
  color: var(--color-white);

  font-size: 10px;
  font-weight: 700;
}
```

Do not show a decorative badge containing `0`.

------------------------------------------------------------------------

## 16. Lists and Rows

Inventory applications naturally contain a lot of rows. Humans
apparently enjoy owning thousands of objects and then needing software
to remember where they put them.

Standard row:

``` text
[Icon / Thumbnail] Product Name          Quantity
                   SKU / Category        Status
```

Recommended:

-   Minimum row height: `56px`
-   Comfortable row: `64–72px`
-   Horizontal padding: `16px`
-   Separator: `1px solid var(--border-default)`

Keep the most important information visually dominant.

------------------------------------------------------------------------

## 17. Product Item

Product list items should prioritize:

1.  Product name
2.  Current quantity
3.  Stock status
4.  SKU/category
5.  Optional secondary information

Do not require product images.

Use `Package` as a neutral Lucide fallback when an image is unavailable.

------------------------------------------------------------------------

## 18. Stock Health

Stock health uses three core states:

  State      Color    Meaning
  ---------- -------- ------------------------------
  Healthy    Green    Stock level is acceptable
  Warning    Orange   Stock is becoming low
  Critical   Red      Immediate attention required

The StockPilot mascot may visually reflect these states, but status must
never depend solely on the mascot or color.

Always include a text label.

Example:

``` text
Healthy
Low Stock
Critical
```

------------------------------------------------------------------------

## 19. Insight Cards

Insights should look actionable, not like a fake futuristic AI console.

Structure:

``` text
[Status Icon]

Critical Stock Risk

Rice 25kg may run out soon based on its current movement.

Recommended action:
Restock approximately 20 units.

[View product]
```

Use standard surfaces and typography.

No glowing borders.\
No gradients.\
No neon "AI" effects.

------------------------------------------------------------------------

## 20. Empty States

Structure:

``` text
[Lucide icon or StockPilot mascot]

No products yet

Add your first product to start tracking inventory.

[Add Product]
```

Keep the message concise.

Recommended Lucide icons:

-   `PackageOpen`
-   `Store`
-   `SearchX`
-   `Inbox`
-   `FileX`

------------------------------------------------------------------------

## 21. Dialogs and Sheets

For mobile interfaces, prefer bottom sheets for contextual actions.

Use modal dialogs for:

-   confirmations
-   destructive actions
-   important decisions

Typical structure:

``` text
Title
Description

[Cancel] [Confirm]
```

Do not open a modal for trivial actions that could happen directly.

------------------------------------------------------------------------

## 22. Dropdown / Action Menu

Use Lucide `Ellipsis` for contextual menus.

Example:

``` text
Edit
Move Stock
Archive
Delete
```

Each menu action can use its corresponding Lucide icon.

Dangerous actions should be visually separated where appropriate.

------------------------------------------------------------------------

## 23. Tabs

Tabs should use a simple underline or subtle selected background.

Avoid giant pill-style navigation for every tab group.

Example:

``` text
All | Healthy | Low Stock | Critical
```

------------------------------------------------------------------------

## 24. Segmented Control

Use when switching between a small number of closely related views.

Example:

``` text
[List] [Grid]
```

Use Lucide `List` and `Grid2X2` when icons improve recognition.

------------------------------------------------------------------------

## 25. Toggle / Switch

Use switches only for immediate binary settings.

Examples:

-   Notifications enabled
-   Sound enabled

Do not use switches for actions requiring confirmation.

------------------------------------------------------------------------

## 26. Progress and Loading

Use:

-   compact spinner for short waits
-   skeleton content when layout is known
-   progress bar for measurable operations

Avoid full-screen loading states unless the whole screen genuinely
cannot function yet.

------------------------------------------------------------------------

## 27. Toasts

Use toasts for brief action feedback.

Examples:

``` text
Product added
Inventory updated
Store archived
```

Do not use toast notifications for errors requiring user decisions.

------------------------------------------------------------------------

## 28. Destructive Actions

Deletion should use:

-   Lucide `Trash2`
-   Red semantic color
-   Confirmation when data loss is meaningful

Archive should generally be preferred over deletion where
recovery/history matters.

------------------------------------------------------------------------

## 29. Focus and Accessibility

Interactive controls must expose visible focus states.

``` css
:focus-visible {
  outline: 2px solid var(--color-primary-600);
  outline-offset: 2px;
}
```

Requirements:

-   Do not communicate state using color alone.
-   Maintain readable contrast.
-   Icon-only buttons require accessible names.
-   Touch targets should generally be at least `44px × 44px`.
-   Body text should normally remain at least `14px`.
-   Avoid tiny low-contrast gray text.

------------------------------------------------------------------------

## 30. Motion

Motion should communicate state changes, not entertain the user while
they are trying to count boxes.

Recommended duration:

``` text
120–200ms
```

Use motion for:

-   button state transitions
-   menu opening
-   bottom sheets
-   tab transitions
-   expanding content
-   mascot idle behavior

Respect reduced-motion preferences:

``` css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

------------------------------------------------------------------------

## 31. Responsive Rules

### Mobile

``` text
0–767px
```

-   Single-column layout
-   Bottom navigation
-   16px screen padding
-   Full-width primary actions where useful
-   Bottom sheets for contextual actions

### Tablet

``` text
768–1023px
```

-   More horizontal breathing room
-   Two-column layouts where useful
-   Navigation may move to a rail/sidebar

### Desktop

``` text
1024px+
```

-   Persistent sidebar allowed
-   Main content max width where appropriate
-   Multi-column dashboards allowed
-   Tables can replace condensed mobile lists

------------------------------------------------------------------------

## 32. Component Inventory

The default StockPilot design system should provide styles for:

``` text
AppShell
AppHeader
BottomNavigation
Sidebar
PageHeader
SectionHeader

Button
IconButton
FloatingCameraButton

Input
SearchInput
Textarea
Select
Checkbox
Radio
Switch

Card
SummaryCard
StoreCard
ProductCard
InventoryCard
InsightCard
StockHealthCard

Badge
StatusBadge
NotificationBadge

List
ListItem
ProductRow
InventoryRow
StoreRow

Tabs
SegmentedControl

DropdownMenu
ContextMenu

Dialog
BottomSheet
Popover

Toast
Alert

EmptyState
Skeleton
Spinner
ProgressBar

Divider
Avatar
Tooltip
```

------------------------------------------------------------------------

## 33. Component Variants

Components should use explicit variants rather than one-off CSS.

Example button API:

``` text
variant:
- primary
- secondary
- ghost
- danger

size:
- sm
- md
- lg

state:
- default
- hover
- focus
- disabled
- loading
```

Badge variants:

``` text
neutral
primary
success
warning
danger
info
```

Card variants:

``` text
default
interactive
selected
critical
```

Keep variants limited. If a component needs seventeen variants, the
component abstraction has probably lost the argument.

------------------------------------------------------------------------

## 34. CSS Naming

Prefer predictable semantic names.

Example:

``` css
.app-shell {}
.page-header {}
.section-header {}

.button {}
.button-primary {}
.button-secondary {}

.card {}
.card-header {}
.card-content {}
.card-footer {}

.input-group {}
.input-label {}
.input {}
.input-message {}

.status-badge {}
.stock-health {}
```

If CSS Modules are used:

``` text
Button.module.css
Card.module.css
Input.module.css
StockHealth.module.css
```

Avoid class names based purely on appearance such as:

``` text
.blue-box
.big-gray-text
.left-card
```

Components change. Semantic meaning survives longer.

------------------------------------------------------------------------

## 35. Global CSS Foundation

``` css
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
}

html,
body {
  min-height: 100%;
}

body {
  margin: 0;
  background: var(--background-app);
  color: var(--text-primary);
}

button,
input,
textarea,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
}

img,
svg {
  display: block;
  max-width: 100%;
}
```

------------------------------------------------------------------------

## 36. Visual Rules

### Use

-   White surfaces
-   Light neutral application background
-   Thin borders
-   Blue primary actions
-   Lucide icons
-   Strong text hierarchy
-   Consistent spacing
-   Status colors with semantic meaning
-   Clear active/focus states
-   Simple cards
-   Flat UI

### Avoid

-   Gradients
-   Glassmorphism
-   Excessive shadows
-   Neon colors
-   Random SVG icons
-   API-fetched icons
-   Emoji icons
-   Excessive rounded containers
-   Decorative charts
-   Glowing AI effects
-   Multiple competing primary colors
-   Oversized typography
-   Excessive animations
-   Visual effects that do not improve usability

------------------------------------------------------------------------

## 37. Brand Asset Exception

Lucide should handle interface icons.

The following can remain custom brand assets:

-   StockPilot logo
-   StockPilot app icon
-   StockPilot wordmark
-   StockPilot cat mascot
-   Stock-health mascot states

These are brand illustrations, not generic UI icons, so replacing them
with Lucide would defeat the point.

------------------------------------------------------------------------

## 38. Source of Truth

For implementation, follow this priority:

1.  This UI Style System for visual rules.
2.  Shared theme tokens for colors, spacing, typography, radius, and
    motion.
3.  Shared reusable components.
4.  Module-specific composition.
5.  One-off styling only when a genuine module requirement cannot be
    represented by the shared system.

Do not duplicate the same visual values independently inside every
module.

------------------------------------------------------------------------

## 39. Final Constraint

This design system defines **presentation only**.

It must not introduce:

-   API calls
-   backend dependencies
-   database logic
-   authentication logic
-   network icon services
-   unnecessary SVG packages
-   module business rules

**Lucide is the default UI icon system.**

Custom SVG/illustration assets are reserved for StockPilot branding and
mascot artwork.

The result should remain visually consistent whether the interface is
displaying one store, multiple independent stores, products, inventory
movement, stock health, camera actions, or insights.

------------------------------------------------------------------------

## 40. shadcn/ui Component Foundation

Use **shadcn/ui** as the default component foundation for the web/React
implementation of this design system.

### Current Direction

-   Component system: **shadcn/ui**
-   Component base for a new project: **Base UI**
-   Icons: **Lucide**
-   Styling: **Tailwind CSS + CSS variables**
-   Theme: StockPilot tokens defined by this document
-   Component ownership: generated component source stays inside the
    project and can be customized
-   Do not introduce a second general-purpose component library unless a
    requirement genuinely cannot be handled by shadcn/ui

For an existing project, keep its current shadcn component base rather
than migrating merely for novelty.

### Initialization

For a new compatible web project:

``` bash
npx shadcn@latest init
```

For an existing configured project, add only the components StockPilot
actually needs instead of installing the entire registry.

Example:

``` bash
npx shadcn@latest add button card input label badge dialog alert-dialog sheet dropdown-menu select checkbox switch tabs table tooltip skeleton spinner progress separator textarea
```

### StockPilot Component Mapping

  StockPilot UI                         shadcn/ui Foundation
  ------------------------------------- -------------------------
  Primary / Secondary / Danger Button   `Button`
  Icon Button                           `Button`
  Text Input                            `Input`
  Search Input                          `Input` / `Input Group`
  Text Area                             `Textarea`
  Field Label                           `Label` / `Field`
  Select                                `Select`
  Native Select when appropriate        `Native Select`
  Checkbox                              `Checkbox`
  Radio                                 `Radio Group`
  Toggle Setting                        `Switch`
  Standard Card                         `Card`
  Status Badge                          `Badge`
  Modal                                 `Dialog`
  Destructive Confirmation              `Alert Dialog`
  Mobile Action Panel                   `Sheet` or `Drawer`
  Context Actions                       `Dropdown Menu`
  Right-click Context Menu              `Context Menu`
  Tooltip                               `Tooltip`
  Popover                               `Popover`
  Tabs                                  `Tabs`
  Segmented Actions                     `Toggle Group`
  Data Table                            `Table` / `Data Table`
  Loading Placeholder                   `Skeleton`
  Loading Indicator                     `Spinner`
  Progress                              `Progress`
  Empty State                           `Empty`
  Separator                             `Separator`
  Sidebar                               `Sidebar`
  Pagination                            `Pagination`
  Search / Command Interface            `Command`
  Scrollable Panel                      `Scroll Area`
  Alert Message                         `Alert`

### Composition Rule

Do not use raw shadcn components directly throughout feature screens
when StockPilot needs a stable domain-specific component.

Preferred structure:

``` text
components/
├── ui/                 # shadcn-generated primitives
├── stockpilot/         # reusable StockPilot compositions
│   ├── status-badge
│   ├── product-row
│   ├── inventory-row
│   ├── store-card
│   ├── insight-card
│   ├── stock-health-card
│   ├── empty-state
│   └── page-header
└── layout/
```

`components/ui` is the primitive layer.

`components/stockpilot` is the application design-system layer.

Feature screens compose these components rather than recreating button,
card, badge, dialog, and input styles repeatedly.

### Styling Rule

shadcn/ui is a **component foundation**, not permission to replace the
StockPilot visual identity with its default appearance.

StockPilot tokens remain authoritative for:

-   primary blue
-   neutral surfaces
-   semantic stock colors
-   typography
-   radius
-   spacing
-   borders
-   focus states
-   motion

Customize the generated components to match those tokens.

### Lucide Rule

Keep **Lucide** as the icon library used with shadcn/ui.

Example:

``` tsx
import { Plus, Search, Bell, Camera } from "lucide-react"
```

Do not add a second icon package just because a component example on the
internet happened to use one.

### Component Variants

Use shadcn component variants for reusable states.

Buttons:

``` text
default
secondary
outline
ghost
destructive
```

StockPilot may wrap or rename these semantically:

``` text
primary
secondary
ghost
danger
```

Inventory status is separate from button intent:

``` text
healthy
warning
critical
neutral
```

Do not turn every stock state into a button variant.

### Forms

Use shadcn primitives consistently for forms:

``` text
Label
Input / Select / Checkbox / Switch
Description
Validation message
```

StockPilot form spacing and typography must still follow this design
system.

### Dialog vs Sheet

Use:

-   `Dialog` for focused desktop confirmations/forms.
-   `Alert Dialog` for meaningful destructive confirmation.
-   `Sheet` or `Drawer` for mobile contextual workflows.
-   `Dropdown Menu` for compact contextual actions.

Avoid opening a dialog when an inline action is simpler.

### Tables vs Mobile Lists

Desktop inventory views may use shadcn `Table` or a composed
`Data Table`.

Mobile should normally use StockPilot rows/cards instead of forcing a
desktop table into a tiny viewport.

### Accessibility

Do not remove accessibility behavior supplied by shadcn/ui's underlying
primitives while restyling them.

Preserve:

-   keyboard navigation
-   focus visibility
-   accessible labels
-   dialog focus management
-   menu keyboard behavior
-   disabled states
-   semantic form controls

### Dependency Discipline

Add shadcn components as they become necessary.

Do not run `add --all` by default. A component system is supposed to
reduce clutter, not manufacture a museum of unused TSX files.

### Final Component Rule

When a suitable shadcn/ui primitive exists:

1.  Use the shadcn primitive.
2.  Apply StockPilot theme tokens.
3.  Use Lucide for icons.
4.  Compose a StockPilot-specific wrapper when the pattern is reused.
5.  Create a custom component from scratch only when the existing
    primitives do not fit the requirement.
6.  Use custom SVG only for genuine StockPilot brand artwork or visuals
    that Lucide cannot represent.
