/**
 * The features: each draft prints on its own art-directed spreads.
 */
import { html, raw, attr, cls, type Html } from './html';
import { reg, linked, blocks, sheet } from './riso';
import { img, type DraftImage } from '../lib/drafts';
import type { Block, PlateMedia, Spread } from '../lib/zine';

type DraftSpread = Extract<Spread, { kind: 'draft' }>;

const size = (b: Block) => (b.t === 'code' ? b.text.split('\n').length * 40 : b.text.length);

/** Split a run of blocks so roughly `ratio` of the text lands in the first part. */
export function split(bs: Block[], ratio: number): [Block[], Block[]] {
  const total = bs.reduce((n, b) => n + size(b), 0);
  let acc = 0;
  let i = 0;
  while (i < bs.length && acc + size(bs[i]) / 2 < total * ratio) acc += size(bs[i++]);
  // A heading goes with the text under it.
  while (i > 1 && i < bs.length && bs[i - 1].t === 'h') i--;
  return [bs.slice(0, i), bs.slice(i)];
}

/** A draft screenshot as plate media. */
export function plateOf(im: DraftImage | undefined): PlateMedia | undefined {
  return im && { src: im.src, alt: im.alt, aspect: im.aspect };
}

/**
 * A line drawing printed as an ink plate. The figures are black strokes on
 * transparent, so the file becomes a mask and the ink is whatever colour the
 * page asks for. An optional ghost plate in a second ink sits out of register.
 * A figure with a looping version plays it while it's in view.
 */
export function inkFig(image: DraftImage | undefined, p: { ink?: string; ghost?: string; class?: string; style?: string; caption?: boolean | string; fit?: 'contain' | 'cover' } = {}): Html {
  if (!image) return raw('');
  const { ink = 'dk', ghost, style = '', caption = true, fit = 'contain' } = p;
  const ar = image.aspect ?? 1.4;
  const cap = typeof caption === 'string' ? caption : caption ? image.caption : undefined;
  return html`<figure${attr('class', cls('inkfig', `fit-${fit}`, image.motion && 'has-motion', p.class))}${attr('data-motion', image.motion)}${attr('style', `--ar:${ar.toFixed(4)};--fig:url("${image.src}");${image.motion ? `--fig-motion:url("${image.motion}");` : ''}--ink:var(--${ink});${ghost ? `--ghost:var(--${ghost});` : ''}${style}`)}>
    <div class="inkfig-plates" role="img"${attr('aria-label', image.alt)}>
      ${ghost && html`<span class="inkfig-ghost" aria-hidden="true"></span>`}
      <span class="inkfig-key" aria-hidden="true"></span>
    </div>
    ${cap && html`<figcaption class="cap">${cap}</figcaption>`}
  </figure>`;
}

/**
 * A frame of a draft's running text. All of a draft's frames, across its
 * designed spreads and any jumps after them, are one chain for copyfitting.
 */
export function prose(flow: string, bs: Block[], p: { cols?: 1 | 2 | 3; class?: string; end?: boolean; dropcap?: boolean } = {}): Html {
  const { cols = 2, end = false, dropcap = false } = p;
  return html`<div${attr('class', cls('prose-cols', 'dr-prose', cols > 1 && `cols-${cols}`, dropcap && 'dropcap', p.class))}${attr('data-flow', flow)}>
    ${blocks(bs, { end })}
  </div>`;
}

/** Where a draft's text goes next: the next page with text, or its own page. */
export function cont(spread: DraftSpread, c?: string): Html {
  return spread.jump
    ? html`<a${attr('class', cls('cont', c))}${attr('href', `#p-${spread.jump}`)}>Continued on page ${spread.jump}</a>`
    : spread.blocks.length > 0 ? html`<a${attr('class', cls('cont', 'cont-single', c))}${attr('href', spread.draft.href)}>Read on its own page</a>` : raw('');
}

/**
 * desktop-tools. Blue and teal on off-white, no yellow, so it reads as
 * Ace's sibling rather than its next chapter. Black is only for the patent
 * line work and the three outcome words.
 */
