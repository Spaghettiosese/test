// Tiles screenshots into one contact sheet: node tools/sheet.cjs out.png cols img1.png img2.png ...
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
(async () => {
  const [out, cols, ...files] = process.argv.slice(2);
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: +(process.env.WIDTH || 1280), height: 800 } });
  const html = `<body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},1fr);gap:2px">${files.map((f) => `<img style="width:100%" src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}">`).join('')}</body>`;
  await p.setContent(html); await p.waitForTimeout(300);
  const h = await p.evaluate(() => document.body.scrollHeight); await p.setViewportSize({ width: +(process.env.WIDTH || 1280), height: h });
  await p.screenshot({ path: out, fullPage: true }); await b.close();
})();
