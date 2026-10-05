// node tools/dev-shot.cjs prefix '<setup js>' '[{"js":"...","shot":true}, ...]' [w] [h]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const [prefix, setup, json, w = '1280', h = '720'] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const logs = [];
  page.on('console', (m) => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message + (e.stack ? ' ' + e.stack.split('\n').slice(1, 4).join(' | ') : '')));
  page.setDefaultTimeout(280000);
  await page.goto('http://localhost:8089/tools/dev-game.html');
  await page.waitForFunction('window.ready === true', null, { timeout: 120000 }).catch(() => logs.push('never ready'));
  const t0 = Date.now();
  await page.evaluate(setup).catch((e) => logs.push('SETUP: ' + e.message));
  logs.push('setup ms ' + (Date.now() - t0));
  let i = 0;
  for (const s of JSON.parse(json)) {
    const r = await page.evaluate(s.js).catch((e) => logs.push('EVAL: ' + e.message.split('\n')[0]));
    if (r !== undefined) logs.push('eval -> ' + JSON.stringify(r));
    if (s.shot !== false) await page.screenshot({ path: `${prefix}-${i++}.png` });
  }
  console.log(logs.slice(0, 40).join('\n'));
  await browser.close();
})();
