// Parse arithmetic without eval. Keep decimal values exact and round only the
// final positive result to cents, using the same limit as ordinary expenses.
export function calculateAmount(expression) {
  const original = String(expression);
  if (/[\d.]\s+[\d.]/.test(original)) throw new Error('Add an operator between amounts.');
  const source = original.replace(/\s/g, '').replace(/[×xX]/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  if (!source) throw new Error('Enter amounts to calculate.');
  if (source.length > 120) throw new Error('Keep the calculation under 120 characters.');
  const tokens = source.match(/\d+(?:\.\d+)?|\.\d+|[()+\-*/]/g) || [];
  if (tokens.join('') !== source) throw new Error('Use numbers and + − × ÷ only.');
  let position = 0;
  const number = token => {
    const [whole, fraction = ''] = token.split('.');
    return {n: BigInt((whole || '0') + fraction), d: 10n ** BigInt(fraction.length)};
  };
  const combine = (a, operator, b) => {
    if (operator === '+') return {n: a.n * b.d + b.n * a.d, d: a.d * b.d};
    if (operator === '-') return {n: a.n * b.d - b.n * a.d, d: a.d * b.d};
    if (operator === '*') return {n: a.n * b.n, d: a.d * b.d};
    if (!b.n) throw new Error('Cannot divide by zero.');
    const n = a.n * b.d, d = a.d * b.n;
    return d < 0n ? {n: -n, d: -d} : {n, d};
  };
  const factor = () => {
    const token = tokens[position++];
    if (token === '+' || token === '-') {
      const value = factor();
      return {n: token === '-' ? -value.n : value.n, d: value.d};
    }
    if (token === '(') {
      const value = sum();
      if (tokens[position++] !== ')') throw new Error('Close the brackets to finish the calculation.');
      return value;
    }
    if (!token || !/^[\d.]/.test(token)) throw new Error('Complete the calculation.');
    return number(token);
  };
  const product = () => {
    let value = factor();
    while (['*', '/'].includes(tokens[position])) value = combine(value, tokens[position++], factor());
    return value;
  };
  const sum = () => {
    let value = product();
    while (['+', '-'].includes(tokens[position])) value = combine(value, tokens[position++], product());
    return value;
  };
  const value = sum();
  if (position !== tokens.length) throw new Error('Check the operators and brackets.');
  if (value.n <= 0n) throw new Error('The calculated amount must be positive.');
  const cents = (value.n * 200n + value.d) / (value.d * 2n);
  if (cents < 1n || cents > 999999999n) throw new Error('Enter an amount from $0.01 to $9,999,999.99.');
  return Number(cents);
}

export function bindAmountCalculator(form) {
  const toggle = form.querySelector('#toggle-amount-calculator');
  const panel = form.querySelector('#amount-calculator');
  const expression = form.querySelector('#amount-expression');
  const output = form.querySelector('#amount-calculator-result');
  const apply = form.querySelector('#use-calculated-amount');
  const amount = form.elements.amount;
  const formatter = new Intl.NumberFormat('en-AU', {style: 'currency', currency: 'AUD'});
  let result = null;
  const update = () => {
    try {
      result = calculateAmount(expression.value);
      output.textContent = formatter.format(result / 100);
      output.classList.remove('is-invalid');
    } catch (error) {
      result = null;
      output.textContent = error.message;
      output.classList.add('is-invalid');
    }
    apply.disabled = result === null;
  };
  toggle.onclick = () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) {
      if (!expression.value) expression.value = amount.value;
      update();
      expression.focus({preventScroll: true});
      panel.scrollIntoView({block: 'nearest'});
    }
  };
  expression.addEventListener('input', update);
  expression.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); if (!apply.disabled) apply.click(); }
  });
  panel.querySelectorAll('[data-calc-op]').forEach(button => button.onclick = () => {
    expression.setRangeText(button.dataset.calcOp, expression.selectionStart, expression.selectionEnd, 'end');
    expression.focus({preventScroll: true});
    expression.dispatchEvent(new Event('input', {bubbles: true}));
  });
  apply.onclick = () => {
    update();
    if (result === null) return;
    amount.value = (result / 100).toFixed(2);
    amount.dispatchEvent(new Event('input', {bubbles: true}));
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    amount.focus({preventScroll: true});
  };
}
