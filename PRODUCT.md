# Together

## Product

Together is an iPhone-first shared household expense journal for four people organised as two couples. The core jobs are intentionally narrow:

1. See the current household balance.
2. See open sheets and outstanding expenses.
3. Add an expense quickly.
4. Understand spending and settle a sheet safely.

Do not add features unless they materially improve one of those jobs.

## Primary navigation

- **Home** — the household balance on the wallet card (with Settle up), draft recovery, the current sheet, upcoming bills and recent activity.
- **Activity** — every expense: search, Open / Settled / All, filters, result totals and CSV export of what is shown.
- **Add** — the centre tab button opens expense entry as a sheet. It is not a page.
- **Sheets** — open sheets, then Archived. Each sheet has its own page with Expenses, Insights and Payments, and its own Settle up.
- **Household** — people, invitations and access, payment history, recurring bills, merchants and categories, expense defaults, appearance, export and sign out.

Settling is an action, not a destination: it starts from the wallet card or a sheet. Avoid duplicate controls across these destinations.

## Expense entry

Keep Add Expense focused enough to finish with one thumb:

- Every option is visible on the form in labelled sections, as in the original app: **Expense details** (merchant with frequent shortcuts, category, date, sheet), **Payment & split** (who paid and the split as tap-to-choose buttons, with a live preview of each couple's share) and **Extra details** (description and receipt). Don't hide options behind chips or extra sheets.
- The amount is typed on the in-app keypad, which also calculates (÷ × − +). The keypad docks above Save only while the amount is being entered, opens on its own after choosing a merchant when no amount is set, and goes away when another option is used.
- One primary Save in the sheet footer. Closing with unsaved changes asks to keep editing, save a draft or discard.
- Editable inputs remain at least 16px on iPhone. Cancelling the iOS receipt picker keeps the entry open.
- Save unfinished entries locally, isolated by household and person. Recover them after reload, and offer a choice before replacing a draft.

## Data rules

- Everyone in the household sees shared expenses.
- Only the creator can edit or delete an eligible expense.
- Settled expenses are locked. Only the recorder may reverse a settlement with a reason; keep the original and correction in history and unlock only its linked entries.
- Archived sheets show settled entries and historical shares by default.
- Splits are 50/50 or 100% assigned to either couple.
- Recording a settlement marks the sheet's unsettled expenses as settled and closes the sheet (moves it to Archived); it does not transfer money. Reversing a settlement reopens the sheet. Reopen a sheet manually to add late expenses.
- Preserve receipts, merchant/category catalogs, CSV export, archive/pin, dark mode, invitations and private access links.

## Engineering rules

Canonical repository: `sagaradhikari7777-byte/sagar-together`, branch `main`.
Production: https://sagar-together.vercel.app.

Vercel must run `npm test && npm run build` before publishing. GitHub Actions email QA is intentionally disabled.

Prefer changing the owning stylesheet over appending another override layer. The previous interface remains at `/classic/` on the same data. When browser verification is requested, cover iPhone-sized viewports, keyboard-sized layouts, receipt attach/cancel/remove, draft protection, save/edit, navigation and dark mode. Respect the user’s instruction when they choose to do visual checking themselves.
