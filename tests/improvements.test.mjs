import test from 'node:test';
import assert from 'node:assert/strict';
import {createHouse,mutate,visible,balance} from '../lib/model.js';
import {nextOccurrence,upcomingBills} from '../public/recurring.js';
import {parseReceipt} from '../public/receipt-scan.js';
import {periodInsight} from '../public/period-insights.js';
import {frequentMerchants} from '../public/entry-shortcuts.js';
const setup=()=>createHouse({name:'Test home',names:['Avery','Morgan','Jordan','Casey'],seat:0}).h;
const schedule=(h,patch={})=>({merchant:'Rent',cents:10001,category:'Bills',payer:0,split:'half',nextDue:'2026-01-31',frequency:'monthly',sheet:h.sheets[0].id,active:true,reminder:true,...patch});
const expense=(h,patch={})=>({merchant:'Cafe',cents:2500,category:'Dining',payer:0,split:'half',date:'2026-10-01',sheet:h.sheets[0].id,...patch});
test('monthly bills return to their original day after a short month',()=>{
 const bill={nextDue:'2026-01-31',frequency:'monthly',anchorDay:31};assert.equal(nextOccurrence(bill),'2026-02-28');bill.nextDue=nextOccurrence(bill);assert.equal(nextOccurrence(bill),'2026-03-31');
});
test('yearly leap-day bills keep their February anchor',()=>{
 const bill={nextDue:'2024-02-29',frequency:'yearly',anchorDay:29,anchorMonth:1};
 for(const expected of ['2025-02-28','2026-02-28','2027-02-28','2028-02-29']){bill.nextDue=nextOccurrence(bill);assert.equal(bill.nextDue,expected);}
 assert.equal(nextOccurrence({nextDue:'2026-12-28',frequency:'weekly'}),'2027-01-04');
 assert.equal(nextOccurrence({nextDue:'2026-12-28',frequency:'fortnightly'}),'2027-01-11');
});
test('creating a schedule never records spending and every household seat can see it',()=>{
 const h=setup();mutate(h,0,{action:'recurring',bill:schedule(h,{creator:3})});assert.equal(h.expenses.length,0);assert.equal(h.recurring[0].creator,0);
 for(let seat=0;seat<4;seat++)assert.equal(visible(h,seat).recurring[0].merchant,'Rent');
});
test('recording a bill saves an ordinary expense, advances once and rejects replay',()=>{
 const h=setup();mutate(h,0,{action:'recurring',bill:schedule(h)});const bill=h.recurring[0],action={action:'recurring-record',id:bill.id,due:bill.nextDue,sheet:h.sheets[0].id},rev=h.rev;
 mutate(h,2,action);assert.equal(h.expenses.length,1);assert.equal(h.expenses[0].creator,2);assert.equal(h.expenses[0].payer,0);assert.equal(h.expenses[0].date,'2026-01-31');assert.equal(h.expenses[0].recurring.bill,bill.id);assert.equal(h.expenses[0].history[0].name,'Jordan');assert.equal(bill.nextDue,'2026-02-28');assert.equal(h.rev,rev+1);assert.equal(balance(h.expenses).amount,5001);
 const before=JSON.stringify(h);assert.throws(()=>mutate(h,1,action),{status:409});assert.equal(JSON.stringify(h),before);
 assert.throws(()=>mutate(h,0,{action:'expense',expense:{...h.expenses[0],cents:5}}),{status:403});
});
test('only schedule author edits it and pausing or archived sheets block recording',()=>{
 const h=setup();mutate(h,0,{action:'recurring',bill:schedule(h)});const bill=h.recurring[0];
 assert.throws(()=>mutate(h,2,{action:'recurring',bill:{...bill,creator:2,cents:1}}),{status:403});
 mutate(h,0,{action:'recurring',bill:{...bill,active:false}});assert.throws(()=>mutate(h,0,{action:'recurring-record',id:bill.id,due:bill.nextDue,sheet:bill.sheet}));assert.equal(h.expenses.length,0);
 mutate(h,0,{action:'recurring',bill:{...h.recurring[0],active:true}});h.sheets[0].archived=true;assert.throws(()=>mutate(h,0,{action:'recurring-record',id:bill.id,due:bill.nextDue,sheet:bill.sheet}));assert.equal(h.expenses.length,0);
});
test('bill edits preserve monthly anchors unless date or frequency is changed',()=>{
 const h=setup();mutate(h,0,{action:'recurring',bill:schedule(h)});let bill=h.recurring[0];mutate(h,0,{action:'recurring-record',id:bill.id,due:bill.nextDue,sheet:bill.sheet});
 mutate(h,0,{action:'recurring',bill:{...bill,merchant:'Updated rent',anchorDay:1}});bill=h.recurring[0];assert.equal(nextOccurrence(bill),'2026-03-31');
 mutate(h,0,{action:'recurring',bill:{...bill,nextDue:'2026-02-20'}});assert.equal(nextOccurrence(h.recurring[0]),'2026-03-20');
});
test('invalid schedules reject without changing records',()=>{
 for(const patch of [{cents:0},{cents:2.2},{payer:4},{split:'x'},{frequency:'__proto__'},{nextDue:'2026-02-30'},{sheet:'missing'},{merchant:''}]){const h=setup(),before=JSON.stringify(h);assert.throws(()=>mutate(h,0,{action:'recurring',bill:schedule(h,patch)}));assert.equal(JSON.stringify(h),before);}
});
test('Home reminders include overdue and next seven days, exclude paused and disabled',()=>{
 const items=[{id:1,nextDue:'2026-09-30',active:true,reminder:true},{id:2,nextDue:'2026-10-10',active:true,reminder:true},{id:3,nextDue:'2026-10-11',active:true,reminder:true},{id:4,nextDue:'2026-10-01',active:false,reminder:true},{id:5,nextDue:'2026-10-01',active:true,reminder:false}];assert.deepEqual(upcomingBills(items,'2026-10-03').map(x=>x.id),[1,2]);
});
test('expense history is produced by server, preserves actors and ignores client spoofing',()=>{
 const h=setup();mutate(h,0,{action:'expense',expense:expense(h,{history:[{name:'Forged'}]})});const e=h.expenses[0];assert.equal(e.history[0].name,'Avery');
 mutate(h,0,{action:'expense',expense:{...e,cents:3000,notes:'Coffee',history:[]}});const saved=h.expenses[0];assert.equal(saved.history.length,2);assert.deepEqual(saved.history[1].changes.map(x=>x.field),['cents','notes']);assert.deepEqual(saved.history[1].changes[0],{field:'cents',before:2500,after:3000});
 h.names[0]='Renamed';assert.equal(saved.history[0].name,'Avery');mutate(h,0,{action:'expense',expense:saved});assert.equal(h.expenses[0].history.length,2,'No-op edit adds no misleading event');
});
test('history records receipt attachment/removal without storing bytes or blob references',()=>{
 const h=setup();mutate(h,0,{action:'expense',expense:expense(h)});mutate(h,0,{action:'expense',expense:{...h.expenses[0],receipt:'receipt:'+'a'.repeat(64)}});mutate(h,0,{action:'expense',expense:{...h.expenses[0],receipt:'receipt:'+'b'.repeat(64)}});mutate(h,0,{action:'expense',expense:{...h.expenses[0],receipt:''}});
 const history=h.expenses[0].history;assert.equal(history.length,4);assert.deepEqual(history[2].changes,[{field:'receipt',before:true,after:true}]);assert.doesNotMatch(JSON.stringify(history),/receipt:[a-f0-9]{64}/);
});
test('legacy expenses gain creation baseline on first edit and settled records remain locked',()=>{
 const h=setup();mutate(h,0,{action:'expense',expense:expense(h)});delete h.expenses[0].history;const created=h.expenses[0].created;mutate(h,0,{action:'expense',expense:{...h.expenses[0],cents:1}});assert.equal(h.expenses[0].history[0].date,created);assert.equal(h.expenses[0].history.length,2);mutate(h,0,{action:'settle',sheet:h.sheets[0].id});assert.throws(()=>mutate(h,0,{action:'expense',expense:{...h.expenses[0],cents:2}}),{status:403});
});
test('period comparison matches elapsed days instead of comparing partial and full totals',()=>{
 const current={id:'oct',start:'2026-10-01'},previous={id:'sep',start:'2026-09-01',end:'2026-09-30'},expenses=[{sheet:'oct',date:'2026-10-02',category:'Bills',cents:2000},{sheet:'sep',date:'2026-09-02',category:'Bills',cents:1000},{sheet:'sep',date:'2026-09-25',category:'Bills',cents:9000}];
 const x=periodInsight([current,previous],expenses,current,'2026-10-03');assert.equal(x.days,3);assert.equal(x.previousEnd,'2026-09-03');assert.equal(x.previousTotal,1000);assert.equal(x.delta,100);assert.deepEqual(x.changed,{category:'Bills',delta:1000});
});
test('unequal months use equal sample lengths, zero baseline has no invented percentage',()=>{
 const current={id:'mar',start:'2026-03-01'},previous={id:'feb',start:'2026-02-01',end:'2026-02-28'};const x=periodInsight([current,previous],[],current,'2026-03-31');assert.equal(x.days,28);assert.equal(x.currentEnd,'2026-03-28');assert.equal(x.delta,null);
 assert.equal(periodInsight([{id:'future',start:'2027-01-01'}],[],{id:'future',start:'2027-01-01'},'2026-10-03'),null);
});
test('receipt parsing chooses final total, not subtotal, GST or tendered cash',()=>{
 const text='WOOLWORTHS\nTAX INVOICE\n03/10/2026 12:40\nSUBTOTAL $23.00\nGST $2.30\nTOTAL $25.30\nCASH $30.00\nCHANGE $4.70';assert.deepEqual(parseReceipt(text,['Woolworths'],'2026-10-03'),{merchant:'Woolworths',cents:2530,date:'2026-10-03',ambiguousAmount:false});
 assert.equal(parseReceipt('Shop\nAMOUNT DUE\n$1,234.56',[]).cents,123456);
});
test('ambiguous receipt totals or dates are left blank for user review',()=>{
 assert.equal(parseReceipt('Cafe\nTOTAL 10.00\nTOTAL 12.00').cents,null);assert.equal(parseReceipt('Cafe\nSUBTOTAL 3.00\nGST 0.30').cents,null);
 assert.equal(parseReceipt('Cafe\n31/02/2026\nTOTAL 3.00',[],'2026-10-03').date,'');assert.equal(parseReceipt('Cafe\n04/10/2026',[],'2026-10-03').date,'');assert.equal(parseReceipt('Cafe\n01/10/2026\n02/10/2026',[],'2026-10-03').date,'');
 assert.equal(parseReceipt('Cafe\n3 Oct 2026\nTOTAL 3.00',[],'2026-10-03').date,'2026-10-03');
});
test('frequent merchants belong to current author and respect removed catalog entries',()=>{
 const entries=[{creator:0,merchant:'Cafe',date:'2026-10-01'},{creator:0,merchant:'Cafe',date:'2026-10-02'},{creator:0,merchant:'Market',date:'2026-10-03'},{creator:2,merchant:'Their shop',date:'2026-10-03'},{creator:0,merchant:'Removed',date:'2026-10-03'}];assert.deepEqual(frequentMerchants(entries,['Cafe','Market','Their shop'],0),['Cafe','Market']);
});

test('resetting a schedule date cannot create a second existing occurrence',()=>{
 const h=setup();mutate(h,0,{action:'recurring',bill:schedule(h)});const bill=h.recurring[0];mutate(h,0,{action:'recurring-record',id:bill.id,due:bill.nextDue,sheet:bill.sheet});mutate(h,0,{action:'recurring',bill:{...bill,nextDue:'2026-01-31'}});assert.throws(()=>mutate(h,0,{action:'recurring-record',id:bill.id,due:'2026-01-31',sheet:bill.sheet}),{status:409});assert.equal(h.expenses.length,1);
});
test('receipt amounts above $999 retain every digit',()=>{assert.equal(parseReceipt('Shop\nTOTAL $1234.56').cents,123456);assert.equal(parseReceipt('Shop\nTOTAL $10000.99').cents,1000099);});
