// Together — application shell. Screens are tabs, pages push over them, and
// sheets present above everything as native modal dialogs.
import {html, render, useEffect, useRef, useState} from '../vendor/preact-htm.js';
import {useStore, getState, setState, refresh, applyTheme, openLink, toast} from './store.js';
import {installNavigation, go, present, depth} from './nav.js';
import {Icon, cx, SheetContext, TabActive, memo} from './ui.js';
import {ConfirmSheet, ActionsSheet} from './common.js';
import {Home} from './screens/home.js';
import {Activity, FiltersSheet} from './screens/activity.js';
import {Sheets, SheetPage, SheetActions, SheetForm} from './screens/sheets.js';
import {Household, NamesSheet, InviteSheet, AccessSheet, PreferencesSheet, PaymentsSheet, ReverseSheet} from './screens/household.js';
import {Welcome, LoadError, CreateSheet, JoinSheet, ClaimSheet} from './screens/welcome.js';
import {ExpenseEditor, ExpenseDetail, ExpenseHistory, DraftChoice, SheetChooser, openAddExpense} from './flows/expense.js';
import {CatalogSheet, CatalogEdit} from './flows/pickers.js';
import {SettleSheet} from './flows/settle.js';
import {BillsSheet, BillEditor, RecordBill} from './flows/bills.js';

const tabs = {home: Home, activity: Activity, sheets: Sheets, household: Household};
const pages = {sheet: SheetPage};
const sheets = {
  confirm: ConfirmSheet, actions: ActionsSheet,
  create: CreateSheet, join: JoinSheet, claim: ClaimSheet,
  'expense-editor': ExpenseEditor, 'expense-detail': ExpenseDetail, 'expense-history': ExpenseHistory, 'draft-choice': DraftChoice,
  'sheet-chooser': SheetChooser,
  catalog: CatalogSheet, 'catalog-edit': CatalogEdit,
  settle: SettleSheet, filters: FiltersSheet,
  'sheet-form': SheetForm, 'sheet-actions': SheetActions,
  names: NamesSheet, invite: InviteSheet, access: AccessSheet, preferences: PreferencesSheet, payments: PaymentsSheet, reverse: ReverseSheet,
  bills: BillsSheet, 'bill-editor': BillEditor, 'bill-record': RecordBill,
};

/**
 * Keeps a closed layer mounted (the same instance) briefly so it can animate
 * out. A swap (one layer replaced by another) happens instantly instead.
 */
function useExiting(items, ms = 300) {
  const ghosts = useRef(new Map()), previous = useRef(items), [, force] = useState(0);
  const keys = new Set(items.map(i => i.key)), before = new Set(previous.current.map(i => i.key));
  const swapped = items.some(i => !before.has(i.key));
  for (const old of previous.current) {
    if (keys.has(old.key) || ghosts.current.has(old.key) || swapped) continue;
    ghosts.current.set(old.key, old);
    setTimeout(() => { ghosts.current.delete(old.key); force(n => n + 1); }, ms);
  }
  for (const key of [...ghosts.current.keys()]) if (keys.has(key)) ghosts.current.delete(key);
  previous.current = items;
  return [...items.map(item => ({item, closing: false})), ...[...ghosts.current.values()].map(item => ({item, closing: true}))];
}

// Each registered screen renders through a memo wrapper, so a layer re-renders
// only for its own props, state and store keys, never because another layer changed.
const views = new Map();
const view = C => { if (!views.has(C)) views.set(C, memo(C)); return views.get(C); };
const OPEN = {closing: false}, CLOSING = {closing: true};

function SheetHost() {
  const {nav} = useStore('nav');
  return html`${useExiting(nav.sheets).map(({item, closing}) => { const C = sheets[item.type]; return C ? html`<${SheetContext.Provider} key=${item.key} value=${closing ? CLOSING : OPEN}><${view(C)} sheetKey=${item.key} closing=${closing} ...${item.props}/><//>` : ''; })}`;
}

function TabBar() {
  const {nav} = useStore('nav');
  const index = {home: 0, activity: 1, sheets: 3, household: 4}[nav.tab];
  const item = (id, label, icon) => html`<button type="button" class=${cx('tab', nav.tab === id && 'is-active')} data-tab=${id} aria-current=${nav.tab === id ? 'page' : undefined} onClick=${() => go(id)}><${Icon} name=${icon}/><span>${label}</span></button>`;
  return html`<nav class="tabbar" aria-label="Main navigation" style=${`--index:${index}`}>
    <span class="tabbar-thumb" aria-hidden="true"></span>
    ${item('home', 'Home', 'home')}${item('activity', 'Activity', 'list')}
    <button type="button" class="tab tab-add" data-action="add" aria-label="Add expense" onClick=${() => openAddExpense()}><span class="tab-add-orb"><${Icon} name="plus"/></span></button>
    ${item('sheets', 'Sheets', 'folder')}${item('household', 'Household', 'people')}
  </nav>`;
}

