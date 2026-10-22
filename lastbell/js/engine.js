/* LAST BELL — core engine: state, skills, checks, dialogue runner, navigation, saves. No DOM here. */
(function (root) {
  'use strict';
  const GD = (root.GD = root.GD || {});
  const R = () => GD.rules || {};
  const SAVE_KEY = 'lastbell_save_v1', END_KEY = 'lastbell_endings_v1';

  const DIFF_WORDS = [[6, 'Trivial'], [8, 'Easy'], [10, 'Medium'], [12, 'Challenging'], [14, 'Formidable'], [16, 'Legendary']];
  const diffWord = (d) => { let w = 'Trivial'; for (const [n, name] of DIFF_WORDS) if (d >= n) w = name; return d > 16 ? 'Impossible' : w; };

  // chance of success on 2d6 + level >= diff (2 always fails, 12 always succeeds)
  function chanceOf(level, diff) {
    let ok = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) {
      const t = a + b;
      if (t === 12 || (t !== 2 && t + level >= diff)) ok++;
    }
    return Math.round((ok / 36) * 100);
  }

  const listeners = {};
  const on = (ev, fn) => { (listeners[ev] = listeners[ev] || []).push(fn); };
  const emit = (ev, a, b) => (listeners[ev] || []).forEach((fn) => { try { fn(a, b); } catch (e) { console.error(e); } });

  let S = null;       // game state
  let D = null;       // active dialogue
  let pending = null; // things queued for when the dialogue closes
  let condCache = {};
  const dialogues = () => (GD._dialogues || (GD._dialogues = Object.assign({}, GD.dialoguesA || {}, GD.dialoguesB || {}, GD.dialoguesC || {}, GD.dialoguesD || {}, GD.dialoguesE || {}, GD.dialoguesF || {})));

  // ---------- state ----------
  function newState(opts) {
    const attrs = Object.assign({ intellect: 3, psyche: 3, physique: 3, motorics: 3 }, opts.attrs || {});
    const s = {
      v: 1, name: opts.name || GD.meta.defaultName, look: Object.assign({}, GD.playerLook, opts.look || {}),
      archetype: opts.archetype || 'custom',
      attrs, learned: Object.assign({}, opts.learned || {}), xp: 0, points: 0,
      hp: R().startHp || 10, morale: R().startMorale || 10, surv: R().startSurv || 0,
      time: GD.meta.startTime, loc: GD.meta.startLocation, px: GD.meta.startX, py: GD.meta.startY, facing: 'se',
      flags: {}, items: {}, equipped: {}, tasks: {}, thoughts: {}, thoughtSlots: (GD.thoughtSlots && GD.thoughtSlots.start) || 3,
      ideo: { vanguard: 0, undercurrent: 0, quiet: 0 },
      talked: {}, visited: {}, checks: {}, seen: {}, taken: {}, log: [], stats: { passed: 0, failed: 0, days: 0 },
      day: 1, ending: null, started: Date.now(), trail: [],
      npcHome: {}
    };
    return s;
  }

  // ---------- skills ----------
  const SKILL_IDS = () => Object.keys(GD.skills || {});
  function skillBase(id) { const sk = GD.skills[id]; return sk ? (S.attrs[sk.attribute] || 0) : 0; }
  function skillMods(id) {
    const mods = [];
    for (const [tid, t] of Object.entries(S.thoughts)) {
      if (t.state !== 'internalized') continue;
      const m = GD.thoughts[tid] && GD.thoughts[tid].mods;
      if (m && m[id]) mods.push({ label: GD.thoughts[tid].name, n: m[id] });
    }
    for (const iid of Object.keys(S.items)) {
      const it = GD.items[iid]; if (!it || !it.mods || !it.mods[id]) continue;
      if (it.type === 'apparel' && !S.equipped[iid]) continue;
      mods.push({ label: it.name, n: it.mods[id] });
    }
    if (S.flags.hangover_skill === id && S.flags.hangover_day === S.day) mods.push({ label: 'Static hangover', n: -1 });
    const sk = GD.skills[id];
    if (sk) {
      if (S.morale <= 2 && sk.attribute === 'psyche') mods.push({ label: 'Broken nerve', n: -1 });
      if (S.hp <= 2 && (sk.attribute === 'physique' || sk.attribute === 'motorics')) mods.push({ label: 'Battered body', n: -1 });
      if (S.surv >= 66 && ['charm', 'rhetoric', 'empathy', 'authority'].includes(id)) mods.push({ label: 'Everyone is watching you', n: -1 });
    }
    return mods;
  }
  function skill(id) {
    if (!GD.skills[id]) return 0;
    let v = skillBase(id) + (S.learned[id] || 0);
    for (const m of skillMods(id)) v += m.n;
    return Math.max(0, Math.min(R().skillCap ? R().skillCap + 3 : 13, v));
  }
  const attr = (id) => S.attrs[id] || 0;
  const learnedCap = () => R().skillCap || 10;

  // ---------- conditions ----------
  const SCOPE_KEYS = ['day', 'flag', 'has', 'skill', 'attr', 'ideo', 'surv', 'hp', 'morale', 'time', 'task', 'thought', 'visited', 'talked'];
  function evalCond(c) {
    if (c == null || c === '') return true;
    let fn = condCache[c];
    if (!fn) {
      try { fn = condCache[c] = new Function(...SCOPE_KEYS, 'return (' + c + ');'); }
      catch (e) { console.warn('bad cond', c, e); fn = condCache[c] = () => false; }
    }
    try {
      return !!fn(S.day || 1, S.flags, (i) => !!S.items[i], skill, attr, S.ideo, S.surv, S.hp, S.morale, S.time,
        (t) => (S.tasks[t] ? S.tasks[t].state : 'none'), (t) => (S.thoughts[t] ? (S.thoughts[t].state === 'internalized' ? 'internalized' : 'researching') : 'none'),
        (l) => !!S.visited[l], (d) => S.talked[d] || 0);
    } catch (e) { return false; }
  }
  const sub = (t) => String(t == null ? '' : t).replace(/\{name\}/g, S.name);
  const pick = (t) => (Array.isArray(t) ? t[Math.floor(Math.random() * t.length)] : t);

  // ---------- effects ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function addTime(min) {
    if (!min) return;
    const before = S.time;
    S.time += min;
    for (const [tid, t] of Object.entries(S.thoughts)) {
      if (t.state === 'researching') {
        t.remaining -= min;
        if (t.remaining <= 0) finishThought(tid);
      }
    }
    // bells
    [[720, 'The noon bell rings. Somewhere a ladle strikes a pot.'], [900, 'The three o\'clock bell. The light turns ochre.'], [1020, 'The exam bell rings. You are expected in the Principal\'s office.'], [1140, 'The evening bell. The loudspeakers hum, warming up.']].forEach(([t, msg]) => {
      if (before < t && S.time >= t) {
        emit('toast', { text: msg, kind: 'bell' });
        emit('sfx', 'bell');
        if (t === 1020 && !S.flags.exam_done) { if (!S.tasks.task_exam || S.tasks.task_exam.state === 'none') setTask('task_exam', 'active'); }
        if (t === 1140 && !S.flags.exam_done && !S.flags.exam_missed) { S.flags.exam_missed = true; changeSurv(10); emit('toast', { text: 'You missed your exam. A note is placed in your file.', kind: 'warn' }); }
      }
    });
    if (S.time >= GD.meta.curfew - 60 && before < GD.meta.curfew - 60) emit('toast', { text: 'One hour to curfew.', kind: 'warn' });
    if (S.time >= GD.meta.curfew && !S.ending) queueEnding('end_curfew');
    emit('time', S.time);
    if (!D && !S.ending && !pending) runAuto();
  }
  function changeSurv(n) {
    const before = S.surv;
    S.surv = clamp(S.surv + n, 0, 100);
    if (n > 0) {
      if (before < 33 && S.surv >= 33) emit('toast', { text: 'A hall monitor writes your name in a small, neat notebook.', kind: 'warn' });
      if (before < 66 && S.surv >= 66) emit('toast', { text: 'A black car idles at the school gate. Its engine has been running a long time.', kind: 'warn' });
    }
    if (S.surv >= 100 && !S.ending) queueEnding('end_arrested');
  }
  const VERDICTS = { end_good_student: 'good_student', end_ledger: 'ledger', end_static: 'static', end_quiet: 'quiet' };
  function queueEnding(id) {
    if (S.ending || (pending && (pending.ending || pending.verdict))) return;
    pending = pending || {};
    if ((S.day || 1) < 3 && !S.flags.finale_open && id !== 'end_arrested') {
      if (VERDICTS[id]) pending.verdict = VERDICTS[id];
      else if (id === 'end_curfew') pending.verdict = 'curfew';
      else pending.ending = id;
    } else pending.ending = id;
    if (!D) flushPending();
  }
  // ----- days & nights -----
  function startDaybreak(name) {
    if (name !== 'curfew') S.flags['verdict_' + name] = true;
    S.lastVerdict = name;
    const id = 'daybreak_' + name;
    if (dialogues()[variantId(id)]) { emit('night', name); startDialogue(id, null, { daybreak: true }); }
    else nextDay();
  }
  function nextDay() {
    S.day = (S.day || 1) + 1;
    const d = GD.meta.days[S.day] || GD.meta.days[3];
    S.time = d.start; S.hp = Math.min(10, S.hp + 4); S.morale = Math.min(10, S.morale + 4); S.surv = Math.max(0, S.surv - 15);
    S.flags.hangover_skill = null;
    const th = S.thoughts.th_ghost_of_yesterday;
    if (!(th && th.state === 'internalized')) { const ids = SKILL_IDS(); S.flags.hangover_skill = ids[Math.floor(Math.random() * ids.length)]; S.flags.hangover_day = S.day; }
    S.path = null; S.then = null;
    teleport('dorm', undefined, undefined, true);
    emit('daybreak', { day: S.day, name: d.name, hangover: S.flags.hangover_skill ? GD.skills[S.flags.hangover_skill].name : null });
    emit('state'); save();
  }
  function beginDay() {
    const n = S.day;
    if (!S.visited.dorm && dialogues().enter_dorm) { S.visited.dorm = true; pending = pending || {}; pending.dialogue = { id: 'enter_dorm' }; }
    S.visited.dorm = true;
    if (dialogues()['enter_day' + n]) startDialogue('enter_day' + n);
    else flushPending();
  }
  function setTask(id, state) {
    const t = S.tasks[id] || (S.tasks[id] = { state: 'none', notes: [] });
    if (t.state === state) return;
    t.state = state;
    const def = GD.tasks[id] || {};
    emit('toast', { text: (state === 'active' ? 'New task: ' : state === 'done' ? 'Task complete: ' : 'Task failed: ') + (def.title || id), kind: 'task' });
    emit('sfx', 'paper');
  }
  function grantItem(id) {
    if (S.items[id]) return;
    S.items[id] = true;
    const it = GD.items[id] || { name: id };
    emit('toast', { text: 'Obtained: ' + it.name, kind: 'item' }); emit('sfx', 'paper');
  }
  function discoverThought(id) {
    if (S.thoughts[id]) return;
    const t = GD.thoughts[id]; if (!t) return;
    S.thoughts[id] = { state: 'known', remaining: 0 };
    emit('toast', { text: 'Thought discovered: ' + t.name, kind: 'thought' }); emit('sfx', 'chime');
  }
  function gainXp(n) {
    if (!n) return;
    S.xp += n;
    const per = R().xpPerPoint || 6;
    let gained = 0;
    while (S.xp >= per) { S.xp -= per; S.points++; gained++; }
    emit('toast', { text: '+' + n + ' XP' + (gained ? ' — skill point earned!' : ''), kind: 'xp' });
  }
  function runEffects(list) {
    if (!list) return;
    for (const e of list) {
      if (e.set !== undefined) S.flags[e.set] = e.val === undefined ? true : e.val;
      if (e.add !== undefined) S.flags[e.add] = (S.flags[e.add] || 0) + (e.n === undefined ? 1 : e.n);
      if (e.give) grantItem(e.give);
      if (e.take) delete S.items[e.take];
      if (e.xp) gainXp(e.xp);
      if (e.surv) changeSurv(e.surv);
      if (e.hp) { S.hp = clamp(S.hp + e.hp, 0, 10); emit('toast', { text: (e.hp > 0 ? '+' : '') + e.hp + ' Body', kind: e.hp > 0 ? 'good' : 'bad' }); checkCollapse(); }
      if (e.morale) { S.morale = clamp(S.morale + e.morale, 0, 10); emit('toast', { text: (e.morale > 0 ? '+' : '') + e.morale + ' Nerve', kind: e.morale > 0 ? 'good' : 'bad' }); checkCollapse(); }
      if (e.time) addTime(e.time);
      if (e.thought) discoverThought(e.thought);
      if (e.task && !e.note) setTask(e.task, e.state || 'active');
      else if (e.task && e.note) { if (!S.tasks[e.task] || S.tasks[e.task].state === 'none') setTask(e.task, 'active'); }
      if (e.note) { const t = S.tasks[e.note] || (S.tasks[e.note] = { state: 'active', notes: [] }); if (t.state === 'none') setTask(e.note, 'active'); if (e.text && !t.notes.includes(e.text)) { t.notes.push(e.text); emit('toast', { text: 'Journal updated', kind: 'task' }); } }
      if (e.ideo && e.ideo !== true) { S.ideo[e.ideo] = (S.ideo[e.ideo] || 0) + (e.n === undefined ? 1 : e.n); }
      if (e.skillUp) { S.learned[e.skillUp] = (S.learned[e.skillUp] || 0) + (e.n || 1); emit('toast', { text: GD.skills[e.skillUp].name + ' increased', kind: 'xp' }); }
      if (e.goto) { pending = pending || {}; pending.move = { loc: e.goto, x: e.x, y: e.y }; if (!D) flushPending(); }
      if (e.ending) queueEnding(e.ending);
      if (e.toast) emit('toast', { text: e.toast, kind: 'info' });
      if (e.sfx) emit('sfx', e.sfx);
      if (e.dialogue && !e.task && !e.note) { pending = pending || {}; pending.dialogue = { id: e.dialogue, node: e.node }; }
    }
    if (S.flags.met_vasha && GD.npcs.vasha && !GD.npcs.vasha._followerHere) {
      GD.npcs.vasha._followerHere = true;
      if (S.loc === GD.npcs.vasha.loc) S.fpos = { x: GD.npcs.vasha.x, y: GD.npcs.vasha.y, facing: 'se' }; else placeFollower();
    }
    emit('state');
  }
  function checkCollapse() {
    if ((S.hp <= 0 || S.morale <= 0) && !S.ending) {
      pending = pending || {}; pending.collapse = S.hp <= 0 ? 'Your body quits first. The floor arrives.' : 'Your nerve goes out like a lamp. You sit down in the dark of yourself.';
    }
  }

  // ---------- thoughts ----------
  function usedSlots() { return Object.values(S.thoughts).filter((t) => t.state === 'researching').length; }
  function startThought(id) {
    const t = S.thoughts[id], def = GD.thoughts[id];
    if (!t || t.state !== 'known' || usedSlots() >= S.thoughtSlots) return false;
    t.state = 'researching'; t.remaining = def.minutes || def.research || 90; t.total = t.remaining;
    emit('sfx', 'chime'); emit('state'); return true;
  }
  function finishThought(id) {
    const t = S.thoughts[id], def = GD.thoughts[id]; if (!t) return;
    t.state = 'internalized'; t.remaining = 0;
    emit('toast', { text: 'Thought internalized: ' + def.name, kind: 'thought' }); emit('sfx', 'chime');
    const eff = def.effects || def.onInternalize || def.internalize;
    if (Array.isArray(eff)) runEffects(eff);
    else if (def.ideo || def.surv || def.morale) {
      const a = []; if (def.ideo) { if (typeof def.ideo === 'string') a.push({ ideo: def.ideo, n: 1 }); else for (const [k, n] of Object.entries(def.ideo)) a.push({ ideo: k, n }); }
      if (def.surv) a.push({ surv: def.surv }); if (def.morale) a.push({ morale: def.morale }); runEffects(a);
    }
    emit('thoughtDone', id);
  }
  function forgetThought(id) {
    const t = S.thoughts[id]; if (!t) return;
    if (t.state === 'researching') { t.state = 'known'; t.remaining = 0; }
    else if (t.state === 'internalized') { t.state = 'known'; }
    emit('state');
  }

  // ---------- dialogue ----------
  function variantId(id) { const d = S.day || 1; return d > 1 && dialogues()[id + '_d' + d] ? id + '_d' + d : id; }
  function startDialogue(id, nodeId, opts) {
    const base = id; id = variantId(id);
    const d = dialogues()[id];
    if (!d) { console.warn('no dialogue', id); return false; }
    if (D) closeDialogue(true);
    D = { id, base, def: d, title: sub(d.title || (GD.npcs[id] && GD.npcs[id].name) || ''), history: [], choices: [], nodeId: null, roll: null, isEnding: !!(opts && opts.isEnding) };
    S.talked[id] = (S.talked[id] || 0) + 1; if (base !== id) S.talked[base] = (S.talked[base] || 0) + 1;
    D.daybreak = !!(opts && opts.daybreak);
    let start = nodeId;
    if (!start) {
      const alts = Array.isArray(d.start) ? d.start : [d.start];
      for (const a of alts) { if (typeof a === 'string') { start = a; break; } if (evalCond(a.cond)) { start = a.node; break; } }
      if (!start) start = typeof alts[0] === 'string' ? alts[0] : alts[0].node;
    }
    if (!D.isEnding) addTime(2);
    emit('dialogueStart', D);
    enterNode(start);
    return true;
  }
  function speakerInfo(sp) {
    if (GD.skills[sp]) return { kind: 'skill', id: sp, name: GD.skills[sp].name.toUpperCase(), color: GD.skills[sp].color, level: skill(sp) };
    if (sp === 'you') return { kind: 'you', name: S.name.toUpperCase(), color: '#e8d9a8' };
    if (sp === 'narrator' || !sp) return { kind: 'narrator', name: '', color: '#c9c3b0' };
    if (GD.npcs[sp]) return { kind: 'npc', id: sp, name: GD.npcs[sp].name, color: GD.npcs[sp].color || '#d8d2c0' };
    return { kind: 'other', id: sp, name: String(sp).replace(/^[a-z]_/, '').replace(/_/g, ' ').toUpperCase(), color: '#b8c4b0' };
  }
  function enterNode(nodeId) {
    const node = D.def.nodes[nodeId];
    if (!node) { closeDialogue(); return; }
    D.nodeId = nodeId; D.roll = null;
    runEffects(node.onEnter);
    D.history.push({ kind: 'line', speaker: speakerInfo(node.speaker), text: sub(pick(node.text)) });
    // Passive voices: only the strongest few speak per node; the rest wait for a later beat instead of all piling in at once.
    const cap = node.voices || 2;
    const elig = [];
    (node.interjections || []).forEach((j, i) => {
      if (skill(j.skill) < j.min || !evalCond(j.cond)) return;
      const key = D.id + ':' + nodeId + ':j' + i;
      if (!j.repeat && S.seen[key]) return;
      elig.push({ j, key, margin: skill(j.skill) - j.min + (j.effects && j.effects.length ? 0.5 : 0) });
    });
    elig.sort((a, b) => b.margin - a.margin).slice(0, cap).forEach(({ j, key }) => {
      S.seen[key] = true;
      D.history.push({ kind: 'line', voice: true, speaker: speakerInfo(j.skill), text: sub(j.text), passive: true });
      runEffects(j.effects);
    });
    buildChoices(node);
    emit('dialogue', D);
  }
  function buildChoices(node) {
    const out = [];
    (node.choices || []).forEach((c, i) => {
      if (!evalCond(c.cond)) return;
      const key = D.id + ':' + D.nodeId + ':c' + i;
      if (c.once && S.taken[key]) return;
      const ch = { i, text: sub(c.text), end: !!c.end || (c.goto === null && !c.check && !c.dialogue) };
      if (c.check) {
        const k = c.check, lvl = skill(k.skill) + (k.mod || 0), prev = S.checks[k.id];
        ch.check = { skill: k.skill, skillName: GD.skills[k.skill].name, color: GD.skills[k.skill].color, diff: k.diff, word: diffWord(k.diff), chance: chanceOf(lvl, k.diff), white: !!k.white, level: lvl };
        if (prev) {
          if (prev.success) return;                    // already passed: hide
          if (!k.white || lvl <= prev.level) { ch.locked = k.white ? 'Failed — improve your skill to retry' : 'Failed — you only get one chance'; }
        }
      }
      out.push(ch);
    });
    if (!out.length) out.push({ i: -1, text: 'Continue.', end: true, cont: true });
    D.choices = out;
  }
  function choose(idx) {
    if (!D || D.roll) return;
    const view = D.choices[idx]; if (!view || view.locked) return;
    const node = D.def.nodes[D.nodeId];
    if (view.i === -1) { closeDialogue(); return; }
    const c = node.choices[view.i];
    const key = D.id + ':' + D.nodeId + ':c' + view.i;
    if (c.once) S.taken[key] = true;
    D.history.push({ kind: 'choice', text: view.text });
    addTime(1);
    if (c.check) { doCheck(c, view); return; }
    runEffects(c.effects);
    advance(c);
  }
  function advance(c) {
    if (c.dialogue) { pending = pending || {}; pending.dialogue = { id: c.dialogue, node: c.node }; closeDialogue(); return; }
    if (c.end || c.goto === null || c.goto === undefined) { closeDialogue(); return; }
    enterNode(c.goto);
  }
  function doCheck(c, view) {
    const k = c.check, lvl = view.check.level;
    const d1 = 1 + Math.floor(Math.random() * 6), d2 = 1 + Math.floor(Math.random() * 6), total = d1 + d2 + lvl;
    const crit = d1 + d2 === 12, fumble = d1 + d2 === 2;
    const success = crit || (!fumble && total >= k.diff);
    S.checks[k.id] = { success, level: lvl };
    S.stats[success ? 'passed' : 'failed']++;
    D.roll = { skill: k.skill, skillName: GD.skills[k.skill].name, color: GD.skills[k.skill].color, d1, d2, level: lvl, diff: k.diff, word: diffWord(k.diff), total, success, crit, fumble, white: !!k.white, chance: view.check.chance };
    D.history.push({ kind: 'roll', roll: D.roll });
    gainXp(success ? (k.white ? 2 : 3) : 1);
    runEffects(success ? k.passEffects : k.failEffects);
    D.afterRoll = () => { D.roll = null; if (D.history.length) D.history[D.history.length - 1].resolved = true; enterNode(success ? k.pass : k.fail); };
    emit('dialogue', D);
    emit('roll', D.roll);
  }
  function continueRoll() { if (D && D.roll && D.afterRoll) { const f = D.afterRoll; D.afterRoll = null; f(); } }
  function closeDialogue(silent) {
    if (!D) return;
    const was = D; D = null;
    emit('dialogueEnd', was);
    if (!silent) { save(); if (was.daybreak) { pending = null; nextDay(); return; } flushPending(was); runAuto(); }
  }
  function flushPending(was) {
    const p = pending; pending = null;
    if (!p) { emit('state'); return; }
    if (p.collapse && !p.ending) { doCollapse(p.collapse); }
    if (p.verdict) { startDaybreak(p.verdict); return; }
    if (p.ending) { startEnding(p.ending); return; }
    if (p.move) teleport(p.move.loc, p.move.x, p.move.y);
    if (p.dialogue) startDialogue(p.dialogue.id, p.dialogue.node);
    emit('state');
  }
  function doCollapse(msg) {
    S.hp = Math.max(S.hp, 3); S.morale = Math.max(S.morale, 3);
    addTime(120);
    emit('toast', { text: msg + ' Two hours later you come to on the Old Theatre stage.', kind: 'bad' });
    if (!S.ending) teleport('theatre');
  }

  // ---------- auto rules ----------
  function runAuto() {
    if (!S || S.ending || D) return;
    if (S.day === 3 && S.time >= (GD.meta.jubileeTime || 1170) && !S.flags.jubilee_started && dialogues().jubilee_call) { S.flags.jubilee_started = true; startDialogue('jubilee_call'); return; }
    for (const r of GD.auto || []) {
      const k = 'auto:' + r.id;
      if (!S.seen[k] && evalCond(r.cond)) { S.seen[k] = true; runEffects(r.effects); }
    }
    for (const [id, t] of Object.entries(GD.thoughts || {})) {
      if (S.thoughts[id]) continue;
      const c = t.cond || (GD.thoughtAuto && GD.thoughtAuto[id]);
      if (c && evalCond(c)) { discoverThought(id); break; }   // one at a time
    }
  }

  // ---------- endings ----------
  function startEnding(id) {
    if (S.ending) return;
    S.ending = id;
    try {
      const got = JSON.parse(localStorage.getItem(END_KEY) || '[]');
      if (!got.includes(id)) { got.push(id); localStorage.setItem(END_KEY, JSON.stringify(got)); }
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {}
    emit('ending', id);
    const did = 'ending_' + id;
    if (dialogues()[did]) startDialogue(did, null, { isEnding: true });
    else emit('endingDone', id);
  }
  const endingsSeen = () => { try { return JSON.parse(localStorage.getItem(END_KEY) || '[]'); } catch (e) { return []; } };

  // ---------- world / navigation ----------
  const loc = () => GD.locations[S.loc];
  function blockedSet(l, ignoreNpc) {
    const b = new Set();
    for (const p of l.props || []) {
      if (p.side || p.walk) continue;
      for (let i = 0; i < (p.w || 1); i++) for (let j = 0; j < (p.h || 1); j++) b.add((p.x + i) + ',' + (p.y + j));
    }
    for (const n of npcsHere()) if (n.id !== ignoreNpc && !n.follower) b.add(Math.round(n.x) + ',' + Math.round(n.y));
    return b;
  }
  function findPath(l, sx, sy, tx, ty, blocked) {
    sx = Math.round(sx); sy = Math.round(sy);
    if (sx === tx && sy === ty) return [];
    const W = l.w, H = l.h, key = (x, y) => x + ',' + y;
    if (tx < 0 || ty < 0 || tx >= W || ty >= H || blocked.has(key(tx, ty))) return null;
    const open = [{ x: sx, y: sy, g: 0, f: 0, p: null }], best = { [key(sx, sy)]: 0 }, h = (x, y) => Math.max(Math.abs(x - tx), Math.abs(y - ty)) + 0.4 * Math.min(Math.abs(x - tx), Math.abs(y - ty));
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    while (open.length) {
      let bi = 0; for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
      const cur = open.splice(bi, 1)[0];
      if (cur.x === tx && cur.y === ty) { const path = []; for (let n = cur; n.p; n = n.p) path.push({ x: n.x, y: n.y }); return path.reverse(); }
      for (const [dx, dy] of dirs) {
        const nx = cur.x + dx, ny = cur.y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || blocked.has(key(nx, ny))) continue;
        if (dx && dy && (blocked.has(key(cur.x + dx, cur.y)) || blocked.has(key(cur.x, cur.y + dy)))) continue;
        const g = cur.g + (dx && dy ? 1.41 : 1);
        if (best[key(nx, ny)] !== undefined && best[key(nx, ny)] <= g) continue;
        best[key(nx, ny)] = g; open.push({ x: nx, y: ny, g, f: g + h(nx, ny), p: cur });
      }
    }
    return null;
  }
  function npcState(n) {
    const o = Object.assign({}, n, (n.days && n.days[S.day || 1]) || {});
    if (o.loc === null) return null;
    if (n.hideIf && evalCond(n.hideIf)) return null;
    return o;
  }
  function npcsHere() {
    const out = [];
    for (const n of Object.values(GD.npcs)) {
      if (n.follower && S.flags.met_vasha && !S.flags.vasha_away) { if (n._followerHere) out.push(S.fpos ? Object.assign({}, n, S.fpos) : n); continue; }
      const o = npcState(n); if (!o || o.loc !== S.loc) continue;
      out.push(o);
    }
    return out;
  }
  function hotspots() {
    const l = loc(), hs = [];
    for (const n of npcsHere()) hs.push({ id: n.id, kind: 'npc', x: n.x, y: n.y, label: n.name, sub: n.role, dialogue: n.id, color: n.color });
    for (const o of l.objects || []) hs.push({ id: o.id, kind: 'object', x: o.x, y: o.y, label: o.label, dialogue: o.id, done: (S.talked[o.id] || 0) > 0 });
    for (const e of l.exits || []) if (!e.showIf || evalCond(e.showIf)) hs.push({ id: 'exit:' + e.id, kind: 'exit', x: e.x, y: e.y, label: e.label, exit: e });
    return hs;
  }
  function teleport(locId, x, y, silent) {
    const l = GD.locations[locId]; if (!l) return;
    S.loc = locId;
    const sp = l.spawn || { x: 1, y: 1 };
    S.px = x === undefined ? sp.x : x; S.py = y === undefined ? sp.y : y;
    S.trail = []; S.path = null; S.then = null;
    S.fpos = null;
    // follower arrives beside the player
    const v = GD.npcs.vasha;
    if (v && S.flags.met_vasha) { v._followerHere = true; placeFollower(); }
    const first = !S.visited[locId];
    if (!silent) S.visited[locId] = true;
    emit('location', locId, first);
    if (!silent) runAuto();
    if (first && !silent && dialogues()['enter_' + locId] && !D) startDialogue('enter_' + locId);
    save();
  }
  function placeFollower() {
    const l = loc(), b = blockedSet(l);
    const cands = [[-1, 0], [0, -1], [-1, -1], [1, 0], [0, 1], [-2, 0], [0, -2], [1, 1]];
    for (const [dx, dy] of cands) {
      const x = Math.round(S.px) + dx, y = Math.round(S.py) + dy;
      if (x >= 0 && y >= 0 && x < l.w && y < l.h && !b.has(x + ',' + y)) { S.fpos = { x, y, facing: 'se' }; return; }
    }
    S.fpos = { x: Math.round(S.px), y: Math.round(S.py), facing: 'se' };
  }
  function facingFrom(dx, dy) {
    const sx = dx - dy, sy = dx + dy;           // screen-space direction in iso
    const a = Math.atan2(sy, sx) * 180 / Math.PI; // 0 = east(right), 90 = down
    const names = ['e', 'se', 's', 'sw', 'w', 'nw', 'n', 'ne'];
    return names[((Math.round(a / 45) % 8) + 8) % 8];
  }
  function moveTo(tx, ty, then) {
    if (D || S.ending) return false;
    const l = loc(), b = blockedSet(l);
    const path = findPath(l, S.px, S.py, tx, ty, b);
    if (!path) return false;
    S.path = path; S.then = then || null; S.walking = path.length > 0;
    if (!path.length && then) { const f = then; S.then = null; f(); }
    return true;
  }
  function interact(h) {
    if (D || S.ending) return;
    const l = loc();
    if (h.kind === 'exit') {
      const e = h.exit;
      moveTo(e.x, e.y, () => useExit(e));
      return;
    }
    // walk to nearest free neighbour tile
    const b = blockedSet(l, h.id); let best = null;
    const hx = Math.round(h.x), hy = Math.round(h.y);
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) {
      const x = hx + dx, y = hy + dy; if (!dx && !dy) { continue; }
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 1 && best && best.len <= 2) continue;
      const p = findPath(l, S.px, S.py, x, y, b); if (!p) continue;
      const score = p.length + Math.max(Math.abs(dx), Math.abs(dy)) * 3;
      if (!best || score < best.score) best = { x, y, score, len: p.length, path: p };
    }
    if (!best && Math.round(S.px) === hx && Math.round(S.py) === hy) { startDialogue(h.dialogue); return; }
    if (!best) { emit('toast', { text: 'You can\'t reach that.', kind: 'info' }); return; }
    S.path = best.path; S.walking = best.path.length > 0;
    S.then = () => { S.facing = facingFrom(hx - S.px, hy - S.py); startDialogue(h.dialogue); };
    if (!best.path.length) { const f = S.then; S.then = null; f(); }
  }
  function useExit(e) {
    const locked = e.lock ? evalCond(e.lock) : false;
    if (e.dialogue && !e.to) { startDialogue(e.dialogue); return; }
    if (locked) { if (e.lockedDialogue) startDialogue(e.lockedDialogue); else emit('toast', { text: 'It is locked.', kind: 'info' }); return; }
    addTime(3);
    emit('transition', e);
    teleport(e.to, e.toX, e.toY);
  }
  function update(dt) {
    if (!S || D || S.ending) { if (S) S.walking = false; return; }
    const speed = 4.2;
    if (S.path && S.path.length) {
      S.walking = true;
      let step = speed * dt;
      while (step > 0 && S.path.length) {
        const t = S.path[0], dx = t.x - S.px, dy = t.y - S.py, dist = Math.hypot(dx, dy);
        if (dist <= step) { S.px = t.x; S.py = t.y; S.path.shift(); step -= dist; S.trail.push({ x: t.x, y: t.y }); if (S.trail.length > 12) S.trail.shift(); emit('step'); S.flags.steps = (S.flags.steps || 0) + 1; if (S.flags.steps % 20 === 0) runAuto(); S.stepAcc = (S.stepAcc || 0) + 1; if (S.stepAcc % 2 === 0) addTime(1); }
        else { S.px += dx / dist * step; S.py += dy / dist * step; S.facing = facingFrom(dx, dy); step = 0; }
      }
      if (!S.path.length) { S.walking = false; const f = S.then; S.then = null; if (f) f(); }
    } else S.walking = false;
    // follower
    if (S.flags.met_vasha && GD.npcs.vasha._followerHere && S.fpos) {
      const f = S.fpos;
      let tgt = S.trail.length > 3 ? S.trail[S.trail.length - 4] : { x: S.px - 1, y: S.py };
      const dx = tgt.x - f.x, dy = tgt.y - f.y, dist = Math.hypot(dx, dy);
      const d2p = Math.hypot(S.px - f.x, S.py - f.y);
      if (d2p > 1.6 && dist > 0.05) { const st = Math.min(dist, speed * dt * 0.95); f.x += dx / dist * st; f.y += dy / dist * st; f.facing = facingFrom(dx, dy); f.walking = true; }
      else f.walking = false;
    }
  }

  // ---------- save / load ----------
  function save() {
    if (!S || S.ending) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(Object.assign({}, S, { path: null, then: null }))); } catch (e) {}
  }
  function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (!s) return false;
      S = s; D = null; pending = null; S.path = null; S.then = null; if (!S.day) S.day = 1;
      if (GD.npcs.vasha) { GD.npcs.vasha._followerHere = !!S.flags.met_vasha; }
      emit('location', S.loc, false); emit('state'); return true;
    } catch (e) { return false; }
  }
  function newGame(opts) {
    S = newState(opts); D = null; pending = null; condCache = {};
    if (GD.npcs.vasha) GD.npcs.vasha._followerHere = false;
    S.visited[S.loc] = true;
    emit('location', S.loc, true); emit('state');
    startDialogue('intro');
  }

  // ---------- skill points ----------
  function spendPoint(id) {
    if (S.points <= 0) return false;
    if ((S.learned[id] || 0) + skillBase(id) >= learnedCap()) return false;
    S.learned[id] = (S.learned[id] || 0) + 1; S.points--;
    emit('sfx', 'chime'); emit('state'); return true;
  }
  function useItem(id) {
    const it = GD.items[id]; if (!it) return;
    if (it.type === 'apparel') { S.equipped[id] = !S.equipped[id]; if (S.equipped[id] && it.onEquip && !S.seen['eq:' + id]) { S.seen['eq:' + id] = true; runEffects(it.onEquip.effects); } emit('state'); return; }
    if (!it.usable || !it.use) return;
    if (it.use.consume !== false) delete S.items[id];
    runEffects(it.use.effects || []);
    if (it.use.text) emit('toast', { text: it.use.text, kind: 'info' });
    emit('state');
  }

  function slotUnlocks() { return ((GD.thoughtSlots && GD.thoughtSlots.unlocks) || []).filter((u) => u.slot > S.thoughtSlots).slice(0, 1); }
  function unlockSlot(u, pay) {
    if (!(pay ? S.points >= u.xp : evalCond(u.cond))) return false;
    if (pay) S.points -= u.xp;
    S.thoughtSlots = u.slot; emit('toast', { text: 'Thought slot unlocked', kind: 'thought' }); emit('state'); return true;
  }
  function taskText(id) {
    const d = GD.tasks[id], t = S.tasks[id]; if (!d || !t) return '';
    if (t.state === 'done' && d.done) return d.done; if (t.state === 'failed' && d.failed) return d.failed;
    let txt = d.summary || ''; for (const st of d.stages || []) if (!st.cond || evalCond(st.cond)) txt = st.text; return txt;
  }
  const Game = {
    slotUnlocks, unlockSlot, taskText,
    on, emit, chanceOf, diffWord, newGame, load, save, hasSave, endingsSeen,
    get S() { return S; }, get D() { return D; },
    skill, attr, skillBase, skillMods, evalCond, sub, speakerInfo,
    startDialogue, choose, continueRoll, closeDialogue, runEffects, addTime,
    hotspots, npcsHere, interact, moveTo, update, teleport, loc, findPath, blockedSet,
    spendPoint, useItem, startThought, forgetThought, usedSlots, facingFrom,
    startEnding, queueEnding, dialogues, runAuto, beginDay, nextDay, variantId,
    _setState(s) { S = s; }
  };
  root.Game = Game;
  if (typeof module !== 'undefined') module.exports = Game;
})(typeof window !== 'undefined' ? window : globalThis);
