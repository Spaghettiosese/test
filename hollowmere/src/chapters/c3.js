// Chapter III · The Hollow Night. The dead march on Ashgate. Captain Harl offers a truce and a
// pardon for a sword at the south gate; Sable's diggers go down for the Binder's skull; her knives
// climb Ravenspire's bell tower for the bell's tongue. Take the Bone and the Bell before she does.
import * as E from '../../../engine/index.js';
import { handKnife, hollowKnight, cantor, shieldGuard, watchman } from './cast.js';

const hyp = Math.hypot;
const L = (text, o = {}) => ({ text, ...o });
const GATE = [0, 3], TOMB = [105.5, 52], TOMB_LID = [105.5, 54.6], TOWER = [32.3, 149.3];
const WAVES = [
  { hollow: 6 },
  { hollow: 6, brute: 2 },
  { hollow: 5, screamer: 2, cantor: 2 },
  { hollow: 6, brute: 1, knight: 1 },
];

export class Chapter3 {
  constructor(g, c) { this.g = g; this.c = c; this.s = { siege: null, wave: 0, dead: [], crypt: false, belfry: false }; this.alive = []; this.awayT = 0; }
  prologue() { return [['', 'Three nights after the theft, the dead came up out of the fields and the fens in their hundreds, and walked on Ashgate.', 5.5], ['Rook', 'Sable wants the Bone and the Bell tonight, while the Watch is busy dying at the gate. Then she will want me.', 5]]; }
  targetFor(id) { return { c3_harl: () => GATE, c3_siege: () => GATE, c3_bone: () => (this.g.story.zone === 'crypt' || this.g.story.zone === 'undercroft' ? TOMB : [-42.3, 84.3]), c3_bell: () => (this.g.story.zone === 'belfry' ? [-136, 300] : TOWER) }[id] || null; }
  start() {
    const c = this.c;
    c.objective('c3_harl', 'Meet Captain Harl at Ashgate\'s south gate', 'A Watch runner found you on the road: the Captain will parley. He knows exactly who you are.', () => GATE);
    c.objective('c3_bone', 'Take the Binder\'s skull from his tomb in the catacombs', 'Sable\'s diggers go down tonight. The mausoleum in the graveyard is the way in.', () => this.targetFor('c3_bone')(), { quiet: true });
    c.objective('c3_bell', 'Take the tongue of Ravenspire\'s bell', 'The bell hangs in the keep\'s north-east tower. Her knives are climbing it tonight.', () => this.targetFor('c3_bell')(), { quiet: true });
    this.g.story.tracked = 'c3_harl'; c.facts.truce = true;   // the parley is a truce: the Watch lets you walk up to the gate tonight
    this.world(true);
  }
  // ------------------------------------------------------------ the world on the Hollow Night
  world(active) {
    const g = this.g; if (!active) return;
    // Harl waits at the gate to parley, and stays there for the night
    const harl = this.harl();
    if (harl && !harl.dead && this.c.index() === 2) { if (!g.level.pois.gate_harl) g.level.pois.gate_harl = { name: 'gate_harl', x: 0.6, z: 2.2, y: 0, yaw: 180, type: 'stand', approach: [0.6, 2.2] }; harl.schedule = [{ h0: 0, h1: 24, poi: 'gate_harl', act: 'guard' }]; if (harl.slotKey !== 'gate_harlguard0') { harl.leaveActivity(); harl.slotKey = ''; harl.state = 'routine'; harl.snapToSchedule(); } harl.talkable = true; }
    if (this.barr) return;
    const k = new E.Kit(g.level.pal), M = g.level.pal;
    for (const [x0, x1] of [[-15, -3.2], [3.2, 15]]) {
      for (let x = x0; x < x1; x += 1.6) { k.cyl(M.timber, [x + 0.8, 0.55, -3], 0.14, 1.9, [0, 0, 62], 6); k.cyl(M.timber, [x + 0.8, 0.55, -3], 0.14, 1.9, [0, 0, -62], 6); k.cyl(M.timber, [x + 0.8, 0.9, -3], 0.1, 1.7, [90, 0, 0], 6); }
      g.level.collider?.(x0, 0, -3.4, x1, 1.1, -2.6, 'wood'); g.nav.block(x0, -3.4, x1, -2.6, 1);
    }
    this.barr = k.toNode('Barricades'); g.scene.add(this.barr);
    for (const x of [-4.2, 4.2]) { const l = new E.Light('point', { color: '#ffa860', intensity: 9, range: 12, flicker: 0.5 }); l.position.set([x, 1.4, -1.2]); g.scene.add(l); g.level.lights.push(l); g.level.fires.push({ x, y: 0.9, z: -1.2, r: 0.3, lit: true, light: l, base: 9, phase: Math.random() * 6, kind: 'brazier' }); }
  }
  calm() { return !!this.s.siege && this.s.siege !== 'won' && this.s.siege !== 'failed'; }
  // ------------------------------------------------------------ Harl and the truce
  harl() { return this.g.npcs.find((n) => n.id === 'harl'); }
  dialogue(npc) {
    const g = this.g, c = this.c, F = c.facts;
    if (npc.id === 'harl' && c.index() >= 2 && c.has('c3_harl') && !c.isDone('c3_harl')) {
      const night = g.clock.hours >= 21.8 || g.clock.hours < 4;
      const accept = () => { F.truce = true; c.done('c3_harl'); c.objective('c3_siege', 'Hold Ashgate\'s south gate with the Watch until the bell stops', 'From the tenth bell, when the dead come. Four waves, they say. Nobody has counted past four and lived.', () => GATE); this.s.siege = 'waiting'; g.story.tracked = 'c3_siege'; };
      return [
        L('So. The thief of Ravenspire. Do not reach for that sword: there are twelve crossbows on the wall, and they are all very tired.', { mood: 'anger' }),
        L('The dead are coming tonight, hundreds of them. I have forty men and one gate. They tell me you are worth ten of mine, and I am in no position to be proud.'),
        L('Hold the gate with us until the bell stops. Live through it, and you walk out of Ashgate with the Duke\'s pardon. The keep forgets your face. The Watch forgets your name.', { choices: [
          { text: 'I will hold the gate.', next: night ? 3 : 4, action: accept },
          { text: 'I have my own business tonight.', next: 5, action: () => { F.truceRefused = true; F.truce = false; c.done('c3_harl'); } }] }),
        L('Then stand where the torches are. Here they come.', { end: true, onShow: () => this.startSiege() }),
        L('Come back at the tenth bell. The dead keep good time.', { choices: [{ text: '(Wait for nightfall.)', next: 'end', action: () => { g.clock.hours = 21.85; for (const n of g.npcs) if (n.role !== 'hollow' && !n.dead) { n.leaveActivity(); n.slotKey = ''; n.snapToSchedule(); } g.toast('The light goes out of the sky'); g.sfx.bell?.(3); } }, { text: 'I will be back.', next: 'end' }] }),
        L('Then stay out of my sight, thief. If the dead do not get you, my crossbows will.', { end: true }),
      ];
    }
    if (npc.id === 'harl' && this.s.siege === 'won' && !F.harlThanks) return [L('You held. I would not have bet a copper on it. The pardon stands; the Duke\'s seal is on it, near enough.', { onShow: () => { F.harlThanks = true; } }), L('Whatever you are going to do next... do it far from my town.', { end: true })];
    return null;
  }
  world2() {}
  // ------------------------------------------------------------ the siege
  startSiege() {
    const g = this.g, S = this.s; if (S.siege === 'on' || S.siege === 'won') return;
    S.siege = 'on'; S.wave = 0; this.waveT = 4; this.alive = [];
    g.ui.flashBanner('THE HOLLOW NIGHT', 3000); g.sfx.bell?.(4); g.sfx.sting?.('challenge');
    g.setCheckpoint([0, 0.1, 8], Math.PI);
    // the defenders: Harl, the gate guards, and those the captain could spare
    const harl = this.harl(); if (harl && !harl.dead) { harl.schedule = [{ h0: 0, h1: 24, poi: 'gate_outside', act: 'guard' }]; harl.leaveActivity(); harl.x = 1; harl.z = 1; harl.slotKey = ''; harl.state = 'routine'; harl.snapToSchedule(); }
    const extra = [['c3_def_s1', -5, -0.5, shieldGuard], ['c3_def_s2', 5, -0.5, shieldGuard], ['c3_def_w1', -9, 1, watchman], ['c3_def_w2', 9, 1, watchman], ['c3_def_x1', -2, 4, (id, x, z) => watchman(id, x, z, { weapon: 'crossbow', name: 'Watch crossbowman' })]];
    for (const [id, x, z, mk] of extra) if (!g.npcs.some((n) => n.id === id) && !S.dead.includes(id)) { const n = g.spawnNpc(mk(id, x, z, { yaw: 180 })); n.trustUntil = 1e9; }
    for (const n of g.npcs) if ((n.faction === 'watch' || n.role === 'captain') && !n.dead) n.trustUntil = 1e9;
  }
  spawnWave() {
    const g = this.g, S = this.s, W = WAVES[S.wave]; this.alive = [];
    const at = () => { const a = (Math.random() - 0.5) * 1.6, d = 46 + Math.random() * 14; const q = g.nav.nearestWalkable(Math.sin(a) * d * 0.7, -d, 6); return q || [0, -50]; };
    const add = (n) => { this.alive.push(n.id); n.state = 'investigate'; n.stim = [GATE[0], GATE[1]]; n.investT = 60; n.alert = 0.9; n.goTo(GATE[0] + (Math.random() - 0.5) * 8, GATE[1] - 4, 2.4); };
    for (let i = 0; i < (W.hollow || 0); i++) { const q = at(); add(g.story.spawnHollow(q[0], q[1], true, false, 'plain')); }
    for (let i = 0; i < (W.brute || 0); i++) { const q = at(); add(g.story.spawnHollow(q[0], q[1], true, false, 'brute')); }
    for (let i = 0; i < (W.screamer || 0); i++) { const q = at(); add(g.story.spawnHollow(q[0], q[1], true, false, 'screamer')); }
    for (let i = 0; i < (W.cantor || 0); i++) { const q = at(); const n = g.spawnNpc(cantor('c3_cantor_' + S.wave + '_' + i, q[0], q[1])); add(n); }
    for (let i = 0; i < (W.knight || 0); i++) { const q = at(); const n = g.spawnNpc(hollowKnight('c3_knight_' + i, q[0], q[1])); add(n); g.ui.flashBanner('A HOLLOW KNIGHT', 2200, true); }
    S.wave++; g.ui.flashBanner(`WAVE ${S.wave} OF ${WAVES.length}`, 2200, true); g.sfx.hollowCry?.([0, 1, -40]); g.sfx.bell?.(1);
    this.c.objective('c3_siege', `Hold Ashgate's south gate (wave ${S.wave} of ${WAVES.length})`);
  }
  updateSiege(dt) {
    const g = this.g, S = this.s, P = g.player.pos;
    if (S.siege === 'waiting' && (g.clock.hours >= 21.8 || g.clock.hours < 4) && hyp(P[0] - GATE[0], P[2] - GATE[1]) < 60) this.startSiege();
    if (S.siege !== 'on') return;
    // too far away for too long: the gate holds without you, or it does not
    if (hyp(P[0] - GATE[0], P[2] - GATE[1]) > 140) { this.awayT += dt; if (this.awayT > 30) { S.siege = 'failed'; this.c.facts.siegeFailed = true; this.c.done('c3_siege'); this.c.objective('c3_siege', 'Hold Ashgate\'s south gate (you left the Watch to it)'); g.toast('Behind you, the bell of Ashgate stops. Nobody comes to thank you.'); return; } } else this.awayT = 0;
    const left = this.alive.map((id) => g.npcs.find((n) => n.id === id)).filter((n) => n && !n.dead);
    if (left.length === 0) {
      if (S.wave >= WAVES.length) return this.wonSiege();
      this.waveT -= dt; if (this.waveT <= 0) { this.waveT = 10; this.spawnWave(); }
    } else for (const n of left) if (!n.foe && n.state !== 'chase' && n.state !== 'attack' && n.state !== 'investigate') { n.state = 'investigate'; n.stim = [GATE[0], GATE[1]]; n.investT = 40; n.goTo(GATE[0], GATE[1] - 4, 2.4); }
  }
  wonSiege() {
    const g = this.g, c = this.c, S = this.s; S.siege = 'won';
    c.facts.siegeWon = true; c.facts.pardoned = true; c.done('c3_siege');
    g.rep.bounty.watch = 0; g.rep.bounty.keep = 0; g.look.forget(); if (g.social) g.social.vig = 0; g.alarmLevel = 0;
    g.player.inv.gold += 200; g.player.inv.add('potion', 2);
    g.ui.flashBanner('THE GATE HOLDS', 3000); g.sfx.bell?.(2); g.progress.addXp(300, 'the Hollow Night');
    g.toast('Harl\'s pardon: the Watch and the keep forget your face. +200 gold');
    const harl = this.harl(); harl?.bark('Hold! They are falling back! Hold!');
  }
  // ------------------------------------------------------------ the Bone
  updateCrypt() {
    const g = this.g, S = this.s, z = g.story.zone; if (S.crypt || (z !== 'crypt' && z !== 'undercroft') || this.c.facts.boneTaken) return;
    S.crypt = true;
    const diggers = [['c3_dig_a', 103.2, 49.4], ['c3_dig_b', 107.8, 54.6]];
    for (const [id, x, z2] of diggers) if (!S.dead.includes(id)) { const n = g.spawnNpc(handKnife(id, x, z2, { yaw: 90, loot: [['gold', 14], ['knife', 2], ['salve_gh', 1]] })); n.snapToSchedule?.(); n.x = x; n.z = z2; }
    if (!S.dead.includes('c3_knight')) { const k = g.spawnNpc(hollowKnight('c3_knight', 105.5, 56.6, { name: 'The Binder\'s Guard', loot: [['gold', 60], ['knightplate', 1]] })); k.dormant = true; k.setAnim('Idle'); }
  }
  hook(push, eye) {
    const g = this.g, c = this.c, F = c.facts;
    if (c.has('c3_bone') && !F.boneTaken && hyp(TOMB_LID[0] - eye[0], TOMB_LID[1] - eye[2]) < 2.8) push(TOMB_LID[0], 1.0, TOMB_LID[1], 2.8, 'Break open the Binder\'s tomb (hold E)', () => this.openTomb(), 'quest', 0.3, null);
    const B = g.level.places.bellAt;
    if (c.has('c3_bell') && !F.bellTaken && hyp(B[0] - eye[0], B[2] - eye[2]) < 3.8 && eye[1] > 6.5) push(B[0], B[1], B[2], 3.8, 'Take the bell\'s tongue (hold E)', () => this.takeClapper(), 'quest', 0.2, null);
  }
  openTomb() {
    const g = this.g, P = g.player;
    P.startPicking({ x: TOMB[0], z: TOMB[1] }, 1, () => {
      const c = this.c; c.facts.boneTaken = true; P.inv.add('binderskull', 1); c.done('c3_bone'); g.ui.flashBanner('THE BINDER\'S SKULL', 2400, true); g.sfx.boom?.(0.5); g.shake = 0.5; g.progress.addXp(120, 'the Bone');
      const k = g.npcs.find((n) => n.id === 'c3_knight'); if (k && !k.dead && k.dormant) { k.dormant = false; k.state = 'chase'; k.alert = 1; k.lastSeen = [...P.pos]; g.sfx.hollowCry?.(k.pos); k.bark?.('...'); }
      for (const n of g.npcs) if (n.role === 'hollow' && n.dormant && !n.dead && n.dist < 40) { n.dormant = false; n.state = 'chase'; n.alert = 1; n.lastSeen = [...P.pos]; }
      g.toast('The catacombs wake around you'); this.checkEnd();
    }, 'Prying the lid', { free: true, need: 3.0, watch: () => P.speedNow < 0.7 });
    g.noise(P.pos, 10, 'crash');
  }
  // ------------------------------------------------------------ the Bell
  updateBelfry() {
    const g = this.g, S = this.s; if (S.belfry || g.story.zone !== 'belfry' || this.c.facts.bellTaken) return;
    S.belfry = true;
    const crew = [['c3_bell_a', -137, 299, { poi: 'belfry_floor' }], ['c3_bell_b', -134, 300.4, { poi: 'belfry_floor_b' }]];
    for (const [id, x, z, o] of crew) if (!S.dead.includes(id)) { const n = g.spawnNpc(handKnife(id, x, z, o)); n.snapToSchedule(); }
  }
  takeClapper() {
    const g = this.g, P = g.player;
    P.startPicking({ x: -136, z: 299.5 }, 1, () => {
      const c = this.c; c.facts.bellTaken = true; P.inv.add('clapper', 1); c.done('c3_bell'); g.sfx.bell?.(1); g.ui.flashBanner('THE BELL\'S TONGUE', 2400, true); g.progress.addXp(120, 'the Bell');
      // the ones who came for it are waiting at the bottom of the stairs
      for (const id of ['c3_bell_c', 'c3_bell_d']) if (!g.npcs.some((n) => n.id === id)) { const q = g.nav.nearestWalkable(-139.5 + Math.random(), 298 + Math.random() * 3, 3) || [-139, 299]; const n = g.spawnNpc(handKnife(id, q[0], q[1], { def: { ambush: true } })); n.state = 'chase'; n.alert = 1; n.lastSeen = [...P.pos]; }
      g.toast('Footsteps on the stairs below'); this.checkEnd();
    }, 'Unhooking the tongue', { free: true, need: 2.6, watch: () => P.speedNow < 1.2 });
  }
  checkEnd() {
    const c = this.c, g = this.g; if (!(c.facts.boneTaken && c.facts.bellTaken) || c.facts.c3done) return;
    c.facts.c3done = true; g.progress.addXp(150, 'the Bone and the Bell');
    g.after(6, () => { if (g.mode === 'play' && !g.ui.dlg) c.begin('c4'); else this.pendingEnd = true; });
  }
  update(dt) {
    const g = this.g;
    this.updateSiege(dt); this.updateCrypt(); this.updateBelfry();
    if (this.pendingEnd && g.mode === 'play' && !g.ui.dlg && g.combatT <= 0) { this.pendingEnd = false; this.c.begin('c4'); }
    const k = g.npcs.find((n) => n.arch === g.archKnight && !n.dead && !n.dormant && n.dist < 30 && (n.state === 'chase' || n.state === 'attack' || n.state === 'stagger'));
    if (k) g.boss.custom = { name: k.name, npc: k }; else if (g.boss.custom?.npc?.arch === g.archKnight) g.boss.custom = null;
  }
  onNpcDeath(n) { if (n.id.startsWith('c3_') && !this.s.dead.includes(n.id)) this.s.dead.push(n.id); if (n.arch?.name === 'Hollow Knight') { this.g.stats.knights = (this.g.stats.knights || 0) + 1; } }
  resume() { if (this.s.siege === 'on') { this.s.siege = 'waiting'; } this.s.crypt = false; this.s.belfry = false; if (this.c.facts.c3done && this.c.ch === 'c3') this.pendingEnd = true; }
  save() { return this.s; }
  load(d) { this.s = { siege: null, wave: 0, dead: [], crypt: false, belfry: false, ...(d || {}) }; if (this.s.siege === 'on') this.s.wave = Math.max(0, this.s.wave - 1); }
}
