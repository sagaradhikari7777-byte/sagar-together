import {householdExpense} from './expense-policy.js';

// A part payment pays down a sheet's balance without settling any expenses or
// closing the sheet. It counts until it is reversed or folded into the payment
// that settles the sheet (`closedBy`). Its `net` follows the settlement record:
// positive when couple B paid couple A.
export const isPartPayment = record => record?.kind === 'partial';
export function openPartPayments(settlements = [], sheets) {
  return (settlements || []).filter(r => isPartPayment(r) && !r.reversed && !r.closedBy && (!sheets || sheets.has(r.sheet)));
}
/** The amount moved in a list of part payments, whichever way each went. */
export const partTotal = payments => payments.reduce((sum, r) => sum + r.cents, 0);
/** What a couple has paid (positive) or received (negative) in part payments. */
export const partPaidBy = (payments, couple) => payments.reduce((sum, r) => sum + (couple === 'b' ? r.net : -r.net), 0);
/** What a couple has put in: bills paid plus any part payments they sent. */
export const paidWithParts = overview => overview.paid + Math.max(overview.partPaid || 0, 0);

// Allocation follows the same cent rounding as the settlement engine. Shares
// belong to couples; paying a bill and owing a share are separate quantities.
// Open part payments reduce what is still owed (`net`) but not shares or bills paid.
export function settlementOverview(expenses, couple, {includeSettled = false, payments = []} = {}) {
  const rows = expenses.filter(e => includeSettled || !e.settlement).map(original => {
    const e = householdExpense(original);
    const a = e.split === 'half' ? Math.floor(e.cents / 2) : e.split === 'a' ? e.cents : 0;
    return {...e, share: couple === 'a' ? a : e.cents - a};
  }).sort((a, b) => b.date.localeCompare(a.date));
  const total = rows.reduce((sum, e) => sum + e.cents, 0);
  const share = rows.reduce((sum, e) => sum + e.share, 0);
  const paid = rows.reduce((sum, e) => sum + ((e.payer < 2 ? 'a' : 'b') === couple ? e.cents : 0), 0);
  const partPaid = partPaidBy(payments, couple);
  return {rows, total, share, paid, partPaid, payments, net: share - paid - partPaid};
}

export function householdOverview(data, couple) {
  const sheets = data.sheets.filter(sheet => !sheet.archived);
  const ids = new Set(sheets.map(sheet => sheet.id));
  const expenses = data.expenses.filter(expense => ids.has(expense.sheet));
  const payments = openPartPayments(data.settlements, ids);
  const rows = sheets.map(sheet => ({sheet, ...settlementOverview(expenses.filter(e => e.sheet === sheet.id), couple, {payments: payments.filter(r => r.sheet === sheet.id)})}));
  return {...settlementOverview(expenses, couple, {payments}), expenses, sheets: rows};
}
