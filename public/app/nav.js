// Navigation: tabs, pushed pages and presented sheets. A single history entry
// guards the stack so the browser or Android back gesture closes the top layer
// instead of leaving the app. Standalone iPhone apps get an edge-swipe back.
import {getState, setState} from './store.js';
import {installEdgeBack} from '../back-navigation.js';

let sequence = 0;
const nav = () => getState().nav;
const update = next => { setState({nav: {...nav(), ...next}}); syncGuard(); };
const entry = (type, props = {}) => ({type, props, key: type + '-' + (++sequence)});

export const depth = () => nav().pages.length + nav().sheets.length;

export function go(tab) {
  if (nav().tab === tab && !nav().pages.length) { document.querySelector('.page.is-top .page-scroll')?.scrollTo({top: 0, behavior: 'smooth'}); return; }
  update({tab, pages: []});
}
export function push(type, props) { update({pages: [...nav().pages, entry(type, props)]}); }
export function present(type, props) { const item = entry(type, props); update({sheets: [...nav().sheets, item]}); return item.key; }
/** Swaps the top sheet for another, e.g. a step in a flow. */
export function replace(type, props) { update({sheets: [...nav().sheets.slice(0, -1), entry(type, props)]}); }

// A sheet with unsaved work can intercept a close request.
const guards = new Map();
export function guardClose(key, fn) { guards.set(key, fn); return () => guards.delete(key); }

/** Closes the top layer, asking its guard first unless forced. */
export function back({force = false} = {}) {
  const {sheets, pages} = nav();
  if (sheets.length) {
    const top = sheets[sheets.length - 1];
    if (!force && guards.get(top.key)?.() === false) return false;
    guards.delete(top.key);
    update({sheets: sheets.slice(0, -1)});
    return true;
  }
  if (pages.length) { update({pages: pages.slice(0, -1)}); return true; }
  return false;
}
/** Closes a specific sheet and everything above it without asking. */
export function closeSheet(key) {
  const sheets = nav().sheets, index = sheets.findIndex(s => s.key === key);
  if (index < 0) return;
  sheets.slice(index).forEach(s => guards.delete(s.key));
  update({sheets: sheets.slice(0, index)});
}
export function closeAllSheets() { nav().sheets.forEach(s => guards.delete(s.key)); update({sheets: []}); }

// ───────── History guard ─────────
let guarded = false, ignorePop = false;
function syncGuard() {
  const needed = depth() > 0;
  if (needed && !guarded) { history.pushState({together: true}, ''); guarded = true; }
  else if (!needed && guarded) { guarded = false; ignorePop = true; history.back(); }
}
export function installNavigation() {
  addEventListener('popstate', () => {
    if (ignorePop) { ignorePop = false; return; }
    guarded = false;
    if (depth() > 0) back();
    syncGuard();
  });
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  if (standalone) installEdgeBack({canGoBack: () => depth() > 0 && !getState().busy, goBack: () => back()});
}