/**
 * The four tabs stay mounted once shown, so switching is only a visibility
 * change. Tabs not yet visited are prepared shortly after the first screen
 * appears, one at a time, so even a first switch is instant.
 */
function Shell() {
  const {nav, demo} = useStore('nav', 'demo');
  const pushed = useExiting(nav.pages);
  const top = nav.pages.length, current = tabs[nav.tab] ? nav.tab : 'home';
  const ready = useRef(new Set()).current, [, prepared] = useState(0);
  ready.add(current);
  useEffect(() => {
    const next = Object.keys(tabs).find(id => !ready.has(id));
    if (!next) return;
    const timer = setTimeout(() => { ready.add(next); prepared(n => n + 1); }, ready.size === 1 ? 600 : 150);
    return () => clearTimeout(timer);
  }, [ready.size]);
  return html`<div class=${cx('shell', demo && 'is-demo')}>
    ${demo && html`<div class="demo-banner" role="note"><span>Sample household</span><button type="button" class="link" data-action="exit-demo" onClick=${() => setState({demo: false, data: null, nav: {tab: 'home', pages: [], sheets: []}})}>Make it yours</button></div>`}
    ${Object.keys(tabs).filter(id => ready.has(id)).map(id => {
      const active = id === current, Tab = view(tabs[id]);
      return html`<section key=${'tab-' + id} class=${cx('page', 'page-root', active ? 'is-active' : 'is-hidden', active && !top && 'is-top')} data-tab-page=${id} inert=${active && top > 0}><${TabActive.Provider} value=${active}><${Tab}/><//></section>`;
    })}
    ${pushed.map(({item: p, closing}, i) => { const P = view(pages[p.type]); return html`<section key=${p.key} class=${cx('page', 'page-pushed', closing ? 'is-leaving' : i === top - 1 && 'is-top')} inert=${closing || i !== top - 1}><${P} ...${p.props}/></section>`; })}
    <${TabBar}/>
  </div>`;
}

function Toast() {
  const {toast: t} = useStore('toast');
  return html`<div class=${cx('toast', t && 'is-shown', t?.tone && 'toast-' + t.tone)} role="status" aria-live="polite">${t?.text || ''}</div>`;
}

const ShellView = memo(Shell), SheetHostView = memo(SheetHost), ToastView = memo(Toast);
function App() {
  const {data, credentials, booting, loadError, busy} = useStore('data', 'credentials', 'booting', 'loadError', 'busy');
  const body = data ? html`<${ShellView}/>` : credentials && booting ? html`<${Loading}/>` : credentials && loadError ? html`<${LoadError}/>` : html`<${Welcome}/>`;
  return html`<div class=${cx('app', busy && 'is-busy')}><div class="aurora" aria-hidden="true"></div>${body}<${SheetHostView}/><${ToastView}/></div>`;
}

const Loading = () => html`<main class="loading"><div class="welcome-mark" aria-hidden="true"><i class="orb orb-a"></i><i class="orb orb-b"></i><i class="orb orb-lens"></i></div><p class="loading-text" role="status">Opening your household…</p></main>`;

// ───────── Boot ─────────
applyTheme();
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
installNavigation();
render(html`<${App}/>`, document.getElementById('app'));
document.getElementById('boot')?.remove();

(async () => {
  const fragment = location.hash;
  if (fragment.length > 1) {
    history.replaceState(null, '', location.pathname);
    setState({booting: false});
    try { const invite = await openLink(location.origin + '/' + fragment); if (invite) present('claim', invite); }
    catch (e) { toast(e.message); }
    return;
  }
  if (getState().credentials) await refresh(false);
  else setState({booting: false});
})();

// iOS keyboards overlay the page without resizing it; lift sheets above the keyboard.
if (window.visualViewport) {
  const vv = visualViewport, fit = () => document.documentElement.style.setProperty('--keyboard', Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop)) + 'px');
  vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit); fit();
}
const quietRefresh = () => { const s = getState(); if (s.data && !s.demo && !s.busy && !depth() && document.visibilityState === 'visible') refresh(false); };
setInterval(quietRefresh, 30000);
document.addEventListener('visibilitychange', quietRefresh);
addEventListener('online', quietRefresh);

// Assistants on the page may open the form for the person to review; they never save.
if (navigator.modelContext?.registerTool) {
  navigator.modelContext.registerTool({
    name: 'open_expense_form', description: 'Open the household expense form for user review. Does not save an expense.',
    inputSchema: {type: 'object', properties: {merchant: {type: 'string'}}, additionalProperties: false},
    execute: async ({merchant = ''}) => {
      if (!getState().data) return {content: [{type: 'text', text: 'Sign in to your household first.'}]};
      openAddExpense({merchant});
      return {content: [{type: 'text', text: 'Expense form opened. The user can review and save.'}]};
    },
  });
}
