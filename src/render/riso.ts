/**
 * The parts of the zine, rendered to HTML strings: plates, registered type,
 * text blocks, and the spreads they print on.
 */
import { html, raw, attr, cls, type Html } from './html';
import type { TextPart } from '../lib/pieces';
import { media } from '../lib/media';
import { COVER_ART } from '../lib/covers';
import { ISSUE } from '../lib/issue';
import { tokenize, langOf } from '../lib/code';
import {
  INK_HEX, CODE_MARK, rng, spreadTitle, domain, readingMinutes,
  type Block, type Ink, type PlateMedia, type Spread,
} from '../lib/zine';

type Kind<K extends Spread['kind']> = Extract<Spread, { kind: K }>;

/**
 * Display type printed twice: the light plate (a pseudo-element) and the key
 * plate (the real text), overprinted out of register.
 */
export function reg(p: { as?: string; text: string; class?: string; style?: string; href?: string }): Html {
  const tag = p.as ?? 'h2';
  const inner = p.href
    ? html`<a${attr('href', p.href)} class="reg-in"${attr('data-text', p.text)}>${p.text}</a>`
    : html`<span class="reg-in"${attr('data-text', p.text)}>${p.text}</span>`;
  return html`<${raw(tag)}${attr('class', cls('reg', p.class))}${attr('style', p.style)}>${inner}</${raw(tag)}>`;
}

/**
 * A line of text whose names are links that don't look like links: they
 * print as type and only show themselves on hover or focus.
 */
export const linked = (parts: TextPart[]): Html =>
  html`${parts.map((p) => (p.url ? html`<a class="ql"${attr('href', p.url)}>${p.text}</a>` : p.text))}`;

/**
 * A photo printed as riso plates. `duo` stacks a light plate and a key plate
 * (multiplied, independently misregistered); `key` prints the key plate
 * alone; `mono` prints the whole tonal range in the key ink.
 */
