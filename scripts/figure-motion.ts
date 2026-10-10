/**
 * Looping versions of the process figures. Each one takes the still figure
 * from media and adds SMIL motion: tokens that travel the arrows, steps that
 * take a tint of the ink while they're active, and things that slide. The
 * page swaps the loop in while the figure is in view (src/scripts/figmotion.ts).
 *
 * Every animation in a figure shares one clock (dur D, begin 0, repeating), so
 * timings below are fractions of the loop.
 *
 *   npm run figure-motion [-- <figure> ...] [--out <dir>]
 *
 * It writes `<figure>-motion.svg` files and prints the `npm run media -- put`
 * line for each. The stills are read from the published site, so this needs
 * no Cloudflare credentials until you upload.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import manifest from '../src/media.json' with { type: 'json' };

const SITE = 'https://fragments.iamnbutler.workers.dev';
const EASE = '.45 0 .25 1';
const LIN = '0 0 1 1';

type Stop<T> = [number, T];

/** a fraction, as short as it can be written */
const f = (x: number) => (x ? x.toFixed(4).replace(/0+$/, '').replace(/\.$/, '') : '0');

class Fig {
  svg = '';
  add: string[] = [];
  constructor(readonly name: string, readonly D: number) {}

  common() { return `dur="${this.D}s" begin="0s" repeatCount="indefinite"`; }

  /** stops -> keyTimes, values and keySplines, eased wherever the value changes */
  stops<T>(stops: Stop<T>[]): [string, T[], string] {
    if (stops[0][0] > 0) stops = [[0, stops[0][1]], ...stops];
    if (stops[stops.length - 1][0] < 1) stops = [...stops, [1, stops[stops.length - 1][1]]];
    const kt = stops.map(([t]) => f(t)).join(';');
    const vals = stops.map(([, v]) => v);
    const same = (a: T, b: T) => JSON.stringify(a) === JSON.stringify(b);
    const spl = vals.slice(1).map((b, i) => (same(vals[i], b) ? LIN : EASE)).join(';');
    return [kt, vals, spl];
  }

  /** discrete opacity: visible within any [t0, t1) span */
  visible(spans: [number, number][]) {
    const pts: Stop<number>[] = [[0, 0]];
    for (const [a, b] of spans) pts.push([a, 1], [b, 0]);
    const kt = pts.map(([t]) => f(t)).join(';');
    const vals = pts.map(([, v]) => v).join(';');
    return `<animate attributeName="opacity" calcMode="discrete" values="${vals}" keyTimes="${kt}" ${this.common()}/>`;
  }

  /** move along a path; stops are [t, fraction of the path] */
  ride(p: string, stops: Stop<number>[]) {
    const [kt, vals, spl] = this.stops(stops);
    return `<animateMotion path="${p}" calcMode="spline" keyTimes="${kt}" keyPoints="${vals.map(f).join(';')}" keySplines="${spl}" ${this.common()}/>`;
  }

  /** a dot that appears at t0, travels the path until t1, and is gone at hide */
  token(p: string, t0: number, t1: number, hide?: number, r = 6) {
    hide ??= Math.min(1, t1 + 0.02);
    this.add.push(`<g opacity="0">${this.ride(p, [[t0, 0], [t1, 1]])}${this.visible([[t0, hide]])}<circle r="${r}" fill="#000" stroke="none"/></g>`);
  }

  /** a shape filled with a light tint of the ink while it's active */
  tint(shape: string, spans: [number, number][], o = 0.22) {
    this.add.push(`<g opacity="0" fill="#000" fill-opacity="${o}" stroke="none">${this.visible(spans)}${shape}</g>`);
  }

  show(markup: string, spans: [number, number][]) {
    this.add.push(`<g opacity="0">${this.visible(spans)}${markup}</g>`);
  }

  /** continuous opacity, for wrapping an existing element */
  fade(stops: Stop<number>[]) {
    const [kt, vals, spl] = this.stops(stops);
    return `<animate attributeName="opacity" calcMode="spline" values="${vals.join(';')}" keyTimes="${kt}" keySplines="${spl}" ${this.common()}/>`;
  }

