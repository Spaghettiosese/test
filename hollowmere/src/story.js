// The story of Chapter I: the campfire cutscene, objectives, the people you can talk to, the
// notes you can read, the Duke's bedchamber and the letter, and the ending.
import * as E from '../../engine/index.js';
import { createPerson } from './people/index.js';
import { DIALOGUE } from './dialogue.js';
import { NPC } from './npc.js';

const hyp = Math.hypot;
const ease = (t) => t * t * (3 - 2 * t);
const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const NOTES = {
  notice: { title: 'NOTICE OF THE DUCAL WATCH', text: 'BY ORDER OF DUKE ALDRIC VORST\n\nThe gates of Ashgate shall be barred at the tenth bell and opened at the sixth.\nNo person shall carry light within the graveyard after dark.\nNo person shall speak of the bell.\n\nThieves taken within the walls will be caged. See the gibbet.\n\nThe Duke thanks you for your obedience.' },
  tomb: { title: 'THE FIRST DUKE\'S TOMB', text: 'HERE LIES VORST THE BINDER,\nWHO CLOSED THE MOUTH BENEATH THE HILL\nAND SEALED IT IN BLACK WAX AND HIS OWN NAME.\n\nLET NO HAND OF HIS BLOOD BREAK THE SEAL.\nLET NO HAND AT ALL.\n\n(Scratched beneath, in a newer hand: "It is getting louder.")' },
  orders: { title: 'SERGEANT\'S ORDERS', text: 'Captain Harl has doubled the night watch on the bedchamber.\nThe Duke sleeps with a candle burning and a guard at his door. Nobody enters after the eleventh bell. NOBODY.\n\nAlso: the cook wants her larder key back. Somebody took it. Again.' },
  ledger: { title: 'STEWARD\'S LEDGER', text: 'Received of the Gray Hand: forty pieces of gold, in advance.\nReceived of the Gray Hand: one letter, sealed. To be kept in the Duke\'s strongbox until the bearer arrives.\nDelivered to the cellar: seven barrels of salt. Requested by the Duke. Not for the meat.\n\nThe Duke does not eat anymore. The salt is gone every morning.' },
  diary: { title: 'FATHER ANSEL\'S DIARY', text: 'The Pale Saint\'s statue wept again tonight. Not tears: something dark, from the eyes.\nI asked the Duke what lies under Ravenspire. He laughed for a long time and did not answer.\n\nI have hidden the Saint\'s tear in the crypt shrine, beyond the ossuary. If it falls into the wrong hands...\nIf it falls into ANY hands.' },
  choir: { title: 'SCRAWL ON THE OSSUARY WALL', text: 'THEY SING FROM BELOW\nTHEY SING OUR NAMES\nTHEY LEARN A NEW NAME EVERY CENTURY\nTHE NEXT ONE IS BEING WRITTEN\n\nDO NOT ANSWER' },
  letterfake: { title: 'TAX MEMORANDUM', text: 'To the Steward of Ravenspire.\nRe: The levy on candles, tallow and salt.\nThe Duke insists upon salt.\n\nSigned, a very bored clerk.' },
  letter: { title: 'THE SEALED LETTER', text: 'To the Choir that sleeps beneath Ravenspire.\n\nThe debt is nearly paid. The Duke has kept his part: the seal has held these thirty years. I send you now the last coin: one who has walked unseen, who has left no name, and who will break the seal with his own hand.\n\nWake. Be fed.\n\n. Sable, Mistress of the Gray Hand' },
};

