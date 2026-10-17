import {html, useState} from '../../vendor/preact-htm.js';
import {catalogValues} from '../../catalog.js';
import {useStore, getState, save, toast, signOut, exitDemo, setTheme, shareLink, entryPreferences, setEntryPreferences} from '../store.js';
import {present, back, closeSheet} from '../nav.js';
import {Page, Group, Row, Icon, Avatar, Sheet, Segmented, Empty, Pill, cx} from '../ui.js';
import {confirm} from '../common.js';
import {group, otherCouple, coupleName, members, money, plural, stamp, initials} from '../format.js';
import {exportCSV} from '../flows/export.js';

export function Household() {
  const {data, demo, theme} = useStore('data', 'demo', 'theme');
  const pending = data.claimed.filter(c => !c).length;
  const leave = () => demo ? exitDemo() : confirm({title: 'Sign out?', message: 'Keep your private access link so you can sign in again on this or another device.', confirm: 'Sign out', destructive: true, run: async () => signOut()});
  return html`<${Page} title="Household" eyebrow=${data.name} scrollKey="household">
    <section class="card people" aria-label="People">
      ${['a', 'b'].map(g => html`<div class=${cx('people-couple', 'couple-' + g)}>
        <span class="people-label">${g === group(data.seat) ? 'Your couple' : 'Other couple'}</span>
        ${members(data.names, g).map((name, i) => {
          const seat = (g === 'a' ? 0 : 2) + i;
          return html`<div class="person">
            <${Avatar} name=${name} seat=${seat} size="lg"/>
            <span class="person-text"><strong>${name}</strong><small>${seat === data.seat ? 'You' : data.claimed[seat] ? 'Joined' : 'Invited'}</small></span>
            ${!data.claimed[seat] && html`<span class="person-pending" title="Hasn’t joined yet">·</span>`}
          </div>`;
        })}
      </div>`)}
      <div class="people-actions">
        <button type="button" class="btn btn-secondary btn-small" data-action="settings-household" onClick=${() => present('names')}><${Icon} name="edit"/> Edit names</button>
        <button type="button" class="btn btn-secondary btn-small" data-action="invite" onClick=${() => present('invite')}><${Icon} name="invite"/> Invite${pending ? ` · ${pending}` : ''}</button>
      </div>
    </section>

    <${Group} title="Money">
      <${Row} icon="history" tone="indigo" title="Payment history" subtitle="Recorded settlements and corrections" value=${data.settlements.length || ''} onClick=${() => present('payments')}/>
      <${Row} icon="calendar" tone="coral" title="Recurring bills" subtitle="Rent, utilities and subscriptions" value=${(data.recurring || []).length || ''} onClick=${() => present('bills')}/>
    <//>
    <${Group} title="Lists">
      <${Row} icon="store" tone="teal" title="Merchants" value=${catalogValues(data, 'merchants').length} onClick=${() => present('catalog', {kind: 'merchants'})}/>
      <${Row} icon="tag" tone="amber" title="Categories" value=${catalogValues(data, 'categories').length} onClick=${() => present('catalog', {kind: 'categories'})}/>
    <//>
    <${Group} title="Preferences">
      <${Row} icon="sparkles" tone="purple" title="Expense defaults" subtitle="Category and split for new expenses" onClick=${() => present('preferences')}/>
      <div class="row row-control"><span class="row-icon row-icon-slate"><${Icon} name="monitor"/></span><span class="row-text"><span class="row-title">Appearance</span></span>
        <${Segmented} label="Appearance" value=${theme} onChange=${setTheme} class="segmented-sm" options=${[{value: 'auto', label: 'Auto'}, {value: 'light', label: 'Light'}, {value: 'dark', label: 'Dark'}]}/></div>
    <//>
    <${Group} title="Access & data" footer="Your private link signs in as you. Keep it somewhere safe.">
      <${Row} icon="key" tone="green" title="Your private access link" onClick=${() => demo ? toast('Private links are available after creating a household.') : present('access')}/>
      <${Row} icon="download" tone="blue" title="Export all expenses" subtitle="CSV for spreadsheets" onClick=${() => exportCSV()}/>
    <//>
    <button type="button" class="btn btn-danger-quiet btn-block" data-action="signout" onClick=${leave}><${Icon} name="logout"/> ${demo ? 'Leave sample household' : 'Sign out'}</button>
    <p class="fineprint">Together · <a href="/classic/">Open the classic version</a></p>
  <//>`;
}

