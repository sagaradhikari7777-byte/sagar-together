import test from 'node:test';
import assert from 'node:assert/strict';

// The store talks to the network through fetch; each test scripts the replies.
Object.defineProperty(globalThis, 'navigator', {value: {onLine: true}, configurable: true});
const {save, setState, getState, api} = await import('../public/app/store.js');
const household = rev => ({id: 'h', rev, names: ['A', 'B', 'C', 'D'], seat: 0, sheets: [], expenses: [], settlements: [], recurring: [], closesSettledSheets: true});
let replies = [], sent = [];
globalThis.fetch = async (url, options) => {
  sent.push(JSON.parse(options.body));
  const next = replies.shift();
  if (next instanceof Error) throw next;
  return {ok: next.status < 400, status: next.status, json: async () => { if (typeof next.body !== 'object') throw new SyntaxError('Unexpected token'); return next.body; }};
};
function reset(rev = 1) { replies = []; sent = []; setState({data: household(rev), credentials: {house: 'h', key: 'k'.repeat(64)}, demo: false, busy: false}); }

test('a save that is still running never reports a second one as saved', async () => {
  reset();
  setState({busy: true});
  await assert.rejects(save({action: 'sheet', name: 'X', start: '2026-10-01', end: ''}), /Still saving/);
  assert.equal(sent.length, 0);
});

test('a dropped connection explains itself and checks whether the change arrived', async () => {
  reset();
  replies = [new TypeError('Load failed'), {status: 200, body: {data: household(2)}}];
  await assert.rejects(save({action: 'sheet', name: 'X', start: '2026-10-01', end: ''}), err => /Couldn’t reach the household/.test(err.message) && !/Load failed/.test(err.message));
  await new Promise(r => setTimeout(r, 10));
  assert.equal(sent[1]?.action, 'read', 'reloads the household afterwards');
  assert.equal(getState().data.rev, 2);
});

test('a server error page is described in plain words', async () => {
  reset();
  replies = [{status: 502, body: '<html>An error occurred</html>'}];
  await assert.rejects(api({action: 'read'}), err => /had a problem/.test(err.message) && err.status === 502);
});

test('adding something new is applied on top of someone else’s change', async () => {
  reset(1);
  replies = [{status: 409, body: {error: 'New changes arrived. Refresh and try again.'}}, {status: 200, body: {data: household(2)}}, {status: 200, body: {data: household(3)}}];
  await save({action: 'expense', expense: {merchant: 'Shop', cents: 100}});
  assert.deepEqual(sent.map(b => [b.action, b.rev]), [['expense', 1], ['read', 1], ['expense', 2]]);
  assert.equal(getState().data.rev, 3);
});

test('an edit that meets someone else’s change asks for a review instead', async () => {
  reset(1);
  replies = [{status: 409, body: {error: 'New changes arrived. Refresh and try again.'}}, {status: 200, body: {data: household(2)}}];
  await assert.rejects(save({action: 'expense', expense: {id: 'e1', merchant: 'Shop', cents: 100}}), /Review and save again/);
  assert.deepEqual(sent.map(b => b.action), ['expense', 'read'], 'never re-sent automatically');
  assert.equal(getState().data.rev, 2, 'shows the latest household');
});

test('settling up is never retried automatically', async () => {
  reset(1);
  replies = [{status: 409, body: {error: 'New changes arrived.'}}, {status: 200, body: {data: household(2)}}];
  await assert.rejects(save({action: 'settle', sheet: 's1'}), /Review and save again/);
  assert.equal(sent.filter(b => b.action === 'settle').length, 1);
});
