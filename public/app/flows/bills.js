import {html, useState} from '../../vendor/preact-htm.js';
import {frequencies} from '../../recurring.js';
import {catalogValues} from '../../catalog.js';
import {useStore, getState, save, toast} from '../store.js';
import {present, closeSheet} from '../nav.js';
import {confirm} from '../common.js';
import {Sheet, Icon, CategoryGlyph, Empty, Switch, Pill, Segmented, cx} from '../ui.js';
import {money, longDate, today, coupleName, shortDate} from '../format.js';

function deleteBill(id) {
  const bill = (getState().data.recurring || []).find(b => b.id === id);
  if (!bill) return;
  confirm({
    title: 'Delete this recurring bill?', message: `${bill.merchant} — ${money(bill.cents)} ${frequencies[bill.frequency].toLowerCase()} will stop. Expenses already recorded from it stay.`,
    confirm: 'Delete bill', destructive: true,
    run: async () => {
      await save({action: 'recurring-delete', id});
      getState().nav.sheets.filter(s => ['bill-editor', 'bill-record'].includes(s.type) && s.props.id === id).reverse().forEach(s => closeSheet(s.key));
      toast('Recurring bill deleted');
    },
  });
}

export function BillsSheet() {
  const {data} = useStore('data');
  const bills = [...(data.recurring || [])].sort((a, b) => Number(b.active) - Number(a.active) || (a.nextDue < b.nextDue ? -1 : a.nextDue > b.nextDue ? 1 : 0));
  return html`<${Sheet} title="Recurring bills" size="large"
    right=${html`<button type="button" class="nav-button nav-button-accent" id="new-bill" onClick=${() => present('bill-editor', {})} aria-label="Add recurring bill"><${Icon} name="plus"/></button>`}>
    <p class="sheet-lede">Plan regular bills and get reminders on Home. Nothing is added automatically — you confirm each one.</p>
    ${bills.length === 0 ? html`<${Empty} emoji="📅" title="No recurring bills" text="Add rent, utilities or a subscription.">
        <button type="button" class="btn btn-primary" onClick=${() => present('bill-editor', {})}><${Icon} name="plus"/> Add a bill</button><//>`
      : html`<div class="stack">${bills.map(b => html`<article class=${cx('card', 'bill', !b.active && 'is-paused')}>
          <div class="bill-head"><${CategoryGlyph} name=${b.category}/><span class="bill-text"><strong>${b.merchant}</strong><small>${frequencies[b.frequency]} · next ${longDate(b.nextDue)}</small></span><b>${money(b.cents)}</b></div>
          <div class="bill-meta"><span>Paid by ${data.names[b.payer]}</span><span>·</span><span>${b.split === 'half' ? 'Split equally' : 'All on ' + coupleName(data.names, b.split)}</span>${!b.active && html`<${Pill} tone="quiet">Paused<//>`}</div>
          <div class="bill-actions">
            ${b.active && html`<button type="button" class="btn btn-secondary btn-small" data-record=${b.id} onClick=${() => present('bill-record', {id: b.id})}>Record now</button>`}
            ${b.creator === data.seat && html`<button type="button" class="btn btn-quiet btn-small" data-edit=${b.id} onClick=${() => present('bill-editor', {id: b.id})}>Edit</button>`}
            ${b.creator === data.seat && html`<button type="button" class="btn btn-danger-quiet btn-small" data-delete=${b.id} onClick=${() => deleteBill(b.id)}>Delete</button>`}
          </div>
        </article>`)}</div>`}
  <//>`;
}

