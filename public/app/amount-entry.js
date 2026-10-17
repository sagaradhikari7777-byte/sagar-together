// Keypad amount entry: an expression such as "24×3" typed on the in-app keypad.
// Pure functions, shared by the editor, drafts and tests.
import {calculateAmount} from '../amount-calculator.js';
import {money} from './format.js';

export const operator = /[÷×−+]/;
/** Cents for an amount or expression; 0 when empty, null when it can't be worked out. */
export function centsOf(expr) {
  if (!expr) return 0;
  if (!operator.test(expr)) { if (expr === '.') return 0; const n = Number(expr); return Number.isFinite(n) ? Math.round(n * 100) : null; }
  try { return calculateAmount(expr); } catch { return null; }
}
/** A saved draft's amount for display, e.g. "$72.00" for "24×3". */
export function draftAmount(values) { const cents = centsOf(values?.amount); return cents ? money(cents) : ''; }
/** Applies one keypad key. `fresh` means the next digit replaces the amount. */
export function applyKey(expr, key, fresh) {
  if (key === 'clear') return '';
  if (key === '⌫') return fresh ? '' : expr.slice(0, -1);
  if (operator.test(key)) return expr ? expr.replace(/[÷×−+.]$/, '') + key : expr;
  let next = fresh ? '' : expr;
  const segment = next.split(operator).pop();
  if (key === '.') return segment.includes('.') ? next : next + (segment === '' ? '0.' : '.');
  if (/\.\d\d$/.test(segment) || next.length >= 40) return next;
  return segment === '0' ? next.slice(0, -1) + key : next + key;
}
export const groupThousands = s => s.replace(/^(\d+)/, d => Number(d).toLocaleString('en-AU'));
