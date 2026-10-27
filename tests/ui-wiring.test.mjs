import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {centsOf, applyKey, draftAmount} from '../public/app/amount-entry.js';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const appFiles = ['app/main.js', 'app/ui.js', 'app/common.js', 'app/nav.js', 'app/store.js',
  ...readdirSync(new URL('../public/app/screens', import.meta.url)).map(f => 'app/screens/' + f),
  ...readdirSync(new URL('../public/app/flows', import.meta.url)).map(f => 'app/flows/' + f)];
const sources = Object.fromEntries(appFiles.map(f => [f, read('public/' + f)]));
const allSource = Object.values(sources).join('\n');
const main = sources['app/main.js'];
const css = ['base', 'layers', 'screens'].map(n => read(`public/styles/${n}.css`)).join('\n');
const indexHtml = read('public/index.html');
const vercel = JSON.parse(read('vercel.json'));

/** Names registered in one of main.js's lookup tables, e.g. `const sheets = {...}`. */
function registry(name) {
  const body = main.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\};`))[1];
  return Object.fromEntries([...body.matchAll(/'?([\w-]+)'?: (\w+)/g)].map(m => [m[1], m[2]]));
}

test('every registered tab, page and sheet is imported from a module that exports it', () => {
  for (const table of ['tabs', 'pages', 'sheets']) {
    for (const [key, component] of Object.entries(registry(table))) {
      const line = main.split('\n').find(l => l.startsWith('import') && new RegExp(`[{,\\s]${component}[,}\\s]`).test(l));
      assert.ok(line, `${table}.${key} → ${component} is imported`);
      const file = 'app/' + line.match(/from '\.\/(.+)'/)[1];
      assert.match(sources[file], new RegExp(`export (async )?function ${component}\\b|export const ${component}\\b`), `${file} exports ${component}`);
    }
  }
});

test('every present, replace and push call opens a registered layer', () => {
  const sheets = registry('sheets'), pages = registry('pages');
  for (const [, verb, type] of allSource.matchAll(/\b(present|replace|push)\('([\w-]+)'/g)) {
    assert.ok(verb === 'push' ? pages[type] : sheets[type], `${verb}('${type}') is registered`);
  }
});

test('main navigation has four tabs around a central Add', () => {
  assert.deepEqual(Object.keys(registry('tabs')), ['home', 'activity', 'sheets', 'household']);
  for (const tab of ['home', 'activity', 'sheets', 'household']) assert.match(main, new RegExp(`item\\('${tab}'`));
  assert.match(main, /class="tab tab-add" data-action="add"/);
  assert.match(main, /\{home: 0, activity: 1, sheets: 3, household: 4\}/, 'the thumb skips the Add slot');
});

test('settling is an action from Home and each sheet, and records through a deliberate slide', () => {
  assert.match(sources['app/screens/home.js'], /data-action="open-settle" onClick=\$\{\(\) => present\('settle'/);
  assert.match(sources['app/screens/sheets.js'], /data-action="settle" onClick=\$\{\(\) => present\('settle', \{sheetId: id\}\)/);
  assert.match(sources['app/flows/settle.js'], /<\$\{SlideToConfirm\}[^>]*onConfirm=\$\{record\}/);
  assert.match(sources['app/flows/settle.js'], /save\(\{action: 'settle', sheet: sheet\.id\}\)/);
});

test('the expense form shows every option, like the original', () => {
  const editor = sources['app/flows/expense.js'];
  for (const title of ['Expense details', 'Payment & split', 'Extra details']) assert.ok(editor.includes(`>${title}</h3>`), title + ' section');
  for (const control of ['data-pick="merchants"', 'data-pick="categories"', 'type="date" name="date"', 'data-payer=${seat}', "splitOption('half'", "splitOption('a'", "splitOption('b'", 'name="notes"', 'id="choose-receipt"', 'id="split-preview"'])
    assert.ok(editor.includes(control), control + ' is on the form');
  assert.ok(editor.includes('data-pick="sheet"') && editor.includes('data-sheet-info'), 'the sheet always shows; it is a picker when several are open');
  // A new expense opens with the keypad up; it docks only while the amount is entered, so it never hides the options.
  assert.match(editor, /const \[keypad, setKeypad\] = useState\(\(\) => !id && !initial\.values\.amount\)/, 'a new expense with no amount opens with the keypad up');
  assert.match(editor, /\$\{keypad && html`<div class="keypad-dock">/);
  assert.match(editor, /onClickCapture=\$\{\(\) => \{ if \(keypad\) setKeypad\(false\); \}\}/, 'using another option puts the keypad away first');
  assert.match(editor, /if \(!latest\.current\.v\.amount\) setKeypad\(true\)/, 'choosing a merchant opens the keypad when no amount is set');
});

