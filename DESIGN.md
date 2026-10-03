---
name: Together Studio
description: Compact shared household expenses with calm green surfaces and liquid-glass navigation.
colors:
  primary: "#17634e"
  ink: "#172c28"
  muted: "#61716c"
  canvas: "#f4f6f3"
  surface: "#ffffff"
  input: "#f2f5f2"
  border: "#dce4df"
  dark-canvas: "#111917"
  dark-surface: "#1c2823"
typography:
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "15px"
  input:
    fontSize: "16px"
rounded:
  surface: "22px"
  control: "14px"
  dialog: "28px"
---

# Together Studio

Together should feel calm, compact and native on iPhone without imitating system UI so aggressively that usability suffers.

## Hierarchy

Use green for primary actions and status accents. White/light surfaces sit on a neutral canvas. Amounts and balance direction receive visual priority; metadata stays quiet.

Keep one clear action hierarchy per screen. Do not place two controls that perform the same primary action.

## Navigation

The signed-in app has Home, Sheets, Add, Settle and Settings in the main dock.

When Add Expense is open, the main dock is not repeated inside the modal. The user saves or closes the draft, then returns to the app.

Nested sheet views have an explicit back control and support the existing edge-swipe behavior.

## Screen ownership

- Home owns overall balance and recent activity.
- Sheets owns period management and open/settled expense browsing.
- Settle owns settlement history and spending analytics; show payment actions before charts.
- Settings owns configuration, catalog maintenance and export.

Do not duplicate analytics in Settings or payment history in multiple places on Settle. Home and Settle must use the same overall balance scope. Remove decorative progress indicators unless they represent measurable progress.

## Expense form

The form is a normal scrolling column. Cards never shrink below their contents.

Use this order:
1. Expense details.
2. Payment & split.
3. Optional details and receipt.
4. Save.

Hide the sheet selector when only one open sheet is available. Inputs stay 16px or larger to prevent Safari focus zoom. The receipt file input itself remains hidden; only the visible Choose control opens it. Cancelling the native picker must not dismiss the dialog.

## Components

Content surfaces use thin borders and restrained shadows. Reserve blur and translucent treatment for navigation and modal chrome. Avoid wrapping cards inside decorative cards without a functional reason.

Minimum interactive target remains 44px. Swipe actions must retain visible button/menu alternatives.

## CSS maintenance

`public/add-expense-polish.css` owns Add Expense layout. Other screen-specific stylesheets own their respective screens.

Do not solve regressions by continually appending higher-specificity `!important` patches. Consolidate obsolete selectors when touching a component. Delete unreferenced legacy stylesheets rather than keeping multiple dormant design systems.


## Premium system layer

`public/premium-system.css` is the final cross-screen layer. It owns shared card radii/elevation, category icon tinting, press motion, saving feedback, toast material and reduced-motion behavior. Screen styles continue to own layout.

Use the shared premium variables before creating a new card shell. Category colour stays on compact icon tiles rather than full cards.


## Shared visual tokens

The core screens share `--ui-card-radius`, `--ui-card-border`, `--ui-card-shadow`, `--ui-green`, `--ui-green-soft`, `--ui-motion` and `--ui-ease` from `theme.css`. Use these before introducing another hard-coded card shell.

Category colour is restrained and functional: green groceries, warm dining, blue bills, violet travel, neutral other. The category tint belongs to the icon tile, not the entire transaction card.

System feedback must be visible but quiet: short press compression, glass toast feedback, a thin saving progress indicator, and reduced-motion support.
