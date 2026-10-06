import {billUI} from './bill-dialogs.js';
import {expenseHistory} from './expense-history.js';
import {changeRecurring} from './recurring.js';
import {periodInsight} from './period-insights.js';
import {frequentMerchants} from './entry-shortcuts.js';
import {scanReceipt,parseReceipt} from './receipt-scan.js';
import {createNavigationTrail,installEdgeBack} from './back-navigation.js';
import {settlementOverview,householdOverview} from './settlement-overview.js';
import {draftKey,readDraft,writeDraft} from './drafts.js';
import {householdExpense,canManageExpenseAs} from './expense-policy.js';
import {catalogValues,changeCatalog} from './catalog.js';
import {filterExpenses,repeatPreset} from './journal.js';
import {bindAmountCalculator} from './amount-calculator.js';
const $=s=>document.querySelector(s), app=$('#app'), sheet=$('#sheet');
const paths={wifi:'M3 8a14 14 0 0 1 18 0M6 12a9 9 0 0 1 12 0M9 16a4 4 0 0 1 6 0M12 20h.01',gift:'M3 8h18v5H3ZM5 13v8h14v-8M12 8v13M12 8C3 8 5 0 9 3l3 5ZM12 8c9 0 7-8 3-5l-3 5Z',movie:'M3 9h18v12H3ZM3 9 2 4l18-3 1 5ZM7 3l3 4m4-5 3 4',tag:'M3 3h8l10 10-8 8L3 11ZM7 7h.01',edit:'m15 4 5 5M4 20l4-1L21 6l-4-4L4 15Z',pin:'m8 3 8 0-1 7 3 4H6l3-4ZM12 14v8',archive:'M3 3h18v5H3ZM5 8v13h14V8M9 12h6',trash:'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',store:'M3 10h18L19 3H5ZM5 10v11h14V10M9 21v-7h6v7',home:'M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',list:'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',settle:'M19 6v5h-5M5 18v-5h5M6.2 8A7 7 0 0 1 18.8 6M5.2 18A7 7 0 0 0 17.8 16M12 5v14M15.5 8c-.8-1-2-1.5-3.5-1.5-2.1 0-3.5 1-3.5 2.5 0 1.7 1.5 2.3 3.6 2.7 2.1.4 3.4 1 3.4 2.8 0 1.6-1.4 2.8-3.5 2.8-1.6 0-2.9-.5-3.8-1.5',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',plus:'M12 5v14M5 12h14',close:'m6 6 12 12M6 18 18 6',food:'M4 3v6q0 3 3 3V3m0 9v9M18 3q-5 5 0 10v8M18 3v10',groceries:'m3 4 2 0 3 12h11l2-8H6M9 21h.01M18 21h.01',bills:'m13 2-9 12h7l-1 8 10-12h-7Z',travel:'M3 16h18M5 16l1-8h12l2 8M7 20v-4m10 4v-4M8 12h.01M16 12h.01',other:'M4 5h16v15H4zM8 2v6m8-6v6M4 10h16',check:'m5 12 4 4L19 6',lock:'M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4',folder:'M3 6V4h7l3 3h8v13H3Z',arrow:'M5 12h14m-5-5 5 5-5 5',refresh:'M20 7v5h-5M4 17v-5h5M5 7a8 8 0 0 1 13-2l2 3M4 16l2 3a8 8 0 0 0 13-2',receipt:'M5 3h14v18l-3-2-4 2-4-2-3 2ZM8 7h8M8 11h8M8 15h4',moon:'M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10'};
Object.assign(paths,{calendar:'M6 2v3m12-3v3M3 8h18M5 4h14a2 2 0 0 1 2 2v15H3V6a2 2 0 0 1 2-2ZM7 12h.01M12 12h.01M17 12h.01M7 16h.01M12 16h.01M17 16h.01',user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',search:'m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',people:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M13 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',chevron:'m9 5 7 7-7 7',settings:'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1ZM16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',chart:'M4 20V10m6 10V4m6 16v-7m5 7H2',copy:'M8 8h13v13H8ZM16 8V3H3v13h5',calculator:'M5 2h14v20H5ZM8 6h8M8 11h1m6 0h1m-8 4h1m6 0h1m-8 4h1m6 0h1',filter:'M3 5h18M6 12h12M10 19h4',sun:'M12 3v2m0 14v2M3 12h2m14 0h2M5.64 5.64l1.42 1.42m9.88 9.88 1.42 1.42M18.36 5.64l-1.42 1.42M7.06 16.94l-1.42 1.42M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',dots:'M5 12h.01M12 12h.01M19 12h.01'});
const icon=n=>`<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[n]||paths.other}"/></svg>`;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=c=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(c/100);
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const uid=()=>crypto.randomUUID();const group=n=>n<2?'a':'b';
const bills=billUI({getData:()=>data,modal,save,close:()=>sheet.close(),esc,money,today,toast,splitOptions,errorIn,pick:(kind,onPick,selected)=>openCatalog(kind,onPick,selected)});
const recurringDialog=()=>bills.list(),recurringHomeCard=()=>bills.homeCard();
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
 if(!sheet.open){modalTrail=[];if(data&&!busy)render();}
 syncOverlayLayers();
});
sheet.addEventListener('click',ev=>{
 if(ev.target!==sheet||busy)return;
 const back=sheet.querySelector('[data-modal-back]');
 if(back)back.click();else sheet.close();
});
installEdgeBack({canGoBack:()=>!busy&&(sheet.open||!!document.querySelector('#catalog-dialog[open]')||isInnerPage()),goBack});
let sheetSearch='',sheetFilter='open',settleCouple=null,settleSpendMode='category',settleAll=true,unsettledOnly=false;
let flushExpenseDraft=null,refreshing=false;
const receiptCache=new Map();
const emptyExpenseFilters=()=>({payer:'',creator:'',receipt:'',category:'',from:'',to:'',sort:'newest'});
let expenseFilters=emptyExpenseFilters();
let data=null,credentials=null,demo=false,tab='home',filter='open',search='',activeSheet='',joinInfo=null,busy=false;
try{credentials=JSON.parse(localStorage.getItem('together-access'));}catch{}
document.body.classList.toggle('theme-dark',document.documentElement.dataset.theme==='dark');
function syncThemeColor(){
 const dark=document.body.classList.contains('theme-dark');
 document.documentElement.dataset.theme=dark?'dark':'light';
 document.querySelector('meta[name=theme-color]').content=dark?'#0d1421':'#f4f7fc';
}
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
 sheet.oncancel=ev=>{if(ev.target!==sheet)return;ev.preventDefault();sheet.querySelector('[data-modal-back]').click();};
 sheet.querySelector('[data-close]').onclick=()=>sheet.close();sheet.setAttribute('aria-labelledby','dialog-title');
 if(!sheet.open)sheet.showModal();
 syncOverlayLayers();
 sheet.scrollTop=0;sheet.querySelector('#dialog-title').focus({preventScroll:true});
}
function errorIn(form,e){const el=form.querySelector('.form-error')||form.querySelector('.error');if(el)el.textContent=e.message||e;else toast(e.message||e);}
async function api(body){const res=await fetch('/api/household',{method:'POST',headers:{'Content-Type':'application/json',...(credentials?{Authorization:`Bearer ${credentials.key}`}:{})},body:JSON.stringify({house:credentials?.house,rev:data?.rev,receiptMode:'reference',...body}),signal:AbortSignal.timeout(20000)});const j=await res.json();if(!res.ok)throw Object.assign(new Error(j.error||'Could not save changes.'),{status:res.status});return j;}
function demoMutation(b){if(b.action==='recurring'||b.action==='recurring-record'){changeRecurring(data,data.seat,b,{id:uid,record:(expense,link)=>{demoMutation({action:'expense',expense});data.rev--;data.expenses[0].recurring=link;}});}if(b.action==='catalog')changeCatalog(data,b);if(b.action==='sheet-edit')Object.assign(data.sheets.find(s=>s.id===b.id),{name:b.name,start:b.start,end:b.end});if(b.action==='sheet-delete'){if(data.expenses.some(e=>e.sheet===b.id&&!canManageExpense(e)))throw new Error('This sheet contains protected records. Archive it instead.');data.expenses=data.expenses.filter(e=>e.sheet!==b.id);data.sheets=data.sheets.filter(s=>s.id!==b.id);}if(b.action==='expense'){const previous=data.expenses.find(e=>e.id===b.expense.id);if(previous&&!canManageExpense(previous))throw new Error('Only the person who added this expense can edit it.');const e={...householdExpense(b.expense),id:b.expense.id||uid(),creator:previous?.creator??data.seat,created:previous?.created||new Date().toISOString(),settlement:null};e.history=expenseHistory(previous,e,data.seat,data.names);if(previous?.recurring)e.recurring=previous.recurring;data.expenses=data.expenses.filter(x=>x.id!==e.id);data.expenses.unshift(e);}if(b.action==='delete'){if(!canManageExpense(data.expenses.find(e=>e.id===b.id)))throw new Error('This expense cannot be deleted.');data.expenses=data.expenses.filter(x=>x.id!==b.id);}if(b.action==='settings'){data.name=b.name;data.names=b.names;}if(b.action==='sheet')data.sheets.unshift({id:uid(),name:b.name,start:b.start,end:b.end,pinned:false,archived:false});if(b.action==='pin'){const was=data.sheets.find(s=>s.id===b.id)?.pinned;data.sheets.forEach(s=>s.pinned=s.id===b.id&&!was);}if(b.action==='archive'){const s=data.sheets.find(s=>s.id===b.id);if(!s.archived&&data.expenses.some(e=>e.sheet===s.id&&!e.settlement))throw new Error('Settle expenses before archiving.');s.archived=!s.archived;}if(b.action==='settle'){const es=data.expenses.filter(e=>e.sheet===b.sheet&&!e.settlement);const record={id:uid(),sheet:b.sheet,net:balance(es).net,date:new Date().toISOString(),count:es.length,by:data.seat,names:[...data.names],expenses:es.map(e=>e.id)};es.forEach(e=>e.settlement=record.id);data.settlements.unshift(record);}if(b.action==='settlement-reverse'){const r=data.settlements.find(r=>r.id===b.id);if(!r||r.by!==data.seat||r.reversed)throw new Error('This settlement cannot be reversed.');r.reversed={by:data.seat,date:new Date().toISOString(),reason:b.reason};data.expenses.filter(e=>e.settlement===r.id).forEach(e=>e.settlement=null);const sh=data.sheets.find(s=>s.id===r.sheet);if(sh)sh.archived=false;}data.rev++;}
async function save(b){if(busy)return;busy=true;sheet.classList.add('saving');try{if(demo)demoMutation(b);else data=(await api(b)).data;render();return true;}catch(e){if(e.status===409){await refresh(false);e.message='New changes arrived. Review your entry and save again.';}throw e;}finally{busy=false;sheet.classList.remove('saving');}}
async function refresh(notify=true){
 if(refreshing)return;refreshing=true;
 try{
  const result=await api({action:'read',knownRev:data?.rev});
  if(result.data){data=result.data;if(!activeSheet)activeSheet=data.sheets.find(s=>s.pinned&&!s.archived)?.id||data.sheets.find(s=>!s.archived)?.id||'';render();}
  if(notify)toast('Up to date');
 }catch(e){if(!data)auth();if(notify||!data)toast(navigator.onLine?e.message:'You’re offline. Reconnect to load your household.');}
 finally{refreshing=false;}
}
function keepAccess(j){modalTrail=[];if(sheet.open)sheet.close();settleCouple=null;settleAll=true;flushExpenseDraft=null;receiptCache.clear();credentials={house:j.data.id,key:j.key};try{localStorage.setItem('together-access',JSON.stringify(credentials));}catch{toast('Save your private access link; this browser cannot remember it.');}data=j.data;activeSheet=data.sheets[0]?.id;demo=false;render();accessDialog(true);}
function balance(es){let net=0,aPaid=0,bPaid=0;for(const e of es){if(e.settlement)continue;const aShare=e.split==='half'?Math.floor(e.cents/2):e.split==='a'?e.cents:0;if(group(e.payer)==='a'){aPaid+=e.cents;net+=e.cents-aShare;}else{bPaid+=e.cents;net-=aShare;}}return{net,aPaid,bPaid,amount:Math.abs(net)};}
function settleScope(){return settleAll?householdOverview(data,group(data.seat)).expenses:scope();}
function settleName(){return settleAll?'All open sheets':currentName();}
function scope(){return data.expenses.filter(e=>!activeSheet||e.sheet===activeSheet);}
function currentName(){return data.sheets.find(s=>s.id===activeSheet)?.name||'All sheets';}
function header(){
 const inner=isInnerPage();
 return `<header class="re-top"><div class="re-top-left">${inner?`<button type="button" class="re-glass-circle back-button" data-action="back" aria-label="Go back">${backIcon()}</button><div class="re-inner-label"><small>SHEET</small><strong>${esc(currentName())}</strong></div>`:`<button type="button" class="re-house" data-tab="home" aria-label="Open home"><span class="re-house-mark"><img src="/icon.svg" alt=""></span><span><small>Household</small><strong>${esc(data.name)}</strong></span>${icon('chevron')}</button>`}</div><button class="re-profile" data-action="settings" aria-label="${demo?'Demo user':'Signed in as'} ${esc(data.names[data.seat])}. Open settings"><span>${esc(initials(data.names[data.seat]))}</span></button></header>${demo?'<div class="re-demo">Sample household <button class="text-button" data-action="exit-demo">Make it yours</button></div>':''}`;
}
function themeButton(){
 const dark=document.body.classList.contains('theme-dark');
 return `<button type="button" class="ref-settings-theme ui-theme-toggle" data-action="theme" aria-label="${dark?'Switch to light mode':'Switch to dark mode'}" aria-pressed="${dark}">${icon(dark?'sun':'moon')}</button>`;
}
function pageHeader(view,title,subtitle,tools=''){
 return `<header class="ref-${view}-header ui-page-header"><div class="ref-${view}-title ui-page-title">${subtitle?`<small>${esc(subtitle)}</small>`:''}<h1>${esc(title)}</h1></div><div class="ref-${view}-tools ui-page-tools">${tools}${themeButton()}</div></header>`;
}

