import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');

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
