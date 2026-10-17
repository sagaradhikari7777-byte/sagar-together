import {html, useState, useEffect, useRef} from '../../vendor/preact-htm.js';
import {filterExpenses} from '../../journal.js';
import {settlementOverview} from '../../settlement-overview.js';
import {catalogValues} from '../../catalog.js';
import {useStore, getState} from '../store.js';
import {present, back} from '../nav.js';
import {Page, Icon, Segmented, Empty, Sheet, Amount, cx} from '../ui.js';
import {DayGroups, ExpenseRow} from '../common.js';
import {group, money, plural} from '../format.js';
import {exportCSV} from '../flows/export.js';

export const emptyFilters = () => ({payer: '', creator: '', receipt: '', category: '', sheet: '', from: '', to: '', sort: 'newest'});
// Activity keeps its search while you move between tabs.
const memory = {query: '', status: 'all', filters: emptyFilters(), focus: false};
export function focusActivitySearch() { memory.focus = true; }

export function Activity() {
  const {data} = useStore();
  const [query, setQuery] = useState(memory.query), [status, setStatus] = useState(memory.status), [filters, setFilters] = useState(memory.filters);
  const search = useRef();
  useEffect(() => { Object.assign(memory, {query, status, filters}); }, [query, status, filters]);
  useEffect(() => { if (memory.focus) { memory.focus = false; search.current?.focus(); } }, []);
  const scope = filters.sheet ? data.expenses.filter(e => e.sheet === filters.sheet) : data.expenses;
  const shown = filterExpenses(scope, data.names, {...filters, query, status, sheets: data.sheets});
  const mine = group(data.seat), summary = settlementOverview(shown, mine, {includeSettled: true});
  const active = ['payer', 'creator', 'receipt', 'category', 'sheet', 'from', 'to'].filter(k => filters[k]).length + (filters.sort !== 'newest' ? 1 : 0);
  const byAmount = ['largest', 'smallest'].includes(filters.sort);
  const clear = () => { setQuery(''); setStatus('all'); setFilters(emptyFilters()); };
  return html`<${Page} title="Activity" scrollKey="activity"
    actions=${html`<button type="button" class="nav-button" onClick=${() => exportCSV(shown)} disabled=${!shown.length} aria-label="Export shown expenses as CSV" data-action="export-results"><${Icon} name="download"/></button>`}>
    <div class="searchbar">
      <label class="search"><${Icon} name="search"/><input id="search" ref=${search} type="search" placeholder="Merchant, person or amount" aria-label="Search expenses" value=${query} onInput=${e => setQuery(e.currentTarget.value)} autocomplete="off"/>
        ${query && html`<button type="button" class="search-clear" onClick=${() => { setQuery(''); search.current?.focus(); }} aria-label="Clear search"><${Icon} name="x-circle"/></button>`}</label>
    </div>
    <div class="toolbar">
      <${Segmented} label="Status" value=${status} onChange=${setStatus} options=${[{value: 'all', label: 'All'}, {value: 'open', label: 'Open'}, {value: 'settled', label: 'Settled'}]}/>
      <button type="button" class=${cx('chip-button', active && 'is-active')} data-action="filters" onClick=${() => present('filters', {filters, onApply: setFilters})}><${Icon} name="sliders"/>Filters${active ? ` · ${active}` : ''}</button>
    </div>
    ${shown.length > 0 && html`<div class="result-line"><span>${plural(shown.length, 'expense')} · <b>${money(summary.total)}</b></span><span>Your couple’s share <b>${money(summary.share)}</b></span></div>`}
    ${shown.length === 0 ? html`<div class="card card-pad"><${Empty} emoji=${data.expenses.length ? '🔎' : '🧾'} title=${data.expenses.length ? 'No matches' : 'No expenses yet'} text=${data.expenses.length ? 'Try a different search or clear your filters.' : 'Add an expense and it will show up here.'}>
        ${data.expenses.length > 0 && html`<button type="button" class="btn btn-secondary" data-action="reset-filters" onClick=${clear}>Clear search and filters</button>`}<//></div>`
      : byAmount ? html`<div class="card list">${shown.map(e => html`<${ExpenseRow} key=${e.id} expense=${e} showSheet/>`)}</div>`
      : html`<${DayGroups} expenses=${shown} showSheet/>`}
  <//>`;
}

export function FiltersSheet({filters, onApply}) {
  const {data} = getState();
  const [f, setF] = useState(filters), [error, setError] = useState('');
  const set = (key, value) => setF({...f, [key]: value});
  const categories = [...new Set([...catalogValues(data, 'categories'), ...data.expenses.map(e => e.category)])].sort((a, b) => a.localeCompare(b));
  const people = data.names.map((n, i) => html`<option value=${i}>${i === data.seat ? 'You · ' : ''}${n}</option>`);
  const apply = () => {
    if (f.from && f.to && f.from > f.to) return setError('Choose an end date on or after the start.');
    onApply(f); back();
  };
  return html`<${Sheet} title="Filters" size="large" left=${html`<button type="button" class="nav-text" id="clear-filters" onClick=${() => { onApply(emptyFilters()); back(); }}>Clear</button>`}
    footer=${html`<button type="button" class="btn btn-primary btn-block" onClick=${apply}>Show expenses</button>`}>
    <form id="filter-form" class="form" onSubmit=${e => { e.preventDefault(); apply(); }}>
      <div class="field-pair">
        <label class="field"><span>Paid by</span><select name="payer" value=${f.payer} onChange=${e => set('payer', e.currentTarget.value)}><option value="">Everyone</option>${people}</select></label>
        <label class="field"><span>Added by</span><select name="creator" value=${f.creator} onChange=${e => set('creator', e.currentTarget.value)}><option value="">Everyone</option>${people}</select></label>
      </div>
      <div class="field-pair">
        <label class="field"><span>Category</span><select name="category" value=${f.category} onChange=${e => set('category', e.currentTarget.value)}><option value="">All categories</option>${categories.map(c => html`<option value=${c}>${c}</option>`)}</select></label>
        <label class="field"><span>Receipt</span><select name="receipt" value=${f.receipt} onChange=${e => set('receipt', e.currentTarget.value)}><option value="">Any</option><option value="with">With receipt</option><option value="without">Missing receipt</option></select></label>
      </div>
      <label class="field"><span>Sheet</span><select name="sheet" value=${f.sheet} onChange=${e => set('sheet', e.currentTarget.value)}><option value="">All sheets</option>${data.sheets.map(s => html`<option value=${s.id}>${s.name}${s.archived ? ' · Archived' : ''}</option>`)}</select></label>
      <div class="field-pair">
        <label class="field"><span>From</span><input type="date" name="from" value=${f.from} onInput=${e => set('from', e.currentTarget.value)}/></label>
        <label class="field"><span>To</span><input type="date" name="to" value=${f.to} onInput=${e => set('to', e.currentTarget.value)}/></label>
      </div>
      <label class="field"><span>Sort</span><select name="sort" value=${f.sort} onChange=${e => set('sort', e.currentTarget.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="largest">Highest amount</option><option value="smallest">Lowest amount</option></select></label>
      ${error && html`<p class="form-error" role="alert">${error}</p>`}
    </form>
  <//>`;
}
