// Interface kit. Components stay small and stateless where possible; the
// visual language lives in /styles.
import {html, h, Component, useEffect, useLayoutEffect, useRef, useState, createContext, useContext} from '../vendor/preact-htm.js';
import {shapes} from '../icons.js';
import {moneyParts, money, initials, members, coupleName, group, categoryLook, merchantHue} from './format.js';
import {back} from './nav.js';

export const cx = (...parts) => parts.filter(Boolean).join(' ');

/**
 * Skips re-rendering a component when its parent re-renders with the same
 * props. The component still re-renders for its own state, store keys and context.
 */
export function memo(Inner) {
  class Memo extends Component {
    shouldComponentUpdate(next) {
      for (const key in next) if (next[key] !== this.props[key]) return true;
      for (const key in this.props) if (!(key in next)) return true;
      return false;
    }
    render(props) { return h(Inner, props); }
  }
  return Memo;
}

/**
 * Renders a long list a page at a time: the first page right away, the next
 * as the reader scrolls near the end (or taps Show more). `resetKey` starts
 * over, e.g. when a search changes.
 */
export function useIncremental(total, {first = 30, step = 40, resetKey = ''} = {}) {
  const view = useRef({key: resetKey, count: first}), [, grow] = useState(0);
  if (view.current.key !== resetKey) view.current = {key: resetKey, count: first};
  const count = Math.min(view.current.count, total), sentinel = useRef();
  const more = () => { view.current.count += step; grow(n => n + 1); };
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !window.IntersectionObserver) return;
    const io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) more(); }, {root: el.closest('.page-scroll, .sheet-body'), rootMargin: '0px 0px 700px 0px'});
    io.observe(el);
    return () => io.disconnect();
  }, [count, total, resetKey]);
  const footer = count < total
    ? html`<button type="button" class="more" ref=${sentinel} onClick=${more}>Show ${Math.min(step, total - count)} more</button>`
    : null;
  return [count, footer];
}

export const Icon = ({name, class: className = ''}) =>
  html`<svg class=${cx('icon', className)} viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML=${{__html: shapes[name] || shapes.other}}></svg>`;

/** Money with a quiet currency symbol and cents. */
export const Amount = ({cents, class: className = '', sign = false}) => {
  const {text, whole, dec} = moneyParts(cents);
  return html`<span class=${cx('amount', className)}><span class="sr-only">${text}</span><span aria-hidden="true">${sign && cents < 0 ? '−' : ''}<span class="amount-cur">$</span>${whole}<span class="amount-dec">.${dec}</span></span></span>`;
};

export const Avatar = ({name, seat, size = 'md'}) =>
  html`<span class=${cx('avatar', 'avatar-' + size, 'couple-' + group(seat))} aria-hidden="true">${initials(name)}</span>`;

export const CouplePair = ({names, couple, size = 'md'}) =>
  html`<span class=${cx('pair', 'pair-' + size, 'couple-' + couple)} aria-hidden="true">${members(names, couple).map(n => html`<i>${initials(n)}</i>`)}</span>`;

export const Dot = ({seat, couple}) => html`<i class=${cx('dot', 'couple-' + (couple || group(seat)))} aria-hidden="true"></i>`;

export const CategoryGlyph = ({name, size = 'md'}) => {
  const {emoji, tone} = categoryLook(name);
  return html`<span class=${cx('glyph', 'glyph-' + size, 'tone-' + tone)} aria-hidden="true">${emoji}</span>`;
};

export const MerchantMark = ({name, size = 'md'}) =>
  html`<span class=${cx('mark', 'mark-' + size)} style=${`--hue:${merchantHue(name)}`} aria-hidden="true">${initials(name)}</span>`;

export const Pill = ({tone = '', children}) => html`<span class=${cx('pill', tone && 'pill-' + tone)}>${children}</span>`;

export const Empty = ({emoji = '✨', title, text, children}) =>
  html`<div class="empty"><span class="empty-emoji" aria-hidden="true">${emoji}</span><strong>${title}</strong>${text && html`<p>${text}</p>`}${children}</div>`;

