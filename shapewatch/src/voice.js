// Voicelines. Every hero has their own pitch, pace, and lines (speech synthesis does the talking,
// subtitles back it up where speech is unavailable). Team callouts are spoken in the caller's voice.
import { HERO } from './heroes.js';

// per hero: pick (on selecting), ult (shouted as it fires), ready (ultimate ready), kill, hurt, win, lose, hello
export const LINES = {
  bulwark: { pick: ['Shields up. We advance.', 'Stand behind me. All of you.'], ult: ['Hold the line!', 'Bastion Field!'], ready: ['Bastion Field is ready.'], kill: ['Stay behind the barrier.', 'Not today.'], hurt: ['Barrier is cracking!'], win: ['Victory is a team sport.'], lose: ['We hold next time.'], hello: ['Soldiers.'] },
  mauler: { pick: ['Let us smash something.', 'Scrap and spite, baby.'], ult: ['Look out below!', 'Meteor crash!'], ready: ['I am ready to drop the ceiling.'], kill: ['Next!', 'Scrap.', 'Come get some more!'], hurt: ['That tickled!'], win: ['Crushed it. Literally.'], lose: ['Ow. That one hurt.'], hello: ['Heh. Hey.'] },
  orbit: { pick: ['The numbers favour us.', 'Gravity is a suggestion.'], ult: ['Singularity!', 'Collapse!'], ready: ['The singularity is ready.'], kill: ['Predictable trajectory.', 'Pulled apart.'], hurt: ['My ward is failing!'], win: ['As the equations predicted.'], lose: ['A flaw in the model.'], hello: ['Good. Everyone is here.'] },
  wrecker: { pick: ['Round one!', 'Gloves are off. Mostly.'], ult: ['Seismic slam!', 'Timber!'], ready: ['Ready to wreck the place.'], kill: ['Down for the count!', 'Knocked out!'], hurt: ['I have been hit harder!'], win: ['And the champ walks away!'], lose: ['We go again.'], hello: ['Hey, champ.'] },
  bastille: { pick: ['Rotary cannon spun up.', 'I do not retreat.'], ult: ['Artillery inbound!', 'Rain of steel!'], ready: ['Artillery is ready.'], kill: ['Target down.', 'Suppressed.'], hurt: ['Taking fire!'], win: ['Position held.'], lose: ['Fall back and regroup.'], hello: ['Locked in.'] },
  sabre: { pick: ['Locked and loaded.', 'Frontline, reporting.'], ult: ['Overdrive engaged!', 'Weapons hot!'], ready: ['Overdrive ready.'], kill: ['Tango down.', 'Got him.'], hurt: ['I am hit!'], win: ['Mission complete.'], lose: ['Fall back. We regroup.'], hello: ['Ready when you are.'] },
  ranger: { pick: ["It's high noon somewhere.", 'Reckon I got time for one more.'], ult: ["It's high noon.", 'Draw!'], ready: ['High noon is ready.'], kill: ['Nobody outdraws me.', 'Yeehaw.'], hurt: ['Ow, that stings.'], win: ['Another day, another dollar.'], lose: ['Well, shoot.'], hello: ['Howdy.'] },
  cinder: { pick: ['Watch closely!', 'The fire is part of the act.'], ult: ['Burn it down!', 'Ta-da!'], ready: ['The finale is ready.'], kill: ['Ta-da!', 'That was a smoking hot take.'], hurt: ['Ouch, too close!'], win: ['And for my next trick, victory!'], lose: ['The show must go on.'], hello: ['Ladies and gentlemen!'] },
  vesper: { pick: ['I have the high ground.', 'One shot is enough.'], ult: ['Rift lance charging.', 'Hold still.'], ready: ['Rift lance is ready.'], kill: ['Clean.', 'Headshot.'], hurt: ['I am exposed!'], win: ['Exactly as planned.'], lose: ['I missed one shot.'], hello: ['Quiet, please.'] },
  flicker: { pick: ['Cheers, love, the cavalry is here!', 'Time to go!'], ult: ['Time bomb out!', 'Stand back, loves!'], ready: ['My bomb is ready!'], kill: ['Gotcha!', 'Too slow!'], hurt: ['Oi, rude!'], win: ['Brilliant! Cheers!'], lose: ['Let us rewind that.'], hello: ['Hiya!'] },
  shade: { pick: ['You did not see me.', 'I was never here.'], ult: ['E. M. P.', 'Lights out.'], ready: ['The EMP is ready.'], kill: ['Gone.', 'Quiet now.'], hurt: ['They found me!'], win: ['Nobody saw a thing.'], lose: ['Disappear. Regroup.'], hello: ['Hm.'] },
  trapper: { pick: ['Watch your step.', 'The woods always win.'], ult: ['Bear pit!', 'Nowhere to run!'], ready: ['The big trap is ready.'], kill: ['Caught.', 'Tracked and taken.'], hurt: ['I am hit!'], win: ['The hunt is over.'], lose: ['They slipped the snare.'], hello: ['Hm. Good morning.'] },
  skyhawk: { pick: ['Eyes in the sky!', 'Wheels up!'], ult: ['Rockets away!', 'Barrage!'], ready: ['Barrage is ready!'], kill: ['Splash one!', 'Direct hit!'], hurt: ['I am taking fire!'], win: ['Clear skies!'], lose: ['Bailing out!'], hello: ['Skyhawk, in position.'] },
  riftwalker: { pick: ['Every door opens.', 'Where would you like to be?'], ult: ['Time stands still.', 'Freeze.'], ready: ['The stasis field is ready.'], kill: ['Elsewhere.', 'Sent away.'], hurt: ['A door slammed!'], win: ['Exactly where we should be.'], lose: ['Wrong door.'], hello: ['Hello. And goodbye.'] },
  halo: { pick: ['Heal, protect, repeat.', 'I will be right there.'], ult: ['Rise again!', 'Resurgence!'], ready: ['My ultimate is ready.'], kill: ['Forgive me.', 'Peace to you.'], hurt: ['I need cover!'], win: ['Everyone made it. Wonderful.'], lose: ['We will rise again.'], hello: ['Hello, friends.'] },
  serene: { pick: ["Doctor's orders.", 'Hold still, this will not hurt.'], ult: ['Nano boost!', 'Go get them!'], ready: ['Nano boost is ready.'], kill: ['Terminal diagnosis.', 'Sleep well.'], hurt: ['I have been hit!'], win: ['Clean bill of health.'], lose: ['I lost the patient.'], hello: ['Good to see you.'] },
  pylon: { pick: ['Building something beautiful.', 'Let me get the toolbox.'], ult: ['Overcharging the grid!', 'Powering up!'], ready: ['The grid is charged.'], kill: ['Scrap metal.', 'Taken apart.'], hurt: ['Careful with the equipment!'], win: ['Built to last.'], lose: ['Back to the drawing board.'], hello: ['Hey, you.'] },
  zephyr: { pick: ['Drop the bass!', 'Let us move to a new rhythm.'], ult: ['Sound barrier!', 'Everybody, jump!'], ready: ['The barrier is ready!'], kill: ['Mic drop.', 'Silenced!'], hurt: ['Off the beat!'], win: ['Encore! Encore!'], lose: ['We will get the next track.'], hello: ['Yo!'] },
  cantor: { pick: ['Peace within, chaos without.', 'I am here, and so are you.'], ult: ['Transcendence.', 'Be at peace.'], ready: ['Transcendence is near.'], kill: ['Be at peace.', 'Let go.'], hurt: ['I stay calm.'], win: ['Harmony.'], lose: ['Even defeat is a teacher.'], hello: ['Namaste.'] },
  siphon: { pick: ['A little off the top.', 'I take what I need.'], ult: ['Coalescence!', 'Share the burden!'], ready: ['Coalescence is ready.'], kill: ['Thank you for that.', 'Mine now.'], hurt: ['I will take that back!'], win: ['It all balanced out.'], lose: ['Costly. Very costly.'], hello: ['Hello.'] },
};
// team callouts (said by whoever calls them); a hero may override the wording
export const CALLS = {
  hello: ['Hello!', 'Hi, everyone!'], thanks: ['Thanks!', 'Thank you!'], group: ['Group up!', 'Regroup on me!'], help: ['I need healing!', 'Healer, over here!'],
  push: ["Let's push!", 'Push forward!'], fallback: ['Fall back!', 'Pull back!'], defend: ['Defend the objective!', 'Hold this position!'],
  ultReady: ['Ultimate is ready!', 'My ultimate is ready!'], enemy: ['Enemy spotted!', 'Contact!', 'Enemy there!'], go: ['Going here!', 'Moving here!'],
  objective: ['Objective here!', 'This is the objective!'], health: ['Health pack here!', 'Need a health pack!'], sorry: ['Sorry!'], cheer: ['Yes!', 'Nice!'], compliment: ['Nice shot!'],
  ally: ['On my way!', 'I am with you!'],
};
const OVERRIDE = {
  sabre: { help: ['Medic!'], enemy: ['Tango spotted!'] }, mauler: { group: ['Get over here!'], help: ['Heal me up, will ya?'] }, flicker: { help: ['Oi, a little help here, love?'], group: ['Stick together, loves!'] },
  ranger: { enemy: ['Varmint over yonder!'], group: ['Round up, folks!'] }, cantor: { help: ['I require healing.'], group: ['Gather close.'] }, zephyr: { push: ['Turn it up, push!'], group: ['Squad, on me!'] },
  shade: { enemy: ['Target here.'] }, vesper: { enemy: ['Target acquired.'] },
};
const ANNOUNCER = { ultEnemy: (n) => `Enemy ${n}.`, overtime: 'Overtime!', checkpoint: 'Checkpoint reached.', capture: 'Point captured.', victory: 'Victory!', defeat: 'Defeat.', surge: 'Rift surge!', start: 'Prepare for battle.', roundWin: 'Round won.', roundLoss: 'Round lost.' };