export class Story {
  constructor(game) {
    this.g = game; this.flags = {}; this.notes = NOTES; this.notesFound = new Set(); this.busy = false;
    this.objectives = [{ id: 'town', text: 'Get into Ashgate unseen', sub: 'The gate is watched. West of it the wall is broken; east, an outfall runs under it.', done: false },
      { id: 'court', text: 'Cross the town to Ravenspire and reach the courtyard', sub: 'The keep gate is guarded. The graveyard has a mausoleum. The dead do not talk.', done: false },
      { id: 'keep', text: 'Get inside the keep', sub: 'Doors are locked at night. Look for keys, or for a lock you can pick.', done: false },
      { id: 'chamber', text: 'Reach the Duke\'s bedchamber', sub: 'North of the great hall, past the antechamber guards.', done: false },
      { id: 'letter', text: 'Take the Sealed Letter from the strongbox at the foot of the bed', sub: 'Do not break the seal.', done: false },
      { id: 'escape', text: 'Escape through the balcony door', sub: 'The Choir is rising.', done: false }];
    this.timer = 0; this.zone = ''; this.cs = null; this.dukeMeter = 0; this.dukeState = 'normal'; this.finale = false; this.fin = null; this.hollowCount = 0; this.startTime = 0; this.playTime = 0;
    this.rook = null;
    this.csLight = new E.Light('point', { color: '#ffb070', intensity: 7, range: 14 }); this.csLight.position.set([0, -50, 0]); game.scene.add(this.csLight);
    this.extraInteractables();
  }
  currentObjective() { if (this.g.mode === 'boot') return null; return this.objectives.find((o) => !o.done) || null; }
  complete(id) { const o = this.objectives.find((x) => x.id === id); if (o && !o.done) { o.done = true; this.g.ui.flashBanner('OBJECTIVE COMPLETE', 1800, true); this.g.sfx.coin?.(); } }
  // ------------------------------------------------------------ notes & extra interactables
  extraInteractables() {
    const L = this.g.level, note = (id, x, y, z, prompt = 'Read the note') => L.interactables.push({ kind: 'note', x, y, z, r: 1.9, obj: { id }, prompt: () => prompt, use: (g) => g.readNote(id) });
    note('orders', -28.5, 0.9, 104.5, 'Read the orders'); note('ledger', -16.4, 1.0, 138.0, 'Read the ledger'); note('diary', -34.4, 0.8, 68.6, 'Read the diary'); note('choir', 104, 1.2, 27.4, 'Read the scrawl');
  }
  readNote(id) {
    const n = NOTES[id]; if (!n) return;
    this.notesFound.add(id); this.g.sfx.coin?.();
    this.g.ui.note(n.title, n.text);
  }
  // ------------------------------------------------------------ talking
  talk(npc) {
    const fn = DIALOGUE[npc.dialogue]; if (!fn) return;
    const lines = fn(this.g, npc); if (!lines) return;
    const want = Math.atan2(this.g.player.pos[0] - npc.x, this.g.player.pos[2] - npc.z);
    npc.yaw = want;
    npc.ch.upper.playOnce('Talk', { fadeIn: 0.3, fadeOut: 0.6 });
    this.g.ui.dialogue({ npc, lines });
  }
  buy(id, price) {
    const inv = this.g.player.inv;
    if (inv.gold < price) { this.g.toast('Not enough gold'); this.g.sfx.deny?.(); return; }
    inv.gold -= price; inv.add(id, 1); inv.lootValue -= 0; this.g.sfx.coin?.(); this.g.toast('Bought 1 ' + (id === 'potion' ? 'Red Salve' : id === 'ember' ? 'Ember Flask' : 'lockpick'));
  }
  startLocket() { this.flags.locketQuest = true; this.objectives.push({ id: 'locket', text: 'Marta\'s locket: find it (a mercenary pawned it)', sub: 'Try the smith\'s strongbox or the mercenary in the tavern.', done: false, side: true }); this.g.toast('New task: Marta\'s locket'); }
  giveLocket() { const g = this.g; g.player.inv.remove('locket', 1); g.player.inv.add('gold', 60); this.flags.locketReturned = true; const o = this.objectives.find((x) => x.id === 'locket'); if (o) o.done = true; g.toast('+60 gold'); g.sfx.coin?.(); }
  startRelic() { this.flags.relicQuest = true; this.objectives.push({ id: 'relic', text: 'Bring the Pale Saint\'s tear (a gem) from the crypt shrine to Father Ansel', sub: 'Through the mausoleum, past the ossuary.', done: false, side: true }); this.g.toast('New task: the Saint\'s tear'); }
  giveRelic() { const g = this.g; g.player.inv.remove('gem', 1); g.player.inv.add('mausoleumkey', 1); this.flags.relicReturned = true; const o = this.objectives.find((x) => x.id === 'relic'); if (o) o.done = true; g.toast('Received the mausoleum key'); }
  onItem(id) {
    const g = this.g;
    if (id === 'letter') this.letterTaken();
    if (id === 'locket' && this.flags.locketQuest) g.toast('You found the locket: return it to Marta');
    if (id === 'letterfake') g.toast('This is not the letter you want');
  }
  onContainer(c) { if (c.id === 'duke_chest' && !this.g.player.inv.has('letter') && this.g.player.inv.has('letter') === false) { /* handled by onItem */ } }
  onSnuff() {}
  onBodyLooted() {}
  onKill(n) {
    const g = this.g;
    if (n.id === 'duke') { this.dukeState = 'dead'; this.flags.dukeKilled = true; g.ui.flashBanner('THE DUKE IS DEAD', 2600); }
    if (n.role === 'hollow') this.hollowCount++;
  }

