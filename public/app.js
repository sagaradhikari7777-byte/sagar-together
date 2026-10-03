import {createNavigationTrail,installEdgeBack} from './back-navigation.js';
import {settlementOverview} from './settlement-overview.js';
import {householdExpense,canManageExpenseAs} from './expense-policy.js';
import {catalogValues,changeCatalog} from './catalog.js';
import {calculateAmount,filterExpenses,summarizeSpending,repeatPreset,frequentMerchants} from './journal.js';
const $=s=>document.querySelector(s), app=$('#app'), sheet=$('#sheet');
const paths={wifi:'M3 8a14 14 0 0 1 18 0M6 12a9 9 0 0 1 12 0M9 16a4 4 0 0 1 6 0M12 20h.01',gift:'M3 8h18v5H3ZM5 13v8h14v-8M12 8v13M12 8C3 8 5 0 9 3l3 5ZM12 8c9 0 7-8 3-5l-3 5Z',movie:'M3 9h18v12H3ZM3 9 2 4l18-3 1 5ZM7 3l3 4m4-5 3 4',tag:'M3 3h8l10 10-8 8L3 11ZM7 7h.01',edit:'m15 4 5 5M4 20l4-1L21 6l-4-4L4 15Z',pin:'m8 3 8 0-1 7 3 4H6l3-4ZM12 14v8',archive:'M3 3h18v5H3ZM5 8v13h14V8M9 12h6',trash:'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',store:'M3 10h18L19 3H5ZM5 10v11h14V10M9 21v-7h6v7',home:'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',list:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',settle:'M19 6v5h-5M5 18v-5h5M6.2 8A7 7 0 0 1 18.8 6M5.2 18A7 7 0 0 0 17.8 16M12 5v14M15.5 8c-.8-1-2-1.5-3.5-1.5-2.1 0-3.5 1-3.5 2.5 0 1.7 1.5 2.3 3.6 2.7 2.1.4 3.4 1 3.4 2.8 0 1.6-1.4 2.8-3.5 2.8-1.6 0-2.9-.5-3.8-1.5',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',plus:'M12 5v14M5 12h14',close:'m6 6 12 12M6 18 18 6',food:'M4 3v6q0 3 3 3V3m0 9v9M18 3q-5 5 0 10v8M18 3v10',groceries:'m3 4 2 0 3 12h11l2-8H6M9 21h.01M18 21h.01',bills:'m13 2-9 12h7l-1 8 10-12h-7Z',travel:'M3 16h18M5 16l1-8h12l2 8M7 20v-4m10 4v-4M8 12h.01M16 12h.01',other:'M4 5h16v15H4zM8 2v6m8-6v6M4 10h16',check:'m5 12 4 4L19 6',lock:'M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4',folder:'M3 6V4h7l3 3h8v13H3Z',arrow:'M5 12h14m-5-5 5 5-5 5',refresh:'M20 7v5h-5M4 17v-5h5M5 7a8 8 0 0 1 13-2l2 3M4 16l2 3a8 8 0 0 0 13-2',receipt:'M5 3h14v18l-3-2-4 2-4-2-3 2ZM8 7h8M8 11h8M8 15h4',moon:'M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10'};
Object.assign(paths,{calendar:'M6 2v3m12-3v3M3 8h18M5 4h14a2 2 0 0 1 2 2v15H3V6a2 2 0 0 1 2-2ZM7 12h.01M12 12h.01M17 12h.01M7 16h.01M12 16h.01M17 16h.01',user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',search:'m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',people:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',chevron:'m9 5 7 7-7 7',settings:'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',chart:'M4 20V10m6 10V4m6 16v-7m5 7H2',copy:'M8 8h13v13H8ZM16 8V3H3v13h5',calculator:'M5 2h14v20H5ZM8 6h8M8 11h1m6 0h1m-8 4h1m6 0h1m-8 4h1m6 0h1',filter:'M3 5h18M6 12h12M10 19h4',sun:'M12 3v2m0 14v2M3 12h2m14 0h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42M18.36 5.64l-1.42 1.42M7.06 16.94l-1.42 1.42M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',dots:'M5 12h.01M12 12h.01M19 12h.01'});
const icon=n=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[n]||paths.other}"/></svg>`;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=c=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(c/100);
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const uid=()=>crypto.randomUUID();const group=n=>n<2?'a':'b';
const catIcon=c=>/grocer/i.test(c)?'groceries':/dining|food|coffee/i.test(c)?'food':/bill|rent/i.test(c)?'bills':/transport|travel/i.test(c)?'travel':'other';
const viewScroll=new Map(), navigationTrail=createNavigationTrail();
let navigationOwner='', modalTrail=[];
const backIcon=()=>'<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 4-8 8 8 8"/></svg>';
function backOneModal(){
 if(busy)return;
 const previous=modalTrail.pop();
 if(!previous){sheet.close();return;}
 sheet.replaceChildren(...previous.nodes);sheet.oncancel=previous.cancel;sheet.scrollTop=previous.scroll;
 syncOverlayLayers();
 (sheet.querySelector('#dialog-title')||sheet.querySelector('button'))?.focus({preventScroll:true});
}
const isInnerPage=()=>tab==='expenses';
function syncOverlayLayers(){
 const sheetOpen=sheet.open;
 const catalogOpen=!!document.querySelector('#catalog-dialog[open]');
 const expenseOpen=sheetOpen&&!!sheet.querySelector('#expense-form');
 document.body.classList.toggle('overlay-open',sheetOpen||catalogOpen);
 document.body.classList.toggle('expense-entry-open',expenseOpen);
 document.body.classList.toggle('catalog-layer-open',catalogOpen);
}
function goBack(){
 if(busy)return;
 const catalog=document.querySelector('#catalog-dialog[open]');
 if(catalog){catalog.querySelector('#catalog-back')?.click();return;}
 if(sheet.open){sheet.querySelector('[data-modal-back]')?.click();return;}
 if(!isInnerPage())return;
 const previous=navigationTrail.back();if(!previous){tab='sheets';render();return;}
 ({tab,activeSheet,search,filter,expenseFilters,settleCouple,sheetSearch,sheetFilter}=previous);render();
}
sheet.addEventListener('close',()=>{
 if(!sheet.open)modalTrail=[];
 syncOverlayLayers();
});
sheet.addEventListener('click',ev=>{
 if(ev.target!==sheet||busy)return;
 const back=sheet.querySelector('[data-modal-back]');
 if(back)back.click();else sheet.close();
});
installEdgeBack({canGoBack:()=>!busy&&(sheet.open||!!document.querySelector('#catalog-dialog[open]')||isInnerPage()),goBack});
let sheetSearch='',sheetFilter='all',sheetSearchOpen=false,settleCouple=null,settleSpendMode='category';
let expenseFilters={payer:'',category:'',from:'',to:'',sort:'newest'},insightPeriod='sheet';
let data=null,credentials=null,demo=false,tab='home',filter='all',search='',activeSheet='',joinInfo=null,busy=false,homeBalanceFilter='all';
try{credentials=JSON.parse(localStorage.getItem('together-access'));document.body.classList.toggle('theme-dark',localStorage.getItem('together-theme')==='dark');}catch{}
function syncThemeColor(){document.querySelector('meta[name=theme-color]').content=document.body.classList.contains('theme-dark')?'#1a201b':'#ffffff';}
syncThemeColor();
const initials=n=>n.split(' ').map(x=>x[0]).join('').slice(0,2);
const couple=g=>data.names.slice(g==='a'?0:2,g==='a'?2:4).join(' & ');
function splitOptions(selected){return [['half','50 / 50'],['a',couple('a')+' · 100%'],['b',couple('b')+' · 100%']].map(([value,label])=>`<option value="${value}" ${value===selected?'selected':''}>${esc(label)}</option>`).join('');}
function expenseShareLabel(e){
 const label=e.split==='half'?'50 / 50':couple(e.split)+' · 100%';
 return label+(e.settlement?' · Settled':'');
}
function sheetDateRange(s){
 if(!s)return '';
 const format=value=>new Date(value+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'});
 return `${format(s.start)} – ${s.end?format(s.end):'No end date'}`;
}

function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
function modal(title,body){
 if(sheet.open&&sheet.querySelector('#dialog-title')?.textContent!==title){modalTrail.push({nodes:[...sheet.childNodes],cancel:sheet.oncancel,scroll:sheet.scrollTop});}
 if(!sheet.open)modalTrail=[];
 sheet.innerHTML=`<div class="dialog-head"><button type="button" class="back-button" data-modal-back aria-label="Go back">${backIcon()}</button><h2 id="dialog-title" tabindex="-1">${esc(title)}</h2><button type="button" class="icon-button" data-close aria-label="Close">${icon('close')}</button></div>${body}`;
 sheet.querySelector('[data-modal-back]').onclick=backOneModal;
 sheet.oncancel=ev=>{ev.preventDefault();sheet.querySelector('[data-modal-back]').click();};
 sheet.querySelector('[data-close]').onclick=()=>sheet.close();sheet.setAttribute('aria-labelledby','dialog-title');
 if(!sheet.open)sheet.showModal();
 syncOverlayLayers();
 sheet.scrollTop=0;sheet.querySelector('#dialog-title').focus({preventScroll:true});
}
function errorIn(form,e){const el=form.querySelector('.form-error')||form.querySelector('.error');if(el)el.textContent=e.message||e;else toast(e.message||e);}
async function api(body){const res=await fetch('/api/household',{method:'POST',headers:{'Content-Type':'application/json',...(credentials?{Authorization:`Bearer ${credentials.key}`}:{})},body:JSON.stringify({house:credentials?.house,rev:data?.rev,...body}),signal:AbortSignal.timeout(20000)});const j=await res.json();if(!res.ok)throw Object.assign(new Error(j.error||'Could not save changes.'),{status:res.status});return j;}
function demoMutation(b){if(b.action==='catalog')changeCatalog(data,b);if(b.action==='sheet-edit')Object.assign(data.sheets.find(s=>s.id===b.id),{name:b.name,start:b.start,end:b.end});if(b.action==='sheet-delete'){if(data.expenses.some(e=>e.sheet===b.id&&!canManageExpense(e)))throw new Error('This sheet contains protected records. Archive it instead.');data.expenses=data.expenses.filter(e=>e.sheet!==b.id);data.sheets=data.sheets.filter(s=>s.id!==b.id);}if(b.action==='expense'){const previous=data.expenses.find(e=>e.id===b.expense.id);if(previous&&!canManageExpense(previous))throw new Error('Only the person who added this expense can edit it.');const e={...householdExpense(b.expense),id:b.expense.id||uid(),creator:previous?.creator??data.seat,settlement:null};data.expenses=data.expenses.filter(x=>x.id!==e.id);data.expenses.unshift(e);}if(b.action==='delete'){if(!canManageExpense(data.expenses.find(e=>e.id===b.id)))throw new Error('This expense cannot be deleted.');data.expenses=data.expenses.filter(x=>x.id!==b.id);}if(b.action==='settings'){data.name=b.name;data.names=b.names;}if(b.action==='sheet')data.sheets.unshift({id:uid(),name:b.name,start:b.start,end:b.end,pinned:false,archived:false});if(b.action==='pin'){const was=data.sheets.find(s=>s.id===b.id)?.pinned;data.sheets.forEach(s=>s.pinned=s.id===b.id&&!was);}if(b.action==='archive'){const s=data.sheets.find(s=>s.id===b.id);if(!s.archived&&data.expenses.some(e=>e.sheet===s.id&&!e.settlement))throw new Error('Settle expenses before archiving.');s.archived=!s.archived;}if(b.action==='settle'){const es=data.expenses.filter(e=>e.sheet===b.sheet&&!e.settlement);const record={id:uid(),sheet:b.sheet,net:balance(es).net,date:new Date().toISOString(),count:es.length,by:data.seat};es.forEach(e=>e.settlement=record.id);data.settlements.unshift(record);}data.rev++;}
async function save(b){if(busy)return;busy=true;sheet.classList.add('saving');try{if(demo)demoMutation(b);else data=(await api(b)).data;render();return true;}catch(e){if(e.status===409){await refresh(false);e.message='New changes arrived. Review your entry and save again.';}throw e;}finally{busy=false;sheet.classList.remove('saving');}}
async function refresh(notify=true){try{data=(await api({action:'read'})).data;if(!activeSheet)activeSheet=data.sheets.find(s=>s.pinned&&!s.archived)?.id||data.sheets.find(s=>!s.archived)?.id||'';render();if(notify)toast('Up to date');}catch(e){if(!data)auth();toast(e.message);}}
function keepAccess(j){modalTrail=[];if(sheet.open)sheet.close();settleCouple=null;credentials={house:j.data.id,key:j.key};try{localStorage.setItem('together-access',JSON.stringify(credentials));}catch{toast('Save your private access link; this browser cannot remember it.');}data=j.data;activeSheet=data.sheets[0]?.id;demo=false;render();accessDialog(true);}
function balance(es){let net=0,aPaid=0,bPaid=0;for(const e of es){if(e.settlement)continue;const aShare=e.split==='half'?Math.floor(e.cents/2):e.split==='a'?e.cents:0;if(group(e.payer)==='a'){aPaid+=e.cents;net+=e.cents-aShare;}else{bPaid+=e.cents;net-=aShare;}}return{net,aPaid,bPaid,amount:Math.abs(net)};}
function scope(){return data.expenses.filter(e=>!activeSheet||e.sheet===activeSheet);}
function currentName(){return data.sheets.find(s=>s.id===activeSheet)?.name||'All sheets';}
function header(){
 const inner=isInnerPage();
 return `<header class="re-top"><div class="re-top-left">${inner?`<button type="button" class="re-glass-circle back-button" data-action="back" aria-label="Go back">${backIcon()}</button><div class="re-inner-label"><small>SHEET</small><strong>${esc(currentName())}</strong></div>`:`<button type="button" class="re-house" data-tab="home" aria-label="Open home"><span class="re-house-mark"><img src="/icon.svg" alt=""></span><span><small>HOUSEHOLD</small><strong>${esc(data.name)}</strong></span>${icon('chevron')}</button>`}</div><button class="re-profile" data-action="settings" aria-label="${demo?'Demo user':'Signed in as'} ${esc(data.names[data.seat])}. Open settings"><span>${esc(initials(data.names[data.seat]))}</span></button></header>${demo?'<div class="re-demo">Sample household <button class="text-button" data-action="exit-demo">Make it yours</button></div>':''}`;
}

function nav(){
 const activeIndex=tab==='home'?0:(tab==='sheets'||tab==='expenses')?1:tab==='settle'?3:tab==='settings'?4:2;
 const item=(id,label,ic)=>`<button data-tab="${id}" data-nav-index="${id==='home'?0:id==='sheets'?1:id==='settle'?3:4}" class="${tab===id||(id==='sheets'&&tab==='expenses')?'active':''}" ${tab===id||(id==='sheets'&&tab==='expenses')?'aria-current="page"':''}><span>${icon(ic)}</span><small>${label}</small></button>`;
 return `<footer class="re-nav"><nav class="re-dock" aria-label="Main navigation" data-active-index="${activeIndex}"><span class="liquid-refract-layer" aria-hidden="true"></span><span class="liquid-selection" aria-hidden="true"></span>${item('home','Home','home')}${item('sheets','Sheets','folder')}<button class="re-add re-add-nav" data-action="add" data-nav-index="2" aria-label="Add expense"><span>${icon('plus')}</span><small>Add</small></button>${item('settle','Settle','settle')}${item('settings','Settings','settings')}</nav></footer>`;
}

function pageIntro(kicker,title,subtitle='',actionButton=''){return `<div class="new-page-head"><div><p class="page-kicker">${kicker}</p><h1>${title}</h1>${subtitle?`<p class="new-page-subtitle">${subtitle}</p>`:''}</div>${actionButton}</div>`;}
function periodPicker(){return `<div class="re-period">${icon('folder')}${selectSheet()}</div>`;}


function peopleFaces(g){return `<span class="people-faces">${data.names.slice(g==='a'?0:2,g==='a'?2:4).map(n=>`<span>${esc(initials(n))}</span>`).join('')}</span>`;}

function selectSheet(){return `<select aria-label="Expense sheet" id="sheet-select">${data.sheets.map(s=>`<option value="${s.id}" ${s.id===activeSheet?'selected':''}>${esc(s.name)}${s.archived?' · Archived':''}</option>`).join('')}</select>`;}
function expenseRows(items){
 if(!items.length)return `<div class="liquid-empty"><span class="liquid-empty-icon">${icon('receipt')}</span><h3>No expenses here yet</h3><p>Add your first expense and Together will work out the share.</p><button class="primary" data-action="add">${icon('plus')} Add expense</button></div>`;
 return `<div class="liquid-expense-list">${items.map(e=>`<div class="expense-row" data-swipe-expense="${e.id}">${canManageExpense(e)?`<div class="expense-swipe-action expense-swipe-left" aria-hidden="true"><button type="button" tabindex="-1" data-expense-edit="${e.id}" aria-label="Edit ${esc(e.merchant)} expense" ${data.sheets.find(s=>s.id===e.sheet)?.archived?'disabled':''}>${icon('edit')}</button></div><div class="expense-swipe-action expense-swipe-right" aria-hidden="true"><button type="button" tabindex="-1" data-expense-delete="${e.id}" aria-label="Delete ${esc(e.merchant)} expense">${icon('trash')}</button></div>`:''}<div class="expense-front"><button class="expense liquid-expense" data-expense="${e.id}"><span class="liquid-category ${catIcon(e.category)}">${icon(catIcon(e.category))}</span><span class="expense-info"><strong>${esc(e.merchant)}</strong><span>${esc(data.names[e.payer])} · ${esc(new Date(e.date+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short'}))}${e.receipt?' · Receipt':''}</span><span class="expense-share">${esc(expenseShareLabel(e))}</span></span><span class="expense-total"><strong>${money(e.cents)}</strong><small>${e.settlement?'Settled':'Shared'}</small></span></button><button type="button" class="expense-more" data-expense-options="${e.id}" aria-label="Actions for ${esc(e.merchant)} expense" aria-haspopup="dialog">•••</button></div></div>`).join('')}</div>`;
}
function hero(){const b=balance(scope());return `<section class="glass hero"><div class="hero-head"><span class="eyebrow" style="margin:0">To settle</span><span class="badge">${esc(currentName())}</span></div><div class="amount">${money(b.amount)}</div><div class="small muted">${b.net===0?'All balanced between your couples':`${esc(couple(b.net>0?'b':'a'))} owes ${esc(couple(b.net>0?'a':'b'))}`}</div><div class="paid-grid"><div><span class="small muted"><i class="dot"></i>${esc(couple('a'))}</span><strong class="amount">${money(b.aPaid)}</strong></div><div><span class="small muted"><i class="dot b"></i>${esc(couple('b'))}</span><strong class="amount">${money(b.bPaid)}</strong></div></div><p class="small muted" style="margin:14px 0 0">Paid toward unsettled shared expenses</p></section>`;}
function home(){
 const activeSheetIds=new Set(data.sheets.filter(s=>!s.archived).map(s=>s.id)),entries=data.expenses.filter(e=>activeSheetIds.has(e.sheet)),mine=group(data.seat),o=settlementOverview(entries,mine),other=mine==='a'?'b':'a',openSheets=activeSheetIds.size;
 const status=o.net===0?'settled':o.net>0?'owe':'owed',owe=o.net>0?Math.abs(o.net):0,owed=o.net<0?Math.abs(o.net):0;
 const counts={all:1,owe:status==='owe'?1:0,owed:status==='owed'?1:0,settled:status==='settled'?1:0};
 const visible=homeBalanceFilter==='all'||homeBalanceFilter===status;
 const otherNames=couple(other),otherSeats=data.names.slice(other==='a'?0:2,other==='a'?2:4),otherInitials=otherSeats.map(n=>(n.trim()[0]||'').toUpperCase()).join('').slice(0,2);
 const statusLabel=status==='owe'?'You owe':status==='owed'?'You are owed':'All settled';
 return `<section class="re-page sp-page sp-home ref-home">
 <header class="ref-home-header"><div class="ref-home-title"><span class="ref-home-avatar">${esc(initials(data.names[data.seat]))}</span><strong>${esc(data.name||'Together')}</strong></div><div class="ref-home-tools"><button class="ref-search" data-action="home-search" aria-label="Search expenses">${icon('search')}</button><button class="ref-add-top" data-action="add">${icon('plus')}<span>Add</span></button></div></header>
 <div class="ref-home-progress"><i></i></div>
 <div class="ref-home-body">
  <section class="ref-balance-card ${status}"><div class="ref-balance-head"><span><i></i> OVERALL BALANCE</span><em>${statusLabel}</em></div><strong class="ref-balance-amount">${money(Math.abs(o.net))}</strong><p>Across ${openSheets} active sheet${openSheets===1?'':'s'} and shared expenses</p><div class="ref-balance-mini"><span><small>You owe</small><b class="owe">${money(owe)}</b></span><span><small>You are owed</small><b class="owed">${money(owed)}</b></span></div></section>
  <div class="ref-filter-row">
   <button data-home-filter="all" class="${homeBalanceFilter==='all'?'active':''}">All (${counts.all})</button>
   <button data-home-filter="owe" class="${homeBalanceFilter==='owe'?'active':''}"><i class="red"></i>You Owe (${counts.owe})</button>
   <button data-home-filter="owed" class="${homeBalanceFilter==='owed'?'active':''}"><i class="green"></i>Owes You (${counts.owed})</button>
   <button data-home-filter="settled" class="${homeBalanceFilter==='settled'?'active':''}"><i class="grey"></i>Settled (${counts.settled})</button>
  </div>
  <div class="ref-balance-list">${visible?`<section class="ref-couple-card"><span class="ref-couple-avatar"><i>${esc(otherInitials)}</i></span><div class="ref-couple-copy"><strong>${esc(otherNames)}</strong><p>Net balance: <b class="${status}">${money(Math.abs(o.net))}</b></p><span class="ref-shared-badge">${icon('people')} Shared household balance</span></div><strong class="ref-couple-amount ${status}">${money(Math.abs(o.net))}</strong><button class="ref-settle-go" data-action="open-settle" aria-label="Open settle details">${icon('settle')}</button></section>`:`<div class="ref-home-empty"><span>${icon('check')}</span><strong>No balances here</strong><p>Nothing matches this filter right now.</p></div>`}</div>
 </div></section>`;
}
function filteredExpenses(){return filterExpenses(scope(),data.names,{...expenseFilters,query:search,status:filter});}
function expenseGroups(es){
 if(!es.length)return `<div class="glass empty"><div class="category">${icon('receipt')}</div><h3>${scope().length?'No matches':'Your sheet is ready'}</h3><p>${scope().length?'Try another search or clear your filters.':'Add a bill, coffee or grocery run. We’ll handle the split.'}</p><button class="secondary" data-action="${scope().length?'reset-filters':'add'}">${scope().length?'Clear filters':'Add expense'}</button></div>`;
 if(['largest','smallest'].includes(expenseFilters.sort))return expenseRows(es);
 const groups=new Map();es.forEach(e=>{if(!groups.has(e.date))groups.set(e.date,[]);groups.get(e.date).push(e);});
 const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);const yd=`${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
 return [...groups].map(([day,items])=>`<section class="day-group"><div class="day-heading"><h2>${day===today()?'Today':day===yd?'Yesterday':esc(new Date(day+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'}))}</h2><span>${money(items.reduce((n,e)=>n+e.cents,0))}</span></div>${expenseRows(items)}</section>`).join('');
}
function expenses(){
 const es=filteredExpenses(),count=[expenseFilters.payer,expenseFilters.category,expenseFilters.from,expenseFilters.to].filter(Boolean).length,items=scope(),overview=settlementOverview(items,group(data.seat)),current=data.sheets.find(s=>s.id===activeSheet),total=items.reduce((n,e)=>n+e.cents,0),unsettled=items.filter(e=>!e.settlement).length,settled=items.length-unsettled,archived=!!current?.archived;
 const resultTotal=es.reduce((sum,e)=>sum+e.cents,0),range=current?sheetDateRange(current):'All household expenses';
 const chip=(id,label,dot='')=>`<button data-filter="${id}" class="${filter===id?'active':''}">${dot?`<i class="${dot}"></i>`:''}${label} (${id==='all'?items.length:id==='open'?unsettled:settled})</button>`;
 return `<section class="re-page sp-page ref-inside-sheet">
  <header class="ref-inside-header">
   <div class="ref-inside-left"><button class="ref-inside-back" data-action="back" aria-label="Back to Sheets">${backIcon()}</button><div><strong>${esc(currentName())}</strong><small>${esc(range)}</small></div></div>
   <div class="ref-inside-tools">${archived?'<span class="ref-archived-pill">Archived</span>':`<button class="ref-inside-add" data-action="add">${icon('plus')}<span>Add</span></button>`}</div>
  </header>
  <div class="ref-inside-progress"><i></i></div>
  <div class="ref-inside-body">
   <section class="ref-inside-summary">
    <div class="ref-inside-summary-head"><span><i></i>SHEET TOTAL</span><em>${archived?'Archived':unsettled?unsettled+' unsettled':'Settled'}</em></div>
    <strong class="ref-inside-total">${money(total)}</strong><p>${esc(range)}</p>
    <div class="ref-inside-stats"><span><small>Your share</small><b>${money(overview.share)}</b></span><span><small>You paid</small><b>${money(overview.paid)}</b></span></div>
   </section>
   <div class="ref-inside-filters">${chip('all','All')}${chip('open','Open','amber')}${chip('settled','Settled','green')}<button data-action="filters" class="${count?'has-count':''}">${icon('settings')} Filters${count?` (${count})`:''}</button></div>
   <div class="ref-inside-search">${icon('search')}<input id="search" type="search" placeholder="Search expenses" aria-label="Search expenses" value="${esc(search)}"><select id="expense-sort" aria-label="Sort expenses">${[['newest','Newest'],['oldest','Oldest'],['largest','Highest'],['smallest','Lowest']].map(([v,t])=>`<option value="${v}" ${expenseFilters.sort===v?'selected':''}>${t}</option>`).join('')}</select></div>
   <div class="ref-inside-result"><span>${es.length} expense${es.length===1?'':'s'}</span><strong>${money(resultTotal)}</strong>${count||search||filter!=='all'?'<button class="text-button" data-action="reset-filters">Clear</button>':''}</div>
   <div id="expense-results" class="ref-inside-list">${expenseGroups(es)}</div>
  </div>
 </section>`;
}
function sheetsView(){
 const expenseMap=new Map(data.sheets.map(sh=>[sh.id,data.expenses.filter(e=>e.sheet===sh.id)]));
 const stateFor=sh=>{
  const es=expenseMap.get(sh.id)||[],unsettledEs=es.filter(e=>!e.settlement);
  return {
   es,
   unsettledEs,
   unsettledTotal:unsettledEs.reduce((sum,e)=>sum+e.cents,0),
   unsettled:unsettledEs.length>0
  };
 };
 const allSheets=[...data.sheets].sort((a,b)=>Number(b.pinned)-Number(a.pinned)||b.start.localeCompare(a.start));
 const currentSheets=allSheets.filter(sh=>!sh.archived);
 const currentExpenses=currentSheets.flatMap(sh=>expenseMap.get(sh.id)||[]);
 const unsettledExpenses=currentExpenses.filter(e=>!e.settlement);
 const unsettledTotal=unsettledExpenses.reduce((sum,e)=>sum+e.cents,0);
 const unsettledSheets=currentSheets.filter(sh=>stateFor(sh).unsettled);
 const counts={
  all:allSheets.length,
  open:currentSheets.length,
  unsettled:currentSheets.filter(sh=>stateFor(sh).unsettled).length,
  archived:allSheets.filter(sh=>sh.archived).length
 };
 const matchesFilter=sh=>{
  if(sheetFilter==='open')return !sh.archived;
  if(sheetFilter==='unsettled')return !sh.archived&&stateFor(sh).unsettled;
  if(sheetFilter==='archived')return sh.archived;
  return true;
 };
 const items=allSheets.filter(sh=>matchesFilter(sh)&&sh.name.toLowerCase().includes(sheetSearch.toLowerCase()));
 const card=(sh,index)=>{
  const {es,unsettledEs,unsettledTotal,unsettled}=stateFor(sh);
  const cardIcon=sh.pinned?'pin':index%3===0?'calendar':index%3===1?'home':'people';
  const status=sh.archived?'Archived':unsettled?`${unsettledEs.length} unsettled`:'Settled';
  return `<div class="swipe-sheet ref-sheet-card" data-swipe-sheet="${sh.id}">
   <div class="swipe-actions left" aria-hidden="true"><button tabindex="-1" data-sheet-edit="${sh.id}">${icon('edit')}</button><button tabindex="-1" class="pin-action" data-sheet-pin="${sh.id}">${icon('pin')}</button></div>
   <div class="swipe-actions right" aria-hidden="true"><button tabindex="-1" data-sheet-archive="${sh.id}">${icon('archive')}</button><button tabindex="-1" class="delete-action" data-sheet-delete="${sh.id}" ${canDeleteSheet(sh.id)?'':'disabled'}>${icon('trash')}</button></div>
   <div class="sheet-front ref-sheet-front"><button class="ref-sheet-open" data-view-sheet="${sh.id}">
    <span class="ref-sheet-icon">${icon(cardIcon)}</span>
    <span class="ref-sheet-copy"><strong>${esc(sh.name)}</strong><small>${esc(sheetDateRange(sh))}</small><em>${status}${unsettled?' · unsettled only':''}</em></span>
    <span class="ref-sheet-amount">${money(unsettledTotal)}</span>
   </button><button class="sheet-more ref-sheet-more" data-sheet-options="${sh.id}" aria-label="Actions for ${esc(sh.name)}">•••</button></div>
  </div>`;
 };
 const filterChip=(id,label,dot='')=>`<button data-sheet-filter="${id}" class="${sheetFilter===id?'active':''}">${dot?`<i class="${dot}"></i>`:''}${label} (${counts[id]})</button>`;
 return `<section class="re-page sp-page ref-sheets">
  <header class="ref-sheets-header"><div class="ref-sheets-title"><span class="ref-sheets-avatar">${esc(initials(data.names[data.seat]))}</span><strong>Sheets</strong></div><div class="ref-sheets-tools"><button class="ref-sheets-search-btn" data-action="sheet-search-toggle" aria-label="Search sheets">${icon('search')}</button><button class="ref-sheets-add" data-action="new-sheet">${icon('plus')}<span>Add</span></button></div></header>
  <div class="ref-sheets-progress"><i></i></div>
  <div class="ref-sheets-body">
   <section class="ref-sheets-summary"><div class="ref-sheets-summary-head"><span><i></i>UNSETTLED</span><em>${unsettledSheets.length} sheet${unsettledSheets.length===1?'':'s'}</em></div><strong class="ref-sheets-total">${money(unsettledTotal)}</strong><p>${unsettledExpenses.length} unsettled expense${unsettledExpenses.length===1?'':'s'} across current sheets</p><div class="ref-sheets-stats"><span><small>Unsettled sheets</small><b>${unsettledSheets.length}</b></span><span><small>Unsettled expenses</small><b>${unsettledExpenses.length}</b></span></div></section>
   <div class="ref-sheets-filters">${filterChip('all','All')}${filterChip('open','Open','green')}${filterChip('unsettled','Unsettled','amber')}${filterChip('archived','Archived','grey')}</div>
   ${sheetSearchOpen||sheetSearch?`<div class="ref-sheets-search">${icon('search')}<input id="sheet-search" type="search" placeholder="Search sheets" aria-label="Search sheets" value="${esc(sheetSearch)}"><button type="button" data-action="sheet-search-toggle" aria-label="Close search">${icon('close')}</button></div>`:''}
   <div class="ref-sheets-list">${items.length?items.map(card).join(''):`<div class="ref-sheets-empty"><span>${icon('folder')}</span><strong>${sheetSearch?'No matching sheets':sheetFilter==='archived'?'No archived sheets':'No sheets here'}</strong><p>${sheetSearch?'Try another search.':'Create a sheet to start a new shared period.'}</p>${!sheetSearch&&sheetFilter!=='archived'?'<button class="primary" data-action="new-sheet">Create sheet</button>':''}</div>`}</div>
  </div>
 </section>`;
}
function settlementBreakdown(){
 const selected=settleCouple||group(data.seat),o=settlementOverview(scope(),selected),rows=o.rows.slice(0,4),more=Math.max(0,o.rows.length-rows.length);
 return `<section class="ha-breakdown">${rows.length?`<div class="ha-breakdown-list">${rows.map(e=>`<button data-expense="${e.id}"><span class="re-cat ${catIcon(e.category)}">${icon(catIcon(e.category))}</span><span><strong>${esc(e.merchant)}</strong><small>${esc(new Date(e.date+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short'}))} · ${esc(data.names[e.payer])}</small><i>${esc(e.category||'Other')}</i></span><em><small>Your share</small><b>${money(e.share)}</b></em></button>`).join('')}</div>${more?`<button class="ha-more" data-action="expenses">+${more} more · View sheet</button>`:''}`:'<div class="ha-balanced">'+icon('check')+'<span>Nothing left to settle.</span></div>'}</section>`;
}

function settlementSpendChart(){
 const expenses=scope(),total=expenses.reduce((sum,e)=>sum+e.cents,0);
 const mode=settleSpendMode==='merchant'?'merchant':'category';
 const categoryMap=new Map(),merchantMap=new Map();
 const bump=(map,key,e,relatedKey)=>{
  const safe=String(key||'Other').trim()||'Other';
  const row=map.get(safe)||{name:safe,total:0,count:0,related:new Map()};
  row.total+=e.cents;row.count++;
  const related=String(relatedKey||'Other').trim()||'Other';
  row.related.set(related,(row.related.get(related)||0)+e.cents);
  map.set(safe,row);
 };
 expenses.forEach(e=>{
  bump(categoryMap,e.category||'Other',e,e.merchant||'Unknown merchant');
  bump(merchantMap,e.merchant||'Unknown merchant',e,e.category||'Other');
 });
 const source=mode==='category'?categoryMap:merchantMap;
 let rows=[...source.values()].sort((a,b)=>b.total-a.total);
 const rowCount=rows.length;
 if(rows.length>5){
  const keep=rows.slice(0,5),rest=rows.slice(5);
  keep.push({name:'Other',total:rest.reduce((n,r)=>n+r.total,0),count:rest.reduce((n,r)=>n+r.count,0),related:new Map()});
  rows=keep;
 }
 const max=Math.max(...rows.map(r=>r.total),1);
 const top=rows[0];
 const relatedLabel=r=>{
  if(!r.related?.size)return mode==='category'?(r.count+' expense'+(r.count===1?'':'s')):'Mixed spending';
  const entry=[...r.related.entries()].sort((a,b)=>b[1]-a[1])[0],name=entry[0];
  return mode==='category'?('Top merchant · '+name):(name+' · '+r.count+' expense'+(r.count===1?'':'s'));
 };
 const barClass=r=>mode==='category'?catIcon(r.name):'merchant';
 const row=r=>{
  const pct=total?Math.round(r.total/total*100):0,bar=Math.max(6,Math.round(r.total/max*100));
  return `<div class="ref-spend-row">
   <div class="ref-spend-row-head"><span class="ref-spend-icon ${barClass(r)}">${icon(mode==='category'?catIcon(r.name):'store')}</span><span class="ref-spend-copy"><strong>${esc(r.name)}</strong><small>${esc(relatedLabel(r))}</small></span><span class="ref-spend-value"><b>${money(r.total)}</b><small>${pct}%</small></span></div>
   <div class="ref-spend-track"><i class="${barClass(r)}" style="--bar:${bar}%"></i></div>
  </div>`;
 };
 if(!expenses.length)return `<section class="ref-settle-chart ref-spend-chart"><div class="ref-spend-head"><div><small>SPENDING</small><h2>Where the money went</h2></div><strong>${money(0)}</strong></div><div class="ref-spend-empty">${icon('chart')}<strong>No spending yet</strong><p>Add expenses to see the category and merchant breakdown.</p></div></section>`;
 return `<section class="ref-settle-chart ref-spend-chart" aria-label="Spending breakdown">
  <div class="ref-spend-head"><div><small>SPENDING</small><h2>Where the money went</h2></div><strong>${money(total)}</strong></div>
  <div class="ref-spend-switch" role="group" aria-label="Spending chart view"><button data-spend-chart="category" class="${mode==='category'?'active':''}">Categories</button><button data-spend-chart="merchant" class="${mode==='merchant'?'active':''}">Merchants</button></div>
  <div class="ref-spend-insight"><span>${icon(mode==='category'?catIcon(top.name):'store')}</span><div><small>TOP ${mode==='category'?'CATEGORY':'MERCHANT'}</small><strong>${esc(top.name)}</strong><p>${money(top.total)} · ${Math.round(top.total/total*100)}% of this sheet</p></div></div>
  <div class="ref-spend-bars">${rows.map(row).join('')}</div>
  ${rowCount>5?'<p class="ref-spend-foot">Top 5 shown · remaining spending grouped as Other</p>':''}
 </section>`;
}

function settleView(){
 const b=balance(scope()),items=scope().filter(e=>!e.settlement),selected=settleCouple||group(data.seat),o=settlementOverview(scope(),selected),other=selected==='a'?'b':'a',from=o.net>0?selected:other,to=o.net>0?other:selected,remaining=Math.abs(o.net),history=data.settlements.filter(s=>s.sheet===activeSheet),current=data.sheets.find(s=>s.id===activeSheet);
 const status=o.net===0?'balanced':o.net>0?'pay':'receive';
 const statusLabel=status==='balanced'?'All balanced':status==='pay'?'You pay':'You receive';
 return `<section class="re-page sp-page ref-settle">
  <header class="ref-settle-header"><div class="ref-settle-title"><span class="ref-settle-avatar">${esc(initials(data.names[data.seat]))}</span><strong>Settle</strong></div><div class="ref-settle-tools"><button class="ref-settle-history" data-action="settlement-history" aria-label="Payment history">${icon('receipt')}</button><button class="ref-settle-record" data-action="settle" ${items.length?'':'disabled'}>${icon('check')}<span>${b.net?'Record':'Close'}</span></button></div></header>
  <div class="ref-settle-progress"><i></i></div>
  <div class="ref-settle-body">
   <section class="ref-settle-summary ${status}"><div class="ref-settle-summary-head"><span><i></i>TO SETTLE</span><em>${statusLabel}</em></div><strong class="ref-settle-amount">${money(remaining)}</strong><p>${o.net===0?'No payment is needed.':`${esc(couple(from))} → ${esc(couple(to))}`}</p><div class="ref-settle-stats"><span><small>Your share</small><b>${money(o.share)}</b></span><span><small>Paid</small><b>${money(o.paid)}</b></span></div></section>
   <div class="ref-settle-controls"><label class="ref-settle-sheet"><span>Sheet</span><div>${icon('folder')}${selectSheet()}</div></label><label class="ref-settle-couple"><span>Share for</span><select id="settle-couple">${['a','b'].map(g=>`<option value="${g}" ${g===selected?'selected':''}>${esc(couple(g))}${g===group(data.seat)?' · yours':''}</option>`).join('')}</select></label></div>
   ${settlementSpendChart()}
   <section class="ref-unsettled-card" aria-label="Unsettled expenses">
    <div class="ref-unsettled-head"><div><small>UNSETTLED</small><h2>What makes this up</h2></div><strong>${items.length} open</strong></div>
    <div class="ref-settle-breakdown">${settlementBreakdown()}</div>
   </section>
   <section class="ref-settle-actions" aria-label="Settlement tools">
    <button class="ref-settle-tool-card" data-action="settlement-summary"><span class="ref-settle-tool-head"><span><small>SUMMARY</small><strong>Settlement summary</strong></span><span class="ref-settle-tool-icon">${icon('copy')}</span></span><p>Copy the current balance and shares in one clean summary.</p><span class="ref-settle-tool-foot"><span>Ready to share</span>${icon('chevron')}</span></button>
    <button class="ref-settle-tool-card" data-action="settlement-history"><span class="ref-settle-tool-head"><span><small>HISTORY</small><strong>Payment history</strong></span><span class="ref-settle-tool-icon">${icon('receipt')}</span></span><p>${history.length?history.length+' recorded payment'+(history.length===1?'':'s')+' for this sheet.':'No payments have been recorded for this sheet yet.'}</p><span class="ref-settle-tool-foot"><span>View settlement records</span>${icon('chevron')}</span></button>
   </section>
  </div>
 </section>`;
}
function settingsHouseholdDialog(){
 modal('Household & names',`<form id="settings-household-form">
  <label class="field"><span>Household name</span><input name="name" value="${esc(data.name)}" required maxlength="100" autocomplete="organization"></label>
  <div class="two"><label class="field"><span>Person 1</span><input name="n0" value="${esc(data.names[0])}" required maxlength="40"></label><label class="field"><span>Person 2</span><input name="n1" value="${esc(data.names[1])}" required maxlength="40"></label></div>
  <div class="two"><label class="field"><span>Person 3</span><input name="n2" value="${esc(data.names[2])}" required maxlength="40"></label><label class="field"><span>Person 4</span><input name="n3" value="${esc(data.names[3])}" required maxlength="40"></label></div>
  <p class="small muted">Changing a name updates how that person appears across the household. Existing expenses keep the same ownership and payer seat.</p>
  <p class="error" role="alert"></p>
  <button class="primary full">Save household</button>
 </form>`);
 const form=$('#settings-household-form');
 form.onsubmit=async ev=>{
  ev.preventDefault();
  const v=new FormData(form);
  try{
   await save({action:'settings',name:v.get('name'),names:[0,1,2,3].map(i=>v.get('n'+i))});
   sheet.close();
   toast('Household updated');
  }catch(err){errorIn(form,err);}
 };
}

function settingsMoreDialog(){
 modal('Journal tools',`<p class="small muted">Manage the lists used when adding expenses or export a copy of your household journal.</p>
  <div class="sheet-option-list">
   <button type="button" class="secondary" id="settings-merchants">${icon('store')} Merchants</button>
   <button type="button" class="secondary" id="settings-categories">${icon('tag')} Categories</button>
   <button type="button" class="secondary" id="settings-export">${icon('receipt')} Export all expenses</button>
  </div>
  <p class="small muted">Renaming or removing a merchant/category does not rewrite historical expenses.</p>`);
 $('#settings-merchants').onclick=()=>openCatalog('merchants');
 $('#settings-categories').onclick=()=>openCatalog('categories');
 $('#settings-export').onclick=()=>exportCSV();
}

function settings(){
 const dark=document.body.classList.contains('theme-dark');
 const row=(action,ic,title,sub)=>`<button class="ref-settings-row" data-action="${action}"><span class="ref-settings-icon">${icon(ic)}</span><span class="ref-settings-copy"><strong>${title}</strong><small>${sub}</small></span>${icon('chevron')}</button>`;
 return `<section class="re-page sp-page ref-settings">
  <header class="ref-settings-header"><div class="ref-settings-title"><span class="ref-settings-avatar">${esc(initials(data.names[data.seat]))}</span><strong>Settings</strong></div><div class="ref-settings-tools"><button class="ref-settings-theme" data-action="theme" aria-label="${dark?'Switch to light mode':'Switch to dark mode'}">${icon(dark?'sun':'moon')}</button><button class="ref-settings-edit" data-action="settings-household">${icon('edit')}<span>Edit</span></button></div></header>
  <div class="ref-settings-progress"><i></i></div>
  <div class="ref-settings-body">
   <section class="ref-settings-summary"><div class="ref-settings-summary-head"><span><i></i>YOUR SPACE</span><em>${dark?'Dark mode':'Light mode'}</em></div><div class="ref-settings-person"><span>${esc(initials(data.names[data.seat]))}</span><div><small>SIGNED IN AS</small><strong>${esc(data.names[data.seat])}</strong><p>${esc(data.name)}</p></div></div><div class="ref-settings-stats"><span><small>Household</small><b>${esc(data.name)}</b></span><span><small>Your couple</small><b>${esc(couple(group(data.seat)))}</b></span></div></section>
   <div class="ref-settings-section-head"><small>HOUSEHOLD</small><h2>Shared space</h2></div><section class="ref-settings-group">${row('settings-household','people','Household & names','Members, couples and household name')}${row('invite','plus','Invite members','Share access safely')}${row('access','lock','Private access link','Your personal sign-in link')}</section>
   <div class="ref-settings-section-head"><small>APP</small><h2>Preferences</h2></div><section class="ref-settings-group">${row('entry-preferences','settings','Expense preferences','Defaults for faster entry')}${row('settings-more','tag','Journal tools','Merchants, categories and export')}${row('insights','chart','Insights','Review your shared spending')}</section>
   <button class="ref-settings-signout" data-action="signout">${icon('arrow')}<span>${demo?'Leave demo':'Sign out'}</span></button>
  </div>
 </section>`;
}
function selectionHaptic(){
 try{if(navigator.vibrate)navigator.vibrate(8);}catch{}
}
function springToTab(next,button){
 const repeat=tab===next;
 if(repeat){app.querySelector('main')?.scrollTo({top:0,behavior:'smooth'});return;}
 selectionHaptic();
 const dock=button?.closest('.re-dock');
 const index=button?.dataset.navIndex;
 const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 if(dock&&index!=null&&!reduce){
  dock.dataset.activeIndex=index;
  dock.querySelectorAll('[data-tab]').forEach(el=>{el.classList.toggle('active',el===button);el.toggleAttribute('aria-current',el===button);});
  window.setTimeout(()=>{tab=next;render();},220);
 }else{tab=next;render();}
}
function render(){
 if(!data)return auth();
 if(activeSheet&&!data.sheets.some(s=>s.id===activeSheet))activeSheet=data.sheets.find(s=>!s.archived)?.id||'';
 if(tab==='settle'&&!activeSheet)activeSheet=data.sheets.find(s=>s.pinned&&!s.archived)?.id||data.sheets.find(s=>!s.archived)?.id||data.sheets[0]?.id||'';
 const owner=data.id+':'+data.seat;if(owner!==navigationOwner){navigationOwner=owner;navigationTrail.reset();}
 navigationTrail.visit({tab,activeSheet,search,filter,expenseFilters,settleCouple,sheetSearch,sheetFilter});
 const viewKey=tab+':'+activeSheet,previous=app.querySelector('main');
 if(previous?.dataset.view)viewScroll.set(previous.dataset.view,previous.scrollTop);
 const scrollTop=viewScroll.get(viewKey)||0;
 const wasOpen=app.classList.contains('has-navigation');
 app.classList.add('has-navigation');
 app.innerHTML=`<main class="shell re-shell re-shell-${tab}" data-view="${esc(viewKey)}">${header()}${tab==='home'?home():tab==='expenses'?expenses():tab==='sheets'?sheetsView():tab==='settle'?settleView():settings()}</main>${nav()}`;
 bind();app.querySelector('main').scrollTop=scrollTop;
 if(!wasOpen)window.scrollTo(0,0);
}
function bind(){app.querySelectorAll('[data-home-filter]').forEach(b=>b.onclick=()=>{homeBalanceFilter=b.dataset.homeFilter;render();});app.querySelectorAll('[data-couple-overview]').forEach(b=>b.onclick=()=>{settleCouple=b.dataset.coupleOverview;tab='settle';render();});if($('#settle-couple'))$('#settle-couple').onchange=e=>{settleCouple=e.target.value;render();$('#settle-couple').focus();};app.querySelectorAll('[data-spend-chart]').forEach(b=>b.onclick=()=>{settleSpendMode=b.dataset.spendChart;render();requestAnimationFrame(()=>document.querySelector('.ref-spend-chart')?.scrollIntoView({block:'nearest'}));});bindJournal();bindSheetControls();bindExpenseSwipes();app.querySelectorAll('[data-expense-options]').forEach(b=>b.onclick=()=>expenseOptions(b.dataset.expenseOptions));app.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>springToTab(b.dataset.tab,b));app.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action,b));app.querySelectorAll('[data-expense]').forEach(b=>b.onclick=()=>expenseForm(data.expenses.find(e=>e.id===b.dataset.expense)));app.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>expenseForm(null,{merchant:b.dataset.quick,category:b.dataset.category}));app.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;render();});if($('#sheet-select'))$('#sheet-select').onchange=e=>{activeSheet=e.target.value;render();};if($('#search'))$('#search').oninput=e=>{const pos=e.target.selectionStart;search=e.target.value;render();$('#search').focus();$('#search').setSelectionRange(pos,pos);};app.querySelectorAll('[data-view-sheet]').forEach(b=>b.onclick=()=>{activeSheet=b.dataset.viewSheet;tab='expenses';render();});app.querySelectorAll('[data-pin]').forEach(b=>b.onclick=async()=>{try{await save({action:'pin',id:b.dataset.pin});activeSheet=b.dataset.pin;toast('Sheet pinned');}catch(e){toast(e.message);}});app.querySelectorAll('[data-archive]').forEach(b=>b.onclick=async()=>{try{await save({action:'archive',id:b.dataset.archive});toast('Sheet updated');}catch(e){toast(e.message);}});if($('#settings-form'))$('#settings-form').onsubmit=async e=>{e.preventDefault();const f=e.target,v=new FormData(f);try{await save({action:'settings',name:v.get('name'),names:[0,1,2,3].map(i=>v.get('n'+i))});toast('Household updated');}catch(err){errorIn(f,err);}};}
function action(a,source=null){if(a==='back')return goBack();if(a==='home-search'){activeSheet='';tab='expenses';render();requestAnimationFrame(()=>document.querySelector('#search')?.focus());return;}if(a==='sheet-search-toggle'){sheetSearchOpen=!sheetSearchOpen;if(!sheetSearchOpen)sheetSearch='';render();if(sheetSearchOpen)requestAnimationFrame(()=>document.querySelector('#sheet-search')?.focus());return;}if(journalAction(a))return;if(['settings','expenses','sheets'].includes(a)){tab=a;render();return;}if(a==='open-settle'){tab='settle';render();app.querySelector('main')?.scrollTo(0,0);return;}if(a==='settings-household')settingsHouseholdDialog();if(a==='settings-more')settingsMoreDialog();if(a==='merchants'||a==='categories')openCatalog(a);if(a==='add'){
 if(source?.classList.contains('re-add-nav')){
  selectionHaptic();
  const dock=source.closest('.re-dock');
  const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  if(dock&&!reduce){dock.dataset.activeIndex='2';window.setTimeout(()=>expenseForm(),160);}
  else expenseForm();
 }else expenseForm();
}if(a==='new-sheet')newSheet();if(a==='settle')settleDialog();if(a==='invite')inviteDialog();if(a==='access')accessDialog();if(a==='export')exportCSV();if(a==='theme'){document.body.classList.toggle('theme-dark');syncThemeColor();try{localStorage.setItem('together-theme',document.body.classList.contains('theme-dark')?'dark':'light');}catch{}render();}if(a==='exit-demo'){demo=false;data=null;auth();}if(a==='signout'){if(demo){demo=false;data=null;auth();}else confirmDialog('Sign out?', 'Keep your private access link so you can sign in again.',async()=>{credentials=null;data=null;try{localStorage.removeItem('together-access');}catch{}sheet.close();auth();},'Sign out');}}
function auth(){navigationTrail.reset();navigationOwner='';modalTrail=[];
 viewScroll.clear();app.classList.remove('has-navigation');
 app.innerHTML=`<main class="re-welcome"><div class="re-auth"><div class="re-auth-brand"><img src="/icon.svg" alt=""><strong>together<span>.</span></strong></div><p class="re-eyebrow">MONEY IS BETTER TOGETHER</p><h1>Share the home.<br><span>Skip the maths.</span></h1><p class="re-auth-copy">A calm shared journal for two couples. Add expenses, see everyone’s share and settle without spreadsheets.</p><section class="re-auth-preview"><div class="re-preview-top"><span>${icon('receipt')} Shared today</span><em>LIVE</em></div><div class="re-preview-row"><span class="re-cat groceries">${icon('groceries')}</span><span><strong>The weekly shop</strong><small>Avery paid</small></span><b>$86.40</b></div><div class="re-preview-row"><span class="re-cat food">${icon('food')}</span><span><strong>Dinner together</strong><small>Jordan paid</small></span><b>$72.00</b></div><div class="re-preview-summary"><span><small>Total</small><strong>$158.40</strong></span><span><small>Your share</small><strong>$79.20</strong></span></div></section><div class="re-auth-points"><span>${icon('plus')} Add it</span><span>${icon('people')} Share it</span><span>${icon('settle')} Settle it</span></div><button id="create-start" class="primary full">Create your household ${icon('arrow')}</button><button id="join-start" class="secondary full">I already have a link</button><button id="demo-start" class="text-button full">Explore a sample household</button><p class="re-auth-foot">Four people · Two couples · One shared journal</p></div></main>`;
 $('#create-start').onclick=()=>createForm();$('#join-start').onclick=joinForm;$('#demo-start').onclick=startDemo;
}

