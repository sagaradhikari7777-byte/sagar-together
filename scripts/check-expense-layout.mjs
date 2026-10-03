import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const require=createRequire(import.meta.url);
const assert=require('node:assert/strict');
const fs=require('node:fs');
let browsers;
try{browsers=require('playwright');}
catch(error){if(!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES)throw new Error('Install Playwright to run browser checks: npm install --no-save playwright');browsers=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'));}
const {chromium,webkit}=browsers;
const {spawn}=require('node:child_process');
const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const out=process.env.TOGETHER_QA_OUTPUT;
const url=process.argv.find(arg=>/^https?:/.test(arg))||'http://localhost:3010';
const engines=process.argv.includes('--webkit')?[[webkit,'webkit']]:[[chromium,'chromium']];
let server;
async function entry(page){
 await page.goto(url);
 await page.locator('#demo-start').click();
 await page.locator('[data-action="add"]').first().click();
 await page.locator('#expense-form').waitFor();
}
async function layout(page,label){
 const report=await page.evaluate(()=>{
  const f=document.querySelector('#expense-form');
  const r=e=>{const b=e.getBoundingClientRect();return {top:b.top,bottom:b.bottom,left:b.left,right:b.right,height:b.height};};
  const cards=[...f.querySelectorAll(':scope > section')].map(e=>({name:e.className,...r(e),scrollHeight:e.scrollHeight,children:[...e.children].filter(c=>getComputedStyle(c).display!=='none').map(c=>({...r(c),tag:c.tagName}))}));
  const inputs=[...f.querySelectorAll('input:not([type=file]),select')].map(e=>({name:e.name||e.id,size:parseFloat(getComputedStyle(e).fontSize),...r(e)}));
  const nav=document.querySelector('.ref-expense-nav');
  return {cards,inputs,nav:r(nav),navButtons:[...nav.querySelectorAll('button')].map(r),form:{width:f.clientWidth,scrollWidth:f.scrollWidth},note:r(f.elements.notes),receipt:r(f.querySelector('.ref-receipt-row')),save:r(f.querySelector('.ref-expense-submit-card'))};
 });
 for(const card of report.cards){
  assert.ok(card.height>=card.scrollHeight-2,`${label}: ${card.name} collapsed (${card.height} < ${card.scrollHeight})`);
  for(const child of card.children){assert.ok(child.top>=card.top-1 && child.bottom<=card.bottom+1,`${label}: ${child.tag} extends outside ${card.name}`);}
 }
 for(let i=1;i<report.cards.length;i++)assert.ok(report.cards[i].top>=report.cards[i-1].bottom,`${label}: adjacent cards overlap`);
 for(const input of report.inputs)assert.ok(input.size>=16,`${label}: ${input.name} font ${input.size} risks focus zoom`);
 assert.ok(report.form.scrollWidth<=report.form.width,`${label}: form has horizontal overflow`);
 assert.ok(report.receipt.top>=report.note.bottom,`${label}: receipt covers note`);
 assert.ok(report.save.top>=report.receipt.bottom,`${label}: Save covers receipt`);
 assert.equal(report.navButtons.length,5,`${label}: all navigation actions exist`);
 for(const button of report.navButtons)assert.ok(button.top>=report.nav.top-1&&button.bottom<=report.nav.bottom+1&&button.left>=report.nav.left-1&&button.right<=report.nav.right+1,`${label}: navigation action extends outside the dock`);
 return report;
}
(async()=>{
 if(url.startsWith('http://localhost')){
  server=spawn(process.execPath,['scripts/dev.mjs'],{cwd:source,env:{...process.env,PORT:'3010'},stdio:['ignore','pipe','pipe']});
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.on('error',reject);server.once('exit',code=>reject(new Error('Server exited '+code)));});
 }
 const results=[];
 if(out)fs.mkdirSync(out,{recursive:true});
 try{
  for(const [engine,name] of engines){
   const browser=await engine.launch({headless:true,...(name==='chromium'?{...(process.env.TOGETHER_QA_CHROMIUM?{executablePath:process.env.TOGETHER_QA_CHROMIUM}:{}),args:['--no-sandbox','--disable-gpu']}:(process.env.TOGETHER_QA_WEBKIT?{executablePath:process.env.TOGETHER_QA_WEBKIT}:{}))});
   try{
    for(const [width,height] of [[320,568],[375,667],[390,844],[440,956],[900,900]])for(const dark of [false,true]){
     const page=await browser.newPage({viewport:{width,height},isMobile:width<700,hasTouch:width<700,deviceScaleFactor:1,locale:'en-AU',timezoneId:'Australia/Sydney'});
     const errors=[];page.on('pageerror',e=>errors.push(e.message));
     await page.route('**/api/household',route=>{errors.push('Sample-mode QA attempted a household API request');route.abort();});
     await page.addInitScript(dark=>localStorage.setItem('together-theme',dark?'dark':'light'),dark);
     await entry(page);
     const label=`${name} ${width}x${height} ${dark?'dark':'light'}`;
     await layout(page,label);
     assert.equal(await page.locator('#remove-receipt').isVisible(),false);
     assert.equal(await page.locator('#receipt-file').isVisible(),false);
     await page.locator('[name="amount"]').fill('45.50');
     await page.locator('[name="notes"]').fill('A note that should stay inside Extra details.');
     await layout(page,label+' note focused');
     await page.locator('#save-expense').scrollIntoViewIfNeeded();
     const scroll=await page.evaluate(()=>({save:document.querySelector('#save-expense').getBoundingClientRect().toJSON(),nav:document.querySelector('.ref-expense-nav').getBoundingClientRect().toJSON(),form:document.querySelector('#expense-form').getBoundingClientRect().toJSON()}));
     assert.ok(scroll.save.bottom<=scroll.nav.top+1,label+' save hidden under navigation');
     assert.ok(scroll.save.top>=scroll.form.top-1,label+' save cannot be scrolled into view');
     if(width===440){
      if(out)await page.screenshot({path:`${out}/after-${name}-${dark?'dark':'light'}.png`});
      await page.addStyleTag({content:'.ios-app { --safe-top:54px; --safe-bottom:34px; }'});
      await page.setViewportSize({width,height:420});
      await layout(page,label+' keyboard-sized viewport');
      await page.locator('#save-expense').scrollIntoViewIfNeeded();
     }
     assert.deepEqual(errors,[],label+' console errors');
     results.push({label,status:'PASS'});await page.close();
    }
    const page=await browser.newPage({viewport:{width:440,height:956},isMobile:true,hasTouch:true,locale:'en-AU',timezoneId:'Australia/Sydney'});
    await entry(page);
    await page.locator('[name="merchant"]').click();
    await page.locator('[data-choice="Woolworths"]').click();
    assert.equal(await page.locator('[name="merchant"]').inputValue(),'Woolworths');
    await page.locator('[name="category"]').click();
    await page.locator('[data-choice="Groceries"]').click();
    await page.locator('[name="amount"]').fill('123.45');
    await page.locator('[name="payer"]').selectOption('2');
    await page.locator('[name="split"]').selectOption('b');
    assert.match(await page.locator('#split-preview').innerText(),/Nabin & Sujata: \$123\.45/);
    await page.locator('[name="notes"]').fill('Layout QA receipt expense');
    const chooserPromise=page.waitForEvent('filechooser');
    await page.locator('#choose-receipt').click();
    const chooser=await chooserPromise;
    await chooser.setFiles({name:'test-receipt.png',mimeType:'image/png',buffer:fs.readFileSync(source+'/public/icon-192.png')});
    await page.locator('#receipt-preview img').waitFor();
    assert.equal(await page.locator('#remove-receipt').isVisible(),true);
    assert.ok(await page.locator('#save-expense').isEnabled());
    await layout(page,name+' attached receipt');
    await page.locator('#remove-receipt').click();
    assert.equal(await page.locator('#receipt-preview img').count(),0);
    assert.equal(await page.locator('#remove-receipt').isVisible(),false);
    await page.locator('#receipt-file').setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('invalid image')});
    await page.locator('.form-error').filter({hasText:'could not be opened'}).waitFor();
    assert.ok(await page.locator('#save-expense').isEnabled());
    await layout(page,name+' receipt error');
    await page.locator('#receipt-file').setInputFiles({name:'test-receipt.png',mimeType:'image/png',buffer:fs.readFileSync(source+'/public/icon-192.png')});
    await page.locator('#receipt-preview img').waitFor();
    await page.locator('.save-another').click();
    await page.getByText('Saved. Ready for the next one.',{exact:true}).waitFor();
    assert.equal(await page.locator('[name="amount"]').inputValue(),'');
    assert.equal(await page.locator('[name="notes"]').inputValue(),'');
    assert.equal(await page.locator('#receipt-preview img').count(),0);
    assert.equal(await page.locator('[name="payer"]').inputValue(),'2');
    await layout(page,name+' save and another reset');
    await page.locator('[data-expense-tab="sheets"]').click();
    await page.locator('[data-view-sheet]').first().click();
    const added=page.locator('[data-expense]').filter({hasText:'123.45'});
    assert.equal(await added.count(),1);await added.click();
    assert.equal(await page.locator('[name="notes"]').inputValue(),'Layout QA receipt expense');
    assert.equal(await page.locator('#receipt-preview img').count(),1);
    assert.equal(await page.locator('#save-expense').innerText(),'Save changes');
    await page.locator('[name="notes"]').fill('Edited QA note');
    assert.equal(await page.locator('#save-expense').innerText(),'Save changes');
    await layout(page,name+' edit existing receipt');
    await page.locator('#save-expense').click();
    await page.locator('#sheet').waitFor({state:'hidden'});
    await added.click();
    assert.equal(await page.locator('[name="notes"]').inputValue(),'Edited QA note');
    await page.locator('[name="notes"]').fill('Unsaved');
    await page.locator('[data-modal-back]').click();
    await page.locator('.discard-prompt').waitFor();
    await layout(page,name+' unsaved discard prompt');
    await page.locator('[data-keep]').click();
    assert.equal(await page.locator('[name="notes"]').inputValue(),'Unsaved');
    results.push({label:name+' pickers / receipt attach-remove-error / save-and-another / edit / draft guard',status:'PASS'});
    await page.close();
   }finally{await browser.close();}
  }
  if(out){fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify(results,null,2));}
  console.log(JSON.stringify(results,null,2));
 }finally{if(server)server.kill();}
})().catch(e=>{console.error(e);if(server)server.kill();process.exitCode=1;});