function nav(){
 const activeIndex=tab==='home'?0:(tab==='sheets'||tab==='expenses')?1:tab==='settle'?3:tab==='settings'?4:2;
 const item=(id,label,ic)=>`<button data-tab="${id}" data-nav-index="${id==='home'?0:id==='sheets'?1:id==='settle'?3:4}" class="${tab===id||(id==='sheets'&&tab==='expenses')?'active':''}" ${tab===id||(id==='sheets'&&tab==='expenses')?'aria-current="page"':''}><span>${icon(ic)}</span><small>${label}</small></button>`;
 return `<footer class="re-nav"><nav class="re-dock" aria-label="Main navigation" data-active-index="${activeIndex}">${item('home','Home','home')}${item('sheets','Sheets','folder')}<button class="re-add re-add-nav" data-action="add" data-nav-index="2" aria-label="Add expense"><span>${icon('plus')}</span><small>Add</small></button>${item('settle','Settle','settle')}${item('settings','Settings','settings')}</nav></footer>`;
}

function selectSheet(){return `<select aria-label="Expense sheet" id="sheet-select">${data.sheets.map(s=>`<option value="${s.id}" ${s.id===activeSheet?'selected':''}>${esc(s.name)}${s.archived?' · Archived':''}</option>`).join('')}</select>`;}
function expenseRows(items){
 if(!items.length)return `<div class="liquid-empty"><span class="liquid-empty-icon">${icon('receipt')}</span><h3>No expenses here yet</h3><p>Add your first expense and Together will work out the share.</p><button class="primary" data-action="add">${icon('plus')} Add expense</button></div>`;
 return `<div class="liquid-expense-list">${items.map(e=>`<div class="expense-row" data-swipe-expense="${e.id}">${canManageExpense(e)?`<div class="expense-swipe-action expense-swipe-left" aria-hidden="true"><button type="button" tabindex="-1" data-expense-edit="${e.id}" aria-label="Edit ${esc(e.merchant)} expense" ${data.sheets.find(s=>s.id===e.sheet)?.archived?'disabled':''}>${icon('edit')}</button></div><div class="expense-swipe-action expense-swipe-right" aria-hidden="true"><button type="button" tabindex="-1" data-expense-delete="${e.id}" aria-label="Delete ${esc(e.merchant)} expense">${icon('trash')}</button></div>`:''}<div class="expense-front"><button class="expense liquid-expense" data-expense="${e.id}"><span class="liquid-category ${catIcon(e.category)}">${icon(catIcon(e.category))}</span><span class="expense-info"><strong>${esc(e.merchant)}</strong><span>${esc(data.names[e.payer])} · ${esc(new Date(e.date+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short'}))}${e.receipt?' · Receipt':''}</span><span class="expense-share">${esc(expenseShareLabel(e))}</span></span><span class="expense-total"><strong>${money(e.cents)}</strong><small>${e.settlement?'Settled':'Shared'}</small></span></button><button type="button" class="expense-more" data-expense-options="${e.id}" aria-label="Actions for ${esc(e.merchant)} expense" aria-haspopup="dialog">•••</button></div></div>`).join('')}</div>`;
}
function homeRecentTransactions(){
 const recent=data.expenses.map((expense,index)=>({expense,index,added:Date.parse(expense.created)||0})).sort((a,b)=>b.added-a.added||a.index-b.index).slice(0,5);
 return `<section class="home-recent-card" aria-labelledby="home-recent-title"><div class="home-recent-heading"><h2 id="home-recent-title">Recent transactions</h2><span>${recent.length?'Latest '+recent.length:'Activity'}</span></div>${recent.length?`<div class="home-recent-list">${recent.map(({expense:e})=>{
  const sheetName=data.sheets.find(s=>s.id===e.sheet)?.name||'Expense sheet';
  const dateLabel=new Date(e.date+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short'});
  const authorLabel=Number.isInteger(e.creator)?'Added by '+expenseAuthor(e):expenseAuthor(e);
  const categoryLabel=e.category||'Other';
  const rowLabel=`${e.merchant}, ${money(e.cents)}, ${authorLabel}, ${categoryLabel}, ${dateLabel}, ${sheetName}`;
  return `<button type="button" class="home-recent-row" data-expense="${esc(e.id)}" aria-label="${esc(rowLabel)}"><span class="re-cat ${catIcon(e.category)}" title="${esc(categoryLabel)}" aria-hidden="true">${icon(catIcon(e.category))}</span><span class="home-recent-copy"><span class="home-recent-main"><strong class="home-recent-merchant" title="${esc(e.merchant)}">${esc(e.merchant)}</strong><strong class="home-recent-amount">${money(e.cents)}</strong></span><span class="home-recent-meta"><span class="home-recent-author">${esc(authorLabel)}</span><time datetime="${esc(e.date)}">${esc(dateLabel)}</time></span><span class="home-recent-sheet" title="${esc(sheetName)}">${icon('folder')}<span>${esc(sheetName)}</span></span></span></button>`;
 }).join('')}</div>`:`<div class="home-recent-empty">${icon('receipt')}<strong>No transactions yet</strong><p>Your latest expenses and who added them will appear here.</p><button type="button" class="secondary" data-action="add">Add an expense</button></div>`}</section>`;
}
function homeSpendingPulse(){
 const ordered=[...data.sheets].sort((a,b)=>Number(b.pinned)-Number(a.pinned)||String(b.start||'').localeCompare(String(a.start||'')));
 const current=ordered.find(s=>!s.archived);
 if(!current)return '';
 const insight=periodInsight(data.sheets,data.expenses,current,today());
 const entries=data.expenses.filter(e=>e.sheet===current.id),total=entries.reduce((sum,e)=>sum+e.cents,0);
 const totals=new Map();entries.forEach(e=>totals.set(e.category,(totals.get(e.category)||0)+e.cents));
 const top=[...totals.entries()].sort((a,b)=>b[1]-a[1])[0];
 const comparison=insight?.delta!=null?`${insight.delta>0?'+':''}${insight.delta}% on matched dates`:`${insight?.count??entries.length} expenses in this period`;
 const range=(from,to)=>new Date(from+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short'})+'–'+new Date(to+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short'});
 const explanation=insight?.previous?`<details class="period-comparison-details"><summary>How this compares ${icon('chevron')}</summary><p class="period-comparison">Same ${insight.days} days: ${esc(range(current.start,insight.currentEnd))} (${money(insight.total)}) vs ${esc(insight.previous.name)}, ${esc(range(insight.previous.start,insight.previousEnd))} (${money(insight.previousTotal)}).${insight.previousTotal===0?' No earlier spending to compare.':insight.changed?.delta?` ${esc(insight.changed.category)} ${insight.changed.delta>0?'increased':'decreased'} by ${money(Math.abs(insight.changed.delta))}.`:''}</p></details>`:'';
 return `<section class="home-period-card" aria-label="Current period spending">
  <div class="home-period-head"><div><small>This period</small><h2>${esc(current.name)}</h2></div><button type="button" data-view-sheet="${esc(current.id)}" aria-label="Open ${esc(current.name)}">${icon('chevron')}</button></div>
  <div class="home-period-columns"><div class="home-period-main"><strong>${money(total)}</strong><span>${esc(comparison)}</span></div><div class="home-period-detail"><span class="re-cat ${top?catIcon(top[0]):'other'}">${icon(top?catIcon(top[0]):'chart')}</span><div><small>${top?'Top category':'Get started'}</small><strong>${top?esc(top[0]):'No spending yet'}</strong><p>${top?money(top[1]):'Add your first expense'}</p></div></div></div>${explanation}
 </section>`;
}
function home(){
 const o=householdOverview(data,group(data.seat)),other=group(data.seat)==='a'?'b':'a';
 const status=o.net===0?'settled':o.net>0?'owe':'owed';
 const direction=o.net===0?(o.rows.length?'Your couples are balanced':'No outstanding expenses'):o.net>0?`You owe ${couple(other)}`:`${couple(other)} owes you`;
 const members=data.names.slice(group(data.seat)==='a'?0:2,group(data.seat)==='a'?2:4);
 return `<section class="re-page sp-page sp-home ref-home">
 ${pageHeader('home',data.name||'Together','Hello, '+data.names[data.seat],`<button type="button" class="ref-search" data-action="home-search" aria-label="Search expenses">${icon('search')}</button>`)}
 <div class="ref-home-body">
  <section class="ref-balance-card ${status}"><div class="ref-balance-head"><span>Your couple’s balance</span><em class="ui-status-pill">${icon(o.net?'settle':'check')}${o.net>0?'To pay':o.net<0?'To receive':'Balanced'}</em></div><strong class="ref-balance-amount">${money(Math.abs(o.net))}</strong><p class="home-balance-direction">${esc(direction)}</p><p class="home-balance-scope">${o.rows.length} outstanding expense${o.rows.length===1?'':'s'} · ${o.sheets.length} open sheet${o.sheets.length===1?'':'s'}</p><div class="home-balance-footer"><div class="home-couple"><span class="home-couple-avatars" aria-hidden="true">${members.map(name=>`<i>${esc(initials(name))}</i>`).join('')}</span><span>${esc(couple(group(data.seat)))}</span></div><button class="home-balance-action" data-action="open-settle">View settlement</button></div></section>
  ${draftBanner()}
  ${homeSpendingPulse()}
  ${recurringHomeCard()}
  ${homeRecentTransactions()}
 </div></section>`;
}
function filteredExpenses(){return filterExpenses(scope(),data.names,{...expenseFilters,query:search,status:filter,sheets:data.sheets});}
function expenseGroups(es){
 if(!es.length)return `<div class="glass empty"><div class="category">${icon('receipt')}</div><h3>${scope().length?'No matches':'Your sheet is ready'}</h3><p>${scope().length?'Try another search or clear your filters.':'Add a bill, coffee or grocery run. We’ll handle the split.'}</p><button class="secondary" data-action="${scope().length?'reset-filters':'add'}">${scope().length?'Clear filters':'Add expense'}</button></div>`;
 if(['largest','smallest'].includes(expenseFilters.sort))return expenseRows(es);
 const groups=new Map();es.forEach(e=>{if(!groups.has(e.date))groups.set(e.date,[]);groups.get(e.date).push(e);});
 const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);const yd=`${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
 return [...groups].map(([day,items])=>`<section class="day-group"><div class="day-heading"><h2>${day===today()?'Today':day===yd?'Yesterday':esc(new Date(day+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'}))}</h2><span>${money(items.reduce((n,e)=>n+e.cents,0))}</span></div>${expenseRows(items)}</section>`).join('');
}
function expenses(){
 if(!['open','settled'].includes(filter))filter='open';
 const es=filteredExpenses(),count=[expenseFilters.payer,expenseFilters.creator,expenseFilters.receipt,expenseFilters.category,expenseFilters.from,expenseFilters.to].filter(Boolean).length,items=scope(),overview=settlementOverview(items,group(data.seat),{includeSettled:true}),current=data.sheets.find(s=>s.id===activeSheet),total=items.reduce((n,e)=>n+e.cents,0),unsettled=items.filter(e=>!e.settlement).length,settled=items.length-unsettled,archived=!!current?.archived;
 const resultOverview=settlementOverview(es,group(data.seat),{includeSettled:true}),range=current?sheetDateRange(current):'All household expenses';
 const chip=(id,label,dot='')=>`<button data-filter="${id}" class="${filter===id?'active':''}">${dot?`<i class="${dot}"></i>`:''}${label} (${id==='open'?unsettled:settled})</button>`;
 return `<section class="re-page sp-page ref-inside-sheet">
  <header class="ref-inside-header">
   <div class="ref-inside-left"><button class="ref-inside-back" data-action="back" aria-label="Back to Sheets">${backIcon()}</button><div><strong>${esc(currentName())}</strong><small>${esc(range)}</small></div></div>
   <div class="ref-inside-tools">${archived?'<span class="ref-archived-pill">Archived</span>':`<button class="ref-inside-add" data-action="add">${icon('plus')}<span>Add</span></button>`}${themeButton()}</div>
  </header>
  <div class="ref-inside-body">
   <section class="ref-inside-summary">
    <div class="ref-inside-summary-head"><span>Sheet spending</span><em>${archived?'Archived':unsettled?unsettled+' unsettled':items.length?'Settled':'No expenses'}</em></div>
    <strong class="ref-inside-total">${money(total)}</strong><p>Total spending · ${esc(range)}</p><p class="sheet-outstanding">Unsettled spending: ${money(items.filter(e=>!e.settlement).reduce((n,e)=>n+e.cents,0))}</p>
    <div class="ref-inside-stats"><span><small>Your total share</small><b>${money(overview.share)}</b></span><span><small>Total you paid</small><b>${money(overview.paid)}</b></span></div>
   </section>
   <div class="ref-inside-filters">${chip('open','Open','amber')}${chip('settled','Settled','green')}<button data-action="filters" class="${count?'has-count':''}">${icon('settings')} Filters${count?` (${count})`:''}</button></div>
   <div class="ref-inside-search">${icon('search')}<input id="search" type="search" placeholder="Merchant, member, sheet or amount" aria-label="Search merchant, member, sheet, note or amount" value="${esc(search)}"><select id="expense-sort" aria-label="Sort expenses">${[['newest','Newest'],['oldest','Oldest'],['largest','Highest'],['smallest','Lowest']].map(([v,t])=>`<option value="${v}" ${expenseFilters.sort===v?'selected':''}>${t}</option>`).join('')}</select></div>
   <div class="ref-inside-result"><div class="journal-result-copy"><span>${es.length} expense${es.length===1?'':'s'} · Total <strong>${money(resultOverview.total)}</strong></span><small>Your couple’s share <b>${money(resultOverview.share)}</b></small></div><div class="journal-result-tools">${count||search||filter!=='open'?`<button type="button" class="journal-result-clear" data-action="reset-filters" aria-label="Clear search and filters" title="Clear search and filters">${icon('close')}</button>`:''}<button type="button" class="journal-result-export" data-action="export-results" ${es.length?'':'disabled'} aria-label="Export shown expenses as CSV">Export</button></div></div>
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
 const overview=settlementOverview(unsettledExpenses,group(data.seat));
 const counts={
  all:allSheets.length,
  open:currentSheets.length,
  unsettled:currentSheets.filter(sh=>stateFor(sh).unsettled).length,
  archived:allSheets.filter(sh=>sh.archived).length
 };
 if(!['open','archived'].includes(sheetFilter))sheetFilter='open';
 const matchesFilter=sh=>{
  if(sheetFilter==='archived')return sh.archived;
  return !sh.archived&&(!unsettledOnly||stateFor(sh).unsettled);
 };
 const items=allSheets.filter(sh=>matchesFilter(sh)&&sh.name.toLowerCase().includes(sheetSearch.toLowerCase()));
 const card=sh=>{
  const {es,unsettledEs,unsettledTotal,unsettled}=stateFor(sh);
  const cardIcon=sh.pinned?'pin':'folder';
  const status=sh.archived?'Archived':unsettled?`${unsettledEs.length} unsettled`:es.length?'Settled':'No expenses';
  return `<div class="swipe-sheet ref-sheet-card" data-swipe-sheet="${sh.id}">
   <div class="swipe-actions left" aria-hidden="true"><button tabindex="-1" data-sheet-edit="${sh.id}">${icon('edit')}</button><button tabindex="-1" class="pin-action" data-sheet-pin="${sh.id}">${icon('pin')}</button></div>
   <div class="swipe-actions right" aria-hidden="true"><button tabindex="-1" data-sheet-archive="${sh.id}">${icon('archive')}</button><button tabindex="-1" class="delete-action" data-sheet-delete="${sh.id}" ${canDeleteSheet(sh.id)?'':'disabled'}>${icon('trash')}</button></div>
   <div class="sheet-front ref-sheet-front"><button class="ref-sheet-open" data-view-sheet="${sh.id}">
    <span class="ref-sheet-icon">${icon(cardIcon)}</span>
    <span class="ref-sheet-copy"><strong>${esc(sh.name)}</strong><small>${esc(sheetDateRange(sh))}</small></span>
    <span class="ui-sheet-footer"><em class="ui-status-pill ${sh.archived?'is-archived':unsettled?'is-open':'is-balanced'}">${status}</em><span class="ref-sheet-amount"><small>${sh.archived?'Total spent':'Unsettled'}</small><strong>${money(sh.archived?es.reduce((n,e)=>n+e.cents,0):unsettledTotal)}</strong></span></span>
   </button><button class="sheet-more ref-sheet-more" data-sheet-options="${sh.id}" aria-label="Actions for ${esc(sh.name)}">•••</button></div>
  </div>`;
 };
 const filterChip=(id,label,dot='')=>`<button data-sheet-filter="${id}" class="${sheetFilter===id?'active':''}">${dot?`<i class="${dot}"></i>`:''}${label} (${counts[id]})</button>`;
 return `<section class="re-page sp-page ref-sheets">
  ${pageHeader('sheets','Sheets','',`<button type="button" class="ref-sheets-add" data-action="new-sheet" aria-label="Create a new sheet">${icon('plus')}<span>New</span></button>`)}
  <div class="ref-sheets-body">
   <section class="ref-sheets-summary"><div class="ref-sheets-summary-head"><span><i></i>Unsettled spending</span></div><strong class="ref-sheets-total">${money(unsettledTotal)}</strong><p>${unsettledExpenses.length} expense${unsettledExpenses.length===1?'':'s'} across ${unsettledSheets.length} open sheet${unsettledSheets.length===1?'':'s'} · before splitting</p><div class="ui-summary-stats"><span><small>Your couple’s share</small><b>${money(overview.share)}</b></span><span><small>Your couple paid</small><b>${money(overview.paid)}</b></span></div></section>
   <div class="sheet-browse-controls"><div class="ref-sheets-filters">${filterChip('open','Open')}${filterChip('archived','Archived')}</div>${sheetFilter==='open'?`<label class="sheet-unsettled-toggle"><input type="checkbox" id="unsettled-only" ${unsettledOnly?'checked':''}>Unsettled only</label>`:''}</div>
   <div class="ref-sheets-search">${icon('search')}<input id="sheet-search" type="search" placeholder="Search sheets" aria-label="Search sheets" value="${esc(sheetSearch)}"><button type="button" data-action="clear-sheet-search" aria-label="Clear sheet search" ${sheetSearch?'':'disabled aria-hidden="true"'}>${icon('close')}</button></div>
   <div class="ref-sheets-list">${items.length?items.map(card).join(''):`<div class="ref-sheets-empty"><span>${icon('folder')}</span><strong>${sheetSearch?'No matching sheets':sheetFilter==='archived'?'No archived sheets':'No sheets here'}</strong><p>${sheetSearch?'Try another search.':'Create a sheet to start a new shared period.'}</p>${!sheetSearch&&sheetFilter!=='archived'?'<button class="primary" data-action="new-sheet">Create sheet</button>':''}</div>`}</div>
  </div>
 </section>`;
}
function settlementBreakdown(){
 const selected=settleCouple||group(data.seat),o=settlementOverview(settleScope(),selected),rows=o.rows.slice(0,4),more=Math.max(0,o.rows.length-rows.length);
 return `<section class="ha-breakdown">${rows.length?`<div class="ha-breakdown-list">${rows.map(e=>`<button data-expense="${e.id}"><span class="re-cat ${catIcon(e.category)}">${icon(catIcon(e.category))}</span><span><strong>${esc(e.merchant)}</strong><small>${esc(new Date(e.date+'T12:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'short'}))} · ${esc(data.names[e.payer])}</small><i>${esc(e.category||'Other')}</i></span><em><small>Your share</small><b>${money(e.share)}</b></em></button>`).join('')}</div>${more?`<button class="ha-more" data-action="expenses">+${more} more · View sheet</button>`:''}`:'<div class="ha-balanced">'+icon('check')+'<span>Nothing left to settle.</span></div>'}</section>`;
}

function settlementSpendChart(){
 const expenses=settleScope(),total=expenses.reduce((sum,e)=>sum+e.cents,0);
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
  <div class="ref-spend-insight"><span>${icon(mode==='category'?catIcon(top.name):'store')}</span><div><small>TOP ${mode==='category'?'CATEGORY':'MERCHANT'}</small><strong>${esc(top.name)}</strong><p>${money(top.total)} · ${Math.round(top.total/total*100)}% of ${settleAll?'open sheets':'this sheet'}</p></div></div>
  <div class="ref-spend-bars">${rows.map(row).join('')}</div>
  ${rowCount>5?'<p class="ref-spend-foot">Top 5 shown · remaining spending grouped as Other</p>':''}
 </section>`;
}

function settlementSheets(selected){
 const rows=householdOverview(data,selected).sheets.filter(row=>row.rows.length);
 return `<details class="settle-detail-block" data-ui-details="sheet-balances" ${rows.length===1?'open':''}><summary>${icon('folder')}<strong>Balances by sheet</strong><span>${rows.length} open</span>${icon('chevron')}</summary><div class="settle-detail-content settlement-sheet-list">${rows.length?rows.map(row=>`<button data-settle-sheet="${esc(row.sheet.id)}"><span><strong>${esc(row.sheet.name)}</strong><small>${row.rows.length} outstanding expenses · ${esc(sheetDateRange(row.sheet))}</small></span><span><b>${money(Math.abs(row.net))}</b><small>${row.net>0?'To pay':row.net<0?'To receive':'Balanced'}</small></span>${icon('chevron')}</button>`).join(''):'<p class="settlement-empty">No outstanding expenses. Past payments remain in history.</p>'}</div></details>`;
}
function settleView(){
 const entries=settleScope(),items=entries.filter(e=>!e.settlement),selected=settleCouple||group(data.seat),o=settlementOverview(entries,selected),other=selected==='a'?'b':'a',from=o.net>0?selected:other,to=o.net>0?other:selected;
 const status=o.net===0?'balanced':o.net>0?'pay':'receive',mine=selected===group(data.seat);
 const statusLabel=status==='balanced'?'Balanced':status==='pay'?(mine?'You pay':'To pay'):(mine?'You receive':'To receive');
 const history=data.settlements.filter(s=>settleAll||s.sheet===activeSheet);
 const outstanding=householdOverview(data,selected).sheets.filter(row=>row.rows.length);
 return `<section class="re-page sp-page ref-settle">
  ${pageHeader('settle','Settle','')}
  <div class="ref-settle-body">
   <div class="ref-settle-controls"><label class="ref-settle-sheet"><span>View</span><div>${icon('folder')}<select aria-label="Expense sheet" id="sheet-select"><option value="overall" ${settleAll?'selected':''}>All open sheets</option>${data.sheets.map(s=>`<option value="${esc(s.id)}" ${!settleAll&&s.id===activeSheet?'selected':''}>${esc(s.name)}${s.archived?' · Archived':''}</option>`).join('')}</select></div></label><label class="ref-settle-couple"><span>Share for</span><select id="settle-couple">${['a','b'].map(g=>`<option value="${g}" ${g===selected?'selected':''}>${esc(couple(g))}${g===group(data.seat)?' · yours':''}</option>`).join('')}</select></label></div>
   <section class="ref-settle-summary ${status}"><div class="ref-settle-summary-head"><span>${settleAll?'OVERALL BALANCE':'REMAINING BALANCE'}</span><em>${statusLabel}</em></div><strong class="ref-settle-amount">${money(Math.abs(o.net))}</strong><p>${o.net===0?(items.length?'These expenses balance; no payment is needed.':'Nothing outstanding.'):`${esc(couple(from))} → ${esc(couple(to))}`}</p><div class="ref-settle-stats"><span><small>Outstanding share</small><b>${money(o.share)}</b></span><span><small>Already paid</small><b>${money(o.paid)}</b></span></div>${!settleAll&&items.length?`<button class="primary settlement-record" data-action="settle">${icon('check')} ${o.net?'Record payment':'Close balanced expenses'}</button><p class="settlement-help">Records a completed payment and locks these ${items.length} expenses.</p>`:''}${settleAll&&outstanding.length>1?'<p class="settlement-help">Choose a sheet below to record payment. Opposite sheet balances can offset.</p>':''}</section>
   ${settleAll?settlementSheets(selected):`<details class="settle-detail-block" data-ui-details="unsettled-expenses"><summary>${icon('receipt')}<strong>Unsettled expenses</strong><span>${items.length} open</span>${icon('chevron')}</summary><div class="settle-detail-content ref-settle-breakdown">${settlementBreakdown()}</div></details>`}
   <section class="ref-settle-actions" aria-label="Settlement tools"><button class="ref-settle-tool-card" data-action="settlement-summary">${icon('copy')}<strong>Copy summary</strong></button><button class="ref-settle-tool-card" data-action="settlement-history">${icon('receipt')}<strong>History</strong><small>${history.length}</small></button></section>
   <details class="settle-detail-block" data-ui-details="spending-breakdown"><summary>${icon('chart')}<strong>Spending breakdown</strong><span>${money(entries.reduce((sum,e)=>sum+e.cents,0))}</span>${icon('chevron')}</summary><div class="settle-detail-content">${settlementSpendChart()}</div></details>
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
 const row=(action,ic,title,sub)=>`<button class="ref-settings-row" data-action="${action}"><span class="ref-settings-icon">${icon(ic)}</span><span class="ref-settings-copy"><strong>${title}</strong><small>${sub}</small></span>${icon('chevron')}</button>`;
 return `<section class="re-page sp-page ref-settings">
  ${pageHeader('settings','Settings','')}
  <div class="ref-settings-body">
   <section class="settings-identity"><span>${esc(initials(data.names[data.seat]))}</span><div><small>Signed in as</small><strong>${esc(data.names[data.seat])}</strong><p>${esc(couple(group(data.seat)))} · ${esc(data.name)}</p></div></section>
   <div class="ref-settings-section-head"><h2>Household</h2></div><section class="ref-settings-group">${row('settings-household','people','Household & names','Members, couples and household name')}${row('invite','plus','Invite members','Share access safely')}${row('access','lock','Private access link','Your personal sign-in link')}</section>
   <div class="ref-settings-section-head"><h2>Preferences</h2></div><section class="ref-settings-group">${row('recurring-bills','calendar','Recurring bills','Due dates and reminders on Home')}${row('entry-preferences','settings','Expense preferences','Defaults for faster entry')}</section>
   <div class="settings-catalogs"><button type="button" data-action="merchants">${icon('store')}<strong>Merchants</strong></button><button type="button" data-action="categories">${icon('tag')}<strong>Categories</strong></button></div><button type="button" class="text-button settings-export" data-action="export">${icon('receipt')} Export all expenses</button>
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
  window.setTimeout(()=>{tab=next;render();},120);
 }else{tab=next;render();}
}
function render(){
 if(!data)return auth();
 if(activeSheet&&!data.sheets.some(s=>s.id===activeSheet))activeSheet=data.sheets.find(s=>!s.archived)?.id||'';
 if(tab==='settle'&&!settleAll&&!activeSheet)activeSheet=data.sheets.find(s=>s.pinned&&!s.archived)?.id||data.sheets.find(s=>!s.archived)?.id||data.sheets[0]?.id||'';
 const owner=data.id+':'+data.seat;if(owner!==navigationOwner){navigationOwner=owner;navigationTrail.reset();}
 navigationTrail.visit({tab,activeSheet,search,filter,expenseFilters,settleCouple,sheetSearch,sheetFilter});
 const viewKey=tab+':'+activeSheet,previous=app.querySelector('main');
 const comparisonOpen=!!app.querySelector('.period-comparison-details')?.open;
 const detailStates=previous?.dataset.view===viewKey?new Map([...app.querySelectorAll('details[data-ui-details]')].map(detail=>[detail.dataset.uiDetails,detail.open])):new Map();
 if(previous?.dataset.view)viewScroll.set(previous.dataset.view,previous.scrollTop);
 const scrollTop=viewScroll.get(viewKey)||0;
 const wasOpen=app.classList.contains('has-navigation');
 app.classList.add('has-navigation');
 app.innerHTML=`<main class="shell re-shell re-shell-${tab}" data-view="${esc(viewKey)}">${header()}${tab==='home'?home():tab==='expenses'?expenses():tab==='sheets'?sheetsView():tab==='settle'?settleView():settings()}</main>${nav()}`;
 bind();app.querySelector('main').scrollTop=scrollTop;
 const comparison=app.querySelector('.period-comparison-details');if(comparison&&comparisonOpen)comparison.open=true;
 app.querySelectorAll('details[data-ui-details]').forEach(detail=>{if(detailStates.has(detail.dataset.uiDetails))detail.open=detailStates.get(detail.dataset.uiDetails);});
 if(!wasOpen)window.scrollTo(0,0);
}
function bind(){app.querySelectorAll('[data-bill-record]').forEach(button=>button.onclick=()=>bills.record(button.dataset.billRecord));app.querySelectorAll('[data-settle-sheet]').forEach(b=>b.onclick=()=>{settleAll=false;activeSheet=b.dataset.settleSheet;tab='settle';render();app.querySelector('main')?.scrollTo(0,0);});if($('#unsettled-only'))$('#unsettled-only').onchange=e=>{unsettledOnly=e.target.checked;render();};app.querySelectorAll('[data-couple-overview]').forEach(b=>b.onclick=()=>{settleCouple=b.dataset.coupleOverview;tab='settle';render();});if($('#settle-couple'))$('#settle-couple').onchange=e=>{settleCouple=e.target.value;render();$('#settle-couple').focus();};app.querySelectorAll('[data-spend-chart]').forEach(b=>b.onclick=()=>{settleSpendMode=b.dataset.spendChart;render();requestAnimationFrame(()=>document.querySelector('.ref-spend-chart')?.scrollIntoView({block:'nearest'}));});bindJournal();bindSheetControls();bindExpenseSwipes();app.querySelectorAll('[data-expense-options]').forEach(b=>b.onclick=()=>expenseOptions(b.dataset.expenseOptions));app.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>springToTab(b.dataset.tab,b));app.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>action(b.dataset.action,b));app.querySelectorAll('[data-expense]').forEach(b=>b.onclick=()=>expenseForm(data.expenses.find(e=>e.id===b.dataset.expense)));app.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;render();});if($('#sheet-select'))$('#sheet-select').onchange=e=>{settleAll=e.target.value==='overall';if(!settleAll)activeSheet=e.target.value;render();};if($('#search'))$('#search').oninput=e=>{const pos=e.target.selectionStart;search=e.target.value;render();$('#search').focus();$('#search').setSelectionRange(pos,pos);};app.querySelectorAll('[data-view-sheet]').forEach(b=>b.onclick=()=>{openSheet(b.dataset.viewSheet);});app.querySelectorAll('[data-pin]').forEach(b=>b.onclick=async()=>{try{await save({action:'pin',id:b.dataset.pin});activeSheet=b.dataset.pin;toast('Sheet pinned');}catch(e){toast(e.message);}});app.querySelectorAll('[data-archive]').forEach(b=>b.onclick=async()=>{try{await save({action:'archive',id:b.dataset.archive});toast('Sheet updated');}catch(e){toast(e.message);}});if($('#settings-form'))$('#settings-form').onsubmit=async e=>{e.preventDefault();const f=e.target,v=new FormData(f);try{await save({action:'settings',name:v.get('name'),names:[0,1,2,3].map(i=>v.get('n'+i))});toast('Household updated');}catch(err){errorIn(f,err);}};}
function action(a,source=null){if(a==='recurring-bills')return recurringDialog();if(a==='back')return goBack();if(a==='home-search'){activeSheet='';search='';expenseFilters=emptyExpenseFilters();filter='open';tab='expenses';render();requestAnimationFrame(()=>document.querySelector('#search')?.focus());return;}if(a==='clear-sheet-search'){sheetSearch='';render();requestAnimationFrame(()=>document.querySelector('#sheet-search')?.focus());return;}if(journalAction(a))return;if(['settings','expenses','sheets'].includes(a)){if(a==='expenses')filter='open';tab=a;render();return;}if(a==='open-settle'){settleAll=true;settleCouple=null;tab='settle';render();app.querySelector('main')?.scrollTo(0,0);return;}if(a==='settings-household')settingsHouseholdDialog();if(a==='settings-more')settingsMoreDialog();if(a==='merchants'||a==='categories')openCatalog(a);if(a==='add'){
 return openExpense();
}if(a==='new-sheet')newSheet();if(a==='settle')settleDialog();if(a==='invite')inviteDialog();if(a==='access')accessDialog();if(a==='export')exportCSV();if(a==='theme'){document.body.classList.toggle('theme-dark');syncThemeColor();try{localStorage.setItem('together-theme',document.body.classList.contains('theme-dark')?'dark':'light');}catch{}render();}if(a==='exit-demo'){flushExpenseDraft=null;demo=false;data=null;auth();}if(a==='signout'){flushExpenseDraft=null;if(demo){demo=false;data=null;auth();}else confirmDialog('Sign out?', 'Keep your private access link so you can sign in again.',async()=>{credentials=null;data=null;try{localStorage.removeItem('together-access');}catch{}sheet.close();auth();},'Sign out');}}
function auth(){navigationTrail.reset();navigationOwner='';modalTrail=[];
 viewScroll.clear();app.classList.remove('has-navigation');
 app.innerHTML=`<main class="re-welcome"><div class="re-auth"><div class="re-auth-brand"><img src="/icon.svg" alt=""><strong>together<span>.</span></strong></div><p class="re-eyebrow">MONEY IS BETTER TOGETHER</p><h1>Share the home.<br><span>Skip the maths.</span></h1><p class="re-auth-copy">A calm shared journal for two couples. Add expenses, see everyone’s share and settle without spreadsheets.</p><section class="re-auth-preview"><div class="re-preview-top"><span>${icon('receipt')} Shared today</span><em>Example</em></div><div class="re-preview-row"><span class="re-cat groceries">${icon('groceries')}</span><span><strong>The weekly shop</strong><small>Avery paid</small></span><b>$86.40</b></div><div class="re-preview-row"><span class="re-cat food">${icon('food')}</span><span><strong>Dinner together</strong><small>Jordan paid</small></span><b>$72.00</b></div><div class="re-preview-summary"><span><small>Total</small><strong>$158.40</strong></span><span><small>Your share</small><strong>$79.20</strong></span></div></section><div class="re-auth-points"><span>${icon('plus')} Add it</span><span>${icon('people')} Share it</span><span>${icon('settle')} Settle it</span></div><button id="create-start" class="primary full">Create your household ${icon('arrow')}</button><button id="join-start" class="secondary full">I already have a link</button><button id="demo-start" class="text-button full">Explore a sample household</button><p class="re-auth-foot">Four people · Two couples · One shared journal</p></div></main>`;
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
function startDemo(){settleCouple=null;settleAll=true;unsettledOnly=false;flushExpenseDraft=null;demo=true;const month=today().slice(0,7);activeSheet='demo-sheet';data={id:'demo',name:'Our home',names:['Sagar','Sushma','Nabin','Sujata'],claimed:[true,true,true,true],seat:0,rev:0,sheets:[{id:activeSheet,name:new Date().toLocaleDateString('en-AU',{month:'long',year:'numeric'}),start:month+'-01',end:'',pinned:true,archived:false}],settlements:[],expenses:[['Woolworths',8640,'Groceries',0,'half'],['Electricity',14820,'Bills',2,'half'],['Weekend brunch',7200,'Dining',1,'half'],['ALDI',4235,'Groceries',3,'half']].map(([merchant,cents,category,payer,split],i)=>({id:uid(),merchant,cents,category,payer,split,visibility:'shared',creator:payer,date:month+'-'+String(Math.max(1,Number(today().slice(-2))-i)).padStart(2,'0'),sheet:activeSheet,notes:'',receipt:'',settlement:null}))};tab='home';render();}
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
 confirmDialog('Delete this expense?',`${e.merchant} — ${money(e.cents)} will be permanently removed.`,async()=>{const saved=await save({action:'delete',id});if(saved){if(flushExpenseDraft?.expenseId===id)flushExpenseDraft.finish();if(savedDraft()?.expenseId===id)clearExpenseDraft();sheet.close();toast('Expense deleted');}},'Delete expense');
 $('#confirm-action').classList.add('delete-confirm');
 const cancel=document.createElement('button');cancel.type='button';cancel.className='secondary full expense-delete-cancel';cancel.textContent='Cancel';cancel.onclick=backOneModal;sheet.append(cancel);
}
function openSheet(id){
 activeSheet=id;filter=data.sheets.find(s=>s.id===id)?.archived?'settled':'open';search='';expenseFilters=emptyExpenseFilters();tab='expenses';render();
}
function draftStorage(){return demo?sessionStorage:localStorage;}
function savedDraft(){try{return readDraft(draftStorage(),draftKey(data.id,data.seat));}catch{return null;}}
function clearExpenseDraft(){try{draftStorage().removeItem(draftKey(data.id,data.seat));}catch{}}
function draftBanner(){
 const draft=savedDraft();if(!draft)return '';
 return `<section class="draft-banner"><span>${icon('edit')}</span><div><strong>Unfinished expense</strong><small>${esc(draft.values.merchant||'Draft saved on this device')}</small></div><button class="secondary" data-action="add">Resume</button></section>`;
}
function openExpense(){
 expenseForm();
}
function chooseExpenseDraft(startFresh){
 const draft=savedDraft();
 const e=draft.expenseId?data.expenses.find(e=>e.id===draft.expenseId):null;
 const canResume=(!draft.expenseId||(e&&canManageExpense(e)))&&!data.sheets.find(s=>s.id===draft.values.sheet)?.archived;
 modal('Unfinished expense',`<p class="muted">${canResume?'Your draft is saved on this device. Resume it or start a new expense.':'This draft refers to a removed, archived or settled expense. Discard it to start again.'}</p><p><strong>${esc(draft.values.merchant||'New expense')}</strong></p><div class="form-actions">${canResume?'<button class="primary" id="resume-draft">Resume expense</button>':''}<button class="secondary" id="fresh-expense">${canResume?'Start fresh':'Discard draft'}</button></div>`);
 if(canResume)$('#resume-draft').onclick=()=>expenseForm(e,{},draft);
 $('#fresh-expense').onclick=()=>{clearExpenseDraft();startFresh();};
}
function receiptPreviewMarkup(receipt){
 if(!receipt)return '';
 if(receipt.startsWith('data:image/'))return `<img class="receipt" alt="Expense receipt" src="${esc(receipt)}">`;
 return `<button type="button" class="secondary" data-load-receipt>View receipt</button><p class="receipt-status small muted" role="status"></p>`;
}
function bindReceiptPreview(container,expense,getReceipt=()=>expense.receipt){
 const button=container?.querySelector('[data-load-receipt]');if(!button)return;
 const reference=getReceipt();
 button.onclick=async()=>{
  button.disabled=true;const status=container.querySelector('.receipt-status');status.textContent='Opening receipt…';
  try{
   const cacheKey=data.id+':'+reference;
   let receipt=receiptCache.get(cacheKey);
   if(!receipt){receipt=(await api({action:'receipt-read',id:expense.id})).receipt;receiptCache.set(cacheKey,receipt);if(receiptCache.size>8)receiptCache.delete(receiptCache.keys().next().value);}
   if(!container.isConnected||getReceipt()!==reference)return;
   container.innerHTML=`<img class="receipt" alt="Expense receipt" src="${esc(receipt)}">`;
  }catch(e){if(container.isConnected){status.textContent=e.message;button.disabled=false;}}
 };
}
function expenseForm(e=null,preset={},resume=null){
 const openSheets=data.sheets.filter(s=>!s.archived);
 if(!e&&!openSheets.length)return newSheet();
 const defaults=entryPreferences();
 const x=e||{merchant:preset.merchant||'',cents:preset.cents||0,category:preset.category||defaults.category||'Groceries',payer:preset.payer??data.seat,visibility:'shared',split:preset.split||defaults.split||'half',date:preset.date||today(),sheet:openSheets.find(s=>s.id===preset.sheet)?.id||openSheets.find(s=>s.id===activeSheet)?.id||openSheets[0].id,notes:preset.notes||'',receipt:''};
 const archived=e&&data.sheets.find(s=>s.id===e.sheet)?.archived;
 const editable=!e||(canManageExpense(e)&&!archived);
 if(!editable){
  modal(x.merchant,`<div class="amount" style="font-size:38px;font-weight:700">${money(x.cents)}</div><p class="muted">Paid by ${esc(data.names[x.payer])} · ${esc(x.date)}</p><p class="small muted">Added by ${esc(expenseAuthor(x))}</p><div class="glass panel"><p class="small">${esc(x.category)} · ${x.split==='half'?'Split equally':`Assigned to ${esc(couple(x.split))}`}</p><p class="small">${esc(x.notes||'No notes')}</p></div><div id="view-receipt">${receiptPreviewMarkup(x.receipt)}</div><p class="small muted">${x.settlement?'This expense is settled and locked.':archived?'Reopen this sheet before editing the expense.':'Only the person who added this expense can edit or delete it.'}</p>`);
  const historyButton=document.createElement('button');historyButton.type='button';historyButton.className='secondary';historyButton.textContent='View change history';historyButton.onclick=()=>expenseHistoryDialog(x);sheet.append(historyButton);bindReceiptPreview($('#view-receipt'),x);return;
 }
 if(!resume&&savedDraft())return chooseExpenseDraft(()=>expenseForm(e,preset));
 let receipt=resume?.receipt??x.receipt??'',receiptBusy=false,draftEnded=false;
 const title=e?'Edit expense':preset.repeat?'Repeat expense':'Add an expense';
 modal(title,`<form id="expense-form" class="ref-expense-form">
  ${preset.repeat?'<p class="entry-note">A new expense for today. Check the amount and save when ready.</p>':''}
  <section class="ref-expense-card ref-expense-main-card">
   <div class="ref-expense-card-title"><span><small>Expense</small><h3>Expense details</h3></span></div>
   <label class="ref-expense-field ref-expense-merchant"><span class="ref-expense-label">Merchant</span><span class="ref-expense-control"><i>${icon('store')}</i><input name="merchant" class="picker-control" readonly data-pick="merchants" placeholder="Choose merchant" value="${esc(x.merchant)}" required aria-haspopup="dialog"></span></label>
   ${!e?`<div class="merchant-shortcuts" aria-label="Your frequent merchants">${frequentMerchants(data.expenses,catalogValues(data,'merchants'),data.seat).map(name=>`<button type="button" data-quick-merchant="${esc(name)}" title="${esc(name)}">${esc(name)}</button>`).join('')}</div>`:''}
   <div class="ref-expense-field ref-expense-amount"><label for="expense-amount" class="ref-expense-label">Amount</label><span class="ref-expense-amount-row"><span class="ref-currency-pill">$ AUD</span><span class="ref-expense-control amount-control"><input id="expense-amount" class="big-input" name="amount" inputmode="decimal" placeholder="0.00" value="${x.cents?(x.cents/100).toFixed(2):''}" pattern="[0-9]+([.][0-9]{1,2})?" required aria-label="Amount in Australian dollars"><button type="button" class="entry-calculate-toggle" id="toggle-amount-calculator" aria-label="Calculate amount" title="Calculate amount" aria-expanded="false" aria-controls="amount-calculator">${icon('calculator')}</button></span></span></div>
   <div id="amount-calculator" class="entry-calculator" hidden><label for="amount-expression" class="ref-expense-label">Calculate an amount</label><input id="amount-expression" type="text" inputmode="decimal" maxlength="120" autocomplete="off" spellcheck="false" placeholder="e.g. 18.50 + 12.75" aria-describedby="amount-calculator-help"><div class="entry-calculator-operators" aria-label="Calculation operators">${[['+','Add'],['−','Subtract'],['×','Multiply'],['÷','Divide']].map(([operator,label])=>`<button type="button" data-calc-op="${operator}" aria-label="${label}">${operator}</button>`).join('')}</div><p id="amount-calculator-help">Rounded to the nearest cent. Use amount to apply.</p><div class="entry-calculator-footer"><output id="amount-calculator-result" aria-live="polite">Enter amounts to calculate.</output><button type="button" id="use-calculated-amount" disabled>Use amount</button></div></div>
   <div class="ref-expense-pair">
    <label class="ref-expense-field"><span class="ref-expense-label">Category</span><span class="ref-expense-control"><i>${icon('tag')}</i><input name="category" class="picker-control" readonly data-pick="categories" value="${esc(x.category)}" required aria-haspopup="dialog"></span></label>
    <label class="ref-expense-field"><span class="ref-expense-label">Date</span><span class="ref-expense-control"><i>${icon('calendar')}</i><input type="date" name="date" value="${x.date}" required></span></label>
   </div>
  </section>

  <section class="ref-expense-card ref-expense-split-card">
   <div class="ref-expense-card-title"><span><small>Split</small><h3>Payment & split</h3></span></div>
   <div class="ref-expense-pair ref-expense-pair-split">
    <label class="ref-expense-field"><span class="ref-expense-label">Paid by</span><span class="ref-expense-control"><i>${icon('user')}</i><select name="payer">${data.names.map((n,i)=>`<option value="${i}" ${x.payer===i?'selected':''}>${i===data.seat?'You · ':''}${esc(n)}</option>`).join('')}</select></span></label>
    <label class="ref-expense-field"><span class="ref-expense-label">Split</span><span class="ref-expense-control"><i>${icon('chart')}</i><select name="split">${splitOptions(x.split)}</select></span></label>
   </div>
   <div class="ref-split-preview-inline" id="split-preview"></div>
  </section>

  <section class="ref-expense-options-card">
   <div class="ref-expense-options-head"><span><small>Optional</small><h3>Extra details</h3></span></div>
   ${openSheets.length>1?`<label class="ref-expense-field"><span class="ref-expense-label">Expense sheet</span><span class="ref-expense-control"><i>${icon('folder')}</i><select name="sheet">${openSheets.map(s=>`<option value="${s.id}" ${s.id===x.sheet?'selected':''}>${esc(s.name)}</option>`).join('')}</select></span></label>`:`<input type="hidden" name="sheet" value="${esc(x.sheet)}">`}
   <label class="ref-expense-field"><span class="ref-expense-label">Description · optional</span><span class="ref-expense-control"><i>${icon('receipt')}</i><input name="notes" maxlength="500" placeholder="Add a note" value="${esc(x.notes)}"></span></label>
   <div class="ref-expense-receipt-card">
   <div class="ref-receipt-row">${icon('receipt')}<span class="ref-receipt-copy"><strong>Attach receipt</strong><small>Photo or screenshot · optional</small></span><button type="button" class="ref-receipt-action" id="choose-receipt">Choose</button><input type="file" id="receipt-file" class="ref-receipt-file" accept="image/*" hidden></div>
   <div id="receipt-preview">${receiptPreviewMarkup(receipt)}</div>
   <button type="button" class="secondary scan-receipt" id="scan-receipt" ${receipt?'':'hidden'}>Scan details</button><div id="scan-status" class="small muted" role="status"></div><div id="scan-review" hidden></div>
   <button type="button" class="text-button ref-remove-receipt" id="remove-receipt" ${receipt?'':'hidden'}>Remove receipt</button>
   </div>
  </section>
  <p class="draft-status" role="status">${resume?'Recovered draft · review before saving':''}</p>
  <p class="error form-error" role="alert"></p>
  <p class="duplicate-warning" hidden role="alert"></p>
  <section class="ref-expense-submit-card">
   <div class="ref-expense-final-actions ${e?'has-delete':'single'}"><button class="primary" type="submit" id="save-expense">${icon('check')} ${e?'Save changes':'Save expense'}</button>${e?'<button type="button" class="secondary danger" id="delete-expense">Delete expense</button>':''}</div>
  </section>
 ${e?'<button type="button" class="text-button history-action" id="view-expense-history">View change history</button>':''}
 </form>`);

 const f=$('#expense-form');
 if(resume){
  for(const [name,value] of Object.entries(resume.values))if(f.elements[name])f.elements[name].value=value;
  if(!openSheets.some(s=>s.id===f.elements.sheet.value))f.elements.sheet.value=x.sheet;
 }
 bindReceiptPreview($('#receipt-preview'),x,()=>receipt);
 const draftOwnerKey=draftKey(data.id,data.seat),draftStore=draftStorage();
 let draftTimer,wroteDraft=false;
 const persistDraft=()=>{
  clearTimeout(draftTimer);if(draftEnded)return;
  const values=Object.fromEntries(new FormData(f));
  if(snapshot()===originalSnapshot&&!resume){if(wroteDraft){try{draftStore.removeItem(draftOwnerKey);}catch{}wroteDraft=false;}return true;}
  const status=f.querySelector('.draft-status');
  try{writeDraft(draftStore,draftOwnerKey,{expenseId:e?.id,values,receipt});wroteDraft=true;if(status)status.textContent='Draft saved on this device';return true;}
  catch{try{writeDraft(draftStore,draftOwnerKey,{expenseId:e?.id,values,receipt:receipt.startsWith('data:')?'':receipt});wroteDraft=true;if(status)status.textContent='Fields saved; attach the receipt again when resuming';return true;}catch{if(status)status.textContent='This browser could not save your draft';return false;}}
 };
 persistDraft.expenseId=e?.id;persistDraft.finish=()=>{draftEnded=true;clearTimeout(draftTimer);try{draftStore.removeItem(draftOwnerKey);}catch{}};
 flushExpenseDraft=persistDraft;
 const queueDraft=()=>{clearTimeout(draftTimer);draftTimer=setTimeout(persistDraft,180);};
 f.addEventListener('input',queueDraft);f.addEventListener('change',queueDraft);
 syncOverlayLayers();
 f.addEventListener('invalid',ev=>{const details=ev.target.closest('details');if(details)details.open=true;},true);
 const snapshot=()=>JSON.stringify([...new FormData(f)].filter(([name])=>name!=='saveMode'))+receipt;
 const originalSnapshot=snapshot();
 const requestClose=(leave=()=>sheet.close())=>{
  if(busy||receiptBusy)return;cancelScan();
  if(snapshot()===originalSnapshot&&!resume){persistDraft();draftEnded=true;return leave();}
  persistDraft();let prompt=f.querySelector('.discard-prompt');
  if(!prompt){
   prompt=document.createElement('section');prompt.className='discard-prompt';prompt.setAttribute('role','alert');
   prompt.innerHTML='<strong>Keep this expense?</strong><p>Your changes haven’t been saved.</p><div><button type="button" class="secondary" data-keep>Keep editing</button><button type="button" class="secondary" data-save-draft>Save draft & close</button><button type="button" class="secondary danger" data-discard>Discard</button></div>';
   f.prepend(prompt);prompt.querySelector('[data-keep]').onclick=()=>{prompt.remove();f.elements.amount.focus();};
  }
  prompt.querySelector('[data-save-draft]').onclick=()=>{if(!persistDraft())return;draftEnded=true;clearTimeout(draftTimer);leave();render();};
  prompt.querySelector('[data-discard]').onclick=()=>{persistDraft.finish();leave();render();};
  prompt.scrollIntoView({block:'start'});prompt.querySelector('[data-keep]').focus();
 };

 sheet.querySelector('[data-modal-back]').onclick=()=>requestClose(backOneModal);
 sheet.oncancel=ev=>{if(ev.target!==sheet)return;ev.preventDefault();requestClose(backOneModal);};
 const headerClose=sheet.querySelector('[data-close]');
 headerClose.setAttribute('aria-label','Close expense form');
 headerClose.onclick=()=>requestClose(()=>sheet.close());

 const applyMerchant=value=>{
  f.elements.merchant.value=value;
  if(!e){
   const last=data.expenses.filter(item=>item.creator===data.seat&&item.merchant===value).sort((a,b)=>b.date.localeCompare(a.date)||String(b.created||'').localeCompare(String(a.created||'')))[0];
   if(last&&catalogValues(data,'categories').includes(last.category))f.elements.category.value=last.category;
  }
  f.elements.merchant.dispatchEvent(new Event('input',{bubbles:true}));
 };
 f.querySelectorAll('[data-quick-merchant]').forEach(button=>button.onclick=()=>applyMerchant(button.dataset.quickMerchant));
 f.querySelectorAll('[data-pick]').forEach(input=>{
  const choose=()=>openCatalog(input.dataset.pick,value=>{
   if(input.dataset.pick==='merchants')applyMerchant(value);
   else{input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));}
  },input.value);
  input.onclick=choose;
  input.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();choose();}};
 });
 if(e)$('#view-expense-history').onclick=()=>expenseHistoryDialog(e);
 const update=()=>{
  const amount=Math.round(Number(f.elements.amount.value)*100)||0,split=f.elements.split.value;
  $('#split-preview').innerHTML=`<span><small>${esc(couple('a'))}</small><strong>${money(split==='half'?Math.floor(amount/2):split==='a'?amount:0)}</strong></span><span><small>${esc(couple('b'))}</small><strong>${money(split==='half'?amount-Math.floor(amount/2):split==='b'?amount:0)}</strong></span>`;
 };
 let duplicateAccepted='';
 f.oninput=()=>{
  duplicateAccepted='';
  f.querySelector('.duplicate-warning').hidden=true;
  $('#save-expense').innerHTML=icon('check')+(e?' Save changes':' Save expense');
  update();
 };
 update();
 bindAmountCalculator(f);
 let scanJob=null,scanActive=false,scanGeneration=0;
 const scanButton=f.querySelector('#scan-receipt'),scanStatus=f.querySelector('#scan-status'),scanReview=f.querySelector('#scan-review');
 const cancelScan=()=>{scanGeneration++;scanJob?.cancel();scanJob=null;scanActive=false;scanButton.textContent='Scan details';scanStatus.textContent='';};
 scanButton.onclick=async()=>{
  if(scanActive){cancelScan();return;}
  scanActive=true;const token=++scanGeneration,currentReceipt=receipt;scanReview.hidden=true;scanButton.textContent='Cancel scan';scanStatus.textContent='Preparing scanner · first use may take a moment';
  try{
   let image=currentReceipt;
   if(image.startsWith('receipt:'))image=receiptCache.get(data.id+':'+currentReceipt)||(await api({action:'receipt-read',id:e.id})).receipt;
   if(token!==scanGeneration)return;
   scanJob=scanReceipt(image,message=>{if(token===scanGeneration)scanStatus.textContent=message;});
   const text=await scanJob.result;
   if(token!==scanGeneration||receipt!==currentReceipt||!f.isConnected)return;
   const result=parseReceipt(text,catalogValues(data,'merchants'),today());
   scanStatus.textContent=result.merchant||result.cents||result.date?'Scan complete. Review the suggestions below.':'No clear details found. Try a sharper photo or enter them yourself.';
   scanReview.innerHTML=`<strong>Review scanned details</strong><p class="small muted">Check every field. Only selected suggestions will be applied; saving is a separate step.${result.ambiguousAmount?' Multiple totals found; enter the correct amount.':''}</p>
    <label class="scan-choice"><input type="checkbox" data-use="merchant" ${result.merchant?'checked':''}>Merchant<input data-suggest="merchant" maxlength="80" value="${esc(result.merchant)}"></label>
    <label class="scan-choice"><input type="checkbox" data-use="amount" ${result.cents?'checked':''}>Amount · AUD<input data-suggest="amount" inputmode="decimal" value="${result.cents?(result.cents/100).toFixed(2):''}"></label>
    <label class="scan-choice"><input type="checkbox" data-use="date" ${result.date?'checked':''}>Date<input data-suggest="date" type="date" value="${esc(result.date)}"></label><button type="button" class="secondary" data-apply-scan>Apply selected suggestions</button><button type="button" class="text-button" data-dismiss-scan>Dismiss</button>`;
   scanReview.hidden=false;
   scanReview.querySelector('[data-dismiss-scan]').onclick=()=>scanReview.hidden=true;
   scanReview.querySelector('[data-apply-scan]').onclick=()=>{
    for(const name of ['merchant','amount','date']){
     if(!scanReview.querySelector(`[data-use="${name}"]`).checked)continue;
     const value=scanReview.querySelector(`[data-suggest="${name}"]`).value.trim();
     if(!value)return errorIn(f,'Complete the selected suggestions or uncheck them.');
     if(name==='amount'&&(!/^\d+(\.\d{1,2})?$/.test(value)||Number(value)<=0||Number(value)>9999999.99))return errorIn(f,'Check the suggested amount.');
    }
    for(const name of ['merchant','amount','date'])if(scanReview.querySelector(`[data-use="${name}"]`).checked){const value=scanReview.querySelector(`[data-suggest="${name}"]`).value.trim();if(name==='merchant')applyMerchant(value);else f.elements[name].value=value;}
    f.dispatchEvent(new Event('input',{bubbles:true}));persistDraft();scanReview.hidden=true;scanStatus.textContent='Suggestions applied. Review and save your expense.';
   };
  }catch(err){if(token===scanGeneration)scanStatus.textContent=err.message||'Unable to scan this receipt.';}
  finally{if(token===scanGeneration){scanJob=null;scanActive=false;scanButton.textContent='Scan details';}}
 };
 const scanObserver=new MutationObserver(()=>{if(!f.isConnected){cancelScan();scanObserver.disconnect();}});scanObserver.observe(sheet,{childList:true});
 const receiptInput=$('#receipt-file');
 $('#choose-receipt').onclick=()=>receiptInput.click();
 receiptInput.addEventListener('cancel',()=>$('#choose-receipt').focus({preventScroll:true}));
 receiptInput.onchange=async ev=>{
  if(!ev.target.files[0])return;
  receiptBusy=true;$('#save-expense').disabled=true;
  try{
   cancelScan();receipt=await compressImage(ev.target.files[0]);$('#scan-receipt').hidden=false;$('#scan-review').hidden=true;
   $('#receipt-preview').innerHTML=`<img class="receipt" alt="Attached receipt" src="${esc(receipt)}">`;
   $('#remove-receipt').hidden=false;
   f.querySelector('.form-error').textContent='';persistDraft();
  }catch(err){errorIn(f,err);}
  finally{receiptBusy=false;$('#save-expense').disabled=false;}
 };
 $('#remove-receipt').onclick=()=>{cancelScan();$('#scan-review').hidden=true;$('#scan-receipt').hidden=true;receipt='';$('#receipt-preview').innerHTML='';$('#receipt-file').value='';$('#remove-receipt').hidden=true;persistDraft();};
 if(e)$('#delete-expense').onclick=()=>deleteExpense(e.id);
 f.onsubmit=async ev=>{
  ev.preventDefault();
  if(receiptBusy)return;cancelScan();
  persistDraft();
  if(!demo&&!navigator.onLine)return errorIn(f,'You’re offline. Your draft is saved; reconnect to save it to the household.');
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
  try{
   const saved=await save({action:'expense',expense:{id:e?.id,creator:e?.creator,merchant:v.get('merchant'),cents,category:v.get('category'),date:v.get('date'),payer:Number(v.get('payer')),visibility:'shared',split:v.get('split')||'half',sheet:v.get('sheet'),notes:v.get('notes'),receipt}});
   if(saved){
    draftEnded=true;clearTimeout(draftTimer);clearExpenseDraft();
    activeSheet=v.get('sheet');
    render();
    sheet.close();
    toast('Expense saved');
   }
  }catch(err){errorIn(f,err);}
 };
}
async function compressImage(file){if(file.size>20000000)throw new Error('Please choose a receipt under 20 MB.');const url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();const scale=Math.min(1,1300/Math.max(img.width,img.height));const canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);let output;for(const q of [.8,.65,.5,.35]){output=canvas.toDataURL('image/jpeg',q);if(output.length<390000)return output;}throw new Error('Receipt is too detailed. Try cropping the image.');}catch(e){throw new Error(e.message.includes('Receipt')?e.message:'This image could not be opened. Try a screenshot or JPEG receipt.');}finally{URL.revokeObjectURL(url);}}
function newSheet(edit=null){modal(edit?'Edit sheet':'New sheet',`<form id="new-sheet-form"><label class="field"><span>Sheet name</span><input name="name" placeholder="October expenses" value="${esc(edit?.name||'')}" required maxlength="60"></label><div class="two"><label class="field"><span>Starts on</span><input name="start" type="date" value="${edit?.start||today()}" required></label><label class="field"><span>Ends on · optional</span><input name="end" type="date" value="${edit?.end||''}"></label></div><p class="error" role="alert"></p><button class="primary full">${edit?'Save changes':'Create sheet'}</button></form>`);$('#new-sheet-form').onsubmit=async e=>{e.preventDefault();const f=e.target,v=new FormData(f);if(v.get('end')&&v.get('end')<v.get('start'))return errorIn(f,'End date must follow start date.');try{await save({action:edit?'sheet-edit':'sheet',id:edit?.id,name:v.get('name'),start:v.get('start'),end:v.get('end')});activeSheet=edit?.id||data.sheets[0].id;tab='sheets';sheetFilter='open';render();sheet.close();toast(edit?'Sheet updated':'Sheet created');}catch(err){errorIn(f,err);}};}
function confirmDialog(title,description,run,label='Confirm'){modal(title,`<p class="muted">${esc(description)}</p><p class="error" role="alert"></p><button class="primary full" id="confirm-action">${esc(label)}</button>`);$('#confirm-action').onclick=async()=>{const b=$('#confirm-action');b.disabled=true;try{await run();}catch(e){sheet.querySelector('.error').textContent=e.message;b.disabled=false;}};}
function settleDialog(){if(settleAll)return toast('Choose a sheet to record its payment.');const b=balance(scope());confirmDialog('Record settlement?',b.net?`Confirm ${couple(b.net>0?'b':'a')} has paid ${money(b.amount)} to ${couple(b.net>0?'a':'b')}. This records a payment; it does not transfer money. Shared expenses on ${currentName()} will be locked.`:`Close the balanced shared expenses on ${currentName()}? They will be locked.`,async()=>{await save({action:'settle',sheet:activeSheet});sheet.close();toast('Settlement recorded');},'Confirm settlement');}
function exportCSV(items=data.expenses){const cell=v=>'"'+String(v??'').replace(/^\s*[=+@-]/,"'$&").replaceAll('"','""')+'"';const rows=[['Date','Merchant','AUD','Category','Paid by','Added by','Split','Sheet','Settled','Notes'],...items.map(e=>[e.date,e.merchant,(e.cents/100).toFixed(2),e.category,data.names[e.payer],expenseAuthor(e),expenseShareLabel(e),data.sheets.find(s=>s.id===e.sheet)?.name,e.settlement?'Yes':'No',e.notes])];const file=new File(['\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n')],`together-expenses-${today()}.csv`,{type:'text/csv'});if(navigator.canShare?.({files:[file]})){navigator.share({files:[file]}).catch(e=>{if(e.name!=='AbortError')download(file);});}else download(file);}
function download(file){const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download=file.name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
if(navigator.modelContext?.registerTool){navigator.modelContext.registerTool({name:'open_expense_form',description:'Open the household expense form for user review. Does not save an expense.',inputSchema:{type:'object',properties:{merchant:{type:'string'}},additionalProperties:false},execute:async({merchant=''})=>{if(!data)return{content:[{type:'text',text:'Sign in to your household first.'}]};expenseForm(null,{merchant});return{content:[{type:'text',text:'Expense form opened. The user can review and save.'}]};}});}
async function init(){const fragment=location.hash;if(fragment){history.replaceState(null,'',location.pathname);auth();try{await openLink(location.origin+'/'+fragment);}catch(e){toast(e.message);}return;}if(credentials)await refresh(false);else auth();}
init();
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushExpenseDraft?.();});
window.addEventListener('pagehide',()=>flushExpenseDraft?.());
window.addEventListener('online',()=>{if(data&&!demo&&!sheet.open)refresh(false);});
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
function openCatalog(kind,onPick=null,selected=''){
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
 const dlg=catalogDialog,isMerchant=kind==='merchants',title=isMerchant?'Merchants':'Categories',field=isMerchant?'merchant':'category';
 let query='',sort=onPick?'frequent':'az';
 dlg.dataset.catalogKind=kind;dlg.classList.toggle('selection-mode',!!onPick);
 const head=(heading,back,plus)=>{
  dlg.innerHTML=`<div class="catalog-chrome"><div class="catalog-handle" aria-hidden="true"></div><header class="catalog-head"><button type="button" class="catalog-back" id="catalog-back" aria-label="Back">${backIcon()}</button><h2 id="catalog-title" tabindex="-1">${heading}</h2>${plus?`<button type="button" class="catalog-add" id="catalog-add" aria-label="Add ${field}">${icon('plus')}<span>Add</span></button>`:'<span class="head-spacer" aria-hidden="true"></span>'}</header></div>`;
  dlg.setAttribute('aria-labelledby','catalog-title');
  dlg.querySelector('#catalog-back').onclick=back;
  dlg.oncancel=ev=>{ev.preventDefault();back();};
 };
 const tone=(name,categoryIcon)=>{
  if(!isMerchant)return {groceries:'green',food:'amber',travel:'violet',wifi:'blue',home:'green',movie:'rose',gift:'violet',receipt:'blue',bills:'blue',tag:'neutral',other:'neutral'}[categoryIcon]||'neutral';
  const hash=Array.from(name).reduce((value,char)=>(value*31+char.codePointAt(0))>>>0,0);
  return ['green','blue','amber','violet','rose'][hash%5];
 };
 const browse=()=>{
  head(onPick?'Choose '+field:title,()=>dlg.close(),true);
  dlg.querySelector('.catalog-chrome').insertAdjacentHTML('beforeend',`<div class="catalog-toolbar"><label class="catalog-search-wrap">${icon('search')}<input id="catalog-search" type="search" placeholder="Search ${title.toLowerCase()}" aria-label="Search ${title.toLowerCase()}" value="${esc(query)}" autocomplete="off"></label>${isMerchant?`<div class="catalog-sort" role="group" aria-label="Merchant order"><button type="button" data-catalog-sort="frequent" aria-pressed="${sort==='frequent'}">Frequent</button><button type="button" data-catalog-sort="az" aria-pressed="${sort==='az'}">A–Z</button></div>`:''}</div>`);
  dlg.insertAdjacentHTML('beforeend',`<div class="catalog-body"><div class="catalog-section-head"><span>${isMerchant&&sort==='frequent'?'Most used first':'All '+title.toLowerCase()}</span><small id="catalog-results" role="status" aria-live="polite"></small></div><div class="catalog-list ${isMerchant?'catalog-merchants':'catalog-categories'}"></div>${onPick?'':`<p class="catalog-note">Tap a ${field} to rename or remove it. Past expenses stay unchanged.</p>`}</div>`);
  dlg.querySelector('#catalog-add').onclick=()=>edit(null,query.trim());
  const rows=()=>{
   const allNames=catalogValues(data,kind),needle=query.trim().toLocaleLowerCase();
   const names=allNames.filter(n=>n.toLocaleLowerCase().includes(needle));
   const counts=new Map();
   for(const expense of data.expenses)counts.set(expense[field],(counts.get(expense[field])||0)+1);
   if(isMerchant)names.sort((a,b)=>(sort==='frequent'?(counts.get(b)||0)-(counts.get(a)||0):0)||a.localeCompare(b));
   dlg.querySelector('#catalog-results').textContent=needle?`${names.length} result${names.length===1?'':'s'}`:`${allNames.length} saved`;
   dlg.querySelector('.catalog-section-head>span').textContent=needle?'Search results':isMerchant&&sort==='frequent'?'Most used first':'All '+title.toLowerCase();
   dlg.querySelector('.catalog-list').innerHTML=names.length?names.map(n=>{
    const count=counts.get(n)||0,chosen=!!onPick&&n===selected,categoryIcon=catalogIcon(n);
    const initials=n.trim().split(/\s+/).slice(0,2).map(part=>Array.from(part)[0]).join('').toLocaleUpperCase();
    const detail=chosen?'Selected':count?`${count} expense${count===1?'':'s'}`:'No expenses yet';
    const caption=isMerchant||!onPick?`<small class="catalog-detail">${detail}</small>`:'';
    return `<div class="catalog-row catalog-tone-${tone(n,categoryIcon)} ${chosen?'is-selected':''}"><button type="button" class="catalog-choice" data-choice="${esc(n)}" ${onPick?`aria-pressed="${chosen}"`:`aria-label="Edit ${esc(n)}"`}><span class="catalog-icon ${isMerchant?'merchant-icon':categoryIcon}" aria-hidden="true">${isMerchant?esc(initials):icon(categoryIcon)}</span><span class="catalog-copy"><span class="catalog-name">${esc(n)}</span>${caption}</span><span class="catalog-indicator ${chosen?'is-checked':''}" aria-hidden="true">${chosen?icon('check'):onPick?'':icon('chevron')}</span></button></div>`;
   }).join(''):`<div class="catalog-empty"><span>${icon(needle?'search':isMerchant?'store':'tag')}</span><strong>${needle?'No matches':'No '+title.toLowerCase()+' yet'}</strong><p>${needle?'Try another name or add it to your list.':'Add your first '+field+' to get started.'}</p><button type="button" class="secondary" id="catalog-empty-add">${icon('plus')} Add ${field}</button></div>`;
   dlg.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{if(onPick){onPick(b.dataset.choice);dlg.close();}else edit(b.dataset.choice);});
   const emptyAdd=dlg.querySelector('#catalog-empty-add');if(emptyAdd)emptyAdd.onclick=()=>edit(null,query.trim());
  };
  rows();
  dlg.querySelector('#catalog-search').oninput=e=>{query=e.target.value;rows();};
  dlg.querySelectorAll('[data-catalog-sort]').forEach(button=>button.onclick=()=>{
   sort=button.dataset.catalogSort;
   dlg.querySelectorAll('[data-catalog-sort]').forEach(option=>option.setAttribute('aria-pressed',String(option.dataset.catalogSort===sort)));
   rows();dlg.querySelector('.catalog-body').scrollTop=0;
  });
  if(dlg.open)dlg.querySelector('#catalog-title').focus({preventScroll:true});
 };
 const edit=(previous=null,initial='')=>{
  head(`${previous?'Edit':'Add'} ${field}`,browse,false);
  dlg.insertAdjacentHTML('beforeend',`<div class="catalog-body"><section class="catalog-edit-card"><span class="catalog-edit-icon">${icon(isMerchant?'store':'tag')}</span><div><h3>${previous?'Update name':'Make it yours'}</h3><p class="catalog-edit-hint">${previous?'Changes apply to this saved option.':'Save a '+field+' for everyone in your household.'}</p></div><form id="catalog-form"><label class="field"><span>Name</span><input name="name" value="${esc(previous??initial)}" required maxlength="${isMerchant?80:40}" autocomplete="off" placeholder="${isMerchant?'e.g. Woolworths':'e.g. Groceries'}"></label><p class="error" role="alert"></p><button class="primary full">${previous?'Save changes':'Add '+field}</button>${previous?'<button type="button" id="catalog-remove" class="secondary full danger">Remove from list</button>':''}</form></section></div>`);
  const form=dlg.querySelector('form');
  form.elements.name.focus({preventScroll:true});
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
 if(a==='entry-preferences')preferencesDialog();
 else if(a==='filters')filtersDialog();
 else if(a==='reset-filters'){search='';filter=data.sheets.find(s=>s.id===activeSheet)?.archived?'settled':'open';expenseFilters=emptyExpenseFilters();render();}
 else if(a==='export-results'){const items=filteredExpenses();if(items.length)exportCSV(items);}
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
 const members=selected=>data.names.map((n,i)=>`<option value="${i}" ${selected===String(i)?'selected':''}>${i===data.seat?'You · ':''}${esc(n)}</option>`).join('');
 modal('Find an expense',`<form id="filter-form"><div class="two"><label class="field"><span>Paid by</span><select name="payer"><option value="">Everyone</option>${members(f.payer)}</select></label><label class="field"><span>Added by</span><select name="creator"><option value="">Everyone</option>${members(f.creator)}</select></label></div><div class="two"><label class="field"><span>Category</span><select name="category"><option value="">All categories</option>${categories.map(c=>`<option value="${esc(c)}" ${f.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select></label><label class="field"><span>Receipt</span><select name="receipt">${[['','Any expense'],['with','With receipt'],['without','Missing receipt']].map(([value,label])=>`<option value="${value}" ${f.receipt===value?'selected':''}>${label}</option>`).join('')}</select></label></div><div class="two"><label class="field"><span>From · optional</span><input type="date" name="from" value="${f.from}"></label><label class="field"><span>To · optional</span><input type="date" name="to" value="${f.to}"></label></div><p class="error" role="alert"></p><div class="form-actions"><button type="button" class="secondary" id="clear-filters">Clear</button><button class="primary">Show expenses</button></div></form>`);
 $('#clear-filters').onclick=()=>{journalAction('reset-filters');sheet.close();};$('#filter-form').onsubmit=e=>{e.preventDefault();const next=Object.fromEntries(new FormData(e.target));if(next.from&&next.to&&next.from>next.to)return errorIn(e.target,'Choose an end date on or after the start.');expenseFilters={...expenseFilters,...next};sheet.close();render();};
}
function settlementHistory(){
 const history=data.settlements.filter(s=>settleAll||s.sheet===activeSheet);
 modal('Payment history',history.length?`<div class="history-modal-list">${history.map(r=>{
  const names=r.names||data.names,recordCouple=g=>names.slice(g==='a'?0:2,g==='a'?2:4).join(' & ');
  return `<section class="settlement-history-entry ${r.reversed?'is-reversed':''}"><div class="history-modal-row"><span class="liquid-history-icon">${icon(r.reversed?'refresh':'check')}</span><span><strong>${r.net?`${esc(recordCouple(r.net>0?'b':'a'))} → ${esc(recordCouple(r.net>0?'a':'b'))}`:'Balanced expenses closed'}</strong><small>${esc(data.sheets.find(s=>s.id===r.sheet)?.name||'Sheet')} · ${new Date(r.date).toLocaleDateString('en-AU')} · ${r.count} expenses</small><small>Recorded by ${esc(names[r.by]||'Household member')}</small></span><b>${money(Math.abs(r.net))}</b></div>${r.reversed?`<p class="settlement-reversal-note">Reversed by ${esc(data.names[r.reversed.by])} on ${new Date(r.reversed.date).toLocaleDateString('en-AU')}: ${esc(r.reversed.reason)}</p>`:r.by===data.seat?`<button class="text-button" data-reverse-settlement="${esc(r.id)}">Reverse this settlement</button>`:''}</section>`;
 }).join('')}</div>`:`<div class="liquid-empty"><span class="liquid-empty-icon">${icon('receipt')}</span><h3>No payments recorded yet</h3><p>Your settlement history will appear here.</p></div>`);
 sheet.querySelectorAll('[data-reverse-settlement]').forEach(button=>button.onclick=()=>reverseSettlementDialog(button.dataset.reverseSettlement));
}
function reverseSettlementDialog(id){
 const r=data.settlements.find(r=>r.id===id);if(!r||r.reversed||r.by!==data.seat)return;
 modal('Reverse settlement',`<p class="muted">This reopens the ${r.count} linked expenses and restores their balance. An archived sheet will reopen too. The original payment and your reason stay in history. This does not move money.</p><form id="reverse-settlement-form"><label class="field"><span>Reason for correction</span><textarea name="reason" rows="3" required maxlength="300" placeholder="e.g. Payment was recorded before it was received"></textarea></label><p class="error" role="alert"></p><button class="primary full">Reverse settlement</button></form>`);
 const form=$('#reverse-settlement-form');form.onsubmit=async ev=>{ev.preventDefault();try{await save({action:'settlement-reverse',id,reason:new FormData(form).get('reason').trim()});sheet.close();modalTrail=[];settlementHistory();toast('Settlement reversed; linked expenses reopened');}catch(e){errorIn(form,e);}};
}
function settlementSummary(){
 const items=settleScope().filter(e=>!e.settlement),b=balance(items),a=settlementOverview(items,'a'),c=settlementOverview(items,'b'),text=`Together · ${settleName()}\n${b.net?`${couple(b.net>0?'b':'a')} owes ${money(b.amount)} to ${couple(b.net>0?'a':'b')}.`:'Both couples are balanced.'}\n${items.length} unsettled expenses · Total ${money(a.total)}\n${couple('a')}: share ${money(a.share)} · paid ${money(a.paid)}\n${couple('b')}: share ${money(c.share)} · paid ${money(c.paid)}\nAs of ${new Date().toLocaleDateString('en-AU')}. Please check Together for the latest balance.\nThis is a summary, not a payment confirmation.`;
 modal('Settlement summary',`<p class="small muted">A ready-to-copy note for your household. Includes all unsettled expenses and both couples’ shares. Private access links are excluded.</p><textarea id="settlement-text" readonly rows="9" aria-label="Settlement summary">${esc(text)}</textarea><button id="copy-summary" class="primary full" style="margin-top:14px">${icon('copy')} Copy summary</button><p class="small muted" id="copy-status" role="status"></p>`);
 $('#copy-summary').onclick=async()=>{try{await navigator.clipboard.writeText(text);$('#copy-status').textContent='Copied. Paste it into your household chat.';}catch{$('#settlement-text').select();$('#copy-status').textContent='Select and copy the summary above.';}};
}

function expenseHistoryDialog(expense){
 const events=expense.history?.length?expense.history:[{action:'created',date:expense.created,by:expense.creator,name:expenseAuthor(expense),changes:[]}];
 const label={merchant:'Merchant',cents:'Amount',category:'Category',date:'Date',payer:'Paid by',split:'Split',sheet:'Sheet',notes:'Description',receipt:'Receipt'};
 const value=(field,v,event)=>field==='cents'?money(v):field==='payer'?(event.names||data.names)[v]:field==='split'?(v==='half'?'Equal split':couple(v)):field==='sheet'?(data.sheets.find(s=>s.id===v)?.name||'Previous sheet'):field==='receipt'?(v?'Attached':'None'):v||'None';
 modal('Expense change history',`<p class="small muted">${esc(expense.merchant)} · ${money(expense.cents)}</p><ol class="expense-history">${[...events].reverse().map(event=>`<li><strong>${event.action==='created'?'Added':'Edited'} by ${esc(event.name||data.names[event.by]||'Unknown member')}</strong><time>${event.date?esc(new Date(event.date).toLocaleString('en-AU',{dateStyle:'medium',timeStyle:'short'})):'Date unavailable for this older entry'}</time>${event.changes?.length?`<ul>${event.changes.map(change=>`<li><b>${label[change.field]||esc(change.field)}</b>: ${change.field==='receipt'&&change.before===change.after?'Receipt replaced':`${esc(value(change.field,change.before,event))} → ${esc(value(change.field,change.after,event))}`}</li>`).join('')}</ul>`:''}</li>`).join('')}</ol>`);
}
