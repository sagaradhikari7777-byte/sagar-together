import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createHouse, mutate, identity } from '../lib/model.js';
import { transfer, authorized, makeMigrationHandler } from '../lib/migration.js';

const token = 'f'.repeat(64);
const access = { sha256: createHash('sha256').update(token).digest('hex'), expires: '2099-01-01T00:00:00Z' };
function fixture() {
  const {h, key} = createHouse({name:'Test household',names:['A','B','C','D'],seat:0});
  mutate(h, 0, {action:'expense',expense:{merchant:'Store',cents:1200,payer:2,category:'Groceries',date:'2026-09-23',split:'half',visibility:'shared',sheet:h.sheets[0].id,notes:'Original'}});
  return { rows:[{key:`together:house:${h.id}`,value:JSON.stringify(h)}], key };
}
function database() {
  const map = new Map();
  const redis = async(cmd,...a) => {
    if(cmd==='GET')return map.get(a[0])??null;
    if(cmd==='SET'){if(a.includes('NX')&&map.has(a[0]))return null;map.set(a[0],a[1]);return 'OK';}
    if(cmd==='EVAL'){if(map.get(a[2])===a[3])return Number(map.delete(a[2]));return 0;}
    throw new Error('Unexpected command');
  };
  return { map, redis };
}
async function request(handler, {method='POST',auth=`Bearer ${token}`,body={apply:true}}={}) {
  const result={};
  await handler({method,headers:{authorization:auth},body},{setHeader(){},status(code){result.code=code;return this;},json(body){result.body=body;return this;}});
  return result;
}
test('migration keeps expense ownership, access hashes, and all source bytes; rerun is idempotent',async()=>{
  const {rows,key}=fixture();const {map,redis}=database();
  const result=await transfer(rows,redis,true);
  assert.equal(result.inserted,1);assert.equal(map.get(rows[0].key),rows[0].value);
  const h=JSON.parse(map.get(rows[0].key));assert.equal(identity(h,key),0);assert.equal(h.expenses[0].creator,0);assert.equal(h.expenses[0].payer,2);
  assert.equal((await transfer(rows,redis,true)).inserted,0);
});
test('migration preflight rejects conflicting destination before inserting any households',async()=>{
  const rows=[...fixture().rows,...fixture().rows];const {map,redis}=database();map.set(rows[1].key,'newer data');
  await assert.rejects(transfer(rows,redis,true),/different version/);assert.equal(map.size,1);assert.equal(map.get(rows[1].key),'newer data');
});
test('migration dry-run and invalid records never insert data',async()=>{
  const {rows}=fixture();const {map,redis}=database();await transfer(rows,redis,false);assert.equal(map.size,0);
  await assert.rejects(transfer([{key:'together:rate:test',value:rows[0].value}],redis,true));assert.equal(map.size,0);
});
test('migration refuses missing/wrong/expired access before contacting either database',async()=>{
  const never=async()=>{throw new Error('Must not contact storage')};const handler=makeMigrationHandler({access,source:never,redis:never});
  assert.equal((await request(handler,{auth:''})).code,401);assert.equal((await request(handler,{auth:'Bearer '+'a'.repeat(64)})).code,401);
  assert.equal((await request(handler,{method:'GET'})).code,405);assert.equal(authorized(`Bearer ${token}`,access,Date.parse('2100-01-01')),false);
});
test('migration one-shot completion suppresses repeated writes and does not reveal data',async()=>{
  const {rows}=fixture();const {redis,map}=database();let reads=0;
  const handler=makeMigrationHandler({access,source:async()=>{reads++;return rows;},redis});
  const done=await request(handler);assert.equal(done.code,200);assert.equal(done.body.expenses,1);assert(!JSON.stringify(done).includes('Original'));assert(!map.has('together:migration:netlify:lock'));
  assert.equal((await request(handler)).body.state,'already-completed');assert.equal(reads,2);
});
test('migration detects source changes and never marks them complete',async()=>{
  const {rows}=fixture();const {redis,map}=database();let reads=0;
  const handler=makeMigrationHandler({access,source:async()=>++reads===1?rows:fixture().rows,redis});
  assert.equal((await request(handler)).code,409);assert(!map.has('together:migration:netlify:complete'));
});
test('migration failures hide connection credentials and release locks',async()=>{
  const {redis,map}=database();const handler=makeMigrationHandler({access,source:async()=>{throw new Error('postgres://user:secret@host/db');},redis});
  const result=await request(handler);assert.equal(result.code,503);assert(!JSON.stringify(result).includes('secret'));assert(!map.has('together:migration:netlify:lock'));
});
