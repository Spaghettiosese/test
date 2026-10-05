const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const [prefix, json, w = '1280', h = '720'] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const logs = []; page.on('console', (m) => logs.push(m.type() + ': ' + m.text())); page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message));
  page.setDefaultTimeout(200000);
  await page.goto('http://localhost:8089/tools/menu-preview.html');
  await page.waitForFunction('window.ready === true');
  let i = 0;
  for (const s of JSON.parse(json)) { await page.evaluate((s) => window.show(s), s).catch((e) => logs.push('EVAL ' + e.message.split('\n')[0])); await page.screenshot({ path: `${prefix}-${i++}.png` }); }
  console.log(logs.slice(0, 20).join('\n')); await browser.close();
})();
