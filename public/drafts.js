const fields = ['merchant', 'amount', 'category', 'date', 'payer', 'split', 'sheet', 'notes'];
export function draftKey(house, seat) { return `together-draft:${house}:${seat}`; }
export function readDraft(storage, key) {
  try {
    const draft = JSON.parse(storage.getItem(key) || 'null');
    if (!draft || draft.version !== 1 || !draft.values || typeof draft.values !== 'object') return null;
    if (typeof draft.receipt !== 'string' || fields.some(field => typeof draft.values[field] !== 'string')) return null;
    return draft;
  } catch { return null; }
}
export function writeDraft(storage, key, draft) {
  const values = Object.fromEntries(fields.map(field => [field, String(draft.values[field] ?? '')]));
  storage.setItem(key, JSON.stringify({version: 1, updated: new Date().toISOString(), expenseId: draft.expenseId || '', values, receipt: draft.receipt || ''}));
}
