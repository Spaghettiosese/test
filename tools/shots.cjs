// Headless screenshots of the weapon preview page.
// node tools/shots.cjs out-prefix '[{"gun":"m4a1","clip":"Idle","t":0,"view":"fp"}, ...]'
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const [prefix, json, w = '960', h = '600', page_ = 'tools/preview.html'] = process.argv.slice(2);
  const shots = JSON.parse(json);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const logs = [];
  page.on('console', (m) => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message));
  page.setDefaultTimeout(240000);
  await page.goto('http://localhost:8089/' + page_);
  await page.waitForFunction('window.ready === true', null, { timeout: 240000 }).catch(() => {});
  let i = 0;
  for (const s of shots) {
    await page.evaluate((s) => { window.show(s); }, s).catch((e) => logs.push('EVAL: ' + e.message));
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => r())));
    await page.screenshot({ path: `${prefix}-${i++}.png` });
  }
  console.log(logs.slice(0, 30).join('\n'));
  await browser.close();
})();
