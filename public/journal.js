// Pure journal helpers shared by the interface and regression tests.
export function filterExpenses(items, names, options = {}) {
  const {query = '', status = 'all', payer = '', creator = '', receipt = '', category = '', from = '', to = '', sort = 'newest', sheets = []} = options;
  const sheetNames = new Map(sheets.map(sheet => [sheet.id, sheet.name]));
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean).map(term => /^\$?[\d,]+(?:\.\d{1,2})?$/.test(term) ? term.replace(/[$,]/g, '') : term);
  return items.filter(e => {
    const haystack = [e.merchant, e.category, names[e.payer], Number.isInteger(e.creator) ? names[e.creator] : '', sheetNames.get(e.sheet), e.notes, e.date, (e.cents / 100).toFixed(2)].join(' ').toLowerCase();
    return terms.every(t => haystack.includes(t)) &&
      (status === 'all' || (status === 'open' ? !e.settlement : status === 'settled' && !!e.settlement)) &&
      (payer === '' || e.payer === Number(payer)) && (!category || e.category === category) &&
      (creator === '' || (Number.isInteger(e.creator) && e.creator === Number(creator))) &&
      (!receipt || (receipt === 'with' ? !!e.receipt : receipt === 'without' && !e.receipt)) &&
      (!from || e.date >= from) && (!to || e.date <= to);
  }).sort((a, b) => sort === 'largest' ? b.cents - a.cents : sort === 'smallest' ? a.cents - b.cents : sort === 'oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
}

export function repeatPreset(expense) {
  // A repeat is a new expense. Never carry over IDs, settlement or receipt evidence.
  const {merchant, cents, category, payer, visibility, split, notes} = expense;
  return {merchant, cents, category, payer, visibility, split, notes};
}
