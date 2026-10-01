// Social stealth. Being seen is no longer the same thing as being caught: what a guard does about
// you depends on what you are DOING (an offence), where you ARE (access), what you LOOK like
// (look.js) and what he has been TOLD. Offences are weighed each moment; when one builds up
// in a guard's mind he challenges you instead of drawing steel, and you can talk, bribe, show
// papers, comply, run or fight. A crowd hides you; a crowd of one does not.
import { GEAR } from './gear.js';

const hyp = Math.hypot;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
// where a drawn sword is a scandal
const CIVIL = new Set(['town', 'keep', 'fort', 'pell']);
// what a bribe or a smile can make a guard overlook
const MINOR = new Set(['hood', 'furtive', 'weapon', 'private', 'curfew', 'bloody']);
// what each excuse is worth to a uniform (how much of the offence it covers)
const EXCUSED = { restricted: 1, private: 1, curfew: 1, hood: 1, recognised: 0.5, weapon: 0.4 };

// what guards say and what you can answer, by reason
const TALK = {
  restricted: { open: ['Halt! This ground is closed. State your business.', 'You there. You have no business in this place.'], again: 'I will not ask a third time. Your business, or your back.', persuade: 'I took a wrong turning. I meant no harm.', deceive: 'The steward sent for me. I am to wait in the hall.', comply: 'I will go.', okP: 'Hm. Then go back the way you came, and quickly.', okD: 'The steward? He tells us nothing. Go on, then. Do not wander.', fee: 60, deadline: 6, ack: 'See that you do. You have a moment.' },
  weapon: { open: ['Put that blade away! This is no place for naked steel.', 'Sheathe your weapon. Now.'], again: 'I said sheathe it!', persuade: 'Easy, officer. It is only for the roads.', deceive: 'I am a licensed escort, hired by the caravan.', comply: 'My apologies. It is away.', okP: 'Hm. Keep it where I cannot see it.', okD: 'Escort, is it. Fine. Keep it sheathed in town.', fee: 15, deadline: 4, ack: 'Better. Keep it that way.' },
  curfew: { open: ['Curfew! What are you doing out at this hour?', 'You there. The streets are closed after the bell.'], again: 'Off the streets. I will not say it again.', persuade: 'My mother is ill. I am fetching the priest.', deceive: 'Watch business. The captain sent me.', comply: 'I will get off the street.', okP: 'Hurry, then. And keep to the lit streets.', okD: 'The captain sends everyone at all hours. Go on.', fee: 30, deadline: 9, ack: 'Then find a roof, and quickly.' },
  furtive: { open: ['You. What are you skulking about for?', 'Stand up. What are you up to?'], again: 'Stand up and tell me what you are doing.', persuade: 'I dropped my purse. I am only looking for it.', deceive: 'I am checking the drains for the steward.', comply: 'Sorry. Stretching my legs.', okP: 'A likely story. Look elsewhere.', okD: 'The drains. Hm. Do it standing up.', fee: 15, deadline: 6, ack: 'Then stand like a man.' },
  hood: { open: ['Hood down. Let me see your face.', 'You, in the cowl. Show your face.'], again: 'Hood. Down. Now.', persuade: 'Only keeping the damp off, officer.', deceive: 'A bad rash. The apothecary said to keep it covered.', comply: 'Of course.', okP: 'Keep your hood down in town, then.', okD: 'Rashes. Fine. Keep away from me.', fee: 8, deadline: 5, ack: 'Better.' },
  bloody: { open: ['Is that blood on you? Explain yourself.', 'You. You are stained red. Where from?'], again: 'Blood. Where from?', persuade: 'Butcher work, officer. I carry offal for the tannery.', deceive: 'A boar. I was hunting in the Mirewood.', comply: 'I will wash up.', okP: 'Wash before you walk the town, then.', okD: 'A boar. Fine. There is a well in the market.', fee: 40, deadline: 8, ack: 'Wash it off. Now.' },
  private: { open: ['What business have you in a private house?', 'You there. Whose door is that?'], again: 'Out of there. Now.', persuade: 'I knocked, but nobody answered. I was about to leave.', deceive: 'I carry a message for the householder.', comply: 'I will leave.', okP: 'Go, then. Do not make me find you here again.', okD: 'Leave it with me. Off you go.', fee: 20, deadline: 6, ack: 'Out. Now.' },
  recognised: { open: ['Hold still. You fit the description of a thief we are after.', 'Wait. I think I know who you are.'], again: 'Hold still, I said.', persuade: 'You have mistaken me for someone else, friend.', deceive: 'I am a wool merchant from Pellmouth. Ask anyone.', comply: null, okP: 'Hm. Perhaps. Mind yourself, merchant.', okD: 'Wool, is it? Fine. Off with you.', fee: 80, deadline: 4, ack: 'Do not move.' },
  lockdown: { open: ['Lockdown! Name and business. Quickly.', 'The town is sealed. Who are you?'], again: 'Your business. Now.', persuade: 'I was only visiting. Let me go home.', deceive: 'Watch reserve. I was told to report.', comply: 'I will get indoors.', okP: 'Then get indoors, and stay there.', okD: 'Reserve, eh. Find your sergeant.', fee: 50, deadline: 6, ack: 'Indoors. Now.' },
};

