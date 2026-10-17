import {html, useState} from '../../vendor/preact-htm.js';
import {useStore, startDemo, createHousehold, openLink, claimSeat, refresh, signOut} from '../store.js';
import {present, replace, closeSheet} from '../nav.js';
import {Sheet, Icon, Amount, FairShareBar} from '../ui.js';

const exampleNames = ['Avery', 'Sam', 'Jordan', 'Riley'];

export function Welcome() {
  return html`<main class="welcome">
    <div class="welcome-mark" aria-hidden="true"><i class="orb orb-a"></i><i class="orb orb-b"></i><i class="orb orb-lens"></i></div>
    <p class="welcome-brand">together<span>.</span></p>
    <h1 class="welcome-title">Share the home.<br/><span>Skip the maths.</span></h1>
    <p class="welcome-copy">One calm place for two couples to log what they spend, see who’s ahead and settle up in a swipe.</p>
    <div class="welcome-card wallet is-owed" aria-label="Example balance">
      <div class="wallet-sheen" aria-hidden="true"></div>
      <div class="wallet-top"><span class="wallet-label">Example · this fortnight</span><span class="wallet-status">To receive</span></div>
      <${Amount} cents=${720} class="amount-hero"/>
      <p class="wallet-line">Jordan & Riley owe you</p>
      <${FairShareBar} names=${exampleNames} overview=${{total: 15840, paid: 8640, share: 7920}}/>
    </div>
    <div class="welcome-actions">
      <button type="button" id="create-start" class="btn btn-primary btn-block btn-large" onClick=${() => present('create', {})}>Create your household</button>
      <button type="button" id="join-start" class="btn btn-secondary btn-block btn-large" onClick=${() => present('join', {})}>I have a link</button>
      <button type="button" id="demo-start" class="btn btn-quiet btn-block" onClick=${startDemo}>Explore a sample household</button>
    </div>
    <p class="fineprint">Four people · two couples · one shared journal</p>
  </main>`;
}

export function LoadError() {
  const {loadError} = useStore('loadError');
  const [trying, setTrying] = useState(false);
  return html`<main class="welcome welcome-compact">
    <div class="welcome-mark is-still" aria-hidden="true"><i class="orb orb-a"></i><i class="orb orb-b"></i><i class="orb orb-lens"></i></div>
    <h1 class="welcome-title welcome-title-sm">We couldn’t open your household</h1>
    <p class="welcome-copy">${loadError}</p>
    <div class="welcome-actions">
      <button type="button" class="btn btn-primary btn-block btn-large" disabled=${trying} onClick=${async () => { setTrying(true); await refresh(false); setTrying(false); }}>Try again</button>
      <button type="button" class="btn btn-secondary btn-block" onClick=${() => present('join', {})}>Use a different link</button>
      <button type="button" class="btn btn-quiet btn-block" onClick=${() => signOut()}>Start over</button>
    </div>
  </main>`;
}