export function BillEditor({sheetKey, id}) {
  const {data} = getState(), old = (data.recurring || []).find(b => b.id === id);
  const [b, setB] = useState(old ? {...old, amount: (old.cents / 100).toFixed(2)} : {merchant: '', amount: '', category: catalogValues(data, 'categories').includes('Bills') ? 'Bills' : 'Other', payer: data.seat, split: 'half', nextDue: today(), frequency: 'monthly', notes: '', active: true, reminder: true, sheet: ''});
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const set = patch => setB({...b, ...patch});
  const submit = async event => {
    event.preventDefault(); setError('');
    if (!b.merchant) return setError('Choose a merchant.');
    if (!/^\d+(\.\d{1,2})?$/.test(b.amount) || Number(b.amount) <= 0) return setError('Enter an amount with no more than two decimal places.');
    setBusy(true);
    try {
      await save({action: 'recurring', bill: {id: old?.id, merchant: b.merchant, cents: Math.round(Number(b.amount) * 100), category: b.category, payer: Number(b.payer), split: b.split, nextDue: b.nextDue, frequency: b.frequency, sheet: b.sheet, notes: b.notes, active: b.active, reminder: b.reminder}});
      closeSheet(sheetKey); toast('Recurring bill saved');
    } catch (e) { setError(e.message); setBusy(false); }
  };
  return html`<${Sheet} title=${old ? 'Edit bill' : 'New recurring bill'} size="large">
    <form id="bill-form" class="form" onSubmit=${submit}>
      <div class="field-pair">
        <label class="field"><span>Merchant</span><button type="button" class="select-button" name="merchant" onClick=${() => present('catalog', {kind: 'merchants', selected: b.merchant, onPick: merchant => set({merchant})})}>${b.merchant || 'Choose'}<${Icon} name="chevron-down"/></button></label>
        <label class="field"><span>Amount</span><input name="amount" inputmode="decimal" placeholder="0.00" value=${b.amount} onInput=${e => set({amount: e.currentTarget.value})}/></label>
      </div>
      <div class="field-pair">
        <label class="field"><span>Category</span><button type="button" class="select-button" name="category" onClick=${() => present('catalog', {kind: 'categories', selected: b.category, onPick: category => set({category})})}>${b.category}<${Icon} name="chevron-down"/></button></label>
        <label class="field"><span>Next due</span><input type="date" name="nextDue" value=${b.nextDue} required onInput=${e => set({nextDue: e.currentTarget.value})}/></label>
      </div>
      <label class="field"><span>Repeats</span><select name="frequency" value=${b.frequency} onChange=${e => set({frequency: e.currentTarget.value})}>${Object.entries(frequencies).map(([k, label]) => html`<option value=${k}>${label}</option>`)}</select></label>
      <div class="field-pair">
        <label class="field"><span>Paid by</span><select name="payer" value=${b.payer} onChange=${e => set({payer: Number(e.currentTarget.value)})}>${data.names.map((n, i) => html`<option value=${i}>${n}</option>`)}</select></label>
        <label class="field"><span>Split</span><select name="split" value=${b.split} onChange=${e => set({split: e.currentTarget.value})}><option value="half">Equally</option><option value="a">All on ${coupleName(data.names, 'a')}</option><option value="b">All on ${coupleName(data.names, 'b')}</option></select></label>
      </div>
      <label class="field"><span>Preferred sheet</span><select name="sheet" value=${b.sheet} onChange=${e => set({sheet: e.currentTarget.value})}><option value="">Choose when recording</option>${data.sheets.filter(s => !s.archived || s.id === b.sheet).map(s => html`<option value=${s.id}>${s.name}${s.archived ? ' · Archived' : ''}</option>`)}</select></label>
      <label class="field"><span>Note · optional</span><input name="notes" maxlength="500" value=${b.notes} onInput=${e => set({notes: e.currentTarget.value})}/></label>
      <div class="card list switches">
        <${Switch} label="Active schedule" checked=${b.active} onChange=${active => set({active})}/>
        <${Switch} label="Remind me on Home a week before" checked=${b.reminder} onChange=${reminder => set({reminder})}/>
      </div>
      <p class="form-hint">Reminders show inside the app; nothing is sent while it’s closed.</p>
      ${error && html`<p class="form-error" role="alert">${error}</p>`}
      <button type="submit" class="btn btn-primary btn-block" disabled=${busy}>Save bill</button>
      ${old && old.creator === data.seat && html`<button type="button" class="btn btn-danger-quiet btn-block" id="delete-bill" disabled=${busy} onClick=${() => deleteBill(old.id)}>Delete bill</button>`}
    </form>
  <//>`;
}

export function RecordBill({sheetKey, id}) {
  const {data} = useStore('data'), bill = (data.recurring || []).find(b => b.id === id);
  const open = data.sheets.filter(s => !s.archived);
  const [sheet, setSheet] = useState(() => (open.find(s => s.id === bill?.sheet) || open.find(s => s.pinned) || open[0])?.id || '');
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  if (!bill) return html`<${Sheet} title="Bill" class="sheet-compact"><p class="sheet-lede">This bill no longer exists.</p><//>`;
  const submit = async event => {
    event.preventDefault(); setError('');
    if (!sheet) return setError('Create an open sheet before recording a bill.');
    setBusy(true);
    try { await save({action: 'recurring-record', id: bill.id, due: bill.nextDue, sheet}); closeSheet(sheetKey); toast('Bill recorded · next due date updated'); }
    catch (e) { setError(e.message); setBusy(false); }
  };
  return html`<${Sheet} title="Record bill" class="sheet-compact">
    <form id="record-bill" class="form" onSubmit=${submit}>
      <div class="detail-hero detail-hero-sm"><${CategoryGlyph} name=${bill.category} size="lg"/><strong>${bill.merchant}</strong><span class="amount-lg">${money(bill.cents)}</span><p>Due ${shortDate(bill.nextDue)} · ${frequencies[bill.frequency]}</p></div>
      <p class="sheet-lede">Paid by ${data.names[bill.payer]}, ${bill.split === 'half' ? 'split equally' : 'all on ' + coupleName(data.names, bill.split)}. You’ll be recorded as the person who added it.</p>
      ${open.length > 1 ? html`<label class="field"><span>Add to sheet</span><select name="sheet" value=${sheet} onChange=${e => setSheet(e.currentTarget.value)}>${open.map(s => html`<option value=${s.id}>${s.name}</option>`)}</select></label>` : ''}
      <p class="form-hint">Only confirm once the bill is actually paid. This adds one expense and moves the due date forward.</p>
      ${error && html`<p class="form-error" role="alert">${error}</p>`}
      <button type="submit" class="btn btn-primary btn-block" disabled=${busy}>Confirm & add expense</button>
    </form>
  <//>`;
}
