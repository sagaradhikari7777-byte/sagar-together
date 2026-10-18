import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync} from 'node:fs';
import {sheetSummary, sheetOverview, householdOverview, usageCounts, catalogOrder, journal, dayTotals, recentExpenses, sheetsById} from '../public/app/derive.js';
import {settlementOverview, householdOverview as directOverview} from '../public/settlement-overview.js';
import {dayLabel, shortDate, longDate, stamp, today, addDays} from '../public/app/format.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const app = dir => readdirSync(new URL('../public/app/' + dir, import.meta.url)).filter(f => f.endsWith('.js')).map(f => read(`public/app/${dir}${f}`));
const appSource = [...app(''), ...app('screens/'), ...app('flows/')].join('\n');
const css = ['base', 'layers', 'screens'].map(n => read(`public/styles/${n}.css`)).join('\n');
const main = read('public/app/main.js'), ui = read('public/app/ui.js');

const expense = (id, sheet, payer, cents, date, extra = {}) => ({id, sheet, payer, cents, date, merchant: 'Shop ' + (id % 3), category: 'Groceries', split: 'half', creator: payer, settlement: null, visibility: 'shared', created: `${date}T10:00:00.000Z`, ...extra});
function household() {
  return {
    seat: 0, names: ['A', 'B', 'C', 'D'],
    sheets: [{id: 's1', name: 'One', start: '2026-09-01', end: '2026-09-14', archived: true}, {id: 's2', name: 'Two', start: '2026-09-15', end: '', archived: false, pinned: true}],
    expenses: [expense(1, 's1', 0, 1000, '2026-09-02', {settlement: 'p1'}), expense(2, 's2', 2, 3000, '2026-09-16'), expense(3, 's2', 0, 500, '2026-09-18'), expense(4, 's2', 1, 1200, '2026-09-18')],
    settlements: [{id: 'p1', sheet: 's1'}], recurring: [], catalogs: {merchants: ['Shop 0', 'Shop 1', 'Shop 2', 'Zed'], categories: ['Groceries']},
  };
}

test('derived figures are computed once per household snapshot', () => {
  const data = household();
  assert.equal(sheetSummary(data, 's2'), sheetSummary(data, 's2'), 'same snapshot, same object');
  assert.equal(householdOverview(data, 'a'), householdOverview(data, 'a'));
  assert.equal(usageCounts(data, 'merchant'), usageCounts(data, 'merchant'));
  const next = {...data, expenses: [...data.expenses, expense(5, 's2', 3, 700, '2026-09-19')]};
  assert.notEqual(sheetSummary(next, 's2'), sheetSummary(data, 's2'), 'a new snapshot recomputes');
  assert.equal(sheetSummary(next, 's2').items.length, 4);
});

test('derived figures match the settlement engine', () => {
  const data = household();
  const s2 = data.expenses.filter(e => e.sheet === 's2');
  assert.deepEqual(sheetOverview(data, 's2', 'a'), settlementOverview(s2, 'a'));
  assert.deepEqual(householdOverview(data, 'b'), directOverview(data, 'b'));
  const summary = sheetSummary(data, 's2');
  assert.equal(summary.total, 4700);
  assert.equal(summary.unsettled, 4700);
  assert.deepEqual(summary.items.map(e => e.id), [3, 4, 2], 'newest first');
  assert.deepEqual(sheetSummary(data, 's1').settled.map(e => e.id), [1]);
  assert.equal(sheetsById(data).get('s2').name, 'Two');
  assert.deepEqual(recentExpenses(data, 2).map(e => e.id), [3, 4]);
  // Recent activity on Home leaves out settled expenses and anything on a closed sheet.
  assert.deepEqual(recentExpenses(data, 10).map(e => e.id), [3, 4, 2]);
  const legacy = {...data, expenses: [...data.expenses, expense(9, 's1', 0, 400, '2026-09-20')]};
  assert.ok(!recentExpenses(legacy, 10).some(e => e.id === 9), 'an unsettled expense on a closed sheet stays out');
});

