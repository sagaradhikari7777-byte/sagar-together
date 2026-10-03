import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
const addExpenseCss=readFileSync(new URL('../public/add-expense-polish.css',import.meta.url),'utf8');

test('critical UI action targets are defined',()=>{
 const functions=[
  'settingsHouseholdDialog','settingsMoreDialog','inviteDialog','accessDialog',
  'newSheet','settleDialog','preferencesDialog','filtersDialog','insightsDialog',
  'settlementSummary','settlementHistory','openCatalog','exportCSV','expenseForm'
 ];
 for(const name of functions){
  assert.match(app,new RegExp('function\\s+'+name+'\\s*\\('),name+' must be defined');
 }
});

test('main navigation exposes every primary destination',()=>{
 for(const tab of ['home','sheets','settle','settings']){
  assert.match(app,new RegExp("item\\('"+tab+"'"),tab+' tab must exist');
 }
 assert.match(app,/data-action="add" data-nav-index="2"/);
});

test('Settings cards remain wired to their dialogs',()=>{
 assert.match(app,/row\('settings-household'.*Household & names/);
 assert.match(app,/row\('settings-more'.*Journal tools/);
 assert.match(app,/a==='settings-household'\)settingsHouseholdDialog\(\)/);
 assert.match(app,/a==='settings-more'\)settingsMoreDialog\(\)/);
});

test('Add Expense keeps navigation and required pickers wired',()=>{
 for(const tab of ['home','sheets','settle','settings'])assert.match(app,new RegExp('data-expense-tab="'+tab+'"'));
 assert.match(app,/data-pick="merchants"/);
 assert.match(app,/data-pick="categories"/);
 assert.match(app,/id="save-expense"/);
});


test('spending chart keeps settled purchases in historical spending totals',()=>{
 assert.match(app,/function settlementSpendChart\(\)\{\s*const expenses=scope\(\),total=/);
 assert.doesNotMatch(app,/function settlementSpendChart\(\)\{\s*const expenses=scope\(\)\.filter\(e=>!e\.settlement\)/);
});


test('Home overall balance uses all active sheets, not only the last selected sheet',()=>{
 assert.match(app,/const activeSheetIds=new Set\(data\.sheets\.filter\(s=>!s\.archived\)\.map\(s=>s\.id\)\)/);
 assert.match(app,/entries=data\.expenses\.filter\(e=>activeSheetIds\.has\(e\.sheet\)\)/);
});

test('Home search opens a global all-sheets expense search',()=>{
 assert.match(app,/a==='home-search'\)\{activeSheet='';tab='expenses'/);
});

test('Settle spending chart includes settled spending history',()=>{
 assert.match(app,/function settlementSpendChart\(\)\{\s*const expenses=scope\(\),total=/);
});

test('Settle always resolves global all-sheets state to a concrete sheet',()=>{
 assert.match(app,/if\(tab==='settle'&&!activeSheet\)activeSheet=data\.sheets\.find\(s=>s\.pinned&&!s\.archived\)\?\.id\|\|data\.sheets\.find\(s=>!s\.archived\)\?\.id\|\|data\.sheets\[0\]\?\.id\|\|''/);
});

test('Settle summary and history use spending-style standalone cards',()=>{
 assert.match(app,/class="ref-settle-actions" aria-label="Settlement tools"/);
 assert.match(app,/class="ref-settle-tool-card" data-action="settlement-summary".*SUMMARY.*Settlement summary/s);
 assert.match(app,/class="ref-settle-tool-card" data-action="settlement-history".*HISTORY.*Payment history/s);
});
test('Settle unsettled section uses the spending-style card shell',()=>{
 assert.match(app,/section class="ref-unsettled-card" aria-label="Unsettled expenses"/);
 assert.match(app,/class="ref-unsettled-head".*UNSETTLED.*What makes this up/s);
 assert.match(app,/class="ref-settle-breakdown">\$\{settlementBreakdown\(\)\}/);
});

test('Add Expense keeps a compact primary flow with optional details collapsed',()=>{
 assert.match(app,/ref-expense-main-card/);
 assert.match(app,/ref-expense-pair ref-expense-pair-split/);
 assert.match(app,/details class="ref-expense-card ref-expense-more-card"/);
 assert.match(app,/Sheet, notes & receipt/);
 assert.doesNotMatch(app,/Who is this with\?/);
});

test('Add Expense exposes both final save actions at the end of the form',()=>{
 assert.match(app,/section class="ref-expense-submit-card"/);
 assert.match(app,/id="save-expense".*Save expense/s);
 assert.match(app,/class="secondary save-another" type="submit" name="saveMode" value="another">Save & add another/);
});

test('Add Expense More options stays truly collapsed until opened',()=>{
 assert.match(addExpenseCss,/ref-expense-more-card:not\(\[open\]\) > \.ref-expense-more-body\{\s*display:none!important/);
 assert.match(addExpenseCss,/ref-expense-more-card\[open\] > \.ref-expense-more-body\{\s*display:grid!important/);
});
