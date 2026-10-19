// One observable store for the household, session and navigation. Every write
// goes through save(), which keeps the server's revision checks intact.
import {useLayoutEffect, useRef, useState} from '../vendor/preact-htm.js';
import {draftKey, readDraft} from '../drafts.js';
import {catalogValues} from '../catalog.js';
import {demoHousehold, demoMutation} from './demo.js';

let state = {
  data: null,
  credentials: readJSON('together-access'),
  demo: false,
  busy: false,
  booting: true,
  loadError: '',
  toast: null,
  drafts: 0,
  theme: readTheme(),
  nav: {tab: 'home', pages: [], sheets: []},
};
const listeners = new Set();

export const getState = () => state;
export function setState(patch) {
  state = {...state, ...(typeof patch === 'function' ? patch(state) : patch)};
  listeners.forEach(listener => listener());
}
export function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
/**
 * Re-renders the caller when one of the named state keys changes, or on any
 * change when no keys are named. A change that lands between rendering and
 * subscribing still counts. Name keys: a screen that re-renders on every
 * navigation or toast is what makes sheets and tabs slow to open.
 */
export function useStore(...keys) {
  const [, tick] = useState(0), rendered = useRef(state);
  rendered.current = state;
  useLayoutEffect(() => {
    const changed = () => keys.length ? keys.some(key => state[key] !== rendered.current[key]) : state !== rendered.current;
    const update = () => { if (changed()) tick(n => n + 1); };
    update();
    return subscribe(update);
  }, []);
  return state;
}

