import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateAmount,filterExpenses,summarizeSpending,repeatPreset,frequentMerchants} from '../public/journal.js';
const names=['A','B','C','D'];
const items=[
 {id:'1',merchant:'Market',category:'Groceries',cents:1001,date:'2026-09-01',payer:0,visibility:'shared',split:'half',notes:'weekly vegetables',settlement:'closed',receipt:'old receipt'},
 {id:'2',merchant:'Cafe',category:'Food',cents:2000,date:'2026-09-02',payer:2,visibility:'shared',split:'half',notes:'lunch',settlement:null},
 {id:'3',merchant:'Market',category:'Groceries',cents:3000,date:'2026-09-03',payer:1,visibility:'private',split:'half',notes:'gift',settlement:null}
];
test('calculator respects precedence, brackets and cent rounding without executing code',()=>{
 assert.equal(calculateAmount('24.50 + 18 + 6 / 2'),4550);
 assert.equal(calculateAmount('(10 + 5) × 2'),3000);
 assert.equal(calculateAmount('10 ÷ 3'),333);
 assert.equal(calculateAmount('0.1 + .2'),30);
 assert.equal(calculateAmount('1.005'),101);
 for(const expression of ['1/0','10-20','alert(1)','2**3','1..2','2(3)','(3+2','9999999999',''])assert.throws(()=>calculateAmount(expression));
});
test('filters combine search terms, date, category and payer and retain original data',()=>{
 assert.deepEqual(filterExpenses(items,names,{query:'market vegetables',payer:'0',from:'2026-09-01',to:'2026-09-01',category:'Groceries'}).map(e=>e.id),['1']);
 assert.deepEqual(filterExpenses(items,names,{visibility:'open'}).map(e=>e.id),['2']);
 assert.deepEqual(filterExpenses(items,names,{visibility:'private'}).map(e=>e.id),['3']);
 assert.deepEqual(filterExpenses(items,names,{sort:'largest'}).map(e=>e.id),['3','2','1']);
 assert.equal(filterExpenses(items,names,{query:'missing'}).length,0);
 assert.deepEqual(items.map(e=>e.id),['1','2','3']);
});
test('insights include settled spending and distinguish visible private expenses',()=>{
 const s=summarizeSpending(items);assert.equal(s.total,6001);assert.equal(s.shared,3001);assert.equal(s.privateTotal,3000);assert.equal(s.average,2000);assert.deepEqual(s.people,[1001,3000,2000,0]);assert.deepEqual(s.categories,[['Groceries',4001],['Food',2000]]);
 assert.equal(summarizeSpending([]).average,0);
});
test('repeat excludes identifiers, date, settlement and evidence; shortcuts respect removed merchants',()=>{
 const p=repeatPreset(items[0]);for(const field of ['id','date','settlement','receipt','creator','sheet'])assert.equal(p[field],undefined);assert.equal(p.cents,1001);
 assert.equal(frequentMerchants(items,['Market','Cafe'])[0].recent.id,'3');
 assert.equal(frequentMerchants(items,['Cafe']).length,1);
});
