import test from 'node:test';
import assert from 'node:assert/strict';
import {createHouse, mutate, balance} from '../lib/model.js';
import {settlementOverview, householdOverview, openPartPayments} from '../public/settlement-overview.js';
import {demoHousehold, demoMutation} from '../public/app/demo.js';

const setup = () => createHouse({name: 'Our home', names: ['Sagar', 'Sushma', 'Nabin', 'Sujata'], seat: 0}).h;
const exp = (h, patch = {}) => ({merchant: 'Groceries', cents: 10000, category: 'Groceries', payer: 0, visibility: 'shared', split: 'half', date: '2026-10-20', sheet: h.sheets[0].id, notes: '', ...patch});
const sheetNet = (h, couple) => settlementOverview(h.expenses.filter(e => e.sheet === h.sheets[0].id), couple, {payments: openPartPayments(h.settlements, new Set([h.sheets[0].id]))}).net;

test('a part payment lowers the balance and leaves expenses and the sheet open', () => {
  const h = setup(), sheet = h.sheets[0].id;
  mutate(h, 0, {action: 'expense', expense: exp(h)});
  assert.equal(sheetNet(h, 'b'), 5000);
  mutate(h, 2, {action: 'settle-partial', sheet, cents: 2000});
  const r = h.settlements[0];
  assert.equal(r.kind, 'partial'); assert.equal(r.cents, 2000); assert.equal(r.net, 2000, 'couple B paid couple A');
  assert.equal(r.by, 2); assert.deepEqual(r.expenses, []);
  assert.equal(h.expenses[0].settlement, null);
  assert.equal(h.sheets[0].archived, false);
  assert.equal(sheetNet(h, 'b'), 3000); assert.equal(sheetNet(h, 'a'), -3000);
  assert.equal(balance(h.expenses, openPartPayments(h.settlements)).net, 3000, 'server and screens agree');
  const overview = householdOverview(h, 'b');
  assert.equal(overview.net, 3000); assert.equal(overview.sheets[0].net, 3000); assert.equal(overview.share, 5000, 'shares are spending, not payments');
  assert.throws(() => mutate(h, 0, {action: 'archive', id: sheet}), /Settle expenses/);
});

test('part payments must be less than what is owed', () => {
  const h = setup(), sheet = h.sheets[0].id;
  mutate(h, 0, {action: 'expense', expense: exp(h)});
  for (const cents of [0, -5, 12.5, 5000, 6000]) assert.throws(() => mutate(h, 2, {action: 'settle-partial', sheet, cents}));
  mutate(h, 2, {action: 'settle-partial', sheet, cents: 4000});
  assert.throws(() => mutate(h, 2, {action: 'settle-partial', sheet, cents: 1000}), /Settle in full/);
  mutate(h, 2, {action: 'settle-partial', sheet, cents: 999});
  assert.equal(sheetNet(h, 'b'), 1);
});

test('settling in full records what is left and folds the part payments in', () => {
  const h = setup(), sheet = h.sheets[0].id;
  mutate(h, 0, {action: 'expense', expense: exp(h)});
  mutate(h, 2, {action: 'settle-partial', sheet, cents: 2000});
  const part = h.settlements[0];
  mutate(h, 1, {action: 'settle', sheet});
  const full = h.settlements[0];
  assert.equal(full.net, 3000); assert.equal(full.partPaid, 2000); assert.deepEqual(full.partials, [part.id]);
  assert.equal(part.closedBy, full.id);
  assert.equal(h.sheets[0].archived, true);
  assert.equal(h.expenses[0].settlement, full.id);
  // Reopening for a late expense starts again from zero, not from the old part payment.
  mutate(h, 0, {action: 'archive', id: sheet});
  mutate(h, 0, {action: 'expense', expense: exp(h, {cents: 600})});
  assert.equal(sheetNet(h, 'b'), 300);
  // A folded part payment can only change by reversing the full payment first.
  assert.throws(() => mutate(h, 2, {action: 'settlement-reverse', id: part.id, reason: 'Wrong'}), {status: 409});
});

