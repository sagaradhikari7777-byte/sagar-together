import test from 'node:test';
import assert from 'node:assert/strict';
import {createHouse,mutate,visible,digest} from '../lib/model.js';
import {makeHandler} from '../api/household.js';
import {householdOverview,settlementOverview} from '../public/settlement-overview.js';
import {draftKey,readDraft,writeDraft} from '../public/drafts.js';
const names=['A','B','C','D'];
const expense=(h,patch={})=>({merchant:'Shop',cents:101,category:'Groceries',payer:0,split:'half',visibility:'shared',sheet:h.sheets[0].id,date:'2026-10-03',notes:'',receipt:'',...patch});
function dbFixture(){
 const state=new Map();let failCAS=false,failReceipt=false;
 const db=async(cmd,...a)=>{
  if(cmd==='GET')return state.get(a[0])??null;
  if(cmd==='SET'){if(failReceipt&&a[0].startsWith('together:receipt:'))throw Error('Storage unavailable');if(a[2]==='NX'&&state.has(a[0]))return null;state.set(a[0],a[1]);return 'OK';}
  if(cmd==='INCR'){const n=(state.get(a[0])||0)+1;state.set(a[0],n);return n;}
  if(cmd==='EXPIRE')return 1;
  if(cmd==='EVAL'){const [,key,old,next]=a.slice(1);if(failCAS||state.get(key)!==old)return 0;state.set(key,next);return 1;}
 };
 return {db,state,setFailCAS(v){failCAS=v;},setFailReceipt(v){failReceipt=v;}};
}
async function request(fn,body,key=''){
 let status,payload;const res={setHeader(){},status(code){status=code;return this;},json(value){payload=value;}};
 await fn({method:'POST',headers:{host:'example.com',authorization:'Bearer '+key},body:{receiptMode:'reference',...body}},res);return {status,...payload};
}
async function owner(fn){return request(fn,{action:'create',names,name:'Home',seat:0});}

