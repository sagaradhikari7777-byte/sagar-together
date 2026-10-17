import {html, useState, useEffect, useRef} from '../../vendor/preact-htm.js';
import {canManageExpenseAs} from '../../expense-policy.js';
import {catalogValues} from '../../catalog.js';
import {writeDraft} from '../../drafts.js';
import {scanReceipt, parseReceipt} from '../../receipt-scan.js';
import {repeatPreset} from '../../journal.js';
import {useStore, getState, save, toast, entryPreferences, savedDraft, clearDraft, draftsChanged, draftStore, currentDraftKey, loadReceipt} from '../store.js';
import {expenseById, sheetsById, orderedSheets, shortcutMerchants, lastCategory} from '../derive.js';
import {present, replace, closeSheet, guardClose, back} from '../nav.js';
import {Sheet, Icon, Amount, Avatar, CategoryGlyph, MerchantMark, Keypad, Pill, Group, Row, Dot, cx} from '../ui.js';
import {deleteExpense} from '../common.js';
import {operator, centsOf, applyKey, groupThousands, draftAmount} from '../amount-entry.js';
import {money, today, dayLabel, longDate, shortDate, group, coupleName, firstName, stamp} from '../format.js';

// ───────── Entry points ─────────
export function openAddExpense(preset = {}) {
  const {data} = getState();
  if (!data.sheets.some(s => !s.archived)) { toast('Start a sheet first, then add expenses to it.'); return present('sheet-form', {}); }
  if (savedDraft()) return present('draft-choice', {preset});
  present('expense-editor', {preset});
}
export function repeatExpense(id) {
  const e = expenseById(getState().data).get(id);
  if (!e) return toast('That expense no longer exists.');
  present('expense-editor', {preset: {...repeatPreset(e), repeat: true}});
}

