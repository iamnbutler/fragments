/**
 * The cover, printed by a shader. The art is drawn once into the three
 * channels of a texture (R = pink plate, G = red plate, B = key plate);
 * the fragment shader then prints each plate in turn: a roller wipes it on,
 * it lands out of register and springs toward rest, the red plate is
 * screened to halftone, solids get mottled ink and dropout specks, and the
 * pointer knocks the plates apart.
 */

import { SPOT, PAPERS } from '../lib/spectrum';

/** A hex ink as a GLSL vec3, so the shader prints in the same inks as the CSS. */
const v3 = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `vec3(${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => (c / 255).toFixed(3)).join(', ')})`;
};

const VERT = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform sampler2D u_art;
uniform vec2 u_res;
uniform vec2 u_o0;
uniform vec2 u_o1;
uniform vec2 u_o2;
uniform vec3 u_prog;
uniform float u_t;
uniform float u_dpr;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float screen(float v, vec2 p, float ang, float cell) {
  float c = cos(ang), s = sin(ang);
  vec2 q = mat2(c, -s, s, c) * p / cell;
  float d = length(fract(q) - 0.5);
  float r = sqrt(clamp(v, 0.0, 1.0)) * 0.74;
  float aa = 1.2 / cell;
  return smoothstep(r + aa, r - aa, d);
}
float reveal(float prog, vec2 px, float k) {
  float edge = prog * u_res.y * 1.2 + (noise(vec2(px.x * 0.01 + k, u_t * 0.3)) - 0.5) * 60.0 * u_dpr;
  return smoothstep(edge, edge - 24.0 * u_dpr, px.y);
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, u_res.y - gl_FragCoord.y);
  float pink = texture2D(u_art, (px - u_o0) / u_res).r;
  float orng = texture2D(u_art, (px - u_o1) / u_res).g;
  float key  = texture2D(u_art, (px - u_o2) / u_res).b;

  pink *= reveal(u_prog.x, px, 1.0);
  orng *= reveal(u_prog.y, px, 7.0);
  key  *= reveal(u_prog.z, px, 13.0);

  vec2 cellp = floor(px / (1.5 * u_dpr));
  float mottle0 = 0.8 + 0.2 * noise(px * vec2(0.004, 0.05) / u_dpr);
  float mottle2 = 0.9 + 0.1 * noise(px * vec2(0.03, 0.006) / u_dpr + 9.0);
  float drop0 = step(0.012, hash(cellp + 3.1));
  float drop1 = step(0.01, hash(cellp + 5.7));
  float drop2 = step(0.008, hash(cellp + 1.3));

  float pinkInk = pink * mottle0 * drop0;
  float orngInk = screen(orng, px, 0.26, 6.5 * u_dpr) * drop1 * 0.96;
  float keyInk  = smoothstep(0.35, 0.65, key) * mottle2 * drop2;

  vec3 paper = ${v3(PAPERS.newsprint)} * (0.975 + 0.025 * hash(floor(px / u_dpr)));
  vec3 col = paper;
  col *= mix(vec3(1.0), ${v3(SPOT.pink)}, pinkInk);
  col *= mix(vec3(1.0), ${v3(SPOT.red)}, orngInk);
  col *= mix(vec3(1.0), vec3(0.06, 0.055, 0.06), keyInk);
  gl_FragColor = vec4(col, 1.0);
}
`;

export async function printCover(sheet: HTMLElement) {
  const canvas = sheet.querySelector<HTMLCanvasElement>('canvas.cover-gl');
  const spread = sheet.querySelector<HTMLElement>('.spread');
  if (!canvas || !spread) return;
  const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
  if (!gl) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  try {
    await Promise.race([
      document.fonts.load('900 100px Archivo'),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {}

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const u = (n: string) => gl.getUniformLocation(prog, n);
  const U = { res: u('u_res'), o0: u('u_o0'), o1: u('u_o1'), o2: u('u_o2'), prog: u('u_prog'), t: u('u_t'), dpr: u('u_dpr') };

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  let dpr = 1;
  const art = document.createElement('canvas');

  const paint = () => {
    dpr = Math.min(2, devicePixelRatio || 1);
    const box = spread.getBoundingClientRect();
    const W = Math.round(box.width * dpr), H = Math.round(box.height * dpr);
    canvas.width = art.width = W;
    canvas.height = art.height = H;
    const c = art.getContext('2d')!;
    c.fillStyle = '#000';
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'lighter';
    const rel = (el: Element | null) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: (r.left - box.left) * dpr, y: (r.top - box.top) * dpr, w: r.width * dpr, h: r.height * dpr };
    };

    // pink plate: the block, a run of collage stripes, and a ghost of the masthead
    const pb = rel(sheet.querySelector('.cp-pink'));
    if (pb) {
      c.fillStyle = 'rgb(255,0,0)';
      c.fillRect(pb.x, pb.y, pb.w, pb.h);
    }
    // red plate: a sun, screened from a gradient
    const ob = rel(sheet.querySelector('.cp-red'));
    if (ob) {
      const cx = ob.x + ob.w * 0.5, cy = ob.y + ob.h * 0.5, R = ob.w * 0.5;
      const g = c.createRadialGradient(cx - R * 0.2, cy - R * 0.24, R * 0.05, cx, cy, R);
      g.addColorStop(0, 'rgb(0,255,0)');
      g.addColorStop(0.55, 'rgb(0,200,0)');
      g.addColorStop(0.985, 'rgb(0,70,0)');
      g.addColorStop(1, 'rgb(0,0,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(cx, cy, R, 0, Math.PI * 2);
      c.fill();
      // triangle teeth along the bottom-left, after the patent collage
      c.fillStyle = 'rgb(0,255,0)';
      if (pb) {
        const ty = pb.y + pb.h, n = 5, tw = pb.w / n;
        for (let i = 0; i < n; i++) {
          c.beginPath();
          c.moveTo(pb.x + i * tw, ty);
          c.lineTo(pb.x + (i + 0.5) * tw, ty + tw * 0.55);
          c.lineTo(pb.x + (i + 1) * tw, ty);
          c.fill();
        }
      }
    }
    // masthead on the key plate, doubled on the pink plate
    const mh = sheet.querySelector<HTMLElement>('.masthead .reg-in');
    if (mh) {
      const cs = getComputedStyle(mh);
      const size = parseFloat(cs.fontSize) * dpr;
      const m = rel(mh)!;
      c.font = `900 ${size}px Archivo, sans-serif`;
      try { (c as any).fontStretch = 'ultra-expanded'; } catch {}
      try { (c as any).letterSpacing = `${-0.035 * size}px`; } catch {}
      c.textBaseline = 'alphabetic';
      const text = mh.dataset.text ?? 'nate.rip';
      const tm = c.measureText(text);
      const base = m.y + m.h / 2 + (tm.actualBoundingBoxAscent - tm.actualBoundingBoxDescent) / 2;
      c.fillStyle = 'rgb(0,0,255)';
      c.fillText(text, m.x, base);
      c.fillStyle = 'rgb(255,0,0)';
      c.fillText(text, m.x + size * 0.018, base + size * 0.012);
    }
    gl.viewport(0, 0, W, H);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, art);
    gl.uniform2f(U.res, W, H);
    gl.uniform1f(U.dpr, dpr);
  };

  // plates: [start offset, rest offset, push factor] in CSS px
  const plates = [
    { from: [-70, 34], rest: [3.5, -2.5], push: 16, at: 120 },
    { from: [48, -60], rest: [-2.5, 3], push: -10, at: 560 },
    { from: [-24, 46], rest: [0, 0], push: 4, at: 1000 },
  ];
  let px = 0, py = 0, tpx = 0, tpy = 0;
  let t0 = performance.now();
  let lastMove = 0;
  let visible = true;
  let raf = 0;

  const frame = (now: number) => {
    const t = reduced ? 1e6 : now - t0;
    px += (tpx - px) * 0.08;
    py += (tpy - py) * 0.08;
    const progs: number[] = [];
    plates.forEach((p, i) => {
      const lt = Math.max(0, t - p.at);
      const k = Math.min(1, lt / 900);
      progs.push(1 - Math.pow(1 - k, 3));
      const s = lt / 1000;
      const spring = Math.exp(-4.2 * s) * Math.cos(9 * s);
      const ox = p.rest[0] + p.from[0] * spring + px * p.push;
      const oy = p.rest[1] + p.from[1] * spring + py * p.push;
      gl.uniform2f([U.o0, U.o1, U.o2][i], ox * dpr, oy * dpr);
    });
    gl.uniform3f(U.prog, progs[0], progs[1], progs[2]);
    gl.uniform1f(U.t, t / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    const settling = t < 2600 || now - lastMove < 1600 || Math.abs(tpx - px) + Math.abs(tpy - py) > 0.002;
    raf = visible && settling && !reduced ? requestAnimationFrame(frame) : 0;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  paint();
  sheet.classList.add('gl-on');
  kick();

  let rt = 0;
  new ResizeObserver(() => {
    clearTimeout(rt);
    rt = window.setTimeout(() => { paint(); kick(); }, 120);
  }).observe(spread);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(sheet);
  if (!reduced) {
    spread.addEventListener('pointermove', (e) => {
      const r = spread.getBoundingClientRect();
      tpx = (e.clientX - r.left) / r.width - 0.5;
      tpy = (e.clientY - r.top) / r.height - 0.5;
      lastMove = performance.now();
      kick();
    });
    spread.addEventListener('pointerleave', () => { tpx = 0; tpy = 0; lastMove = performance.now(); kick(); });
    // pressing reprints the cover
    spread.addEventListener('dblclick', () => { t0 = performance.now(); kick(); });
  }
  canvas.addEventListener('webglcontextlost', () => sheet.classList.remove('gl-on'));
}