export function CreateSheet({sheetKey, draft: initial}) {
  const [step, setStep] = useState(1), [draft, setDraft] = useState(initial?.name ? initial : {name: 'Our home', names: ['', '', '', ''], seat: 0});
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const setName = (i, v) => { const names = [...draft.names]; names[i] = v; setDraft({...draft, names}); };
  const submit = async event => {
    event.preventDefault(); setError('');
    const needed = step === 1 ? [draft.name, draft.names[0], draft.names[1]] : [draft.names[2], draft.names[3]];
    if (needed.some(v => !String(v).trim())) return setError('Enter a name in each field.');
    if (step === 1) return setStep(2);
    setBusy(true);
    // Signing in replaces every open sheet, so success needs no explicit close.
    try { await createHousehold({...draft, name: draft.name.trim(), names: draft.names.map(n => n.trim())}); }
    catch (e) { setError(e.message); setBusy(false); }
  };
  return html`<${Sheet} title=${step === 1 ? 'Make yourself at home' : 'Bring your people together'}
    left=${step === 2 ? html`<button type="button" class="nav-button" id="setup-back" onClick=${() => setStep(1)} aria-label="Back"><${Icon} name="back"/></button>` : ''}>
    <div class="steps" aria-label=${`Step ${step} of 2`}><i class="is-done"></i><i class=${step === 2 ? 'is-done' : ''}></i></div>
    <form id="create-form" class="form" onSubmit=${submit}>
      ${step === 1 ? html`
        <label class="field"><span>Household name</span><input name="name" value=${draft.name} maxlength="100" autocomplete="off" onInput=${e => setDraft({...draft, name: e.currentTarget.value})}/></label>
        <p class="form-label couple-a"><i class="dot"></i>Your couple</p>
        <div class="field-pair">
          <label class="field"><span>Your name</span><input name="n0" value=${draft.names[0]} maxlength="40" placeholder="First name" autocomplete="given-name" onInput=${e => setName(0, e.currentTarget.value)}/></label>
          <label class="field"><span>Your partner</span><input name="n1" value=${draft.names[1]} maxlength="40" placeholder="First name" autocomplete="off" onInput=${e => setName(1, e.currentTarget.value)}/></label>
        </div>` : html`
        <p class="form-label couple-b"><i class="dot"></i>The other couple</p>
        <div class="field-pair">
          <label class="field"><span>First person</span><input name="n2" value=${draft.names[2]} maxlength="40" placeholder="First name" autocomplete="off" onInput=${e => setName(2, e.currentTarget.value)}/></label>
          <label class="field"><span>Their partner</span><input name="n3" value=${draft.names[3]} maxlength="40" placeholder="First name" autocomplete="off" onInput=${e => setName(3, e.currentTarget.value)}/></label>
        </div>
        <p class="form-hint"><${Icon} name="lock"/> You’ll get a private access link next. Keep it safe — it’s how you sign in on another device.</p>`}
      ${error && html`<p class="form-error" role="alert">${error}</p>`}
      <button type="submit" class="btn btn-primary btn-block" disabled=${busy}>${step === 1 ? 'Continue' : 'Create household'} <${Icon} name="arrow"/></button>
    </form>
  <//>`;
}

export function JoinSheet({sheetKey}) {
  const [link, setLink] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const invite = await openLink(link);
      if (invite) replace('claim', invite); else closeSheet(sheetKey);
    } catch (e) { setError(e.message); setBusy(false); }
  };
  return html`<${Sheet} title="Join or sign in">
    <form id="join-form" class="form" onSubmit=${submit}>
      <label class="field"><span>Paste your invitation or private access link</span><textarea name="link" rows="3" required placeholder="https://…/#house=…" value=${link} onInput=${e => setLink(e.currentTarget.value)}></textarea></label>
      ${error && html`<p class="form-error" role="alert">${error}</p>`}
      <button type="submit" class="btn btn-primary btn-block" disabled=${busy}>Continue</button>
    </form>
  <//>`;
}

export function ClaimSheet({sheetKey, house, invite, preview}) {
  const firstOpen = preview.claimed.findIndex(c => !c);
  const [seat, setSeat] = useState(firstOpen), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault(); setBusy(true);
    try { await claimSeat(house, invite, seat); }
    catch (e) { setError(e.message); setBusy(false); }
  };
  return html`<${Sheet} title=${`Join ${preview.name}`}>
    <form id="claim-form" class="form" onSubmit=${submit}>
      <p class="sheet-lede">Who are you? People who already joined should sign in with their own private link.</p>
      <div class="choice-list" role="radiogroup" aria-label="Your name">${preview.names.map((name, i) => html`<label class=${'choice' + (preview.claimed[i] ? ' is-disabled' : '') + (seat === i ? ' is-selected' : '')}>
        <input type="radio" name="seat" value=${i} checked=${seat === i} disabled=${preview.claimed[i]} onChange=${() => setSeat(i)}/>
        <span class=${'avatar avatar-md couple-' + (i < 2 ? 'a' : 'b')} aria-hidden="true">${name.slice(0, 1).toUpperCase()}</span>
        <span class="choice-text"><strong>${name}</strong><small>${preview.claimed[i] ? 'Already joined' : i < 2 ? 'First couple' : 'Second couple'}</small></span>
      </label>`)}</div>
      ${error && html`<p class="form-error" role="alert">${error}</p>`}
      <button type="submit" class="btn btn-primary btn-block" disabled=${busy || firstOpen < 0}>${firstOpen < 0 ? 'Everyone has joined' : 'Join household'}</button>
    </form>
  <//>`;
}
