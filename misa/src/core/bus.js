// Minimal event bus. Systems subscribe at init; the engine emits:
//   dayStart {day}, dayEnd {day}, hour {h}, mapEnter {map}, talk {npc}, gift {npc,item,reaction},
//   itemGot {item,n}, itemUsed {item}, moneyChanged {money,delta}, minigameDone {id,result},
//   questDone {id}, sleep {}, interact {obj}, achievement {id}
export class Bus {
  constructor() { this.h = {}; }
  on(ev, fn) { (this.h[ev] ||= []).push(fn); return () => this.off(ev, fn); }
  off(ev, fn) { this.h[ev] = (this.h[ev] || []).filter((f) => f !== fn); }
  emit(ev, data) { for (const f of this.h[ev] || []) { try { f(data); } catch (e) { console.error(`[${ev}]`, e); } } }
}