export function NamesSheet({sheetKey}) {
  const {data} = getState();
  const [name, setName] = useState(data.name), [names, setNames] = useState([...data.names]), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault();
    if (!name.trim() || names.some(n => !n.trim())) return setError('Enter the household name and all four names.');
    setBusy(true);
    try { await save({action: 'settings', name: name.trim(), names: names.map(n => n.trim())}); closeSheet(sheetKey); toast('Household updated'); }
    catch (e) { setError(e.message); setBusy(false); }
  };
  const person = (i, label) => html`<label class="field"><span>${label}</span><input name=${'n' + i} value=${names[i]} maxlength="40" required autocomplete="off" onInput=${e => { const next = [...names]; next[i] = e.currentTarget.value; setNames(next); }}/></label>`;
  return html`<${Sheet} title="Household & names">
    <form id="settings-household-form" class="form" onSubmit=${submit}>
      <label class="field"><span>Household name</span><input name="household" value=${name} maxlength="100" required autocomplete="off" onInput=${e => setName(e.currentTarget.value)}/></label>
      <p class="form-label couple-a"><i class="dot"></i>First couple</p>
      <div class="field-pair">${person(0, 'Person 1')}${person(1, 'Person 2')}</div>
      <p class="form-label couple-b"><i class="dot"></i>Second couple</p>
      <div class="field-pair">${person(2, 'Person 3')}${person(3, 'Person 4')}</div>
      <p class="form-hint">Renaming updates how someone appears everywhere. Their expenses and access stay the same.</p>
      ${error && html`<p class="form-error" role="alert">${error}</p>`}
      <button type="submit" class="btn btn-primary btn-block" disabled=${busy}>Save</button>
    </form>
  <//>`;
}

function LinkSheet({title, lede, url, shareTitle, primary, footer}) {
  const share = async () => {
    if (navigator.share) { try { await navigator.share({title: shareTitle, url}); } catch (e) { if (e.name !== 'AbortError') toast('Select and copy the link below.'); } return; }
    try { await navigator.clipboard.writeText(url); toast('Link copied'); } catch { toast('Select and copy the link below.'); }
  };
  return html`<${Sheet} title=${title}>
    <p class="sheet-lede">${lede}</p>
    <div class="linkbox" tabindex="0">${url}</div>
    <div class="stack"><button type="button" class="btn btn-primary btn-block" id="share-link" onClick=${share}><${Icon} name="share"/> ${primary}</button>${footer}</div>
  <//>`;
}

export function InviteSheet() {
  const {data, demo} = useStore('data', 'demo');
  if (demo) return html`<${Sheet} title="Invite your household"><${Empty} emoji="💌" title="Invitations need a real household" text="Create your household to invite the other three."/><//>`;
  const waiting = data.names.filter((_, i) => !data.claimed[i]);
  return html`<${LinkSheet} title="Invite your household" shareTitle="Join our Together household" url=${shareLink('invite')} primary="Share invitation"
    lede=${waiting.length ? `Send this to ${waiting.join(', ')}. Each person picks their name and gets their own private access link.` : 'Everyone has joined. A new invitation only lets someone claim an unclaimed name.'}
    footer=${html`<button type="button" class="btn btn-quiet btn-block" id="rotate" onClick=${() => confirm({title: 'Replace invitation?', message: 'The old invitation will stop working. People who already joined keep their access.', confirm: 'Replace invitation', run: async () => { await save({action: 'rotate-invite'}); toast('Invitation replaced'); }})}>Replace this invitation</button>`}/>`;
}

export function AccessSheet({fresh}) {
  const {data} = getState();
  return html`<${LinkSheet} title=${fresh ? 'You’re in. Save your access.' : 'Your private access link'} shareTitle="My private Together access" url=${shareLink('key')} primary="Save or copy my link"
    lede=${`This link signs in as ${data.names[data.seat]}. Save it somewhere private — anyone with it can use the household as you.`}
    footer=${html`<p class="sheet-note">To add someone else, use Invite in Household.</p>`}/>`;
}

