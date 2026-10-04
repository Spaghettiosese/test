// Chapter II · The Gray Hand. Out of Ashgate with every bell ringing; back to Brannoch's camp to
// find the Gray Hand waiting; three people who know what the letter is (the priest, the witch who
// is Sable's mother, and the Duke or his shade); then Pellmouth, the trapdoor behind Marl's bar,
// the Rookery, Vane, and Sable's ledger.
import * as E from '../../../engine/index.js';
import { handKnife } from './cast.js';

const hyp = Math.hypot;
const L = (text, o = {}) => ({ text, ...o });
const CAMP = [11.6, -31.4], GRAVE = [-43.2, 77.6];
const TOWNISH = new Set(['town', 'graveyard', 'court', 'hall', 'ante', 'study', 'chamber', 'backyard', 'crypt', 'undercroft']);
const NOTES = {
  rook_accounts: { title: 'ACCOUNTS OF THE GRAY HAND', text: 'Marl, for the trapdoor and his silence: 40 a month.\nSalt, nine barrels, to the Duke. Paid in full, by his own hand, with a ring he will not miss.\nThe knife (Brannoch\'s): 200 on delivery. Not to be paid.\n\nThe Mistress says: when the bell tolls thirteen there will be nothing left to pay for, and nobody left to pay.' },
  sable_ledger: { title: 'SABLE\'S LEDGER', text: 'Three seals hold the Choir asleep. I have bought, stolen or dug up two of them in thirty years.\n\nTHE WAX: the letter. The thief will bring it himself; they always do. It must be broken by the hand that took it.\nTHE BONE: Vorst\'s skull, under his tomb in the catacombs. My diggers go down on the Hollow Night, when the Watch is busy dying at the gate.\nTHE BELL: the tongue of the bell of Ravenspire. Thirteen strokes with it and the hour opens. My knives will take it from the tower the same night.\n\nThen the Choir Stones, at midnight, under a red moon. Mother, if you ever read this: I did it for a voice. I have one now.' },
  brannoch_note: { title: 'A NOTE PINNED TO THE TENT', text: 'Rook,\n\nIf you are reading this, I am dead or worse. The masks came for me after you went in. Sable never meant to pay.\n\nThe letter opens only by the thief\'s hand, at the Choir Stones, when the bell tolls thirteen. Her house is under the Drowned Lantern in Pellmouth; Marl holds the trapdoor.\n\nBefore you go: Father Ansel knows the Saint\'s part. The witch in the Mirewood is Sable\'s mother. And the Duke made the bargain.\n\n. B.' },
};

