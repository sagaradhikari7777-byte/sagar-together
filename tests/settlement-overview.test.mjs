import test from 'node:test';
import assert from 'node:assert/strict';
import {settlementOverview} from '../public/settlement-overview.js';
import {balance} from '../lib/model.js';
const expense=(cents,payer,split,extra={})=>({cents,payer,split,date:'2026-09-25',visibility:'shared',settlement:null,...extra});
test('overview separates allocations, payments and remaining balance without losing odd cents',()=>{
 const items=[expense(1001,0,'half'),expense(800,2,'a'),expense(300,1,'b'),expense(9999,3,'half',{settlement:'closed'})];
 const before=JSON.stringify(items),a=settlementOverview(items,'a'),b=settlementOverview(items,'b');
 assert.equal(a.total,2101);assert.equal(a.share,1300);assert.equal(b.share,801);
 assert.equal(a.paid,1301);assert.equal(b.paid,800);assert.equal(a.net,-1);assert.equal(b.net,1);
 assert.equal(a.share+b.share,a.total);assert.equal(b.net,balance(items).net);
 assert.equal(a.rows[0].share,500);assert.equal(b.rows[0].share,501);assert.equal(JSON.stringify(items),before);
});
test('every payer, split and legacy allocation agrees with the settlement engine',()=>{
 for(const payer of [0,1,2,3])for(const split of ['half','a','b'])for(const visibility of ['shared','private']){
  const items=[expense(12345,payer,split,{visibility})],a=settlementOverview(items,'a'),b=settlementOverview(items,'b');
  assert.equal(a.share+b.share,12345);assert.equal(b.net,balance(items).net);assert.equal(a.net+b.net,0);
 }
});
test('empty and fully settled sheets show zero without an outstanding balance',()=>{
 for(const items of [[],[expense(5000,0,'half',{settlement:'done'})]]){
  assert.deepEqual(settlementOverview(items,'b'),{rows:[],total:0,share:0,paid:0,net:0});
 }
});
