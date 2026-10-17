---
name: Together
description: A warm, ink-on-paper household ledger where each couple has its own colour.
colors:
  paper: "#f5f4ef"
  surface: "#ffffff"
  ink: "#15161a"
  ink-2: "#52565e"
  ink-3: "#8a8d95"
  accent: "#17785a"
  couple-a: "#5d5cdc"
  couple-b: "#e06c35"
  caution: "#9a5a07"
  danger: "#c23b31"
  dark-paper: "#0f1013"
  dark-surface: "#1a1b1f"
typography:
  family: "Geist (self-hosted variable font), system fallback"
  body: "16px / 1.45"
  input: "16px minimum"
rounded:
  control: "14px"
  card: "20px"
  feature: "28px"
  pill: "999px"
---

# Together

Two couples, one household ledger. The interface reads like quality stationery: warm paper, white cards, near-black ink. Colour carries meaning instead of decoration.

## Principles

1. **Colour means something.** Indigo is couple A and tangerine is couple B, everywhere people appear: avatars, dots beside names, split bars and the payment flow. Green means interaction, settled or money coming to you. Amber means money you owe or something unfinished. Red is reserved for destructive actions.
2. **One strong surface per screen.** On Home it is the dark balance card. On Settle it is the balance summary. Everything else stays quiet.
3. **Numbers first.** Amounts use tabular figures. Large amounts are set in parts: a small currency symbol, bold dollars and lighter cents. Screen readers get the plain amount.
4. **Native feel.** Use bottom sheets on phones, 44px minimum touch targets, 16px input text so iOS never zooms, swipe actions with visible menu alternatives, and the iPhone edge-back gesture.
5. **Calm motion.** Use short eased transitions (160–380ms): the dock indicator slides, sheets rise, bars grow once. Everything stops under `prefers-reduced-motion`.

## Tokens

Defined once in `foundation.css` on `:root`, with dark values under `:root[data-theme=dark]` and `.theme-dark`:

- **Surfaces:** `--paper` (canvas), `--surface` (cards), `--sunken` (tracks, icon tiles), `--input`, `--dialog`, `--line`, `--line-soft`.
- **Ink:** `--ink`, `--ink-2` and `--ink-3` set the three levels of emphasis.
- **Meaning:** `--accent`, `--positive`, `--caution` and `--danger`, each with a `-soft` tint.
- **Couples:** `--couple-a` and `--couple-b`, each with `-soft` and `-ink` variants. Apply them with the `.couple-a` or `.couple-b` class, which exposes `--couple` to its children.
- **Hero:** `--hero*` tokens for the dark balance card.
- **Shape and depth:** radii `--r-sm` (10px), `--r-md` (14px), `--r-lg` (20px), `--r-xl` (28px) and `--r-pill`; shadows `--shadow-1`, `--shadow-2`, `--shadow-float` and `--shadow-hero`. Dark mode drops card shadows in favour of hairlines.
- **Motion:** `--ease`, `--fast` and `--slow`.

Category tiles read `--tone` from their category class (groceries, food, bills, travel, wifi, home, movie, gift or other) and tint themselves with `color-mix`. Every consumer falls back with `var(--tone, …)` so a parent row's tone reaches its icon.

## Type

The typeface is Geist, a variable font served from `/fonts` (OFL licence) with a system-font fallback.

| Role | Size | Weight |
| --- | --- | --- |
| Hero amount | 52px | 650 |
| Page title | 30px | 680 |
| Card amount | 34–46px | 650 |
| Section heading | 17px | 600 |
| Body | 16px | 400 |
| Meta | 13px, ink-3 | 400 |
| Eyebrow | 12px, uppercase, +0.06em | 600 |

## Components

- **Buttons:** `.primary` is an ink pill (light ink in dark mode). `.secondary` is a surface pill with a hairline. `.danger` uses a red tint. `.text-button` uses the accent colour.
- **Balance flow:** `balanceFlow(from, to, settled)` in `app.js` shows payer → receiver with stacked avatars and names. The dashed line animates unless the balance is settled.
- **Segmented controls:** a sunken track holds the options, and the active option is a raised surface.
- **Lists:** grouped cards with inset hairlines (Settings, recent transactions, expense days).
- **Dock:** a floating frosted bar with a sliding selection pill. Add is the ink circle in the centre.
- **Sheets (dialogs):** bottom sheets on phones, with a grabber, a sticky header and keyboard-aware height. At the first level only Close is shown; Back appears on nested steps.

## Screens

- **Home:** greeting and household title; the dark balance card (status, amount, direction, flow, Settle up); draft banner; period card with a category ribbon and the top three categories; upcoming bills; recent transactions.
- **Sheets:** unsettled summary, Open/Archived control with an "Unsettled only" switch, search, then sheet cards. Swiping a card reveals edit/pin and archive/delete.
- **Sheet detail:** back header, sheet summary, Open/Settled and Filters, search with sort, result count with export, then day-grouped expenses.
- **Settle:** a grouped scope card (View, Share for), the balance summary with flow and Record payment, balances by sheet, summary/history tools and the spending breakdown.
- **Settings:** an identity card in the user's couple colour, then the Household, Preferences and "Lists & data" groups, export and sign out.
- **Welcome:** brand, gradient headline, a live-looking example card with a settle flow, three steps, then the calls to action.

## Style ownership

There are four stylesheets, loaded in this order and organised by cascade layers declared in `foundation.css` (`base, components, screens, entry`):

1. `foundation.css`: font, tokens, base elements, shared components, dialogs, feedback and onboarding.
2. `screens.css`: shell, headers, Sheets, sheet detail, Settle, Settings and the dock.
3. `home.css`: balance card, period snapshot, reminders and recent activity.
4. `entry.css`: expense form, calculator, receipts and pickers.

Change the rule that owns a style; don't add override files. Keep `!important` to hidden elements and the form-flow guarantees in `entry.css`. Bump the shared `?v=` in `index.html` with every release.

Icons come from Lucide (ISC licence) and are generated into `public/icons.js`. Add new ones there by name.
