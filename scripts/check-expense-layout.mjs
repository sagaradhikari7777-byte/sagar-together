// Browser checks for the expense editor in sample mode: layout at phone, tablet
// and short (keyboard-sized) viewports in light and dark, then the full entry flow.
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const require = createRequire(import.meta.url);
const assert = require('node:assert/strict');
const fs = require('node:fs');
let browsers;
try { browsers = require('playwright'); }
catch (error) {
  if (!process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES) throw new Error('Install Playwright to run browser checks: npm install --no-save playwright');
  browsers = require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright'));
}
const {chromium, webkit} = browsers;
const {spawn} = require('node:child_process');
const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = process.env.TOGETHER_QA_OUTPUT;
const url = process.argv.find(arg => /^https?:/.test(arg)) || 'http://localhost:3010';
const engines = process.argv.includes('--webkit') ? [[webkit, 'webkit']] : [[chromium, 'chromium']];
const editor = 'dialog.editor[open]';
const top = page => page.locator('dialog.sheet[open]:not(.is-closing)').last();
const settle = page => page.waitForTimeout(500);
const keyNames = {'.': 'Decimal point', '+': 'Add', '−': 'Subtract', '×': 'Multiply', '÷': 'Divide', '⌫': 'Delete'};
const press = async (page, keys) => {
  // The keypad docks above Save while the amount is being entered; tapping the amount opens it.
  if (!(await page.locator(`${editor} .keypad`).count())) await page.locator('#amount-entry').click();
  for (const k of keys) await page.locator(`${editor} .keypad`).getByRole('button', {name: keyNames[k] || k, exact: true}).click();
};
let server;

async function entry(page) {
  await page.goto(url);
  await page.locator('#demo-start').click();
  await page.locator('.tabbar [data-action="add"]').click();
  await page.locator(`${editor} .editor-form`).waitFor();
  await settle(page);
}

/** The editor fits its viewport: nothing overflows sideways, blocks never overlap, Save stays reachable. */
async function layout(page, label) {
  const report = await page.evaluate(sel => {
    const d = document.querySelector(sel), body = d.querySelector('.sheet-body'), panel = d.querySelector('.sheet-panel');
    const r = e => e.getBoundingClientRect().toJSON();
    const blocks = [...body.children].filter(e => getComputedStyle(e).display !== 'none' && getComputedStyle(e).position !== 'sticky').map(e => ({name: e.className || e.tagName, ...r(e)}));
    const keys = [...d.querySelectorAll('.key')].map(r);
    return {blocks, keys, body: {...r(body), scrollWidth: body.scrollWidth, clientWidth: body.clientWidth}, panel: r(panel), save: r(d.querySelector('#save-expense')), viewport: {width: innerWidth, height: innerHeight}};
  }, editor);
  assert.ok(report.body.scrollWidth <= report.body.clientWidth + 1, `${label}: editor has horizontal overflow`);
  for (let i = 1; i < report.blocks.length; i++)
    assert.ok(report.blocks[i].top >= report.blocks[i - 1].bottom - 1, `${label}: ${report.blocks[i].name} overlaps ${report.blocks[i - 1].name}`);
  for (const key of report.keys) {
    assert.ok(key.height >= 44 && key.width >= 44, `${label}: keypad key smaller than a 44pt target`);
    assert.ok(key.left >= report.panel.left && key.right <= report.panel.right, `${label}: keypad extends outside the sheet`);
    assert.ok(key.top >= 0 && key.bottom <= report.viewport.height + 1, `${label}: keypad is off screen`);
  }
  assert.ok(report.panel.left >= 0 && report.panel.right <= report.viewport.width + 1, `${label}: sheet wider than the viewport`);
  assert.ok(report.save.bottom <= report.viewport.height + 1 && report.save.top >= 0, `${label}: Save is off screen`);
  return report;
}

