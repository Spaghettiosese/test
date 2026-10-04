// Headless screenshots: node shapewatch/tools/shots.cjs out-prefix '[{"js":"...","wait":500}, ...]' [w h]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const [prefix, json, w = '1280', h = '720'] = process.argv.slice(2);
  const steps = JSON.parse(json);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const logs = [];
  page.on('console', (m) => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message + (e.stack ? '\n' + e.stack.split('\n').slice(0, 4).join('\n') : '')));
  page.setDefaultTimeout(300000);
  await page.goto('http://localhost:8089/shapewatch/index.html');
  await page.waitForFunction('!!window.__sw', null, { timeout: 300000 }).catch((e) => logs.push('no __sw ' + e.message));
  let i = 0;
  for (const s of steps) {
    if (s.js) { const r = await page.evaluate(s.js).catch((e) => { logs.push('EVAL: ' + e.message); }); if (r !== undefined) logs.push('RESULT: ' + JSON.stringify(r)); }
    if (s.wait) await page.waitForTimeout(s.wait);
    if (s.shot !== false) await page.screenshot({ path: `${prefix}-${i++}.png` });
  }
  console.log(logs.slice(0, 60).join('\n'));
  await browser.close();
})();
