// Shared sheets and rows used by several screens.
import {html, useRef, useState} from '../vendor/preact-htm.js';
import {canManageExpenseAs, householdExpense} from '../expense-policy.js';
import {Sheet, Icon, Amount, CategoryGlyph, Dot, cx, memo} from './ui.js';
import {sheetsById, expenseById} from './derive.js';
import {back, closeSheet, present} from './nav.js';
import {getState, toast, save, savedDraft, clearDraft} from './store.js';
import {dayLabel, money, shortDate, group, firstName} from './format.js';

/** Confirmation with one primary action. `run` may throw to show an error. */
export function ConfirmSheet({sheetKey, title, message, confirm = 'Confirm', destructive, run}) {
  const [error, setError] = useState(''), [working, setWorking] = useState(false);
  const go = async () => {
    setWorking(true); setError('');
    try { await run(); closeSheet(sheetKey); }
    catch (e) { setError(e.message); setWorking(false); }
  };
  return html`<${Sheet} title=${title} class="sheet-compact">
    <p class="sheet-lede">${message}</p>
    ${error && html`<p class="form-error" role="alert">${error}</p>`}
    <div class="stack">
      <button type="button" class=${cx('btn', destructive ? 'btn-danger' : 'btn-primary', 'btn-block')} onClick=${go} disabled=${working} id="confirm-action">${confirm}</button>
      <button type="button" class="btn btn-quiet btn-block" onClick=${() => back()}>Cancel</button>
    </div>
  <//>`;
}

/** An iOS-style action list. Each action: {label, icon, run, destructive, disabled, note}. */
export function ActionsSheet({title, subtitle, actions, footnote}) {
  return html`<${Sheet} title=${title} class="sheet-compact">
    ${subtitle && html`<p class="sheet-lede">${subtitle}</p>`}
    <div class="action-list">
      ${actions.filter(Boolean).map(a => html`<button type="button" class=${cx('action', a.destructive && 'is-destructive')} disabled=${a.disabled} onClick=${a.run} id=${a.id}>
        <span class="action-icon"><${Icon} name=${a.icon}/></span><span>${a.label}</span>
      </button>`)}
    </div>
    ${footnote && html`<p class="sheet-note">${footnote}</p>`}
  <//>`;
}

export const confirm = props => present('confirm', props);

// ───────── Expense rows ─────────
const actionWidth = 148;

/** What an expense means for your couple: what you paid minus your share (same cent rounding as settling). */
export function coupleImpact(expense, couple) {
  const e = householdExpense(expense);
  const a = e.split === 'half' ? Math.floor(e.cents / 2) : e.split === 'a' ? e.cents : 0;
  return (group(e.payer) === couple ? e.cents : 0) - (couple === 'a' ? a : e.cents - a);
}

/** The row's second figure: settled, what your couple lent or owes, or not shared when no money moves. */
function impactLine(e, mine) {
  if (e.settlement) return {text: html`<${Icon} name="check"/> Settled`, label: 'settled'};
  const net = coupleImpact(e, mine);
  if (net > 0) return {text: `You lent ${money(net)}`, label: `you lent ${money(net)}`, tone: 'is-owed'};
  if (net < 0) return {text: `You owe ${money(-net)}`, label: `you owe ${money(-net)}`, tone: 'is-owe'};
  return {text: 'Not shared', label: 'not shared'};
}
/**
 * One expense. Your own unsettled expenses swipe left to reveal Edit and Delete.
 * Memoized: a row re-renders only when its expense (or how it is shown) changes.
 */
