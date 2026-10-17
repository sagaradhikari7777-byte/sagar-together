# Together

Together is an iPhone-first household expense app for four people organised as two couples. It tracks shared expenses, couple allocations and settlements with a compact mobile interface.

Production: https://sagar-together.vercel.app  
Canonical repository: `sagaradhikari7777-byte/sagar-together` → `main`

## Core flow

- **Home:** the wallet card with your couple's balance, a fair-share bar and Settle up; draft recovery; the current sheet with a days-left ring and category ribbon; upcoming bills; recent activity.
- **Activity:** search merchant, category, payer/creator name, sheet, notes, date or amount; Open / Settled / All; filter by payer, author, receipt, category, sheet and dates. Results show a total with your couple's share and export to CSV.
- **Add:** a keypad-first expense sheet with a built-in calculator, merchant shortcuts, category, date, payer, split, sheet, note and receipt (with on-device scanning), a split preview and one Save.
- **Sheets:** open sheets and Archived. A sheet page shows its total, who paid against the fair share, who pays whom, and Expenses / Insights / Payments.
- **Settle up:** from Home or a sheet; choose a sheet if several have balances, review, then slide to record. Recording archives the sheet.
- **Household:** names, invitations and private access, payment history with reversal, recurring bills, merchants and categories, expense defaults, appearance (Auto / Light / Dark), full CSV export and sign out.

The previous interface is still available at `/classic/` on the same data.

## Development

Requires Node.js 22.

```bash
npm install
npm test
npm run build
npm run dev
```

Vercel is configured to run `npm test && npm run build`. A failed unit test blocks production deployment. The previous GitHub Actions QA workflow was removed to avoid notification spam.

A manual browser regression script is available:

```bash
npm run test:browser
npm run test:browser -- --webkit
```

It uses Playwright when installed and checks the expense sheet at iPhone, keyboard-sized and tablet viewports in light and dark, then the keypad, pickers, receipt and unsaved-changes flow.

## Architecture

- `public/index.html` — loads `theme-init.js`, the three stylesheets and `app/main.js` as an ES module. No build step for the UI.
- `public/vendor/preact-htm.js` — Preact with htm templates (one vendored file, no bundler; CSP-safe).
- `public/app/main.js` — app shell, tab bar, sheet host and boot; `store.js` — one observable store, server calls and session; `nav.js` — tabs, pushed pages and sheets behind one history entry; `ui.js` — the component kit; `common.js` — shared rows and sheets; `format.js` — formatting helpers; `amount-entry.js` — keypad amount logic; `demo.js` — the sample household.
- `public/app/derive.js` — every total, balance, grouping and count a screen shows, computed once per household snapshot and shared.
- `public/app/screens/` — Home, Activity, Sheets (and the sheet page), Household, Welcome.
- `public/app/flows/` — expense entry and details, pickers, settle up, recurring bills, export.
- `public/styles/base.css`, `layers.css`, `screens.css` — the design system and screen styles. See `DESIGN.md`.
- `public/icons.js` — Lucide icon shapes; `public/fonts/` — the self-hosted Geist font. See `THIRD_PARTY_NOTICES.md`.
- `public/classic/` — the previous interface, kept as a fallback.
- `public/journal.js`, `settlement-overview.js`, `period-insights.js`, `recurring.js`, `drafts.js`, `expense-policy.js`, `catalog.js`, `entry-shortcuts.js`, `receipt-scan.js`, `amount-calculator.js`, `expense-history.js`, `back-navigation.js` — pure logic shared by both interfaces.
- `lib/model.js` — server-side validation and mutations.
- `api/household.js` — Vercel API with authenticated access, rate limiting and atomic revision checks.
- `tests/` — finance, policy, migration, storage and UI regression tests.

## Performance rules

The app must stay instant on an iPhone with a few hundred expenses. `tests/performance.test.mjs` enforces these:

