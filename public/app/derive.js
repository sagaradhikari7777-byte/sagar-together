// Derived household figures, computed once per household snapshot and shared by
// every screen and sheet. The store replaces `data` on every change, so caching
// by its identity can never serve stale figures, and nothing is recomputed when
// a tab, page or sheet merely re-renders or opens.
import {settlementOverview, householdOverview as overview} from '../settlement-overview.js';
import {frequentMerchants} from '../entry-shortcuts.js';
import {upcomingBills as upcoming} from '../recurring.js';
import {periodInsight} from '../period-insights.js';
import {filterExpenses} from '../journal.js';
import {catalogValues} from '../catalog.js';
import {canManageExpenseAs} from '../expense-policy.js';
import {byName} from './format.js';

const snapshots = new WeakMap();
/** Memoizes `fn(data, ...args)` per household snapshot and argument list. */
function perSnapshot(fn) {
  return (data, ...args) => {
    let results = snapshots.get(data);
    if (!results) snapshots.set(data, results = new Map());
    let cache = results.get(fn);
    if (!cache) results.set(fn, cache = new Map());
    const key = args.length ? JSON.stringify(args) : '';
    if (!cache.has(key)) cache.set(key, fn(data, ...args));
    return cache.get(key);
  };
}
/** Memoizes `fn(list)` per array identity, for lists that are themselves memoized. */
function perList(fn) {
  const cache = new WeakMap();
  return list => {
    if (!cache.has(list)) cache.set(list, fn(list));
    return cache.get(list);
  };
}

const sum = items => items.reduce((n, e) => n + e.cents, 0);
const newestFirst = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

export const sheetsById = perSnapshot(data => new Map(data.sheets.map(s => [s.id, s])));
export const expenseById = perSnapshot(data => new Map(data.expenses.map(e => [e.id, e])));
const bySheet = perSnapshot(data => {
  const map = new Map();
  for (const e of data.expenses) {
    let list = map.get(e.sheet);
    if (!list) map.set(e.sheet, list = []);
    list.push(e);
  }
  return map;
});
const none = [];
export const sheetExpenses = (data, id) => bySheet(data).get(id) || none;

/** Sheets with pinned first, then newest start. */
export const orderedSheets = perSnapshot(data => [...data.sheets].sort((a, b) => Number(b.pinned) - Number(a.pinned) || (String(b.start) < String(a.start) ? -1 : String(b.start) > String(a.start) ? 1 : 0)));
export const currentSheet = perSnapshot(data => orderedSheets(data).find(s => !s.archived) || null);

/** One sheet's expenses, newest first, with its open (unsettled) part and totals. */
export const sheetSummary = perSnapshot((data, id) => {
  const items = [...sheetExpenses(data, id)].sort(newestFirst), open = items.filter(e => !e.settlement);
  return {items, open, settled: items.filter(e => e.settlement), total: sum(items), unsettled: sum(open)};
});
/** A couple's share, paid and net over a sheet's unsettled expenses (or all of them). */
export const sheetOverview = perSnapshot((data, id, couple, includeSettled = false) => settlementOverview(sheetExpenses(data, id), couple, {includeSettled}));
export const householdOverview = perSnapshot((data, couple) => overview(data, couple));
export const canDeleteSheet = perSnapshot((data, id) => !data.settlements.some(s => s.sheet === id) && sheetExpenses(data, id).every(e => canManageExpenseAs(e, data.seat)));

/** Spending by category for a sheet, largest first. */
export const sheetCategories = perSnapshot((data, id) => {
  const totals = new Map();
  for (const e of sheetExpenses(data, id)) totals.set(e.category, (totals.get(e.category) || 0) + e.cents);
  return [...totals].sort((a, b) => b[1] - a[1]);
});
/** Totals and counts per category, merchant or payer for a sheet's Insights. */
export const sheetBreakdown = perSnapshot((data, id, field) => {
  const rows = new Map();
  for (const e of sheetExpenses(data, id)) {
    const row = rows.get(e[field]) || {name: e[field], cents: 0, count: 0};
    row.cents += e.cents; row.count++;
    rows.set(e[field], row);
  }
  return [...rows.values()].sort((a, b) => b.cents - a.cents);
});
export const insightFor = perSnapshot((data, id, day) => periodInsight(data.sheets, data.expenses, sheetsById(data).get(id), day));

/** How many expenses use each merchant or category. */
export const usageCounts = perSnapshot((data, field) => {
  const counts = new Map();
  for (const e of data.expenses) counts.set(e[field], (counts.get(e[field]) || 0) + 1);
  return counts;
});
/** A catalog list ordered for a picker: merchants most used first or A–Z; categories as listed. */
export const catalogOrder = perSnapshot((data, kind, order) => {
  const names = catalogValues(data, kind);
  if (kind !== 'merchants') return names;
  const counts = usageCounts(data, 'merchant');
  return [...names].sort((a, b) => (order === 'frequent' ? (counts.get(b) || 0) - (counts.get(a) || 0) : 0) || byName(a, b));
});
export const shortcutMerchants = perSnapshot((data, seat) => frequentMerchants(data.expenses, catalogValues(data, 'merchants'), seat));
/** The category this person last used for a merchant. */
export const lastCategory = perSnapshot((data, seat, merchant) => {
  let best = null;
  for (const e of data.expenses) if (e.creator === seat && e.merchant === merchant && (!best || e.date > best.date)) best = e;
  return best?.category || '';
});

/** The most recently added expenses that are still open: not settled and not on a closed sheet. */
export const recentExpenses = perSnapshot((data, count) => data.expenses
  .filter(e => !e.settlement && !sheetsById(data).get(e.sheet)?.archived)
  .sort((a, b) => (Date.parse(b.created) || 0) - (Date.parse(a.created) || 0) || newestFirst(a, b))
  .slice(0, count));
export const upcomingBills = perSnapshot((data, day) => upcoming(data.recurring, day));

/** Search and filter results for Activity, with their couple share. */
export const journal = perSnapshot((data, options, couple) => {
  const scope = options.sheet ? sheetExpenses(data, options.sheet) : data.expenses;
  const shown = filterExpenses(scope, data.names, {...options, sheets: data.sheets});
  return {shown, summary: settlementOverview(shown, couple, {includeSettled: true})};
});
export const categoryChoices = perSnapshot(data => [...new Set([...catalogValues(data, 'categories'), ...data.expenses.map(e => e.category)])].sort(byName));

/** Day totals for a list of expenses, so a partly rendered day still shows its full total. */
export const dayTotals = perList(list => {
  const totals = new Map();
  for (const e of list) totals.set(e.date, (totals.get(e.date) || 0) + e.cents);
  return totals;
});
