// Chapter IV · The Choir Beneath. A red moon, the Choir Stones singing, and Sable waiting with
// her knives (and, if you earned them, Vane and Brannoch at your back). Give her the letter, talk
// her down, or beat her; then the Mouth opens and you go down into the Choir's Deep to end it.
import * as E from '../../../engine/index.js';
import { handKnife, hollowKnight, cantor } from './cast.js';
import { ChoirBoss } from '../choir.js';
import { playEnding } from '../endings.js';

const hyp = Math.hypot;
const L = (text, o = {}) => ({ text, ...o });
const STONES = [80, -200], ALTAR = [80, -202.4], MOUTH = [80, -196.6];
const SABLE = { outfit: 'woman', skin: 'pale', hair: { style: 'long', color: 'black' }, colors: { cloth: '#3a3840', cloth2: '#5a5862', trim: '#c8bca0' }, weapon: 'knife', height: 1.0, voice: 1.1 };

export class Chapter4 {
  constructor(g, c) { this.g = g; this.c = c; this.s = { met: false, sable: null, deep: false, dead: [], arena: false }; this.choir = null; }
  prologue() { return [['', 'The moon came up the colour of a wound. In the south the Choir Stones began to sing, and everything dead in Hollowmere turned to listen.', 5.5], ['Rook', 'Bone, Bell and Wax, all three in my pack. She has none of them, and all of me. Let us see what that is worth.', 5]]; }
  targetFor(id) {
    const g = this.g, P = g.level.places;
    return { c4_stones: () => STONES, c4_deep: () => (g.story.zone === 'deep' || g.story.zone === 'choir' ? P.choirIn : MOUTH), c4_heart: () => (g.story.zone === 'deep' || g.story.zone === 'choir' ? [P.choir.x, P.choir.z] : MOUTH) }[id] || null;
  }
  start() {
    const c = this.c; c.facts.redMoon = true;
    c.objective('c4_stones', 'Go to the Choir Stones before midnight', 'Sable will be waiting at the altar. The Bone, the Bell and the letter are in your pack.', () => STONES);
    this.g.story.tracked = 'c4_stones';
    if (this.g.clock.hours < 21 && this.g.clock.hours > 5) this.g.clock.hours = 21.5;
  }
  world(active) { if (active) this.c.facts.redMoon = true; }
  calm() { return this.s.sable === 'talk' || this.g.story.zone === 'choir'; }
  // the red moon: night turns the colour of a wound
  env(e) {
    if (!this.c.facts.redMoon || this.c.index() < 3 || e.night < 0.2) return;
    const k = Math.min(1, e.night) * 0.55, mix = (a, b) => a && a.map((v, i) => v * (1 - k) + b[i] * k);
    e.fogColor = mix(e.fogColor, [0.32, 0.07, 0.08]); e.skyColor = mix(e.skyColor, [0.3, 0.05, 0.06]); e.horizonColor = mix(e.horizonColor, [0.45, 0.1, 0.08]); e.zenithColor = mix(e.zenithColor, [0.12, 0.02, 0.04]);
    if (e.sunColor && !e.sunUp) e.sunColor = mix(e.sunColor, [1.0, 0.3, 0.25]);
  }
  // ------------------------------------------------------------ the Stones
  spawnStones() {
    const g = this.g, S = this.s, F = this.c.facts; if (S.spawned) return; S.spawned = true;
    if (!S.dead.includes('sable')) {
      const sa = g.spawnNpc({ id: 'sable_m', name: 'Sable, Mistress of the Gray Hand', role: 'guard', hostile: true, boss: true, arch: 'mistress', faction: 'hand', pos: ALTAR, yaw: 0, weapon: 'knife', block: 0.3, eyes: 1.4, detail: 0.6, unkillable: true,
        loot: [['gold', 150], ['gem', 2]], schedule: [{ h0: 0, h1: 24, poi: 'stones_altar', act: 'stand' }], spec: SABLE });
      sa.peaceful = true; sa.ignoreHollowsT = 0; sa.def.ambush = true;
    }
    const spots = [[STONES[0] - 6, STONES[1] + 4], [STONES[0] + 6, STONES[1] + 4], [STONES[0] - 7, STONES[1] - 3], [STONES[0] + 7, STONES[1] - 3]];
    spots.forEach(([x, z], i) => { const id = 'c4_knife_' + i; if (S.dead.includes(id)) return; const q = g.nav.nearestWalkable(x, z, 4) || [x, z]; const n = g.spawnNpc(handKnife(id, q[0], q[1], { yaw: 0, def: { ambush: true } })); n.peaceful = true; });
    // those who owe you a debt come to the Stones
    const P = g.player.pos;
    if (F.vaneSpared && !g.npcs.some((n) => n.id === 'vane_ally')) { const q = g.nav.nearestWalkable(P[0] - 2, P[2] - 1.5, 4) || [P[0], P[2]]; const v = g.spawnNpc({ id: 'vane_ally', name: 'Vane', role: 'guard', ally: true, faction: 'allies', pos: q, weapon: 'dark', hp: 260, dmg: 1.3, essential: true, block: 0.45, arch: 'duelist', schedule: [{ h0: 0, h1: 24, poi: null, act: 'stand' }], spec: { outfit: 'rogue', hood: false, skin: 'tan', hair: { style: 'short', color: 'black' }, beard: 'short', colors: { cloth: '#2a2228', cloth2: '#3a3038', leather: '#1a1416' }, weapon: 'dark', height: 1.06 } }); v.state = 'follow'; v.peaceful = false; v.bark('I said I would be here.'); }
    const bran = g.npcs.find((n) => n.id === 'brannoch');
    if (F.brannochSaved && bran && !bran.dead && !g.npcs.some((n) => n.id === 'bran_ally')) { const q = g.nav.nearestWalkable(P[0] + 2, P[2] - 1.5, 4) || [P[0], P[2]]; const b = g.spawnNpc({ id: 'bran_ally', name: 'Brannoch', role: 'guard', ally: true, faction: 'allies', pos: q, weapon: 'sword', hp: 200, essential: true, block: 0.3, schedule: [{ h0: 0, h1: 24, poi: null, act: 'stand' }], spec: { outfit: 'rogue', hood: true, skin: 'tan', hair: { style: 'short', color: 'black' }, beard: 'short', colors: { cloth: '#3f3a34', cloth2: '#2a241e' }, weapon: 'sword' } }); b.state = 'follow'; b.bark('You did not think I would let you go alone?'); }
  }
  sable() { return this.g.npcs.find((n) => n.id === 'sable_m'); }
  stoneTalk() {
    const g = this.g, c = this.c, F = c.facts, S = this.s, sa = this.sable(); if (!sa) return; S.sable = 'talk'; S.met = true;
    const fight = () => { S.sable = 'fight'; this.fight(); };
    const redeem = () => { S.sable = 'redeemed'; F.sableRedeemed = true; sa.peaceful = true; for (const n of g.npcs) if (n.id.startsWith('c4_knife_')) { n.peaceful = true; n.state = 'routine'; } g.progress.addXp(250, 'a debt forgiven'); this.openMouth('redeemed'); };
    const lines = [
      L('Rook. You came. They always come. The letter, the Bone and the Bell\'s tongue: you did my work for me better than my own knives ever could.', { who: 'Sable', choices: [
        { text: 'Here. Take your letter. (Give her the letter.)', next: 'end', action: () => { S.sable = 'gray'; g.after(0.2, () => playEnding(g, 'gray')); } },
        g.speech.choice('persuade', sa, 'Your mother still keeps the lamp lit. She told me to tell you.', { when: () => !!F.witchMessage, extra: 0.3 + 0.08 * c.verses.size, ok: () => L('...Mother. She would. Damn her, she would.', { who: 'Sable', goto: 2 }), fail: () => L('Do not. Do not you dare use her. Knives!', { who: 'Sable', end: true, onShow: fight }) }),
        g.speech.choice('persuade', sa, 'The Choir will eat the Gray Hand with everyone else, and you know it. You have read your own ledger.', { extra: 0.1 * c.verses.size + (F.vaneSpared ? 0.12 : 0), ok: () => L('...Thirty years. Thirty years, and it never once sang my name back.', { who: 'Sable', goto: 2 }), fail: () => L('It will sing for ME. Knives!', { who: 'Sable', end: true, onShow: fight }) }),
        { text: 'No more talking. (Draw steel.)', next: 'end', action: fight }] }),
      L('', { end: true }),
      L('Go down, then. I will open the Mouth and hold the door. If it sings to you... sing back louder.', { who: 'Sable', end: true, onShow: redeem }),
    ];
    g.ui.dialogue({ npc: sa, lines, name: 'Sable', spec: SABLE });
  }
  fight() {
    const g = this.g, sa = this.sable(); if (!sa) return;
    sa.peaceful = false; sa.state = 'chase'; sa.alert = 1; sa.lastSeen = [...g.player.pos];
    for (const n of g.npcs) if (n.id.startsWith('c4_knife_') && !n.dead) { n.peaceful = false; n.state = 'chase'; n.alert = 1; n.lastSeen = [...g.player.pos]; }
    for (const n of g.npcs) if ((n.id === 'vane_ally' || n.id === 'bran_ally') && !n.dead) { const foe = g.npcs.find((m) => m.id.startsWith('c4_knife_') && !m.dead); if (foe) n.engage(foe); }
    g.ui.flashBanner('SABLE, MISTRESS OF THE GRAY HAND', 2800, true); g.sfx.sting?.('challenge'); this.blinkT = 7; this.clones = 0; this.noHit = true;
  }
  updateSable(dt) {
    const g = this.g, S = this.s, sa = this.sable(); if (!sa || S.sable !== 'fight') return;
    g.boss.custom = { name: 'Sable, Mistress of the Gray Hand', npc: sa };
    const hp = sa.hp / sa.maxHp;
    // she steps through the dark and comes out behind you
    this.blinkT -= dt;
    if (this.blinkT <= 0 && sa.dist > 4 && sa.exposed <= 0) { this.blinkT = hp < 0.5 ? 6 : 9; const P = g.player, q = g.nav.nearestWalkable(P.pos[0] - P.flat[0] * 2.6, P.pos[2] - P.flat[1] * 2.6, 3); if (q) { g.emitBurst?.([sa.x, sa.y + 1, sa.z], 'poof'); sa.x = q[0]; sa.z = q[1]; sa.y = g.nav.floorAt(q[0], q[1]); sa.stopMove(); g.emitBurst?.([sa.x, sa.y + 1, sa.z], 'poof'); g.sfx.whisper?.(); g.flashText('BEHIND YOU'); sa.state = 'attack'; sa.attackCd = 0.25; } }
    // shadows of herself, at two thirds and one third
    for (const th of [0.66, 0.33]) if (hp < th && this.clones < (th === 0.66 ? 1 : 2)) {
      this.clones++; sa.bark(th === 0.66 ? 'Which of us, Rook?' : 'All of us, then.');
      for (let i = 0; i < 2; i++) { const q = g.nav.nearestWalkable(sa.x + (i ? 3 : -3), sa.z + 2, 3); if (!q) continue; const n = g.spawnNpc({ id: 'sable_shade_' + this.clones + i, name: 'Sable\'s shadow', role: 'guard', hostile: true, faction: 'hand', pos: q, weapon: 'knife', hp: 1, arch: 'knife', def: {}, schedule: [{ h0: 0, h1: 24, poi: null, act: 'stand' }], spec: { ...SABLE, colors: { cloth: '#1a181e', cloth2: '#26242a' } }, loot: [] }); n.ambushShade = true; n.def.ambush = true; n.state = 'chase'; n.alert = 1; n.lastSeen = [...g.player.pos]; g.emitBurst?.([q[0], 1, q[1]], 'veil'); }
    }
    if (g.player.hurtT > 0.3) this.noHit = false;
    if (hp <= 0.12) {
      S.sable = 'beaten'; this.c.facts.sableBeaten = true; if (this.noHit) this.c.facts.noHitBoss = true;
      sa.peaceful = true; sa.state = 'handsup'; sa.atk = null; sa.stopMove(); g.boss.custom = null; g.stats.bosses = (g.stats.bosses || 0) + 1; g.progress.addXp(300, 'the Mistress');
      for (const n of g.npcs) if ((n.id.startsWith('sable_shade') || n.id.startsWith('c4_knife_')) && !n.dead) n.die([0, 0], { byNpc: true });
      g.ui.flashBanner('THE MISTRESS FALLS', 2600, true);
      g.after(1.2, () => g.ui.dialogue({ npc: sa, name: 'Sable', spec: SABLE, lines: [
        L('Enough. ENOUGH. You win, thief. You always win.', { mood: 'fear' }),
        L('But you came to the Stones with the letter in your pack. It wanted you here. If I cannot sing it... then you go down and listen.', { end: true, onShow: () => this.openMouth('beaten') }),
      ] }));
    }
  }
  openMouth(why) {
    const g = this.g, c = this.c; if (c.facts.mouthOpen) return; c.facts.mouthOpen = true;
    const sa = this.sable(); if (sa) { sa.ch.upper.playOnce('Hands Up', { fadeIn: 0.2, fadeOut: 0.6 }); }
    g.sfx.boom?.(1); g.shake = 1.4; g.sfx.bell?.(13); g.ui.flashBanner('THE MOUTH OPENS', 3000);
    for (let i = 0; i < 40; i++) g.emitBurst?.([MOUTH[0] + (Math.random() - 0.5) * 3, 0.3, MOUTH[1] + (Math.random() - 0.5) * 3], i % 2 ? 'dust' : 'veil');
    this.mouthFx();
    c.done('c4_stones'); c.objective('c4_deep', 'Descend into the Mouth beneath the Choir Stones', why === 'redeemed' ? 'Sable holds the door. Whatever is down there knows you are coming.' : 'The ground has opened at the foot of the altar.', () => this.targetFor('c4_deep')());
    g.story.tracked = 'c4_deep';
  }
  mouthFx() {
    const g = this.g; if (this.mouthNode) return;
    const M = g.level.pal, k = new E.Kit(M);
    k.add(M.blackCloth, E.cylinder({ radiusTop: 1.7, radiusBottom: 1.7, height: 0.03, radialSegments: 18, heightSegments: 1, capTop: true, capBottom: false, arc: 360 }), [MOUTH[0], 0.06, MOUTH[1]]);
    k.add(M.choirGlow, E.torus({ radius: 1.8, tube: 0.08, radialSegments: 5, tubularSegments: 28 }), [MOUTH[0], 0.09, MOUTH[1]]);
    this.mouthNode = k.toNode('The Mouth'); g.scene.add(this.mouthNode);
    const l = new E.Light('point', { color: '#9a5cff', intensity: 14, range: 12, flicker: 0.4 }); l.position.set([MOUTH[0], 1.0, MOUTH[1]]); g.scene.add(l); g.level.lights.push(l);
  }
  // ------------------------------------------------------------ the Deep and the Choir
  spawnDeep() {
    const g = this.g, S = this.s; if (S.deepSpawned) return; S.deepSpawned = true;
    const add = (def, dormant = true) => { if (S.dead.includes(def.id)) return null; const n = g.spawnNpc(def); n.dormant = dormant; return n; };
    for (const [i, x, z] of [[0, -35, 304], [1, -37, 316], [2, -34.5, 326]]) { if (S.dead.includes('c4_h' + i)) continue; const n = g.story.spawnHollow(x, z, false, true, 'plain'); n.id = 'c4_h' + i; }
    add(cantor('c4_cantor_a', -36, 322), false)?.setAnim?.('Idle');
    add(cantor('c4_cantor_b', -30, 350), true); add(cantor('c4_cantor_c', -20, 344), true);
    add(hollowKnight('c4_knight', -14, 346, { loot: [['gold', 80], ['potion', 2]] }), true);
    for (const [i, x, z] of [[3, -42, 338], [4, -25, 355], [5, -12, 338], [6, -44, 353]]) { if (S.dead.includes('c4_h' + i)) continue; const n = g.story.spawnHollow(x, z, false, true, i % 2 ? 'brute' : 'plain'); n.id = 'c4_h' + i; }
  }
  update(dt) {
    const g = this.g, c = this.c, S = this.s, P = g.player.pos;
    if (c.has('c4_stones') && !c.isDone('c4_stones')) {
      const d = hyp(P[0] - STONES[0], P[2] - STONES[1]);
      if (d < 48) this.spawnStones();
      if (d < 14 && !S.met && g.mode === 'play' && !g.ui.dlg) this.stoneTalk();
    }
    this.updateSable(dt);
    const z = g.story.zone;
    if ((z === 'deep' || z === 'choir') && c.facts.mouthOpen) {
      this.spawnDeep();
      if (c.has('c4_deep') && !c.isDone('c4_deep')) { c.done('c4_deep'); c.objective('c4_heart', 'Silence the Choir', 'At the bottom of the Deep, in the round hall, it is waiting.', () => this.targetFor('c4_heart')()); g.story.tracked = 'c4_heart'; }
    }
    // the arena
    const place = g.level.places.choir;
    if (z === 'choir' && hyp(P[0] - place.x, P[2] - place.z) < place.R - 1 && !this.choirDone()) {
      if (!this.choir) this.makeChoir();
      if (!this.choir.phase) { this.choir.wake(); g.setCheckpoint([place.x - place.R + 3, 0.1, place.z], Math.PI / 2); this.noHitChoir = true; }
    }
    if (this.choir?.phase && !this.choir.done) {
      this.choir.update(dt);
      const ch = this.choir, view = ch.phase === 1 ? { hp: ch.throats.reduce((a, T) => a + Math.max(0, T.hp), 0), maxHp: ch.throats.reduce((a, T) => a + T.max, 0) } : { hp: ch.heart.hp, maxHp: ch.heart.max };
      g.boss.custom = { name: ch.phase === 1 ? 'The Choir · the throats' : 'The Choir · the heart', npc: { ...view, dead: false } };
      if (g.player.hurtT > 0.3) this.noHitChoir = false;
    }
  }
  choirDone() { return this.c.facts.choirBeaten || this.g.story.ended; }
  makeChoir() {
    const g = this.g; this.choir = new ChoirBoss(g, g.level.places.choir);
    this.choir.onSpeak = () => this.finalChoice();
  }
  slash(eye, f, reach, dmg) { return this.choir ? this.choir.slash(eye, f, reach, dmg) : false; }
  finalChoice() {
    const g = this.g, c = this.c, F = c.facts, inv = g.player.inv; F.choirBeaten = true; if (this.noHitChoir) F.noHitBoss = true; g.boss.custom = null; g.stats.bosses = (g.stats.bosses || 0) + 1;
    const allThree = c.verses.size >= 3 && inv.has('clapper') && inv.has('binderskull');
    const lines = [
      L('YOU. WE KNOW YOU. WE HAVE SUNG YOUR NAME SINCE THE WAX CRACKED. OPEN US, KEY. OPEN US AND BE SUNG FOREVER.', { who: 'The Choir', mood: 'anger' }),
      L('(The letter is warm in your hand. The heart hangs at the rim of the pit, close enough to touch.)', { who: 'Rook', choices: [
        { text: 'Hold the letter to the heart and let it burn. (The Saint\'s way)', when: () => c.verses.has('saint'), next: 'end', action: () => g.after(0.3, () => playEnding(g, 'saint')) },
        { text: 'Strike the heart thirteen times with the bell\'s tongue. (The Binder\'s way)', when: () => allThree, next: 'end', action: () => g.after(0.3, () => playEnding(g, 'true')) },
        { text: '(You know there is another way: all three verses, the Bone and the Bell. You do not have them all.)', when: () => !allThree, next: 1 },
        { text: 'Break the seal.', next: 'end', action: () => g.after(0.3, () => playEnding(g, 'unseal')) }] }),
    ];
    g.ui.dialogue({ lines, name: 'The Choir', spec: { outfit: 'hollow', skin: 'ashen', hair: { style: 'bald' }, glowEyes: true } });
  }
  dialogue(npc) {
    if (npc.id === 'sable_m' && this.s.sable === 'redeemed') return [L('Go on. I am holding it. I do not know for how long.', { who: 'Sable', end: true })];
    return null;
  }
  onNpcDeath(n) { if ((n.id.startsWith('c4_') || n.id === 'sable_m') && !this.s.dead.includes(n.id)) this.s.dead.push(n.id); }
  resume() {
    const g = this.g, c = this.c; this.s.spawned = false; this.s.deepSpawned = false;
    if (this.s.sable === 'talk') this.s.met = false, this.s.sable = null;
    if (this.s.sable === 'fight') { this.s.sable = null; this.s.met = false; }
    if (c.facts.mouthOpen) this.mouthFx();
  }
  save() { return this.s; }
  load(d) { this.s = { met: false, sable: null, deep: false, dead: [], arena: false, ...(d || {}) }; }
}
