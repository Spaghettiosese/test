const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const out = process.argv[2];
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); const logs = [];
  p.on('console', (m) => { if (m.type() === 'error' && !/ERR_CERT/.test(m.text())) logs.push(m.text()); }); p.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message + '\n' + (e.stack || '').split('\n').slice(0, 4).join('\n')));
  p.setDefaultTimeout(300000);
  await p.goto('http://localhost:8089/shapewatch/index.html'); await p.waitForFunction('!!window.__sw');
  await p.evaluate(() => { const s = __sw; s.settings.mode = 'tdm'; s.settings.map = 'foundry'; s.settings.hero = 'sabre'; s.startMatch(); });
  await p.waitForTimeout(500);
  await p.evaluate(() => { __sw.sim.readyUp = true; __sw.step(5); __sw.autoplay(true); __sw.step(60 * 60); });
  const info = await p.evaluate(() => ({ clips: __sw.recorder.clips.length, hl: __sw.sim.hl.length, el: __sw.sim.player.stats.elims, mode: __sw.mode }));
  console.log(JSON.stringify(info));
  // killcam
  const kc = await p.evaluate(() => { const s = __sw.sim, me = s.player, k = s.units.find((u) => u.team !== me.team && !u.deploy); const c = __sw.recorder.killcam(me, k); if (!c) return 'noclip'; me.alive = false; __sw.startReplay(c, 'killcam'); return c.frames.length; });
  console.log('killcam', kc); await p.waitForTimeout(2500); await p.screenshot({ path: out + '/e-killcam.png' });
  await p.evaluate(() => __sw.endKillcam());
  await p.evaluate(() => { __sw.sim.finish(0, 'Test'); __sw.step(2); });
  await p.evaluate(() => __sw.endMatch()); await p.waitForTimeout(3000); await p.screenshot({ path: out + '/e-potg.png' });
  await p.evaluate(() => __sw.endClip()); await p.waitForTimeout(2500); await p.screenshot({ path: out + '/e-end.png' });
  console.log(JSON.stringify(await p.evaluate(() => __sw.mode)), logs.join('\n') || 'no errors'); await b.close();
})();