test('long lists in sheets keep their height so the sheet scrolls', () => {
  // A list card clips its overflow; in a grid without max-content rows it shrank to fit and could not be scrolled.
  assert.match(css, /\.sheet-body \{[^}]*display: grid; grid-auto-rows: max-content;[^}]*overflow-y: auto;/);
});

test('Activity opens on Open, with the full history one tap away', () => {
  const activity = sources['app/screens/activity.js'];
  assert.match(activity, /const memory = \{query: '', status: 'open'/);
  assert.match(activity, /options=\$\{\[\{value: 'open', label: 'Open'\}, \{value: 'settled', label: 'Settled'\}, \{value: 'all', label: 'All'\}\]\}/);
  assert.match(activity, /setStatus\('open'\); setFilters\(emptyFilters\(\)\)/, 'clearing returns to Open');
  assert.match(activity, /data-action="show-settled"/);
  assert.match(activity, /data-action="search-all"/);
});

test('an edit never re-creates an expense deleted meanwhile, and a closed sheet can be changed', () => {
  const editor = sources['app/flows/expense.js'];
  assert.match(editor, /expense: \{id: id \|\| undefined,/, 'the edit names its expense');
  assert.match(editor, /const gone = !!id && !existing;/);
  assert.match(editor, /disabled=\$\{busy \|\| receiptBusy \|\| gone\}/);
  assert.match(editor, /const chooseSheet = openSheets\.length > 1 \|\| !openSheets\.some\(s => s\.id === v\.sheet\)/);
});

test('pages refresh in the background; open forms never have their data swapped', () => {
  assert.match(main, /!s\.nav\.sheets\.length && document\.visibilityState === 'visible'\) refresh\(false\)/);
});

test('the keypad builds amounts and calculations in cents', () => {
  const type = (keys, start = '', fresh = false) => [...keys].reduce((expr, key, i) => applyKey(expr, key, fresh && i === 0), start);
  assert.equal(type('86.4'), '86.4');
  assert.equal(centsOf(type('86.4')), 8640);
  assert.equal(type('12.345'), '12.34', 'two decimal places at most');
  assert.equal(type('.5'), '0.5');
  assert.equal(type('007'), '7', 'no leading zeros');
  assert.equal(type('12+30'), '12+30');
  assert.equal(centsOf('12+30'), 4200);
  assert.equal(centsOf('24×3'), 7200);
  assert.equal(centsOf('10÷4'), 250);
  assert.equal(type('5+×'), '5×', 'a second operator replaces the first');
  assert.equal(type('+'), '', 'an amount cannot start with an operator');
  assert.equal(applyKey('86.40', '9', true), '9', 'editing starts fresh');
  assert.equal(applyKey('86.40', '⌫', true), '');
  assert.equal(applyKey('86.40', '⌫', false), '86.4');
  assert.equal(applyKey('12+3', 'clear', false), '');
  assert.equal(centsOf(''), 0);
  assert.equal(centsOf('5÷0'), null);
  assert.equal(draftAmount({amount: '24×3'}), '$72.00');
  assert.equal(draftAmount({amount: ''}), '');
});

test('sheets always keep a visible close, and browser-closed dialogs stay in sync', () => {
  const ui = sources['app/ui.js'];
  assert.match(ui, /left === undefined && right \? closeButton : left/);
  assert.match(ui, /right === undefined \? closeButton : right/);
  assert.match(ui, /addEventListener\('close', onClosed\)/);
});

test('the store re-renders only for named keys, including a change before subscribing', () => {
  const store = sources['app/store.js'];
  assert.match(store, /export function useStore\(\.\.\.keys\)/);
  assert.match(store, /keys\.some\(key => state\[key\] !== rendered\.current\[key\]\)/);
  assert.match(store, /update\(\);\s*return subscribe\(update\);/);
  // A bare useStore() re-renders on every navigation and toast; every caller names its keys.
  for (const [file, text] of Object.entries(sources)) assert.doesNotMatch(text, /useStore\(\)/, file);
});

test('a private access link signs in without the first-time access sheet', () => {
  assert.match(sources['app/store.js'], /signIn\(\{\.\.\.\(await api\(\{action: 'read'\}\)\), key: query\.get\('key'\)\}, \{welcome: false\}\)/);
});

test('payment history shows who paid using the server sign convention', () => {
  // balance().net > 0 means couple B owes couple A.
  assert.match(sources['app/screens/household.js'], /payer = r\.net > 0 \? 'b' : 'a'/);
});

test('Vercel blocks production deployment when unit tests fail', () => {
  assert.equal(vercel.buildCommand, 'npm test && npm run build');
});

test('the page loads only same-origin scripts, compatible with the CSP', () => {
  const csp = vercel.headers[0].headers.find(h => h.key === 'Content-Security-Policy').value;
  assert.match(csp, /script-src 'self' 'wasm-unsafe-eval'/);
  assert.doesNotMatch(indexHtml, /<script>/, 'no inline scripts');
  assert.match(indexHtml, /<script type="module" src="\/app\/main\.js\?v=/);
  assert.match(main, /from '\.\.\/vendor\/preact-htm\.js'/);
  assert.ok(existsSync(new URL('../public/vendor/preact-htm.js', import.meta.url)));
});

test('stylesheets load once, in order, with one shared cache version', () => {
  const sheets = [...indexHtml.matchAll(/<link rel="stylesheet" href="\/styles\/([a-z-]+\.css)\?v=([^"]+)"/g)];
  assert.deepEqual(sheets.map(m => m[1]), ['base.css', 'layers.css', 'screens.css']);
  assert.equal(new Set(sheets.map(m => m[2])).size, 1);
  assert.ok(indexHtml.includes('/app/main.js?v=' + sheets[0][2]), 'main.js shares the stylesheet cache version');
  assert.ok(indexHtml.includes('/theme-init.js?v=' + sheets[0][2]));
});

test('Home has a one-tap light/dark toggle that saves the choice', () => {
  assert.match(sources['app/screens/home.js'], /<\$\{ThemeToggle\}\/>/);
  assert.match(sources['app/common.js'], /export function ThemeToggle\b[\s\S]*?setTheme\(dark \? 'light' : 'dark'\)/);
  assert.match(sources['app/store.js'], /localStorage\.setItem\('together-theme', theme\)/);
});

test('design tokens, couple identity, glass navigation and reduced motion stay defined', () => {
  for (const token of ['--bg', '--surface', '--sheet', '--label', '--accent', '--a', '--b', '--glass', '--r-card', '--spring'])
    assert.match(css, new RegExp(`\\s${token}:`), token + ' token');
  assert.match(css, /:root\[data-theme=dark\] \{/);
  assert.match(css, /\.couple-a \{ --c: var\(--a\);/);
  assert.match(css, /\.tabbar \{[^}]*backdrop-filter/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test('every class the screens use has a style', () => {
  const defined = new Set([...css.matchAll(/\.([a-z][a-z0-9-]*)/g)].map(m => m[1]));
  const used = new Set();
  for (const [, value] of allSource.matchAll(/class="([^"$]+)"/g)) value.split(/\s+/).forEach(c => used.add(c));
  // Classes that only carry layout hooks shared with other selectors.
  const hooks = new Set(['card-pad']);
  const missing = [...used].filter(c => c && !defined.has(c) && !hooks.has(c));
  assert.deepEqual(missing, []);
});

test('the classic app stays reachable at /classic', () => {
  const classic = read('public/classic/index.html');
  assert.match(classic, /src="\/classic\/app\.js\?v=/);
  assert.match(sources['app/screens/household.js'], /href="\/classic\/"/);
});

test('the Home pass line accounts for part payments already inside the balance', () => {
  const home = read('public/app/screens/home.js');
  assert.match(home, /theyPaid = total - minePaid \+ Math\.max\(-yours\.partPaid, 0\)/);
  assert.match(home, /you paid \$\{money\(youPaid\)\}, they paid \$\{money\(theyPaid\)\}/);
});
