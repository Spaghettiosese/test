// node tools/app-shot.cjs prefix '[{"js":"...","wait":500,"shot":true}, ...]' [w] [h]   (needs a static server on :8089)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const [prefix, json, w = '1280', h = '720'] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const logs = [];
  page.on('console', (m) => { if (m.type() !== 'log' || process.env.LOGS) logs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message + (e.stack ? ' ' + e.stack.split('\n').slice(1, 4).join(' | ') : '')));
  page.setDefaultTimeout(280000);
  await page.goto('http://localhost:8089/index.html');
  await page.waitForFunction('window.app && document.body.classList.contains("ready")', null, { timeout: 120000 }).catch(() => logs.push('never ready'));
  let i = 0;
  for (const s of JSON.parse(json)) {
    const t0 = Date.now();
    if (s.js) { const r = await page.evaluate(s.js).catch((e) => logs.push('EVAL: ' + e.message.split('\n')[0])); if (r !== undefined) logs.push('eval -> ' + JSON.stringify(r)); }
    if (s.click) await page.click(s.click).catch((e) => logs.push('CLICK ' + s.click + ': ' + e.message.split('\n')[0]));
    if (s.key) await page.keyboard.press(s.key);
    if (s.wait) await page.waitForTimeout(s.wait);
    if (s.until) await page.waitForFunction(s.until, null, { timeout: s.timeout || 120000 }).catch(() => logs.push('timeout: ' + s.until));
    if (s.shot !== false) await page.screenshot({ path: `${prefix}-${i++}.png` });
    logs.push(`step ${i} ${Date.now() - t0}ms`);
  }
  console.log(logs.slice(0, 60).join('\n'));
  await browser.close();
})();
