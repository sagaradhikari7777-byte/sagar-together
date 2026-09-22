// Pure journal helpers shared by the interface and regression tests.
export function calculateAmount(expression) {
  const source = String(expression).replace(/\s/g, '').replace(/[×x]/g, '*').replace(/−/g, '-').replace(/÷/g, '/');
  if (!source || source.length > 120 || /[^\d.+*/()-]/.test(source)) throw new Error('Use numbers, +, −, ×, ÷ and brackets.');
  const tokens = source.match(/\d+(?:\.\d*)?|\.\d+|[()+*/-]/g) || [];
  if (tokens.join('') !== source) throw new Error('Check your calculation.');
  let i = 0;
  function value() {
    if (tokens[i] === '+' || tokens[i] === '-') { const sign = tokens[i++] === '-' ? -1 : 1; return sign * value(); }
    if (tokens[i] === '(') { i++; const n = sum(); if (tokens[i++] !== ')') throw new Error('Close each bracket.'); return n; }
    const token = tokens[i++];
    if (!token || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)) throw new Error('Check your calculation.');
    return Number(token);
  }
  function product() { let n = value(); while (tokens[i] === '*' || tokens[i] === '/') { const op = tokens[i++], next = value(); if (op === '/' && next === 0) throw new Error('Cannot divide by zero.'); n = op === '*' ? n * next : n / next; } return n; }
  function sum() { let n = product(); while (tokens[i] === '+' || tokens[i] === '-') { const op = tokens[i++], next = product(); n = op === '+' ? n + next : n - next; } return n; }
  const result = sum(), cents = Math.round((result + Number.EPSILON) * 100);
  if (i !== tokens.length || !Number.isFinite(result) || cents <= 0 || cents > 999999999) throw new Error('The total must be $0.01 to $9,999,999.99.');
  return cents;
}

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

export function summarizeSpending(items) {
  const categories = new Map(), people = [0, 0, 0, 0];
  let total = 0, equalSplit = 0;
  for (const e of items) { total += e.cents; if (e.split === 'half') equalSplit += e.cents; people[e.payer] += e.cents; categories.set(e.category, (categories.get(e.category) || 0) + e.cents); }
  return {total, equalSplit, coupleAssigned: total - equalSplit, count: items.length, average: items.length ? Math.round(total / items.length) : 0, people, categories: [...categories].sort((a, b) => b[1] - a[1])};
}

export function repeatPreset(expense) {
  // A repeat is a new expense. Never carry over IDs, settlement or receipt evidence.
  const {merchant, cents, category, payer, visibility, split, notes} = expense;
  return {merchant, cents, category, payer, visibility, split, notes};
}

export function frequentMerchants(items, available) {
  const stats = new Map();
  for (const e of [...items].sort((a, b) => b.date.localeCompare(a.date))) {
    if (!available.includes(e.merchant)) continue;
    const entry = stats.get(e.merchant) || {name: e.merchant, count: 0, recent: e};
    entry.count++; stats.set(e.merchant, entry);
  }
  return [...stats.values()].sort((a, b) => b.count - a.count || b.recent.date.localeCompare(a.recent.date)).slice(0, 4);
}
