import {html, useState} from '../../vendor/preact-htm.js';
import {useStore, getState, save, toast} from '../store.js';
import {present, push, back, closeSheet, replace} from '../nav.js';
import {Page, Icon, Amount, Pill, Empty, Sheet, Segmented, FairShareBar, Flow, CategoryGlyph, Avatar, cx, useIncremental} from '../ui.js';
import {DayGroups, ActionsSheet, confirm} from '../common.js';
import {Ring} from './home.js';
import {PaymentsList} from './household.js';
import {group, otherCouple, coupleName, money, plural, rangeLabel, periodProgress, today, categoryLook, addDays, pad} from '../format.js';
import {orderedSheets, sheetSummary, sheetOverview, sheetBreakdown, sheetsById, dayTotals, canDeleteSheet as canDeleteInSnapshot} from '../derive.js';
import {exportCSV, summaryText, shareText} from '../flows/export.js';
import {openAddExpense} from '../flows/expense.js';

const sheetState = (data, sheet) => sheetSummary(data, sheet.id);
export const canDeleteSheet = (data, id) => canDeleteInSnapshot(data, id);

function statusOf(sheet, st) {
  if (sheet.archived) return {label: 'Archived', tone: 'quiet'};
  if (st.open.length) return {label: `${st.open.length} unsettled`, tone: 'caution'};
  return st.items.length ? {label: 'Settled', tone: 'positive'} : {label: 'No expenses', tone: 'quiet'};
}

export function Sheets() {
  const {data} = useStore('data');
  const ordered = orderedSheets(data);
  const open = ordered.filter(s => !s.archived), archived = ordered.filter(s => s.archived);
  return html`<${Page} title="Sheets" scrollKey="sheets"
    actions=${html`<button type="button" class="nav-button nav-button-accent" data-action="new-sheet" onClick=${() => present('sheet-form', {})} aria-label="New sheet"><${Icon} name="plus"/></button>`}>
    <div class="tally" role="group" aria-label="Sheets">
      <span><b data-count="open">${open.length}</b> open</span><span><b data-count="archived">${archived.length}</b> archived</span>
    </div>
    ${open.length ? html`<div class="stack-lg">${open.map(s => html`<${SheetCard} key=${s.id} sheet=${s} data=${data}/>`)}</div>`
      : html`<div class="card card-pad"><${Empty} emoji="🗂️" title="No open sheets" text="Settled sheets move to Archived. Start a new sheet for the next period.">
          <button type="button" class="btn btn-primary" onClick=${() => present('sheet-form', {})}><${Icon} name="plus"/> New sheet</button><//></div>`}
    ${archived.length > 0 && html`<section class="section">
      <div class="section-head"><h2>Archived</h2></div>
      <div class="card list">${archived.map(s => {
        const st = sheetState(data, s);
        return html`<button type="button" class="srow" data-view-sheet=${s.id} onClick=${() => push('sheet', {id: s.id})}>
          <span class="srow-icon" aria-hidden="true">🗄️</span>
          <span class="srow-text"><strong>${s.name}</strong><small>${rangeLabel(s)}</small></span>
          <span class="srow-end"><b>${money(st.total)}</b><small>${plural(st.items.length, 'expense')}</small></span>
          <${Icon} name="chevron" class="row-chevron"/>
        </button>`;
      })}</div>
    </section>`}
  <//>`;
}