(async () => {
  if (url.startsWith('http://localhost')) {
    server = spawn(process.execPath, ['scripts/dev.mjs'], {cwd: source, env: {...process.env, PORT: '3010'}, stdio: ['ignore', 'pipe', 'pipe']});
    await new Promise((resolve, reject) => { server.stdout.once('data', resolve); server.on('error', reject); server.once('exit', code => reject(new Error('Server exited ' + code))); });
  }
  const results = [];
  if (out) fs.mkdirSync(out, {recursive: true});
  try {
    for (const [engine, name] of engines) {
      const executable = name === 'chromium' ? process.env.TOGETHER_QA_CHROMIUM : process.env.TOGETHER_QA_WEBKIT;
      const browser = await engine.launch({headless: true, ...(executable ? {executablePath: executable} : {}), ...(name === 'chromium' ? {args: ['--no-sandbox', '--disable-gpu']} : {})});
      try {
        for (const [width, height] of [[320, 568], [375, 667], [390, 844], [440, 956], [900, 900]]) for (const dark of [false, true]) {
          const page = await browser.newPage({viewport: {width, height}, isMobile: width < 700, hasTouch: width < 700, deviceScaleFactor: 1, locale: 'en-AU', timezoneId: 'Australia/Sydney'});
          const errors = []; page.on('pageerror', e => errors.push(e.message));
          await page.route('**/api/household', route => { errors.push('Sample-mode QA attempted a household API request'); route.abort(); });
          await page.addInitScript(dark => localStorage.setItem('together-theme', dark ? 'dark' : 'light'), dark);
          await entry(page);
          const label = `${name} ${width}x${height} ${dark ? 'dark' : 'light'}`;
          await layout(page, label);
          for (const sel of ['[data-pick="merchants"]', '[data-pick="categories"]', 'input[name="date"]', '[data-payer="0"]', '[data-payer="3"]', '[data-split="half"]', '[data-split="b"]', 'input[name="notes"]', '#choose-receipt'])
            assert.equal(await page.locator(`${editor} ${sel}`).count(), 1, `${label}: ${sel} is on the form`);
          await press(page, '45.5');
          assert.equal(await page.locator('#expense-amount').getAttribute('data-value'), '4550');
          await layout(page, label + ' amount entered');
          if (width === 440 && out) await page.screenshot({path: `${out}/editor-${name}-${dark ? 'dark' : 'light'}.png`});
          assert.deepEqual(errors, [], label + ' console errors');
          results.push({label, status: 'PASS'});
          await page.close();
        }

        const page = await browser.newPage({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, locale: 'en-AU', timezoneId: 'Australia/Sydney'});
        const errors = []; page.on('pageerror', e => errors.push(e.message));
        await entry(page);
        await press(page, '100+23.45');
        assert.equal(await page.locator('#expense-amount').getAttribute('data-value'), '12345', 'the keypad calculates');
        await page.locator(`${editor} [data-pick="merchants"]`).click(); await settle(page);
        const search = top(page).locator('#catalog-search');
        assert.ok(parseFloat(await search.evaluate(e => getComputedStyle(e).fontSize)) >= 16, 'search input avoids iOS focus zoom');
        await search.fill('Wool');
        await top(page).locator('[data-choice="Woolworths"]').click(); await settle(page);
        assert.equal(await page.locator(`${editor} .field-row-merchant strong`).innerText(), 'Woolworths');
        await page.locator(`${editor} [data-pick="categories"]`).click(); await settle(page);
        await top(page).locator('[data-choice="Groceries"]').click(); await settle(page);
        await page.locator(`${editor} [data-payer="2"]`).click();
        await page.locator(`${editor} [data-split="b"]`).click();
        assert.equal(await page.locator(`${editor} [data-payer="2"]`).getAttribute('aria-checked'), 'true');
        assert.equal(await page.locator(`${editor} .keypad`).count(), 0, 'choosing an option puts the keypad away');
        await page.locator(`${editor} [name="notes"]`).fill('Layout QA expense');
        assert.match(await page.locator('#split-preview').innerText(), /Nabin & Sujata\s*\$123\.45/);
        await layout(page, name + ' details chosen');

        const chooserPromise = page.waitForEvent('filechooser');
        await page.locator('#choose-receipt').click();
        const chooser = await chooserPromise;
        await chooser.setFiles({name: 'test-receipt.png', mimeType: 'image/png', buffer: fs.readFileSync(source + '/public/icon-192.png')});
        await page.locator('#receipt-preview').waitFor();
        assert.equal(await page.locator('#remove-receipt').isVisible(), true);
        await page.locator('#remove-receipt').click();
        assert.equal(await page.locator('#receipt-preview').count(), 0);
        await page.locator('#receipt-file').setInputFiles({name: 'invalid.txt', mimeType: 'text/plain', buffer: Buffer.from('invalid image')});
        await page.locator(`${editor} .form-error`).waitFor();

        await page.locator(`${editor} .sheet-head [aria-label="Close"]`).click();
        await page.locator(`${editor} .prompt`).waitFor();
        await layout(page, name + ' unsaved prompt');
        await page.locator('[data-keep]').click();
        assert.equal(await page.locator(`${editor} .prompt`).count(), 0);
        await page.locator('#save-expense').click();
        await page.locator('.toast.is-shown', {hasText: 'Expense saved'}).waitFor();
        await page.locator(editor).waitFor({state: 'detached'});
        assert.equal(await page.locator('.xrow-title', {hasText: 'Woolworths'}).first().isVisible(), true);
        assert.deepEqual(errors, [], name + ' flow console errors');
        results.push({label: name + ' keypad / pickers / receipt attach-remove-error / unsaved prompt / save', status: 'PASS'});
        await page.close();
      } finally { await browser.close(); }
    }
    if (out) fs.writeFileSync(path.join(out, 'browser-results.json'), JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
  } finally { if (server) server.kill(); }
})().catch(e => { console.error(e); if (server) server.kill(); process.exitCode = 1; });
