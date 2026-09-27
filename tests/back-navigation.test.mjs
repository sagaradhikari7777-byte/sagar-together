import test from 'node:test';
import assert from 'node:assert/strict';
import {createNavigationTrail,isBackSwipe} from '../public/back-navigation.js';
test('back returns through sheets and tabs; refreshes update state without adding steps',()=>{
 const t=createNavigationTrail();t.visit({tab:'home',activeSheet:'one'});t.visit({tab:'sheets',activeSheet:'one',search:''});t.visit({tab:'sheets',activeSheet:'one',search:'week'});t.visit({tab:'expenses',activeSheet:'two'});
 assert.equal(t.length,2);assert.deepEqual(t.back(),{tab:'sheets',activeSheet:'one',search:'week'});t.visit({tab:'sheets',activeSheet:'one',search:'week'});assert.equal(t.length,1);assert.equal(t.back().tab,'home');assert.equal(t.back(),null);
 t.reset();assert.equal(t.length,0);
});
test('history snapshots are independent and bounded',()=>{
 const t=createNavigationTrail(2),v={tab:'expenses',activeSheet:'one',filters:{payer:'2'}};t.visit(v);v.filters.payer='0';t.visit({tab:'settle',activeSheet:'one'});assert.equal(t.back().filters.payer,'2');
 for(const tab of ['sheets','settings','home','settle'])t.visit({tab,activeSheet:'one'});assert.equal(t.length,2);
});
test('only a deliberate rightward edge swipe navigates back',()=>{
 assert.equal(isBackSwipe({x:5,y:200},{x:120,y:220}),true);
 for(const [start,end] of [[{x:40,y:200},{x:200,y:200}],[{x:5,y:200},{x:60,y:200}],[{x:5,y:200},{x:100,y:350}],[{x:20,y:200},{x:0,y:200}]])assert.equal(isBackSwipe(start,end),false);
});
