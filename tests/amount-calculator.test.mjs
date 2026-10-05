import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateAmount} from '../public/amount-calculator.js';

test('calculator keeps decimal arithmetic exact and rounds only the final total', () => {
  for (const [expression, cents] of [
    ['18.50 + 12.75', 3125], ['0.1 + 0.2', 30], ['0.1 * 3', 30],
    ['1 / 6 * 3', 50], ['1 / 8', 13], ['.005', 1], ['10.075', 1008],
    ['20 − 3 × 2', 1400], ['(20 - 3) ÷ 2', 850], ['2 x 1.50', 300],
    ['100 * (1 - .15)', 8500], ['-2 * -3', 600], ['6 / -2 + 10', 700],
    ['+001.20', 120], ['9999999.99', 999999999]
  ]) assert.equal(calculateAmount(expression), cents, expression);
});

test('calculator rejects incomplete, unsafe and invalid expense amounts', () => {
  for (const expression of ['', '1 +', '1 ** 2', '1 2', '1..2', '(1 + 2', '1 + 2)',
    '2(3)', '1/0', '1/(2-2)', '0', '-1', '.004', '9999999.995',
    '1e3', 'Math.random()', 'alert(1)', '10%', '1'.repeat(121)]) {
    assert.throws(() => calculateAmount(expression), Error, expression);
  }
});
