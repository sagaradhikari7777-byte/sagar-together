import {html, useState} from '../../vendor/preact-htm.js';
import {householdOverview, sheetSummary, sheetOverview, sheetPartPayments} from '../derive.js';
import {centsOf} from '../amount-entry.js';
import {partTotal} from '../../settlement-overview.js';
import {useStore, getState, save, toast} from '../store.js';
import {closeSheet} from '../nav.js';
import {Sheet, SheetBack, Icon, Amount, Flow, SlideToConfirm, Empty, CouplePair, FairShareBar, Segmented, cx} from '../ui.js';
import {group, otherCouple, coupleName, money, plural, rangeLabel, numericToday} from '../format.js';
import {summaryText, shareText} from './export.js';

/**
 * Settling is per sheet. Without a sheet, the flow first shows every open
 * sheet with a balance; a single candidate goes straight to review. A sheet
 * can be paid in full, which settles and closes it, or in part, which lowers
 * its balance and leaves its expenses and the sheet open.
 */
export function SettleSheet({sheetKey, sheetId}) {
  const {data, busy} = useStore('data', 'busy');
  const mine = group(data.seat);
  const candidates = householdOverview(data, mine).sheets.filter(row => row.rows.length || row.payments.length);
  const [chosen, setChosen] = useState(sheetId || (candidates.length === 1 ? candidates[0].sheet.id : ''));
  const [done, setDone] = useState(null), [error, setError] = useState('');
  const [mode, setMode] = useState('full'), [amount, setAmount] = useState('');

  if (done) return html`<${Sheet} title="Recorded" size="large" class="settle">
    <div class="success">
      <span class="success-mark" aria-hidden="true"><${Icon} name="check"/></span>
      <h3>${done.partial ? 'Part payment recorded' : done.net ? 'Payment recorded' : 'Sheet closed'}</h3>
      ${done.partial ? html`<p>${coupleName(data.names, done.from)} paid ${money(done.cents)} to ${coupleName(data.names, done.to)}. <b>${money(done.left)}</b> is still to settle on <b>${done.name}</b>, which stays open.</p>`
        : html`<p>${done.net ? `${coupleName(data.names, done.from)} paid ${money(Math.abs(done.net))} to ${coupleName(data.names, done.to)}.` : 'The balanced expenses are settled.'}${done.partPaid ? ` With ${money(done.partPaid)} paid earlier, the sheet is settled.` : ''} <b>${done.name}</b> is now in Archived.</p>`}
      <div class="stack">
        <button type="button" class="btn btn-secondary btn-block" onClick=${() => shareText(done.summary, 'Settlement').catch(() => {})}><${Icon} name="share"/> Share summary</button>
        <button type="button" class="btn btn-primary btn-block" onClick=${() => closeSheet(sheetKey)}>Done</button>
      </div>
    </div>
  <//>`;

  const sheet = data.sheets.find(s => s.id === chosen);
  if (!sheet) {
    const overall = householdOverview(data, mine), other = otherCouple(mine);
    return html`<${Sheet} title="Settle up" size="large" class="settle">
      ${candidates.length === 0 ? html`<${Empty} emoji="🌿" title="Nothing to settle" text="Every open expense is already settled."/>` : html`
        <div class="settle-overall">
          <p class="eyebrow">Across open sheets</p>
          <${Amount} cents=${Math.abs(overall.net)} class="amount-xl"/>
          <p>${overall.net > 0 ? `You owe ${coupleName(data.names, other)}` : overall.net < 0 ? `${coupleName(data.names, other)} owe you` : 'Your couples are even'}</p>
        </div>
        <p class="sheet-lede">Payments are recorded per sheet. Balances on different sheets can offset each other.</p>
        <div class="card list">${candidates.map(row => html`<button type="button" class="srow" data-settle-sheet=${row.sheet.id} onClick=${() => setChosen(row.sheet.id)}>
          <span class="srow-icon" aria-hidden="true">🗂️</span>
          <span class="srow-text"><strong>${row.sheet.name}</strong><small>${plural(row.rows.length, 'unsettled expense')}${row.payments.length ? ` · ${money(partTotal(row.payments))} part-paid` : ''} · ${rangeLabel(row.sheet)}</small></span>
          <span class="srow-end"><b class=${row.net > 0 ? 'is-owe' : row.net < 0 ? 'is-owed' : ''}>${row.net ? money(Math.abs(row.net)) : 'Even'}</b><small>${row.net > 0 ? 'you pay' : row.net < 0 ? 'you receive' : 'balanced'}</small></span>
          <${Icon} name="chevron" class="row-chevron"/>
        </button>`)}</div>
        <button type="button" class="btn btn-secondary btn-block" data-action="settlement-summary" onClick=${() => shareText(summaryText(overall.expenses, 'All open sheets'), 'Settlement summary').catch(() => {})}><${Icon} name="share"/> Share a summary</button>`}
    <//>`;
  }

  const {items, open} = sheetSummary(data, sheet.id), parts = sheetPartPayments(data, sheet.id);
  const a = sheetOverview(data, sheet.id, 'a'), b = sheetOverview(data, sheet.id, 'b');
  const from = a.net > 0 ? 'a' : 'b', to = otherCouple(from), net = a.net, owed = Math.abs(net);
  const partPaid = partTotal(parts);
  const partial = mode === 'partial' && net !== 0 && open.length > 0;
  const cents = partial ? centsOf(amount.replace(/[$,\s]/g, '')) : 0;
  const amountError = !partial || !amount.trim() ? '' : !cents || cents < 0 ? 'Enter the amount that was paid.' : cents >= owed ? `That covers the whole ${money(owed)}. Choose Pay in full instead.` : '';
  const ready = !partial || (cents > 0 && !amountError);
  const slideLabel = partial ? (ready ? `Slide to record ${money(cents)}` : 'Enter an amount') : net ? 'Slide to record payment' : 'Slide to close sheet';
  const record = async () => {
    setError('');
    try {
      if (partial) {
        await save({action: 'settle-partial', sheet: sheet.id, cents});
        setDone({partial: true, cents, left: owed - cents, from, to, name: sheet.name,
          summary: `Together · ${sheet.name}\n${coupleName(data.names, from)} paid ${money(cents)} to ${coupleName(data.names, to)} (part payment).\n${money(owed - cents)} still to settle.\nAs of ${numericToday()}. This is a record, not a payment confirmation.`});
        return;
      }
      const summary = summaryText(items, sheet.name);
      await save({action: 'settle', sheet: sheet.id});
      setDone({net, from, to, name: sheet.name, summary, partPaid});
    } catch (e) { setError(e.message); }
  };
  const nothing = open.length === 0 && parts.length === 0;
  return html`<${Sheet} title=${sheet.name} size="large" class="settle" left=${!sheetId && candidates.length > 1 ? html`<button type="button" class="nav-button" onClick=${() => setChosen('')} aria-label="All sheets"><${Icon} name="back"/></button>` : ''}>
    ${nothing ? html`<${Empty} emoji="✅" title="Already settled" text="There’s nothing unsettled on this sheet."/>` : html`
      <div class="settle-hero">
        ${net ? html`<${Flow} names=${data.names} from=${from} to=${to}/>` : html`<${Flow} names=${data.names} from="a" to="b" settled/>`}
        <${Amount} cents=${partial && cents > 0 && !amountError ? cents : owed} class="amount-hero"/>
        <p>${!net ? 'These expenses balance out. Nobody needs to pay.' : partial && cents > 0 && !amountError ? html`<b>${coupleName(data.names, from)}</b> pay part now · <b>${money(owed - cents)}</b> left after` : html`<b>${coupleName(data.names, from)}</b> pay <b>${coupleName(data.names, to)}</b>`}</p>
        ${parts.length > 0 && html`<p class="settle-parts" data-part-paid=${partPaid}>${money(partPaid)} already paid in ${plural(parts.length, 'part payment')}</p>`}
      </div>
      ${net !== 0 && open.length > 0 && html`<${Segmented} label="How much was paid" value=${mode} onChange=${m => { setMode(m); setError(''); }} class="segmented-wide" options=${[{value: 'full', label: 'Pay in full'}, {value: 'partial', label: 'Part payment'}]}/>`}
      ${partial ? html`<div class="settle-part">
        <label class="field"><span>Amount paid</span><input name="part-amount" inputmode="decimal" autocomplete="off" placeholder=${'Up to ' + money(owed - 1)} value=${amount} onInput=${e => setAmount(e.currentTarget.value)}/></label>
        <div class="chips"><span class="chips-label">Quick</span>${[['Half', Math.round(owed / 2)], ['A quarter', Math.round(owed / 4)]].filter(([, c]) => c > 0 && c < owed).map(([label, c]) => html`<button type="button" class="chip" onClick=${() => setAmount((c / 100).toFixed(2))}>${label} · ${money(c)}</button>`)}</div>
        ${amountError && html`<p class="form-error" role="alert">${amountError}</p>`}
      </div>` : html`
      <${FairShareBar} names=${data.names} overview=${a}/>
      <div class="couple-compare">
        ${[['a', a], ['b', b]].map(([g, o]) => html`<div class=${'couple-' + g}>
          <span class="compare-head"><${CouplePair} names=${data.names} couple=${g} size="sm"/>${coupleName(data.names, g)}</span>
          <span><small>Share</small><b>${money(o.share)}</b></span><span><small>Paid</small><b>${money(o.paid)}</b></span>
        </div>`)}
      </div>`}
      <p class="settle-note"><${Icon} name="info"/> ${partial
        ? 'Records a part payment you’ve made outside the app — no money moves. The expenses and the sheet stay open, and the balance drops by this amount. You can reverse it later from Payments.'
        : `Records a payment you’ve made outside the app — no money moves. ${open.length ? plural(open.length, 'expense') + ' will lock and the' : 'The'} sheet moves to Archived. You can reverse it later from Payments.`}</p>
      ${error && html`<p class="form-error" role="alert">${error}</p>`}
      <${SlideToConfirm} label=${slideLabel} onConfirm=${record} disabled=${busy || !!error || !ready}/>
      ${error && html`<button type="button" class="btn btn-quiet btn-block" onClick=${() => setError('')}>Try again</button>`}
      <button type="button" class="btn btn-quiet btn-block" data-action="settlement-summary" onClick=${() => shareText(summaryText(items, sheet.name), 'Settlement summary').catch(() => {})}><${Icon} name="share"/> Share summary first</button>`}
  <//>`;
}