export function PreferencesSheet({sheetKey}) {
  const {data} = getState(), prefs = entryPreferences();
  const [category, setCategory] = useState(prefs.category), [split, setSplit] = useState(prefs.split), [error, setError] = useState('');
  const submit = event => {
    event.preventDefault();
    try { setEntryPreferences({category, split}); closeSheet(sheetKey); toast('Expense defaults saved'); }
    catch { setError('This browser could not save preferences. Allow site storage and try again.'); }
  };
  return html`<${Sheet} title="Expense defaults">
    <form id="preferences-form" class="form" onSubmit=${submit}>
      <p class="sheet-lede">How a new expense starts on this device. You can change both on every entry.</p>
      <label class="field"><span>Category</span><select name="category" value=${category} onChange=${e => setCategory(e.currentTarget.value)}>${catalogValues(data, 'categories').map(c => html`<option value=${c}>${c}</option>`)}</select></label>
      <label class="field"><span>Split</span><select name="split" value=${split} onChange=${e => setSplit(e.currentTarget.value)}><option value="half">Split equally</option><option value="a">All on ${coupleName(data.names, 'a')}</option><option value="b">All on ${coupleName(data.names, 'b')}</option></select></label>
      ${error && html`<p class="form-error" role="alert">${error}</p>`}
      <button type="submit" class="btn btn-primary btn-block">Save defaults</button>
    </form>
  <//>`;
}

// ───────── Payments ─────────
export function PaymentsList({records}) {
  const {data} = useStore('data');
  if (!records.length) return html`<div class="card card-pad"><${Empty} emoji="🤝" title="No payments recorded yet" text="When a sheet is settled, the payment appears here."/></div>`;
  return html`<div class="stack">${records.map(r => {
    const names = r.names || data.names, payer = r.net > 0 ? 'b' : 'a', receiver = otherCouple(payer);
    const sheet = data.sheets.find(s => s.id === r.sheet);
    return html`<article class=${cx('card', 'payment', r.reversed && 'is-reversed')}>
      <div class="payment-head">
        <span class="payment-icon" aria-hidden="true">${r.reversed ? '↩️' : '🤝'}</span>
        <span class="payment-text"><strong>${r.net ? `${coupleName(names, payer)} → ${coupleName(names, receiver)}` : 'Balanced expenses closed'}</strong>
          <small>${sheet?.name || 'Sheet'} · ${stamp(r.date)} · ${plural(r.count, 'expense')}</small>
          <small>Recorded by ${names[r.by] || 'Household member'}</small></span>
        <b class="payment-amount">${money(Math.abs(r.net))}</b>
      </div>
      ${r.reversed ? html`<p class="payment-note">Reversed by ${data.names[r.reversed.by]} · ${stamp(r.reversed.date)}<br/>“${r.reversed.reason}”</p>`
        : r.by === data.seat && html`<button type="button" class="link link-danger" data-reverse-settlement=${r.id} onClick=${() => present('reverse', {id: r.id})}>Reverse this payment</button>`}
    </article>`;
  })}</div>`;
}

export function PaymentsSheet() {
  const {data} = useStore('data');
  return html`<${Sheet} title="Payment history" size="large"><${PaymentsList} records=${data.settlements}/><//>`;
}

export function ReverseSheet({sheetKey, id}) {
  const {data} = getState(), r = data.settlements.find(x => x.id === id);
  const [reason, setReason] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  if (!r) return '';
  const submit = async event => {
    event.preventDefault();
    if (!reason.trim()) return setError('Add a short reason for the record.');
    setBusy(true);
    try { await save({action: 'settlement-reverse', id, reason: reason.trim()}); closeSheet(sheetKey); toast('Payment reversed · expenses reopened'); }
    catch (e) { setError(e.message); setBusy(false); }
  };
  return html`<${Sheet} title="Reverse payment">
    <form id="reverse-settlement-form" class="form" onSubmit=${submit}>
      <p class="sheet-lede">This reopens the ${plural(r.count, 'linked expense')} and the sheet. The original payment and your reason stay in the history. No money moves.</p>
      <label class="field"><span>Reason</span><textarea name="reason" rows="3" maxlength="300" required placeholder="e.g. Recorded before the transfer arrived" value=${reason} onInput=${e => setReason(e.currentTarget.value)}></textarea></label>
      ${error && html`<p class="form-error" role="alert">${error}</p>`}
      <button type="submit" class="btn btn-danger btn-block" disabled=${busy}>Reverse payment</button>
    </form>
  <//>`;
}
