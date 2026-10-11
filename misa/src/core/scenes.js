// Scene stack. The top scene gets input; scenes draw bottom-up from the last opaque one.
// A scene is any object with optional: enter(game), exit(game), update(dt, input, game), tick(dt, game),
// draw(g, game), opaque (default true), pausesTime (default true), name, music.
export class SceneStack {
  constructor(game) { this.game = game; this.stack = []; }
  get top() { return this.stack[this.stack.length - 1]; }
  has(name) { return this.stack.some((s) => s.name === name); }
  find(name) { return this.stack.find((s) => s.name === name); }
  push(s) { this.stack.push(s); s.enter && s.enter(this.game); return s; }
  pop(s) {
    const i = s ? this.stack.lastIndexOf(s) : this.stack.length - 1;
    if (i < 0) return null;
    const [out] = this.stack.splice(i, 1);
    out.exit && out.exit(this.game);
    return out;
  }
  replaceAll(s) { while (this.stack.length) this.pop(); return this.push(s); }
  update(dt, input) {
    const snapshot = this.stack.slice(), t = snapshot[snapshot.length - 1];
    for (const s of snapshot) if (s !== t && s.tick && this.stack.includes(s)) s.tick(dt, this.game);
    if (t && t.update && this.stack.includes(t)) t.update(dt, input, this.game);
  }
  draw(g) {
    const st = this.stack.slice();
    let i = st.length - 1;
    while (i > 0 && st[i].opaque === false) i--;
    for (; i < st.length; i++) st[i].draw && st[i].draw(g, this.game);
  }
  get timeRuns() { return this.stack.length > 0 && this.top.pausesTime === false; }
}