export function plate(p: {
  media: PlateMedia; inks: [Ink, Ink]; mode?: 'duo' | 'key' | 'mono'; alt?: string; class?: string;
  fit?: 'cover' | 'contain'; eager?: boolean; proof?: boolean; style?: string;
}): Html {
  const { media: m, mode = 'duo', fit = 'cover' } = p;
  const label = p.alt ?? m.alt ?? '';
  const loading = p.eager ? 'eager' : 'lazy';
  const [lt, dk] = p.inks;
  const ratio = m.aspect ? `--ar:${m.aspect.toFixed(4)};` : '';
  const img = (c: string, alt: string, filter: string, hidden = false) =>
    html`<img${attr('class', c)}${attr('src', m.src)}${attr('alt', alt)}${attr('aria-hidden', hidden && 'true')}${attr('loading', loading)} decoding="async"${attr('style', `filter:url(#${filter})`)} />`;
  const inks =
    mode === 'mono' ? img('ink ink-dk', label, `ht-lt-${dk}`)
    : mode === 'key' ? img('ink ink-dk', label, `ht-dk-${dk}`)
    : html`${img('ink ink-lt', label, `ht-lt-${lt}`)}${img('ink ink-dk', '', `ht-dk-${dk}`, true)}`;
  return html`<figure${attr('class', cls('plate', `plate-${mode}`, `fit-${fit}`, p.proof && 'has-proof', p.class))}${attr('style', ratio + (p.style ?? ''))}>
  <div class="plate-stack">${inks}${p.proof && html`<img class="proof"${attr('src', m.src)} alt="" aria-hidden="true" loading="lazy" decoding="async" />`}</div>
</figure>`;
}

/** A code listing, hand-highlighted in the spot inks. */
export function listing(src: string, lang?: string): Html {
  const label = lang ?? (langOf(lang, src) === 'rustc' ? 'rustc' : undefined);
  return html`<pre${attr('class', 'b-code')}${attr('data-lang', label)}><code>${tokenize(src, lang).map((t) => (t.k ? html`<span${attr('class', `t-${t.k}`)}>${t.s}</span>` : t.s))}</code></pre>`;
}

/** Text with its marked code spans set in mono. */
const spans = (t: string) => (t.includes(CODE_MARK) ? t.split(CODE_MARK).map((s, i) => (i % 2 ? html`<code class="ic">${s}</code>` : s)) : t);

/** Running text as blocks. Reference markers become superscript notes when `refs`. */
export function blocks(bs: Block[], o: { refs?: boolean; end?: boolean } = {}): Html {
  const last = bs.length - 1;
  return html`${bs.map((b, bi) => {
    const body = b.text.split(/\u0001(\d+)\u0001/).map((t, i) => (i % 2 ? (o.refs ? html`<sup class="ref"><span class="sr">note </span>${t}</sup>` : null) : spans(t)));
    const tail = o.end && bi === last ? html`<span class="end-mark" aria-hidden="true"></span>` : null;
    return b.t === 'h' ? html`<p class="b-h">${body}</p>`
      : b.t === 'li' ? html`<p class="b-li">${body}${tail}</p>`
      : b.t === 'code' ? listing(b.text, b.lang)
      : b.t === 'quote' ? html`<p class="b-q">${body}${tail}</p>`
      : html`<p>${body}${tail}</p>`;
  })}`;
}

/**
 * One spread of the zine: two facing pages, a gutter, folios and a running
 * head. Every spread carries its own seeded misregistration (--mx/--my) and
 * ink pair, which the content inside picks up through CSS variables.
 */
export function sheet(spread: Spread, p: { label: string; layout?: string; folio?: boolean; running?: string }, body: Html): Html {
  const folio = p.folio ?? true;
  const r = rng(spread.seed ^ 0x9e3779b9);
  const mx = r.range(-2.4, 2.4).toFixed(2);
  const my = r.range(-1.8, 1.8).toFixed(2);
  // where the plates come from as they land
  const lx = r.range(-26, 26).toFixed(1);
  const ly = r.range(-18, 18).toFixed(1);
  const [lt, dk] = spread.inks;
  return html`<section${attr('class', `sheet paper-${spread.paper}`)}${attr('id', `p-${spread.page}`)}${attr('data-kind', spread.kind)}${attr('data-section', spread.group?.key ?? 'front')}${attr('data-section-title', spread.group?.title ?? 'Front matter')}${attr('data-title', spreadTitle(spread))}${attr('aria-label', p.label)}${attr('style', `--lt:var(--${lt});--dk:var(--${dk});--mx:${mx}px;--my:${my}px;--lx:${lx}px;--ly:${ly}px`)}${attr('data-lt', lt)}${attr('data-dk', dk)}>
  <div${attr('class', cls('spread', `spread-${spread.kind}`, p.layout && `layout-${p.layout}`))}>
    ${body}
    <div class="gutter" aria-hidden="true"></div>
    ${folio && html`<span class="folio folio-l" aria-hidden="true">${spread.page}</span>
    <span class="folio folio-r" aria-hidden="true">${spread.page + 1}</span>
    ${p.running && html`<span class="running" aria-hidden="true">${p.running}</span>`}`}
  </div>
</section>`;
}

/**
 * The cover of _fragments: the central reactor from one of Nate's 2017
 * renders, redrawn in the zine's own plates across the whole spread, with a
 * margin under it captioned like an edition print and credited to the render.
 */
export function cover(spread: Kind<'cover'>): Html {
  const art = COVER_ART;
  return sheet(spread, { label: 'Cover', folio: false }, html`<div class="cv cv-drawn"${attr('data-issue', ISSUE.number)}>
    <div class="cv-plate">
      <img class="cv-img"${attr('src', art.still)}${attr('srcset', `${art.small} 1600w, ${art.still} 3200w`)} sizes="(max-width: 760px) 100vw, 92vw" width="3200"${attr('height', Math.round(3200 / art.aspect))}${attr('alt', art.alt)} fetchpriority="high" />
    </div>
    <p class="cv-pencil">
      <span class="cv-ed">Drawn after</span>
      <span class="cv-title">Untitled, ${art.date}</span>
      <span class="cv-sig">Nate Butler</span>
    </p>
    <h1 class="masthead">_fragments</h1>
    <p class="cv-issue"><span>Issue ${ISSUE.number}</span> <span>${ISSUE.season}</span></p>
    <a class="cover-turn" href="#p-2">Turn the page</a>
  </div>`);
}

/**
 * Hi friends: who Nate is, right after the cover. The left page is a yellow
 * flood with the greeting overprinted in blue and red, and his avatar
 * printed small in the corner; the right page is the rest of the letter,
 * where he's been, and where to find him.
 */
export function bio(spread: Kind<'bio'>): Html {
  // His GitHub avatar, kept in media (it's only 250px at the source).
  const avatar = { src: media('bio/avatar').url, alt: 'Nate’s avatar: a black cat with big glowing eyes', aspect: 1 };
  return sheet(spread, { label: 'About Nate' }, html`<div class="pg pg-l bio-l">
    <span class="bio-flood" aria-hidden="true"></span>
    <h2 class="bio-hi">
      ${reg({ as: 'span', text: 'Hi friends', class: 't-tower', style: '--fs:13.4cqw;--lt:var(--red);--dk:var(--blue)' })}
      <span class="bio-wave" aria-hidden="true">👋</span>
    </h2>
    <a class="bio-av" href="https://github.com/iamnbutler" aria-label="Nate on GitHub">
      ${plate({ media: avatar, inks: ['blue', 'black'], fit: 'cover', eager: true })}
    </a>
    <p class="bio-lede">I'm a software designer &amp; maker enabling people's creativity and ability to share knowledge. Chances are you have probably used something I've built.</p>
  </div>
  <div class="pg pg-r bio-r">
    <p class="bio-from"><span>From the editor</span> <span>Issue ${ISSUE.number}, ${ISSUE.season}</span></p>
    ${postmark()}
    <p class="bio-p bio-first">I want to help people create the things important to them&thinsp;&mdash;&thinsp;to empower them to create something themselves and feel the euphoria it brings.</p>
    <p class="bio-p">I'm interested in local &amp; open source software, and finding ways to reclaim our applications from the web and our daily lives from large corporations.</p>
    <dl class="bio-cv">
      <div class="bio-now"><dt>Now</dt><dd><b><a class="ql" href="https://githubnext.com">GitHub Next</a></b> <span>exploring the future of software</span></dd></div>
      <div><dt>Before</dt><dd><b><a class="ql" href="https://zed.dev">Zed</a></b> <span>designed it</span></dd></div>
      <div><dt>Before</dt><dd><b><a class="ql" href="https://www.facebook.com">Facebook</a></b> <span>News Feed &amp; Developer Tools</span></dd></div>
    </dl>
    <p class="bio-bye">Say hi on <a href="https://bsky.app/profile/nate.rip">Bluesky</a> or come visit <a href="https://nate.rip">nate.rip</a>!</p>
  </div>`);
}

/**
 * A postmark struck across the letter's empty middle in red: a ring with the
 * site round it and cancellation waves trailing off to the left.
 */
function postmark(): Html {
  const waves = [0, 1, 2, 3, 4].map((i) => {
    const y = 70 + i * 13;
    let d = `M0 ${y}`;
    for (let x = 0; x < 192; x += 24) d += ` q6 -6 12 0 t12 0`;
    return d;
  });
  return html`<svg class="bio-postmark" viewBox="0 0 420 200" aria-hidden="true">
    <defs><path id="pm-ring" d="M310 100 m-74 0 a74 74 0 1 1 148 0 a74 74 0 1 1 -148 0" /></defs>
    ${raw(waves.map((d) => `<path class="pm-wave" d="${d}" />`).join(''))}
    <circle class="pm-rule" cx="310" cy="100" r="92" />
    <circle class="pm-rule pm-thin" cx="310" cy="100" r="58" />
    <text class="pm-ring"><textPath href="#pm-ring" startOffset="0" textLength="458" lengthAdjust="spacing">NATE.RIP ✶ SAY HI ✶ ISSUE ${ISSUE.number} ✶ FRAGMENTS ✶</textPath></text>
    <text class="pm-mid" x="310" y="94" text-anchor="middle">${ISSUE.season.split(' ')[0].toUpperCase()}</text>
    <text class="pm-mid pm-yr" x="310" y="124" text-anchor="middle">${ISSUE.season.split(' ')[1] ?? ''}</text>
  </svg>`;
}

/**
 * The rest of a long piece, jumped from its designed spreads the way
 * magazines do.
 * Outbound links become numbered notes in the outer margin.
 */
export function jumpSpread(spread: Kind<'jump'>): Html {
  const { item, blocks: bs, refs, from, jump, last } = spread;
  const hasNotes = refs.length > 0;
  // Fill the left page first: roughly half the text, split on a block boundary.
  const size = (b: Block) => (b.t === 'code' ? b.text.split('\n').length * 40 : b.text.length);
  const total = bs.reduce((n, b) => n + size(b), 0);
  let acc = 0;
  let split = bs.findIndex((b) => (acc += size(b)) > total * (hasNotes ? 0.56 : 0.5));
  if (split < 0) split = bs.length - 1;
  const left = bs.slice(0, split + 1);
  const right = bs.slice(split + 1);
  const mins = readingMinutes(item.text);
  return sheet(spread, { label: `${item.title}, continued`, layout: hasNotes ? 'notes' : 'plain', running: `${item.title}, ${mins} min` }, html`<div class="pg pg-l jump-a">
    <p class="jump-from">
      <a${attr('href', `#p-${from}`)}>Continued from page ${from}</a>
      <span class="jump-slug">${item.title}</span>
    </p>
    <div class="prose-cols cols-2"${attr('data-flow', item.key)}>
      ${blocks(left, { refs: true, end: last && !right.length })}
    </div>
  </div>
  <div class="pg pg-r jump-b">
    <div class="prose-cols cols-2"${attr('data-flow', item.key)}>
      ${blocks(right, { refs: true, end: last })}
    </div>
    ${jump
      ? html`<a class="cont"${attr('href', `#p-${jump}`)}>Continued on page ${jump}</a>`
      : last
        ? html`<a class="cont cont-single"${attr('href', item.href)}>Read on its own page</a>`
        : html`<a class="cont"${attr('href', item.href)}>The rest is on its own page</a>`}
  </div>
  ${hasNotes && html`<aside class="margin-notes" aria-label="Notes">
    <p class="mn-head">Notes</p>
    <ol>
      ${refs.map((r) => html`<li${attr('value', r.n)}>
        <a${attr('href', r.url)} target="_blank" rel="noopener">${r.label}</a>
        <span class="mn-where">${domain(r.url)}</span>
      </li>`)}
    </ol>
  </aside>`}`);
}

/** A rubber stamp for pieces over three years old, with the year they were first printed. */
export function archiveMark(date: string): Html {
  const year = new Date(date).getUTCFullYear();
  return html`<p class="archive-mark"${attr('aria-label', `From the archive: first printed ${year}`)}><span>From the archive</span><span class="archive-year">${year}</span></p>`;
}

// ── the print shop ──────────────────────────────────────────────────────────

const enc = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

// 0° screen: one dot per square cell. Gradient reaches white at the cell corner.
const squareTile = (s: number) =>
  enc(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><defs><radialGradient id="g" cx=".5" cy=".5" r=".7071"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></radialGradient></defs><rect width="${s}" height="${s}" fill="url(#g)"/></svg>`,
  );

// 45° screen: dots at the centre and corners of each cell, nearest dot wins.
const diagTile = (s: number) => {
  const h = s / 2;
  const pts = [[h, h], [0, 0], [s, 0], [0, s], [s, s]];
  const grads = pts
    .map(([x, y], i) => `<radialGradient id="g${i}" gradientUnits="userSpaceOnUse" cx="${x}" cy="${y}" r="${h}"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></radialGradient>`)
    .join('');
  const circles = pts
    .map((_, i) => `<rect width="${s}" height="${s}" fill="url(#g${i})" style="mix-blend-mode:darken"/>`)
    .join('');
  return enc(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><defs>${grads}</defs><rect width="${s}" height="${s}" fill="#fff"/>${circles}</svg>`);
};

interface Role { tile: string; size: number; exponent: number; offset: number; grain: number; }

const ROLES: Record<'lt' | 'dk', Role> = {
  // light plate: carries the whole tonal range
  lt: { tile: squareTile(5), size: 5, exponent: 0.95, offset: 0, grain: 0.18 },
  // key plate: only the shadows, on a 45° screen
  dk: { tile: diagTile(8), size: 8, exponent: 0.42, offset: 0.06, grain: 0.22 },
};

// Tone curve sampled into a lookup table: low values take ink.
const curve = (role: Role) =>
  Array.from({ length: 17 }, (_, k) => {
    const v = Math.pow(k / 16, role.exponent) + role.offset;
    return Math.min(1, Math.max(0, v)).toFixed(3);
  }).join(' ');

/**
 * SVG filters that separate any photo into riso plates. Each filter turns an
 * image into a halftone screen of ONE ink with a transparent background, so
 * two stacked copies multiply into a duotone and can be knocked out of
 * register independently.
 */
export function inks(): Html {
  const filters: { id: string; role: Role; color: string }[] = [];
  for (const ink of ['yellow', 'red', 'blue', 'black'] as const) {
    filters.push({ id: `ht-lt-${ink}`, role: ROLES.lt, color: INK_HEX[ink] });
    filters.push({ id: `ht-dk-${ink}`, role: ROLES.dk, color: INK_HEX[ink] });
  }
  return html`<svg class="inks" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute">
  <defs>
    ${filters.map(({ id, role, color }) => html`<filter${attr('id', id)} x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">
      <feColorMatrix in="SourceGraphic" type="matrix" values=".3 .59 .11 0 0 .3 .59 .11 0 0 .3 .59 .11 0 0 0 0 0 1 0" result="g" />
      <feComponentTransfer in="g" result="tone">
        <feFuncR type="table"${attr('tableValues', curve(role))} />
        <feFuncG type="table"${attr('tableValues', curve(role))} />
        <feFuncB type="table"${attr('tableValues', curve(role))} />
      </feComponentTransfer>
      <feImage${attr('href', role.tile)} x="0" y="0"${attr('width', role.size)}${attr('height', role.size)} result="cell" />
      <feTile in="cell" result="screen" />
      <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="1" seed="7" result="n0" />
      <feColorMatrix in="n0" type="matrix" values="1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 1" result="noise" />
      <feComposite in="tone" in2="screen" operator="arithmetic" k2=".5" k3=".5" result="v" />
      <feComposite in="v" in2="noise" operator="arithmetic" k2="1"${attr('k3', role.grain)}${attr('k4', -role.grain / 2)} result="vn" />
      <feColorMatrix in="vn" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1 0 0 0 1" result="inv" />
      <feComponentTransfer in="inv" result="dots"><feFuncA type="discrete" tableValues="0 1" /></feComponentTransfer>
      <feFlood${attr('flood-color', color)} result="ink" />
      <feComposite in="ink" in2="dots" operator="in" result="inked" />
      <feComposite in="inked" in2="SourceAlpha" operator="in" />
    </filter>`)}
    <!-- rubber stamp: uneven ink, knocked-out specks, chewed edges -->
    <filter id="rubber" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="11" result="warp" />
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="3" xChannelSelector="R" yChannelSelector="G" result="wobbled" />
      <feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="3" seed="5" result="speck" />
      <feColorMatrix in="speck" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -5 3.9" result="mask" />
      <feComposite in="wobbled" in2="mask" operator="in" />
    </filter>
  </defs>
</svg>`;
}
