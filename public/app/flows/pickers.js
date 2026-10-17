import {html, useState, useRef, useEffect} from '../../vendor/preact-htm.js';
import {catalogValues} from '../../catalog.js';
import {useStore, getState, save, toast} from '../store.js';
import {present, replace, closeSheet} from '../nav.js';
import {Sheet, Icon, Segmented, MerchantMark, CategoryGlyph, Empty, cx} from '../ui.js';
import {plural} from '../format.js';

/** Merchants or categories. With onPick it selects; without, it manages the list. */
export function CatalogSheet({sheetKey, kind, selected = '', onPick}) {
  const {data} = useStore();
  const merchants = kind === 'merchants', field = merchants ? 'merchant' : 'category';
  const [query, setQuery] = useState(''), [sort, setSort] = useState(onPick ? 'frequent' : 'az'), [error, setError] = useState('');
  const search = useRef();
  const all = catalogValues(data, kind), needle = query.trim().toLocaleLowerCase();
  const counts = new Map();
  for (const e of data.expenses) counts.set(e[field], (counts.get(e[field]) || 0) + 1);
  const names = all.filter(n => n.toLocaleLowerCase().includes(needle));
  if (merchants) names.sort((a, b) => (sort === 'frequent' ? (counts.get(b) || 0) - (counts.get(a) || 0) : 0) || a.localeCompare(b));
  const exact = all.some(n => n.toLocaleLowerCase() === needle);
  const choose = name => {
    if (onPick) { onPick(name); closeSheet(sheetKey); }
    else present('catalog-edit', {kind, previous: name});
  };
  const quickAdd = async () => {
    const name = query.trim(); setError('');
    try { await save({action: 'catalog', kind, operation: 'add', name}); toast(`${name} added`); if (onPick) { onPick(name); closeSheet(sheetKey); } else setQuery(''); }
    catch (e) { setError(e.message); }
  };
  const title = onPick ? (merchants ? 'Choose merchant' : 'Choose category') : merchants ? 'Merchants' : 'Categories';
  return html`<${Sheet} title=${title} size="large" class=${cx('catalog', onPick && 'is-picking')}
    right=${html`<button type="button" class="nav-button nav-button-accent" id="catalog-add" onClick=${() => present('catalog-edit', {kind, initial: query.trim(), pickerKey: onPick ? sheetKey : '', onPick})} aria-label=${'Add ' + field}><${Icon} name="plus"/></button>`}>
    <div class="catalog-tools">
      <label class="search"><${Icon} name="search"/><input id="catalog-search" ref=${search} type="search" placeholder="Search" aria-label=${'Search ' + kind} value=${query} onInput=${e => setQuery(e.currentTarget.value)} autocomplete="off"/></label>
      ${merchants && html`<${Segmented} label="Order" value=${sort} onChange=${setSort} class="segmented-sm" options=${[{value: 'frequent', label: 'Frequent'}, {value: 'az', label: 'A–Z'}]}/>`}
    </div>
    ${needle && !exact && html`<button type="button" class="add-row" onClick=${quickAdd}><span class="add-row-icon"><${Icon} name="plus"/></span><span>Add “${query.trim()}”</span></button>`}
    ${error && html`<p class="form-error" role="alert">${error}</p>`}
    <p class="catalog-count" role="status">${needle ? plural(names.length, 'result') : plural(all.length, merchants ? 'merchant' : 'category', merchants ? 'merchants' : 'categories')}${!onPick ? ' · tap to rename or remove' : ''}</p>
    ${names.length === 0 && !needle ? html`<${Empty} emoji=${merchants ? '🏪' : '🏷️'} title=${'No ' + kind + ' yet'} text=${'Add your first ' + field + '.'}/>`
      : merchants ? html`<div class="card list">${names.map(n => html`<button type="button" class=${cx('pick', n === selected && 'is-selected')} data-choice=${n} aria-pressed=${onPick ? String(n === selected) : undefined} onClick=${() => choose(n)}>
          <${MerchantMark} name=${n}/><span class="pick-text"><strong>${n}</strong><small>${counts.get(n) ? plural(counts.get(n), 'expense') : 'No expenses yet'}</small></span>
          ${n === selected ? html`<${Icon} name="check" class="pick-check"/>` : !onPick && html`<${Icon} name="chevron" class="row-chevron"/>`}
        </button>`)}</div>`
      : html`<div class="tiles">${names.map(n => html`<button type="button" class=${cx('tile', n === selected && 'is-selected')} data-choice=${n} aria-pressed=${onPick ? String(n === selected) : undefined} onClick=${() => choose(n)}>
          <${CategoryGlyph} name=${n} size="lg"/><strong>${n}</strong><small>${counts.get(n) ? plural(counts.get(n), 'expense') : '—'}</small>
          ${n === selected && html`<${Icon} name="check" class="tile-check"/>`}
        </button>`)}</div>`}
    ${!onPick && html`<p class="sheet-note">Renaming or removing doesn’t change past expenses.</p>`}
  <//>`;
}

export function CatalogEdit({sheetKey, kind, previous = '', initial = '', pickerKey, onPick}) {
  const merchants = kind === 'merchants', field = merchants ? 'merchant' : 'category';
  const [name, setName] = useState(previous || initial), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('');
    const value = name.trim();
    try {
      await save({action: 'catalog', kind, operation: previous ? 'rename' : 'add', name: value, previous: previous || undefined});
      toast(previous ? 'Renamed' : `${value} added`);
      if (onPick && pickerKey) { onPick(value); closeSheet(pickerKey); } else closeSheet(sheetKey);
    } catch (e) { setError(e.message); setBusy(false); }
  };
  const remove = async () => {
    setBusy(true);
    try { await save({action: 'catalog', kind, operation: 'remove', previous}); toast('Removed from the list'); closeSheet(sheetKey); }
    catch (e) { setError(e.message); setBusy(false); }
  };
  return html`<${Sheet} title=${previous ? 'Edit ' + field : 'New ' + field} class="sheet-compact">
    <form id="catalog-form" class="form" onSubmit=${submit}>
      <div class="catalog-preview">${merchants ? html`<${MerchantMark} name=${name || '?'} size="lg"/>` : html`<${CategoryGlyph} name=${name} size="lg"/>`}</div>
      <label class="field"><span>${merchants ? 'Merchant' : 'Category'}</span><input name="label" value=${name} required maxlength=${merchants ? 80 : 40} autocomplete="off" autocorrect="off" autocapitalize="words" spellcheck="false" placeholder=${merchants ? 'e.g. Woolworths' : 'e.g. Groceries'} autofocus onInput=${e => setName(e.currentTarget.value)}/></label>
      ${error && html`<p class="form-error" role="alert">${error}</p>`}
      <button type="submit" class="btn btn-primary btn-block" disabled=${busy}>${previous ? 'Save' : 'Add ' + field}</button>
      ${previous && html`<button type="button" class="btn btn-danger-quiet btn-block" id="catalog-remove" disabled=${busy} onClick=${remove}>Remove from list</button>`}
    </form>
  <//>`;
}
