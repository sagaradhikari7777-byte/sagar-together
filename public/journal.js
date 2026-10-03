// Pure journal helpers shared by the interface and regression tests.
export function filterExpenses(items, names, options = {}) {
  const {query = '', status = 'all', payer = '', category = '', from = '', to = '', sort = 'newest'} = options;
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter(e => {
    const haystack = [e.merchant, e.category, names[e.payer], e.notes, e.date, (e.cents / 100).toFixed(2)].join(' ').toLowerCase();
    return terms.every(t => haystack.includes(t)) &&
      (status === 'all' || (status === 'open' ? !e.settlement : status === 'settled' && !!e.settlement)) &&
      (payer === '' || e.payer === Number(payer)) && (!category || e.category === category) &&
      (!from || e.date >= from) && (!to || e.date <= to);
  }).sort((a, b) => sort === 'largest' ? b.cents - a.cents : sort === 'smallest' ? a.cents - b.cents : sort === 'oldest' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date));
}

export function repeatPreset(expense) {
  // A repeat is a new expense. Never carry over IDs, settlement or receipt evidence.
  const {merchant, cents, category, payer, visibility, split, notes} = expense;
  return {merchant, cents, category, payer, visibility, split, notes};
}