function readJSON(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
function readTheme() { try { return localStorage.getItem('together-theme') || 'auto'; } catch { return 'auto'; } }

// ───────── Feedback ─────────
let toastTimer;
export function toast(text, tone = '') {
  clearTimeout(toastTimer);
  setState({toast: {text, tone, id: Date.now()}});
  toastTimer = setTimeout(() => setState({toast: null}), 3200);
}

// ───────── Server ─────────
const unreachable = 'Couldn’t reach the household. Check your connection and try again.';
/** One request to the household API. Errors carry a message people can act on. */
export async function api(body) {
  const {credentials, data} = state;
  let res;
  try {
    res = await fetch('/api/household', {
      method: 'POST',
      headers: {'Content-Type': 'application/json', ...(credentials ? {Authorization: `Bearer ${credentials.key}`} : {})},
      body: JSON.stringify({house: credentials?.house, rev: data?.rev, receiptMode: 'reference', ...body}),
      signal: AbortSignal.timeout?.(20000),
    });
  } catch {
    // A dropped connection or a timeout: the change may or may not have arrived.
    throw Object.assign(new Error(navigator.onLine ? unreachable : 'You’re offline. Reconnect and try again.'), {network: true});
  }
  let json = null;
  try { json = await res.json(); } catch {}
  if (!res.ok || !json) {
    const fallback = res.status >= 500 || !json ? 'The household service had a problem. Try again in a moment.' : 'Could not save changes.';
    throw Object.assign(new Error(json?.error || fallback), {status: res.status});
  }
  return json;
}

// Adding something new never overwrites anyone's work, so when someone else saved
// first these are applied again on top of their change instead of asking to retry.
const additive = change => (change.action === 'expense' && !change.expense?.id) || change.action === 'sheet'
  || (change.action === 'catalog' && change.operation === 'add') || (change.action === 'recurring' && !change.bill?.id);

/** Applies one household change, or throws with a message to show. */
export async function save(change) {
  if (state.busy) throw new Error('Still saving the last change. Try again in a moment.');
  if (!state.demo && !navigator.onLine) throw new Error('You’re offline. Reconnect to save changes to the household.');
  setState({busy: true});
  try {
    if (state.demo) {
      const data = structuredClone(state.data);
      demoMutation(data, change);
      setState({data});
    } else {
      try { setState({data: (await api(change)).data}); }
      catch (error) {
        if (error.status !== 409 || !additive(change)) throw error;
        const latest = await api({action: 'read'});
        setState({data: latest.data});
        setState({data: (await api(change)).data});
      }
    }
    return true;
  } catch (error) {
    if (error.status === 409) {
      setState({busy: false});
      await refresh(false);
      error.message = 'New changes arrived. Review and save again.';
    } else if (error.network) {
      // If the change did arrive, show it, so saving again isn't a duplicate.
      setState({busy: false});
      refresh(false);
    }
    throw error;
  } finally {
    setState({busy: false});
  }
}

let refreshing = false;
export async function refresh(notify = true) {
  if (refreshing || state.demo || !state.credentials) return;
  refreshing = true;
  // A refresh still in flight when someone signs out or switches household is stale.
  const asked = state.credentials;
  try {
    const result = await api({action: 'read', knownRev: state.data?.rev});
    if (state.credentials !== asked) return;
    if (result.data) setState({data: result.data, loadError: ''});
    if (notify) toast('Up to date');
    tidySettledSheets();
  } catch (error) {
    if (state.credentials !== asked) return;
    // Keep the saved access even when a load fails; the person may not have their link to hand.
    if (!state.data) setState({loadError: navigator.onLine ? error.message : 'You’re offline. Reconnect to load your household.'});
    else if (notify) toast(navigator.onLine ? error.message : 'You’re offline. Reconnect to load your household.');
  } finally {
    refreshing = false;
    if (state.booting) setState({booting: false});
  }
}

// Households from before settling closed sheets may still show settled sheets
// as open. Ask the server once to close them; failures retry on the next refresh.
let tidyRequested = false;
function tidySettledSheets() {
  if (state.demo || tidyRequested || state.data?.closesSettledSheets !== false || state.busy) return;
  tidyRequested = true;
  save({action: 'close-settled-sheets'}).catch(() => { tidyRequested = false; });
}

// ───────── Session ─────────
const resetNav = () => ({tab: 'home', pages: [], sheets: []});
export function signIn(json, {welcome = true} = {}) {
  const credentials = {house: json.data.id, key: json.key};
  try { localStorage.setItem('together-access', JSON.stringify(credentials)); }
  catch { toast('Save your private access link; this browser cannot remember it.'); }
  receiptCache.clear();
  setState({credentials, data: json.data, demo: false, booting: false, nav: resetNav()});
  if (welcome) setState(s => ({nav: {...s.nav, sheets: [{type: 'access', props: {fresh: true}, key: 'access-' + Date.now()}]}}));
  tidySettledSheets();
}
function signOutLocal() {
  try { localStorage.removeItem('together-access'); } catch {}
  tidyRequested = false;
  receiptCache.clear();
  setState({credentials: null, data: null, demo: false, booting: false, nav: resetNav()});
}
export const signOut = signOutLocal;
export function startDemo() { setState({demo: true, data: demoHousehold(), booting: false, nav: resetNav()}); }
export function exitDemo() { setState({demo: false, data: null, nav: resetNav()}); }

export async function createHousehold(draft) { signIn(await api({action: 'create', ...draft})); }
export async function joinPreview(house, invite) { return (await api({action: 'join', house, invite})).preview; }
export async function claimSeat(house, invite, seat) { signIn(await api({action: 'join', house, invite, seat})); }

/** Accepts a private access link or an invitation. Returns the invitation preview when one needs a seat. */
export async function openLink(value) {
  let url;
  try { url = new URL(String(value).trim()); } catch { throw new Error('Paste a complete Together invitation or access link.'); }
  const query = new URLSearchParams(url.hash.slice(1)), house = query.get('house');
  if (query.has('key')) {
    const previous = state.credentials;
    setState({credentials: {house, key: query.get('key')}, data: null});
    try { signIn({...(await api({action: 'read'})), key: query.get('key')}, {welcome: false}); }
    catch (error) { setState({credentials: previous}); throw error; }
    return null;
  }
  if (query.has('invite')) return {house, invite: query.get('invite'), preview: await joinPreview(house, query.get('invite'))};
  throw new Error('Paste a complete Together invitation or access link.');
}
export const shareLink = type => `${location.origin}/#house=${state.data.id}&${type}=${type === 'key' ? state.credentials?.key : state.data.invite}`;

// ───────── Receipts ─────────
const receiptCache = new Map();
export async function loadReceipt(expense) {
  if (!expense.receipt) return '';
  if (expense.receipt.startsWith('data:image/')) return expense.receipt;
  const key = state.data.id + ':' + expense.receipt;
  if (!receiptCache.has(key)) {
    receiptCache.set(key, (await api({action: 'receipt-read', id: expense.id})).receipt);
    if (receiptCache.size > 8) receiptCache.delete(receiptCache.keys().next().value);
  }
  return receiptCache.get(key);
}

// ───────── Device preferences ─────────
const storage = () => state.demo ? sessionStorage : localStorage;
const prefKey = () => `together-entry:${state.data.id}:${state.data.seat}`;
export function entryPreferences() {
  const categories = catalogValues(state.data, 'categories');
  let saved = {};
  try { saved = JSON.parse(storage().getItem(prefKey()) || '{}'); } catch {}
  return {
    category: categories.includes(saved.category) ? saved.category : categories.includes('Groceries') ? 'Groceries' : categories[0] || 'Other',
    split: ['half', 'a', 'b'].includes(saved.split) ? saved.split : 'half',
  };
}
export function setEntryPreferences(prefs) { storage().setItem(prefKey(), JSON.stringify(prefs)); }

export const draftStore = () => storage();
export const currentDraftKey = () => draftKey(state.data.id, state.data.seat);
export function savedDraft() { try { return readDraft(storage(), currentDraftKey()); } catch { return null; } }
export function clearDraft() { try { storage().removeItem(currentDraftKey()); } catch {} draftsChanged(); }
/** Tells screens showing the unfinished-expense banner to look again. */
export function draftsChanged() { setState(s => ({drafts: s.drafts + 1})); }

export function setTheme(theme) {
  try { localStorage.setItem('together-theme', theme); } catch {}
  setState({theme});
  applyTheme();
}
export function applyTheme() {
  const dark = state.theme === 'dark' || (state.theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#0b0b0f' : '#f3f2ef');
}