export class Chapter2 {
  constructor(g, c) {
    this.g = g; this.c = c; this.s = { ambush: false, foes: [], dead: [], bran: null, rookSpawned: false, vane: null, ledger: false };
    Object.assign(g.story.notes, NOTES); this.npcs = {};
  }
  prologue() { return [['', 'Behind you the bell of Ravenspire tolls thirteen, and all over the valley the dead begin to get up.', 5], ['Rook', 'Brannoch will be at the camp. He owes me an explanation, and Sable owes me two hundred gold.', 5]]; }
  targetFor(id) {
    const g = this.g;
    return { c2_flee: () => this.exitNear(), c2_camp: () => CAMP, c2_brannoch: () => CAMP, c2_note: () => [CAMP[0] + 1.4, CAMP[1] + 2.4], c2_ansel: () => [-29, 69], c2_witch: () => [-204, 92],
      c2_duke: () => (this.dukeAlive() ? [22, -113.5] : GRAVE), c2_rookery: () => (g.story.zone === 'rookery' ? [-177, 300] : [143, -167]), c2_ledger: () => (g.story.zone === 'rookery' ? [-164, 301] : [143, -167]) }[id] || null;
  }
  exitNear() { const P = this.g.player.pos; if (P[2] > 93) return [-14.5, 128.6]; const ex = [[-30, 8], [22, 8], [0, 6]]; let b = ex[0], bd = 1e9; for (const e of ex) { const d = hyp(e[0] - P[0], e[1] - P[2]); if (d < bd) { bd = d; b = e; } } return b; }
  dukeAlive() { const d = this.g.npcs.find((n) => n.id === 'duke'); return !!d && !d.dead && this.g.story.dukeState !== 'dead'; }
  brannoch() { return this.g.npcs.find((n) => n.id === 'brannoch'); }
  // ------------------------------------------------------------ the chapter begins
  start() {
    const c = this.c;
    c.objective('c2_flee', 'Get clear of Ashgate', 'The keep\'s household has seen your face. The gates are barred; the breach in the west wall and the sewer outfall to the east are open. From the keep, the pantry stairs lead down to the catacombs and out by the graveyard.', () => this.exitNear());
    c.objective('c2_camp', 'Find Brannoch at the camp on the south road', 'Brannoch hired you for Sable. He will know why her letter cracks its own wax.', () => CAMP);
    this.g.story.tracked = 'c2_flee';
  }
  // ------------------------------------------------------------ the state of the world in chapter II and after
  world(active) {
    const g = this.g; if (!active) return;
    // the camp after the masks came: things overturned and burnt
    if (!this.ruin) {
      const k = new E.Kit(g.level.pal), M = g.level.pal, [cx, cz] = CAMP;
      k.add(M.ember, E.cylinder({ radiusTop: 2.2, radiusBottom: 2.2, height: 0.02, radialSegments: 14, heightSegments: 1, capTop: true, capBottom: false, arc: 360 }), [cx - 3, 0.012, cz - 1.5]);
      for (let i = 0; i < 4; i++) k.cyl(M.timber, [cx - 4 + i * 1.3, 0.3, cz + 3 + (i % 2)], 0.3, 0.8, [90, i * 40, 0], 8);
      k.box(M.parchment, [cx + 1.4, 1.2, cz + 2.45], [0.3, 0.4, 0.02]);
      this.ruin = k.toNode('Ruined camp'); g.scene.add(this.ruin);
    }
    // the Duke flees to Fort Greywatch, under the Watch's protection
    const duke = g.npcs.find((n) => n.id === 'duke');
    if (duke && !duke.dead && g.story.dukeState !== 'dead') {
      if (!g.level.pois.fort_duke) g.level.pois.fort_duke = { name: 'fort_duke', x: 22, z: -113.4, y: 0, yaw: 180, type: 'stand', approach: [22, -113.4] };
      duke.schedule = [{ h0: 0, h1: 24, poi: 'fort_duke', act: 'stand' }]; duke.leaveActivity(); duke.slotKey = ''; duke.state = 'routine'; duke.snapToSchedule(); duke.peaceful = true;
    }
    const marl = g.npcs.find((n) => n.id === 'marl'); if (marl && !marl.pockets.some(([id]) => id === 'rookkey') && !this.c.facts.rookOpen) marl.pockets.push(['rookkey', 1]);
  }
  calm() { return this.g.story.zone === 'rookery'; }
  // ------------------------------------------------------------ frame
  update(dt) {
    const g = this.g, c = this.c, P = g.player.pos, S = this.s;
    if (c.has('c2_flee') && !c.isDone('c2_flee') && !TOWNISH.has(g.story.zone) && g.story.zone) c.done('c2_flee');
    // the ambush at the camp
    if (c.has('c2_camp') && !S.ambush && hyp(P[0] - CAMP[0], P[2] - CAMP[1]) < 34) this.ambush();
    if (S.ambush && !c.isDone('c2_camp')) {
      const alive = S.foes.map((id) => g.npcs.find((n) => n.id === id)).filter((n) => n && !n.dead);
      if (!alive.length || alive.every((n) => hyp(n.x - CAMP[0], n.z - CAMP[1]) > 80)) {
        c.done('c2_camp'); const b = this.brannoch();
        if (b && !b.dead) c.objective('c2_brannoch', 'Tend to Brannoch', 'He is lying by the fire, bleeding. A salve might keep him alive.', () => CAMP);
        else c.objective('c2_note', 'Read the note pinned to Brannoch\'s tent', 'Brannoch is gone. He left word.', () => [CAMP[0] + 1.4, CAMP[1] + 2.4]);
        g.ui.flashBanner('THE MASKS ARE DOWN', 1800, true);
      }
    }
    // the Rookery: its people are only there once you are going
    if (g.story.zone === 'rookery' && !S.rookSpawned) this.spawnRookery();
    if (S.rookSpawned && !S.vane) { const v = g.npcs.find((n) => n.id === 'vane'); if (v && !v.dead && (v.hp < v.maxHp || v.state === 'chase' || v.state === 'attack')) { S.vane = 'fight'; v.peaceful = false; } }
    if (S.rookSpawned && !S.vane && c.has('c2_rookery')) { const v = g.npcs.find((n) => n.id === 'vane'); if (v && !v.dead && P[0] > -185 && P[0] < -169 && P[2] > 292 && P[2] < 308 && g.mode === 'play') this.vaneTalk(v); }
    if (S.vane === 'fight') { const v = g.npcs.find((n) => n.id === 'vane'); if (v?.dead && !c.facts.vaneBeaten) { c.facts.vaneBeaten = true; g.ui.flashBanner('VANE FALLS', 2400, true); g.progress.addXp(220, 'the duelist'); g.stats.bosses = (g.stats.bosses || 0) + 1; this.boss = null; c.objective('c2_ledger', 'Search Sable\'s study for her plans', 'Vane\'s key opens the study door.', () => [-164, 301]); } }
    // the Duke's shade walks by his son's grave at night, if the Duke is dead
    if (c.has('c2_duke') && !c.verses.has('father') && !this.dukeAlive()) this.shade(dt);
    // a boss bar for Vane
    if (S.vane === 'fight') { const v = g.npcs.find((n) => n.id === 'vane'); if (v && !v.dead && v.dist < 30) g.boss.custom = { name: 'Vane, the Hand\'s Duelist', npc: v }; else if (g.boss.custom?.npc === v) g.boss.custom = null; }
  }
  // ------------------------------------------------------------ the camp
  ambush() {
    const g = this.g, S = this.s; S.ambush = true;
    const b = this.brannoch();
    if (b && !b.dead) { b.leaveActivity(); b.knockOut(1e9); b.peaceful = true; b.wounded = true; b.lyingPos = [CAMP[0] - 1.6, 0.1, CAMP[1] + 0.6]; b.x = b.lyingPos[0]; b.z = b.lyingPos[2]; }
    const spots = [[CAMP[0] - 12, CAMP[1] - 8], [CAMP[0] + 11, CAMP[1] - 10], [CAMP[0] + 4, CAMP[1] + 13]];
    spots.forEach(([x, z], i) => {
      const q = g.nav.nearestWalkable(x, z, 5) || [x, z];
      const n = g.spawnNpc(handKnife('c2_amb_' + i, q[0], q[1], { def: { ambush: true }, loot: i === 0 ? [['salve_gh', 1], ['gold', 22], ['knife', 2]] : undefined }));
      n.state = 'chase'; n.alert = 1; n.lastSeen = [...g.player.pos]; n.sees = true; S.foes.push(n.id);
    });
    g.ui.flashBanner('AMBUSH', 2000); g.sfx.hollowCry && g.sfx.sting?.('challenge'); g.combatT = 10;
    const lead = g.npcs.find((n) => n.id === 'c2_amb_0'); lead?.bark('There he is. The Mistress wants her letter, Rook. Give it over and it will be quick.');
  }
  hook(push, eye) {
    const g = this.g, c = this.c, b = this.brannoch();
    if (c.has('c2_brannoch') && !c.isDone('c2_brannoch') && b && !b.dead && b.wounded && hyp(b.x - eye[0], b.z - eye[2]) < 3) push(b.x, 0.5, b.z, 3, 'Kneel beside Brannoch', () => this.brannochTalk(), 'quest', 0.2, b);
    if (c.has('c2_note') && !c.isDone('c2_note') && hyp(CAMP[0] + 1.4 - eye[0], CAMP[1] + 2.45 - eye[2]) < 2.8) push(CAMP[0] + 1.4, 1.2, CAMP[1] + 2.45, 2.8, 'Read the note', () => { g.readNote('brannoch_note'); c.done('c2_note'); this.leads(); }, 'note', 0.4, null);
  }
  brannochTalk() {
    const g = this.g, c = this.c, b = this.brannoch(), inv = g.player.inv, F = c.facts;
    const save = (item) => () => { inv.remove(item, 1); F.brannochSaved = true; g.sfx.drink?.(); g.progress.addXp(40, 'a life saved'); };
    const lines = [
      L('Rook... knew you would come. Gray cloaks, white masks. Sable\'s own knives. They were waiting for you, not for me.', { mood: 'fear', choices: [
        { text: 'Give him a Red Salve.', when: () => inv.has('potion'), next: 1, action: save('potion') },
        { text: 'Give him the Gray Hand salve.', when: () => inv.has('salve_gh'), next: 1, action: save('salve_gh') },
        { text: 'Lie still. Tell me what happened.', next: 2 }] }),
      L('Ah... that is better. Ha. You always did carry more salve than sense.', { goto: 2 }),
      L('Listen. Sable never meant to pay you. The letter is not a letter. It is a lock, and only the hand that stole it can turn it: at the Choir Stones, when the bell tolls thirteen.'),
      L('She keeps a house under the Drowned Lantern in Pellmouth. Marl the innkeeper holds the trapdoor for her. But go in blind and you die blind.'),
      L('Learn what you are carrying first. Father Ansel knows the Saint\'s side of it. The witch in the Mirewood is Sable\'s own mother. And the Duke made the bargain. Ask him, if he still breathes.'),
      L(() => (F.brannochSaved ? 'I will be on my feet by morning. Same fire, same prices; I will keep a blade sharp for you. Go.' : 'I am cold, Rook. Go. Do not let her use you twice.'), { end: true, onShow: () => { this.heard = true; } }),
    ];
    g.ui.dialogue({ npc: b, lines, onDone: () => this.afterBrannoch() });
    const D = g.ui.dlg; if (D) D.onDone = () => this.afterBrannoch();
  }
  afterBrannoch() {
    const g = this.g, c = this.c, b = this.brannoch(); if (c.isDone('c2_brannoch') || !this.heard) return;
    c.done('c2_brannoch');
    if (b && !b.dead) {
      if (c.facts.brannochSaved) { b.wounded = false; b.koT = 0.5; b.peaceful = false; g.toast('Brannoch will live'); }
      else { b.wounded = false; g.after(1.5, () => { if (!b.dead) { b.die([0, 0], { byNpc: true }); g.toast('Brannoch is dead'); } }); }
    }
    this.leads();
  }
  // ------------------------------------------------------------ what the letter is
  leads() {
    const c = this.c, alive = this.dukeAlive();
    c.objective('c2_lore', `Learn what the letter is (${c.verses.size}/3)`, 'Two of the three will do. All three will tell you how to end it.', null);
    if (!c.verses.has('saint')) c.objective('c2_ansel', 'Ask Father Ansel at the chapel in Ashgate', 'The keep\'s people know your face: keep the hood up, wear something else, or go by night.', () => [-29, 69], { quiet: true });
    if (!c.verses.has('witch')) c.objective('c2_witch', 'Ask Old Sable at the Witch\'s Hut in the Mirewood', 'Far to the west, past the bandit camp, on stilts above the bog.', () => [-204, 92], { quiet: true });
    if (!c.verses.has('father')) c.objective('c2_duke', alive ? 'Find Duke Aldric at Fort Greywatch' : 'Visit Lord Edric\'s grave in the graveyard at night', alive ? 'He fled the keep for the Watch\'s fort on the south road. Soldiers sleep in the barracks with him.' : 'The Duke is dead. His son\'s grave is in the north row; they say the father still keeps watch there after dark.', () => (alive ? [22, -113.5] : GRAVE), { quiet: true });
    this.g.story.tracked = null; this.onVerse();
  }
  onVerse() {
    const c = this.c, n = c.verses.size;
    if (c.has('c2_lore')) { const o = c.objective('c2_lore', `Learn what the letter is (${n}/3)`); if (n >= 3) c.done('c2_lore'); void o; }
    for (const [k, id] of [['saint', 'c2_ansel'], ['witch', 'c2_witch'], ['father', 'c2_duke']]) if (c.verses.has(k) && c.has(id)) c.done(id);
    if (n >= 2 && c.has('c2_lore') && !c.has('c2_rookery')) {
      c.objective('c2_rookery', 'Find Sable beneath the Drowned Lantern in Pellmouth', 'Marl keeps the trapdoor behind his bar. Talk your way past him, pay him, or lift the key from his belt.', () => (this.g.story.zone === 'rookery' ? [-177, 300] : [143, -167]));
      this.world(true);
    }
  }
  // the father's shade: night only, by the grave
  shade() {
    const g = this.g, P = g.player.pos, night = g.clock.hours >= 21.5 || g.clock.hours < 4.5, near = hyp(P[0] - GRAVE[0], P[2] - GRAVE[1]) < 16;
    let sh = g.npcs.find((n) => n.id === 'duke_shade');
    if (night && near && !sh) {
      const q = g.nav.nearestWalkable(GRAVE[0] + 1.2, GRAVE[1] - 1.2, 3) || GRAVE;
      sh = g.spawnNpc({ id: 'duke_shade', name: 'The Duke\'s shade', role: 'noble', pos: q, yaw: 180, dialogue: 'dukeshade', weapon: null, essential: true, ignoreHollows: true, spec: { outfit: 'duke', skin: 'ashen', glowEyes: true, hair: { style: 'short', color: 'white' }, colors: { cloth: '#8a90a8', cloth2: '#6a7088', robe: '#9aa0b8' }, voice: 0.7, height: 0.98 } });
      sh.peaceful = true; g.sfx.whisper?.(); g.toast('Someone is standing at the grave');
    } else if (sh && !sh.dead && (!night || !near) && sh.dist > 20) { g.scene.remove(sh.ch); g.world.remove(sh.body); g.npcs.splice(g.npcs.indexOf(sh), 1); }
  }
  // ------------------------------------------------------------ conversations this chapter changes
  dialogue(npc) {
    const g = this.g, c = this.c, F = c.facts;
    if (c.index() < 1) return null;
    if (npc.id === 'ansel' && !c.verses.has('saint')) return [
      L('You! The thief... no. Do not run, and do not shout. They say you broke the Duke\'s seal. Did you?', { mood: 'fear', choices: [{ text: 'No. It cracked by itself.', next: 1 }, { text: 'Tell me what it is, Father.', next: 2 }] }),
      L('By itself. Then it is waking on its own, and that is worse.', { goto: 2 }),
      L('Before Vorst there was the Pale Saint. She sealed the Choir with a name written in wax: wax binds the mouth. Burn the name and the mouth forgets.'),
      L('That letter is the name, thief. The Choir\'s own name, signed over to whoever holds it. If it must be ended, end it with fire.', { onShow: () => c.learn('saint') }),
      L('Take the Saint\'s blessing with you. It is all I have left that works.', { end: true, onShow: () => g.status.add('bless') }),
    ];
    if (npc.id === 'sable' && !c.verses.has('witch')) return [
      L('So the knife comes to the mother. You smell of her wax.', { choices: [{ text: 'You are Sable\'s mother?', next: 1 }, { text: 'What is the letter?', next: 2 }] }),
      L('My girl went to the Choir for a voice that could make men kneel. It gave her one. It took everything else, and it has not finished taking.', { goto: 2 }),
      L('Bone binds the voice. Vorst the Binder gave his own skull to the hill, so the Choir could only ever sing in its sleep. My daughter means to dig him up.', { onShow: () => c.learn('witch') }),
      L('Take this. Black wax from the first seal, on a cord: when the Choir sings at you, it will slide off. And if you see her... tell her that her mother still keeps the lamp lit.', { end: true, onShow: () => { if (!g.player.inv.has('waxward') && g.gear.eq.charm !== 'waxward') { g.player.inv.add('waxward', 1); g.toast('Received the Wax ward (equip it in the Gear tab)'); } F.witchMessage = true; } }),
    ];
    if (npc.id === 'duke' && !c.verses.has('father') && this.dukeAlive()) return [
      L('You. Have you come to finish it? Then finish it. I have no guards left worth the name.', { mood: 'fear', choices: [{ text: 'I want to know what I stole.', next: 1 }, { text: 'Why did you make the bargain?', next: 2 }] }),
      L('A debt. Thirty years ago, when the plague took my Edric, a woman in gray came to me: the Choir would give him back, for a name. I gave it mine. The letter is the debt, sealed.', { goto: 3 }),
      L('Because he was seven, and coughing blood, and the priests had stopped coming. You would have signed too.', { goto: 1 }),
      L('Bell binds the hour. Twelve strokes keep the night; the thirteenth opens it. The Binder wrote a stranger thing: strike the Choir\'s heart thirteen times with the bell\'s own tongue, and the hour closes forever.', { onShow: () => { c.learn('father'); F.dukeTalked = true; } }),
      L('I never had the courage. Perhaps a thief has enough.', { end: true }),
    ];
    if (npc.id === 'duke_shade' && !c.verses.has('father')) return [
      L('Even dead, I wait by him. He does not come. The Choir keeps what it is given.', { mood: 'fear' }),
      L('You carry my debt, thief. Then hear what the Binder knew: twelve strokes keep the night; the thirteenth opens it. Strike the heart thirteen times with the bell\'s own tongue, and the hour closes forever.', { onShow: () => c.learn('father') }),
      L('Go. The bell is waiting, and so is my son.', { end: true, onShow: () => { const sh = g.npcs.find((n) => n.id === 'duke_shade'); if (sh) { g.emitBurst?.([sh.x, sh.y + 1, sh.z], 'veil'); g.after(0.4, () => { g.scene.remove(sh.ch); g.world.remove(sh.body); const i = g.npcs.indexOf(sh); if (i >= 0) g.npcs.splice(i, 1); }); } } }),
    ];
    if (npc.id === 'marl' && c.has('c2_rookery') && !F.rookOpen) {
      const open = () => L('Behind the bar, under the rug. They will know you are coming, friend. They always know.', { end: true, onShow: () => { F.rookOpen = true; g.toast('Marl unbolts the trapdoor'); } });
      const sp = g.speech, bonus = F.brannochSaved ? 0.25 : 0;
      return [
        L('The Drowned Lantern. Ale, stew, a bed, and no questions. One of those is free.', { choices: [
          sp.choice('persuade', npc, 'Brannoch sent me. I need the trapdoor.', { extra: bonus, ok: () => open(), fail: () => L('Brannoch is a dead man, I hear. Drink or leave.', { end: true }) }),
          { text: `[Bribe 60g] Sixty gold says you forget my face.`, when: () => g.player.inv.gold >= 60, next: () => { g.player.inv.gold -= 60; g.sfx.coin?.(); return open(); } },
          sp.choice('intimidate', npc, 'Open it, or I open you.', { ok: () => open(), fail: () => L('Ha. I have pulled bigger fish than you out of that lake. Get out.', { end: true }) }),
          { text: 'What is under this inn, Marl?', next: 1 }, { text: 'Never mind.', next: 'end' }] }),
        L('A cellar. Cellars have doors, doors have keys, and I keep mine on my belt where I can feel it. Drink or leave.', { end: true }),
      ];
    }
    return null;
  }
  // ------------------------------------------------------------ the Rookery
  spawnRookery() {
    const g = this.g, S = this.s; S.rookSpawned = true;
    const crew = [
      ['rk_cellar', -217, 302.5, { poi: 'rook_cellar_a' }], ['rk_count_a', -199, 298, { poi: 'rook_count_a' }], ['rk_count_b', -202, 296.5, { route: 'rook_count_beat' }],
      ['rk_dice', -195, 311.2, { poi: 'rook_dice' }], ['rk_bunk_a', -205.6, 316, { schedule: [{ h0: 0, h1: 24, poi: 'bed_rook_0', act: 'sleep' }] }], ['rk_bunk_b', -202.6, 316, { schedule: [{ h0: 0, h1: 24, poi: 'bed_rook_2', act: 'sleep' }] }],
      ['rk_dock_a', -182, 316.4, { poi: 'rook_dock_a' }], ['rk_dock_b', -187, 313, { route: 'rook_dock_beat' }],
    ];
    for (const [id, x, z, o] of crew) { if (S.dead.includes(id) || g.npcs.some((n) => n.id === id)) continue; const n = g.spawnNpc(handKnife(id, x, z, o)); n.snapToSchedule(); }
    if (!S.dead.includes('vane') && !g.npcs.some((n) => n.id === 'vane') && !this.c.facts.vaneSpared) {
      const v = g.spawnNpc({ id: 'vane', name: 'Vane', role: 'guard', hostile: true, boss: true, arch: 'duelist', faction: 'hand', pos: [-177, 300], yaw: 270, weapon: 'dark', block: 0.45, eyes: 1.3, detail: 0.6,
        loot: [['vanekey', 1], ['vanecoat', 1], ['gold', 90], ['salve_gh', 1]], schedule: [{ h0: 0, h1: 24, poi: 'rook_vane', act: 'stand' }],
        spec: { outfit: 'rogue', hood: false, skin: 'tan', hair: { style: 'short', color: 'black' }, beard: 'short', colors: { cloth: '#2a2228', cloth2: '#3a3038', leather: '#1a1416', glove: '#141012' }, weapon: 'dark', height: 1.06, voice: 0.8 } });
      v.peaceful = true; v.snapToSchedule();
    }
  }
  vaneTalk(v) {
    const g = this.g, c = this.c, F = c.facts, S = this.s; S.vane = 'talk';
    const fight = () => { S.vane = 'fight'; v.peaceful = false; v.state = 'chase'; v.alert = 1; v.lastSeen = [...g.player.pos]; g.ui.flashBanner('VANE, THE HAND\'S DUELIST', 2400, true); for (const n of g.npcs) if (n.faction === 'hand' && !n.dead && n.dist < 30 && n !== v) { n.state = 'chase'; n.alert = 1; n.lastSeen = [...g.player.pos]; } };
    const spare = () => { S.vane = 'spared'; F.vaneSpared = true; g.player.inv.add('vanekey', 1); g.toast('Vane gives you his key'); g.progress.addXp(150, 'a duel not fought'); c.objective('c2_ledger', 'Search Sable\'s study for her plans', 'Vane\'s key opens the study door.', () => [-164, 301]); g.after(2.5, () => { if (!v.dead) { g.emitBurst?.([v.x, v.y + 1, v.z], 'poof'); g.scene.remove(v.ch); g.world.remove(v.body); const i = g.npcs.indexOf(v); if (i >= 0) g.npcs.splice(i, 1); for (const n of g.npcs) if (n.faction === 'hand') n.peaceful = true; } }); };
    const extra = 0.12 * c.verses.size + (F.brannochSaved ? 0.08 : 0), masked = g.rep.disguise?.kind === 'hand';
    const lines = [
      L(masked ? 'Take off the mask, Rook. I taught half of them in there how to wear it.' : 'So Brannoch\'s knife comes home. She said you would. She is never wrong about the ones she uses.', { choices: [
        g.speech.choice('persuade', v, 'She is feeding the Gray Hand to the Choir with everyone else. Read her ledger and tell me I am wrong.', { extra, ok: () => L('...I have read it. I have read it every night for a month. Go. Take the key; I will not stop you, and I will not stop her. Find me at the Stones if you mean to finish this.', { end: true, onShow: spare }), fail: () => L('Words. She warned me you were good with them. Draw.', { end: true, onShow: fight }) }),
        g.speech.choice('intimidate', v, 'Stand aside or join the others on the floor.', { extra: -0.1, ok: () => L('...Ha. You would, too. Take the key, then. I am owed nothing by her.', { end: true, onShow: spare }), fail: () => L('Brave. Draw, then.', { end: true, onShow: fight }) }),
        { text: '(Draw steel.)', next: 'end', action: fight }] }),
    ];
    g.ui.dialogue({ npc: v, lines, name: 'Vane' });
  }
  readLedger() {
    const g = this.g, c = this.c; g.readNote('sable_ledger');
    if (this.s.ledger || c.index() > 1) return; this.s.ledger = true;
    c.done('c2_ledger'); c.done('c2_rookery'); c.facts.c2done = true;
    g.progress.addXp(150, 'the Gray Hand\'s secret');
    g.after(2.5, () => { if (g.ui.sheetOpen) g.ui.closeNote(); c.begin('c3'); });
  }
  resume() { if (this.g.story.zone === 'rookery' || this.c.has('c2_rookery')) { if (this.g.story.zoneOf(this.g.player.pos) === 'rookery') this.spawnRookery(); } }
  save() { const g = this.g; for (const n of g.npcs) if (n.dead && (n.id.startsWith('rk_') || n.id === 'vane' || n.id.startsWith('c2_amb')) && !this.s.dead.includes(n.id)) this.s.dead.push(n.id); return this.s; }
  load(d) { this.s = { ambush: false, foes: [], dead: [], bran: null, rookSpawned: false, vane: null, ledger: false, ...(d || {}) }; this.s.rookSpawned = false; if (this.s.vane === 'talk') this.s.vane = null; }
}
