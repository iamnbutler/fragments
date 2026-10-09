/**
 * The cover press: pulls one of Nate's renders as a gradient-map proof.
 * The render's luminance is cut into a few flat steps of a spectrum map,
 * dithered with grain so the step edges stipple like ink, and printed over
 * paper mottle. When the cover arrives the steps develop from two to their
 * full count. The issue's own render prints first (`?cover=N` asks for
 * another); across the plate the pointer sets how many steps the proof
 * is cut into, and a click pulls a proof of another render. Looping renders
 * play while the cover's on screen, unless motion is reduced.
 */

import type { CoverWork } from '../lib/covers';

const VERT = `#version 300 es
in vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform float u_texAspect;
uniform vec2 u_focus;
uniform vec2 u_levels;
uniform vec3 u_c[8];
uniform int u_n;
uniform float u_steps;
uniform float u_scale;
uniform float u_seed;
out vec4 o;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { return 0.5 * vnoise(p) + 0.3 * vnoise(p * 2.1 + 3.1) + 0.2 * vnoise(p * 4.3 + 7.7); }
float grain(vec2 frag, float k) { return hash(floor(frag / u_scale) + k * 17.0 + u_seed); }

vec3 ramp(float t) {
  t = clamp(t, 0.0, 1.0) * float(u_n - 1);
  int i = int(floor(t));
  int j = min(i + 1, u_n - 1);
  return mix(u_c[i], u_c[j], fract(t));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = vec2(frag.x / u_res.x, 1.0 - frag.y / u_res.y);
  // cover-fit around the focus point
  float A = u_res.x / u_res.y;
  vec2 span = A > u_texAspect ? vec2(1.0, u_texAspect / A) : vec2(A / u_texAspect, 1.0);
  vec2 c = clamp(u_focus, span * 0.5, 1.0 - span * 0.5);
  vec2 st = c + (uv - 0.5) * span;

  vec3 src = texture(u_tex, st).rgb;
  float l = dot(src, vec3(0.2126, 0.7152, 0.0722));
  l = clamp((l - u_levels.x) / (u_levels.y - u_levels.x), 0.0, 1.0);
  l = pow(l, 0.9);

  // cut into steps; the grain decides each pixel at a step's edge
  float n = max(u_steps, 2.0);
  float d = (grain(frag, 1.0) - 0.5) * 0.6;
  float q = clamp(floor(l * (n - 1.0) + 0.5 + d), 0.0, n - 1.0) / (n - 1.0);
  vec3 col = ramp(q);

  // ink mottle, paper tooth, dropout
  float m = fbm(uv * vec2(A, 1.0) * 7.0 + u_seed);
  col *= 1.0 + (m - 0.5) * 0.07;
  col += (grain(frag, 2.0) - 0.5) * 0.07;
  col = mix(col, u_c[u_n - 1], step(0.9975, grain(frag, 5.0)) * 0.6);
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

const hex = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function coverPress(root: HTMLElement) {
  const cv = root.querySelector<HTMLElement>('.cv');
  const canvas = cv?.querySelector<HTMLCanvasElement>('.cv-gl');
  const plate = cv?.querySelector<HTMLButtonElement>('.cv-plate');
  if (!cv || !canvas || !plate) return;
  const works: CoverWork[] = JSON.parse(cv.dataset.works ?? '[]');
  const maps: Record<string, string[]> = JSON.parse(cv.dataset.maps ?? '{}');
  if (!works.length) return;

  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
  if (!gl) return;
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
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aLoc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(aLoc);
  gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string) => gl.getUniformLocation(prog, n);
  const U = {
    res: u('u_res'), texAspect: u('u_texAspect'), focus: u('u_focus'), levels: u('u_levels'),
    c: u('u_c'), n: u('u_n'), steps: u('u_steps'), scale: u('u_scale'), seed: u('u_seed'),
  };
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const pencil = {
    ed: cv.querySelector('.cv-ed')!,
    title: cv.querySelector('.cv-title')!,
  };
  const img = cv.querySelector<HTMLImageElement>('.cv-img')!;
  const BASE = 7;

  const asked = Number(new URLSearchParams(location.search).get('cover'));
  const start = Number(cv.dataset.start ?? 0);
  let index = Number.isInteger(asked) && asked >= 1 && asked <= works.length ? asked - 1 : start;
  let work = works[index];
  let source: HTMLImageElement | HTMLVideoElement | null = null;
  let steps = 2; // what's on the plate
  let want = BASE; // where it's heading
  let hover: number | null = null;
  let onScreen = false;
  let raf = 0;
  let last = 0;
  let seed = Math.random() * 400;

  const size = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const k = Math.min(1, 2400 / (r.width * dpr));
    const w = Math.round(r.width * dpr * k), h = Math.round(r.height * dpr * k);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    return dpr * k;
  };

  const draw = () => {
    if (!source) return;
    const scale = size();
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (source instanceof HTMLVideoElement) {
      if (source.readyState >= 2) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
    }
    const map = maps[work.map] ?? Object.values(maps)[0];
    const flat = new Float32Array(24);
    map.slice(0, 8).forEach((h, i) => flat.set(hex(h), i * 3));
    gl.uniform2f(U.res, canvas.width, canvas.height);
    gl.uniform1f(U.texAspect, work.aspect);
    gl.uniform2f(U.focus, work.focus[0], work.focus[1]);
    gl.uniform2f(U.levels, work.levels[0], work.levels[1]);
    gl.uniform3fv(U.c, flat);
    gl.uniform1i(U.n, Math.min(map.length, 8));
    gl.uniform1f(U.steps, Math.round(steps));
    gl.uniform1f(U.scale, scale);
    gl.uniform1f(U.seed, seed);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const playing = () => source instanceof HTMLVideoElement && !source.paused;

  // Steps move one at a time, a proof every ~90ms: it should feel pulled,
  // not tweened.
  const tick = (t: number) => {
    raf = 0;
    const target = hover ?? want;
    if (Math.round(steps) !== target && t - last > 90) {
      steps += Math.sign(target - steps);
      last = t;
    }
    draw();
    if (Math.round(steps) !== target || playing()) raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

  const load = (i: number) => {
    const w = works[i];
    const done = (el: HTMLImageElement | HTMLVideoElement) => {
      if (i !== index) return;
      if (source instanceof HTMLVideoElement && source !== el) { source.pause(); source.removeAttribute('src'); source.load(); }
      source = el;
      work = w;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, el);
      img.src = `/covers/${w.id}.jpg`;
      img.style.objectPosition = `${w.focus[0] * 100}% ${w.focus[1] * 100}%`;
      pencil.ed.textContent = `${i + 1}/${works.length}`;
      pencil.title.textContent = `Untitled, ${w.date}`;
      steps = reduced() ? want : 2;
      seed = Math.random() * 400;
      cv.classList.add('is-live');
      if (el instanceof HTMLVideoElement && onScreen && !reduced()) el.play().catch(() => {});
      kick();
    };
    if (w.video && !reduced()) {
      const v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto';
      v.crossOrigin = 'anonymous';
      v.addEventListener('loadeddata', () => done(v), { once: true });
      v.src = `/covers/${w.id}.mp4`;
      v.load();
    } else {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => done(im);
      im.src = `/covers/${w.id}.jpg`;
    }
  };

  plate.addEventListener('click', () => {
    index = (index + 1) % works.length;
    load(index);
  });
  plate.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = plate.getBoundingClientRect();
    hover = Math.round(3 + ((e.clientX - r.left) / r.width) * 13);
    kick();
  });
  plate.addEventListener('pointerleave', () => { hover = null; kick(); });

  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    if (source instanceof HTMLVideoElement) {
      if (onScreen && !reduced()) source.play().then(kick).catch(() => {});
      else source.pause();
    }
    if (onScreen) kick();
  }).observe(plate);

  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = window.setTimeout(kick, 120); });
  canvas.addEventListener('webglcontextlost', () => cv.classList.remove('is-live'));

  load(index);
}