function SheetCard({sheet, data}) {
  const st = sheetState(data, sheet), status = statusOf(sheet, st), progress = periodProgress(sheet);
  const mine = group(data.seat), o = sheetOverview(data, sheet.id, mine);
  const other = otherCouple(mine);
  return html`<button type="button" class="card sheetcard" data-view-sheet=${sheet.id} data-swipe-sheet=${sheet.id} onClick=${() => push('sheet', {id: sheet.id})}>
    <div class="sheetcard-head">
      <span class="sheetcard-title">${sheet.pinned && html`<${Icon} name="pin" class="sheetcard-pin"/>`}<strong>${sheet.name}</strong></span>
      <${Pill} tone=${status.tone}>${status.label}<//>
    </div>
    <p class="sheetcard-range">${rangeLabel(sheet)}${progress?.total ? ` · ${progress.left === 0 ? 'ends today' : plural(progress.left, 'day') + ' left'}` : progress ? ` · day ${progress.day}` : ''}</p>
    ${progress?.total && html`<div class="meter" aria-hidden="true"><i style=${`--w:${Math.round(progress.pct * 100)}%`}></i></div>`}
    <div class="sheetcard-figures">
      <span><small>Spent</small><${Amount} cents=${st.total} class="amount-md"/></span>
      <span><small>Unsettled</small><b>${money(st.unsettled)}</b></span>
      <span><small>${o.net > 0 ? 'You owe' : o.net < 0 ? 'Owed to you' : 'Balance'}</small><b class=${o.net > 0 ? 'is-owe' : o.net < 0 ? 'is-owed' : ''}>${o.net ? money(Math.abs(o.net)) : 'Even'}</b></span>
    </div>
    ${o.net !== 0 && html`<p class="sheetcard-line">${o.net > 0 ? `${coupleName(data.names, mine)} → ${coupleName(data.names, other)}` : `${coupleName(data.names, other)} → ${coupleName(data.names, mine)}`}</p>`}
  </button>`;
}

// ───────── Sheet page ─────────
export function SheetPage({id}) {
  const {data} = useStore('data');
  const sheet = sheetsById(data).get(id);
  const [tab, setTab] = useState('expenses'), [status, setStatus] = useState(sheet?.archived ? 'settled' : 'open');
  const st = sheet ? sheetState(data, sheet) : null;
  const listed = !st ? [] : status === 'all' ? st.items : status === 'open' ? st.open : st.settled;
  const [count, more] = useIncremental(tab === 'expenses' ? listed.length : 0, {first: 25, resetKey: status});
  if (!sheet) return html`<${Page} title="Sheet" back><div class="card card-pad"><${Empty} emoji="🗑️" title="This sheet no longer exists"/></div><//>`;
  const stat = statusOf(sheet, st), progress = periodProgress(sheet);
  const coupleA = sheetOverview(data, id, 'a'), mine = group(data.seat), yours = sheetOverview(data, id, mine);
  const other = otherCouple(mine), [from, to] = yours.net < 0 ? [other, mine] : [mine, other];
  const payments = data.settlements.filter(r => r.sheet === id);
  return html`<${Page} title=${sheet.name} eyebrow=${rangeLabel(sheet)} back scrollKey=${'sheet-' + id}
    actions=${html`<button type="button" class="nav-button" onClick=${() => present('sheet-actions', {id})} aria-label=${'Actions for ' + sheet.name}><${Icon} name="dots"/></button>`}>
    <section class="card hero-card">
      <div class="hero-row">
        <div><${Pill} tone=${stat.tone}>${stat.label}<//><${Amount} cents=${st.total} class="amount-xl"/><p class="muted">Total spent${st.unsettled && st.unsettled !== st.total ? ` · ${money(st.unsettled)} unsettled` : ''}</p></div>
        ${!sheet.archived && html`<${Ring} progress=${progress}/>`}
      </div>
      ${st.total > 0 && html`<${FairShareBar} names=${data.names} overview=${coupleA}/>`}
      ${yours.net !== 0 ? html`<div class="hero-owe"><${Flow} names=${data.names} from=${from} to=${to}/><p><b>${coupleName(data.names, from)}</b> pay <b>${money(Math.abs(yours.net))}</b> to ${coupleName(data.names, to)}</p></div>`
        : st.open.length ? html`<p class="hero-even">✨ These expenses balance out.</p>` : ''}
      <div class="hero-actions">
        ${!sheet.archived && html`<button type="button" class="btn btn-secondary" data-action="add" onClick=${() => openAddExpense({sheet: id})}><${Icon} name="plus"/> Add expense</button>`}
        ${st.open.length > 0 && html`<button type="button" class="btn btn-primary" data-action="settle" onClick=${() => present('settle', {sheetId: id})}>${yours.net ? 'Settle up' : 'Close sheet'}</button>`}
        ${sheet.archived && html`<button type="button" class="btn btn-secondary" onClick=${() => sheetAction('archive', id)}><${Icon} name="undo"/> Reopen sheet</button>`}
      </div>
    </section>
    <${Segmented} label="Sheet view" value=${tab} onChange=${setTab} class="segmented-wide" options=${[{value: 'expenses', label: 'Expenses'}, {value: 'insights', label: 'Insights'}, {value: 'payments', label: `Payments${payments.length ? ' · ' + payments.length : ''}`}]}/>
    ${tab === 'expenses' && html`
      <div class="toolbar"><${Segmented} label="Expense status" value=${status} onChange=${setStatus} options=${[{value: 'open', label: `Open · ${st.open.length}`}, {value: 'settled', label: `Settled · ${st.items.length - st.open.length}`}, {value: 'all', label: 'All'}]}/></div>
      ${listed.length ? html`<${DayGroups} expenses=${listed.slice(0, count)} totals=${dayTotals(listed)} showAuthor/>${more}` : html`<div class="card card-pad"><${Empty} emoji=${st.items.length ? '✅' : '🧾'} title=${st.items.length ? (status === 'open' ? 'Nothing unsettled' : 'Nothing settled yet') : 'This sheet is empty'} text=${st.items.length ? '' : 'Expenses you add to this sheet will appear here.'}/></div>`}`}
    ${tab === 'insights' && html`<${Insights} data=${data} id=${id} items=${st.items}/>`}
    ${tab === 'payments' && html`<${PaymentsList} records=${payments}/>`}
  <//>`;
}

