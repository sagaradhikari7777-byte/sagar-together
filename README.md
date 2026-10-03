# Together

Together is an iPhone-first household expense app for four people organised as two couples. It tracks shared expenses, couple allocations and settlements with a compact mobile interface.

Production: https://sagar-together.vercel.app  
Canonical repository: `sagaradhikari7777-byte/sagar-together` → `main`

## Core flow

- **Home:** overall balance and recent transactions.
- **Sheets:** open periods by default; Open / Archived, with an outstanding-only filter.
- **Add:** merchant, amount, category, date, payer, split, optional note/receipt, one Save.
- **Settle:** an overall balance with sheet balances, then per-sheet payment recording, summary/history and spending.
- **Settings:** household names, invitations/access, entry defaults, merchants/categories, CSV export and appearance.

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

It uses Playwright when installed and is intended for iPhone-sized layout and expense-flow verification.

## Architecture

- `public/app.js` — vanilla JavaScript UI and interaction wiring.
- `public/*.css` — active screen/component styling.
- `public/back-navigation.js` — view history and iPhone-style edge back gesture.
- `public/journal.js` — pure filtering/repeat helpers.
- `public/settlement-overview.js` — overall, per-sheet and historical couple share calculations.
- `public/drafts.js` — local draft recovery, isolated by household and person.
- `public/expense-policy.js` — expense ownership/normalisation.
- `lib/model.js` — server-side validation and mutations.
- `api/household.js` — Vercel API with authenticated access, rate limiting and atomic revision checks.
- `tests/` — finance, policy, migration, storage and UI regression tests.

The frontend intentionally stays framework-free.

## Data and access

Each household member receives a private access key; only its SHA-256 hash is stored. Invitation links claim an unclaimed member slot. Private access links act as credentials and should be kept private.

Only the authenticated creator can edit/delete an eligible expense. Settled expenses are locked. Recording settlement does not move money; it records the household's settlement state.

Writes use revision checks so simultaneous edits do not silently overwrite each other. The app refreshes household data while visible when no modal is open. Unchanged revisions return a small acknowledgement. Expense drafts survive reloads on the same device; draft storage is local and is not a shared backup.

Only the settlement recorder can reverse a record, with a required reason. Reversal reopens only the linked expenses and retains the original payment and correction in history. An archived sheet reopens with them.

## Receipts and capacity

Receipt images are resized/compressed and stored separately in the existing private database. Household state contains only an immutable receipt reference. Opening a receipt performs an authenticated, household-scoped read. Legacy inline receipts relocate safely on a successful write; cached older clients continue to receive image data. The household JSON document is capped at roughly 3.5 MB, excluding separated receipt images. Unreferenced receipt copies are retained to avoid deleting data during concurrent writes; automatic garbage collection is not implemented.

CSV export is a record export, not a complete restore backup.

## Product rule

Together is deliberately narrow: know what is owed, record spending quickly, understand where money went, and settle cleanly. Prefer simplifying an existing flow over adding another overlapping feature.