function createForm(draft={name:'Our home',names:['','','',''],seat:0},step=1){
 modal(step===1?'Make yourself at home':'Bring your people together',`<div class="setup-progress" aria-label="Step ${step} of 2"><span class="done"></span><span class="${step===2?'done':''}"></span></div><p class="small muted">Step ${step} of 2 · ${step===1?'Start with your household and your couple.':'Add the other couple. You can invite them after setup.'}</p><form id="create-form">${step===1?`<label class="field"><span>Household name</span><input name="name" value="${esc(draft.name)}" required maxlength="100" autocomplete="organization"></label><div class="two"><label class="field"><span>Your name</span><input name="n0" value="${esc(draft.names[0])}" required maxlength="40" autocomplete="given-name" placeholder="First name"></label><label class="field"><span>Your partner</span><input name="n1" value="${esc(draft.names[1])}" required maxlength="40" placeholder="First name" autocomplete="off"></label></div>`:`<div class="setup-couple"><span class="category">${icon('home')}</span><span><strong>${esc(draft.name)}</strong><small>${esc(draft.names.slice(0,2).join(' & '))}</small></span></div><div class="two"><label class="field"><span>Couple two · First person</span><input name="n2" value="${esc(draft.names[2])}" required maxlength="40" placeholder="First name" autocomplete="off"></label><label class="field"><span>Their partner</span><input name="n3" value="${esc(draft.names[3])}" required maxlength="40" placeholder="First name" autocomplete="off"></label></div><p class="setup-note">${icon('lock')} You’ll receive a private access link. Keep it safe to open your household on another device.</p>`}<p class="error" role="alert"></p><div class="form-actions">${step===2?'<button type="button" class="secondary" id="setup-back">Back</button>':''}<button class="primary">${step===1?'Continue':'Create household'} ${icon('arrow')}</button></div></form>`);
 const f=$('#create-form');
 if(step===2){const back=()=>{const v=new FormData(f);draft.names[2]=v.get('n2');draft.names[3]=v.get('n3');backOneModal();};$('#setup-back').onclick=back;sheet.querySelector('[data-modal-back]').onclick=back;}
 f.onsubmit=async ev=>{ev.preventDefault();const v=new FormData(f);for(const key of [...v.keys()])if(!String(v.get(key)).trim())return errorIn(f,'Enter a name in each field.');if(step===1){draft.name=v.get('name').trim();draft.names[0]=v.get('n0').trim();draft.names[1]=v.get('n1').trim();return createForm(draft,2);}draft.names[2]=v.get('n2').trim();draft.names[3]=v.get('n3').trim();const button=f.querySelector('.primary');button.disabled=true;try{const j=await api({action:'create',...draft});sheet.close();keepAccess(j);}catch(err){errorIn(f,err);button.disabled=false;}};
}
function joinForm(){modal('Join or sign in',`<form id="join-form"><label class="field"><span>Paste your invitation or private access link</span><textarea name="link" rows="3" required placeholder="https://…/#invite=…"></textarea></label><p class="error" role="alert"></p><button class="primary full">Continue</button></form>`);$('#join-form').onsubmit=async e=>{e.preventDefault();try{await openLink(new FormData(e.target).get('link'));}catch(err){errorIn(e.target,err);}};}
async function openLink(value){const u=new URL(value),q=new URLSearchParams(u.hash.slice(1));const h=q.get('house');if(q.has('key')){const next={house:h,key:q.get('key')};const old=credentials;credentials=next;try{const j=await api({action:'read'});keepAccess({...j,key:next.key});}catch(e){credentials=old;throw e;}}else if(q.has('invite')){joinInfo={house:h,invite:q.get('invite')};const j=await api({action:'join',...joinInfo});modal(`Join ${j.preview.name}`,`<p class="small muted">Choose your name. Claimed members should use their saved private access link.</p><form id="claim-form"><label class="field"><span>I am</span><select name="seat">${j.preview.names.map((n,i)=>`<option value="${i}" ${j.preview.claimed[i]?'disabled':''}>${esc(n)}${j.preview.claimed[i]?' · Already joined':''}</option>`).join('')}</select></label><p class="error" role="alert"></p><button class="primary full" ${j.preview.claimed.every(Boolean)?'disabled':''}>Join household</button></form>`);$('#claim-form').onsubmit=async e=>{e.preventDefault();const f=e.target;f.querySelector('button').disabled=true;try{keepAccess(await api({action:'join',...joinInfo,seat:Number(new FormData(f).get('seat'))}));}catch(err){errorIn(f,err);f.querySelector('button').disabled=false;}};}else throw new Error('Paste a complete Together invitation or access link.');}
function link(type){return `${location.origin}/#house=${data.id}&${type}=${type==='key'?credentials?.key:data.invite}`;}
function shareOrCopy(title,url){if(navigator.share)return navigator.share({title,url}).catch(e=>{if(e.name!=='AbortError')toast('Select and copy the link below.');});return navigator.clipboard?.writeText(url).then(()=>toast('Link copied')).catch(()=>toast('Select and copy the link below.'));}
function inviteDialog(){if(demo)return toast('Create a household to invite your members.');const url=link('invite');modal('Invite your household',`<p class="muted small">Send this to your household members. Each person chooses an unclaimed name and gets their own private access link.</p><div class="link-box">${esc(url)}</div><button class="primary full" id="share-link" style="margin-top:18px">Share invitation</button><button class="text-button full" id="rotate">Replace this invitation</button><p class="small muted">Only share with people in your household.</p>`);$('#share-link').onclick=()=>shareOrCopy('Join our Together household',url);$('#rotate').onclick=()=>confirmDialog('Replace invitation?','The old invitation will stop working. Existing members keep their access.',async()=>{await save({action:'rotate-invite'});inviteDialog();},'Replace invitation');}
function accessDialog(fresh=false){if(demo)return toast('Private access links are available after creating a household.');const url=link('key');modal(fresh?'You’re in. Save your access.':'Your private access link',`<p class="small muted">This link signs in as ${esc(data.names[data.seat])}. Save it somewhere private. Anyone with it can access your household as you.</p><div class="link-box">${esc(url)}</div><button class="primary full" id="share-access" style="margin-top:18px">Save or copy my link</button><p class="small muted">To invite someone else, use “Invite members” in Settings.</p>`);$('#share-access').onclick=()=>shareOrCopy('My private Together access',url);}
function startDemo(){settleCouple=null;demo=true;const month=today().slice(0,7);activeSheet='demo-sheet';data={id:'demo',name:'Our home',names:['Sagar','Sushma','Nabin','Sujata'],claimed:[true,true,true,true],seat:0,rev:0,sheets:[{id:activeSheet,name:new Date().toLocaleDateString('en-AU',{month:'long',year:'numeric'}),start:month+'-01',end:'',pinned:true,archived:false}],settlements:[],expenses:[['Woolworths',8640,'Groceries',0,'half'],['Electricity',14820,'Bills',2,'half'],['Weekend brunch',7200,'Dining',1,'half'],['ALDI',4235,'Groceries',3,'half']].map(([merchant,cents,category,payer,split],i)=>({id:uid(),merchant,cents,category,payer,split,visibility:'shared',creator:payer,date:month+'-'+String(Math.max(1,Number(today().slice(-2))-i)).padStart(2,'0'),sheet:activeSheet,notes:'',receipt:'',settlement:null}))};tab='home';render();}
function bindExpenseSwipes(){
 let closeOpen=null;
 app.querySelectorAll('[data-expense-edit]').forEach(b=>b.onclick=()=>expenseForm(data.expenses.find(e=>e.id===b.dataset.expenseEdit)));
 app.querySelectorAll('[data-expense-delete]').forEach(b=>b.onclick=()=>deleteExpense(b.dataset.expenseDelete));
 app.querySelectorAll('[data-swipe-expense]').forEach(row=>{
  const expense=data.expenses.find(e=>e.id===row.dataset.swipeExpense);if(!canManageExpense(expense))return;
  const front=row.querySelector('.expense-front'),canEdit=!data.sheets.find(s=>s.id===expense.sheet)?.archived;
  let startX=0,startY=0,base=0,offset=0,drag=false,moved=false,pointer=null,vertical=false;
  const setOffset=value=>{offset=value;front.style.transform=`translateX(${value}px)`;row.querySelectorAll('.expense-swipe-action').forEach(a=>{const exposed=value>0?a.classList.contains('expense-swipe-left'):value<0&&a.classList.contains('expense-swipe-right');a.setAttribute('aria-hidden',String(!exposed));a.querySelectorAll('button').forEach(b=>b.tabIndex=exposed&&!b.disabled?0:-1);});};
  const close=()=>{setOffset(0);};
  front.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary||e.clientX<=24)return;if(closeOpen&&closeOpen!==close)closeOpen();pointer=e.pointerId;startX=e.clientX;startY=e.clientY;base=offset;drag=false;moved=false;vertical=false;});
  front.addEventListener('pointermove',e=>{if(pointer!==e.pointerId||vertical)return;const dx=e.clientX-startX,dy=e.clientY-startY;if(!drag){if(Math.abs(dx)<10&&Math.abs(dy)<10)return;if(Math.abs(dy)>Math.abs(dx)){vertical=true;return;}drag=true;moved=true;front.setPointerCapture(e.pointerId);front.classList.add('dragging');}setOffset(Math.max(-68,Math.min(canEdit?68:0,base+dx)));});
  front.addEventListener('pointerup',e=>{if(pointer!==e.pointerId)return;pointer=null;if(!drag)return;drag=false;front.classList.remove('dragging');setOffset(offset>28?68:offset< -28?-68:0);closeOpen=offset?close:null;});
  front.addEventListener('pointercancel',()=>{pointer=null;drag=false;front.classList.remove('dragging');close();});
  front.addEventListener('click',e=>{if(moved||offset){e.preventDefault();e.stopImmediatePropagation();if(!moved)close();moved=false;}},true);
 });
}
function expenseAuthor(e){return Number.isInteger(e.creator)?data.names[e.creator]:'Original author unavailable';}
function canManageExpense(e){return canManageExpenseAs(e,data.seat);}
function expenseOptions(id){
 const e=data.expenses.find(x=>x.id===id);if(!e)return toast('Expense no longer exists.');
 const allowed=canManageExpense(e),archived=data.sheets.find(s=>s.id===e.sheet)?.archived;
 const reason=e.settlement?'This expense is settled and locked.':!allowed?'Only the person who added this expense can edit or delete it.':archived?'Reopen this sheet before editing the expense.':'';
 modal('Expense actions',`<p class="expense-action-summary"><strong>${esc(e.merchant)}</strong><span>${money(e.cents)} · Paid by ${esc(data.names[e.payer])}</span><span>Added by ${esc(expenseAuthor(e))}</span></p><div class="sheet-option-list"><button type="button" class="secondary" id="expense-option-repeat">${icon('copy')} Repeat for today</button><button type="button" class="secondary" id="expense-option-edit" ${allowed&&!archived?'':'disabled'}>${icon('edit')} Edit expense</button><button type="button" class="secondary danger" id="expense-option-delete" ${allowed?'':'disabled'}>${icon('trash')} Delete expense</button></div>${reason?`<p class="small muted">${esc(reason)}</p>`:''}<button type="button" class="text-button" id="expense-option-view">View details</button>`);
 $('#expense-option-repeat').onclick=()=>repeatExpense(e.id);
 $('#expense-option-edit').onclick=()=>expenseForm(e);
 $('#expense-option-delete').onclick=()=>deleteExpense(e.id);
 $('#expense-option-view').onclick=()=>expenseForm(e);
}
function deleteExpense(id){
 const e=data.expenses.find(x=>x.id===id);if(!canManageExpense(e))return toast('This expense cannot be deleted.');
 confirmDialog('Delete this expense?',`${e.merchant} — ${money(e.cents)} will be permanently removed.`,async()=>{const saved=await save({action:'delete',id});if(saved){sheet.close();toast('Expense deleted');}},'Delete expense');
 $('#confirm-action').classList.add('delete-confirm');
 const cancel=document.createElement('button');cancel.type='button';cancel.className='secondary full expense-delete-cancel';cancel.textContent='Cancel';cancel.onclick=backOneModal;sheet.append(cancel);
}
function expenseForm(e=null,preset={}){
 if(!e&&!data.sheets.some(s=>!s.archived))return newSheet();
 const defaults=entryPreferences();
 const x=e||{merchant:preset.merchant||'',cents:preset.cents||0,category:preset.category||defaults.category||'Groceries',payer:preset.payer??data.seat,visibility:'shared',split:preset.split||defaults.split||'half',date:today(),sheet:data.sheets.find(s=>s.id===activeSheet&&!s.archived)?.id||data.sheets.find(s=>!s.archived).id,notes:preset.notes||'',receipt:''};
 const archived=e&&data.sheets.find(s=>s.id===e.sheet)?.archived;
 const editable=!e||(canManageExpense(e)&&!archived);
 if(!editable){
  modal(x.merchant,`<div class="amount" style="font-size:38px;font-weight:700">${money(x.cents)}</div><p class="muted">Paid by ${esc(data.names[x.payer])} · ${esc(x.date)}</p><p class="small muted">Added by ${esc(expenseAuthor(x))}</p><div class="glass panel"><p class="small">${esc(x.category)} · ${x.split==='half'?'Split equally':`Assigned to ${esc(couple(x.split))}`}</p><p class="small">${esc(x.notes||'No notes')}</p></div>${x.receipt?`<img class="receipt" alt="Expense receipt" src="${esc(x.receipt)}">`:''}<p class="small muted">${x.settlement?'This expense is settled and locked.':archived?'Reopen this sheet before editing the expense.':'Only the person who added this expense can edit or delete it.'}</p>`);
  return;
 }
 let receipt=x.receipt||'',receiptBusy=false;
 const title=e?'Edit expense':preset.repeat?'Repeat expense':'Add an expense';
 modal(title,`<form id="expense-form" class="ref-expense-form">
  ${preset.repeat?'<p class="entry-note">A new expense for today. Check the amount and save when ready.</p>':''}
  <section class="ref-expense-card ref-expense-main-card">
   <div class="ref-expense-card-title"><span><small>EXPENSE</small><h3>Expense details</h3></span></div>
   <label class="ref-expense-field ref-expense-merchant"><span class="ref-expense-label">Merchant</span><span class="ref-expense-control"><i>${icon('store')}</i><input name="merchant" class="picker-control" readonly data-pick="merchants" placeholder="Choose merchant" value="${esc(x.merchant)}" required aria-haspopup="dialog"></span></label>
   <label class="ref-expense-field ref-expense-amount"><span class="ref-expense-label">Amount</span><span class="ref-expense-amount-row"><span class="ref-currency-pill">$ AUD</span><span class="ref-expense-control amount-control"><input class="big-input" name="amount" inputmode="decimal" placeholder="0.00" value="${x.cents?(x.cents/100).toFixed(2):''}" pattern="[0-9]+([.][0-9]{1,2})?" required aria-label="Amount in Australian dollars"></span></span></label>
   <div class="ref-expense-pair">
    <label class="ref-expense-field"><span class="ref-expense-label">Category</span><span class="ref-expense-control"><i>${icon('tag')}</i><input name="category" class="picker-control" readonly data-pick="categories" value="${esc(x.category)}" required aria-haspopup="dialog"></span></label>
    <label class="ref-expense-field"><span class="ref-expense-label">Date</span><span class="ref-expense-control"><i>${icon('calendar')}</i><input type="date" name="date" value="${x.date}" required></span></label>
   </div>
  </section>

  <section class="ref-expense-card ref-expense-split-card">
   <div class="ref-expense-card-title"><span><small>SPLIT</small><h3>Payment & split</h3></span></div>
   <div class="ref-expense-pair ref-expense-pair-split">
    <label class="ref-expense-field"><span class="ref-expense-label">Paid by</span><span class="ref-expense-control"><i>${icon('user')}</i><select name="payer">${data.names.map((n,i)=>`<option value="${i}" ${x.payer===i?'selected':''}>${i===data.seat?'You · ':''}${esc(n)}</option>`).join('')}</select></span></label>
    <label class="ref-expense-field"><span class="ref-expense-label">Split</span><span class="ref-expense-control"><i>${icon('chart')}</i><select name="split">${splitOptions(x.split)}</select></span></label>
   </div>
   <div class="ref-split-preview-inline" id="split-preview"></div>
  </section>

  <section class="ref-expense-options-card">
   <div class="ref-expense-options-head"><span><small>OPTIONAL</small><h3>Extra details</h3></span><em>${esc(data.sheets.find(s=>s.id===x.sheet)?.name||'Current sheet')}</em></div>
   <label class="ref-expense-field"><span class="ref-expense-label">Expense sheet</span><span class="ref-expense-control"><i>${icon('folder')}</i><select name="sheet">${data.sheets.filter(s=>!s.archived).map(s=>`<option value="${s.id}" ${s.id===x.sheet?'selected':''}>${esc(s.name)}</option>`).join('')}</select></span></label>
   <label class="ref-expense-field"><span class="ref-expense-label">Description · optional</span><span class="ref-expense-control"><i>${icon('receipt')}</i><input name="notes" maxlength="500" placeholder="Add a note" value="${esc(x.notes)}"></span></label>
  </section>

  <section class="ref-expense-receipt-card">
   <div class="ref-receipt-row">${icon('receipt')}<span class="ref-receipt-copy"><strong>Attach receipt</strong><small>Photo or screenshot · optional</small></span><button type="button" class="ref-receipt-action" id="choose-receipt">Choose</button><input type="file" id="receipt-file" class="ref-receipt-file" accept="image/*" hidden></div>
   <div id="receipt-preview">${receipt?`<img class="receipt" alt="Attached receipt" src="${esc(receipt)}">`:''}</div>
   <button type="button" class="text-button ref-remove-receipt" id="remove-receipt" ${receipt?'':'hidden'}>Remove receipt</button>
  </section>

  <section class="ref-expense-calc-card">
   <details class="ref-calc-row"><summary>${icon('calculator')}<span>Calculate an amount</span>${icon('chevron')}</summary><div class="ref-calc-body"><label class="field"><span>Calculation</span><input id="amount-expression" type="text" inputmode="text" autocomplete="off" maxlength="120" placeholder="e.g. 24.50 + 18 + 6 / 2" aria-label="Calculation"></label><button type="button" class="secondary" id="use-calculation">Use total</button><p class="error" id="calculation-error" role="alert"></p></div></details>
  </section>
  <p class="error form-error" role="alert"></p>
  <p class="duplicate-warning" hidden role="alert"></p>
  <section class="ref-expense-submit-card">
   <div class="ref-expense-final-actions">${e?'<button type="button" class="secondary danger" id="delete-expense">Delete</button>':''}<button class="primary" id="save-expense">${icon('check')} ${e?'Save changes':'Save expense'}</button>${!e?'<button class="secondary save-another" type="submit" name="saveMode" value="another">Save & add another</button>':''}</div>
  </section>
 </form>
 <nav class="ref-expense-nav" aria-label="Expense navigation" data-active-index="2">
  <span class="liquid-refract-layer" aria-hidden="true"></span><span class="liquid-selection" aria-hidden="true"></span>
  <button type="button" data-expense-tab="home" data-nav-index="0">${icon('home')}<small>Home</small></button>
  <button type="button" data-expense-tab="sheets" data-nav-index="1">${icon('folder')}<small>Sheets</small></button>
  <button type="button" class="active" data-nav-index="2"><span>${icon('plus')}</span><small>Add</small></button>
  <button type="button" data-expense-tab="settle" data-nav-index="3">${icon('settle')}<small>Settle</small></button>
  <button type="button" data-expense-tab="settings" data-nav-index="4">${icon('settings')}<small>Settings</small></button>
 </nav>`);

 const f=$('#expense-form');
 syncOverlayLayers();
const headerSave=sheet.querySelector('[data-close]');
 headerSave.classList.add('ref-expense-save');
 headerSave.setAttribute('aria-label',e?'Save changes':'Save expense');
 headerSave.innerHTML=icon('check');

 f.addEventListener('invalid',ev=>{const details=ev.target.closest('details');if(details)details.open=true;},true);
 const snapshot=()=>JSON.stringify([...new FormData(f)].filter(([name])=>name!=='saveMode'))+receipt;
 const originalSnapshot=snapshot();
 const requestClose=(leave=()=>sheet.close())=>{if(busy||receiptBusy)return;if(snapshot()===originalSnapshot)return leave();let prompt=f.querySelector('.discard-prompt');if(!prompt){prompt=document.createElement('section');prompt.className='discard-prompt';prompt.setAttribute('role','alert');prompt.innerHTML='<strong>Keep this expense?</strong><p>Your changes haven’t been saved.</p><div><button type="button" class="secondary" data-keep>Keep editing</button><button type="button" class="secondary danger" data-discard>Discard</button></div>';f.prepend(prompt);prompt.querySelector('[data-discard]').onclick=leave;prompt.querySelector('[data-keep]').onclick=()=>{prompt.remove();f.elements.amount.focus();};}prompt.querySelector('[data-discard]').onclick=leave;prompt.scrollIntoView({block:'start'});prompt.querySelector('[data-keep]').focus();};

 sheet.querySelector('[data-modal-back]').onclick=()=>requestClose(backOneModal);
 sheet.oncancel=ev=>{ev.preventDefault();requestClose(backOneModal);};
 headerSave.onclick=()=>f.requestSubmit(f.querySelector('#save-expense'));

 sheet.querySelectorAll('[data-expense-tab]').forEach(b=>b.onclick=()=>requestClose(()=>{sheet.close();tab=b.dataset.expenseTab;render();}));

 f.querySelectorAll('[data-pick]').forEach(input=>{
  const choose=()=>openCatalog(input.dataset.pick,value=>{
   input.value=value;
   if(!e&&input.dataset.pick==='merchants'){
    const last=data.expenses.filter(item=>item.merchant===value).sort((a,b)=>b.date.localeCompare(a.date))[0];
    if(last&&catalogValues(data,'categories').includes(last.category))f.elements.category.value=last.category;
   }
   input.dispatchEvent(new Event('input',{bubbles:true}));
  });
  input.onclick=choose;
  input.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();choose();}};
 });
 const update=()=>{
  const amount=Math.round(Number(f.elements.amount.value)*100)||0,split=f.elements.split.value;
  $('#split-preview').innerHTML=`${esc(couple('a'))}: <strong>${money(split==='half'?Math.floor(amount/2):split==='a'?amount:0)}</strong><br>${esc(couple('b'))}: <strong>${money(split==='half'?amount-Math.floor(amount/2):split==='b'?amount:0)}</strong>`;
 };
 let duplicateAccepted='';
 f.oninput=()=>{
  duplicateAccepted='';
  f.querySelector('.duplicate-warning').hidden=true;
  $('#save-expense').innerHTML=icon('check')+' Save expense';
  update();
 };
 update();
 $('#use-calculation').onclick=()=>{
  try{
   f.elements.amount.value=(calculateAmount($('#amount-expression').value)/100).toFixed(2);
   $('#calculation-error').textContent='';
   f.querySelector('.ref-calc-row').open=false;
   f.elements.amount.dispatchEvent(new Event('input',{bubbles:true}));
  }catch(err){$('#calculation-error').textContent=err.message;}
 };
 $('#amount-expression').onkeydown=ev=>{if(ev.key==='Enter'){ev.preventDefault();$('#use-calculation').click();}};
 $('#choose-receipt').onclick=()=>$('#receipt-file').click();
 $('#receipt-file').onchange=async ev=>{
  if(!ev.target.files[0])return;
  receiptBusy=true;$('#save-expense').disabled=true;headerSave.disabled=true;
  try{
   receipt=await compressImage(ev.target.files[0]);
   $('#receipt-preview').innerHTML=`<img class="receipt" alt="Attached receipt" src="${esc(receipt)}">`;
   $('#remove-receipt').hidden=false;
   f.querySelector('.form-error').textContent='';
  }catch(err){errorIn(f,err);}
  finally{receiptBusy=false;$('#save-expense').disabled=false;headerSave.disabled=false;}
 };
 $('#remove-receipt').onclick=()=>{receipt='';$('#receipt-preview').innerHTML='';$('#receipt-file').value='';$('#remove-receipt').hidden=true;};
 if(e)$('#delete-expense').onclick=()=>deleteExpense(e.id);
 f.onsubmit=async ev=>{
  ev.preventDefault();
  if(receiptBusy)return;
  const v=new FormData(f),raw=String(v.get('amount'));
  if(!/^\d+(\.\d{1,2})?$/.test(raw))return errorIn(f,'Enter an amount with no more than two decimal places.');
  if(!v.get('merchant')||!v.get('category'))return errorIn(f,'Choose a merchant and category.');
  const cents=Math.round(Number(raw)*100);
  if(cents<=0||cents>999999999)return errorIn(f,'Enter an amount from $0.01 to $9,999,999.99.');
  const duplicateKey=JSON.stringify([v.get('merchant'),cents,v.get('date'),v.get('payer'),v.get('sheet')]);
  if(!e&&duplicateAccepted!==duplicateKey&&data.expenses.some(item=>item.merchant.toLowerCase()===v.get('merchant').toLowerCase()&&item.cents===cents&&item.date===v.get('date')&&item.payer===Number(v.get('payer'))&&item.sheet===v.get('sheet'))){
   duplicateAccepted=duplicateKey;
   const warning=f.querySelector('.duplicate-warning');
   warning.hidden=false;
   warning.textContent='A matching expense already exists for this person, date and sheet. Save again only if this is a separate purchase.';
   $('#save-expense').textContent='Save anyway';
   warning.scrollIntoView({block:'nearest'});
   return;
  }
  const another=ev.submitter?.value==='another';
  try{
   const saved=await save({action:'expense',expense:{id:e?.id,creator:e?.creator,merchant:v.get('merchant'),cents,category:v.get('category'),date:v.get('date'),payer:Number(v.get('payer')),visibility:'shared',split:v.get('split')||'half',sheet:v.get('sheet'),notes:v.get('notes'),receipt}});
   if(saved){
    activeSheet=v.get('sheet');
    render();
    if(another)expenseForm(null,{category:v.get('category'),payer:Number(v.get('payer')),visibility:'shared',split:v.get('split')||'half'});
    else sheet.close();
    toast(another?'Saved. Ready for the next one.':'Expense saved');
   }
  }catch(err){errorIn(f,err);}
 };
}
async function compressImage(file){if(file.size>20000000)throw new Error('Please choose a receipt under 20 MB.');const url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();const scale=Math.min(1,1300/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);let output;for(const q of [.8,.65,.5,.35]){output=canvas.toDataURL('image/jpeg',q);if(output.length<390000)return output;}throw new Error('Receipt is too detailed. Try cropping the image.');}catch(e){throw new Error(e.message.includes('Receipt')?e.message:'This image could not be opened. Try a screenshot or JPEG receipt.');}finally{URL.revokeObjectURL(url);}}
function newSheet(edit=null){modal(edit?'Edit sheet':'New sheet',`<form id="new-sheet-form"><label class="field"><span>Sheet name</span><input name="name" placeholder="October expenses" value="${esc(edit?.name||'')}" required maxlength="60"></label><div class="two"><label class="field"><span>Starts on</span><input name="start" type="date" value="${edit?.start||today()}" required></label><label class="field"><span>Ends on · optional</span><input name="end" type="date" value="${edit?.end||''}"></label></div><p class="error" role="alert"></p><button class="primary full">${edit?'Save changes':'Create sheet'}</button></form>`);$('#new-sheet-form').onsubmit=async e=>{e.preventDefault();const f=e.target,v=new FormData(f);if(v.get('end')&&v.get('end')<v.get('start'))return errorIn(f,'End date must follow start date.');try{await save({action:edit?'sheet-edit':'sheet',id:edit?.id,name:v.get('name'),start:v.get('start'),end:v.get('end')});activeSheet=edit?.id||data.sheets[0].id;tab='sheets';sheetFilter='open';render();sheet.close();toast(edit?'Sheet updated':'Sheet created');}catch(err){errorIn(f,err);}};}
function confirmDialog(title,description,run,label='Confirm'){modal(title,`<p class="muted">${esc(description)}</p><p class="error" role="alert"></p><button class="primary full" id="confirm-action">${esc(label)}</button>`);$('#confirm-action').onclick=async()=>{const b=$('#confirm-action');b.disabled=true;try{await run();}catch(e){sheet.querySelector('.error').textContent=e.message;b.disabled=false;}};}
function settleDialog(){const b=balance(scope());confirmDialog('Record settlement?',b.net?`Confirm ${couple(b.net>0?'b':'a')} has paid ${money(b.amount)} to ${couple(b.net>0?'a':'b')}. This records a payment; it does not transfer money. Shared expenses on ${currentName()} will be locked.`:`Close the balanced shared expenses on ${currentName()}? They will be locked.`,async()=>{await save({action:'settle',sheet:activeSheet});sheet.close();toast('Settlement recorded');},'Confirm settlement');}
function exportCSV(items=data.expenses){const cell=v=>'"'+String(v??'').replace(/^\s*[=+@-]/,"'$&").replaceAll('"','""')+'"';const rows=[['Date','Merchant','AUD','Category','Paid by','Added by','Split','Sheet','Settled','Notes'],...items.map(e=>[e.date,e.merchant,(e.cents/100).toFixed(2),e.category,data.names[e.payer],expenseAuthor(e),expenseShareLabel(e),data.sheets.find(s=>s.id===e.sheet)?.name,e.settlement?'Yes':'No',e.notes])];const file=new File(['\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n')],`together-expenses-${today()}.csv`,{type:'text/csv'});if(navigator.canShare?.({files:[file]})){navigator.share({files:[file]}).catch(e=>{if(e.name!=='AbortError')download(file);});}else download(file);}
function download(file){const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
if(navigator.modelContext?.registerTool){navigator.modelContext.registerTool({name:'open_expense_form',description:'Open the household expense form for user review. Does not save an expense.',inputSchema:{type:'object',properties:{merchant:{type:'string'}},additionalProperties:false},execute:async({merchant=''})=>{if(!data)return{content:[{type:'text',text:'Sign in to your household first.'}]};expenseForm(null,{merchant});return{content:[{type:'text',text:'Expense form opened. The user can review and save.'}]};}});}
async function init(){const fragment=location.hash;if(fragment){history.replaceState(null,'',location.pathname);auth();try{await openLink(location.origin+'/'+fragment);}catch(e){toast(e.message);}return;}if(credentials){app.innerHTML='<div class="loading"><img src="/icon.svg" alt=""><p class="muted">Opening your household…</p></div>';await refresh(false);}else auth();}
init();
setInterval(()=>{if(data&&!demo&&!sheet.open&&!busy&&document.visibilityState==='visible')refresh(false);},30000);
document.addEventListener('visibilitychange',()=>{if(data&&!demo&&!sheet.open&&!busy&&document.visibilityState==='visible')refresh(false);});

function bindSheetControls(){
 const input=$('#sheet-search');if(input)input.oninput=e=>{sheetSearch=e.target.value;const pos=e.target.selectionStart;render();$('#sheet-search').focus();$('#sheet-search').setSelectionRange(pos,pos);};
 app.querySelectorAll('[data-sheet-filter]').forEach(b=>b.onclick=()=>{sheetFilter=b.dataset.sheetFilter;render();});
 app.querySelectorAll('[data-sheet-options]').forEach(b=>b.onclick=()=>sheetOptions(b.dataset.sheetOptions));
 app.querySelectorAll('[data-sheet-edit]').forEach(b=>b.onclick=()=>newSheet(data.sheets.find(s=>s.id===b.dataset.sheetEdit)));
 app.querySelectorAll('[data-sheet-pin]').forEach(b=>b.onclick=()=>sheetAction('pin',b.dataset.sheetPin));
 app.querySelectorAll('[data-sheet-archive]').forEach(b=>b.onclick=()=>sheetAction('archive',b.dataset.sheetArchive));
 app.querySelectorAll('[data-sheet-delete]').forEach(b=>b.onclick=()=>deleteSheet(b.dataset.sheetDelete));
 app.querySelectorAll('[data-swipe-sheet]').forEach(row=>{
  const front=row.querySelector('.sheet-front');let startX=0,startY=0,base=0,drag=false,moved=false,offset=0;
  const setOffset=value=>{offset=value;front.style.transform=`translateX(${value}px)`;row.querySelectorAll('.swipe-actions').forEach(a=>{const exposed=(value>0&&a.classList.contains('left'))||(value<0&&a.classList.contains('right'));a.setAttribute('aria-hidden',String(!exposed));a.querySelectorAll('button').forEach(b=>b.tabIndex=exposed?0:-1);});};
  front.addEventListener('pointerdown',e=>{if(e.button!==0||e.clientX<=24)return;startX=e.clientX;startY=e.clientY;base=offset;drag=false;moved=false;});
  front.addEventListener('pointermove',e=>{if(!e.buttons)return;const dx=e.clientX-startX,dy=e.clientY-startY;if(!drag){if(Math.abs(dy)>Math.abs(dx)||Math.abs(dx)<10)return;drag=true;moved=true;front.setPointerCapture(e.pointerId);front.classList.add('dragging');}setOffset(Math.max(-132,Math.min(132,base+dx)));});
  const finish=()=>{if(!drag)return;drag=false;front.classList.remove('dragging');setOffset(offset>48?132:offset< -48?-132:0);};
  front.addEventListener('pointerup',finish);front.addEventListener('pointercancel',()=>{drag=false;front.classList.remove('dragging');setOffset(0);});
  front.addEventListener('click',e=>{if(moved){e.preventDefault();e.stopImmediatePropagation();moved=false;}else if(offset){e.preventDefault();e.stopImmediatePropagation();setOffset(0);}},true);
 });
}
async function sheetAction(actionName,id){try{await save({action:actionName,id});if(actionName==='pin')activeSheet=id;toast('Sheet updated');return true;}catch(e){toast(e.message);return false;}}
function canDeleteSheet(id){return !data.settlements.some(s=>s.sheet===id)&&data.expenses.filter(e=>e.sheet===id).every(canManageExpense);}
function sheetOptions(id){const s=data.sheets.find(s=>s.id===id);modal(s.name,`<div class="sheet-option-list"><button class="secondary" id="option-edit">${icon('edit')} Edit sheet</button><button class="secondary" id="option-pin">${icon('pin')} ${s.pinned?'Unpin':'Pin'} sheet</button><button class="secondary" id="option-archive">${icon('archive')} ${s.archived?'Reopen':'Archive'} sheet</button><button class="secondary danger" id="option-delete" ${canDeleteSheet(id)?'':'disabled'}>${icon('trash')} Delete sheet</button></div>${canDeleteSheet(id)?'':'<p class="small muted">This sheet includes someone else’s expenses or settled records, so it cannot be deleted.</p>'}`);$('#option-edit').onclick=()=>newSheet(s);$('#option-pin').onclick=async()=>{if(await sheetAction('pin',id))sheet.close();};$('#option-archive').onclick=async()=>{if(await sheetAction('archive',id))sheet.close();};$('#option-delete').onclick=()=>deleteSheet(id);}
function deleteSheet(id){if(!canDeleteSheet(id))return toast('This sheet contains expenses you cannot delete.');const s=data.sheets.find(s=>s.id===id);const count=data.expenses.filter(e=>e.sheet===id).length;confirmDialog('Delete sheet?',`Delete “${s.name}” and its ${count} expense${count===1?'':'s'}? This cannot be undone. Sheets containing settled records or expenses you cannot delete must be archived instead.`,async()=>{await save({action:'sheet-delete',id});if(activeSheet===id)activeSheet=data.sheets.find(s=>!s.archived)?.id||'';tab='sheets';render();sheet.close();toast('Sheet deleted');},'Delete sheet');}
let catalogDialog=null;
function catalogIcon(name){return /internet/i.test(name)?'wifi':/rent/i.test(name)?'home':/entertain|movie/i.test(name)?'movie':/shopping/i.test(name)?'gift':/other/i.test(name)?'tag':/bills/i.test(name)?'receipt':catIcon(name);}
function openCatalog(kind,onPick=null){
 if(!catalogDialog){
  catalogDialog=document.createElement('dialog');
  catalogDialog.id='catalog-dialog';
  catalogDialog.className='catalog-dialog';
  catalogDialog.addEventListener('click',ev=>{
   if(ev.target!==catalogDialog||busy)return;
   const back=catalogDialog.querySelector('#catalog-back');
   if(back)back.click();else catalogDialog.close();
  });
  catalogDialog.addEventListener('close',syncOverlayLayers);
  document.body.append(catalogDialog);
 }
 const dlg=catalogDialog,title=kind==='merchants'?'Merchants':'Categories',field=kind==='merchants'?'merchant':'category';let query='';
 dlg.dataset.catalogKind=kind;
 const head=(heading,back,plus)=>{
  dlg.innerHTML=`<div class="catalog-handle" aria-hidden="true"></div><header class="catalog-head"><button type="button" class="catalog-back" id="catalog-back" aria-label="Back">${backIcon()}</button><h2 id="catalog-title" tabindex="-1">${heading}</h2>${plus?`<button type="button" class="catalog-add" id="catalog-add" aria-label="Add ${field}">${icon('plus')}</button>`:'<span class="head-spacer"></span>'}</header>`;
  dlg.setAttribute('aria-labelledby','catalog-title');
  dlg.querySelector('#catalog-back').onclick=back;
  dlg.oncancel=ev=>{ev.preventDefault();back();};
 };
 const browse=()=>{
  head(title,()=>dlg.close(),true);
  dlg.insertAdjacentHTML('beforeend',`<div class="catalog-body"><label class="catalog-search-wrap">${icon('search')}<input id="catalog-search" type="search" placeholder="Search ${title.toLowerCase()}" aria-label="Search ${title.toLowerCase()}" value="${esc(query)}"></label><div class="catalog-section-head"><span>All ${title.toLowerCase()}</span><small>${catalogValues(data,kind).length} saved</small></div><div class="catalog-list"></div><p class="catalog-note">Usage counts include all household expenses. Renaming or removing an option does not change past expenses.</p></div>`);
  dlg.querySelector('#catalog-add').onclick=()=>edit();
  const rows=()=>{
   const names=catalogValues(data,kind).filter(n=>n.toLowerCase().includes(query.toLowerCase()));
   if(kind==='merchants')names.sort((a,b)=>a.localeCompare(b));
   dlg.querySelector('.catalog-list').innerHTML=names.length?names.map(n=>{
    const count=data.expenses.filter(e=>e[field]===n).length;
    return `<div class="catalog-row"><button type="button" class="catalog-choice" data-choice="${esc(n)}"><span class="catalog-icon ${kind==='merchants'?'merchant-icon':catalogIcon(n)}">${icon(kind==='merchants'?'store':catalogIcon(n))}</span><span class="catalog-name">${esc(n)}</span><span class="catalog-count" aria-label="${count} uses">${count}</span></button><button type="button" class="catalog-edit" data-edit-choice="${esc(n)}" aria-label="Edit ${esc(n)}">${icon('edit')}</button></div>`;
   }).join(''):'<div class="catalog-empty"><span>'+icon('search')+'</span><strong>No matches</strong><p>Try another search or add a new '+field+'.</p></div>';
   dlg.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{if(onPick){onPick(b.dataset.choice);dlg.close();}else edit(b.dataset.choice);});
   dlg.querySelectorAll('[data-edit-choice]').forEach(b=>b.onclick=()=>edit(b.dataset.editChoice));
  };
  rows();
  dlg.querySelector('#catalog-search').oninput=e=>{query=e.target.value;rows();};
  dlg.scrollTop=0;
 };
 const edit=(previous=null)=>{
  head(`${previous?'Edit':'Add'} ${field}`,browse,false);
  dlg.insertAdjacentHTML('beforeend',`<div class="catalog-body"><section class="catalog-edit-card"><span class="catalog-edit-icon">${icon(kind==='merchants'?'store':'tag')}</span><div><p class="catalog-edit-kicker">${previous?'UPDATE':'NEW'} ${field.toUpperCase()}</p><h3>${previous?'Rename '+field:'Add '+field}</h3></div><form id="catalog-form"><label class="field"><span>Name</span><input name="name" value="${esc(previous||'')}" required maxlength="${kind==='merchants'?80:40}" autocomplete="off" placeholder="${kind==='merchants'?'e.g. Woolworths':'e.g. Groceries'}"></label><p class="error" role="alert"></p><button class="primary full">${previous?'Save changes':'Add '+field}</button>${previous?'<button type="button" id="catalog-remove" class="secondary full danger">Remove from list</button>':''}</form></section></div>`);
  const form=dlg.querySelector('form');
  form.onsubmit=async ev=>{
   ev.preventDefault();
   const button=form.querySelector('.primary');button.disabled=true;
   try{
    const name=new FormData(form).get('name').trim();
    await save({action:'catalog',kind,operation:previous?'rename':'add',name,previous});
    if(onPick){onPick(name);dlg.close();}else{query='';browse();}
   }catch(e){errorIn(form,e);button.disabled=false;}
  };
  if(previous)dlg.querySelector('#catalog-remove').onclick=async()=>{
   const button=dlg.querySelector('#catalog-remove');button.disabled=true;
   try{await save({action:'catalog',kind,operation:'remove',previous});browse();}
   catch(e){errorIn(form,e);button.disabled=false;}
  };
 };
 browse();
 if(!dlg.open)dlg.showModal();
 syncOverlayLayers();
 dlg.querySelector('#catalog-title').focus({preventScroll:true});
}