test('picker order and search results are cached and correct', () => {
  const data = household();
  // Expenses 1 and 4 are at Shop 1, 2 at Shop 2, 3 at Shop 0; ties fall back to A–Z.
  assert.deepEqual(catalogOrder(data, 'merchants', 'frequent'), ['Shop 1', 'Shop 0', 'Shop 2', 'Zed']);
  assert.deepEqual(catalogOrder(data, 'merchants', 'az'), ['Shop 0', 'Shop 1', 'Shop 2', 'Zed']);
  assert.equal(catalogOrder(data, 'merchants', 'frequent'), catalogOrder(data, 'merchants', 'frequent'));
  assert.equal(usageCounts(data, 'merchant').get('Shop 1'), 2);
  const options = {query: '', status: 'open', payer: '', creator: '', receipt: '', category: '', sheet: '', from: '', to: '', sort: 'newest'};
  const result = journal(data, options, 'a');
  assert.equal(journal(data, {...options}, 'a'), result, 'equal options hit the cache');
  assert.deepEqual(result.shown.map(e => e.id).sort(), [2, 3, 4]);
  assert.equal(dayTotals(result.shown).get('2026-09-18'), 1700, 'a day totals all of its expenses');
});

test('dates format exactly as before, from cached formatters', () => {
  const at = iso => new Date(iso + 'T12:00:00');
  assert.equal(shortDate('2026-10-17'), at('2026-10-17').toLocaleDateString('en-AU', {day: 'numeric', month: 'short'}));
  assert.equal(longDate('2026-10-17'), at('2026-10-17').toLocaleDateString('en-AU', {day: 'numeric', month: 'short', year: 'numeric'}));
  assert.equal(stamp('2026-10-17T04:11:00Z'), new Date('2026-10-17T04:11:00Z').toLocaleString('en-AU', {dateStyle: 'medium', timeStyle: 'short'}));
  assert.equal(dayLabel(today()), 'Today');
  assert.equal(dayLabel(addDays(today(), -1)), 'Yesterday');
  const old = addDays(today(), -40);
  assert.equal(dayLabel(old), at(old).toLocaleDateString('en-AU', {weekday: 'short', day: 'numeric', month: 'short', ...(old.slice(0, 4) !== today().slice(0, 4) ? {year: 'numeric'} : {})}));
  // Building a formatter per call (toLocale*String with options) is what froze long lists on iPhone.
  assert.doesNotMatch(appSource, /toLocale(Date|Time)?String\(/);
});

test('the four tabs stay mounted and hidden tabs cost nothing to draw', () => {
  assert.match(main, /Object\.keys\(tabs\)\.filter\(id => ready\.has\(id\)\)\.map/);
  assert.match(main, /active \? 'is-active' : 'is-hidden'/);
  assert.match(main, /<\$\{TabActive\.Provider\} value=\$\{active\}>/);
  assert.match(css, /\.page-root\.is-hidden \{ visibility: hidden; content-visibility: hidden;/);
  assert.match(ui, /export const TabActive = createContext\(true\)/);
});

test('layers re-render only for their own changes', () => {
  assert.match(ui, /export function memo\(Inner\)/);
  assert.match(main, /const view = C => \{ if \(!views\.has\(C\)\) views\.set\(C, memo\(C\)\)/);
  assert.match(main, /value=\$\{closing \? CLOSING : OPEN\}/, 'a constant context value');
  assert.match(read('public/app/common.js'), /export const ExpenseRow = memo\(function ExpenseRow/);
});

test('long lists render a page at a time', () => {
  assert.match(ui, /export function useIncremental\(total/);
  assert.match(read('public/app/screens/activity.js'), /useIncremental\(shown\.length/);
  assert.match(read('public/app/screens/sheets.js'), /useIncremental\(tab === 'expenses' \? listed\.length : 0/);
  assert.match(read('public/app/flows/pickers.js'), /useIncremental\(names\.length/);
});

test('sheets open whole, in the first frame', () => {
  assert.match(ui, /useLayoutEffect\(\(\) => \{\s*const d = dialog\.current;\s*let mounted = true;\s*if \(!d\.open\) d\.showModal\(\);/);
  assert.match(ui, /requestAnimationFrame\(\(\) => \{ if \(mounted && d\.open\) heading\.current\?\.focus/, 'focus waits for the next frame');
  const keyframes = css.match(/@keyframes sheet-up \{[^}]*\}/g);
  assert.ok(keyframes.length > 0);
  for (const k of keyframes) assert.doesNotMatch(k, /\d{3}%/, 'a sheet never starts off screen, where it is drawn piecemeal');
});

test('nothing repaints every frame behind the glass navigation', () => {
  assert.doesNotMatch(css, /@keyframes [\w-]+ \{[^@]*background-position/, 'animate transform or opacity, not backgrounds');
  assert.doesNotMatch(css, /\.aurora[^{]*\{[^}]*(filter: blur|animation)/);
  assert.doesNotMatch(css, /\.page[^{]*\{[^}]*filter: brightness/);
  assert.doesNotMatch(css, /mask-image/);
});
