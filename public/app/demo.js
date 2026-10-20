// Sample household: local only, never sent to the server. Mutations mirror the
// server rules closely enough that every screen behaves as it would for real.
import {householdExpense, canManageExpenseAs} from '../expense-policy.js';
import {expenseHistory} from '../expense-history.js';
import {changeRecurring} from '../recurring.js';
import {changeCatalog} from '../catalog.js';
import {today, addDays} from './format.js';

const uid = () => crypto.randomUUID();

export function demoHousehold() {
  const now = today(), start = addDays(now, -9), sheet = 'demo-sheet', previous = 'demo-previous';
  const day = n => addDays(now, -n);
  const expense = (merchant, cents, category, payer, split, n, s = sheet) => ({id: uid(), merchant, cents, category, payer, split, visibility: 'shared', creator: payer, date: day(n), sheet: s, notes: '', receipt: '', settlement: null, created: new Date(Date.now() - n * 86400000).toISOString()});
  const settled = [expense('Coles', 9420, 'Groceries', 0, 'half', 20, previous), expense('EnergyAustralia', 21000, 'Bills', 2, 'half', 18, previous)];
  const record = {id: 'demo-settlement', sheet: previous, net: balanceNet(settled), date: new Date(Date.now() - 10 * 86400000).toISOString(), count: 2, by: 2, names: ['Sagar', 'Sushma', 'Nabin', 'Sujata'], expenses: settled.map(e => e.id)};
  settled.forEach(e => e.settlement = record.id);
  return {
    id: 'demo', name: 'Our home', names: ['Sagar', 'Sushma', 'Nabin', 'Sujata'], claimed: [true, true, true, true], seat: 0, rev: 0, closesSettledSheets: true,
    sheets: [
      {id: sheet, name: 'This fortnight', start, end: addDays(start, 13), pinned: true, archived: false},
      {id: previous, name: 'Last fortnight', start: addDays(start, -14), end: addDays(start, -1), pinned: false, archived: true},
    ],
    settlements: [record],
    recurring: [{id: uid(), merchant: 'Rent', cents: 120000, category: 'Rent', payer: 2, split: 'half', nextDue: addDays(now, 3), frequency: 'fortnightly', sheet: '', notes: '', active: true, reminder: true, creator: 2}],
    expenses: [
      expense('Woolworths', 8640, 'Groceries', 0, 'half', 0),
      expense('Hamro nepali pasal', 4235, 'Groceries', 3, 'half', 1),
      expense('EnergyAustralia', 14820, 'Bills', 2, 'half', 2),
      expense('Weekend brunch', 7200, 'Food & Drink', 1, 'half', 3),
      expense('Uber', 2350, 'Transport', 0, 'a', 5),
      expense('Movie', 3600, 'Entertainment', 2, 'half', 7),
      ...settled,
    ],
  };
}

function balanceNet(expenses) {
  let net = 0;
  for (const e of expenses) {
    if (e.settlement) continue;
    const aShare = e.split === 'half' ? Math.floor(e.cents / 2) : e.split === 'a' ? e.cents : 0;
    net += e.payer < 2 ? e.cents - aShare : -aShare;
  }
  return net;
}

export function demoMutation(data, b) {
  const fail = message => { throw new Error(message); };
  const seat = data.seat, canManage = e => canManageExpenseAs(e, seat);
  switch (b.action) {
    case 'recurring': case 'recurring-record': case 'recurring-delete':
      changeRecurring(data, seat, b, {id: uid, record: (expense, link) => { demoMutation(data, {action: 'expense', expense}); data.rev--; data.expenses[0].recurring = link; }});
      break;
    case 'catalog': changeCatalog(data, b); break;
    case 'sheet-edit': Object.assign(data.sheets.find(s => s.id === b.id), {name: b.name, start: b.start, end: b.end}); break;
    case 'sheet-delete':
      if (data.expenses.some(e => e.sheet === b.id && !canManage(e)) || data.settlements.some(r => r.sheet === b.id)) fail('This sheet contains protected records. Archive it instead.');
      data.expenses = data.expenses.filter(e => e.sheet !== b.id); data.sheets = data.sheets.filter(s => s.id !== b.id);
      break;
    case 'expense': {
      const previous = data.expenses.find(e => e.id === b.expense.id);
      if (previous && !canManage(previous)) fail('Only the person who added this expense can edit it.');
      if (!data.sheets.some(s => s.id === b.expense.sheet && !s.archived)) fail('Choose an open sheet.');
      const e = {...householdExpense(b.expense), id: b.expense.id || uid(), creator: previous?.creator ?? seat, created: previous?.created || new Date().toISOString(), settlement: null};
      e.history = expenseHistory(previous, e, seat, data.names);
      if (previous?.recurring) e.recurring = previous.recurring;
      data.expenses = [e, ...data.expenses.filter(x => x.id !== e.id)];
      break;
    }
    case 'delete':
      if (!canManage(data.expenses.find(e => e.id === b.id))) fail('This expense cannot be deleted.');
      data.expenses = data.expenses.filter(x => x.id !== b.id);
      break;
    case 'settings': data.name = b.name; data.names = b.names; break;
    case 'sheet': data.sheets.unshift({id: uid(), name: b.name, start: b.start, end: b.end, pinned: false, archived: false}); break;
    case 'pin': { const was = data.sheets.find(s => s.id === b.id)?.pinned; data.sheets.forEach(s => s.pinned = s.id === b.id && !was); break; }
    case 'archive': {
      const s = data.sheets.find(s => s.id === b.id);
      if (!s.archived && data.expenses.some(e => e.sheet === s.id && !e.settlement)) fail('Settle expenses before archiving.');
      s.archived = !s.archived;
      break;
    }
    case 'settle': {
      const es = data.expenses.filter(e => e.sheet === b.sheet && !e.settlement);
      if (!es.length) fail('No shared expenses to settle.');
      const record = {id: uid(), sheet: b.sheet, net: balanceNet(es), date: new Date().toISOString(), count: es.length, by: seat, names: [...data.names], expenses: es.map(e => e.id)};
      es.forEach(e => e.settlement = record.id);
      data.settlements.unshift(record);
      const sheet = data.sheets.find(s => s.id === b.sheet); if (sheet) sheet.archived = true;
      break;
    }
    case 'settlement-reverse': {
      const r = data.settlements.find(r => r.id === b.id);
      if (!r || r.by !== seat || r.reversed) fail('This settlement cannot be reversed.');
      r.reversed = {by: seat, date: new Date().toISOString(), reason: b.reason};
      data.expenses.filter(e => e.settlement === r.id).forEach(e => e.settlement = null);
      const sheet = data.sheets.find(s => s.id === r.sheet); if (sheet) sheet.archived = false;
      break;
    }
    case 'rotate-invite': break;
    default: fail('Not available in the sample household.');
  }
  data.rev++;
}
