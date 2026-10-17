import {settlementOverview} from '../../settlement-overview.js';
import {getState, toast} from '../store.js';
import {today, coupleName, money} from '../format.js';

const author = (e, names) => Number.isInteger(e.creator) ? names[e.creator] : 'Original author unavailable';
const shareLabel = (e, names) => (e.split === 'half' ? '50 / 50' : coupleName(names, e.split) + ' · 100%') + (e.settlement ? ' · Settled' : '');

/** CSV of the given expenses. Formula-leading text is escaped for spreadsheets. */
export function exportCSV(items = getState().data.expenses) {
  const {data} = getState();
  const cell = v => '"' + String(v ?? '').replace(/^\s*[=+@-]/, "'$&").replaceAll('"', '""') + '"';
  const rows = [['Date', 'Merchant', 'AUD', 'Category', 'Paid by', 'Added by', 'Split', 'Sheet', 'Settled', 'Notes'],
    ...items.map(e => [e.date, e.merchant, (e.cents / 100).toFixed(2), e.category, data.names[e.payer], author(e, data.names), shareLabel(e, data.names), data.sheets.find(s => s.id === e.sheet)?.name, e.settlement ? 'Yes' : 'No', e.notes])];
  const file = new File(['﻿' + rows.map(row => row.map(cell).join(',')).join('\r\n')], `together-expenses-${today()}.csv`, {type: 'text/csv'});
  if (navigator.canShare?.({files: [file]})) navigator.share({files: [file]}).catch(e => { if (e.name !== 'AbortError') download(file); });
  else download(file);
}
function download(file) {
  const url = URL.createObjectURL(file), a = document.createElement('a');
  a.href = url; a.download = file.name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/** A plain-text settlement note for the household chat. */
export function summaryText(expenses, scopeName) {
  const {data} = getState(), items = expenses.filter(e => !e.settlement);
  const a = settlementOverview(items, 'a'), b = settlementOverview(items, 'b');
  const owing = a.net > 0 ? `${coupleName(data.names, 'a')} owe ${money(a.net)} to ${coupleName(data.names, 'b')}.` : a.net < 0 ? `${coupleName(data.names, 'b')} owe ${money(-a.net)} to ${coupleName(data.names, 'a')}.` : 'Both couples are even.';
  return `Together · ${scopeName}\n${owing}\n${items.length} unsettled expenses · Total ${money(a.total)}\n${coupleName(data.names, 'a')}: share ${money(a.share)} · paid ${money(a.paid)}\n${coupleName(data.names, 'b')}: share ${money(b.share)} · paid ${money(b.paid)}\nAs of ${new Date().toLocaleDateString('en-AU')}. Please check Together for the latest balance.\nThis is a summary, not a payment confirmation.`;
}
export async function shareText(text, title = 'Together') {
  if (navigator.share) {
    try { await navigator.share({title, text}); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  try { await navigator.clipboard.writeText(text); toast('Copied · paste it into your household chat'); }
  catch { toast('Couldn’t copy automatically. Select the text to copy.'); throw new Error('copy failed'); }
}
