// Headless smoke test: world reachability + random-walk through every dialogue. Usage: node lastbell/tools/test-game.js
const fs = require('fs'), path = require('path'), vm = require('vm');
global.window = global; global.localStorage = { _d: {}, getItem(k) { return this._d[k] || null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } };
const root = path.join(__dirname, '..');
for (const f of ['world', 'skills', 'items', 'tasks', 'thoughts', 'barks', 'dialogue_a', 'dialogue_b']) { const p = path.join(root, 'data', f + '.js'); if (fs.existsSync(p)) vm.runInThisContext(fs.readFileSync(p, 'utf8'), { filename: p }); }
const G = require(path.join(root, 'js/engine.js')); const GD = global.GD;
let bad = 0; const fail = (m) => { bad++; console.log('FAIL ' + m); };
G.newGame({ name: 'Test' }); while (G.D) G.closeDialogue();
// reachability
for (const l of Object.values(GD.locations)) {
  G.S.loc = l.id; const b = G.blockedSet(l);
  const sp = l.spawn; if (b.has(sp.x + ',' + sp.y)) fail(`${l.id}: spawn blocked`);
  for (const h of G.hotspots ? (G.S.loc = l.id, G.hotspots()) : []) {
    let ok = false;
    for (let dx = -1; dx <= 1 && !ok; dx++) for (let dy = -1; dy <= 1 && !ok; dy++) {
      const x = Math.round(h.x) + dx, y = Math.round(h.y) + dy;
      if (h.kind === 'exit' && (dx || dy)) continue;
      if (x < 0 || y < 0 || x >= l.w || y >= l.h) continue;
      const bb = G.blockedSet(l, h.id); if (!bb.has(x + ',' + y) && G.findPath(l, sp.x, sp.y, x, y, bb)) ok = true;
    }
    if (!ok) fail(`${l.id}: hotspot ${h.id} unreachable`);
  }
  for (const e of l.exits || []) if (e.to) { const t = GD.locations[e.to]; if (G.blockedSet(t).has(e.toX + ',' + e.toY)) fail(`${l.id}->${e.to}: arrival tile blocked`); }
}
// random playthroughs
let runs = 0;
for (let r = 0; r < 60; r++) {
  G.newGame({ name: 'Bot', attrs: { intellect: 1 + (r % 5), psyche: 3, physique: 3, motorics: 1 + ((r >> 2) % 5) } });
  try {
    let guard = 0;
    while (G.S && !G.S.ending && guard++ < 400) {
      if (!G.D) {
        const hs = G.hotspots().filter((h) => h.kind !== 'exit' && G.dialogues()[h.dialogue]);
        const h = hs[Math.floor(Math.random() * hs.length)];
        if (Math.random() < 0.25) { const ex = GD.locations[G.S.loc].exits.filter((e) => e.to); const e = ex[Math.floor(Math.random() * ex.length)]; G.S.flags.boiler_unlocked = true; G.teleport(e.to, e.toX, e.toY); }
        else G.startDialogue(h.dialogue);
        continue;
      }
      if (G.D.roll) { G.continueRoll(); continue; }
      let n = 0; while (G.D && n++ < 80) { if (G.D.roll) { G.continueRoll(); continue; } const ch = G.D.choices.filter((c) => !c.locked); if (!ch.length) { G.closeDialogue(); break; } const c = ch[Math.floor(Math.random() * ch.length)]; G.choose(G.D.choices.indexOf(c)); }
      if (G.D) G.closeDialogue();
      if (guard % 7 === 0) G.addTime(30);
    }
    runs++;
  } catch (e) { fail('run ' + r + ': ' + e.stack.split('\n').slice(0, 3).join(' | ')); break; }
}
console.log(`random runs ok: ${runs}`);
console.log(bad ? `FAILED ${bad}` : 'OK');
process.exit(bad ? 1 : 0);
