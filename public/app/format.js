// Presentation helpers shared by every screen. Pure functions only.

const currency = new Intl.NumberFormat('en-AU', {style: 'currency', currency: 'AUD'});
export const money = cents => currency.format((cents || 0) / 100);

/** Splits $1,234.56 into parts so large figures can set the cents smaller. */
export function moneyParts(cents) {
  const text = money(Math.abs(cents));
  const [whole, dec = '00'] = text.replace('$', '').split('.');
  return {text: (cents < 0 ? '−' : '') + text, whole, dec};
}

export const pad = n => String(n).padStart(2, '0');
export const isoDate = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => isoDate(new Date());
const at = iso => new Date(iso + 'T12:00:00');
export const addDays = (iso, days) => { const d = at(iso); d.setDate(d.getDate() + days); return isoDate(d); };
export const daysBetween = (from, to) => Math.round((at(to) - at(from)) / 86400000);

// Date formatters are built once and labels are cached per date: building a
// formatter on every call (toLocaleDateString with options) is very slow in Safari.
const dateFormats = new Map();
function formatDate(name, options, date) {
  let format = dateFormats.get(name);
  if (!format) dateFormats.set(name, format = new Intl.DateTimeFormat('en-AU', options));
  return format.format(date);
}
function cached(fn) {
  const cache = new Map();
  return iso => {
    let label = cache.get(iso);
    if (label === undefined) {
      if (cache.size > 4000) cache.clear();
      cache.set(iso, label = fn(iso));
    }
    return label;
  };
}
export const shortDate = cached(iso => formatDate('short', {day: 'numeric', month: 'short'}, at(iso)));
export const longDate = cached(iso => formatDate('long', {day: 'numeric', month: 'short', year: 'numeric'}, at(iso)));
let labelsFor = '', labels = new Map();
export function dayLabel(iso) {
  const now = today();
  if (now !== labelsFor) { labelsFor = now; labels = new Map(); }
  let label = labels.get(iso);
  if (label === undefined) labels.set(iso, label = describeDay(iso, now));
  return label;
}
function describeDay(iso, now) {
  if (iso === now) return 'Today';
  if (iso === addDays(now, -1)) return 'Yesterday';
  const diff = daysBetween(iso, now);
  if (diff > 0 && diff < 7) return formatDate('weekday', {weekday: 'long'}, at(iso));
  return iso.slice(0, 4) === now.slice(0, 4)
    ? formatDate('day', {weekday: 'short', day: 'numeric', month: 'short'}, at(iso))
    : formatDate('day-year', {weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'}, at(iso));
}
export const rangeLabel = sheet => sheet ? `${shortDate(sheet.start)} – ${sheet.end ? longDate(sheet.end) : 'ongoing'}` : '';
export const stamp = cached(iso => formatDate('stamp', {dateStyle: 'medium', timeStyle: 'short'}, new Date(iso)));
/** Today's date as digits, e.g. 17/10/2026. */
export const numericToday = () => formatDate('numeric', {}, new Date());
/** Sorts names the way people expect (case- and accent-aware) without a collator per comparison. */
export const byName = new Intl.Collator('en-AU').compare;

export function greeting(date = new Date()) {
  const h = date.getHours();
  return h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

/** How far through a sheet's period today is. */
export function periodProgress(sheet, now = today()) {
  if (!sheet?.start) return null;
  const day = Math.max(1, daysBetween(sheet.start, now) + 1);
  if (!sheet.end) return {day, total: null, pct: null, left: null};
  const total = Math.max(1, daysBetween(sheet.start, sheet.end) + 1);
  return {day: Math.min(day, total), total, pct: Math.min(1, day / total), left: Math.max(0, total - day)};
}

// People and couples. Seats 0–1 are couple a, seats 2–3 couple b.
export const group = seat => seat < 2 ? 'a' : 'b';
export const otherCouple = g => g === 'a' ? 'b' : 'a';
export const members = (names, g) => names.slice(g === 'a' ? 0 : 2, g === 'a' ? 2 : 4);
export const coupleName = (names, g) => members(names, g).join(' & ');
export const coupleSeats = g => g === 'a' ? [0, 1] : [2, 3];
export const initials = name => String(name || '?').trim().split(/\s+/).slice(0, 2).map(p => Array.from(p)[0] || '').join('').toUpperCase() || '?';
export const firstName = name => String(name || '').trim().split(/\s+/)[0];

// Categories read as an emoji and a tone, so lists are scannable at a glance.
const categoryRules = [
  [/holiday|flight|hotel|trip|airbnb/i, '✈️', 'sky'],
  [/grocer|supermarket|market|veg|fruit|meat|butcher/i, '🛒', 'green'],
  [/coffee|cafe|café/i, '☕️', 'brown'],
  [/food|drink|dining|restaurant|takeaway|lunch|dinner|breakfast|eat/i, '🍜', 'orange'],
  [/transport|travel|fuel|petrol|uber|taxi|train|bus|parking|toll|car/i, '🚗', 'blue'],
  [/internet|wifi|phone|mobile|nbn/i, '📶', 'teal'],
  [/rent|mortgage|home|house|strata/i, '🏠', 'amber'],
  [/entertain|movie|cinema|netflix|stream|music|game/i, '🎬', 'purple'],
  [/shop|cloth|fashion|kmart|target/i, '🛍️', 'pink'],
  [/bill|utilit|electric|gas|water|power|energy/i, '⚡️', 'yellow'],
  [/health|medical|pharmac|doctor|dental|chemist/i, '💊', 'red'],
  [/gift|present/i, '🎁', 'rose'],
  [/kid|baby|child|school/i, '🧸', 'sky'],
  [/pet|vet|dog|cat/i, '🐾', 'brown'],
  [/insur/i, '🛡️', 'slate'],
  [/other|misc/i, '📦', 'slate'],
];
export function categoryLook(name) {
  const rule = categoryRules.find(([pattern]) => pattern.test(name || ''));
  return rule ? {emoji: rule[1], tone: rule[2]} : {emoji: '🏷️', tone: 'slate'};
}

/** A stable, pleasant hue for a merchant monogram. */
export function merchantHue(name) {
  let hash = 0;
  for (const char of String(name)) hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  return [12, 28, 145, 165, 200, 222, 255, 280, 330, 350][hash % 10];
}

export const plural = (n, word, many = word + 's') => `${n} ${n === 1 ? word : many}`;
