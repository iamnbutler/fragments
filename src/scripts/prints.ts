/**
 * Prints: grainy, stepped printmaking gradients drawn by one shared WebGL2
 * context. Each `canvas.gp` is rendered once, at its own size, when it comes
 * near the viewport (and again if it's resized), then copied out, so the page
 * never holds more than one GL context however many prints it has.
 *
 * The grain is the point. Gradients are dithered by jittering the ramp
 * coordinate per pixel, so transitions stipple like ink on a screen instead
 * of banding, and every print gets paper mottle and dropout specks on top.
 */

import { PRINT_PALETTES, PRINT_MOTIFS, type PrintPalette } from '../lib/spectrum';

const VERT = `#version 300 es
in vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 u_res;
uniform float u_seed;
uniform int u_motif;
uniform vec3 u_c[8];
uniform int u_n;
uniform vec3 u_paper;
uniform float u_grain;
uniform float u_scale;
out vec4 o;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float h1(float k) { return hash(vec2(u_seed * 0.0137 + k * 1.618, k * 0.731 + 0.17)); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { return 0.5 * vnoise(p) + 0.3 * vnoise(p * 2.1 + 3.1) + 0.2 * vnoise(p * 4.3 + 7.7); }

// grain sampled per device pixel-ish, so it stays fine at any size
float grainAt(vec2 frag, float k) { return hash(floor(frag / u_scale) + k * 17.0 + u_seed); }

vec3 ramp(float t) {
  t = clamp(t, 0.0, 1.0) * float(u_n - 1);
  int i = int(floor(t));
  int j = min(i + 1, u_n - 1);
  return mix(u_c[i], u_c[j], fract(t));
}
// a dithered ramp lookup: the grainy-gradient look
vec3 inkRamp(float t, vec2 frag, float spread) {
  return ramp(t + (grainAt(frag, 1.0) - 0.5) * spread * u_grain);
}
vec3 inkRampLoop(float t, vec2 frag, float spread) {
  float x = fract(t + (grainAt(frag, 1.0) - 0.5) * spread * u_grain);
  return ramp(x);
}

float aa(float d, float w) { return 1.0 - smoothstep(-w, w, d); }

float sdSeg(vec2 p, vec2 a, vec2 b, out float h) {
  vec2 pa = p - a, ba = b - a;
  h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = vec2(frag.x / u_res.x, 1.0 - frag.y / u_res.y);
  float asp = u_res.x / u_res.y;
  vec2 p = vec2(uv.x * asp, uv.y);       // y-unit space
  float px = 1.0 / u_res.y;              // one pixel in p units
  vec3 col = u_paper;
  float spread = 0.09;

  if (u_motif == 0) {
    // sweep: one long grainy gradient, gently bowed
    float t = uv.x + 0.05 * sin(uv.y * 3.0 + u_seed) * (h1(1.0) - 0.5) * 2.0;
    col = inkRamp(t, frag, 0.12);
  } else if (u_motif == 1) {
    // steps: a swatch sheet. A smooth run on top, then the same run cut into
    // finer and coarser steps below it, each tier fading in from the last.
    float x = uv.x;
    float smoothT = x;
    float tiers[4] = float[4](0.0, 0.34, 0.6, 0.82);
    float counts[4] = float[4](0.0, 26.0, 13.0, 7.0);
    col = inkRamp(smoothT, frag, 0.14);
    for (int k = 1; k < 4; k++) {
      if (uv.y >= tiers[k]) {
        float n = counts[k];
        float q = (floor(x * n) + 0.5) / n;
        float fade = smoothstep(tiers[k], tiers[k] + 0.07, uv.y + (grainAt(frag, 3.0) - 0.5) * 0.05 * u_grain);
        vec3 stepped = inkRamp(q, frag, 0.035);
        // tier above fades out under this one
        col = mix(col, stepped, fade);
      }
    }
    // the very top dissolves into the paper
    float top = smoothstep(0.0, 0.16, uv.y + (grainAt(frag, 4.0) - 0.5) * 0.08 * u_grain);
    col = mix(mix(u_paper, col, 0.35), col, top);
  } else if (u_motif == 2) {
    // rings: concentric bands, each a conic sweep of the loop palette with a
    // lit outer rim and a shadowed inner edge, separated by dark gaps
    // sized to sit inside the frame with a margin of toner, as on the sheet
    float R = min(asp, 1.0) * (0.4 + 0.05 * h1(4.0));
    vec2 c = vec2(asp * 0.5 + (h1(2.0) - 0.5) * (asp - 2.0 * R) * 0.5, 0.5 + (h1(3.0) - 0.5) * (1.0 - 2.0 * R) * 0.6);
    vec2 d = p - c;
    float r = length(d) / R;
    float K = 4.0 + floor(h1(5.0) * 2.0);
    if (r < 1.0) {
      float s = pow(r, 0.85) * K;
      float k = floor(s);
      float f = fract(s);
      float ang = atan(d.y, d.x) / 6.2831853 + 0.5;
      float t = ang + k * (0.21 + 0.2 * h1(6.0)) + h1(7.0) + f * 0.18;
      vec3 band = inkRampLoop(t, frag, 0.07);
      float shade = mix(0.18, 1.0, smoothstep(0.0, 0.55, f));
      band *= shade;
      // lit rim on the outer edge of each band
      float rim = smoothstep(0.86, 0.97, f);
      band = mix(band, mix(u_c[0], band, 0.35), rim * 0.85);
      // gaps
      float edge = px * K / R * 1.4;
      float gap = smoothstep(0.0, edge * 2.0, f) * (1.0 - smoothstep(1.0 - edge * 1.2, 1.0, f));
      col = mix(u_paper * 0.85, band, gap);
      col = mix(col, u_paper, smoothstep(1.0 - px / R * 1.5, 1.0, r));
    }
  } else if (u_motif == 3) {
    // woven: rounded bars in a chevron, each a short gradient between inks
    float cx = asp * 0.5;
    float span = min(asp * 0.36, 0.3);
    float rad = span * 0.15;
    float rows = 5.0;
    float dy = (0.84 - span) / (rows - 1.0);
    // right arms first, so each left arm lies over its partner
    for (int side = 1; side >= 0; side--) {
      for (int j = 0; j < 5; j++) {
        float y = 0.08 + float(j) * dy;
        vec2 a = side == 0 ? vec2(cx - span, y) : vec2(cx, y + span);
        vec2 b = side == 0 ? vec2(cx, y + span) : vec2(cx + span, y);
        float h;
        float dist = sdSeg(p, a, b, h) - rad;
        if (dist < px * 1.5) {
          float k = float(j * 2 + side);
          float t0 = 0.12 + 0.62 * h1(10.0 + k);
          float t1 = clamp(t0 + (h1(30.0 + k) - 0.5) * 0.7, 0.05, 0.92);
          vec3 pill = inkRamp(mix(t0, t1, h), frag, 0.1);
          // a soft shadow where one bar crosses another
          col = mix(col, col * 0.86, aa(dist - rad * 0.35, rad * 0.5) * (1.0 - aa(dist, px)));
          col = mix(col, pill, aa(dist, px));
        }
      }
    }
  } else if (u_motif == 4) {
    // stair: bars that run pink → blue → black, each restarting at a step
    float n = 9.0;
    float i = floor(uv.y * n);
    float fy = fract(uv.y * n);
    float s = 1.0 - (i + 1.0) / (n + 1.0) * (0.9 + 0.1 * h1(8.0));
    float t;
    if (uv.x < s) t = pow(uv.x / s, 0.8);
    else t = (uv.x - s) / (1.0 - s) * 0.62;
    col = inkRamp(t, frag, 0.12);
    // a hairline between bars
    col *= mix(0.9, 1.0, smoothstep(0.0, 0.03, fy));
  } else if (u_motif == 5) {
    // drop: flat ink bands falling into a point, banded by the log of the
    // distance so they crowd toward the bottom
    vec2 c = vec2(asp * 0.5, 0.97);
    vec2 d = (p - c) * vec2(1.0, 0.72 + 0.12 * h1(9.0));
    float e = length(d);
    float f = log(e + 0.004) * (5.5 + 2.0 * h1(11.0)) + h1(12.0) * 5.0;
    int idx = int(mod(floor(f), float(u_n)));
    float within = fract(f);
    col = u_c[idx];
    float w = fwidth(f) * 1.2;
    col = mix(u_c[int(mod(floor(f) - 1.0, float(u_n)))], col, smoothstep(0.0, w, within));
    // where bands get finer than a few pixels, the ink fills in
    col = mix(col, u_c[u_n - 1], smoothstep(0.12, 0.3, fwidth(f)));
    // sit inside the frame
    float inFrame = step(0.0, e) * (1.0 - smoothstep(0.64 - px, 0.64 + px, e * 0.9 / max(asp, 0.7)));
    col = mix(u_paper, col, inFrame);
  } else if (u_motif == 6) {
    // rays: four quadrants of radiating lines over fading floods, crumpled
    vec2 q = uv * 2.0;
    vec2 cell = floor(q);
    vec2 l = fract(q);
    float k = cell.x + cell.y * 2.0;
    float corner = floor(h1(20.0 + k) * 4.0);
    vec2 o = vec2(mod(corner, 2.0), floor(corner / 2.0));
    vec2 v = abs(l - o);
    float ang = atan(v.y, v.x);
    float fl = ang * (10.0 + 6.0 * h1(24.0 + k));
    float lw = fwidth(fl);
    float lineMask = smoothstep(0.32 + lw, 0.32 - lw, abs(fract(fl) - 0.5));
    lineMask *= smoothstep(0.02, 0.08, length(v)); // they blur together at the source
    int ia = int(mod(k + floor(h1(26.0) * 4.0), float(u_n)));
    int ib = int(mod(float(ia) + 1.0 + floor(h1(27.0 + k) * 2.0), float(u_n)));
    float flood = smoothstep(0.05, 1.2, length(v) + (fbm(l * 3.0 + k) - 0.5) * 0.3);
    vec3 base = mix(u_paper, u_c[ia], flood * 0.92);
    col = mix(base, u_c[ib] * mix(1.0, 0.85, flood), lineMask * mix(0.55, 1.0, flood));
    // crumple: a low ridge field
    float cr = fbm(uv * vec2(3.0, 4.0) + u_seed);
    col *= 0.94 + 0.12 * cr;
  }

  // ── print it: ink mottle, paper tooth, dropout specks ────────────────────
  float m = fbm(uv * vec2(asp, 1.0) * 9.0 + u_seed);
  col *= 1.0 + (m - 0.5) * 0.06 * u_grain;
  float g = grainAt(frag, 2.0) - 0.5;
  col += g * 0.075 * u_grain;
  float speck = step(1.0 - 0.0025 * u_grain, grainAt(frag, 5.0));
  col = mix(col, u_paper, speck * 0.55);
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

const hex = (h: string): [number, number, number] => {
  const n = parseInt(h.replace('#', ''), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

interface Renderer {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  loc: Record<string, WebGLUniformLocation | null>;
}

let renderer: Renderer | null | undefined;
let grain = 1;

function init(): Renderer | null {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false });
  if (!gl) return null;
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) ?? 'link');
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const a = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(a);
  gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
  const loc: Renderer['loc'] = {};
  for (const n of ['u_res', 'u_seed', 'u_motif', 'u_c', 'u_n', 'u_paper', 'u_grain', 'u_scale']) loc[n] = gl.getUniformLocation(prog, n);
  return { gl, canvas, loc };
}

/** Paint one print canvas at its current size. Returns false without WebGL2. */
export function paint(target: HTMLCanvasElement): boolean {
  if (renderer === undefined) {
    try { renderer = init(); } catch (e) { console.warn('prints:', e); renderer = null; }
  }
  if (!renderer) return false;
  const { gl, canvas, loc } = renderer;
  const rect = target.getBoundingClientRect();
  if (!rect.width || !rect.height) return false;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const scale = Math.min(1, 2048 / Math.max(rect.width * dpr, rect.height * dpr));
  const w = Math.round(rect.width * dpr * scale);
  const h = Math.round(rect.height * dpr * scale);
  canvas.width = w;
  canvas.height = h;
  gl.viewport(0, 0, w, h);

  const motif = Math.max(0, PRINT_MOTIFS.indexOf((target.dataset.motif ?? 'sweep') as never));
  const palette = (target.dataset.palette ?? 'spectrum') as PrintPalette;
  const stops = (PRINT_PALETTES[palette] ?? PRINT_PALETTES.spectrum).slice(0, 8);
  const flat = new Float32Array(24);
  stops.forEach((s, i) => flat.set(hex(s), i * 3));
  gl.uniform2f(loc.u_res, w, h);
  gl.uniform1f(loc.u_seed, Number(target.dataset.seed ?? 1) % 997);
  gl.uniform1i(loc.u_motif, motif);
  gl.uniform3fv(loc.u_c, flat);
  gl.uniform1i(loc.u_n, stops.length);
  gl.uniform3fv(loc.u_paper, hex(target.dataset.paper ?? '#ECE9E3'));
  gl.uniform1f(loc.u_grain, grain * Number(target.dataset.grain ?? 1));
  gl.uniform1f(loc.u_scale, dpr * scale);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  target.width = w;
  target.height = h;
  target.getContext('2d')!.drawImage(canvas, 0, 0);
  target.dataset.painted = `${Math.round(rect.width)}x${Math.round(rect.height)}`;
  target.classList.add('is-painted');
  return true;
}

/** Paint every print near the viewport, and keep them sharp through resizes. */
export function prints(root: ParentNode = document) {
  const all = [...root.querySelectorAll<HTMLCanvasElement>('canvas.gp')];
  if (!all.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) { paint(e.target as HTMLCanvasElement); io.unobserve(e.target); }
    },
    { rootMargin: '120% 0px' },
  );
  all.forEach((c) => io.observe(c));

  let t = 0;
  addEventListener('resize', () => {
    clearTimeout(t);
    t = window.setTimeout(() => {
      for (const c of all) {
        if (!c.dataset.painted) continue;
        const r = c.getBoundingClientRect();
        const [w, h] = c.dataset.painted.split('x').map(Number);
        if (Math.abs(r.width - w) / w > 0.12 || Math.abs(r.height - h) / h > 0.12) paint(c);
      }
    }, 200);
  });
}

/** Re-ink every painted print with a new grain amount (styleguide knob). */
export function setGrain(amount: number) {
  grain = amount;
  for (const c of document.querySelectorAll<HTMLCanvasElement>('canvas.gp.is-painted')) paint(c);
}