test('overall balance includes all open sheets, ignores archives and retains offsetting sheet balances',()=>{
 const {h}=createHouse({names,name:'Home',seat:0});mutate(h,0,{action:'expense',expense:expense(h,{cents:10000})});
 mutate(h,0,{action:'sheet',name:'Second',start:'2026-10-03',end:''});mutate(h,2,{action:'expense',expense:expense(h,{payer:2,cents:6000})});
 mutate(h,0,{action:'sheet',name:'Archive',start:'2026-09-01',end:''});mutate(h,0,{action:'expense',expense:expense(h,{cents:50000})});h.sheets[0].archived=true;
 const o=householdOverview(visible(h,0),'a');assert.equal(o.net,-2000);assert.equal(o.sheets.length,2);assert.deepEqual(o.sheets.map(s=>s.net).sort((a,b)=>a-b),[-5000,3000]);
 const opposite=householdOverview(visible(h,2),'b');assert.equal(opposite.net,2000);
});
test('historical shares retain every cent after settlement while outstanding balances become zero',()=>{
 const {h}=createHouse({names,name:'Home',seat:0});mutate(h,0,{action:'expense',expense:expense(h)});mutate(h,0,{action:'settle',sheet:h.sheets[0].id});
 assert.equal(settlementOverview(h.expenses,'a').share,0);
 const a=settlementOverview(h.expenses,'a',{includeSettled:true}),b=settlementOverview(h.expenses,'b',{includeSettled:true});assert.equal(a.share,50);assert.equal(b.share,51);assert.equal(a.paid,101);
});
test('only recorder can reverse, only linked entries unlock, archive reopens and audit remains',()=>{
 const {h}=createHouse({names,name:'Home',seat:0});mutate(h,0,{action:'expense',expense:expense(h)});mutate(h,0,{action:'settle',sheet:h.sheets[0].id});const first=h.settlements[0];
 mutate(h,1,{action:'expense',expense:expense(h,{cents:200})});mutate(h,1,{action:'settle',sheet:h.sheets[0].id});const second=h.settlements[0];mutate(h,0,{action:'archive',id:h.sheets[0].id});
 const before=JSON.stringify(h);assert.throws(()=>mutate(h,2,{action:'settlement-reverse',id:first.id,reason:'Wrong payment'}),{status:403});assert.equal(JSON.stringify(h),before);
 assert.throws(()=>mutate(h,0,{action:'settlement-reverse',id:first.id,reason:' '}));
 mutate(h,0,{action:'settlement-reverse',id:first.id,reason:'Payment not received'});
 assert.equal(h.sheets[0].archived,false);assert.equal(first.reversed.reason,'Payment not received');assert.equal(first.reversed.by,0);assert.deepEqual(first.names,names);assert.equal(first.net,51);
 assert.equal(h.expenses.find(e=>e.id===first.expenses[0]).settlement,null);assert.equal(h.expenses.find(e=>e.id===second.expenses[0]).settlement,second.id);assert.equal(h.settlements.length,2);
 assert.throws(()=>mutate(h,0,{action:'settlement-reverse',id:first.id,reason:'Again'}),{status:409});
});
test('draft recovery is isolated by household and seat, preserves receipt and tolerates malformed storage',()=>{
 const store=new Map(),storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
 const key=draftKey('home',0);writeDraft(storage,key,{expenseId:'edit',values:{merchant:'Shop',amount:'12.34',notes:'draft',payer:'2',sheet:'period'},receipt:'data:image/jpeg;base64,YQ=='});
 assert.equal(readDraft(storage,key).values.amount,'12.34');assert.equal(readDraft(storage,key).expenseId,'edit');assert.equal(readDraft(storage,key).receipt,'data:image/jpeg;base64,YQ==');assert.equal(readDraft(storage,draftKey('home',1)),null);assert.equal(readDraft(storage,draftKey('other',0)),null);
 storage.setItem(key,'invalid');assert.equal(readDraft(storage,key),null);assert.equal(readDraft({getItem(){throw Error('Denied');}},key),null);
});
test('receipts save separately, load only with household access and remain available when editing',async()=>{
 const f=dbFixture(),fn=makeHandler(f.db),o=await owner(fn),house=o.data.id;
 const image='data:image/jpeg;base64,YWJj';const saved=await request(fn,{action:'expense',house,rev:o.data.rev,expense:expense(o.data,{receipt:image})},o.key);assert.equal(saved.status,200);
 const e=saved.data.expenses[0];assert.equal(e.receipt,'receipt:'+digest(image));assert(!JSON.stringify(saved.data).includes(image));
 assert.equal(JSON.parse(f.state.get('together:house:'+house)).expenses[0].receipt,e.receipt);
 assert.equal((await request(fn,{action:'receipt-read',house,id:e.id},o.key)).receipt,image);
 assert.equal((await request(fn,{action:'receipt-read',house,id:e.id},'x'.repeat(64))).status,401);
 const other=await owner(fn);assert.equal((await request(fn,{action:'receipt-read',house:other.data.id,id:e.id},other.key)).status,404);
 assert.equal((await request(fn,{action:'expense',house:other.data.id,rev:other.data.rev,expense:expense(other.data,{receipt:e.receipt})},other.key)).status,400);
 const legacyView=await request(fn,{action:'read',house,receiptMode:'inline'},o.key);assert.equal(legacyView.data.expenses[0].receipt,image);
 const edit=await request(fn,{action:'expense',house,rev:saved.data.rev,expense:{...e,notes:'edited'}},o.key);assert.equal(edit.status,200);assert.equal((await request(fn,{action:'receipt-read',house,id:e.id},o.key)).receipt,image);
});
test('legacy receipts stay readable and storage failure or conflicts never replace original data',async()=>{
 const f=dbFixture(),fn=makeHandler(f.db),o=await owner(fn),house=o.data.id;
 const original={...o.data,keys:[digest(o.key),null,null,null]};delete original.seat;delete original.claimed;delete original.catalogs;
 original.expenses=[{...expense(original),id:'legacy',creator:0,receipt:'data:image/png;base64,YWJj',settlement:null}];
 const raw=JSON.stringify(original);f.state.set('together:house:'+house,raw);
 const read=await request(fn,{action:'read',house},o.key);assert.match(read.data.expenses[0].receipt,/^receipt:/);assert.equal(f.state.get('together:house:'+house),raw);
 assert.equal((await request(fn,{action:'receipt-read',house,id:'legacy'},o.key)).receipt,original.expenses[0].receipt);
 f.setFailReceipt(true);const failure=await request(fn,{action:'settings',house,rev:original.rev,name:'Changed',names},o.key);assert.equal(failure.status,500);assert.equal(f.state.get('together:house:'+house),raw);
 f.setFailReceipt(false);f.setFailCAS(true);assert.equal((await request(fn,{action:'settings',house,rev:original.rev,name:'Changed',names},o.key)).status,409);assert.equal(f.state.get('together:house:'+house),raw);
 f.setFailCAS(false);const edit=await request(fn,{action:'expense',house,rev:original.rev,expense:{...read.data.expenses[0],notes:'legacy edit'}},o.key);assert.equal(edit.status,200);assert.equal((await request(fn,{action:'receipt-read',house,id:'legacy'},o.key)).receipt,original.expenses[0].receipt);
});
test('unchanged refresh omits household payload but still authenticates and changes return current state',async()=>{
 const fn=makeHandler(dbFixture().db),o=await owner(fn),house=o.data.id;
 const same=await request(fn,{action:'read',house,knownRev:o.data.rev},o.key);assert.equal(same.unchanged,true);assert.equal(same.data,undefined);
 assert.equal((await request(fn,{action:'read',house,knownRev:o.data.rev},'x'.repeat(64))).status,401);
 await request(fn,{action:'settings',house,rev:o.data.rev,name:'Renamed',names},o.key);
 assert.equal((await request(fn,{action:'read',house,knownRev:o.data.rev},o.key)).data.name,'Renamed');
});

test('a receipt-heavy legacy household can save beyond the old inline capacity without losing images',async()=>{
 const f=dbFixture(),fn=makeHandler(f.db),o=await owner(fn),house=o.data.id;
 const original={...o.data,keys:[digest(o.key),null,null,null]};delete original.seat;delete original.claimed;
 const image='data:image/jpeg;base64,'+'A'.repeat(380000);
 original.expenses=Array.from({length:9},(_,i)=>({...expense(original),id:'old'+i,creator:0,receipt:image,settlement:null}));
 const raw=JSON.stringify(original);assert(raw.length<3500000);f.state.set('together:house:'+house,raw);
 const saved=await request(fn,{action:'expense',house,rev:original.rev,expense:expense(original,{receipt:image})},o.key);
 assert.equal(saved.status,200);assert.equal(saved.data.expenses.length,10);
 const stored=f.state.get('together:house:'+house);assert(stored.length<10000);
 for(const e of saved.data.expenses)assert.equal((await request(fn,{action:'receipt-read',house,id:e.id},o.key)).receipt,image);
});