- **Subscribe narrowly.** Components call `useStore('data', …)` with the keys they read; a bare `useStore()` re-renders on every navigation and toast.
- **Derive once.** Totals, balances, groupings and counts come from `app/derive.js`, cached per household snapshot. Don't recompute them in a render.
- **Page long lists.** Activity, sheet pages and the pickers render a page at a time with `useIncremental`; day totals come from the whole list.
- **Format dates with the cached helpers** in `app/format.js`. `toLocaleDateString` with options builds a new formatter per call and is very slow in Safari.
- **Tabs stay mounted.** Hidden tabs use `content-visibility: hidden`, so switching is a visibility change and keeps scroll and search.
- **Sheets open whole.** A sheet opens before its first paint and starts on screen (a short rise and fade), so it is never drawn in pieces.
- **Animate transform and opacity only.** Nothing animated sits under the glass bars: no animated blur, backgrounds, masks or page filters.

## Data and access

Each household member receives a private access key; only its SHA-256 hash is stored. Invitation links claim an unclaimed member slot. Private access links act as credentials and should be kept private.

Only the authenticated creator can edit/delete an eligible expense. Settled expenses are locked. Recording settlement does not move money; it records the household's settlement state.

Writes use revision checks so simultaneous edits do not silently overwrite each other. The app refreshes household data while visible when no modal is open. Unchanged revisions return a small acknowledgement. Expense drafts survive reloads on the same device; draft storage is local and is not a shared backup.

Only the settlement recorder can reverse a record, with a required reason. Reversal reopens only the linked expenses and retains the original payment and correction in history. An archived sheet reopens with them.

## Receipts and capacity

Receipt images are resized/compressed and stored separately in the existing private database. Household state contains only an immutable receipt reference. Opening a receipt performs an authenticated, household-scoped read. Legacy inline receipts relocate safely on a successful write; cached older clients continue to receive image data. The household JSON document is capped at roughly 3.5 MB, excluding separated receipt images. Unreferenced receipt copies are retained to avoid deleting data during concurrent writes; automatic garbage collection is not implemented.

CSV export is a record export, not a complete restore backup.
The journal Export button includes only the current search/filter/status results; the Settings export still includes the entire household journal. The result share is the signed-in member’s couple allocation, not an individual debt or a payment balance.

The keypad calculator supports addition, subtraction, multiplication and division. Decimal operands are represented exactly, with rounding to cents applied once to the final total. On the keypad, the expression stays visible above the live total; saving uses the total. Incomplete calculations, division by zero and nonpositive/out-of-range expense totals are rejected.

## Product rule

Together is deliberately narrow: know what is owed, record spending quickly, understand where money went, and settle cleanly. Prefer simplifying an existing flow over adding another overlapping feature.

## Recurring bills, scanning and history

Schedules are shared with the household. Only the schedule creator can edit or pause one. Home reminders cover overdue bills and the next seven days; they are in-app reminders, not background push notifications. Recording requires confirmation, an open sheet and the current due date. It creates an ordinary expense owned by the recorder and advances one occurrence; replay is rejected. Monthly/yearly schedules retain their original day across short months and leap years. Expenses are never generated automatically.

Receipt scanning lazily downloads a self-hosted Tesseract worker, WebAssembly core and English recognition data. Recognition runs on the device. Images are not sent to an OCR service. The existing authenticated receipt attachment storage still applies when saving. Scan results are editable suggestions with selected fields; applying and saving are separate actions. Unclear totals/dates remain blank. Initial scanning can take longer while recognition assets download. `scripts/ocr-assets.mjs` assembles pinned npm assets at build time and for local development.

Creation/edit history is generated by the server and visible from expense details. It preserves the actor and field changes, ignores client-supplied audit entries and stores receipt presence rather than image bytes. Older records receive a creation baseline on their first edit.

Period comparisons align equal numbers of elapsed days from the current and previous sheet starts, with both date ranges and matched totals displayed. The main spending figure still includes the entire sheet, even when a shorter previous month limits the comparison sample. Zero earlier spending produces no percentage.