// ───────── Editor ─────────
export function ExpenseEditor({sheetKey, id, preset = {}, resume, closing}) {
  const {data, busy} = useStore('data', 'busy');
  const existing = id ? expenseById(data).get(id) : null;
  const openSheets = data.sheets.filter(s => !s.archived);
  const [initial] = useState(() => {
    if (resume) return {values: {...resume.values}, receipt: resume.receipt || ''};
    if (existing) return {values: {merchant: existing.merchant, amount: (existing.cents / 100).toFixed(2), category: existing.category, date: existing.date, payer: String(existing.payer), split: existing.split, sheet: existing.sheet, notes: existing.notes || ''}, receipt: existing.receipt || ''};
    const prefs = entryPreferences();
    const sheet = openSheets.find(s => s.id === preset.sheet) || orderedSheets(data).find(s => !s.archived);
    return {values: {merchant: preset.merchant || '', amount: preset.cents ? (preset.cents / 100).toFixed(2) : '', category: preset.category || prefs.category, date: preset.date || today(), payer: String(preset.payer ?? data.seat), split: preset.split || prefs.split, sheet: sheet?.id || '', notes: preset.notes || ''}, receipt: ''};
  });
  const [v, setV] = useState(initial.values), [receipt, setReceipt] = useState(initial.receipt);
  const [fresh, setFresh] = useState(!!(existing || preset.cents || resume?.values.amount));
  const [error, setError] = useState(''), [duplicate, setDuplicate] = useState(''), [prompt, setPrompt] = useState(false);
  const [draftNote, setDraftNote] = useState(resume ? 'Recovered draft · check it before saving' : '');
  const [receiptBusy, setReceiptBusy] = useState(false);
  const snapshot = (values, r) => JSON.stringify([values, r]);
  const original = useRef(snapshot(initial.values, initial.receipt));
  const latest = useRef({}); latest.current = {v, receipt};
  // Once saved, discarded or closing, this form never writes a draft again.
  const ended = useRef(false); if (closing) ended.current = true;
  const changed = () => !ended.current && (!!resume || snapshot(latest.current.v, latest.current.receipt) !== original.current);
  const set = patch => { setV(cur => ({...cur, ...patch})); setError(''); setDuplicate(''); };

  // Keep an unsaved entry on this device so nothing is lost if the app closes.
  const persist = () => {
    if (ended.current || !changed()) return true;
    const draft = {expenseId: id, values: latest.current.v, receipt: latest.current.receipt};
    try { writeDraft(draftStore(), currentDraftKey(), draft); setDraftNote('Draft saved on this device'); return true; }
    catch {
      try { writeDraft(draftStore(), currentDraftKey(), {...draft, receipt: draft.receipt.startsWith('data:') ? '' : draft.receipt}); setDraftNote('Draft saved · attach the receipt again when you come back'); return true; }
      catch { setDraftNote('This browser couldn’t save a draft'); return false; }
    }
  };
  useEffect(() => { const t = setTimeout(() => { if (changed()) persist(); }, 250); return () => clearTimeout(t); }, [v, receipt]);
  // Home's unfinished-expense banner looks again once this form closes.
  useEffect(() => { if (closing) draftsChanged(); }, [closing]);
  useEffect(() => () => draftsChanged(), []);
  useEffect(() => {
    const flush = () => { if (changed()) persist(); };
    addEventListener('pagehide', flush); document.addEventListener('visibilitychange', flush);
    return () => { removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', flush); };
  }, []);
  useEffect(() => guardClose(sheetKey, () => {
    if (getState().busy || receiptBusy) return false;
    if (!changed()) { ended.current = true; return true; }
    persist(); setPrompt(true); return false;
  }), [receiptBusy]);

  const press = key => { setV(cur => ({...cur, amount: applyKey(cur.amount, key, fresh)})); setFresh(false); setError(''); setDuplicate(''); };
  const cents = centsOf(v.amount), isExpr = operator.test(v.amount);
  const shortcuts = existing ? [] : shortcutMerchants(data, data.seat).filter(m => m !== v.merchant);
  const pickMerchant = name => {
    const patch = {merchant: name};
    if (!existing) {
      const last = lastCategory(data, data.seat, name);
      if (last && catalogValues(data, 'categories').includes(last)) patch.category = last;
    }
    set(patch);
  };

  const submit = async () => {
    if (busy || receiptBusy) return;
    if (!v.merchant) return setError('Choose a merchant.');
    if (cents === null) return setError('Check the calculation.');
    if (!cents) return setError('Enter an amount.');
    if (cents > 999999999) return setError('Enter an amount from $0.01 to $9,999,999.99.');
    if (!v.sheet) return setError('Choose an open sheet.');
    const key = JSON.stringify([v.merchant.toLowerCase(), cents, v.date, v.payer, v.sheet]);
    if (!existing && duplicate !== key && data.expenses.some(e => e.merchant.toLowerCase() === v.merchant.toLowerCase() && e.cents === cents && e.date === v.date && e.payer === Number(v.payer) && e.sheet === v.sheet)) {
      setDuplicate(key); return;
    }
    persist();
    try {
      await save({action: 'expense', expense: {id: existing?.id, creator: existing?.creator, merchant: v.merchant, cents, category: v.category, date: v.date, payer: Number(v.payer), visibility: 'shared', split: v.split, sheet: v.sheet, notes: v.notes, receipt}});
      ended.current = true; clearDraft(); closeSheet(sheetKey); toast(existing ? 'Changes saved' : 'Expense saved');
    } catch (e) { setError(e.message); }
  };

  // Hardware keyboards type straight into the amount.
  useEffect(() => {
    const onKey = event => {
      const nav = getState().nav.sheets, top = nav[nav.length - 1];
      if (top?.key !== sheetKey || event.target.closest('input,textarea,select') || event.metaKey || event.ctrlKey || event.altKey) return;
      const map = {'*': '×', x: '×', '/': '÷', '-': '−', '+': '+', ',': '.', '.': '.', Backspace: '⌫'};
      const key = /^\d$/.test(event.key) ? event.key : map[event.key];
      if (key) { event.preventDefault(); press(key); }
      else if (event.key === 'Enter') { event.preventDefault(); submit(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  const title = existing ? 'Edit expense' : preset.repeat ? 'Repeat expense' : 'New expense';
  const sheet = data.sheets.find(s => s.id === v.sheet);
  const aShare = cents ? (v.split === 'half' ? Math.floor(cents / 2) : v.split === 'a' ? cents : 0) : 0;
  return html`<${Sheet} title=${title} size="full" class="editor" closing=${closing}
    footer=${html`<div class="editor-foot">
      ${existing && html`<button type="button" class="btn btn-danger-quiet" id="delete-expense" onClick=${() => deleteExpense(existing.id)} aria-label="Delete expense"><${Icon} name="trash"/></button>`}
      <button type="button" class="btn btn-primary btn-block btn-large" id="save-expense" onClick=${submit} disabled=${busy || receiptBusy}>${busy ? 'Saving…' : duplicate ? 'Save anyway' : existing ? 'Save changes' : cents ? `Save ${money(cents)}` : 'Save expense'}</button>
    </div>`}>
    ${prompt && html`<div class="prompt" role="alertdialog" aria-labelledby="discard-title">
      <strong id="discard-title">Keep this expense?</strong><p>Your changes haven’t been saved to the household yet.</p>
      <div class="prompt-actions">
        <button type="button" class="btn btn-secondary btn-small" data-keep onClick=${() => setPrompt(false)}>Keep editing</button>
        <button type="button" class="btn btn-secondary btn-small" data-save-draft onClick=${() => { if (persist()) { ended.current = true; closeSheet(sheetKey); } }}>Save draft & close</button>
        <button type="button" class="btn btn-danger-quiet btn-small" data-discard onClick=${() => { ended.current = true; clearDraft(); closeSheet(sheetKey); }}>Discard</button>
      </div>
    </div>`}
    ${preset.repeat && html`<p class="editor-note">A new expense for today. Check the amount, then save.</p>`}
    <div class="amount-entry" aria-live="polite">
      ${isExpr && html`<p class="amount-expr">${v.amount}</p>`}
      <p class=${cx('amount-live', !v.amount && 'is-empty', cents === null && 'is-invalid')}>
        <span class="amount-live-cur">$</span><span id="expense-amount" data-value=${cents ?? ''}>${isExpr ? (cents === null ? '—' : money(cents).slice(1)) : v.amount ? groupThousands(v.amount) : '0'}</span>
      </p>
    </div>
    <button type="button" class=${cx('merchant-field', !v.merchant && 'is-empty')} name="merchant" data-pick="merchants" onClick=${() => present('catalog', {kind: 'merchants', selected: v.merchant, onPick: pickMerchant})}>
      ${v.merchant ? html`<${MerchantMark} name=${v.merchant}/>` : html`<span class="mark mark-md mark-empty"><${Icon} name="store"/></span>`}
      <span class="merchant-field-text">${v.merchant || 'Where was it?'}</span><${Icon} name="chevron-down"/>
    </button>
    ${shortcuts.length > 0 && html`<div class="rail rail-tight" aria-label="Your frequent merchants">${shortcuts.map(m => html`<button type="button" class="chip" data-quick-merchant=${m} onClick=${() => pickMerchant(m)}>${m}</button>`)}</div>`}
    <div class="detail-chips">
      <button type="button" class="chip chip-detail" data-pick="categories" onClick=${() => present('catalog', {kind: 'categories', selected: v.category, onPick: category => set({category})})}><${CategoryGlyph} name=${v.category} size="xs"/>${v.category}</button>
      <label class="chip chip-detail chip-date"><${Icon} name="calendar"/>${v.date === today() ? 'Today' : dayLabel(v.date)}
        <input type="date" name="date" value=${v.date} required onClick=${e => { try { e.currentTarget.showPicker?.(); } catch {} }} onInput=${e => e.currentTarget.value && set({date: e.currentTarget.value})} aria-label="Date"/></label>
      <button type="button" class="chip chip-detail" data-pick="payer" onClick=${() => present('payer', {value: Number(v.payer), onPick: p => set({payer: String(p)})})}><${Avatar} name=${data.names[v.payer]} seat=${Number(v.payer)} size="xs"/>${Number(v.payer) === data.seat ? 'You paid' : firstName(data.names[v.payer]) + ' paid'}</button>
      <button type="button" class="chip chip-detail" data-pick="split" onClick=${() => present('split', {value: v.split, cents, onPick: split => set({split})})}><${Icon} name="pie"/>${v.split === 'half' ? 'Split 50/50' : v.split === group(data.seat) ? 'All ours' : 'All theirs'}</button>
      ${openSheets.length > 1 && html`<button type="button" class="chip chip-detail" data-pick="sheet" onClick=${() => present('sheet-chooser', {value: v.sheet, onPick: s => set({sheet: s})})}><${Icon} name="folder"/>${sheet?.name || 'Choose sheet'}</button>`}
      <button type="button" class=${cx('chip chip-detail', v.notes && 'is-set')} data-pick="notes" onClick=${() => present('note', {value: v.notes, onDone: notes => set({notes})})}><${Icon} name="note"/>${v.notes ? 'Note' : 'Add note'}</button>
      <${ReceiptChip} receipt=${receipt} setReceipt=${r => { setReceipt(r); setError(''); }} setBusy=${setReceiptBusy} setError=${setError}/>
    </div>
    ${v.notes && html`<p class="editor-notes" onClick=${() => present('note', {value: v.notes, onDone: notes => set({notes})})}>“${v.notes}”</p>`}
    <div class="split-preview" id="split-preview" aria-label="Split preview">
      <div class="split-bar" aria-hidden="true"><i class="couple-a" style=${`--w:${v.split === 'half' ? 50 : v.split === 'a' ? 100 : 0}%`}></i><i class="couple-b" style=${`--w:${v.split === 'half' ? 50 : v.split === 'b' ? 100 : 0}%`}></i></div>
      <span><${Dot} couple="a"/>${coupleName(data.names, 'a')} <b>${money(aShare)}</b></span>
      <span><${Dot} couple="b"/>${coupleName(data.names, 'b')} <b>${money((cents || 0) - aShare)}</b></span>
    </div>
    ${receipt && html`<${ReceiptPanel} expense=${existing} receipt=${receipt} onRemove=${() => setReceipt('')} onApply=${patch => { if (patch.merchant) pickMerchant(patch.merchant); set({...(patch.amount ? {amount: patch.amount} : {}), ...(patch.date ? {date: patch.date} : {})}); setFresh(false); }}/>`}
    ${draftNote && html`<p class="draft-status" role="status">${draftNote}</p>`}
    ${duplicate && html`<p class="notice" role="alert">A matching expense already exists for this person, date and sheet. Save again only if it’s a separate purchase.</p>`}
    ${error && html`<p class="form-error" role="alert">${error}</p>`}
    <${Keypad} onKey=${press}/>
    ${existing && html`<button type="button" class="link link-center" id="view-expense-history" onClick=${() => present('expense-history', {id: existing.id})}>View change history</button>`}
  <//>`;
}

// ───────── Receipts ─────────
export async function compressImage(file) {
  if (file.size > 20000000) throw new Error('Choose a receipt under 20 MB.');
  const url = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = url; await img.decode();
    const scale = Math.min(1, 1300 / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale); canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const q of [.8, .65, .5, .35]) { const out = canvas.toDataURL('image/jpeg', q); if (out.length < 390000) return out; }
    throw new Error('Receipt is too detailed. Try cropping the image.');
  } catch (e) { throw new Error(e.message.includes('Receipt') ? e.message : 'This image couldn’t be opened. Try a screenshot or JPEG.'); }
  finally { URL.revokeObjectURL(url); }
}

function ReceiptChip({receipt, setReceipt, setBusy, setError}) {
  const input = useRef();
  const onChange = async event => {
    const file = event.currentTarget.files[0]; if (!file) return;
    setBusy(true);
    try { setReceipt(await compressImage(file)); } catch (e) { setError(e.message); } finally { setBusy(false); event.target.value = ''; }
  };
  return html`<button type="button" class=${cx('chip chip-detail', receipt && 'is-set')} id="choose-receipt" onClick=${() => input.current.click()}><${Icon} name="paperclip"/>${receipt ? 'Replace receipt' : 'Receipt'}</button>
    <input type="file" id="receipt-file" accept="image/*" hidden ref=${input} onChange=${onChange}/>`;
}

function ReceiptPanel({expense, receipt, onRemove, onApply}) {
  const {data} = getState();
  const [image, setImage] = useState(receipt.startsWith('data:') ? receipt : ''), [status, setStatus] = useState(''), [review, setReview] = useState(null);
  const job = useRef(null), [scanning, setScanning] = useState(false);
  useEffect(() => { setImage(receipt.startsWith('data:') ? receipt : ''); setReview(null); setStatus(''); }, [receipt]);
  useEffect(() => () => job.current?.cancel(), []);
  const show = async () => { setStatus('Opening receipt…'); try { setImage(await loadReceipt({...expense, receipt})); setStatus(''); } catch (e) { setStatus(e.message); } };
  const scan = async () => {
    if (scanning) { job.current?.cancel(); setScanning(false); setStatus(''); return; }
    setScanning(true); setReview(null); setStatus('Preparing scanner · first use may take a moment');
    try {
      const source = image || await loadReceipt({...expense, receipt});
      job.current = scanReceipt(source, message => setStatus(message));
      const result = parseReceipt(await job.current.result, catalogValues(data, 'merchants'), today());
      setStatus(result.merchant || result.cents || result.date ? 'Check the suggestions, then apply the ones you want.' : 'No clear details found. Try a sharper photo or type them in.');
      if (result.merchant || result.cents || result.date) setReview({merchant: result.merchant || '', amount: result.cents ? (result.cents / 100).toFixed(2) : '', date: result.date || '', use: {merchant: !!result.merchant, amount: !!result.cents, date: !!result.date}, ambiguous: result.ambiguousAmount});
    } catch (e) { setStatus(e.message || 'Unable to scan this receipt.'); }
    finally { job.current = null; setScanning(false); }
  };
  const apply = () => {
    const patch = {};
    for (const k of ['merchant', 'amount', 'date']) if (review.use[k]) {
      if (!review[k].trim()) return setStatus('Complete the selected suggestions or untick them.');
      if (k === 'amount' && !/^\d+(\.\d{1,2})?$/.test(review.amount)) return setStatus('Check the suggested amount.');
      patch[k] = review[k].trim();
    }
    onApply(patch); setReview(null); setStatus('Suggestions applied. Review, then save.');
  };
  const field = (k, label, type = 'text') => html`<label class="scan-choice"><input type="checkbox" checked=${review.use[k]} onChange=${e => setReview({...review, use: {...review.use, [k]: e.currentTarget.checked}})}/><span>${label}</span>
    <input type=${type} value=${review[k]} inputmode=${k === 'amount' ? 'decimal' : undefined} onInput=${e => setReview({...review, [k]: e.currentTarget.value})}/></label>`;
  return html`<section class="receipt-panel" id="receipt-preview">
    ${image ? html`<img class="receipt-image" src=${image} alt="Receipt"/>` : html`<button type="button" class="btn btn-secondary btn-small" data-load-receipt onClick=${show}><${Icon} name="eye"/> Show receipt</button>`}
    <div class="receipt-actions">
      <button type="button" class="btn btn-secondary btn-small" id="scan-receipt" onClick=${scan}><${Icon} name="scan"/>${scanning ? 'Cancel scan' : 'Scan details'}</button>
      <button type="button" class="btn btn-danger-quiet btn-small" id="remove-receipt" onClick=${() => { job.current?.cancel(); onRemove(); }}>Remove</button>
    </div>
    ${status && html`<p class="receipt-status" id="scan-status" role="status">${status}</p>`}
    ${review && html`<div class="scan-review" id="scan-review">
      <strong>Scanned details</strong>${review.ambiguous && html`<p class="form-hint">Several totals were found — check the amount.</p>`}
      ${field('merchant', 'Merchant')}${field('amount', 'Amount')}${field('date', 'Date', 'date')}
      <div class="prompt-actions"><button type="button" class="btn btn-primary btn-small" data-apply-scan onClick=${apply}>Apply selected</button><button type="button" class="btn btn-quiet btn-small" onClick=${() => setReview(null)}>Dismiss</button></div>
    </div>`}
  </section>`;
}

// ───────── Small pickers ─────────
export function NoteSheet({sheetKey, value, onDone}) {
  const [text, setText] = useState(value || '');
  const done = () => { onDone(text.slice(0, 500)); closeSheet(sheetKey); };
  return html`<${Sheet} title="Note" right=${html`<button type="button" class="nav-text nav-text-strong" onClick=${done}>Done</button>`}>
    <textarea class="note-input" name="notes" rows="4" maxlength="500" autofocus placeholder="What was it for?" value=${text} onInput=${e => setText(e.currentTarget.value)}></textarea>
    <p class="form-hint">${text.length}/500</p>
  <//>`;
}

export function PayerSheet({sheetKey, value, onPick}) {
  const {data} = getState();
  return html`<${Sheet} title="Who paid?" class="sheet-compact">
    <div class="choice-list">${data.names.map((name, i) => html`<button type="button" class=${cx('choice', value === i && 'is-selected')} onClick=${() => { onPick(i); closeSheet(sheetKey); }}>
      <${Avatar} name=${name} seat=${i}/><span class="choice-text"><strong>${name}${i === data.seat ? ' (you)' : ''}</strong><small>${coupleName(data.names, group(i))}</small></span>${value === i && html`<${Icon} name="check" class="choice-check"/>`}
    </button>`)}</div>
  <//>`;
}

export function SplitSheet({sheetKey, value, cents, onPick}) {
  const {data} = getState(), amount = cents || 0;
  const options = [
    {value: 'half', title: 'Split equally', text: 'Each couple pays half', a: Math.floor(amount / 2)},
    {value: 'a', title: `All on ${coupleName(data.names, 'a')}`, text: 'Only this couple’s cost', a: amount},
    {value: 'b', title: `All on ${coupleName(data.names, 'b')}`, text: 'Only this couple’s cost', a: 0},
  ];
  return html`<${Sheet} title="How is it shared?" class="sheet-compact">
    <div class="choice-list">${options.map(o => html`<button type="button" class=${cx('choice', 'choice-split', value === o.value && 'is-selected')} onClick=${() => { onPick(o.value); closeSheet(sheetKey); }}>
      <span class="choice-text"><strong>${o.title}</strong><small>${o.text}</small>
        <span class="split-bar split-bar-sm" aria-hidden="true"><i class="couple-a" style=${`--w:${o.value === 'half' ? 50 : o.value === 'a' ? 100 : 0}%`}></i><i class="couple-b" style=${`--w:${o.value === 'half' ? 50 : o.value === 'b' ? 100 : 0}%`}></i></span>
        ${amount > 0 && html`<small class="choice-figures"><span><${Dot} couple="a"/>${money(o.a)}</span><span><${Dot} couple="b"/>${money(amount - o.a)}</span></small>`}</span>
      ${value === o.value && html`<${Icon} name="check" class="choice-check"/>`}
    </button>`)}</div>
  <//>`;
}

export function SheetChooser({sheetKey, value, onPick}) {
  const {data} = getState();
  return html`<${Sheet} title="Which sheet?" class="sheet-compact">
    <div class="choice-list">${data.sheets.filter(s => !s.archived).map(s => html`<button type="button" class=${cx('choice', value === s.id && 'is-selected')} onClick=${() => { onPick(s.id); closeSheet(sheetKey); }}>
      <span class="choice-emoji" aria-hidden="true">${s.pinned ? '📌' : '🗂️'}</span><span class="choice-text"><strong>${s.name}</strong><small>${shortDate(s.start)}${s.end ? ' – ' + shortDate(s.end) : ' · ongoing'}</small></span>${value === s.id && html`<${Icon} name="check" class="choice-check"/>`}
    </button>`)}</div>
  <//>`;
}

export function DraftChoice({sheetKey, preset}) {
  const {data} = getState(), draft = savedDraft();
  if (!draft) { setTimeout(() => replace('expense-editor', {preset})); return ''; }
  const e = draft.expenseId ? expenseById(data).get(draft.expenseId) : null;
  const canResume = (!draft.expenseId || (e && canManageExpenseAs(e, data.seat))) && !data.sheets.find(s => s.id === draft.values.sheet)?.archived;
  return html`<${Sheet} title="Unfinished expense" class="sheet-compact">
    <div class="draft-card"><span aria-hidden="true">✍️</span><span><strong>${draft.values.merchant || 'New expense'}</strong><small>${draftAmount(draft.values) ? draftAmount(draft.values) + ' · ' : ''}saved on this device</small></span></div>
    <p class="sheet-lede">${canResume ? 'Pick up where you left off, or start a new expense.' : 'This draft belongs to an expense that was removed, settled or archived. Discard it to start again.'}</p>
    <div class="stack">
      ${canResume && html`<button type="button" class="btn btn-primary btn-block" id="resume-draft" onClick=${() => replace('expense-editor', {id: draft.expenseId || undefined, resume: draft})}>Resume</button>`}
      <button type="button" class="btn btn-secondary btn-block" id="fresh-expense" onClick=${() => { clearDraft(); replace('expense-editor', {preset}); }}>${canResume ? 'Start fresh' : 'Discard draft'}</button>
    </div>
  <//>`;
}

// ───────── Details ─────────
export function ExpenseDetail({id}) {
  const {data} = useStore('data'), e = expenseById(data).get(id);
  const [image, setImage] = useState(''), [status, setStatus] = useState('');
  if (!e) return html`<${Sheet} title="Expense" class="sheet-compact"><p class="sheet-lede">This expense was removed.</p><//>`;
  const sheet = data.sheets.find(s => s.id === e.sheet), archived = sheet?.archived;
  const manageable = canManageExpenseAs(e, data.seat), editable = manageable && !archived;
  const reason = e.settlement ? 'Settled and locked. Reverse the payment to change it.' : !manageable ? `Only ${Number.isInteger(e.creator) ? firstName(data.names[e.creator]) : 'the person who added it'} can edit or delete this expense.` : archived ? 'Reopen the sheet to edit this expense.' : '';
  const aShare = e.split === 'half' ? Math.floor(e.cents / 2) : e.split === 'a' ? e.cents : 0;
  const show = async () => { setStatus('Opening receipt…'); try { setImage(await loadReceipt(e)); setStatus(''); } catch (err) { setStatus(err.message); } };
  return html`<${Sheet} title=${e.merchant} size="large">
    <div class="detail-hero">
      <${CategoryGlyph} name=${e.category} size="xl"/>
      <${Amount} cents=${e.cents} class="amount-xl"/>
      <p>${e.category} · ${dayLabel(e.date)}</p>
      ${e.settlement && html`<${Pill} tone="positive"><${Icon} name="check"/> Settled<//>`}
    </div>
    <${Group}>
      <${Row} lead=${html`<${Avatar} name=${data.names[e.payer]} seat=${e.payer} size="sm"/>`} title="Paid by" value=${data.names[e.payer] + (e.payer === data.seat ? ' (you)' : '')}/>
      <div class="row row-split"><span class="row-icon"><${Icon} name="pie"/></span><span class="row-text"><span class="row-title">${e.split === 'half' ? 'Split equally' : `All on ${coupleName(data.names, e.split)}`}</span>
        <span class="split-figures"><span><${Dot} couple="a"/>${money(aShare)}</span><span><${Dot} couple="b"/>${money(e.cents - aShare)}</span></span></span></div>
      <${Row} icon="folder" title="Sheet" value=${sheet?.name || 'Previous sheet'}/>
      <${Row} icon="calendar" title="Date" value=${longDate(e.date)}/>
      <${Row} icon="user" title="Added by" value=${Number.isInteger(e.creator) ? data.names[e.creator] : 'Unknown'}/>
      ${e.notes && html`<${Row} icon="note" title=${e.notes}/>`}
    <//>
    ${e.receipt && html`<section class="receipt-panel" id="view-receipt">${image ? html`<img class="receipt-image" src=${image} alt="Receipt"/>` : html`<button type="button" class="btn btn-secondary btn-small" data-load-receipt onClick=${show}><${Icon} name="paperclip"/> Show receipt</button>`}${status && html`<p class="receipt-status" role="status">${status}</p>`}</section>`}
    ${reason && html`<p class="sheet-note">${reason}</p>`}
    <div class="stack">
      ${editable && html`<button type="button" class="btn btn-primary btn-block" id="expense-option-edit" onClick=${() => present('expense-editor', {id})}><${Icon} name="edit"/> Edit</button>`}
      <div class="btn-pair">
        <button type="button" class="btn btn-secondary" id="expense-option-repeat" onClick=${() => repeatExpense(id)}><${Icon} name="repeat"/> Repeat today</button>
        <button type="button" class="btn btn-secondary" id="view-expense-history" onClick=${() => present('expense-history', {id})}><${Icon} name="history"/> History</button>
      </div>
      ${manageable && html`<button type="button" class="btn btn-danger-quiet btn-block" id="expense-option-delete" onClick=${() => deleteExpense(id)}><${Icon} name="trash"/> Delete expense</button>`}
    </div>
  <//>`;
}

export function ExpenseHistory({id}) {
  const {data} = getState(), e = expenseById(data).get(id);
  if (!e) return '';
  const events = e.history?.length ? e.history : [{action: 'created', date: e.created, by: e.creator, name: Number.isInteger(e.creator) ? data.names[e.creator] : '', changes: []}];
  const label = {merchant: 'Merchant', cents: 'Amount', category: 'Category', date: 'Date', payer: 'Paid by', split: 'Split', sheet: 'Sheet', notes: 'Note', receipt: 'Receipt'};
  const value = (field, v, event) => field === 'cents' ? money(v) : field === 'payer' ? (event.names || data.names)[v] : field === 'split' ? (v === 'half' ? 'Equal split' : coupleName(data.names, v)) : field === 'sheet' ? (data.sheets.find(s => s.id === v)?.name || 'Previous sheet') : field === 'receipt' ? (v ? 'Attached' : 'None') : v || 'None';
  return html`<${Sheet} title="Change history" size="large">
    <p class="sheet-lede">${e.merchant} · ${money(e.cents)}</p>
    <ol class="timeline">${[...events].reverse().map(event => html`<li>
      <strong>${event.action === 'created' ? 'Added' : 'Edited'} by ${event.name || data.names[event.by] || 'someone'}</strong>
      <time>${event.date ? stamp(event.date) : 'Date unavailable for this older entry'}</time>
      ${event.changes?.length > 0 && html`<ul>${event.changes.map(c => html`<li><b>${label[c.field] || c.field}</b> ${c.field === 'receipt' && c.before === c.after ? 'replaced' : html`${value(c.field, c.before, event)} → ${value(c.field, c.after, event)}`}</li>`)}</ul>`}
    </li>`)}</ol>
  <//>`;
}