// Journal tools: derived from all household expenses.
function bindJournal(){
 app.querySelectorAll('[data-repeat]').forEach(b=>b.onclick=()=>repeatExpense(b.dataset.repeat));
 if($('#expense-sort'))$('#expense-sort').onchange=e=>{expenseFilters.sort=e.target.value;render();};
}
function journalAction(a){
 if(a==='insights')insightsDialog();
 else if(a==='entry-preferences')preferencesDialog();
 else if(a==='filters')filtersDialog();
 else if(a==='reset-filters'){search='';filter='all';expenseFilters={payer:'',category:'',from:'',to:'',sort:'newest'};render();}
 else if(a==='export-filtered')exportCSV(filteredExpenses());
 else if(a==='settlement-summary')settlementSummary();
 else if(a==='settlement-history')settlementHistory();
 else return false;
 return true;
}
function repeatExpense(id){const e=data.expenses.find(x=>x.id===id);if(!e)return toast('Expense no longer exists.');expenseForm(null,{...repeatPreset(e),repeat:true});}
function preferenceKey(){return `together-entry:${data.id}:${data.seat}`;}
function entryPreferences(){
 try{const p=JSON.parse((demo?sessionStorage:localStorage).getItem(preferenceKey())||'{}');return {category:catalogValues(data,'categories').includes(p.category)?p.category:'Groceries',split:['half','a','b'].includes(p.split)?p.split:'half',visibility:'shared'};}catch{return {};}
}
function preferencesDialog(){
 const p=entryPreferences();modal('Make adding quicker',`<p class="small muted">Choose how a new expense starts. You can change these on each entry. Saved for your household on this device.</p><form id="preferences-form"><label class="field"><span>Default category</span><select name="category">${catalogValues(data,'categories').map(c=>`<option value="${esc(c)}" ${c===p.category?'selected':''}>${esc(c)}</option>`).join('')}</select></label><p class="small muted">Every expense is visible to your household.</p><label class="field"><span>Default split</span><select name="split">${splitOptions(p.split||'half')}</select></label><p class="small muted">The payer starts as you. Repeating an expense uses that expense’s details.</p><p class="error" role="alert"></p><button class="primary full">Save preferences</button></form>`);
 $('#preferences-form').onsubmit=e=>{e.preventDefault();const p=Object.fromEntries(new FormData(e.target));try{(demo?sessionStorage:localStorage).setItem(preferenceKey(),JSON.stringify(p));sheet.close();toast('Entry preferences saved');}catch{errorIn(e.target,'This browser could not save preferences. Please allow site storage.');}};
}
function filtersDialog(){
 const f=expenseFilters,categories=[...new Set(scope().map(e=>e.category))].sort((a,b)=>a.localeCompare(b));
 modal('Find an expense',`<form id="filter-form"><label class="field"><span>Paid by</span><select name="payer"><option value="">Everyone</option>${data.names.map((n,i)=>`<option value="${i}" ${f.payer===String(i)?'selected':''}>${esc(n)}</option>`).join('')}</select></label><label class="field"><span>Category</span><select name="category"><option value="">All categories</option>${categories.map(c=>`<option value="${esc(c)}" ${f.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label><div class="two"><label class="field"><span>From · optional</span><input type="date" name="from" value="${f.from}"></label><label class="field"><span>To · optional</span><input type="date" name="to" value="${f.to}"></label></div><p class="error" role="alert"></p><div class="form-actions"><button type="button" class="secondary" id="clear-filters">Clear</button><button class="primary">Show expenses</button></div></form>`);
 $('#clear-filters').onclick=()=>{journalAction('reset-filters');sheet.close();};$('#filter-form').onsubmit=e=>{e.preventDefault();const next=Object.fromEntries(new FormData(e.target));if(next.from&&next.to&&next.from>next.to)return errorIn(e.target,'Choose an end date on or after the start.');expenseFilters={...expenseFilters,...next};sheet.close();render();};
}
function insightsDialog(){
 const items=insightPeriod==='sheet'?scope():insightPeriod==='month'?data.expenses.filter(e=>e.date.slice(0,7)===today().slice(0,7)):data.expenses;
 const stats=summarizeSpending(items),label=insightPeriod==='sheet'?currentName():insightPeriod==='month'?new Date().toLocaleDateString('en-AU',{month:'long',year:'numeric'}):'All your sheets';
 modal('Spending insights',`<div class="switches insight-periods">${[['sheet','This sheet'],['month','This month'],['all','All time']].map(([id,t])=>`<button data-insight-period="${id}" class="${insightPeriod===id?'selected':''}" aria-pressed="${insightPeriod===id}">${t}</button>`).join('')}</div><p class="small muted insight-context">${esc(label)} · all household expenses</p><div class="insight-hero"><span>Total spending</span><strong>${money(stats.total)}</strong><div><span>${stats.count} expenses</span><span>${money(stats.average)} average</span></div></div><div class="insight-split"><div><small>50 / 50</small><strong>${money(stats.equalSplit)}</strong></div><div><small>Assigned to one couple</small><strong>${money(stats.coupleAssigned)}</strong></div></div>${stats.count?`<div class="section-head"><h3>By category</h3><span class="small muted">Share of total</span></div><div class="glass spending-panel">${stats.categories.map(([c,n])=>`<div class="budget-row"><div class="between small"><span>${esc(c)}</span><strong>${money(n)}</strong></div><div class="bar" role="img" aria-label="${esc(c)}: ${Math.round(n/stats.total*100)} percent of spending"><i style="width:${n/stats.total*100}%"></i></div></div>`).join('')}</div><div class="section-head"><h3>Who paid</h3></div><div class="glass payer-list">${stats.people.map((n,i)=>`<div class="payer-line"><span class="avatar ${group(i)==='b'?'b':''}">${esc(initials(data.names[i]))}</span><span>${esc(data.names[i])}</span><strong>${money(n)}</strong></div>`).join('')}</div>`:'<div class="empty"><p>Add expenses to see where your money goes.</p></div>'}<p class="small muted">Includes settled expenses. These are spending totals, not amounts owed.</p><button class="secondary full" id="export-insights">${icon('receipt')} Export these expenses</button>`);
 sheet.querySelectorAll('[data-insight-period]').forEach(b=>b.onclick=()=>{insightPeriod=b.dataset.insightPeriod;insightsDialog();});$('#export-insights').onclick=()=>exportCSV(items);
}
function settlementHistory(){
 const history=data.settlements.filter(s=>s.sheet===activeSheet);
 modal('Payment history',history.length?`<div class="history-modal-list">${history.map(r=>`<div class="history-modal-row"><span class="liquid-history-icon">${icon('check')}</span><span><strong>${r.net?`${esc(couple(r.net>0?'b':'a'))} → ${esc(couple(r.net>0?'a':'b'))}`:'Balanced expenses closed'}</strong><small>${new Date(r.date).toLocaleDateString('en-AU')} · ${r.count} expenses</small></span><b>${money(Math.abs(r.net))}</b></div>`).join('')}</div>`:`<div class="liquid-empty"><span class="liquid-empty-icon">${icon('receipt')}</span><h3>No payments recorded yet</h3><p>Your settlement history will appear here.</p></div>`);
}
function settlementSummary(){
 const items=scope().filter(e=>!e.settlement),b=balance(items),a=settlementOverview(items,'a'),c=settlementOverview(items,'b'),text=`Together · ${currentName()}\n${b.net?`${couple(b.net>0?'b':'a')} owes ${money(b.amount)} to ${couple(b.net>0?'a':'b')}.`:'Both couples are balanced.'}\n${items.length} unsettled expenses · Total ${money(a.total)}\n${couple('a')}: share ${money(a.share)} · paid ${money(a.paid)}\n${couple('b')}: share ${money(c.share)} · paid ${money(c.paid)}\nAs of ${new Date().toLocaleDateString('en-AU')}. Please check Together for the latest balance.\nThis is a summary, not a payment confirmation.`;
 modal('Settlement summary',`<p class="small muted">A ready-to-copy note for your household. Includes all unsettled expenses and both couples’ shares. Private access links are excluded.</p><textarea id="settlement-text" readonly rows="9" aria-label="Settlement summary">${esc(text)}</textarea><button id="copy-summary" class="primary full" style="margin-top:14px">${icon('copy')} Copy summary</button><p class="small muted" id="copy-status" role="status"></p>`);
 $('#copy-summary').onclick=async()=>{try{await navigator.clipboard.writeText(text);$('#copy-status').textContent='Copied. Paste it into your household chat.';}catch{$('#settlement-text').select();$('#copy-status').textContent='Select and copy the summary above.';}};
}
