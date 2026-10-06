---
name: Together
description: Compact shared expenses with white surfaces, blue balances and frosted navigation.
colors:
  primary: "#2468e8"
  ink: "#18243a"
  muted: "#65748a"
  canvas: "#f4f7fc"
  surface: "#ffffff"
  input: "#f4f7fc"
  border: "#e2e9f3"
  dark-canvas: "#0d1421"
  dark-surface: "#172233"
typography:
  body:
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "16px"
  input:
    fontSize: "16px"
rounded:
  surface: "19px"
  control: "13px"
  dialog: "26px"
---

# Together

An iPhone-first household wallet. Use white and blue, compact rows, readable amounts and a single clear action hierarchy. Reduce containers and repeated labels before reducing font sizes.

## Composition

- Home: a rich blue balance card with couple identity and settlement access, a compact period snapshot, then the latest five transactions. Recent activity uses one neutral list with inset dividers and category icon tints. Align amounts to the right, give the author a clear line beside the date, and keep sheet context below. Home scrolls as needed.
- Sheets: one outstanding-spending summary, inline Open/Archived controls and Unsettled only, search, then compact sheet cards with full start/end dates and visible actions.
- Sheet detail: a back header, sheet totals and couple shares, search/filter controls, and grouped expense rows. Back appears only on nested screens; retain edge swipe.
- Settle: scope and couple selection, the balance and payment action, then inline expandable sheet balances and spending analysis. Keep history and copy actions available.
- Settings: unboxed signed-in identity, household and preference rows, direct merchant/category controls, export and sign-out. Theme remains in the top-right header.

## Type and surfaces

Use system fonts. Body and editable input text stay at 16px; regular controls and labels are 14px or larger. Use 12–13px for supporting dates, counts and captions. Amounts use tabular numerals. Do not clip essential information.

White content surfaces sit on a cool neutral canvas. Blue is the primary action colour; the Home balance is the strongest surface. Use blue-family category tints with restrained violet for dining. Keep whole-row tints faint. Light and dark modes use the same composition and spacing.

Night mode uses a deep navy canvas, layered graphite surfaces, soft off-white text and muted blue actions. The balance card, dock, dialogs, chart bars and picker selection each have deliberate night colours. Preserve readable contrast without white avatar fills, bright borders or blue glow. Apply the saved theme before the main app renders, and keep the page canvas and browser theme colour in sync.

Use blur only on the floating dock and header chrome. Skip refraction filters, decorative art and nested decorative cards. Respect reduced motion and reduced transparency.

Header Back actions use one 44px circular glass control with a thin outer border, a bright inner rim and a bold rounded chevron. Share it across sheet details, dialogs and pickers. Keep Back on nested screens and dialogs, with a tinted navy material in night mode and an opaque fallback for reduced transparency.

## Entry and pickers

Add Expense is one natural scrolling column: expense details, payment/split, optional note/receipt, then one Save action. Hide the sheet selector when only one open sheet exists. The native receipt input stays hidden. Cancelling the iPhone picker must preserve the open draft.

Merchant selection uses compact searchable tiles with initials, frequency and a clear selected state. Categories use compact icon rows. Keep Add and maintenance controls available. Edits do not change historical expenses.

## Interaction and data

Retain creator-only edit/delete, settlement locking and audited reversal, receipt references, draft recovery, private access, member invitations, charts, export, recurring bills and the calculator. Record payment is a confirmation action, not a transfer.

Minimum primary interactive targets remain 44px. Swipe actions retain visible menu alternatives. Keep all input, saving, empty and error states in the normal flow.

Startup uses a centered 64px mark, Together wordmark and quiet loading dots on the theme canvas. Include the loading content in the initial HTML so it appears before the app module loads. Respect reduced motion and open the household as soon as it is ready.

## Style ownership

Load exactly four CSS files, in this order:

1. `style.css`: shared tokens, controls, dialogs, onboarding and system feedback.
2. `theme.css`: dark tokens, main screens, sheet/expense rows, charts and navigation.
3. `home-recent.css`: Home period snapshot, recent transactions, drafts and reminders.
4. `add-expense-polish.css`: expense entry, calculator, receipt controls and pickers.

Update the owning rule. Do not add another override stylesheet. Keep `!important` limited to hidden elements and explicit form-flow guarantees. Cache versions in `index.html` must change with releases.
