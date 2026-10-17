import test from 'node:test';
import assert from 'node:assert/strict';
import {createHouse,mutate,closeSettledSheets,digest} from '../lib/model.js';
import {makeHandler} from '../api/household.js';

const names=['Avery','Morgan','Jordan','Casey'];
const expense=(sheet,patch={})=>({merchant:'Cafe',cents:2500,category:'Dining',payer:0,split:'half',date:'2026-10-01',sheet,...patch});
// A household as stored before settling closed sheets: no upgrade flag.
function legacyHouse(){
 const {h,key}=createHouse({names,name:'Home',seat:0});delete h.closesSettledSheets;
 const [settled]=h.sheets;
 mutate(h,0,{action:'sheet',name:'Open',start:'2026-10-15',end:''});const open=h.sheets[0];
 mutate(h,0,{action:'sheet',name:'Empty',start:'2026-10-20',end:''});const empty=h.sheets[0];
 mutate(h,0,{action:'sheet',name:'Reversed',start:'2026-10-25',end:''});const reversed=h.sheets[0];
 mutate(h,0,{action:'expense',expense:expense(settled.id)});mutate(h,0,{action:'settle',sheet:settled.id});
 mutate(h,0,{action:'expense',expense:expense(open.id)});
 mutate(h,0,{action:'expense',expense:expense(reversed.id)});mutate(h,0,{action:'settle',sheet:reversed.id});
 mutate(h,0,{action:'settlement-reverse',id:h.settlements[0].id,reason:'Not received'});
 settled.archived=false;
 return {h,key,settled,open,empty,reversed};
}

test('recording a settlement closes the sheet and reversing it reopens the sheet',()=>{
 const {h}=createHouse({names,name:'Home',seat:0}),sheet=h.sheets[0];
 assert.equal(h.closesSettledSheets,true,'new households need no cleanup');
 mutate(h,0,{action:'expense',expense:expense(sheet.id)});mutate(h,0,{action:'settle',sheet:sheet.id});
 assert.equal(sheet.archived,true);
 mutate(h,0,{action:'settlement-reverse',id:h.settlements[0].id,reason:'Recorded too early'});
 assert.equal(sheet.archived,false);
});

test('one-time cleanup closes only fully settled sheets and never runs twice',()=>{
 const {h,settled,open,empty,reversed}=legacyHouse();
 assert.equal(closeSettledSheets(h),true);
 assert.equal(settled.archived,true);
 assert.equal(open.archived,false,'unsettled expenses keep a sheet open');
 assert.equal(empty.archived,false,'a sheet with no expenses stays open');
 assert.equal(reversed.archived,false,'a reversed settlement does not close a sheet');
 settled.archived=false;
 assert.equal(closeSettledSheets(h),false);
 assert.equal(settled.archived,false,'a sheet reopened later stays open');
});

test('cleanup leaves the sheet an archive toggle targets to that toggle',()=>{
 const {h,settled}=legacyHouse();
 closeSettledSheets(h,settled.id);
 assert.equal(settled.archived,false);
 mutate(h,0,{action:'archive',id:settled.id});
 assert.equal(settled.archived,true);
});

function fakeDb(){const m=new Map();const db=async(cmd,...a)=>{if(cmd==='GET')return m.get(a[0])??null;if(cmd==='SET'){if(a[2]==='NX'&&m.has(a[0]))return null;m.set(a[0],a[1]);return 'OK';}if(cmd==='INCR'){const v=(m.get(a[0])||0)+1;m.set(a[0],v);return v;}if(cmd==='EXPIRE')return 1;if(cmd==='EVAL'){const [,key,old,next]=a.slice(1);if(m.get(key)!==old)return 0;m.set(key,next);return 1;}};db.state=m;return db;}
async function request(fn,body,key){let code=200,payload;const res={setHeader(){},status(c){code=c;return this;},json(v){payload=v;return this;}};await fn({method:'POST',headers:{host:'x',authorization:'Bearer '+key},body},res);return {code,...payload};}

test('API reads leave a legacy household untouched; the next change closes settled sheets',async()=>{
 const db=fakeDb(),fn=makeHandler(db),{h,key,settled,open}=legacyHouse(),storeKey='together:house:'+h.id;
 assert.equal(h.keys[0],digest(key));
 const raw=JSON.stringify(h);db.state.set(storeKey,raw);
 const read=await request(fn,{action:'read',house:h.id},key);
 assert.equal(read.code,200);assert.equal(db.state.get(storeKey),raw,'reads never write');
 assert.equal(read.data.sheets.find(s=>s.id===settled.id).archived,false);
 const saved=await request(fn,{action:'expense',house:h.id,rev:h.rev,expense:expense(open.id,{cents:900})},key);
 assert.equal(saved.code,200);
 assert.equal(saved.data.sheets.find(s=>s.id===settled.id).archived,true);
 assert.equal(saved.data.sheets.find(s=>s.id===open.id).archived,false);
 assert.equal(JSON.parse(db.state.get(storeKey)).closesSettledSheets,true);
});
