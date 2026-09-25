import {householdExpense} from './expense-policy.js';

// Allocation follows the same cent rounding as the settlement engine. Shares
// belong to couples; paying a bill and owing a share are separate quantities.
export function settlementOverview(expenses, couple) {
  const rows = expenses.filter(e => !e.settlement).map(original => {
    const e = householdExpense(original);
    const a = e.split === 'half' ? Math.floor(e.cents / 2) : e.split === 'a' ? e.cents : 0;
    return {...e, share: couple === 'a' ? a : e.cents - a};
  }).sort((a, b) => b.date.localeCompare(a.date));
  const total = rows.reduce((sum, e) => sum + e.cents, 0);
  const share = rows.reduce((sum, e) => sum + e.share, 0);
  const paid = rows.reduce((sum, e) => sum + ((e.payer < 2 ? 'a' : 'b') === couple ? e.cents : 0), 0);
  return {rows, total, share, paid, net: share - paid};
}