// ───────── Lists ─────────
export const Group = ({title, footer, children, class: className = ''}) =>
  html`<section class=${cx('group', className)}>${title && html`<h3 class="group-title">${title}</h3>`}<div class="group-body">${children}</div>${footer && html`<p class="group-footer">${footer}</p>`}</section>`;

export const Row = ({icon, lead, title, subtitle, value, chevron = true, onClick, tone = '', disabled, children}) => {
  const body = html`${lead || (icon && html`<span class=${cx('row-icon', tone && 'row-icon-' + tone)}><${Icon} name=${icon}/></span>`)}<span class="row-text"><span class="row-title">${title}</span>${subtitle && html`<span class="row-subtitle">${subtitle}</span>`}</span>${value !== undefined && html`<span class="row-value">${value}</span>`}${children}${onClick && chevron && html`<${Icon} name="chevron" class="row-chevron"/>`}`;
  return onClick
    ? html`<button type="button" class=${cx('row', tone && 'row-' + tone)} onClick=${onClick} disabled=${disabled}>${body}</button>`
    : html`<div class="row">${body}</div>`;
};

export function Segmented({options, value, onChange, label, class: className = ''}) {
  const index = Math.max(0, options.findIndex(o => o.value === value));
  return html`<div class=${cx('segmented', className)} role="radiogroup" aria-label=${label} style=${`--count:${options.length};--index:${index}`}>
    <span class="segmented-thumb" aria-hidden="true"></span>
    ${options.map(o => html`<button type="button" role="radio" aria-checked=${o.value === value} class=${o.value === value ? 'is-active' : ''} onClick=${() => onChange(o.value)}>${o.label}</button>`)}
  </div>`;
}

export const Switch = ({checked, onChange, label}) =>
  html`<label class="switch-row"><span>${label}</span><input type="checkbox" role="switch" checked=${checked} onChange=${e => onChange(e.currentTarget.checked)}/></label>`;

// ───────── Pages ─────────
/** A screen with an iOS-style large title that collapses into a glass bar on scroll. */
/** Whether the surrounding tab is the one on screen. Tabs stay mounted while hidden. */
export const TabActive = createContext(true);
export function Page({title, eyebrow, back: showBack, actions, children, class: className = '', scrollKey}) {
  const scroller = useRef(), bar = useRef(), active = useContext(TabActive);
  // A hidden tab keeps its place; restore it in case the browser dropped it while hidden.
  useLayoutEffect(() => {
    const el = scroller.current, top = scrollMemory.get(scrollKey);
    if (active && scrollKey && top !== undefined && Math.abs(el.scrollTop - top) > 1) el.scrollTop = top;
  }, [active]);
  useEffect(() => {
    const el = scroller.current;
    if (scrollKey && scrollMemory.has(scrollKey)) el.scrollTop = scrollMemory.get(scrollKey);
    let scrolled = null;
    const onScroll = () => {
      const now = el.scrollTop > 44;
      if (now !== scrolled) bar.current?.classList.toggle('is-scrolled', scrolled = now);
      if (scrollKey) scrollMemory.set(scrollKey, el.scrollTop);
    };
    onScroll();
    el.addEventListener('scroll', onScroll, {passive: true});
    return () => el.removeEventListener('scroll', onScroll);
  }, [scrollKey]);
  return html`<div class=${cx('page-scroll', className)} ref=${scroller}>
    <header class="topbar" ref=${bar}>
      <div class="topbar-side">${showBack && html`<button type="button" class="nav-button" onClick=${() => back()} aria-label="Back"><${Icon} name="back"/></button>`}</div>
      <strong class="topbar-title" aria-hidden="true">${title}</strong>
      <div class="topbar-side topbar-actions">${actions}</div>
    </header>
    <div class="page-head">${eyebrow && html`<p class="page-eyebrow">${eyebrow}</p>`}<h1 class="page-title">${title}</h1></div>
    <div class="page-body">${children}</div>
  </div>`;
}
const scrollMemory = new Map();

// ───────── Sheets ─────────
/**
 * A native modal dialog styled as an iOS sheet: grabber, drag to dismiss,
 * Escape and backdrop close through navigation so guards can intercept.
 */