function desktopTools(spread: DraftSpread): Html {
  const { draft: d, part, blocks: bs } = spread;
  const end = !spread.jump && bs.length > 0;
  const [a, b] = split(bs, part === 0 ? 0.42 : 0.5);
  const keys = ['Accessibility', 'Screen Recording', 'Event Synthesizing'];
  return html`${part === 0 && html`<div class="pg pg-l dt-open">
      <div class="dt-window" aria-hidden="true">
        <span class="dt-lights"><i></i><i></i><i></i></span>
        <span class="dt-screen"></span>
        <span class="dt-cursor"></span>
      </div>
      ${reg({ as: 'h2', text: d.title, class: 't-tower dt-title', style: '--lt:var(--blue);--dk:var(--teal)' })}
      <div class="dt-deck">
        ${d.kicker && html`<p class="dr-kicker">${d.kicker}</p>`}
        <p class="dr-dek">${linked(d.dekParts)}</p>
      </div>
      ${prose(d.key, a, { cols: 2, dropcap: true })}
    </div>
    <div class="pg pg-r dt-manual">
      ${inkFig(img(d, 'fig-1-boundary'), { ink: 'dk', class: 'dt-fig1' })}
      <div class="dt-hook" role="group" aria-label="The three macOS grants, held by the app">
        <span class="dt-hook-bar" aria-hidden="true"></span>
        ${keys.map((k, i) => html`<span class="dt-key"${attr('style', `--i:${i}`)}>
            <svg viewBox="0 0 60 24" aria-hidden="true"><circle cx="11" cy="12" r="8" /><circle cx="11" cy="12" r="3" /><path d="M19 12h38M44 12v7M51 12v5" /></svg>
            <span>${k}</span>
          </span>`)}
      </div>
      ${prose(d.key, b, { cols: 2, end })}
      ${cont(spread)}
    </div>`}
  ${part === 1 && html`<div class="dt-strip">
      ${inkFig(img(d, 'fig-2-loop'), { ink: 'black', caption: false })}
    </div>
    <div class="dt-stamps" role="group" aria-label="The three outcomes">
      <span class="dt-out out-done">Completed</span>
      <span class="dt-out out-refused">Refused</span>
      <span class="dt-out out-unknown" data-text="Unknown">Unknown</span>
    </div>
    <div class="dt-body">
      <p class="cap">${`${img(d, 'fig-2-loop')?.caption ?? ''} ${img(d, 'fig-3-patch-stack')?.caption ?? ''}`.trim()}</p>
      ${prose(d.key, bs, { cols: 3, end })}
      ${cont(spread)}
    </div>
    <div class="dt-stack">
      ${inkFig(img(d, 'fig-3-patch-stack'), { ink: 'dk', caption: false })}
      <div class="dt-war">
        <p class="dt-war-note"><span class="dt-war-no">Sheet 02, insert</span>Typing a newline into a web composer would press Return and send it.</p>
        <p class="dt-war-note"><span class="dt-war-no">Sheet 04, quit</span>A normal quit can leave an app waiting on an unsaved-changes dialog. Now it’s one dispatched operation, outcome unknown, unsafe to retry.</p>
      </div>
    </div>`}`;
}

/**
 * jev-demos, "What does fast get us?". Yellow and black, then yellow and
 * teal: a signal ink for a piece about speed. The figures carry the
 * explanation; a millisecond rule across the opening is the only ornament.
 */
