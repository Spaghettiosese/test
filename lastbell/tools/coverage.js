// Static + dynamic coverage: which items/thoughts/tasks/endings/flags can the dialogue actually produce?
const fs=require('fs'),path=require('path'),vm=require('vm');
global.window=global;global.localStorage={_d:{},getItem(k){return this._d[k]||null},setItem(k,v){this._d[k]=String(v)},removeItem(k){delete this._d[k]}};
const root=path.join(__dirname,'..');
for(const f of ['world','world_ext','skills','items','items_ext','tasks','tasks_ext','thoughts','thoughts_ext','barks','barks_ext','rules','rules_ext','dialogue_a','dialogue_b','dialogue_c','dialogue_d','dialogue_e','dialogue_f'])vm.runInThisContext(fs.readFileSync(path.join(root,'data',f+'.js'),'utf8'));
const GD=global.GD,dl=Object.assign({},GD.dialoguesA,GD.dialoguesB,GD.dialoguesC,GD.dialoguesD,GD.dialoguesE,GD.dialoguesF);
const given=new Set(),thoughts=new Set(),tasksA=new Set(),tasksD=new Set(),ends=new Set(),setF=new Set(),readF=new Set();
const walk=(o)=>{if(Array.isArray(o))return o.forEach(walk);if(o&&typeof o==='object'){if(o.give)given.add(o.give);if(o.thought&&typeof o.thought==='string')thoughts.add(o.thought);if(o.task&&o.state==='active')tasksA.add(o.task);if(o.note)tasksA.add(o.note);if(o.task&&o.state==='done')tasksD.add(o.task);if(o.ending)ends.add(o.ending);if(o.set)setF.add(o.set);if(o.add)setF.add(o.add);if(typeof o.cond==='string')for(const m of o.cond.matchAll(/flag\.(\w+)/g))readF.add(m[1]);Object.values(o).forEach(walk)}};
walk(dl);walk(GD.auto||[]);
for(const i of Object.values(GD.items))if(i.use)walk(i.use);
Object.values(GD.thoughts).forEach(t=>{if(t.effects)walk(t.effects)});
const miss=(label,all,have)=>{const m=all.filter(x=>!have.has(x));console.log(label,m.length?'MISSING: '+m.join(', '):'all covered')};
miss('items given:',Object.keys(GD.items),given);miss('thoughts discovered:',Object.keys(GD.thoughts),thoughts);
miss('tasks activated:',Object.keys(GD.tasks),tasksA);miss('tasks completed:',Object.keys(GD.tasks),tasksD);
console.log('endings reachable via effects:',[...ends].join(', '));
const never=[...readF].filter(f=>!setF.has(f));console.log('flags read but never set:',never.join(', ')||'none');
const unread=[...setF].filter(f=>!readF.has(f));console.log('flags set never read (info):',unread.length);
