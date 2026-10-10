// The comms director: decides which voice lines actually get spoken so the team sounds like five
// people instead of a siren. One shared budget, callouts that carry information (which hero, where,
// ultimate status), acknowledgements of the player's orders, thanks for heals, compliments on
// streaks, pre-match banter between teammates, rival taunts. Everything goes through voice.say.
import { HERO } from './heroes.js';

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const ACK = {
  push: ['Pushing!', 'Right behind you!', 'Moving up!'], group: ['On my way!', 'Coming to you!', 'Grouping up!'], fallback: ['Falling back!', 'Pulling out!', 'Backing off!'],
  defend: ['Holding here!', 'I will hold!', 'Locked down!'], help: ['Coming to you!', 'Healing incoming!', 'Hang on!'], ultReady: ['I will follow your ult!', 'Ready to combo!', 'Say when!'],
  thanks: ['Anytime!', 'You got it!', 'No problem!'], hello: ['Hey!', 'Hello!', 'Ready!'],
};
// two-line exchanges during setup. Specific pairs first, then generic ones by role
const PAIRS = [
  ['sion', 'bulwark', 'Stand behind my shield, corpse.', 'I stand behind no one.'],
  ['sion', 'halo', 'Do not bother healing me. I do not stay dead.', 'I will heal you anyway. It is my job.'],
  ['flicker', 'riftwalker', 'Race you to the point, love!', 'I will already be there. I made a door.'],
  ['vesper', 'ricochet', 'One shot. That is all I need.', 'One shot, three walls. Watch.'],
  ['mauler', 'wrecker', 'Bet I flatten more of them than you.', 'You are on. Loser buys the scrap.'],
  ['cinder', 'thorn', 'Keep your garden away from my fire.', 'Keep your fire away from my garden!'],
  ['stormcaller', 'zephyr', 'Feel the static in the air?', 'That is just my bass, babe.'],
  ['lantern', 'shade', 'Nothing hides from my light.', 'I will stay out of your way, then.'],
  ['bastille', 'orbit', 'I hold, you pull. Simple.', 'Gravity agrees with your plan.'],
  ['serene', 'halo', 'You take the front line, I will take the sleepy ones.', 'Deal. Nobody dies today.'],
  ['trapper', 'skyhawk', 'You see them from up there, I catch them down here.', 'Copy that. Eyes in the sky.'],
  ['mirage', 'shade', 'Two ghosts on one team? They will never know.', 'They never do.'],
  ['ranger', 'sabre', 'Reckon you can keep up, soldier?', 'Just do not hog all the headshots.'],
  ['cantor', 'siphon', 'Balance in all things.', 'Everything has a price. I collect it.'],
  ['pylon', 'bastille', 'I can bolt a turret on that cannon of yours.', 'Do not touch the cannon.'],
];
const ROLE_PAIRS = {
  'tank|support': [['Keep me standing and I will keep them off you.', 'Deal. Just do not run off alone.'], ['I am going in first.', 'I will be right behind you.']],
  'damage|support': [['Stay close, I will clear the way.', 'And I will clear your wounds.'], ['Heal me and I will carry.', 'Heal you, yes. Carry, we will see.']],
  'damage|tank': [['Make space, I will make picks.', 'Space incoming.'], ['You take the hits, I take the kills.', 'That is how it usually goes.']],
  'damage|damage': [['Split the flanks?', 'You go left, I go right.'], ['Most eliminations buys dinner.', 'Hope you are hungry.']],
  'support|support': [['You take the tank, I take the rest?', 'Sounds good. Call your cooldowns.'], ['Nobody dies on our watch.', 'Not a single one.']],
};