const hash = (s) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
export class Voice {
  constructor() {
    this.enabled = true; this.volume = 0.9; this.subs = true; this.onSub = null; this.voices = []; this.last = new Map(); this.speaking = null; this.pri = 0; this.ok = typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
    this.queued = 0;
  }
  unlock() {
    if (!this.ok) return;
    const load = () => { this.voices = (speechSynthesis.getVoices() || []).filter((v) => /^en/i.test(v.lang)); };
    load(); try { speechSynthesis.onvoiceschanged = load; } catch { /* ignore */ }
  }
  voiceFor(heroId) {
    if (!this.voices.length) return null;
    const g = HERO[heroId]?.voice?.gender, female = /female|woman|zira|samantha|karen|moira|susan|hazel|fiona|tessa|victoria|serena|catherine|aria|jenny|libby|sonia|natasha|heera|veena|allison|ava|joanna|kendra|kimberly|salli|ivy/i, male = /male|david|mark|daniel|alex|fred|george|james|guy|ryan|thomas|ralph|brian|joey|matthew|justin|arthur|oliver|rishi|lee|aaron|evan/i;
    let pool = this.voices.filter((v) => g === 'f' ? female.test(v.name) && !/\bmale\b/i.test(v.name.replace(/female/i, '')) : g === 'm' ? male.test(v.name) && !female.test(v.name) : true);
    if (!pool.length) pool = this.voices;
    return pool[hash(heroId) % pool.length];
  }
  // speak as a hero. pri: 1 chatter, 2 callouts, 3 ultimates and big moments (they cut in)
  say(heroId, text, { pri = 1, name = null, team = 0, ally = true, minGap = 2.2, key = null, force = false } = {}) {
    if (!text) return;
    const now = performance.now() / 1000, k = key || heroId + ':' + (pri >= 3 ? 'ult' : 'c');
    if (!force && now - (this.last.get(k) || -99) < minGap) return;
    this.last.set(k, now);
    if (this.subs) this.onSub?.({ name: name || HERO[heroId]?.name || 'ANNOUNCER', hero: heroId, text, ally, team, pri });
    if (!this.enabled || !this.ok || this.volume <= 0) return;
    try {
      if (this.speaking && now < this.speakUntil && pri <= this.pri) { if (this.queued > 1 || pri < 2) return; }
      if (pri >= 3 && speechSynthesis.speaking) speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text), p = HERO[heroId]?.voice || { pitch: 1, rate: 1 };
      u.pitch = Math.min(2, Math.max(0.1, p.pitch)); u.rate = Math.min(1.8, Math.max(0.6, p.rate * (pri >= 3 ? 1.05 : 1))); u.volume = this.volume * (ally ? 1 : 0.8);
      const v = this.voiceFor(heroId); if (v) u.voice = v;
      this.speaking = true; this.pri = pri; this.queued++; this.speakUntil = now + 0.3 + text.length * 0.07;
      u.onend = u.onerror = () => { this.queued = Math.max(0, this.queued - 1); if (!this.queued) this.speaking = false; };
      speechSynthesis.speak(u);
    } catch { /* speech not available */ }
  }
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  line(heroId, kind) { const l = LINES[heroId]?.[kind]; return l ? this.pick(l) : null; }
  hero(heroId, kind, opts = {}) { const t = this.line(heroId, kind); if (t) this.say(heroId, t, { pri: kind === 'ult' ? 3 : 1, ...opts, key: opts.key || heroId + ':' + kind }); }
  call(heroId, id, opts = {}) { const o = OVERRIDE[heroId]?.[id] || CALLS[id]; if (!o) return; this.say(heroId, this.pick(o), { pri: 2, ...opts, key: opts.key || 'call:' + opts.team }); }
  announce(kind, arg) { const t = typeof ANNOUNCER[kind] === 'function' ? ANNOUNCER[kind](arg) : ANNOUNCER[kind]; if (t) this.say('announcer', t, { pri: 3, name: 'ANNOUNCER', force: true, key: 'ann' }); }
  stop() { try { if (this.ok) speechSynthesis.cancel(); } catch { /* ignore */ } this.queued = 0; this.speaking = false; }
}
HERO.announcer = { voice: { pitch: 0.75, rate: 1.0, gender: 'm' }, name: 'ANNOUNCER' };
