import test from 'node:test';
import assert from 'node:assert/strict';
import {filterExpenses,repeatPreset} from '../public/journal.js';

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
