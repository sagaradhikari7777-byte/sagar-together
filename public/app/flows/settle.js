import {html, useState} from '../../vendor/preact-htm.js';
import {settlementOverview, householdOverview} from '../../settlement-overview.js';
import {useStore, getState, save, toast} from '../store.js';
import {closeSheet} from '../nav.js';
import {Sheet, SheetBack, Icon, Amount, Flow, SlideToConfirm, Empty, CouplePair, FairShareBar, cx} from '../ui.js';
import {group, otherCouple, coupleName, money, plural, rangeLabel} from '../format.js';
import {summaryText, shareText} from './export.js';

/**
 * Settling is per sheet. Without a sheet, the flow first shows every open
 * sheet with a balance; a single candidate goes straight to review.
 */
export function SettleSheet({sheetKey, sheetId}) {
  const {data, busy} = useStore();
  const mine = group(data.seat);
  const candidates = householdOverview(data, mine).sheets.filter(row => row.rows.length);
  const [chosen, setChosen] = useState(sheetId || (candidates.length === 1 ? candidates[0].sheet.id : ''));
  const [done, setDone] = useState(null), [error, setError] = useState('');

  if (done) return html`<${Sheet} title="Recorded" size="large" class="settle">
    <div class="success">
      <span class="success-mark" aria-hidden="true"><${Icon} name="check"/></span>
      <h3>${done.net ? 'Payment recorded' : 'Sheet closed'}</h3>
      <p>${done.net ? `${coupleName(data.names, done.from)} paid ${money(Math.abs(done.net))} to ${coupleName(data.names, done.to)}.` : 'The balanced expenses are settled.'} <b>${done.name}</b> is now in Archived.</p>
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
          <span class="srow-text"><strong>${row.sheet.name}</strong><small>${plural(row.rows.length, 'unsettled expense')} · ${rangeLabel(row.sheet)}</small></span>
          <span class="srow-end"><b class=${row.net > 0 ? 'is-owe' : row.net < 0 ? 'is-owed' : ''}>${row.net ? money(Math.abs(row.net)) : 'Even'}</b><small>${row.net > 0 ? 'you pay' : row.net < 0 ? 'you receive' : 'balanced'}</small></span>
          <${Icon} name="chevron" class="row-chevron"/>
        </button>`)}</div>
        <button type="button" class="btn btn-secondary btn-block" data-action="settlement-summary" onClick=${() => shareText(summaryText(overall.expenses, 'All open sheets'), 'Settlement summary').catch(() => {})}><${Icon} name="share"/> Share a summary</button>`}
    <//>`;
  }

  const items = data.expenses.filter(e => e.sheet === sheet.id), open = items.filter(e => !e.settlement);
  const a = settlementOverview(open, 'a'), b = settlementOverview(open, 'b');
  const from = a.net > 0 ? 'a' : 'b', to = otherCouple(from), net = a.net;
  const record = async () => {
    setError('');
    try {
      const summary = summaryText(items, sheet.name);
      await save({action: 'settle', sheet: sheet.id});
      setDone({net, from, to, name: sheet.name, summary});
    } catch (e) { setError(e.message); }
  };
  return html`<${Sheet} title=${sheet.name} size="large" class="settle" left=${!sheetId && candidates.length > 1 ? html`<button type="button" class="nav-button" onClick=${() => setChosen('')} aria-label="All sheets"><${Icon} name="back"/></button>` : ''}>
    ${open.length === 0 ? html`<${Empty} emoji="✅" title="Already settled" text="There’s nothing unsettled on this sheet."/>` : html`
      <div class="settle-hero">
        ${net ? html`<${Flow} names=${data.names} from=${from} to=${to}/>` : html`<${Flow} names=${data.names} from="a" to="b" settled/>`}
        <${Amount} cents=${Math.abs(net)} class="amount-hero"/>
        <p>${net ? html`<b>${coupleName(data.names, from)}</b> pay <b>${coupleName(data.names, to)}</b>` : 'These expenses balance out. Nobody needs to pay.'}</p>
      </div>
      <${FairShareBar} names=${data.names} overview=${a}/>
      <div class="couple-compare">
        ${[['a', a], ['b', b]].map(([g, o]) => html`<div class=${'couple-' + g}>
          <span class="compare-head"><${CouplePair} names=${data.names} couple=${g} size="sm"/>${coupleName(data.names, g)}</span>
          <span><small>Share</small><b>${money(o.share)}</b></span><span><small>Paid</small><b>${money(o.paid)}</b></span>
        </div>`)}
      </div>
      <p class="settle-note"><${Icon} name="info"/> Records a payment you’ve made outside the app — no money moves. ${plural(open.length, 'expense')} will lock and the sheet moves to Archived. You can reverse it later from Payments.</p>
      ${error && html`<p class="form-error" role="alert">${error}</p>`}
      <${SlideToConfirm} label=${net ? 'Slide to record payment' : 'Slide to close sheet'} onConfirm=${record} disabled=${busy || !!error}/>
      ${error && html`<button type="button" class="btn btn-quiet btn-block" onClick=${() => setError('')}>Try again</button>`}
      <button type="button" class="btn btn-quiet btn-block" data-action="settlement-summary" onClick=${() => shareText(summaryText(items, sheet.name), 'Settlement summary').catch(() => {})}><${Icon} name="share"/> Share summary first</button>`}
  <//>`;
}
