// Headless screenshots of the game: node tools/game-shots.cjs out-prefix '[{"js":"...","wait":500}, ...]'
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const [prefix, json, w = '1200', h = '720'] = process.argv.slice(2);
  const steps = JSON.parse(json);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const logs = [];
  page.on('console', (m) => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message));
  page.setDefaultTimeout(300000);
  await page.goto('http://localhost:8089/index.html');
  await page.waitForFunction('!!window.__range', null, { timeout: 300000 }).catch((e) => logs.push('no __range ' + e.message));
  let i = 0;
  for (const s of steps) {
    if (s.js) await page.evaluate(s.js).catch((e) => logs.push('EVAL: ' + e.message));
    if (s.shot !== false) await page.screenshot({ path: `${prefix}-${i++}.png` });
  }
  console.log(logs.slice(0, 40).join('\n'));
  await browser.close();
})();