test('reversing a part payment restores the balance; reversing the full payment counts part payments again', () => {
  const h = setup(), sheet = h.sheets[0].id;
  mutate(h, 0, {action: 'expense', expense: exp(h)});
  mutate(h, 2, {action: 'settle-partial', sheet, cents: 1500});
  const first = h.settlements[0];
  assert.throws(() => mutate(h, 0, {action: 'settlement-reverse', id: first.id, reason: 'Not mine'}), {status: 403});
  mutate(h, 2, {action: 'settlement-reverse', id: first.id, reason: 'Transfer bounced'});
  assert.equal(first.reversed.reason, 'Transfer bounced');
  assert.equal(sheetNet(h, 'b'), 5000);
  mutate(h, 2, {action: 'settle-partial', sheet, cents: 2000});
  const second = h.settlements[0];
  mutate(h, 2, {action: 'settle', sheet});
  const full = h.settlements[0];
  mutate(h, 2, {action: 'settlement-reverse', id: full.id, reason: 'Recorded too early'});
  assert.equal(h.sheets[0].archived, false);
  assert.equal(second.closedBy, undefined);
  assert.equal(h.expenses[0].settlement, null);
  assert.equal(sheetNet(h, 'b'), 3000);
});

test('the sample household follows the same part payment rules', () => {
  const data = demoHousehold(), sheet = 'demo-sheet';
  const before = householdOverview(data, 'a').net;
  assert.notEqual(before, 0);
  const owed = Math.abs(before);
  demoMutation(data, {action: 'settle-partial', sheet, cents: 1000});
  assert.equal(Math.abs(householdOverview(data, 'a').net), owed - 1000);
  assert.throws(() => demoMutation(data, {action: 'settle-partial', sheet, cents: owed}));
  demoMutation(data, {action: 'settle', sheet});
  assert.equal(Math.abs(data.settlements[0].net), owed - 1000);
  assert.equal(data.settlements[1].closedBy, data.settlements[0].id);
});

test('the fair-share bar counts part payments as paid and nets them in the bar', async () => {
  const {FairShareBar} = await import('../public/app/ui.js');
  const {settlementOverview} = await import('../public/settlement-overview.js');
  const expenses = [
    {id: 'x', date: '2026-10-20', cents: 70422, payer: 0, split: 'half', sheet: 's'},
    {id: 'y', date: '2026-10-21', cents: 36700, payer: 0, split: 'b', sheet: 's'},
  ];
  const a = settlementOverview(expenses, 'a', {payments: [{kind: 'partial', cents: 30000, net: 30000, sheet: 's'}]});
  assert.equal(a.net, -41911);
  const text = JSON.stringify(FairShareBar({names: ['Sagar', 'Sushma', 'Nabin', 'Sujata'], overview: a}));
  assert.match(text, /\$1,071\.22/);
  assert.match(text, /\$300\.00/);
  const [aw] = text.match(/--w:[\d.]+/).map(w => +w.slice(4)), x = +text.match(/--x:([\d.]+)/)[1];
  assert.ok(Math.abs((aw - x) / 100 * 107122 - 41911) < 1, 'the gap to the tick is what is still owed');
});

test('paid figures count part payments for the couple that sent them, and the sheet card shows them', async () => {
  const {paidWithParts} = await import('../public/settlement-overview.js');
  const expenses = [{id: 'x', date: '2026-10-20', cents: 107122, payer: 0, split: 'half', sheet: 's'}];
  const payments = [{kind: 'partial', cents: 30000, net: 30000, sheet: 's'}];
  const a = settlementOverview(expenses, 'a', {payments}), b = settlementOverview(expenses, 'b', {payments});
  assert.equal(paidWithParts(a), 107122);
  assert.equal(paidWithParts(b), 30000);
  assert.equal(b.net, 53561 - 30000);
  const {readFileSync} = await import('node:fs');
  const sheets = readFileSync(new URL('../public/app/screens/sheets.js', import.meta.url), 'utf8');
  assert.match(sheets, /<small>Part-paid<\/small><b>\$\{money\(partTotal\(o\.payments\)\)\}<\/b>/);
  assert.match(readFileSync(new URL('../public/app/flows/settle.js', import.meta.url), 'utf8'), /<small>Paid<\/small><b>\$\{money\(paidWithParts\(o\)\)\}/);
});