export class Comms {
  constructor(voice, hud) { this.voice = voice; this.hud = hud; this.level = 'all'; this.reset(null); }
  reset(sim) { this.sim = sim; this.lastT = -99; this.spotted = new Map(); this.healGiven = new Map(); this.cool = new Map(); this.banterAt = 3 + Math.random() * 3; this.banterDone = false; this.killedBy = new Map(); this.queue = []; }
  now() { return this.sim ? this.sim.time : 0; }
  mates() { const s = this.sim; return s ? s.units.filter((u) => u.alive && !u.deploy && !u.isPlayer && u.team === s.playerTeam && s.modeId !== 'ffa' && s.modeId !== 'training') : []; }
  // say something in a unit's voice if the budget allows. pri 3 always goes through
  say(u, text, { pri = 1, cd = null, cdT = 8, ally = true } = {}) {
    if (!u || !text || this.level === 'off') return false;
    if (this.level === 'important' && pri < 2) return false;
    const t = this.now();
    if (pri < 3 && t - this.lastT < (pri >= 2 ? 1.8 : 3)) return false;
    if (cd && t - (this.cool.get(cd) ?? -99) < cdT) return false;
    if (cd) this.cool.set(cd, t); this.lastT = t;
    this.voice.say(u.hero, text, { pri, name: u.isPlayer ? 'YOU' : u.name.toUpperCase(), team: u.team, ally, force: true, key: 'cm' + u.id });
    return true;
  }
  later(delay, fn) { this.queue.push({ t: this.now() + delay, fn }); }
  tick(dt) {
    const s = this.sim; if (!s) return;
    const t = this.now();
    for (let i = this.queue.length - 1; i >= 0; i--) if (t >= this.queue[i].t) { const q = this.queue.splice(i, 1)[0]; q.fn(); }
    // a little banter while the team assembles
    if (s.state === 'setup' && !this.banterDone && t > this.banterAt) { this.banterDone = true; this.banter(); }
    for (const [id, h] of this.healGiven) if (t - h.t > 6) this.healGiven.delete(id);
  }
  banter() {
    const m = this.mates(); if (m.length < 2) return;
    let a = null, b = null, lines = null;
    for (const [x, y, l1, l2] of PAIRS) { const ua = m.find((u) => u.hero === x), ub = m.find((u) => u.hero === y); if (ua && ub) { a = ua; b = ub; lines = [l1, l2]; break; } }
    if (!lines) { a = pick(m); b = pick(m.filter((u) => u !== a)); const key = [a.def.role, b.def.role].sort().join('|'); const opts = ROLE_PAIRS[key]; if (!opts) return; lines = pick(opts); if ([a.def.role, b.def.role].sort()[0] !== a.def.role) [a, b] = [b, a]; }
    this.say(a, lines[0], { pri: 2 }); this.later(2.6, () => this.say(b, lines[1], { pri: 2 }));
  }
  // the player issued an order through the comm wheel: someone answers
  playerCall(id) {
    const m = this.mates(); if (!m.length || !ACK[id]) return;
    let who = pick(m); if (id === 'help') who = m.find((u) => u.def.role === 'support') || who;
    this.later(0.7 + Math.random() * 0.5, () => this.say(who, pick(ACK[id]), { pri: 2, cd: 'ack', cdT: 2 }));
  }
  onEvent(e) {
    const s = this.sim; if (!s) return;
    const me = s.player, vt = s.playerTeam;
    switch (e.type) {
      case 'callout': {
        const u = e.unit; if (!u || e.id === 'ultUsed') return;
        if (u.team !== vt && s.modeId !== 'ffa') return;
        if (u.isPlayer) { this.say(u, this.voice.pickCall(u.hero, e.id), { pri: 3 }); return; }
        if (e.id === 'enemy' && e.target && e.target.def) {
          const T = e.target, n = T.def.name.charAt(0) + T.def.name.slice(1).toLowerCase(), t = this.now();
          if (t - (this.spotted.get(T.id) ?? -99) < 10) return; this.spotted.set(T.id, t);
          const ultUp = T.ult >= T.def.ult.cost - 1;
          const text = ultUp ? pick([`${n} has ultimate!`, `Careful, ${n} has ult!`]) : T.pos[1] > 2.5 ? pick([`${n} on high ground!`, `${n} up top!`]) : T.st?.cloak ? `${n} is invisible near us!` : pick([`${n} spotted!`, `Enemy ${n}!`, `Eyes on ${n}!`]);
          this.say(u, text, { pri: ultUp ? 2 : 1 });
          return;
        }
        if (e.id === 'ultReady') { this.say(u, this.voice.line(u.hero, 'ready'), { pri: 1, cd: 'ur' + u.id, cdT: 30 }); return; }
        this.say(u, this.voice.pickCall(u.hero, e.id), { pri: e.id === 'help' ? 1 : 1, cd: 'c' + u.id + e.id, cdT: e.id === 'help' ? 14 : 6 });
        return;
      }
      case 'heal': {
        if (e.src !== me || !e.tgt || e.tgt === me || e.tgt.isPlayer) return;
        const h = this.healGiven.get(e.tgt.id) || { amt: 0, t: this.now() }; h.amt += e.amt; this.healGiven.set(e.tgt.id, h);
        if (h.amt > 150 && Math.random() < 0.6) { this.healGiven.delete(e.tgt.id); this.say(e.tgt, this.voice.pickCall(e.tgt.hero, 'thanks'), { pri: 1, cd: 'thx' + e.tgt.id, cdT: 25 }); }
        return;
      }
      case 'kill': {
        const k = e.killer, v = e.victim;
        if (k === me && me.streak >= 3) { const m = this.mates(); if (m.length) this.later(0.8, () => this.say(pick(m), pick(['Nice work!', 'You are on fire!', 'Great shots!', 'Keep it up!']), { pri: 1, cd: 'cmp', cdT: 20 })); }
        if (v === me && k && k.team !== vt) {
          const n = (this.killedBy.get(k.id) || 0) + 1; this.killedBy.set(k.id, n);
          if (n === 3 || n === 5) this.later(0.6, () => this.say(k, pick(['You again? This is getting easy.', 'Same result every time.', 'Stay down this time.', 'I could do this all day.']), { pri: 2, ally: false }));
        }
        if (k === me && v && this.killedBy.get(v.id) >= 3) { this.killedBy.set(v.id, 0); this.later(0.5, () => this.say(v, pick(['Lucky shot.', 'Fine. One for you.', 'This is not over.']), { pri: 2, ally: false })); }
        if (v && v.team === vt && !v.isPlayer && Math.random() < 0.12) this.later(0.4, () => this.say(v, this.voice.pickCall(v.hero, 'sorry'), { pri: 1, cd: 'sorry', cdT: 20 }));
        return;
      }
      case 'ult': {
        const u = e.unit; if (u.team !== vt || s.modeId === 'ffa') return;
        const partner = this.mates().find((o) => o !== u && o.ult >= o.def.ult.cost - 1 && Math.hypot(o.pos[0] - u.pos[0], o.pos[2] - u.pos[2]) < 18);
        if (partner) this.later(0.9, () => this.say(partner, pick(['Following up!', 'Combo! Going in!', 'Ult combo, now!']), { pri: 2, cd: 'combo', cdT: 8 }));
        return;
      }
    }
  }
}
