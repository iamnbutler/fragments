import { html, attr, cls, type Html } from '../html';
import { reg, linked } from '../riso';
import { img } from '../../lib/pieces';
import { split, inkFig, prose, cont, type PieceSpread } from './kit';

/**
 * open-remote, "The Remote in Your Pocket". The four spot inks, plus an
 * orange for the paywall pulled out on the opening spread, with the word that
 * does the damage marked up like a proof. A clock of the one day it took runs
 * across the head of every spread, with the hours that spread covers inked in.
 */
export function openRemote(spread: PieceSpread): Html {
  const { piece: d, part, blocks: bs } = spread;
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
