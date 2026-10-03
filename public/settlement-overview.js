import {householdExpense} from './expense-policy.js';

// Allocation follows the same cent rounding as the settlement engine. Shares
// belong to couples; paying a bill and owing a share are separate quantities.
export function settlementOverview(expenses, couple, {includeSettled = false} = {}) {
  const rows = expenses.filter(e => includeSettled || !e.settlement).map(original => {
    const e = householdExpense(original);
    const a = e.split === 'half' ? Math.floor(e.cents / 2) : e.split === 'a' ? e.cents : 0;
    return {...e, share: couple === 'a' ? a : e.cents - a};
  }).sort((a, b) => b.date.localeCompare(a.date));
  const total = rows.reduce((sum, e) => sum + e.cents, 0);
  const share = rows.reduce((sum, e) => sum + e.share, 0);
  const paid = rows.reduce((sum, e) => sum + ((e.payer < 2 ? 'a' : 'b') === couple ? e.cents : 0), 0);
  return {rows, total, share, paid, net: share - paid};
}

export function householdOverview(data, couple) {
  const sheets = data.sheets.filter(sheet => !sheet.archived);
  const ids = new Set(sheets.map(sheet => sheet.id));
  const expenses = data.expenses.filter(expense => ids.has(expense.sheet));
  const rows = sheets.map(sheet => ({sheet, ...settlementOverview(expenses.filter(e => e.sheet === sheet.id), couple)}));
  return {...settlementOverview(expenses, couple), expenses, sheets: rows};
}
