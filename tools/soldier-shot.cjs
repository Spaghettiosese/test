// node tools/soldier-shot.cjs prefix '{"ids":["hammer"],"gun":"m4a1"}' '[{...show args}]'
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const [prefix, setupJson, json, w = '960', h = '720'] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const logs = [];
  page.on('console', (m) => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message));
  page.setDefaultTimeout(240000);
  await page.goto('http://localhost:8089/tools/soldier-preview.html');
  await page.waitForFunction('window.ready === true', null, { timeout: 240000 }).catch(() => logs.push('never ready'));
  const s = JSON.parse(setupJson);
  const ms = await page.evaluate((s) => window.setup(s.ids, s.gun), s).catch((e) => logs.push('SETUP: ' + e.message));
  logs.push('setup ms ' + ms);
  let i = 0;
  for (const a of JSON.parse(json)) {
    const r = await page.evaluate((a) => window.show(a), a).catch((e) => logs.push('SHOW: ' + e.message));
    logs.push('shot ' + i + ' ' + JSON.stringify(r));
    await page.screenshot({ path: `${prefix}-${i++}.png` });
  }
  console.log(logs.slice(0, 30).join('\n'));
  await browser.close();
})();
