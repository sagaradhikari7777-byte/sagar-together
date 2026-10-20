import {html} from '../../vendor/preact-htm.js';
import {useStore, savedDraft} from '../store.js';
import {present, push, go} from '../nav.js';
import {Page, Amount, Icon, FairShareBar, CategoryGlyph, Empty, CouplePair, cx} from '../ui.js';
import {ExpenseRow, ThemeToggle} from '../common.js';
import {group, otherCouple, coupleName, greeting, money, plural, today, periodProgress, rangeLabel, categoryLook, shortDate, firstName} from '../format.js';
import {householdOverview, currentSheet as current, recentExpenses, upcomingBills, sheetSummary, sheetCategories, insightFor} from '../derive.js';
import {openAddExpense} from '../flows/expense.js';
import {draftAmount} from '../amount-entry.js';

export const currentSheet = data => current(data) || undefined;

export function Home() {
  const {data, demo} = useStore('data', 'demo', 'drafts');
  const mine = group(data.seat), other = otherCouple(mine), day = today();
  const yours = householdOverview(data, mine), coupleA = householdOverview(data, 'a');
  const sheet = currentSheet(data), draft = savedDraft();
  const recent = recentExpenses(data, 5);
  const bills = upcomingBills(data, day);
  return html`<${Page} title=${data.name || 'Together'} eyebrow=${`${greeting()}, ${firstName(data.names[data.seat])}`} scrollKey="home"
    actions=${html`<${ThemeToggle}/><button type="button" class="nav-button" onClick=${() => go('activity')} aria-label="Search expenses"><${Icon} name="search"/></button>`}>
    <${BalanceCard} data=${data} yours=${yours} coupleA=${coupleA} mine=${mine} other=${other} sheet=${yours.sheets.length === 1 ? sheet : null}/>
    ${draft && html`<button type="button" class="card draft" onClick=${() => openAddExpense()}>
      <span class="draft-emoji" aria-hidden="true">✍️</span>
      <span class="draft-text"><strong>Finish your expense</strong><small>${draft.values.merchant || 'Draft saved on this device'}${draftAmount(draft.values) ? ' · ' + draftAmount(draft.values) : ''}</small></span>
      <span class="btn btn-small btn-secondary">Resume</span>
    </button>`}
    ${sheet ? yours.sheets.length > 1 && html`<${PeriodCard} data=${data} sheet=${sheet}/>` : html`<div class="card card-pad">
      <${Empty} emoji="🗂️" title="No open sheet" text="Start a sheet for this fortnight to begin tracking together.">
        <button type="button" class="btn btn-primary" onClick=${() => present('sheet-form', {})}>New sheet</button>
      <//></div>`}
    ${bills.length > 0 && html`<section class="section">
      <div class="section-head"><h2>Coming up</h2><button type="button" class="link" onClick=${() => present('bills')}>All bills</button></div>
      <div class="rail">${bills.slice(0, 6).map(b => html`<button type="button" class="card bill-chip" data-bill-record=${b.id} onClick=${() => present('bill-record', {id: b.id})}>
        <${CategoryGlyph} name=${b.category} size="sm"/>
        <strong>${b.merchant}</strong>
        <span class=${cx('bill-due', b.nextDue < today() && 'is-overdue')}>${b.nextDue < today() ? 'Overdue' : b.nextDue === today() ? 'Due today' : 'Due ' + shortDate(b.nextDue)}</span>
        <b>${money(b.cents)}</b>
      </button>`)}</div>
    </section>`}
    <section class="section">
      <div class="section-head"><h2>Recent activity</h2>${data.expenses.length > 0 && html`<button type="button" class="link" onClick=${() => go('activity')}>See all</button>`}</div>
      ${recent.length ? html`<div class="card list">${recent.map(e => html`<${ExpenseRow} key=${e.id} expense=${e}/>`)}</div>`
        : data.expenses.length ? html`<div class="card card-pad"><${Empty} emoji="✅" title="All settled" text="Nothing open right now. Settled expenses and closed sheets are still in Activity and Sheets.">
            <button type="button" class="btn btn-primary" onClick=${() => openAddExpense()}><${Icon} name="plus"/> Add an expense</button><//></div>`
        : html`<div class="card card-pad"><${Empty} emoji="🧾" title="Nothing yet" text="Your household’s expenses will appear here as soon as someone adds one.">
            <button type="button" class="btn btn-primary" onClick=${() => openAddExpense()}><${Icon} name="plus"/> Add an expense</button><//></div>`}
    </section>
    ${demo && html`<p class="fineprint">Sample household · changes stay on this screen.</p>`}
  <//>`;
}

