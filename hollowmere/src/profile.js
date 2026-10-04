// What outlives a single playthrough: achievements, the chapters you have reached, the endings you
// have seen, and what a New Game+ carries over. Kept in its own localStorage key, so deleting a
// save never takes an achievement with it.
const KEY = 'hollowmere.profile.v1';

export class Profile {
  constructor() { this.d = this.read(); }
  read() {
    let d = null; try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { d = null; }
    return { ach: {}, chapters: ['c1'], endings: [], ng: 0, runs: 0, carry: null, ...(d || {}) };
  }
  write() { try { localStorage.setItem(KEY, JSON.stringify(this.d)); } catch { /* storage unavailable: the profile lives for this session */ } }
  has(id) { return !!this.d.ach[id]; }
  unlock(id) { if (this.d.ach[id]) return false; this.d.ach[id] = Date.now(); this.write(); return true; }
  reachChapter(id) { if (!this.d.chapters.includes(id)) { this.d.chapters.push(id); this.write(); } }
  chapterOpen(id) { return this.d.chapters.includes(id); }
  sawEnding(id) { if (!this.d.endings.includes(id)) { this.d.endings.push(id); this.write(); } }
  setCarry(c) { this.d.carry = c; this.write(); }
  takeCarry() { const c = this.d.carry; this.d.carry = null; this.write(); return c; }
  // a reload is how the game starts afresh; this flag says what to start
  setPending(p) { try { sessionStorage.setItem('hollowmere.pending', JSON.stringify(p)); } catch { /* ignore */ } }
  takePending() { try { const p = JSON.parse(sessionStorage.getItem('hollowmere.pending') || 'null'); sessionStorage.removeItem('hollowmere.pending'); return p; } catch { return null; } }
}
