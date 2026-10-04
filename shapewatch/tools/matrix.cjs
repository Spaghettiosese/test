// node tools/matrix.cjs outdir [hero] — plays every mode/map combo headlessly in Chromium, steps the sim and screenshots the HUD
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const COMBOS = [['escort', 'frostgate'], ['escort', 'sunscar'], ['hybrid', 'junction'], ['control', 'lumen'], ['control', 'foundry'], ['tdm', 'frostgate'], ['tdm', 'lumen'], ['tdm', 'foundry'], ['ffa', 'lumen'], ['ffa', 'foundry'], ['training', 'foundry']];
(async () => {
  const [out, hero = 'sabre', only = ''] = process.argv.slice(2);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } }); const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' && !/ERR_CERT/.test(m.text())) logs.push(m.type() + ': ' + m.text()); }); page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message + (e.stack ? '\n' + e.stack.split('\n').slice(0, 4).join('\n') : '')));
  page.setDefaultTimeout(300000);
  await page.goto('http://localhost:8089/shapewatch/index.html'); await page.waitForFunction('!!window.__sw');
  for (const [mode, map] of COMBOS) {
    if (only && !only.split(',').includes(mode + ':' + map)) continue;
    const before = logs.length;
    await page.evaluate(([m, mp, h]) => { const s = __sw; s.settings.mode = m; s.settings.map = mp; s.settings.hero = h; s.startMatch(); }, [mode, map, hero]);
    await page.waitForTimeout(600);
    await page.evaluate(() => { __sw.sim.readyUp = true; __sw.step(10); });
    await page.waitForTimeout(500);
    const info = await page.evaluate(() => { __sw.autoplay(true); const t0 = performance.now(); __sw.step(60 * 12); return { mode: __sw.mode, state: __sw.sim.state, t: +__sw.sim.time.toFixed(1), ms: Math.round(performance.now() - t0), units: __sw.sim.units.length, elims: __sw.sim.player.stats.elims }; });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${out}/m-${mode}-${map}.png` });
    console.log(mode, map, JSON.stringify(info), logs.length > before ? 'ERRORS' : 'ok');
  }
  console.log(logs.slice(0, 30).join('\n') || 'no errors'); await browser.close();
})();
