#!/usr/bin/env node
// Validates LAST BELL data files. Usage: node lastbell/tools/validate.js [--quiet]
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { window: {}, console };
ctx.window = ctx; ctx.GD = undefined; vm.createContext(ctx);
const files = ['world','skills','items','tasks','thoughts','barks','dialogue_a','dialogue_b'];
const errors = [], warns = [];
const err = (m) => errors.push(m), warn = (m) => warns.push(m);
for (const f of files) {
  const p = path.join(root, 'data', f + '.js');
  if (!fs.existsSync(p)) { warn(`missing data/${f}.js`); continue; }
  try { vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: p }); }
  catch (e) { err(`data/${f}.js failed to load: ${e.message}`); }
}
const GD = ctx.GD || {};
const dialogues = Object.assign({}, GD.dialoguesA || {}, GD.dialoguesB || {});
const SKILLS = ['dialectics','rote','deduction','rhetoric','doublethink','archive','empathy','volition','authority','instinct','charm','solidarity','stamina','grit','brawn','appetite','adrenaline','the_grey','aim','reflex','composure','slip','sleight','senses'];
const ITEMS = ['boiler_key','chalk_stub','torn_page','ration_coupon','cigarettes','ledger','rhea_pin','note_yesterday_1','note_yesterday_2','note_yesterday_3','radio_tube','bread_note','vanguard_armband','pocket_mirror','warden_badge','sweet_roll','ration_tea','exam_booklet','vasha_notebook','staged_rope','mic_cable','school_cap','bent_spoon'];
const TASKS = ['task_case','task_yesterday','task_ledger','task_rhea','task_exam','task_choir','task_radio','task_coupons','task_osk','task_anka','task_broadcast'];
const THOUGHTS = ['th_quiet_hands','th_good_citizen','th_unsanctioned','th_ghost_of_yesterday','th_bell_tolls','th_portrait_eyes','th_ration_math','th_marching_feet','th_chalk_dust','th_wheel_and_chair','th_hungry_ghost','th_informer_in_me','th_perfect_attendance','th_big_sister_state','th_anthem_earworm','th_collective_pulse','th_paper_heart','th_closed_window'];
const ENDINGS = ['end_good_student','end_ledger','end_static','end_quiet','end_arrested','end_curfew'];
const FIXED_FLAGS = new Set('met_vasha body_examined portrait_examined clue_boots clue_chalk clue_rope clue_mic read_note_1 read_note_2 read_note_3 knows_static knows_rhea rhea_confronted rhea_exposed osk_seen_you osk_scapegoat ilsabet_decoded bronka_trust marr_audience boiler_unlocked found_ledger ledger_with_anka exam_done exam_passed broadcast_ready fenwick_choir_ready vasha_ally vasha_report_read'.split(' '));
const NPCS = Object.keys(GD.npcs || {});
const OBJECTS = []; Object.values(GD.locations || {}).forEach(l => (l.objects || []).forEach(o => OBJECTS.push(o.id)));
const speakers = new Set([...SKILLS, ...NPCS, ...OBJECTS, 'narrator', 'you', 'portrait', 'bell', 'state', 'ostrov']);

