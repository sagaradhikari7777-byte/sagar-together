# Together

## Product

Together is an iPhone-first shared household expense journal for four people organised as two couples. The core jobs are intentionally narrow:

1. See the current household balance.
2. See open sheets and outstanding expenses.
3. Add an expense quickly.
4. Understand spending and settle a sheet safely.

Do not add features unless they materially improve one of those jobs.

## Primary navigation

- **Home** — one overall balance across open sheets, draft recovery and recent activity.
- **Sheets** — Open by default, with Open / Archived views and an outstanding-only checkbox.
- **Add** — focused modal expense entry. It is not a fifth navigable page while open.
- **Settle** — overall and per-sheet balances, sheet payment recording, summary, payment history with corrections, then spending.
- **Settings** — household identity, invitations/access, entry defaults, merchant/category management, export, appearance.

Avoid duplicate controls across these destinations.

## Expense entry

Keep Add Expense naturally scrolling and compact:

- Merchant, amount, category, date.
- Payer and split.
- Optional note and visible receipt control.
- Show the sheet selector only when more than one open sheet exists.
- One primary Save action at the end. Do not add a second header Save or an internal app dock.
- Editable inputs remain at least 16px on iPhone.
- Cancelling the iOS receipt picker must keep the draft open.
- Draft guards, receipt previews and validation errors stay in normal document flow.
- Save unfinished entries locally, isolated by household and person. Recover them after reload, and offer a choice before replacing a draft.

## Data rules

- Everyone in the household sees shared expenses.
- Only the creator can edit or delete an eligible expense.
- Settled expenses are locked. Only the recorder may reverse a settlement with a reason; keep the original and correction in history and unlock only its linked entries.
- Archived sheets show settled entries and historical shares by default.
- Splits are 50/50 or 100% assigned to either couple.
- Recording a settlement marks the sheet's unsettled expenses as settled; it does not transfer money.
- Preserve receipts, merchant/category catalogs, CSV export, archive/pin, dark mode, invitations and private access links.

## Engineering rules

Canonical repository: `sagaradhikari7777-byte/sagar-together`, branch `main`.
Production: https://sagar-together.vercel.app.

Vercel must run `npm test && npm run build` before publishing. GitHub Actions email QA is intentionally disabled.

Prefer changing the owning component stylesheet over appending another override layer. Browser verification should cover iPhone-sized viewports, keyboard-sized layouts, receipt attach/cancel/remove, draft protection, save/edit, navigation and dark mode.