/** The balance, and with one open sheet that sheet too, so Home has a single hero. */
function BalanceCard({data, yours, coupleA, mine, other, sheet}) {
  const net = yours.net, open = yours.rows.length;
  const status = net > 0 ? 'owe' : net < 0 ? 'owed' : 'even';
  const line = net > 0 ? `You owe ${coupleName(data.names, other)}` : net < 0 ? `${coupleName(data.names, other)} owe you` : open ? 'Your couples are even' : 'All square';
  return html`<section class=${cx('wallet', 'is-' + status)} aria-labelledby="wallet-label">
    <div class="wallet-sheen" aria-hidden="true"></div>
    <span id="wallet-label" class="wallet-label">${net ? 'Your couple’s balance' : 'Balance'}</span>
    <${Amount} cents=${Math.abs(net)} class="amount-hero"/>
    <p class="wallet-line">${line}</p>
    ${coupleA.total > 0 ? html`<${FairShareBar} names=${data.names} overview=${coupleA}/>`
      : html`<div class="wallet-couples"><${CouplePair} names=${data.names} couple="a"/><span>${coupleName(data.names, 'a')}</span><i aria-hidden="true">+</i><span>${coupleName(data.names, 'b')}</span><${CouplePair} names=${data.names} couple="b"/></div>`}
    <div class="wallet-foot">
      ${sheet ? html`<${WalletSheet} data=${data} sheet=${sheet}/>`
        : html`<span>${open ? `${plural(open, 'unsettled expense')} · ${plural(yours.sheets.length, 'open sheet')}` : 'Nothing waiting to be settled'}</span>`}
      ${open > 0 && html`<button type="button" class="wallet-cta" data-action="open-settle" onClick=${() => present('settle', {})}>Settle up <${Icon} name="arrow"/></button>`}
    </div>
  </section>`;
}

function WalletSheet({data, sheet}) {
  const {total} = sheetSummary(data, sheet.id), progress = periodProgress(sheet);
  const left = progress?.total ? (progress.left === 0 ? 'ends today' : plural(progress.left, 'day') + ' left') : progress ? `day ${progress.day}` : '';
  return html`<button type="button" class="wallet-sheet" data-view-sheet=${sheet.id} onClick=${() => push('sheet', {id: sheet.id})} aria-label=${`Open ${sheet.name}`}>
    <strong>${sheet.name}<${Icon} name="chevron"/></strong>
    <span>${money(total)} spent${left ? ' · ' + left : ''}</span>
  </button>`;
}

function PeriodCard({data, sheet}) {
  const {total, items: entries} = sheetSummary(data, sheet.id);
  const insight = insightFor(data, sheet.id, today());
  const progress = periodProgress(sheet);
  const ranked = sheetCategories(data, sheet.id);
  const rest = ranked.slice(4).reduce((n, [, c]) => n + c, 0);
  const segments = [...ranked.slice(0, 4), ...(rest ? [['Other', rest]] : [])];
  const comparison = insight?.delta != null ? `${insight.delta > 0 ? '+' : ''}${insight.delta}% vs the same days last sheet` : plural(entries.length, 'expense');
  return html`<button type="button" class="card period" data-view-sheet=${sheet.id} onClick=${() => push('sheet', {id: sheet.id})} aria-label=${`Open ${sheet.name}`}>
    <div class="period-head">
      <span class="period-name"><small>${sheet.pinned ? 'Pinned sheet' : 'Current sheet'}</small><strong>${sheet.name}</strong><span>${rangeLabel(sheet)}</span></span>
      <${Ring} progress=${progress}/>
    </div>
    <div class="period-total"><${Amount} cents=${total} class="amount-lg"/><span>${comparison}</span></div>
    ${total > 0 ? html`
      <div class="ribbon" role="img" aria-label=${segments.map(([n, c]) => `${n} ${Math.round(c / total * 100)}%`).join(', ')}>
        ${segments.map(([name, cents]) => html`<i class=${'tone-' + categoryLook(name).tone} style=${`--w:${(cents / total * 100).toFixed(2)}%`}></i>`)}
      </div>
      <div class="ribbon-legend">${segments.slice(0, 3).map(([name, cents]) => html`<span><em aria-hidden="true">${categoryLook(name).emoji}</em>${name}<b>${money(cents)}</b></span>`)}</div>`
      : html`<p class="period-empty">No spending on this sheet yet.</p>`}
  </button>`;
}

/** Days elapsed in the sheet, as a ring. Open-ended sheets show the day count. */
export function Ring({progress}) {
  if (!progress) return '';
  const r = 22, c = 2 * Math.PI * r, pct = progress.pct ?? 0;
  return html`<span class="ring" role="img" aria-label=${progress.total ? `Day ${progress.day} of ${progress.total}` : `Day ${progress.day}`}>
    <svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r=${r} class="ring-track"/>${progress.total && html`<circle cx="26" cy="26" r=${r} class="ring-fill" style=${`stroke-dasharray:${c};stroke-dashoffset:${c * (1 - pct)}`}/>`}</svg>
    <span class="ring-text"><b>${progress.total ? progress.left : progress.day}</b><small>${progress.total ? (progress.left === 1 ? 'day left' : 'days left') : progress.day === 1 ? 'day' : 'days'}</small></span>
  </span>`;
}