/** Set by the sheet host: whether this layer is animating out. */
export const SheetContext = createContext({closing: false});
export function Sheet({title, size = 'auto', class: className = '', left, right, onClose, children, footer, closing, labelId}) {
  const dialog = useRef(), panel = useRef(), heading = useRef();
  closing = closing || useContext(SheetContext).closing;
  const close = () => (onClose || back)();
  const leaving = useRef(closing); leaving.current = closing;
  // Open in the same frame the sheet is first drawn, so it appears whole;
  // move focus a frame later so the focus change never delays that frame.
  useLayoutEffect(() => {
    const d = dialog.current;
    let mounted = true;
    if (!d.open) d.showModal();
    if (!d.querySelector('[autofocus]')) requestAnimationFrame(() => { if (mounted && d.open) heading.current?.focus({preventScroll: true}); });
    const onCancel = event => { event.preventDefault(); close(); };
    // Browsers may close a dialog themselves (a repeated Escape or back gesture
    // skips "cancel"). Treat that as a close request; if a guard keeps the sheet, show it again.
    const onClosed = () => {
      if (leaving.current) return;
      close();
      requestAnimationFrame(() => { if (mounted && !leaving.current && !d.open) d.showModal(); });
    };
    d.addEventListener('cancel', onCancel);
    d.addEventListener('close', onClosed);
    return () => { mounted = false; d.removeEventListener('cancel', onCancel); d.removeEventListener('close', onClosed); };
  }, []);
  const drag = useRef(null);
  const onPointerDown = event => {
    if (event.button !== 0 || event.target.closest('button,input,select,textarea,a')) return;
    drag.current = {y: event.clientY, t: Date.now(), dy: 0};
    event.currentTarget.setPointerCapture(event.pointerId);
    panel.current.classList.add('is-dragging');
  };
  const onPointerMove = event => {
    if (!drag.current) return;
    drag.current.dy = Math.max(0, event.clientY - drag.current.y);
    panel.current.style.transform = `translateY(${drag.current.dy}px)`;
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    const {dy, t} = drag.current, fast = dy / Math.max(1, Date.now() - t) > .6;
    drag.current = null;
    panel.current.classList.remove('is-dragging');
    panel.current.style.transform = '';
    if (dy > 140 || (fast && dy > 40)) close();
  };
  const id = useRef(labelId || 'sheet-title-' + Math.random().toString(36).slice(2, 8)).current;
  // Every sheet keeps a visible way out: top right, or top left when that holds an action.
  const closeButton = html`<button type="button" class="nav-button" onClick=${close} aria-label="Close"><${Icon} name="close"/></button>`;
  return html`<dialog ref=${dialog} class=${cx('sheet', 'sheet-' + size, className, closing && 'is-closing')} aria-labelledby=${id} onClick=${event => { if (event.target === dialog.current) close(); }}>
    <div class="sheet-panel" ref=${panel}>
      <header class="sheet-head" onPointerDown=${onPointerDown} onPointerMove=${onPointerMove} onPointerUp=${onPointerUp} onPointerCancel=${onPointerUp}>
        <span class="sheet-grabber" aria-hidden="true"></span>
        <div class="sheet-bar">
          <div class="sheet-side">${left === undefined && right ? closeButton : left}</div>
          <h2 id=${id} tabindex="-1" ref=${heading}>${title}</h2>
          <div class="sheet-side sheet-side-end">${right === undefined ? closeButton : right}</div>
        </div>
      </header>
      <div class="sheet-body">${children}</div>
      ${footer && html`<footer class="sheet-foot">${footer}</footer>`}
    </div>
  </dialog>`;
}

export const SheetBack = () => html`<button type="button" class="nav-button" onClick=${() => back()} aria-label="Back"><${Icon} name="back"/></button>`;

// ───────── Money visuals ─────────
/**
 * Who paid against what was fair. The bar is each couple's share of what was
 * paid; the tick marks couple A's fair share. The gap between them is the debt.
 */
