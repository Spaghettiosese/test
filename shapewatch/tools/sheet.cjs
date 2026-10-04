// node tools/sheet.cjs out.png "front,back" "hero,hero" width — renders hero model turnarounds in headless Chromium
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const [out, views = 'front,back', only = '', w = '1500'] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +w, height: 900 } }); const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); }); page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message));
  page.setDefaultTimeout(300000);
  await page.goto(`http://localhost:8089/shapewatch/tools/sheet.html?views=${views}${only ? '&only=' + only : ''}`);
  await page.waitForFunction('window.__done === true', null, { timeout: 300000 }).catch((e) => logs.push('timeout ' + e.message));
  await page.screenshot({ path: out, fullPage: true });
  console.log(logs.slice(0, 20).join('\n') || 'clean'); await browser.close();
})();
