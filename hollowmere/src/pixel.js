// The pixel look: the engine renders the 3D scene into a small hidden canvas (about 480x270),
// and this pass reads it back as a texture, grades it towards the game's violet-and-ember
// palette, then quantizes every channel to a few levels with an 8x8 ordered (Bayer) dither.
// The display canvas is the same tiny size, scaled up with nearest-neighbour filtering by CSS,
// so every game pixel is a hard-edged square, like a 90s dungeon crawler.
const VS = `#version 300 es
out vec2 vUv;
void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); vUv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uTex; uniform vec2 uRes; uniform vec3 uLevels; uniform float uDither, uTime, uHurt, uFade, uVeil, uGrain, uEdge;
uniform vec3 uShadow, uHigh;
float bayer(vec2 p) {
  ivec2 i = ivec2(mod(p, 8.0)); int x = i.x, y = i.y; int a = x ^ y;
  int v = ((a & 1) << 5) | ((y & 1) << 4) | ((a & 2) << 2) | ((y & 2) << 1) | ((a & 4) >> 1) | ((y & 4) >> 2);
  return (float(v) + 0.5) / 64.0;
}
float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
void main() {
  vec2 px = vUv * uRes; vec2 uv = vUv;
  vec3 c = texture(uTex, uv).rgb;
  // edge darkening on strong luminance steps: gives sprites and bricks a hand-inked outline
  if (uEdge > 0.0) {
    vec2 t = 1.0 / uRes; float l = luma(c);
    float d = abs(l - luma(texture(uTex, uv + vec2(t.x, 0.0)).rgb)) + abs(l - luma(texture(uTex, uv + vec2(0.0, t.y)).rgb));
    c *= 1.0 - smoothstep(0.16, 0.5, d) * uEdge;
  }
  float L = luma(c);
  // split tone: violet shadows, ember highlights
  c = mix(c, c * (vec3(1.0) + uHigh * 0.6), smoothstep(0.35, 0.9, L));
  c += uShadow * pow(1.0 - clamp(L * 1.6, 0.0, 1.0), 2.0) * 0.22;
  c = pow(max(c, 0.0), vec3(0.94));
  // stealth veil: everything drains towards cold blue-grey
  c = mix(c, vec3(L) * vec3(0.55, 0.7, 1.0) + vec3(0.02, 0.03, 0.08), uVeil * 0.55);
  // damage flash
  c = mix(c, vec3(0.7, 0.05, 0.08), uHurt * 0.45);
  float b = (bayer(floor(px)) - 0.5) * uDither;
  vec3 lv = uLevels - 1.0;
  c = floor(c * lv + 0.5 + b) / lv;
  c += (fract(sin(dot(floor(px) + floor(uTime * 12.0), vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * uGrain;
  o = vec4(c * (1.0 - uFade), 1.0);
}`;

export class PixelDisplay {
  // host: the visible canvas (tiny drawing buffer, CSS-scaled); source: the engine's canvas
  constructor(host, source) {
    this.canvas = host; this.source = source;
    const gl = this.gl = host.getContext('webgl2', { antialias: false, alpha: false });
    if (!gl) throw new Error('WebGL2 is not available in this browser.');
    const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
    const p = this.prog = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    this.u = {}; for (const n of ['uTex', 'uRes', 'uLevels', 'uDither', 'uTime', 'uHurt', 'uFade', 'uVeil', 'uGrain', 'uEdge', 'uShadow', 'uHigh']) this.u[n] = gl.getUniformLocation(p, n);
    this.tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.tex);
    for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
    this.vao = gl.createVertexArray();
    // look controls
    this.levels = [9, 8, 7]; this.dither = 0.9; this.hurt = 0; this.fade = 0; this.veil = 0; this.grain = 0.012; this.edge = 0.5;
    this.shadow = [0.32, 0.12, 0.5]; this.high = [0.35, 0.12, -0.1];
    this.time = 0;
  }
  present(dt) {
    const gl = this.gl, u = this.u, c = this.canvas, s = this.source;
    if (c.width !== s.width || c.height !== s.height) { c.width = s.width; c.height = s.height; }
    this.time += dt;
    gl.viewport(0, 0, c.width, c.height);
    gl.useProgram(this.prog); gl.bindVertexArray(this.vao);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, s);
    gl.uniform1i(u.uTex, 0); gl.uniform2f(u.uRes, c.width, c.height);
    gl.uniform3fv(u.uLevels, this.levels); gl.uniform1f(u.uDither, this.dither); gl.uniform1f(u.uTime, this.time);
    gl.uniform1f(u.uHurt, this.hurt); gl.uniform1f(u.uFade, this.fade); gl.uniform1f(u.uVeil, this.veil); gl.uniform1f(u.uGrain, this.grain); gl.uniform1f(u.uEdge, this.edge);
    gl.uniform3fv(u.uShadow, this.shadow); gl.uniform3fv(u.uHigh, this.high);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}

// Pick the internal resolution: fixed height, width follows the window's aspect.
export function internalSize(height = 270, maxAspect = 2.4, minAspect = 1.2) {
  const a = Math.min(maxAspect, Math.max(minAspect, innerWidth / Math.max(1, innerHeight)));
  return [Math.round(height * a), height];
}