function jevDemos(spread: DraftSpread): Html {
  const { draft: d, part, blocks: bs } = spread;
  const end = !spread.jump && bs.length > 0;
  const [a, b] = split(bs, 0.5);
  const ticks = [0, 100, 200, 300, 400, 500];
  return html`${part === 0 && html`<div class="pg pg-l jv-open">
      <div class="jv-ms" aria-hidden="true">
        <span class="jv-ms-band"></span>
        ${ticks.map((t) => html`<span class="jv-ms-tick"${attr('style', `--t:${t / 500}`)}>${t}</span>`)}
        <span class="jv-ms-unit">ms</span>
      </div>
      ${reg({ as: 'h2', text: d.title, class: 't-tower jv-title' })}
      <div class="jv-deck">
        ${d.kicker && html`<p class="dr-kicker">${d.kicker}</p>`}
        <p class="dr-dek">${linked(d.dekParts)}</p>
      </div>
      ${inkFig(img(d, 'fig-1-call'), { ink: 'dk', class: 'jv-fig' })}
    </div>
    <div class="pg pg-r">
      ${prose(d.key, bs, { cols: 2, dropcap: true, end })}
      ${inkFig(img(d, 'fig-2-modes'), { ink: 'dk', class: 'jv-fig' })}
      ${cont(spread)}
    </div>`}
  ${part === 1 && html`<div class="pg pg-l">
      ${inkFig(img(d, 'fig-3-budget'), { ink: 'dk', class: 'jv-fig' })}
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r">
      ${inkFig(img(d, 'fig-4-pairs'), { ink: 'dk', class: 'jv-fig' })}
      ${prose(d.key, b, { cols: 2, end })}
      ${cont(spread)}
    </div>`}`;
}

/**
 * open-remote, "The Remote in Your Pocket". The four spot inks, plus an
 * orange for the paywall pulled out on the opening spread, with the word that
 * does the damage marked up like a proof. A clock of the one day it took runs
 * across the head of every spread, with the hours that spread covers inked in.
 */
