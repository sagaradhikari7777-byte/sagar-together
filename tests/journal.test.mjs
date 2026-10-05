import test from 'node:test';
import assert from 'node:assert/strict';
import {filterExpenses,repeatPreset} from '../public/journal.js';
import {settlementOverview} from '../public/settlement-overview.js';

const names=['A','B','C','D'];
const items=[
 {id:'1',merchant:'Market',category:'Groceries',cents:1001,date:'2026-09-01',payer:0,visibility:'shared',split:'half',notes:'weekly vegetables',settlement:'closed',receipt:'old receipt'},
 {id:'2',merchant:'Cafe',category:'Food',cents:2000,date:'2026-09-02',payer:2,visibility:'shared',split:'half',notes:'lunch',settlement:null},
 {id:'3',merchant:'Market',category:'Groceries',cents:3000,date:'2026-09-03',payer:1,visibility:'shared',split:'a',notes:'gift',settlement:null}
];

test('filters combine search terms, date, category and payer and retain original data',()=>{
 assert.deepEqual(filterExpenses(items,names,{query:'market vegetables',payer:'0',from:'2026-09-01',to:'2026-09-01',category:'Groceries'}).map(e=>e.id),['1']);
 assert.deepEqual(filterExpenses(items,names,{status:'open'}).map(e=>e.id),['3','2']);
 assert.deepEqual(filterExpenses(items,names,{status:'settled'}).map(e=>e.id),['1']);
 assert.deepEqual(filterExpenses(items,names,{sort:'largest'}).map(e=>e.id),['3','2','1']);
 assert.equal(filterExpenses(items,names,{query:'missing'}).length,0);
 assert.deepEqual(items.map(e=>e.id),['1','2','3']);
});

test('repeat excludes identifiers, date, settlement and receipt evidence',()=>{
 const p=repeatPreset(items[0]);
 for(const field of ['id','date','settlement','receipt','creator','sheet'])assert.equal(p[field],undefined);
 assert.equal(p.cents,1001);
});

test('author and receipt filters combine without confusing payer with creator',()=>{
 const records=[{...items[0],creator:2},{...items[1],creator:0,receipt:'receipt:sample'},{...items[2],creator:0}];
 assert.deepEqual(filterExpenses(records,names,{creator:'0',receipt:'with'}).map(e=>e.id),['2']);
 assert.deepEqual(filterExpenses(records,names,{creator:'0',receipt:'without',payer:'1'}).map(e=>e.id),['3']);
 assert.deepEqual(filterExpenses(records,names,{creator:'2',status:'settled'}).map(e=>e.id),['1']);
 assert.equal(filterExpenses(items,names,{creator:'0'}).length,0,'Legacy records are not assigned a guessed author');
 assert.deepEqual(filterExpenses(records,names,{receipt:'with'}).map(e=>e.id),['2','1'],'Both stored references and legacy receipts count');
});

test('search finds creator, sheet and formatted currency without rewriting entries',()=>{
 const records=[{...items[0],creator:2,sheet:'sep'},{...items[1],creator:0,sheet:'oct',cents:123456}];
 const sheets=[{id:'sep',name:'September home'},{id:'oct',name:'October trip'}];
 assert.deepEqual(filterExpenses(records,names,{query:'C september vegetables',sheets}).map(e=>e.id),['1']);
 assert.deepEqual(filterExpenses(records,names,{query:'trip $1,234.56',sheets}).map(e=>e.id),['2']);
 assert.deepEqual(filterExpenses(records,names,{query:'$1,234.56',creator:'2',sheets}),[]);
 assert.deepEqual(records.map(e=>e.id),['1','2']);
});

test('filtered reporting counts settled results and preserves couple cent allocations',()=>{
 const records=[{...items[0],creator:0},{...items[1],creator:2},{...items[2],creator:0}];
 const shown=filterExpenses(records,names,{creator:'0',receipt:'with',status:'settled'});
 const a=settlementOverview(shown,'a',{includeSettled:true}),b=settlementOverview(shown,'b',{includeSettled:true});
 assert.deepEqual(shown.map(e=>e.id),['1']);
 assert.equal(a.total,1001);assert.equal(a.share,500);assert.equal(b.share,501);
 assert.equal(a.share+b.share,a.total);
 assert.equal(records[0].settlement,'closed','Reporting does not reopen a settled expense');
});