export const ExpenseRow = memo(function ExpenseRow({expense: e, showSheet = false}) {
  const {data} = getState();
  const manageable = canManageExpenseAs(e, data.seat);
  const sheet = sheetsById(data).get(e.sheet), archived = sheet?.archived;
  const front = useRef(), drag = useRef(null), [open, setOpen] = useState(false);
  const setX = x => { if (front.current) front.current.style.transform = x ? `translateX(${x}px)` : ''; };
  const onDown = event => {
    if (!manageable || event.button !== 0) return;
    drag.current = {x: event.clientX, y: event.clientY, base: open ? -actionWidth : 0, moving: false, id: event.pointerId};
  };
  const onMove = event => {
    const d = drag.current; if (!d) return;
    const dx = event.clientX - d.x, dy = event.clientY - d.y;
    if (!d.moving) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dy) > Math.abs(dx)) { drag.current = null; return; }
      d.moving = true; front.current.setPointerCapture(d.id); front.current.classList.add('is-dragging');
    }
    setX(Math.max(-actionWidth - 24, Math.min(0, d.base + dx)));
  };
  const onUp = event => {
    const d = drag.current; drag.current = null;
    if (!d?.moving) return;
    front.current.classList.remove('is-dragging');
    const dx = event.clientX - d.x, next = d.base + dx < -actionWidth / 2;
    setOpen(next); setX(next ? -actionWidth : 0);
    front.current.dataset.swiped = '1'; setTimeout(() => { if (front.current) delete front.current.dataset.swiped; }, 50);
  };
  const openDetail = () => {
    if (front.current?.dataset.swiped) return;
    if (open) { setOpen(false); setX(0); return; }
    present('expense-detail', {id: e.id});
  };
  const sheetName = sheet?.name;
  const who = e.payer === data.seat ? 'You paid' : `${firstName(data.names[e.payer])} paid`;
  const meta = [e.category, showSheet && sheetName].filter(Boolean).join(' · ');
  const impact = impactLine(e, group(data.seat));
  return html`<div class=${cx('xrow', e.settlement && 'is-settled')}>
    ${manageable && html`<div class="xrow-actions" aria-hidden=${!open}>
      <button type="button" class="xrow-edit" tabindex=${open ? 0 : -1} disabled=${archived} onClick=${() => present('expense-editor', {id: e.id})} aria-label=${'Edit ' + e.merchant}><${Icon} name="edit"/><span>Edit</span></button>
      <button type="button" class="xrow-delete" tabindex=${open ? 0 : -1} onClick=${() => deleteExpense(e.id)} aria-label=${'Delete ' + e.merchant}><${Icon} name="trash"/><span>Delete</span></button>
    </div>`}
    <button type="button" class="xrow-front" ref=${front} data-expense=${e.id} onPointerDown=${onDown} onPointerMove=${onMove} onPointerUp=${onUp} onPointerCancel=${onUp} onClick=${openDetail}
      aria-label=${`${e.merchant}, ${money(e.cents)}, ${who.toLowerCase()}, ${impact.label}, ${meta}, ${dayLabel(e.date)}`}>
      <${CategoryGlyph} name=${e.category}/>
      <span class="xrow-text">
        <span class="xrow-title">${e.merchant}</span>
        <span class="xrow-meta"><${Dot} seat=${e.payer}/>${who}${meta && html`<span class="xrow-sep"> · </span>${meta}`}</span>
      </span>
      <span class="xrow-end">
        <${Amount} cents=${e.cents} class="xrow-amount"/>
        <span class=${cx('xrow-sub', impact.tone)}>${impact.text}</span>
      </span>
    </button>
  </div>`;
});

export function deleteExpense(id) {
  const {data} = getState(), e = expenseById(data).get(id);
  if (!canManageExpenseAs(e, data.seat)) return toast('This expense cannot be deleted.');
  confirm({
    title: 'Delete this expense?', message: `${e.merchant} — ${money(e.cents)} on ${shortDate(e.date)} will be permanently removed.`,
    confirm: 'Delete expense', destructive: true,
    run: async () => {
      await save({action: 'delete', id});
      if (savedDraft()?.expenseId === id) clearDraft();
      const sheets = getState().nav.sheets;
      sheets.filter(s => ['expense-detail', 'expense-editor'].includes(s.type) && s.props.id === id).reverse().forEach(s => closeSheet(s.key));
      toast('Expense deleted');
    },
  });
}

/**
 * Day-grouped expenses in one list, each day headed by its total. When only part
 * of a list is shown, pass `totals` for the whole list so a partly shown day still totals in full.
 */
export function DayGroups({expenses, totals, showSheet}) {
  const days = new Map();
  for (const e of expenses) { if (!days.has(e.date)) days.set(e.date, []); days.get(e.date).push(e); }
  return html`<div class="card list days">${[...days].map(([day, items]) => html`
    <h3 class="day-head" key=${'d' + day}><span>${dayLabel(day)}</span><span>${money(totals?.get(day) ?? items.reduce((n, e) => n + e.cents, 0))}</span></h3>
    ${items.map(e => html`<${ExpenseRow} key=${e.id} expense=${e} showSheet=${showSheet}/>`)}`)}</div>`;
}
