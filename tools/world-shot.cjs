// node tools/world-shot.cjs out-prefix '[{"pos":[x,y,z],"target":[x,y,z],"fov":70}, ...]' [page] [w] [h]
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const [prefix, json, page_ = 'tools/world-preview.html', w = '1280', h = '720'] = process.argv.slice(2);
  const shots = JSON.parse(json);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const logs = [];
  page.on('console', (m) => logs.push(m.type() + ': ' + m.text()));
  page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message));
  page.setDefaultTimeout(240000);
  await page.goto('http://localhost:8089/' + page_);
  await page.waitForFunction('window.ready === true', null, { timeout: 240000 }).catch(() => logs.push('never ready'));
  let i = 0;
  for (const s of shots) {
    const r = await page.evaluate((s) => window.show(s), s).catch((e) => logs.push('EVAL: ' + e.message));
    logs.push('shot ' + i + ' ' + JSON.stringify(r));
    await page.screenshot({ path: `${prefix}-${i++}.png` });
  }
  console.log(logs.slice(0, 40).join('\n'));
  await browser.close();
})();