function openRemote(spread: DraftSpread): Html {
  const { draft: d, part, blocks: bs } = spread;
  const end = !spread.jump && bs.length > 0;
  const [a, b] = split(bs, 0.5);

  // the day, in hours from 08:00 to 20:00
  const FROM = 8, TO = 20;
  const at = (h: number, m: number) => (h + m / 60 - FROM) / (TO - FROM);
  const hours = Array.from({ length: TO - FROM + 1 }, (_, i) => FROM + i);
  const moments = [
    { t: at(8, 39), label: 'the ask' },
    { t: at(9, 23), label: 'on my phone' },
    { t: at(12, 15), label: '“3-4 times”' },
    { t: at(17, 44), label: 'Jellyfin' },
    { t: at(20, 0), label: '1.1.0' },
  ];
  const spans = [[at(8, 39), at(9, 23)], [at(8, 39), at(9, 0)], [at(12, 15), at(19, 49)], [at(17, 44), at(20, 0)]];
  const [s0, s1] = spans[part] ?? spans[0];

  // where the 6,303 lines of Swift go
  const lines = [
    { label: 'Screens', n: 2048 },
    { label: 'The four TVs', n: 1134, hot: true },
    { label: 'TLS, certificates, protobuf', n: 818 },
    { label: 'Jellyfin', n: 790 },
    { label: 'App and settings', n: 908 },
    { label: 'Finding TVs', n: 348 },
    { label: 'Dev tools', n: 257 },
  ];
  const most = Math.max(...lines.map((l) => l.n));

  const tvs = [
    { tv: 'Google TV, Android TV', makes: 'Sony, TCL, Chromecast', wire: 'TLS on 6467 to pair, 6466 to control; protobuf', key: 'Its own certificate, and a six-character code from the TV' },
    { tv: 'Roku', makes: '', wire: 'HTTP on 8060', key: 'Nothing' },
    { tv: 'Samsung', makes: 'Tizen, 2016 on', wire: 'WebSocket on 8002', key: 'A token, after one Allow on the TV' },
    { tv: 'LG', makes: 'webOS', wire: 'WebSocket on 3001', key: 'A client key, after one Accept on the TV' },
  ];

  const papercuts = [
    'Bundle ID never registered',
    'Xcode signed out: “Failed to Use Accounts”',
    'A keychain prompt on every rebuild',
    'An upload lost to | head',
    'POSIX error 163',
    'Every build said 1.0',
  ];

  return html`<div class="or-clock" aria-hidden="true"${attr('style', `--s0:${s0};--s1:${s1}`)}>
  <span class="or-clock-span"></span>
  ${hours.map((h) => html`<span class="or-clock-h"${attr('style', `--t:${(h - FROM) / (TO - FROM)}`)}>${String(h).padStart(2, '0')}</span>`)}
  ${moments.map((m) => html`<span class="or-clock-m"${attr('style', `--t:${m.t}`)}><i>${m.label}</i></span>`)}
</div>
${part === 0 && html`<div class="pg pg-l or-open">
      <div class="or-head">
        ${d.kicker && html`<p class="dr-kicker">${d.kicker}</p>`}
        ${reg({ as: 'h2', text: d.title, class: 't-tower or-title' })}
      </div>
      <figure class="or-wall" aria-label="A paywall redrawn: Go Premium, $12.00, a Continue button and fine print saying it renews automatically. The small word week after the price is circled in teal, with a note in the margin: a week, not a month, not a year.">
        <div class="or-wall-print" aria-hidden="true">
          <span class="or-wall-lt"></span>
          <div class="or-wall-card">
            <span class="or-wall-lock">Go Premium</span>
            <span class="or-wall-price"><b>$12</b><span>.00</span><span class="or-wall-per">/week</span></span>
            <span class="or-wall-go">Continue</span>
            <span class="or-wall-fine">Renews automatically until you cancel.</span>
          </div>
        </div>
        <p class="or-note" aria-hidden="true">A <b>week.</b> Not a month, not a year.</p>
        <figcaption class="cap">A paywall like the one I saw, redrawn without its branding. The price is the one it asked for.</figcaption>
      </figure>
    </div>
    <div class="pg pg-r or-body">
      <p class="dr-dek">${linked(d.dekParts)}</p>
      ${prose(d.key, bs, { cols: 2, dropcap: true, end })}
      ${cont(spread)}
    </div>`}
${part === 1 && html`<div class="pg pg-l or-body">
      <table class="or-tvs">
        <caption class="cap">What the app says to each kind of TV, and how it gets let in. Nothing leaves your network.</caption>
        <thead><tr><th scope="col">TV</th><th scope="col">Talks over</th><th scope="col">Gets in with</th></tr></thead>
        <tbody>
          ${tvs.map((r) => html`<tr><th scope="row">${r.tv}<span>${r.makes}</span></th><td>${r.wire}</td><td>${r.key}</td></tr>`)}
        </tbody>
      </table>
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r or-body">
      ${prose(d.key, b, { cols: 2, end })}
      <figure class="or-lines">
        <ol aria-label="Lines of Swift by part of the app">
          ${lines.map((l) => html`<li${attr('class', cls(l.hot && 'hot') || undefined)}${attr('style', `--w:${l.n / most}`)}>
              <span class="or-lines-label">${l.label}</span>
              <span class="or-lines-bar"></span>
              <span class="or-lines-n">${l.n.toLocaleString('en-US')}</span>
            </li>`)}
        </ol>
        <figcaption class="cap">Where 6,303 lines of Swift go. Talking to four kinds of TV is the smaller part.</figcaption>
      </figure>
      ${cont(spread)}
    </div>`}
${part === 2 && html`<div class="pg pg-l or-body">
      ${inkFig(img(d, 'fig-3-subject'), { ink: 'dk', class: 'or-fig' })}
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r or-body">
      <p class="or-pull" aria-hidden="true"><span>“I’ve needed to put codes</span> <span>in 3-4 times.”</span></p>
      ${prose(d.key, b, { cols: 2, end })}
      ${inkFig(img(d, 'fig-4-camera'), { ink: 'dk', class: 'or-fig' })}
      ${cont(spread)}
    </div>`}
${part === 3 && html`<div class="pg pg-l or-body">
      ${inkFig(img(d, 'fig-5-playnow'), { ink: 'dk', class: 'or-fig' })}
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r or-body">
      <div class="or-cuts">
        <p class="or-cuts-head">Not the TV</p>
        <ul>
          ${papercuts.map((c) => html`<li>${c}</li>`)}
        </ul>
      </div>
      ${prose(d.key, b, { cols: 2, end })}
      ${cont(spread)}
    </div>`}`;
}

/**
 * tasks, "Serial by Design". Blue and black, with teal for the stretch about
 * the orchestrator. A task's states run across the head of every spread and
 * advance one stage per spread, so the feature reads like a task moving
 * through the pipeline it describes.
 */