// ---- world sanity
for (const [id, l] of Object.entries(GD.locations || {})) {
  for (const x of l.exits || []) if (x.to && !GD.locations[x.to]) err(`loc ${id}: exit ${x.id} -> unknown ${x.to}`);
  for (const n of l.npcs || []) if (!GD.npcs[n]) err(`loc ${id}: unknown npc ${n}`);
  for (const o of l.objects || []) if (!dialogues[o.id] && files.length) warn(`object ${o.id} has no dialogue`);
}
// ---- skills/items/tasks/thoughts coverage
const need = (obj, ids, label) => { if (!obj) return; ids.forEach(i => { if (!obj[i]) err(`${label}: missing ${i}`); }); };
need(GD.skills, SKILLS, 'GD.skills'); need(GD.items, ITEMS, 'GD.items'); need(GD.tasks, TASKS, 'GD.tasks'); need(GD.thoughts, THOUGHTS, 'GD.thoughts');
const scope = { flag:{}, has:()=>false, skill:()=>0, attr:()=>0, ideo:{vanguard:0,undercurrent:0,quiet:0}, surv:0, hp:10, morale:10, time:0, task:()=>'none', thought:()=>'none', visited:()=>false, talked:()=>0 };
function checkCond(c, where) {
  if (c == null) return;
  try { new Function(...Object.keys(scope), `return (${c});`); } catch (e) { err(`${where}: bad cond "${c}" (${e.message})`); return; }
  for (const m of c.matchAll(/flag\.([a-zA-Z0-9_]+)/g)) usedFlags.add(m[1]);
  for (const m of c.matchAll(/has\(['"]([^'"]+)['"]\)/g)) if (!ITEMS.includes(m[1])) err(`${where}: cond item ${m[1]}`);
  for (const m of c.matchAll(/skill\(['"]([^'"]+)['"]\)/g)) if (!SKILLS.includes(m[1])) err(`${where}: cond skill ${m[1]}`);
  for (const m of c.matchAll(/task\(['"]([^'"]+)['"]\)/g)) if (!TASKS.includes(m[1])) err(`${where}: cond task ${m[1]}`);
  for (const m of c.matchAll(/thought\(['"]([^'"]+)['"]\)/g)) if (!THOUGHTS.includes(m[1])) err(`${where}: cond thought ${m[1]}`);
}
const usedFlags = new Set(), setFlags = new Set();
const EFFECT_KEYS = ['set','add','give','take','xp','surv','hp','morale','time','thought','task','note','ideo','skillUp','goto','ending','toast','sfx','dialogue','x','y','val','n','state','text','node'];
function checkEffects(list, where) {
  if (list == null) return;
  if (!Array.isArray(list)) { err(`${where}: effects must be an array`); return; }
  list.forEach((e, i) => {
    const w = `${where}.effects[${i}]`;
    if (!e || typeof e !== 'object') { err(`${w}: not an object`); return; }
    for (const k of Object.keys(e)) if (!EFFECT_KEYS.includes(k)) err(`${w}: unknown key ${k}`);
    if (e.set) setFlags.add(e.set); if (e.add) setFlags.add(e.add);
    if ((e.give || e.take) && !ITEMS.includes(e.give || e.take)) err(`${w}: unknown item ${e.give || e.take}`);
    if (e.thought && !THOUGHTS.includes(e.thought)) err(`${w}: unknown thought ${e.thought}`);
    if (e.task && !TASKS.includes(e.task)) err(`${w}: unknown task ${e.task}`);
    if (e.task && !e.note && !['active','done','failed'].includes(e.state)) err(`${w}: bad task state`);
    if (e.note && !TASKS.includes(e.note) && !TASKS.includes(e.task)) err(`${w}: unknown note task ${e.note}`);
    if (e.skillUp && !SKILLS.includes(e.skillUp)) err(`${w}: unknown skill ${e.skillUp}`);
    if (e.ending && !ENDINGS.includes(e.ending)) err(`${w}: unknown ending ${e.ending}`);
    if (e.ideo && !['vanguard','undercurrent','quiet'].includes(e.ideo)) err(`${w}: bad ideo ${e.ideo}`);
    if (e.goto && !GD.locations[e.goto]) err(`${w}: unknown location ${e.goto}`);
    if (e.dialogue && !dialogues[e.dialogue]) err(`${w}: unknown dialogue ${e.dialogue}`);
  });
}
// ---- dialogues
const checkIds = new Map(); let nodeCount = 0, words = 0;
const REQUIRED = ['intro','enter_canteen','enter_gym','enter_courtyard','enter_office','enter_boiler','boiler_door','gate','accuse','exam',...ENDINGS.map(e => 'ending_' + e), ...NPCS, ...OBJECTS];
for (const r of REQUIRED) if (!dialogues[r]) (Object.keys(dialogues).length ? warn : () => {})(`missing dialogue: ${r}`);
for (const [did, d] of Object.entries(dialogues)) {
  const W = (n, extra='') => `${did}${n ? '.' + n : ''}${extra}`;
  if (!d.nodes || typeof d.nodes !== 'object') { err(`${did}: no nodes`); continue; }
  const ref = (id, where) => { if (id != null && !d.nodes[id]) err(`${where}: unknown node "${id}"`); };
  const starts = Array.isArray(d.start) ? d.start : [d.start];
  starts.forEach(s => { if (s && typeof s === 'object') { checkCond(s.cond, W('start')); ref(s.node, W('start')); } else ref(s, W('start')); });
  for (const [nid, n] of Object.entries(d.nodes)) {
    nodeCount++;
    const t = Array.isArray(n.text) ? n.text.join(' ') : n.text;
    if (typeof t !== 'string' || !t.trim()) err(W(nid) + ': empty text'); else words += t.split(/\s+/).length;
    if (n.speaker && !speakers.has(n.speaker)) err(W(nid) + `: unknown speaker "${n.speaker}"`);
    checkEffects(n.onEnter, W(nid) + '.onEnter');
    (n.interjections || []).forEach((j, i) => {
      const w = W(nid) + `.interjections[${i}]`;
      if (!SKILLS.includes(j.skill)) err(`${w}: unknown skill ${j.skill}`);
      if (typeof j.min !== 'number') err(`${w}: min must be number`);
      if (!j.text) err(`${w}: no text`); else words += String(j.text).split(/\s+/).length;
      checkCond(j.cond, w); checkEffects(j.effects, w);
    });
    (n.choices || []).forEach((c, i) => {
      const w = W(nid) + `.choices[${i}]`;
      if (!c.text) err(`${w}: no text`); else words += c.text.split(/\s+/).length;
      checkCond(c.cond, w); checkEffects(c.effects, w);
      if (c.check) {
        const k = c.check;
        if (!SKILLS.includes(k.skill)) err(`${w}: check skill ${k.skill}`);
        if (typeof k.diff !== 'number' || k.diff < 4 || k.diff > 20) err(`${w}: check diff ${k.diff}`);
        if (!k.id) err(`${w}: check needs id`);
        else if (checkIds.has(k.id)) err(`${w}: duplicate check id ${k.id} (also ${checkIds.get(k.id)})`); else checkIds.set(k.id, w);
        ref(k.pass, w + '.pass'); ref(k.fail, w + '.fail');
        if (k.pass == null || k.fail == null) err(`${w}: check needs pass+fail`);
        checkEffects(k.passEffects, w + '.pass'); checkEffects(k.failEffects, w + '.fail');
      } else if (c.dialogue) { if (!dialogues[c.dialogue]) err(`${w}: unknown dialogue ${c.dialogue}`); else if (c.node && !dialogues[c.dialogue].nodes[c.node]) err(`${w}: unknown node ${c.node} in ${c.dialogue}`); }
      else if (c.end) {} else if (c.goto === null) {} else if (c.goto) ref(c.goto, w); else err(`${w}: choice has no goto/check/end/dialogue`);
    });
  }
}
if (Object.keys(dialogues).length) for (const f of FIXED_FLAGS) if (usedFlags.has(f) && !setFlags.has(f)) warn(`flag ${f} is read but never set`);
if (Object.keys(dialogues).length) for (const f of usedFlags) if (!setFlags.has(f)) warn(`flag ${f} is read in a cond but never set by dialogue (ok if engine sets it)`);

if (!process.argv.includes('--quiet')) {
  console.log(`dialogues: ${Object.keys(dialogues).length}, nodes: ${nodeCount}, words: ${words}, checks: ${checkIds.size}`);
  warns.slice(0, 80).forEach(w => console.log('WARN  ' + w));
  if (warns.length > 80) console.log(`...and ${warns.length - 80} more warnings`);
}
errors.slice(0, 120).forEach(e => console.log('ERROR ' + e));
if (errors.length > 120) console.log(`...and ${errors.length - 120} more errors`);
console.log(errors.length ? `FAILED: ${errors.length} errors` : 'OK: no errors');
process.exit(errors.length ? 1 : 0);
