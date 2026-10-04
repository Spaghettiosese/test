// Chapter 4 (placeholder while the chapter is written).
export class Chapter4 {
  constructor(g, c) { this.g = g; this.c = c; this.s = {}; }
  prologue() { return []; }
  start() {}
  world() {}
  update() {}
  targetFor() { return null; }
  save() { return this.s; }
  load(d) { this.s = d || {}; }
}