function Insights({data, id, items}) {
  const [mode, setMode] = useState('category');
  if (!items.length) return html`<div class="card card-pad"><${Empty} emoji="📊" title="No spending yet" text="Insights appear once this sheet has expenses."/></div>`;
  const total = items.reduce((n, e) => n + e.cents, 0);
  const key = mode === 'category' ? 'category' : mode === 'merchant' ? 'merchant' : 'payer';
  let rows = sheetBreakdown(data, id, key);
  if (rows.length > 6) rows = [...rows.slice(0, 5), {name: 'Everything else', cents: rows.slice(5).reduce((n, r) => n + r.cents, 0), count: rows.slice(5).reduce((n, r) => n + r.count, 0), rest: true}];
  const max = Math.max(...rows.map(r => r.cents), 1);
  return html`<section class="card card-pad insights" aria-label="Spending breakdown">
    <${Segmented} label="Group by" value=${mode} onChange=${setMode} options=${[{value: 'category', label: 'Categories'}, {value: 'merchant', label: 'Merchants'}, {value: 'payer', label: 'People'}]}/>
    <div class="bars">${rows.map(r => {
      const label = mode === 'payer' && !r.rest ? data.names[r.name] : r.name;
      const lead = mode === 'payer' && !r.rest ? html`<${Avatar} name=${data.names[r.name]} seat=${r.name} size="sm"/>` : mode === 'category' ? html`<${CategoryGlyph} name=${r.name} size="sm"/>` : html`<span class="glyph glyph-sm tone-slate" aria-hidden="true">🏪</span>`;
      const tone = mode === 'category' ? 'tone-' + categoryLook(r.name).tone : mode === 'payer' && !r.rest ? 'couple-' + group(r.name) : 'tone-slate';
      return html`<div class="bar-row">
        <div class="bar-head">${lead}<span class="bar-name">${label}<small>${plural(r.count, 'expense')}</small></span><span class="bar-value"><b>${money(r.cents)}</b><small>${Math.round(r.cents / total * 100)}%</small></span></div>
        <div class="bar-track"><i class=${tone} style=${`--w:${Math.max(4, r.cents / max * 100)}%`}></i></div>
      </div>`;
    })}</div>
  </section>`;
}

export async function sheetAction(action, id) {
  try { await save({action, id}); toast(action === 'pin' ? 'Pin updated' : getState().data.sheets.find(s => s.id === id)?.archived ? 'Sheet archived' : 'Sheet reopened'); return true; }
  catch (e) { toast(e.message); return false; }
}

