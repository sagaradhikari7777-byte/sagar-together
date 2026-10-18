---
name: Together
description: A calm, native-feeling household wallet. Each couple has its own colour; glass is used only for navigation.
colors:
  canvas: "#f3f2ef"
  surface: "#ffffff"
  sheet: "#f6f5f2"
  label: "#111113"
  accent: "#0b8f6c"
  couple-a: "#6366f1"
  couple-b: "#f5704f"
  caution: "#b86e00"
  danger: "#e5484d"
  dark-canvas: "#0b0b0f"
  dark-surface: "#17171c"
typography:
  family: "Geist (self-hosted variable font), system fallback"
  body: "16px / 1.45"
  input: "16px minimum"
rounded:
  control: "14px"
  inner: "16px"
  card: "24px"
  wallet: "30px"
  sheet: "34px"
  pill: "999px"
---

# Together

Two couples, one household wallet. The design follows the best iOS-native finance apps: one dark "wallet" card that answers "who owes whom?" at a glance, plain solid cards for content, and Liquid Glass only on the navigation layer (tab bar, top bar, toasts, floating buttons).

## Principles

1. **Colour is identity.** Indigo is couple A and coral is couple B. They appear wherever people do: avatars, dots, split bars, the fair-share bar, the payer → receiver flow, the aurora behind the app. Green means settled or money coming to you; amber means something waits; red is only for destructive actions.
2. **One hero per screen.** Home has the wallet card; a sheet has its hero card; Settle has the amount. Everything else stays quiet.
3. **Numbers first.** Amounts use tabular figures and are set in parts (small currency symbol, bold dollars, lighter cents). Screen readers get the plain amount.
4. **Native feel.** Bottom sheets with a grabber and drag-to-dismiss, a custom keypad for amounts, swipe actions on rows, 44pt targets, 16px inputs so iOS never zooms, and the iPhone edge-back gesture in the installed app.
5. **Deliberate money actions.** Recording a payment is a slide, not a tap. Destructive actions always confirm.
6. **Quick, then still.** Sheets rise a short way and fade in as one piece; the tab thumb and segmented controls use a spring curve. Only transform and opacity animate, and only the wallet sheen and the dashed payment flow loop. Everything stops under `prefers-reduced-motion`.

## Tokens (`public/styles/base.css`)

- **Canvas and surfaces:** `--bg`, `--surface`, `--surface-2`, `--sheet`, `--fill`, `--fill-2`, `--fill-strong`, `--separator`.
- **Text:** `--label`, `--label-2`, `--label-3`.
- **Meaning:** `--accent`/`--positive`, `--caution`, `--danger`, each with a `-soft` tint.
- **People:** `--a` and `--b` with `-soft` and `-ink`. `.couple-a` / `.couple-b` expose them as `--c`, `--c-soft` and `--c-ink` to children.
- **Categories:** `.tone-*` classes set `--t`, used by emoji glyphs, ribbons and bars.
- **Glass:** `--glass`, `--glass-strong`, `--glass-edge`, `--glass-shadow` (navigation layer only).
- **Aurora:** `--aurora-a`, `--aurora-b`, `--aurora-c` tint the static background wash.
- **Shape and motion:** `--r-control`, `--r-inner`, `--r-card`; `--spring` (a `linear()` spring) and `--ease`.

Dark mode redefines the same tokens under `:root[data-theme=dark]`; cards swap shadows for hairlines.

## Type

Geist variable, served from `/fonts` (OFL).

| Role | Size | Weight |
| --- | --- | --- |
| Hero amount (wallet, settle) | 56–64px | 700 |
| Large title | 34px | 750 |
| Card amount | 32–44px | 700 |
| Section heading | 20px | 700 |
| Body | 16px | 400–600 |
| Meta | 13px, `--label-2` | 400 |
| Eyebrow | 11–12px, uppercase, +0.07em | 650 |

## Components (`public/app/ui.js`)

- **Page:** large title that collapses into a glass top bar on scroll. The four tabs stay mounted, so each keeps its scroll and state.
- **Sheet:** a native `<dialog>` presented as a bottom sheet (a centred card on wide screens), opened before its first paint so it appears whole. Every sheet has a visible close; Escape, backdrop and drag close it through navigation so unsaved work can intercept.
- **Wallet card:** the dark mesh-gradient balance card on Home.
- **FairShareBar:** what each couple paid, with a tick at couple A's fair share. The gap between bar and tick is the debt.
- **Flow:** payer couple → receiver couple with stacked initials.
- **SlideToConfirm:** drag the knob to record; keyboard and assistive tech activate it directly.
- **Keypad:** digits, decimal, ÷ × − + and delete (long-press clears). Amounts are exact cents via `amount-calculator.js`.
- **CategoryGlyph / MerchantMark:** emoji tiles tinted by category; gradient monograms hued from the merchant name.
- **Row / Group:** inset-grouped settings lists with coloured icon tiles; **ExpenseRow** swipes left for Edit / Delete.
- **Segmented:** sliding thumb; **Pill**, **Avatar**, **CouplePair**, **Empty**.

## Screens

- **Home:** greeting and household name; wallet card with Settle up; draft banner; current sheet card with a days-left ring and category ribbon; "Coming up" bills rail; recent activity (open expenses only, or "All settled").
- **Activity:** search, Open / Settled / All, filters sheet, result total with couple share, day-grouped expenses, CSV export of the results.
- **Sheets:** open sheet cards (progress meter, spent / unsettled / balance) and the Archived list. A sheet page has the hero card, fair-share bar, who-pays flow, and Expenses / Insights / Payments.
- **Household:** both couples' people, Edit names and Invite, then Money, Lists, Preferences (expense defaults, Appearance) and Access & data, and sign out.
- **Add (sheet):** the amount at the top (tap to enter it on the docked calculator keypad), then labelled sections with every option visible: Expense details (merchant and shortcuts, category, date, sheet), Payment & split (person and split buttons, live preview) and Extra details (description, receipt). One Save.
- **Settle (sheet):** choose a sheet when several have balances, review with flow and couple comparison, slide to record, success.

## Style ownership

Three stylesheets, loaded in order with one shared `?v=`:

1. `styles/base.css` — font, tokens, base elements, buttons, forms, small components, toast.
2. `styles/layers.css` — app shell, pages and top bar, tab bar, sheets, keypad, slide-to-confirm, loading.
3. `styles/screens.css` — cards and lists, wallet, period, activity, sheets, household, welcome, editor, pickers, settle, bills; responsive rules.

Change the rule that owns a style; don't add override files. Bump the shared `?v=` in `index.html` with every release.

Icons come from Lucide (ISC) in `public/icons.js`; add new ones there by name. The original interface is kept at `/classic/` with its own stylesheets.