export class Social {
  constructor(g) {
    this.g = g; g.reg?.('social', this); g.markers?.push(this);
    this.off = []; this.t = 0; this.crowd = 0; this.crowdK = 0; this.vig = 0; this.att = new Map(); this.intel = new Set();
    this.label = null; this.recog = 0; this.quiet = true; this.wardT = 0; this.stats = { challenged: 0, talked: 0, bribed: 0, lied: 0 };
  }
  // ------------------------------------------------------------ where you are
  inTown(x, z) { return Math.abs(x) < 62 && z > 5 && z < 94; }
  // 0 open ground, 1 somebody's home, 2 restricted (the keep, the fort, a barracks), 3 forbidden
  access(x, z) {
    const nav = this.g.nav, zone = nav.zone[Math.max(0, nav.at(x, z))] || 0;
    if (x > 10 && x < 34 && z > -120 && z < -98) return zone >= 2 ? 3 : 2;   // Fort Greywatch: the yard, the barracks, and the gaol
    if (zone === 0) return 0;
    const keep = x > -35 && x < 35 && z > 94 && z < 152;
    if (zone >= 2) { if (!keep) return 3; return (x > -19 && x < 19 && z > 134 && z < 145) || (x < -22 && z < 112) ? 3 : 2; }
    return keep ? 2 : 1;
  }
  curfew() { const g = this.g; return g.clock.between(22, 5.5) || !!g.lockdown?.active; }
  // ------------------------------------------------------------ what you are doing
  refresh() {
    const g = this.g, P = g.player, L = g.look, x = P.pos[0], z = P.pos[2], T = L.traits();
    const acc = this.access(x, z), area = g.area(), civil = CIVIL.has(area) || (g.caravan && hyp(x - g.caravan.site0.x, z - g.caravan.site0.z) < 20);
    const town = this.inTown(x, z), indoors = g.nav.indoorAt(x, z) > 0;
    // townsfolk about you: a crowd hides you
    let crowd = 0; for (const n of g.npcs) if (!n.guard && !n.dead && n.role === 'villager' && n.state === 'routine' && !n.lying && Math.abs(n.x - x) < 6 && Math.abs(n.z - z) < 6) crowd++;
    this.crowd = crowd; this.crowdK = clamp((crowd - 2) / 3, 0, 1) * (P.mod?.crowd ?? 1);
    const off = [], add = (id, w, kind, reason) => off.push({ id, w, kind, reason });
    const lamp = g.lantern?.on;
    if (acc >= 3) add('forbidden', 1.25, 'hostile', 'Forbidden area');
    else if (acc === 2) add('restricted', 0.85, 'challenge', 'Restricted area');
    else if (acc === 1) add('private', 0.3, 'challenge', 'Trespassing');
    if (P.drawn && civil && !P.dead) { if (g.tools?.sap) add('weapon', 0.3, 'challenge', 'Carrying a cosh'); else add('weapon', 0.6, 'challenge', 'Drawn weapon'); }
    if ((P.crouch || P.prone) && civil && acc === 0 && P.speedNow < 3) add('furtive', 0.35, 'challenge', 'Skulking');
    if (this.curfew() && town && !indoors && acc < 2) add('curfew', g.lockdown?.active ? 0.9 : lamp ? 0.32 : 0.5, 'challenge', g.lockdown?.active ? 'Lockdown' : 'Out after curfew');
    if (T.hood && civil && (this.curfew() || acc >= 2)) add('hood', 0.22, 'challenge', 'Hooded');
    if (T.bloody && civil) add('bloody', 0.7, 'challenge', 'Blood on your clothes');
    if (g.tools?.dragging) add('body', 1.2, 'hostile', 'Dragging a body');
    if (P.picking && !P.picking.free && P.picking.game) add('lockpick', 0.95, 'hostile', 'Picking a lock');
    if (P.sprint && civil && P.speedNow > 4) add('running', 0.15, 'curious', 'Running');
    this.off = off; this.acc = acc; this.civil = civil; this.town = town;
    this.quiet = !off.some((o) => o.w >= 0.3);
  }
  // ------------------------------------------------------------ what one observer makes of it
  // returns { w, kind, reason, id }: how suspicious you are to THIS person right now
  assess(n, pd) {
    const g = this.g, P = g.player, L = g.look, vig = this.vig;
    // bandits, hollows, hunters and bosses want you whatever you wear
    if (n.role === 'bandit' || n.role === 'hollow' || n.faction === 'hunters' || n.def.boss) return { w: 1, kind: 'hostile', reason: 'Enemy', id: 'enemy' };
    const trust = (n.trustUntil || 0) > g.time, bribed = (n.bribedUntil || 0) > g.time, afraid = (n.afraidUntil || 0) > g.time;
    let w = 0, kind = null, reason = null, id = null;
    const dg = g.rep.disguise ? g.rep.disguiseGain(n, pd) : 1;
    for (const o of this.off) {
      let ow = o.w * (1 + 0.18 * vig);
      if (o.kind === 'challenge') { if (trust || afraid) continue; if (bribed && MINOR.has(o.id)) continue; }
      if (o.kind === 'curious' && (trust || bribed)) continue;
      const ex = EXCUSED[o.id]; if (ex !== undefined && g.rep.disguise) ow *= 1 - ex * (1 - dg);   // a convincing uniform covers some offences
      if (o.id === 'weapon' && g.rep.disguise && (g.rep.disguise.kind === 'watch' || g.rep.disguise.kind === 'keep')) ow *= 0.4;
      if (ow > w) { w = ow; kind = o.kind; reason = o.reason; id = o.id; }
    }
    // recognition is personal: does what he sees fit what he has been told?
    const m = L.match(n, pd);
    if (m > 0.2) {
      const near = clamp(1.2 - pd / 18, 0.15, 1), rw = Math.pow(m, 1.1) * near * (1 + 0.15 * vig);
      const bounty = Math.max(g.rep.total('watch'), g.rep.total('keep')), hot = bounty >= 150 || g.alarmLevel >= 1;   // a small price on your head is a conversation; a big one is a fight
      if (rw > w) { w = rw; kind = hot && m > 0.6 && !trust ? 'hostile' : 'challenge'; reason = m > 0.75 ? 'You match the description' : 'You look like someone they want'; id = 'recognised'; if (trust && kind === 'challenge') { w = 0; kind = null; } }
    }
    // the town is on edge after a scare: restricted ground and curfew stop being polite
    if (kind === 'challenge' && (g.alarmLevel >= 1.5 || vig >= 2.4) && (id === 'restricted' || id === 'curfew' || id === 'weapon')) kind = 'hostile';
    // a crowd hides the small stuff
    if (kind && kind !== 'hostile') w *= 1 - 0.45 * this.crowdK;
    return { w, kind, reason, id };
  }
  // ------------------------------------------------------------ challenges
  startChallenge(n, a) {
    const g = this.g; if (n.state === 'chase' || n.state === 'attack' || n.state === 'challenge' || n.state === 'stagger' || n.dead) return;
    const T = TALK[a.id] || TALK.restricted;
    if (n.lying || n.seated) n.leaveActivity?.();
    n.state = 'challenge'; n.stopMove(); n.alert = Math.max(n.alert, 0.6); n.chFails = n.chFails || 0;
    n.chal = { reason: a.id in TALK ? a.id : 'restricted', text: a.reason, t: 0, said: false, since: 0, stage: 0, deadline: T.deadline * (g.alarmLevel > 0.5 ? 0.7 : 1), fails: 0, used: new Set(), opened: false };
    if (!this.tip1) { this.tip1 = true; g.toast('A guard wants a word. E answers: persuade, deceive, bribe, comply, or fight. Running makes it worse.'); }
    g.sfx.sting?.('challenge'); g.stealth.detectedNow(); this.stats.challenged++; g.stats.challenged = (g.stats.challenged || 0) + 1;
    this.incident(0.08);
  }
  stillOffending(n, C) {
    const g = this.g, P = g.player, L = g.look, T = L.traits(), acc = this.access(P.pos[0], P.pos[2]);
    switch (C.reason) {
      case 'weapon': return !!P.drawn;
      case 'hood': return T.hood;
      case 'furtive': return !!(P.crouch || P.prone);
      case 'bloody': return L.bloody > 0;
      case 'curfew': case 'lockdown': return this.curfew() && this.inTown(P.pos[0], P.pos[2]) && g.nav.indoorAt(P.pos[0], P.pos[2]) === 0;
      case 'private': return acc === 1;
      case 'recognised': return L.match(n, n.dist) > 0.28;
      default: { if (acc < 2) return false; if (g.rep.disguise) { const dg = g.rep.disguiseGain(n, n.dist); return dg > 0.5; } return true; }
    }
  }
  resolve(n, how, secs = 120) {
    const g = this.g, C = n.chal, reason = C?.reason; n.chal = null;
    // word passes among guards in earshot: if one has cleared you of trespass or curfew, the rest take his word
    if (how === 'persuaded' && ['restricted', 'curfew', 'lockdown', 'private'].includes(reason)) {
      for (const o of g.npcs) {
        if (o === n || !o.guard || o.dead || o.role === 'bandit' || o.faction === 'hunters' || hyp(o.x - n.x, o.z - n.z) > 14 || o.state === 'chase' || o.state === 'attack') continue;
        o.trustUntil = Math.max(o.trustUntil || 0, g.time + secs * 0.8);
        if (o.state === 'challenge' && o.chal?.reason === reason) { o.chal = null; o.state = 'routine'; o.slotKey = ''; o.alert = 0.1; o.stopMove(); o.bark('If he is cleared, he is cleared.'); }
      }
    }
    n.state = 'routine'; n.slotKey = ''; n.alert = 0.1; n.anim = ''; n.stopMove(); n.trustUntil = g.time + secs;
    if (how === 'bribed') n.bribedUntil = g.time + 300;
    g.sfx.sting?.('cleared');
    if (how === 'complied') { n.bark(pick(['Good. Keep it that way.', 'Better. Move along.', 'See that you do.'])); g.progress.addXp(3, ''); }
    else g.progress.addXp(how === 'bribed' ? 6 : 14, 'talked your way out');
  }
  hostile(n, why = null) {
    const g = this.g; n.chal = null; this.incident(0.25); if (why) n.bark(why);
    n.lastSeen = [...g.player.pos]; n.spotted();
  }
  tickChallenge(n, dt) {
    const g = this.g, P = g.player, C = n.chal; if (!C) { n.state = 'routine'; n.slotKey = ''; return; }
    const dx = P.pos[0] - n.x, dz = P.pos[2] - n.z, d = hyp(dx, dz), T = TALK[C.reason] || TALK.restricted;
    if (g.mode === 'talk') { n.setLoco(0); n.speed = 0; n.face(P.pos[0], P.pos[2], 8, dt); return; }   // the talk stops the clock
    if (g.mode !== 'play' || P.dead) return;
    C.t += dt;
    if (!this.stillOffending(n, C)) { if (C.said) return this.resolve(n, 'complied', 100); n.chal = null; n.state = 'routine'; n.slotKey = ''; return; }
    const reach = n.ranged ? 14 : 3.0;
    if (d > reach) {
      n.repathT -= dt; if (!n.path || n.repathT <= 0) { n.repathT = 0.6; const q = g.nav.nearestWalkable(P.pos[0], P.pos[2], 3); if (q) n.goTo(q[0], q[1], d > 9 ? 3.4 : 2.2); }
      if (n.path) n.stepPath(dt); n.setLoco(n.speed);
      if (d < 18) n.face(P.pos[0], P.pos[2], 3, dt);
    } else {
      n.stopMove(); n.speed *= 0.8; n.setLoco(0); n.face(P.pos[0], P.pos[2], 8, dt);
      if (!C.said) {
        C.said = true; C.since = 0; n.bark(pick(T.open)); n.ch.upper.playOnce(C.reason === 'restricted' ? 'Point' : 'Talk', { fadeIn: 0.2, fadeOut: 0.6 }); g.sfx.whisper && 0;
        if (g.combatT <= 0 && g.opts?.v.autoAnswer !== false && !n.ranged) setTimeout(() => { if (g.mode === 'play' && n.state === 'challenge' && !n.dead) this.answer(n); }, 650);
      }
    }
    if (!C.said && C.t > 8) { C.said = true; C.since = 0; n.bark(pick(T.open)); }   // cannot get to you: he shouts it from where he stands
    if (C.said) {
      C.since += dt;
      if (C.since > C.deadline) {
        if (C.stage === 0) { C.stage = 1; C.since = 0; C.deadline = Math.max(3, T.deadline * 0.7); n.bark(T.again); n.ch.upper.playOnce('Point', { fadeIn: 0.15, fadeOut: 0.5 }); }
        else return this.hostile(n, pick(['That is enough!', 'Seize him!', 'You had your chance!']));
      }
    }
    // running away is an answer too
    if (d > 20 || (C.said && P.sprint && d > 5 && d < 30)) this.hostile(n, 'Stop! Stop that man!');
  }
  // ------------------------------------------------------------ the answer
  answer(n) {
    const g = this.g; if (!n.chal || n.state !== 'challenge' || g.mode !== 'play') return;
    n.chal.opened = true; n.face(g.player.pos[0], g.player.pos[2], 20, 0.1);
    g.ui.dialogue({ npc: n, lines: [this.menu(n, null)] });
  }
  // the guard's line and what you can say back, built fresh every time so used options drop away
  menu(n, text) {
    const C = n.chal, T = TALK[C.reason] || TALK.restricted;
    return { text: text || (C.stage ? T.again : T.open[0]), mood: 'anger', choices: this.options(n) };
  }
  options(n) {
    const g = this.g, P = g.player, S = g.speech, C = n.chal, T = TALK[C.reason] || TALK.restricted, used = C.used, out = [];
    const fail = (kind, r) => {
      if (!n.chal) return { text: '...', end: true };
      C.fails++; n.chFails = (n.chFails || 0) + 1; used.add(kind); this.bump(n, -4); this.incident(0.1);
      if (r.crit || C.fails >= 2) { this.hostile(n); return { text: pick(['Liar! Seize him!', 'I have heard enough. To arms!', 'You will not make a fool of me!']), end: true, mood: 'anger' }; }
      C.deadline = Math.min(C.deadline, C.since + 6);
      return this.menu(n, pick(['That does not sound right.', 'Do you take me for a fool?', 'I am not convinced.']));
    };
    const win = (how, text, secs = 150) => { this.resolve(n, how, secs); this.bump(n, 3); return { text, end: true }; };
    // 1. papers
    const hasSeal = P.inv.has('ducalseal') && (C.reason === 'restricted' || C.reason === 'private');
    if ((P.inv.has('papers') || hasSeal) && C.reason !== 'recognised') {
      const item = hasSeal ? 'ducalseal' : 'papers';
      out.push(S.choice('papers', n, hasSeal ? 'Show the ducal seal.' : 'Show my travel papers.', { extra: hasSeal ? 0.12 : 0, ok: () => { if (P.inv.remove(item, 1)) g.toast(`The ${hasSeal ? 'seal' : 'papers'} pass inspection (and are kept)`); this.stats.lied++; return win('persuaded', hasSeal ? 'That is the Duke\'s seal. Forgive me, go about your business.' : 'Papers in order. Move along, then.', 360); }, fail: (r) => { if (P.inv.remove(item, 1)) g.toast('The guard tears the forgery in two'); return fail('papers', { ...r, crit: true }); } }));
    }
    // 2. persuade, 3. deceive
    if (!used.has('persuade')) out.push(S.choice('persuade', n, T.persuade, { extra: C.reason === 'recognised' ? -0.08 : 0.02, ok: () => win('persuaded', T.okP, 150), fail: (r) => fail('persuade', r) }));
    if (!used.has('deceive')) out.push(S.choice('deceive', n, T.deceive, { extra: C.reason === 'recognised' ? -0.1 : 0.04, ok: () => { this.stats.lied++; return win('persuaded', T.okD, 260); }, fail: (r) => fail('deceive', r) }));
    // 4. bribe
    const cost = this.bribeCost(n, C.reason);
    if (!used.has('bribe')) out.push(S.choice('bribe', n, 'Offer a little something for their trouble.', { gold: cost, when: () => P.inv.gold >= cost, extra: -0.02 * (n.faction === 'keep' ? 3 : 0), ok: () => { P.inv.gold -= cost; this.stats.bribed++; g.stats.bribed = (g.stats.bribed || 0) + 1; g.sfx.coin?.(); return win('bribed', pick(['I saw nothing. Hm. Perhaps the light is poor.', 'You were never here.']), 300); }, fail: (r) => { used.add('bribe'); if (r.crit) { this.hostile(n); return { text: 'Are you trying to bribe an officer of the law? Seize him!', end: true, mood: 'anger' }; } C.fails++; n.chFails = (n.chFails || 0) + 1; return this.menu(n, 'Keep your coins. I have not decided about you yet.'); } }));
    // 5. intimidate
    if (!used.has('intimidate') && (P.drawn || (P.mod?.presence || 0) > 0)) out.push(S.choice('intimidate', n, 'Step aside, friend. You do not want this trouble.', { ok: () => { n.afraidUntil = g.time + 300; this.bump(n, -12); g.rep.add(n.faction === 'keep' ? 'keep' : 'watch', 14, 'threatened a guard'); this.incident(0.35); this.resolve(n, 'persuaded', 300); n.bark('Y-yes. Of course. Go on, then.'); return { text: 'Yes. Of course. Go on.', end: true }; }, fail: (r) => { if (r.crit || C.fails >= 1) { this.hostile(n); return { text: 'Threatening a guard! Seize him!', end: true, mood: 'anger' }; } used.add('intimidate'); C.fails++; return this.menu(n, 'Do not threaten me, thief.'); } }));
    // 6. pay the fine (when they think they know you)
    if (C.reason === 'recognised') { const owe = Math.ceil(g.rep.total(n.faction === 'keep' ? 'keep' : 'watch') || 40); out.push({ text: `Pay the fine. (${owe} gold)`, when: () => P.inv.gold >= owe && g.rep.total(n.faction) > 0, next: () => { const r = g.rep.pay(n.faction === 'keep' ? 'keep' : 'watch'); g.look.forget(n.faction); this.resolve(n, 'persuaded', 600); return { text: 'Paid in full. Your name is cleared. Move along.', end: true }; } }); }
    // 7. comply (when there is something to stop doing)
    if (T.comply) out.push({ text: T.comply, next: () => this.comply(n, T) });
    // 8. fight or run
    out.push({ text: 'Draw steel.', next: () => { this.hostile(n, 'To arms!'); if (!P.drawn) P.draw(); return 'end'; } });
    out.push({ text: '(Say nothing.)', next: 'end' });
    return out;
  }
  comply(n, T) {
    const g = this.g, P = g.player, C = n.chal; if (!C) return 'end';
    C.since = 0; C.deadline = Math.max(C.deadline, 9); C.stage = Math.max(C.stage, 0); n.bark(T.ack);
    // put it right at once where you can
    if (C.reason === 'weapon') P.sheathe();
    else if (C.reason === 'hood' && g.look.traits().hood) g.look.toggleHood();
    else if ((C.reason === 'furtive') && (P.crouch || P.prone)) P.setStance?.('stand');
    return { text: T.ack, end: true };
  }
  bribeCost(n, reason) {
    const g = this.g, T = TALK[reason] || TALK.restricted, m = g.player.mod || {};
    let c = T.fee; if (reason === 'recognised') c = Math.max(40, Math.round(g.rep.total(n.faction === 'keep' ? 'keep' : 'watch') * 0.9));
    c *= n.role === 'captain' ? 2.5 : n.faction === 'keep' ? 1.4 : 1; c *= 1 + 0.2 * this.vig; c *= 1 - Math.min(0.5, m.haggle || 0);
    return Math.max(5, Math.round(c));
  }
  // ------------------------------------------------------------ the rest of the talking
  // guards you talk to can be paid, or asked things
  decorate(npc, lines) {
    const g = this.g;
    if (!npc.guard || !['guard', 'captain'].includes(npc.role) || npc.state !== 'routine' || npc.faction === 'hunters') return lines;
    const S = g.speech, P = g.player, shift = (L) => ({ ...L, goto: typeof L.goto === 'number' ? L.goto + 1 : L.goto, choices: L.choices?.map((c) => ({ ...c, next: typeof c.next === 'number' ? c.next + 1 : c.next })) });
    const fee = Math.max(10, Math.round(35 * (npc.role === 'captain' ? 2.5 : npc.faction === 'keep' ? 1.4 : 1) * (1 + 0.2 * this.vig) * (1 - Math.min(0.5, P.mod?.haggle || 0))));
    const bribed = (npc.bribedUntil || 0) > g.time;
    const menu = { text: npc.role === 'captain' ? `${npc.name} looks you over. "Well?"` : `${npc.name} nods. "Something?"`, choices: [
      { text: 'Talk.', next: 1 },
      S.choice('bribe', npc, 'Press a coin into his hand and ask him to look the other way for a while.', { gold: fee, when: () => !bribed && P.inv.gold >= fee, extra: npc.role === 'captain' ? -0.25 : 0, ok: () => { P.inv.gold -= fee; npc.bribedUntil = g.time + 300; this.bump(npc, 6); this.stats.bribed++; g.stats.bribed = (g.stats.bribed || 0) + 1; g.sfx.coin?.(); g.toast('He pockets it. For a few minutes he will not see small things.'); return { text: pick(['Hm. My eyes are not what they were.', 'I have not seen you.']), end: true }; }, fail: (r) => { this.bump(npc, -8); if (r.crit) { npc.alert = Math.max(npc.alert, 0.9); this.vig = Math.min(3, this.vig + 0.3); return { text: 'Are you trying to buy me? Get out of my sight before I call the captain.', end: true, mood: 'anger' }; } return { text: 'Put your money away.', end: true, mood: 'anger' }; } }),
      S.choice('persuade', npc, 'Ask, casually, how the patrols run around here.', { when: () => !this.intelAsked(npc), ok: () => { npc.asked = true; this.revealPatrols(npc); return { text: pick(['Walk the beat, same as ever. Nobody tells us anything, mind.', 'Mostly the same loop. If you did not hear it from me.']), end: true }; }, fail: () => { npc.asked = true; this.bump(npc, -5); npc.alert = Math.max(npc.alert, 0.35); return { text: 'Why would you want to know a thing like that?', end: true, mood: 'anger' }; } }),
      { text: 'Never mind.', next: 'end' },
    ] };
    return [menu, ...lines.map(shift)];
  }
  intelAsked(n) { return !!n.asked; }
  revealPatrols(n) {
    const g = this.g, P = g.player; let k = 0;
    for (const o of g.npcs) if (o.guard && !o.dead && o.faction !== 'bandits' && o.role !== 'hollow' && hyp(o.x - P.pos[0], o.z - P.pos[2]) < 70) for (const s of o.schedule) if (s.route && !this.intel.has(s.route) && g.level.routes[s.route]) { this.intel.add(s.route); k++; }
    g.toast(k ? `${k} patrol route${k > 1 ? 's' : ''} marked on your map` : 'He has nothing new to tell you'); if (k) g.progress.addXp(10 + k * 2, 'learned the patrols'); g.stats.intel = (g.stats.intel || 0) + k;
  }
  // the person running for a guard to tell what they saw: catch them first
  witnessTalk(n) {
    const g = this.g, P = g.player, S = g.speech, w = n.witness; if (!w || n.state !== 'report') return;
    const fee = Math.max(10, Math.round(w.sev * 0.6 * (1 - Math.min(0.5, P.mod?.haggle || 0)))), calm = () => { n.state = 'routine'; n.slotKey = ''; n.witness = null; n.witnessDesc = null; n.stopMove(); };
    const hush = (text) => { calm(); this.bump(n, 2); g.stats.hushed = (g.stats.hushed || 0) + 1; return { text, end: true }; };
    g.ui.dialogue({ npc: n, lines: [{ text: 'Let go of me! I have to tell the guards what I saw!', mood: 'fear', choices: [
      S.choice('bribe', n, 'You saw nothing. Here.', { gold: fee, when: () => P.inv.gold >= fee, ok: () => { P.inv.gold -= fee; g.sfx.coin?.(); return hush('I... saw nothing. Nothing at all.'); }, fail: () => { this.bump(n, -6); return { text: 'No! Let me go!', end: true, mood: 'fear' }; } }),
      S.choice('persuade', n, 'It was nothing. Think of the trouble you will cause for yourself.', { ok: () => hush('Maybe... maybe I was mistaken.'), fail: () => ({ text: 'I know what I saw!', end: true, mood: 'anger' }) }),
      S.choice('intimidate', n, 'Say a word, and you will not see the morning.', { ok: () => { n.afraidUntil = g.time + 400; this.bump(n, -20); g.rep.add('watch', 10, 'threatened a witness'); return hush('I... I will say nothing! Please!'); }, fail: () => { this.hostileWitness(n); return { text: 'Help! He is threatening me!', end: true, mood: 'fear' }; } }),
      { text: 'Let them go.', next: 'end' },
    ] }] });
  }
  hostileWitness(n) { n.scare?.(this.g.player.pos, 12); this.incident(0.2); }
  // ------------------------------------------------------------ attitudes
  attOf(n) {
    if (!n) return 0; if (this.att.has(n.id)) return this.att.get(n.id);
    let h = 0; for (let i = 0; i < n.id.length; i++) h = (h * 31 + n.id.charCodeAt(i)) | 0;
    const base = n.role === 'captain' ? -10 : n.role === 'bandit' ? -40 : n.role === 'noble' ? -5 : n.guard ? 0 : 8;
    return base + (h % 17) - 8;
  }
  bump(n, v) { if (!n) return; this.att.set(n.id, clamp(this.attOf(n) + v, -100, 100)); }
  // ------------------------------------------------------------ the town's nerves
  incident(v) { this.vig = clamp(this.vig + v, 0, 3); }
  // ------------------------------------------------------------ people watching a drawn sword
  watchBlades(dt) {
    const g = this.g, P = g.player; if (!P.drawn || !this.civil || P.dead) return;
    for (const n of g.npcs) {
      if (n.guard || n.dead || n.role !== 'villager' || n.state !== 'routine' || n.lying || n.dist > 9) continue;
      if ((n.warnT || 0) > g.time) continue;
      const dx = P.pos[0] - n.x, dz = P.pos[2] - n.z, c = (dx * n.fwd[0] + dz * n.fwd[1]) / (n.dist || 1);
      if (c < 0.2 || !g.canSee(n.eye, [P.pos[0], P.pos[1] + 1.4, P.pos[2]], n.body)) continue;
      n.warnT = g.time + 22; n.warned = (n.warned || 0) + 1;
      n.bark(pick(['Put that away!', 'Gods! A sword!', 'What do you want with that?', 'Easy, easy!']), n.spec.voice); n.ch.upper.playOnce('Flinch', { fadeIn: 0.1, fadeOut: 0.4 });
      if (n.warned >= 3 || n.dist < 3.5) { n.witness = { kind: 'brandish', sev: 6, faction: 'watch' }; n.witnessDesc = g.look.snapshot(n, n.dist); n.state = 'report'; n.reportT = 22; n.path = null; n.goal = null; n.repathT = 0; n.bark('Guards! A man with a blade!', n.spec.voice); }
    }
  }
  sawWeapon() {}
  // ---- townsfolk treat a person who behaves like a person: they nod, and they remember you kindly
  greet() {
    const g = this.g, P = g.player; if (!this.quiet || P.drawn || g.look.bloody > 0 || this.acc > 0 || (g.time - (this.greetAt || -99)) < 7 || P.dead) return;
    const h = g.clock.hours;
    for (const n of g.npcs) {
      if (n.guard || n.dead || n.role !== 'villager' || n.state !== 'routine' || n.lying || n.seated || n.dist > 3.6 || (n.greetedUntil || 0) > g.time) continue;
      const dx = P.pos[0] - n.x, dz = P.pos[2] - n.z, c = (dx * n.fwd[0] + dz * n.fwd[1]) / (n.dist || 1);
      if (c < 0.4 || this.attOf(n) < -5) continue;
      n.greetedUntil = g.time + 90; this.greetAt = g.time; this.bump(n, 0.5);
      n.bark(h < 11 ? pick(['Morning to you.', 'Good morning, traveller.']) : h < 18 ? pick(['Afternoon.', 'Fine day, is it not?', 'Safe travels.']) : h < 22 ? pick(['Evening to you.', 'Mind the dark, friend.']) : pick(['Late to be out.', 'Quiet night.']), n.spec.voice);
      break;
    }
  }
  // ---- a guard who is not where he should be is noticed, after a while
  checkMissing() {
    const g = this.g;
    for (const n of g.npcs) {
      if (!n.guard || n.role === 'bandit' || n.role === 'hollow' || n.faction === 'hunters' || n.def.boss) continue;
      const down = n.dead || n.state === 'ko';
      if (!down) { n.downAt = 0; n.missingChecked = false; continue; }
      if (n.discovered || n.missingChecked) continue;
      if (!n.downAt) n.downAt = g.time;
      if (g.time - n.downAt < 95) continue;
      n.missingChecked = true;
      const post = n.slot?.poi && g.level.pois[n.slot.poi] ? [g.level.pois[n.slot.poi].x, g.level.pois[n.slot.poi].z] : n.spawn ? [n.spawn.x, n.spawn.z] : [n.x, n.z];
      let best = null, bd = 1e9; for (const o of g.npcs) if (o.guard && !o.dead && o !== n && o.state === 'routine' && o.faction === n.faction && o.role !== 'bandit') { const d = hyp(o.x - post[0], o.z - post[1]); if (d < 60 && d < bd) { bd = d; best = o; } }
      if (best) { best.bark(`${n.name} is not at his post...`); best.alert = Math.max(best.alert, 0.5); best.stim = [post[0], post[1]]; best.stimKind = 'missing'; best.state = 'investigate'; best.investT = 25; best.stopMove(); best.goTo(post[0], post[1], 2.2); g.stats.missingNoticed = (g.stats.missingNoticed || 0) + 1; }
    }
  }
  // ---- a drink that has been spiked takes its time
  checkSpiked() {
    const g = this.g;
    for (const n of g.npcs) if (n.spikeAt && !n.dead && g.time >= n.spikeAt) { n.spikeAt = 0; n.poison = 26 * (g.player.mod?.poison || 1); n.bark('Ugh... my stomach...'); }
  }
  // ------------------------------------------------------------ frame
  update(dt) {
    const g = this.g; if (!g.player?.pos) return;
    this.vig = Math.max(0, this.vig - dt * (g.alarmLevel > 0.3 ? 0.004 : 0.012));
    this.t -= dt; if (this.t > 0) return; this.t = 0.2;
    this.refresh(); this.watchBlades(0.2);
    this.slowT = (this.slowT || 0) - 0.2; if (this.slowT <= 0) { this.slowT = 1.5; this.greet(); this.checkSpiked(); this.checkMissing(); }
    // how well do the guards you can see know you?
    let rec = 0; for (const n of g.stealth.seenNow || []) { if (n.dead || !n.guard) continue; const m = g.look.match(n, n.dist); if (m > rec) rec = m; }
    this.recog = rec;
  }
  // ------------------------------------------------------------ the HUD pill and the Stealth tab
  status(force = false) {
    const g = this.g, P = g.player; if ((g.mode !== 'play' && !force) || P.dead) return null;
    { const c = g.npcs.find((n) => n.state === 'challenge' && n.chal?.said && n.dist < (n.ranged ? 16 : 8) && !n.dead); if (c) return [`Challenged · E answers · ${Math.max(0, Math.ceil(c.chal.deadline - c.chal.since))}s`, 'bad']; }
    if (this.recog > 0.35) return ['Being recognised', 'bad'];
    const top = this.off.filter((o) => o.kind !== 'curious').sort((a, b) => b.w - a.w)[0];
    if (top) { const hint = { weapon: ' · Y sheathes', hood: ' · O lowers it', bloody: ' · wash at a well', curfew: ' · find shelter', furtive: ' · stand up', restricted: ' · leave or blend', forbidden: ' · hide!', private: ' · slip out' }[top.id] || ''; return [top.reason + hint, top.kind === 'hostile' ? 'bad' : 'warm']; }
    if (this.crowdK > 0.3) return ['Lost in the crowd', 'good'];
    if (this.civil && this.acc === 0 && !this.off.length) return ['Blending in', 'good'];
    return null;
  }
  vigLabel() { const v = this.vig; return v < 0.25 ? 'Calm' : v < 1 ? 'Watchful' : v < 2 ? 'On edge' : 'On high alert'; }
  marks() { return [...this.intel].map((r) => { const R = this.g.level.routes[r]; return R ? { shape: 'route', pts: R.pts, loop: R.loop } : null; }).filter(Boolean); }
  save() { return { vig: this.vig, att: [...this.att], intel: [...this.intel], stats: this.stats }; }
  load(d) { if (!d) return; this.vig = d.vig || 0; this.att = new Map(d.att || []); this.intel = new Set(d.intel || []); Object.assign(this.stats, d.stats || {}); }
}
export { TALK };