  slide(stops: Stop<[number, number]>[]) {
    const [kt, vals, spl] = this.stops(stops);
    const v = vals.map(([x, y]) => `${x} ${y}`).join(';');
    return `<animateTransform attributeName="transform" type="translate" calcMode="spline" values="${v}" keyTimes="${kt}" keySplines="${spl}" ${this.common()}/>`;
  }

  /** replace one exact piece of the still, which must appear exactly once */
  swap(old: string, next: string) {
    const n = this.svg.split(old).length - 1;
    if (n !== 1) throw new Error(`${this.name}: expected one ${JSON.stringify(old)}, found ${n}`);
    this.svg = this.svg.replace(old, () => next);
  }

  /** wrap an existing element in a group that carries an animation */
  wrap(old: string, anim: string) { this.swap(old, `<g>${anim}${old}</g>`); }

  out() {
    return this.svg.replace('</svg>', () => `  <g class="motion">\n    ${this.add.join('\n    ')}\n  </g>\n</svg>`);
  }
}

const FIGURES: Record<string, { media: string; D: number; build: (g: Fig) => void }> = {
  'tasks-shapes': {
    media: 'drafts/tasks/fig-1-shapes', D: 10,
    build(g) {
      const curves = ['M78 214 C78 330 190 360 196 462', 'M158 214 C158 320 214 370 218 462', 'M238 214 C238 330 238 380 240 462',
        'M318 214 C318 320 266 370 262 462', 'M398 214 C398 330 290 360 284 462'];
      [78, 158, 238, 318, 398].forEach((x, i) => {
        g.token(`M${x} 118 V160`, 0.04, 0.1, 0.11, 5);
        g.tint(`<circle cx="${x}" cy="188" r="25"/>`, [[0.11, 0.2]], 0.18);
        g.token(curves[i], 0.18 + i * 0.01, 0.36 + i * 0.01, 0.4);
      });
      // conflicts flare as they land together
      g.show('<g stroke-width="5"><path d="M196 418 l16 16 M212 418 l-16 16"/><path d="M268 418 l16 16 M284 418 l-16 16"/></g>', [[0.37, 0.46]]);
      g.tint('<circle cx="204" cy="426" r="18"/><circle cx="276" cy="426" r="18"/>', [[0.37, 0.46]], 0.2);
      // and the poller reads the mess as new work
      g.token('M330 470 C470 440 470 120 432 100', 0.46, 0.66, 0.67, 5);
      g.tint('<rect x="370" y="80" width="56" height="36" rx="3"/>', [[0.67, 0.78]], 0.25);
      // version two: wide where it's cheap, one at a time where it matters
      for (const x of [570, 670, 770]) {
        g.token(`M${x} 118 V148`, 0.04, 0.09, 0.1, 5);
        g.tint(`<rect x="${x - 42}" y="150" width="84" height="40" rx="20"/>`, [[0.1, 0.22]], 0.18);
        g.token(`M${x} 192 V222`, 0.2, 0.25, 0.26, 5);
      }
      g.token('M570 290 C570 320 650 316 662 336', 0.28, 0.36, 0.38, 5);
      g.token('M670 290 V334', 0.28, 0.36, 0.38, 5);
      g.token('M770 290 C770 320 690 316 678 336', 0.28, 0.36, 0.38, 5);
      for (let k = 0; k < 3; k++) {
        const t = 0.42 + k * 0.17;
        g.token('M670 396 V426', t, t + 0.03, t + 0.04, 5);
        g.tint('<rect x="610" y="430" width="120" height="40" rx="20"/>', [[t + 0.04, t + 0.1]], 0.2);
        g.token('M670 472 V514', t + 0.1, t + 0.13, t + 0.14, 5);
        g.show('<circle cx="670" cy="520" r="12" stroke-width="2"/>', [[t + 0.14, t + 0.17]]);
      }
    },
  },

  'tasks-barrier': {
    media: 'drafts/tasks/fig-2-barrier', D: 10,
    build(g) {
      // the task's place on the state rail: a ring that steps along it
      const kp: Stop<number>[] = [[0, 0], [0.05, 0], [0.08, 1 / 7], [0.13, 1 / 7], [0.16, 2 / 7], [0.56, 2 / 7], [0.59, 3 / 7], [0.64, 3 / 7],
        [0.66, 4 / 7], [0.7, 4 / 7], [0.72, 5 / 7], [0.84, 5 / 7], [0.86, 6 / 7], [0.9, 6 / 7], [0.92, 1], [0.97, 1]];
      g.add.push(`<g>${g.ride('M60 520 H900', kp)}${g.visible([[0, 0.97]])}<circle r="14" stroke-width="2.5"/></g>`);
      // scouting: the scout works, and only the spec leaves the VM
      g.tint('<rect x="64" y="160" width="96" height="40" rx="20"/>', [[0.16, 0.46]]);
      g.token('M150 162 C170 130 186 118 206 116', 0.18, 0.24, 0.25);
      g.tint('<rect x="210" y="90" width="80" height="54" rx="3"/>', [[0.25, 0.3]]);
      g.token('M292 117 H330', 0.3, 0.33, 0.34);
      g.tint('<path d="M326 98 h56 l-8 54 h-40 z"/>', [[0.34, 0.4]]);
      g.token('M162 184 C182 196 192 214 206 222', 0.26, 0.31, 0.32);
      g.tint('<path d="M210 200 h44 l14 14 v42 h-58 z"/>', [[0.32, 0.46]], 0.14);
      g.token('M120 202 C126 262 170 288 206 292', 0.36, 0.43, 0.44);
      g.tint('<path d="M210 266 h44 l14 14 v42 h-58 z"/>', [[0.44, 0.5]]);
      // through the slot
      g.token('M272 292 H520', 0.48, 0.57, 0.58, 7);
      g.tint('<circle cx="556" cy="292" r="26"/>', [[0.58, 0.64]]);
      g.token('M588 292 H640', 0.64, 0.67, 0.68, 7);
      g.tint('<path d="M644 266 h44 l14 14 v42 h-58 z"/>', [[0.68, 0.73]]);
      g.token('M673 262 V212', 0.72, 0.75, 0.76);
      g.tint('<rect x="620" y="166" width="106" height="40" rx="20"/>', [[0.76, 0.84]]);
      g.token('M728 186 H778', 0.8, 0.83, 0.84);
      g.tint('<rect x="782" y="158" width="80" height="54" rx="3"/>', [[0.84, 0.97]]);
    },
  },

  'tasks-tick': {
    media: 'drafts/tasks/fig-3-tick', D: 7,
    build(g) {
      const voices = ['M212 84 C280 84 300 150 336 170', 'M212 136 C270 136 300 166 332 180',
        'M212 188 C270 188 300 196 330 196', 'M212 240 C270 240 300 222 332 212'];
      voices.forEach((p, i) => { const t = [0.04, 0.1, 0.16, 0.07][i]; g.token(p, t, t + 0.08); });
      g.token('M212 396 C320 396 370 300 392 252', 0.08, 0.2);
      g.token('M470 298 V266', 0.2, 0.25, undefined, 5);
      // the tick: the session wakes
      g.tint('<ellipse cx="470" cy="196" rx="122" ry="57"/>', [[0.28, 0.4]], 0.18);
      g.token('M604 196 H668', 0.4, 0.45, 0.46);
      g.tint('<rect x="672" y="174" width="70" height="44" rx="3"/>', [[0.46, 0.52]]);
      g.token('M744 196 H770', 0.51, 0.53, 0.54);
      g.tint('<rect x="779" y="219" width="54" height="28"/>', [[0.54, 0.62]], 0.3);
      g.token('M840 233 C866 233 868 196 882 180', 0.58, 0.64, 0.65);
      g.tint('<rect x="852" y="132" width="100" height="40" rx="3"/>', [[0.65, 0.74]]);
      // every decision is written down: the ledger's last entry writes itself in
      g.token('M806 254 V476', 0.6, 0.74, 0.75, 5);
      const old = '<path d="M760 494 h70 M760 508 h110 M760 522 h40"/>';
      g.swap(old, `${old.slice(0, -2)}><animate attributeName="stroke-dasharray" values="0 120;0 120;120 0;120 0" keyTimes="0;.75;.83;1" ${g.common()}/></path>`);
    },
  },

  'desktop-tools-loop': {
    media: 'drafts/desktop-tools/fig-2-loop', D: 15,
    build(g) {
      // three turns of the loop, each ending in a different outcome
      const outs: [number, string][] = [[480, '<rect x="410" y="344" width="140" height="56"/>'],
        [670, '<rect x="600" y="344" width="140" height="56"/>'], [860, '<rect x="790" y="344" width="140" height="56"/>']];
      outs.forEach(([x, box], k) => {
        const T = (t: number) => k * (1 / 3) + t * (1 / 3);
        g.tint('<path d="M110 162 C130 136 190 136 210 162 C190 188 130 188 110 162 Z"/>', [[T(0.02), T(0.16)]]);
        g.token('M260 150 L366 150', T(0.14), T(0.24));
        g.tint('<path d="M370 110 L560 110 L560 140 a12 12 0 0 0 0 24 L560 194 L370 194 L370 164 a12 12 0 0 0 0 -24 Z"/>', [[T(0.24), T(0.4)]], 0.16);
        g.token('M560 150 L676 150', T(0.38), T(0.48));
        g.tint('<circle cx="720" cy="110" r="22"/>', [[T(0.48), T(0.56)]], 0.3);
        g.token(`M740 262 L740 300 L${x} 300 L${x} 340`, T(0.56), T(0.68));
        g.tint(box, [[T(0.68), T(0.8)]], x !== 860 ? 0.18 : 0.1);
        g.token(`M${x} 470 L${x} 500 L36 500 L36 170 L56 170`, T(0.8), T(0.98), T(0.99));
      });
    },
  },

  'jev-budget': {
    media: 'drafts/jev-demos/fig-3-budget', D: 9,
    build(g) {
      // the budget line moves; nothing is recomputed
      const mv: Stop<[number, number]>[] = [[0, [0, 0]], [0.15, [0, 0]], [0.25, [0, 52]], [0.45, [0, 52]], [0.55, [0, -52]], [0.75, [0, -52]], [0.85, [0, 0]]];
      g.wrap('<path d="M540 305 L920 305" stroke-width="3" stroke-dasharray="14 7"/>', g.slide(mv));
      g.wrap('<text class="small it end" x="532" y="310">token budget</text>', g.slide(mv));
      // "user: keep v1 API" is cut while the line is above it
      for (const old of ['<rect class="thin" x="560" y="260" width="240" height="38" rx="3"/><text x="574" y="284">user: keep v1 API</text>',
        '<rect class="fill" x="812" y="272" width="71" height="14"/>']) {
        g.wrap(old, g.fade([[0.5, 1], [0.56, 0.32], [0.76, 0.32], [0.84, 1]]));
      }
      // "lint warning" is kept while the line is below it
      g.tint('<rect x="560" y="312" width="240" height="38" rx="3"/>', [[0.24, 0.5]], 0.12);
      g.show('<rect stroke-width="1.25" x="560" y="312" width="240" height="38" rx="3"/>', [[0.24, 0.5]]);
    },
  },
};

async function main() {
  const args = process.argv.slice(2);
  const oi = args.indexOf('--out');
  const out = oi >= 0 ? args.splice(oi, 2)[1] : fs.mkdtempSync(path.join(os.tmpdir(), 'figure-motion-'));
  const names = args.length ? args : Object.keys(FIGURES);
  fs.mkdirSync(out, { recursive: true });
  const files = manifest as Record<string, { key: string }>;
  for (const name of names) {
    const spec = FIGURES[name];
    if (!spec) throw new Error(`No figure "${name}". Known: ${Object.keys(FIGURES).join(', ')}`);
    const still = files[spec.media];
    if (!still) throw new Error(`No media named "${spec.media}"`);
    const res = await fetch(`${SITE}/m/${still.key}`);
    if (!res.ok) throw new Error(`${spec.media}: ${res.status} from the site`);
    const g = new Fig(name, spec.D);
    g.svg = await res.text();
    spec.build(g);
    const file = path.join(out, `${name}-motion.svg`);
    fs.writeFileSync(file, g.out());
    console.log(`npm run media -- put ${file} ${spec.media}-motion`);
  }
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