function tasks(spread: DraftSpread): Html {
  const { draft: d, part, blocks: bs } = spread;
  const end = !spread.jump && bs.length > 0;
  const [a, b] = split(bs, part === 0 ? 0 : 0.5);
  const states = ['backlog', 'queued', 'scouting', 'in review', 'ready to build', 'building', 'awaiting merge', 'done'];
  const at = [1, 3, 5, 7][part] ?? 7;
  return html`<ol class="tk-rail"${attr('aria-label', `Task state: ${states[at]}`)}>
  ${states.map((s, i) => html`<li${attr('class', cls('tk-state', i < at && 'past', i === at && 'now'))}><span>${s}</span></li>`)}
</ol>
${part === 0 && html`<div class="pg pg-l tk-open">
      <div class="tk-head">
        ${d.kicker && html`<p class="dr-kicker">${d.kicker}</p>`}
        ${reg({ as: 'h2', text: d.title, class: 't-tower tk-title' })}
        <p class="dr-dek">${linked(d.dekParts)}</p>
      </div>
      ${inkFig(img(d, 'fig-1-shapes'), { ink: 'dk', class: 'tk-fig' })}
    </div>
    <div class="pg pg-r tk-body">
      ${prose(d.key, bs, { cols: 2, dropcap: true, end })}
      ${cont(spread)}
    </div>`}
${part === 1 && html`<div class="pg pg-l tk-body">
      ${inkFig(img(d, 'fig-2-barrier'), { ink: 'dk', class: 'tk-fig' })}
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r tk-body">
      ${prose(d.key, b, { cols: 2, end })}
      ${cont(spread)}
    </div>`}
${part === 2 && html`<div class="pg pg-l tk-body">
      ${inkFig(img(d, 'fig-3-tick'), { ink: 'dk', class: 'tk-fig' })}
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r tk-body">
      <p class="tk-pull" aria-hidden="true"><span>Accumulated context</span> <span>is the product.</span></p>
      ${prose(d.key, b, { cols: 2, end })}
      ${cont(spread)}
    </div>`}
${part === 3 && html`<div class="pg pg-l tk-body">
      ${inkFig(img(d, 'fig-4-charter'), { ink: 'dk', class: 'tk-fig' })}
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r tk-body">
      ${inkFig(img(d, 'fig-5-merged'), { ink: 'dk', class: 'tk-fig' })}
      ${prose(d.key, b, { cols: 2, end })}
      ${cont(spread)}
    </div>`}`;
}

/** A draft with no design of its own yet: title, dek, facts and text. */
function generic(spread: DraftSpread): Html {
  const { draft: d, blocks: bs } = spread;
  const end = !spread.jump && bs.length > 0;
  const [a, b] = split(bs, 0.4);
  return html`<div class="pg pg-l">
  ${d.kicker && html`<p class="dr-kicker">${d.kicker}</p>`}
  ${reg({ as: 'h2', text: d.title, class: 't-tower gen-title' })}
  <p class="dr-dek">${linked(d.dekParts)}</p>
  ${prose(d.key, a, { cols: 1, dropcap: true })}
</div>
<div class="pg pg-r">
  ${prose(d.key, b, { cols: 2, end })}
  ${cont(spread)}
</div>`;
}

const DESIGNS: Record<string, (s: DraftSpread) => Html> = { 'desktop-tools': desktopTools, 'jev-demos': jevDemos, tasks, 'open-remote': openRemote };

/** One spread of a local draft, on its own art-directed design. */
export function draftSpread(spread: DraftSpread): Html {
  const { draft, part, parts } = spread;
  const design = DESIGNS[draft.slug] ?? generic;
  const label = part === 0 ? `${draft.title}, a feature` : `${draft.title}, part ${part + 1} of ${parts}`;
  const running = `${draft.kicker ?? draft.title}, ${part + 1} of ${parts}`;
  return sheet(spread, { label, layout: `dr dr-${draft.slug} dr-${draft.slug}-${part}`, running }, design(spread));
}
