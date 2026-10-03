import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const addExpenseCss=readFileSync(new URL('../public/add-expense-polish.css',import.meta.url),'utf8');
const vercel=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));

test('critical UI action targets are defined',()=>{
 const functions=[
  'settingsHouseholdDialog','settingsMoreDialog','inviteDialog','accessDialog',
  'newSheet','settleDialog','preferencesDialog','filtersDialog',
  'settlementSummary','settlementHistory','openCatalog','exportCSV','expenseForm'
 ];
 for(const name of functions)assert.match(app,new RegExp('function\\s+'+name+'\\s*\\('),name+' must be defined');
 assert.doesNotMatch(app,/function\s+insightsDialog\s*\(/);
});

test('main navigation exposes every primary destination',()=>{
 for(const tab of ['home','sheets','settle','settings'])assert.match(app,new RegExp("item\\('"+tab+"'"),tab+' tab must exist');
 assert.match(app,/data-action="add" data-nav-index="2"/);
});

test('Home is focused on balance, search and recent activity without duplicate filters or Add',()=>{
 assert.match(app,/OVERALL BALANCE/);
 assert.match(app,/data-action="home-search"/);
 assert.match(app,/Recent transactions/);
 assert.doesNotMatch(app,/data-home-filter=/);
 assert.doesNotMatch(app,/ref-home-tools[^\n]*data-action="add"/);
});

test('Sheets and sheet detail default to open work',()=>{
 assert.match(app,/sheetFilter='open'/);
 assert.doesNotMatch(app,/filterChip\('all','All'\)/);
 assert.match(app,/chip\('open','Open','amber'\).*chip\('settled','Settled','green'\)/s);
 assert.doesNotMatch(app,/chip\('all','All'\)/);
 assert.match(app,/filter='open'/);
});

test('Settings keeps household and journal tools but removes duplicate Insights',()=>{
 assert.match(app,/row\('settings-household'.*Household & names/);
 assert.match(app,/row\('settings-more'.*Journal tools/);
 assert.doesNotMatch(app,/row\('insights'/);
});

test('Settle keeps spending analysis and bottom history card without duplicate header history',()=>{
 assert.match(app,/function settlementSpendChart\(\)\{\s*const expenses=scope\(\),total=/);
 assert.match(app,/class="ref-settle-tool-card" data-action="settlement-history"/);
 assert.doesNotMatch(app,/class="ref-settle-history"/);
});

test('Settle always resolves global all-sheets state to a concrete sheet',()=>{
 assert.match(app,/if\(tab==='settle'&&!activeSheet\)activeSheet=data\.sheets\.find\(s=>s\.pinned&&!s\.archived\)\?\.id\|\|data\.sheets\.find\(s=>!s\.archived\)\?\.id\|\|data\.sheets\[0\]\?\.id\|\|''/);
});

test('Add Expense is a focused modal with one primary Save and no duplicate app dock',()=>{
 assert.match(app,/id="save-expense"/);
 assert.doesNotMatch(app,/data-expense-tab=/);
 assert.doesNotMatch(app,/save-another/);
 assert.doesNotMatch(app,/ref-expense-save/);
 assert.match(app,/headerClose\.onclick=\(\)=>requestClose/);
 assert.match(addExpenseCss,/ref-expense-final-actions\.single/);
});

test('Add Expense hides the sheet selector when only one open sheet exists',()=>{
 assert.match(app,/const openSheets=data\.sheets\.filter\(s=>!s\.archived\)/);
 assert.match(app,/openSheets\.length>1\?/);
 assert.match(app,/type="hidden" name="sheet"/);
});

test('Add Expense optional details keep receipt before the final Save',()=>{
 const options=app.indexOf('class="ref-expense-options-card"');
 const receipt=app.indexOf('class="ref-receipt-row"',options);
 const save=app.indexOf('class="ref-expense-submit-card"',options);
 assert.ok(options>=0&&receipt>options&&save>receipt);
 assert.match(addExpenseCss,/#expense-form > section\s*\{[\s\S]*position:static!important;[\s\S]*height:auto!important;[\s\S]*overflow:visible!important/);
 assert.match(addExpenseCss,/ref-remove-receipt\[hidden\][\s\S]*display:none!important/);
});

test('Expense picker selection mode hides catalog maintenance controls',()=>{
 assert.match(app,/classList\.toggle\('selection-mode',!!onPick\)/);
 assert.match(addExpenseCss,/catalog-dialog\.selection-mode \.catalog-edit/);
});

test('Vercel blocks production deployment when unit tests fail',()=>{
 assert.equal(vercel.buildCommand,'npm test && npm run build');
});