export function FairShareBar({names, overview}) {
  const total = overview.total || 0;
  const aPaid = overview.paid, aShare = overview.share, bPaid = total - aPaid;
  const paidPct = total ? aPaid / total * 100 : 50, sharePct = total ? aShare / total * 100 : 50;
  return html`<div class="fair">
    <div class="fair-bar" role="img" aria-label=${`${coupleName(names, 'a')} paid ${money(aPaid)}, ${coupleName(names, 'b')} paid ${money(bPaid)}`}>
      <i class="fair-a" style=${`--w:${paidPct}%`}></i><i class="fair-b" style=${`--w:${100 - paidPct}%`}></i>
      ${total > 0 && html`<span class="fair-tick" style=${`--x:${sharePct}%`} title="Fair share"></span>`}
    </div>
    <div class="fair-legend">
      <span><${CouplePair} names=${names} couple="a" size="xs"/><span><b>${money(aPaid)}</b> paid</span></span>
      <span><span><b>${money(bPaid)}</b> paid</span><${CouplePair} names=${names} couple="b" size="xs"/></span>
    </div>
  </div>`;
}

/** Payer → receiver with both couples' avatars. */
export const Flow = ({names, from, to, settled}) =>
  html`<div class=${cx('flow', settled && 'is-settled')} aria-hidden="true">
    <span class="flow-end"><${CouplePair} names=${names} couple=${from}/><small>${coupleName(names, from)}</small></span>
    <span class="flow-line"><i></i><${Icon} name=${settled ? 'check' : 'arrow'}/></span>
    <span class="flow-end"><${CouplePair} names=${names} couple=${to}/><small>${coupleName(names, to)}</small></span>
  </div>`;

/** Requires a deliberate drag. Keyboard and assistive activation confirm directly. */
export function SlideToConfirm({label, onConfirm, disabled}) {
  const track = useRef(), knob = useRef(), [done, setDone] = useState(false);
  const drag = useRef(null);
  const max = () => track.current.clientWidth - knob.current.clientWidth - 8;
  const set = x => knob.current.style.setProperty('--x', x + 'px');
  const finish = () => { setDone(true); set(max()); onConfirm(); };
  const reset = () => { setDone(false); knob.current?.classList.remove('is-dragging'); set(0); };
  useEffect(() => { if (!disabled && done) reset(); }, [disabled]);
  return html`<div class=${cx('slide', done && 'is-done', disabled && 'is-disabled')} ref=${track}>
    <span class="slide-label">${label}</span>
    <button type="button" class="slide-knob" ref=${knob} disabled=${disabled || done} aria-label=${label}
      onClick=${event => { if (event.detail === 0) finish(); }}
      onPointerDown=${event => { drag.current = event.clientX; event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.classList.add('is-dragging'); }}
      onPointerMove=${event => { if (drag.current === null) return; set(Math.max(0, Math.min(max(), event.clientX - drag.current))); }}
      onPointerUp=${event => { if (drag.current === null) return; const x = event.clientX - drag.current; drag.current = null; event.currentTarget.classList.remove('is-dragging'); if (x >= max() * .86) finish(); else set(0); }}
      onPointerCancel=${() => { drag.current = null; reset(); }}>
      <${Icon} name=${done ? 'check' : 'arrow'}/>
    </button>
  </div>`;
}

// ───────── Keypad ─────────
const keys = ['1', '2', '3', '÷', '4', '5', '6', '×', '7', '8', '9', '−', '.', '0', '⌫', '+'];
const keyLabels = {'÷': 'Divide', '×': 'Multiply', '−': 'Subtract', '+': 'Add', '⌫': 'Delete', '.': 'Decimal point'};
export function Keypad({onKey}) {
  const hold = useRef();
  return html`<div class="keypad" role="group" aria-label="Amount keypad">
    ${keys.map(k => html`<button type="button" class=${cx('key', /[÷×−+]/.test(k) && 'key-op', k === '⌫' && 'key-del')} aria-label=${keyLabels[k] || k}
      onClick=${() => onKey(k)}
      onPointerDown=${k === '⌫' ? () => { hold.current = setTimeout(() => onKey('clear'), 550); } : undefined}
      onPointerUp=${k === '⌫' ? () => clearTimeout(hold.current) : undefined}
      onPointerLeave=${k === '⌫' ? () => clearTimeout(hold.current) : undefined}>${k === '⌫' ? html`<${Icon} name="backspace"/>` : k}</button>`)}
  </div>`;
}