export function SheetActions({sheetKey, id}) {
  const {data} = getState(), s = data.sheets.find(x => x.id === id);
  if (!s) return '';
  const st = sheetState(data, s), deletable = canDeleteSheet(data, id);
  const done = fn => async () => { if (await fn()) closeSheet(sheetKey); };
  return html`<${ActionsSheet} title=${s.name} subtitle=${rangeLabel(s)}
    footnote=${!deletable ? 'This sheet includes someone else’s expenses or settled records, so it can’t be deleted. Archive it instead.' : s.archived ? '' : st.open.length ? 'Settle the open expenses to archive this sheet.' : ''}
    actions=${[
      {label: 'Edit sheet', icon: 'edit', id: 'option-edit', run: () => replace('sheet-form', {id})},
      {label: s.pinned ? 'Unpin sheet' : 'Pin to Home', icon: 'pin', id: 'option-pin', run: done(() => sheetAction('pin', id))},
      {label: s.archived ? 'Reopen sheet' : 'Archive sheet', icon: s.archived ? 'undo' : 'archive', id: 'option-archive', disabled: !s.archived && st.open.length > 0, run: done(() => sheetAction('archive', id))},
      {label: 'Share summary', icon: 'share', run: () => shareText(summaryText(st.items, s.name)).catch(() => {})},
      {label: 'Export as CSV', icon: 'download', disabled: !st.items.length, run: () => exportCSV(st.items)},
      {label: 'Delete sheet', icon: 'trash', destructive: true, id: 'option-delete', disabled: !deletable, run: () => confirm({
        title: 'Delete sheet?', message: `Delete “${s.name}” and its ${plural(st.items.length, 'expense')}? This can’t be undone.`, confirm: 'Delete sheet', destructive: true,
        run: async () => { await save({action: 'sheet-delete', id}); closeSheet(sheetKey); if (getState().nav.pages.some(p => p.type === 'sheet' && p.props.id === id)) back(); toast('Sheet deleted'); },
      })},
    ]}/>`;
}

export function SheetForm({sheetKey, id}) {
  const {data} = getState(), editing = data.sheets.find(s => s.id === id);
  const suggestStart = today();
  const [name, setName] = useState(editing?.name || ''), [start, setStart] = useState(editing?.start || suggestStart), [end, setEnd] = useState(editing?.end || '');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault();
    if (!name.trim()) return setError('Give the sheet a name.');
    if (end && end < start) return setError('End date must follow start date.');
    setBusy(true);
    try {
      await save(editing ? {action: 'sheet-edit', id, name: name.trim(), start, end} : {action: 'sheet', name: name.trim(), start, end});
      closeSheet(sheetKey); toast(editing ? 'Sheet updated' : 'Sheet created');
    } catch (e) { setError(e.message); setBusy(false); }
  };
  const quick = days => setEnd(addDays(start, days - 1));
  const monthEnd = () => { const [y, m] = start.split('-').map(Number); setEnd(`${y}-${pad(m)}-${pad(new Date(y, m, 0).getDate())}`); };
  return html`<${Sheet} title=${editing ? 'Edit sheet' : 'New sheet'}>
    <form id="new-sheet-form" class="form" onSubmit=${submit}>
      <label class="field"><span>Name</span><input name="title" value=${name} onInput=${e => setName(e.currentTarget.value)} placeholder="e.g. October 2nd fortnight" maxlength="60" autocomplete="off" autocapitalize="words" required/></label>
      <div class="field-pair">
        <label class="field"><span>Starts</span><input type="date" name="start" value=${start} onInput=${e => setStart(e.currentTarget.value)} required/></label>
        <label class="field"><span>Ends · optional</span><input type="date" name="end" value=${end} onInput=${e => setEnd(e.currentTarget.value)}/></label>
      </div>
      <div class="chips"><span class="chips-label">Length</span><button type="button" class="chip" onClick=${() => quick(7)}>1 week</button><button type="button" class="chip" onClick=${() => quick(14)}>Fortnight</button><button type="button" class="chip" onClick=${monthEnd}>To month end</button><button type="button" class="chip" onClick=${() => setEnd('')}>Open-ended</button></div>
      ${error && html`<p class="form-error" role="alert">${error}</p>`}
      <button type="submit" class="btn btn-primary btn-block" disabled=${busy}>${editing ? 'Save changes' : 'Create sheet'}</button>
    </form>
  <//>`;
}
