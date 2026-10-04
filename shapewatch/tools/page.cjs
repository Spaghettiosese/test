// node tools/page.cjs <path-and-query> <out.png> [waitExpr] [w] [h] — screenshot any page of the dev server
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const [path, out, wait = 'window.__done === true', w = '1500', h = '900'] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } }); const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); }); page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message + (e.stack ? '\n' + e.stack.split('\n').slice(0, 3).join('\n') : '')));
  page.setDefaultTimeout(300000);
  await page.goto('http://localhost:8089/shapewatch/' + path);
  await page.waitForFunction(wait, null, { timeout: 300000 }).catch((e) => logs.push('timeout ' + e.message));
  await page.screenshot({ path: out, fullPage: true });
  console.log(logs.slice(0, 20).join('\n') || 'clean'); await browser.close();
})();