  // ------------------------------------------------------------ cutscene engine
  // beats: [{ dur, cam: { p0, p1, l0, l1, fov?, roll? }, sub?: [name, text], enter?, tick?(u), exit? }]
  play(beats, done) { this.cs = { beats, i: -1, t: 0, done, beat: null }; this.g.mode = 'cutscene'; this.g.ui.letterbox(true); this.g.ui.showHud(false); this.nextBeat(); if (document.pointerLockElement) document.exitPointerLock?.(); }
  nextBeat() {
    const c = this.cs; c.i++;
    if (c.i >= c.beats.length) { const d = c.done; this.cs = null; this.csLight.position.set([0, -50, 0]); this.g.ui.letterbox(false); this.g.ui.subtitle(null); d?.(); return; }
    c.beat = c.beats[c.i]; c.t = 0;
    const b = c.beat; if (b.enter) b.enter(this);
    if (b.sub) this.g.ui.subtitle(b.sub[0], b.sub[1]); else if (!b.keepSub) this.g.ui.subtitle(null);
    if (b.title) this.g.ui.titleCard(b.title[0], b.title[1]); else this.g.ui.titleCard(null);
    if (b.fade !== undefined) this.g.pix.fade = b.fade;
  }
  skip() { let n = 0; while (this.cs && n++ < 60) { const b = this.cs.beat; b?.exit?.(this); this.nextBeat(); } }
  spawnCryptHollows() { for (const [x, z] of [[104, 22], [108, 16], [100, 26], [102, 55], [109, 55]]) this.spawnHollow(x, z, false, true); }
  cameraUpdate(cam, dt) {
    const c = this.cs; if (!c) return;
    const b = c.beat; c.t += dt;
    if (c.fp) { this.g.player.vm.visible = true; this.g.player.updateView(cam, dt, this.g.baseFov); if (c.t >= b.dur) { if (b.exit) b.exit(this); this.nextBeat(); } return; }
    const u = Math.min(1, c.t / b.dur), e = b.linear ? u : ease(u);
    if (b.cam) {
      const p = lerp3(b.cam.p0, b.cam.p1 || b.cam.p0, e), l = lerp3(b.cam.l0, b.cam.l1 || b.cam.l0, e);
      cam.position.set(p); cam.target.set(l); cam.up.set([0, 1, 0]); cam.fov = (b.cam.fov || 62) * E.DEG;
      if (b.cam.track) { const t = b.cam.track(); cam.target.set(t); }
    }
    if (b.fadeTo !== undefined) this.g.pix.fade += (b.fadeTo - this.g.pix.fade) * Math.min(1, dt * (b.fadeRate || 3));
    if (b.tick) b.tick(u, dt, this);
    if (this.rook?.visible) { this.rook.updateWorld(this.g.scene.world); }
    { const t = b.cam?.track ? cam.target : cam.target; this.csLight.position.set([cam.position[0] + (t[0] - cam.position[0]) * 0.25, cam.position[1] + 0.4, cam.position[2] + (t[2] - cam.position[2]) * 0.25]); }
    if (c.t >= b.dur) { if (b.exit) b.exit(this); this.nextBeat(); }
  }
  // ------------------------------------------------------------ the opening
  makeRook() {
    if (this.rook) return this.rook;
    const r = createPerson({ outfit: 'rogue', skin: 'pale', hair: { style: 'short', color: 'black' }, colors: { leather: '#3a2a20', glove: '#2c2018', cloth2: '#20182a', cloth: '#3a3038' }, weapon: 'nightfang', hood: true, height: 1.0 }, { detail: 0.9 });
    r.position.set([0, 0, -62]); r.armR.play('Sword Rest', { fade: 0 }); this.g.scene.add(r); this.rook = r; return r;
  }
  intro() {
    const g = this.g, self = this, rook = this.makeRook(), bran = g.npcs.find((n) => n.id === 'brannoch');
    const step = (r, dt, target, speed) => { const dx = target[0] - r.position[0], dz = target[2] - r.position[2], d = hyp(dx, dz); if (d < 0.05) return true; const yaw = Math.atan2(dx, dz); E.quat.fromEuler(r.rotation, 0, yaw / E.DEG, 0); r.position[0] += dx / d * speed * dt; r.position[2] += dz / d * speed * dt; return false; };
    const walkAnim = (w) => { rook.mixer.setWeights(w ? { Walk: 1 } : { Idle: 1 }, 0.25); rook.mixer.timeScale = w ? 1.1 : 1; };
    const talk = (who) => { rook.armR.play(who === 'rook' ? 'Hold Item' : 'Sword Rest', { fade: 0.2 }); rook.upper.playOnce && who === 'rook' && rook.upper.playOnce('Talk', { fadeIn: 0.3, fadeOut: 0.4 }); if (bran) { if (who === 'bran') bran.ch.upper.playOnce('Talk', { fadeIn: 0.3, fadeOut: 0.5 }); } };
    const facing = (a, b) => Math.atan2(b[0] - a[0], b[2] - a[2]) / E.DEG;
    const line = (who, text, dur, cam) => ({ dur, sub: [who === 'rook' ? 'Rook' : who === 'bran' ? 'Brannoch' : '', text], cam, enter: () => talk(who) });
    const A = { p0: [7.0, 1.55, -34.2], p1: [7.1, 1.58, -34.0], l0: [11.4, 1.5, -31.7], fov: 55 };      // over Rook's shoulder, on Brannoch
    const B = { p0: [13.6, 1.5, -30.2], p1: [13.4, 1.5, -30.4], l0: [8.7, 1.6, -34.2], fov: 55 };       // over Brannoch's shoulder, on Rook
    const beats = [
      { dur: 4.2, title: ['HOLLOWMERE', 'Chapter I · The Duke\'s Seal'], fade: 1, fadeTo: 1, cam: { p0: [-10, 3, -70], p1: [-6, 3.4, -62], l0: [0, 16, 110] }, enter: () => { g.pix.fade = 1; g.sfx.bell?.(1); } },
      { dur: 7.5, sub: ['Rook', 'Ashgate. They say it is the last town before the world ends. Funny how the world keeps ending in places that pay.'], fadeTo: 0, fadeRate: 2, cam: { p0: [-9, 3.1, -68], p1: [-2, 4.6, -52], l0: [0, 18, 110], l1: [0, 22, 110], fov: 58 }, enter: () => { rook.position.set([0, 0, -66]); walkAnim(true); }, tick: (u, dt) => { step(rook, dt, [0, 0, -44], 1.5); } },
      { dur: 6.5, sub: ['Rook', 'Three days on the road. One job. A letter nobody in that keep would miss... until it was gone.'], cam: { p0: [3.6, 1.2, -50], p1: [4.4, 1.4, -47], l0: [0, 1.5, -45], l1: [1, 1.6, -44], fov: 52 }, tick: (u, dt) => { step(rook, dt, [7.5, 0, -37], 1.5); }, enter: () => { rook.position.set([0, 0, -46]); } },
      { dur: 0.1, cam: A, enter: () => { rook.position.set([8.6, 0, -34.2]); E.quat.fromEuler(rook.rotation, 0, facing([8.6, 0, -34.2], [11.4, 0, -31.6]), 0); walkAnim(false); if (bran) { bran.yaw = Math.atan2(8.6 - bran.x, -34.2 - bran.z); } } },
      line('bran', 'You are late, knife. Sable said you would be late. She is rarely wrong.', 5.2, A),
      line('rook', 'The road was long. Where is it?', 3.2, B),
      line('bran', 'Ravenspire. The Duke\'s bedchamber, a strongbox at the foot of his bed. A letter in black wax, a raven pressed in it. Bring it out unopened.', 8.2, A),
      line('rook', 'Unopened. Why?', 2.4, B),
      line('bran', 'Because Sable asked nicely. And Sable never asks nicely.', 4.6, A),
      line('bran', 'The gates shut at the tenth bell. The wall is broken to the west. There is an outfall east of the gate, if you do not mind crawling. Or go through the graveyard and under the keep. The dead will not tell on you.', 11, A),
      line('rook', 'The dead are the best company in Hollowmere.', 3.6, B),
      line('bran', 'Not lately. The bell has been tolling wrong. Take these. And Rook... the Duke is afraid of that letter. Whatever it is, be somewhere else when it opens.', 9, A),
      { dur: 8, sub: ['Rook', 'Then let us not keep the Duke waiting.'], cam: { p0: [7.2, 1.8, -35], p1: [4.5, 12, -30], l0: [8.8, 1.6, -34.2], l1: [0, 24, 110], fov: 58 }, enter: () => { rook.upper.playOnce('Talk'); g.sfx.bell?.(1); } , fadeTo: 0 },
      { dur: 1.6, fadeTo: 1, fadeRate: 4, cam: { p0: [4.5, 12, -30], l0: [0, 24, 110] }, keepSub: false },
    ];
    // at last: hand over control
    this.play(beats, () => this.beginPlay());
    g.pix.fade = 1;
  }
  beginPlay() {
    const g = this.g, P = g.player;
    if (this.rook) { this.rook.visible = false; this.g.scene.remove(this.rook); }
    P.cc.position = [9, 0.1, -35]; P.cc.velocity = [0, 0, 0]; P.yaw = -0.6; P.pitch = 0; P.inv.add('lockpick', 2);
    g.setCheckpoint([9, 0.1, -35], -0.6);
    g.mode = 'play'; g.ui.showHud(true); g.ui.letterbox(false); g.pix.fade = 0; g.ui.area('The King\'s Road'); g.canvasLock?.();
    g.clock.hours = Math.max(g.clock.hours, 19.3); g.ui.toast('Brannoch slips you two lockpicks'); this.startTime = g.time;
    P.playVm('Draw', 0.05);
  }
  // ------------------------------------------------------------ zones, objectives, the Duke
  zoneOf(p) {
    const x = p[0], z = p[2];
    if (x > 66) return x > 111 && z > 40 ? 'undercroft' : 'crypt';
    const nav = this.g.nav, ind = nav.indoorAt(x, z);
    if (z > 112 && z < 147 && Math.abs(x) < 20) { if (z > 134) return x > 4.5 ? 'chamber' : x > -7.5 ? 'ante' : 'study'; return 'hall'; }
    if (z > 147 && z < 153 && Math.abs(x) < 20) return 'backyard';
    if (z > 93 && Math.abs(x) < 36) return 'court';
    if (z > 12 && Math.abs(x) < 48 && z < 93) { if (x < -36 && z > 60) return 'graveyard'; return 'town'; }
    return 'road';
  }
  update(dt) {
    const g = this.g;
    if (g.mode === 'play') this.playTime += dt;
    if (g.mode !== 'play' && g.mode !== 'talk') return;
    this.timer += dt; if (this.timer < 0.2) { this.dukeUpdate(dt); return; } const step = this.timer; this.timer = 0;
    const p = g.player.pos, zone = this.zoneOf(p);
    if (zone !== this.zone) {
      this.zone = zone;
      const names = { road: 'The King\'s Road', town: 'Ashgate', graveyard: 'The Graveyard', court: 'Ravenspire Courtyard', hall: 'The Great Hall', ante: 'The Antechamber', study: 'The Duke\'s Study', chamber: 'The Duke\'s Bedchamber', backyard: 'Behind the Keep', crypt: 'The Catacombs', undercroft: 'Ravenspire Undercroft' };
      if (!this.g.tele) g.ui.area(names[zone]);
      const cps = { town: [[0, 0.1, 16], 0], court: [[0, 0.1, 97.5], 0], hall: [[0, 0.1, 114.5], 0], chamber: [[9, 0.1, 137], 0.4], crypt: [[76, 0.1, 17], 1.57], graveyard: [[-40, 0.1, 64.5], 0] };
      if (cps[zone]) g.setCheckpoint(...cps[zone]);
    }
    if (zone !== 'road' && !this.objectives[0].done) this.complete('town');
    if (['court', 'hall', 'ante', 'study', 'chamber', 'backyard'].includes(zone)) { this.complete('town'); this.complete('court'); }
    if (['hall', 'ante', 'study', 'chamber'].includes(zone)) this.complete('keep');
    if (zone === 'chamber') this.complete('chamber');
    if (this.finale && zone === 'backyard' && !this.fin) this.startFinale();
    void step;
    this.hollowUpdate(0.2);
    this.dukeUpdate(dt);
  }
  hollowUpdate() {
    // sleeping hollows wake when you get close
    const P = this.g.player;
    for (const n of this.g.npcs) if (n.role === 'hollow' && n.dormant && !n.dead) {
      const d = hyp(n.x - P.pos[0], n.z - P.pos[2]);
      if (d < 7 && P.visibility > 0.15 || d < 3) { n.dormant = false; n.state = 'chase'; n.lastSeen = [...P.pos]; n.alert = 1; this.g.sfx.hollowCry?.(n.pos); this.g.combatT = 8; n.ch.mixer.setWeights({ Idle: 1 }); }
    }
  }
  dukeUpdate(dt) {
    const g = this.g, duke = g.npcs.find((n) => n.id === 'duke'); if (!duke || duke.dead) return;
    const P = g.player;
    if (this.dukeState === 'normal') {
      if (duke.lying && this.zone === 'chamber') {
        const d = hyp(duke.x - P.pos[0], duke.z - P.pos[2]);
        let rate = P.sprint ? 1.2 : P.crouch ? 0.05 : P.speedNow > 0.5 ? 0.35 : 0.04;
        if (P.picking) rate += 0.5; if (P.atk) rate += 1.5; if (P.lightLevel > 0.6) rate += 0.15;
        this.dukeMeter += dt * rate * Math.max(0.2, 1 - d / 9);
        if (this.dukeMeter > 4.5) this.wakeDuke();
      }
      if (duke.state === 'flee' && !duke.lying && !this.dukeAlarm) { this.dukeAlarm = true; g.alarm(duke.pos, 'scream', duke); }
    }
    if (this.dukeState === 'surrender') {
      this.surrenderT = (this.surrenderT || 0) + dt;
      duke.speed = 0; duke.yaw = Math.atan2(P.pos[0] - duke.x, P.pos[2] - duke.z);
      if (this.surrenderT > 40 && !this.dukeScreamed) { this.dukeScreamed = true; duke.state = 'flee'; duke.fleeT = 12; duke.bark('GUARDS! GUARDS!'); g.alarm(duke.pos, 'spotted', duke); this.dukeState = 'fled'; }
    }
  }
  wakeDuke() {
    const g = this.g, duke = g.npcs.find((n) => n.id === 'duke'); if (!duke || this.dukeState !== 'normal') return;
    duke.leaveActivity(); duke.lying = false; duke.asleep = false; duke.state = 'handsup'; duke.slotKey = '__awake'; duke.stopMove();
    this.dukeState = 'surrender'; this.surrenderT = 0;
    duke.x += 1.2; duke.yaw = Math.atan2(g.player.pos[0] - duke.x, g.player.pos[2] - duke.z);
    duke.bark('Who... who is there?!'); g.sfx.grunt?.(1, duke.pos, 0.7);
    setTimeout(() => this.dukePlea(), 900);
  }
  dukePlea() {
    const g = this.g, duke = g.npcs.find((n) => n.id === 'duke'); if (!duke || duke.dead || g.mode !== 'play') return;
    const S = duke.spec;
    const lines = [
      { who: 'Duke Aldric Vorst', mood: 'fear', text: 'Please— take whatever you like! My gold, my rings, my name if you want it. Only leave the seal unbroken!', choices: [
        { text: 'Where is the letter?', next: 1 }, { text: 'What is in it?', next: 2 }, { text: 'Sable sent me.', next: 3 }, { text: 'Lie still. Quietly.', next: 'end' }, { text: '(Draw steel on him.)', next: 'end', action: () => { duke.hp = 1; } }] },
      { who: 'Duke Aldric Vorst', mood: 'fear', text: 'The strongbox at the foot of my bed. The key is in my study desk. Take it, take it, and go!', goto: 0 },
      { who: 'Duke Aldric Vorst', mood: 'fear', text: 'A contract. My name on it, and hers, and a third that is not a name but a sound. She swore the Choir could give me back my boy. I only had to keep the wax whole until the bearer came.', goto: 0 },
      { who: 'Duke Aldric Vorst', mood: 'fear', text: 'Sable... then it has begun. You do not know what you carry, do you? You are not the thief, boy. You are the key.', goto: 0 },
    ];
    g.ui.dialogue({ npc: duke, lines, name: 'Duke Aldric Vorst', spec: S });
    // choices can loop; the "goto: 0" lines return to the first
    for (const l of lines) l.choices?.forEach((c) => { if (c.next === 'end' && !c.action) c.next = 'end'; });
  }
  // ------------------------------------------------------------ the letter
  letterTaken() {
    const g = this.g; if (this.finale) return;
    this.finale = true; this.complete('letter');
    this.flags.letterTime = g.time;
    // freeze play for a beat: first-person cutscene
    g.mode = 'cutscene'; g.ui.letterbox(true); g.ui.showHud(false);
    const P = g.player; P.playVm('Reach');
    const beats = [
      { dur: 3.0, sub: ['Rook', 'It is warm. Like something breathing.'], enter: () => { g.sfx.whisper?.(); g.pix.veil = 1; } },
      { dur: 3.2, sub: ['Rook', 'The wax... It is cracking. I did not touch it.'], enter: () => { g.sfx.boom?.(0.7); g.shake = 1; g.emitBurst(P.eyePos, 'veil'); } },
      { dur: 3.0, sub: ['', 'The bell of Ravenspire tolls. Thirteen times.'], enter: () => { g.sfx.bell?.(2); g.noise(P.pos, 60, 'alarm'); g.alarm(P.pos, 'spotted', null); this.raiseChoir(); } },
      { dur: 2.6, sub: ['Rook', 'You are not the thief. You are the key.'], enter: () => { g.sfx.hollowCry?.(P.pos); } },
    ];
    // in-eye camera: keep the player's view
    this.cs = { beats, i: -1, t: 0, done: () => this.chaos(), beat: null, fp: true }; g.ui.showHud(false);
    this.nextBeat();
  }
  chaos() {
    const g = this.g; g.mode = 'play'; g.ui.letterbox(false); g.ui.showHud(true); g.pix.veil = 0;
    this.objectives.find((o) => o.id === 'escape').done = false;
    const door = g.level.doors.find((d) => d.id === 'balcony_door'); if (door) { door.locked = false; door.open(13, 140); g.sfx.door?.(true); }
    g.ui.flashBanner('ESCAPE THROUGH THE BALCONY DOOR', 3400, true);
    g.setCheckpoint([8, 0.1, 139.6], 0);
  }
  raiseChoir() {
    const g = this.g, cx = 11, cz = 140;
    // the sigil on the floor lights up
    const k = new E.Kit(g.level.pal);
    k.add(g.level.pal.wax, E.torus({ radius: 3.4, tube: 0.06, radialSegments: 6, tubularSegments: 48 }), [cx, 0.05, cz], [90, 0, 0]);
    k.add(g.level.pal.wax, E.torus({ radius: 2.5, tube: 0.05, radialSegments: 6, tubularSegments: 40 }), [cx, 0.05, cz], [90, 0, 0]);
    const node = k.toNode('Sigil'); g.scene.add(node);
    const glow = new E.Light('point', { color: '#9a5cff', intensity: 26, range: 12, flicker: 0.4 }); glow.position.set([cx, 1.2, cz]); g.scene.add(glow); g.level.lights.push(glow);
    // the Hollow rise
    const spots = [[8.5, 138], [13.5, 138.5], [9, 142], [13, 143]];
    spots.forEach(([x, z], i) => setTimeout(() => this.spawnHollow(x, z, true), 600 + i * 500));
  }
  spawnHollow(x, z, rising = false, dormant = false) {
    const g = this.g;
    const n = new NPC(g, { id: 'hollow_' + (this.hollowSeq = (this.hollowSeq || 0) + 1), name: 'Hollow', role: 'hollow', hostile: true, pos: [x, z], yaw: 0, hp: 55, dmg: 1.05, block: 0, eyes: 0.9, weapon: null, detail: 0.4, schedule: [{ h0: 0, h1: 24, poi: 'shrine', act: 'stand' }],
      spec: { outfit: 'peasant', skin: 'ashen', hair: { style: 'bald' }, glowEyes: true, colors: { cloth: '#2a2630', hose: '#1c1a22', cloth2: '#221e28' }, hood: true, height: 1.06, build: 0.92, weapon: null, voice: 0.4 } });
    g.npcs.push(n); n.dormant = dormant;
    if (!dormant) { n.state = 'chase'; n.alert = 1; n.lastSeen = [...g.player.pos]; if (rising) { n.rising = 1.8; n.setAnim('Cower', 0.1); } }
    g.sfx.hollowCry?.(n.pos); g.emitBurst([x, 0.1, z], 'dust');
    return n;
  }
  startFinale() {
    const g = this.g; if (this.fin) return; this.fin = true;
    this.complete('escape'); g.mode = 'cutscene'; g.ui.letterbox(true); g.ui.showHud(false);
    const beats = [
      { dur: 3, fadeTo: 0.55, fadeRate: 2, sub: ['', 'Cold air. Stars. Behind you the bell of Ravenspire tolled thirteen, and the ground began to sing.'], cam: { p0: [13, 1.7, 148.6], p1: [13, 2.2, 149.4], l0: [13, 6, 140], l1: [13, 9, 140], fov: 66 }, enter: () => { g.sfx.hollowCry?.([13, 1, 140]); } },
      { dur: 3.6, sub: ['Rook', 'Sable knew. She sent me in to open it. She sent me to be the key.'], cam: { p0: [13, 1.7, 149.4], p1: [13, 6, 151], l0: [13, 9, 140], l1: [0, 20, 140], fov: 68 } },
      { dur: 3.2, sub: ['Rook', 'Then Sable and I have things to discuss.'], cam: { p0: [13, 6, 151], p1: [10, 14, 152], l0: [0, 20, 140], l1: [0, 26, 60], fov: 70 } },
      { dur: 3.4, title: ['TO BE CONTINUED', 'Chapter II · The Choir Beneath'], fadeTo: 1, fadeRate: 1.6, cam: { p0: [10, 14, 152], p1: [8, 18, 152], l0: [0, 26, 60], l1: [0, 30, 40], fov: 72 } },
    ];
    this.play(beats, () => this.showEnd());
  }
  showEnd() {
    const g = this.g, st = g.stats, P = g.player, mins = Math.round(this.playTime / 60);
    const unseen = st.kills === 0 && g.alarmCount === 0;
    let title = 'Blade in the Dark'; if (st.civKills > 0 || st.guardKills >= 8) title = 'Butcher of Ashgate'; else if (st.kills === 0) title = 'Ghost of Ashgate'; else if (st.guardKills <= 3) title = 'Quiet Knife';
    const dukeLine = this.flags.dukeKilled ? 'You killed the Duke' : this.dukeState === 'surrender' || this.dukeState === 'fled' ? 'You spared the Duke' : 'The Duke never woke';
    g.ui.showEnd(`<h2>CHAPTER I COMPLETE</h2><p style="color:var(--dim);font-size:20px;margin:0">${title}</p>
      <table>
        <tr><td>Time in Hollowmere</td><td>${mins} min</td></tr>
        <tr><td>Guards slain</td><td>${st.guardKills}</td></tr>
        <tr><td>Villagers slain</td><td>${st.civKills}</td></tr>
        <tr><td>Silent kills</td><td>${st.stabs}</td></tr>
        <tr><td>Torches snuffed</td><td>${st.snuffed}</td></tr>
        <tr><td>Containers opened</td><td>${st.opened}</td></tr>
        <tr><td>Loot value</td><td>${P.inv.lootValue} gp</td></tr>
        <tr><td>The Duke</td><td>${dukeLine}</td></tr>
        <tr><td>Deaths</td><td>${st.deaths}</td></tr>
      </table>
      <button class="go" style="justify-self:center" onclick="location.reload()">PLAY AGAIN</button>`);
    g.mode = 'end';
    void unseen;
  }
}
