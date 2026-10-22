import { html, attr, type Html } from '../html';
import { reg, linked } from '../riso';
import { img } from '../../lib/pieces';
import { split, inkFig, prose, cont, type PieceSpread } from './kit';

/**
 * telephone-line, "Every Agent Gets a Number". A manual exchange: a
 * strip of jacks runs across the head of every spread, with one red patch
 * cord plugged in differently on each, and the dek is a call ticket. Red is
 * anything live; blue is the Codex side.
 */
export function telephoneLine(spread: PieceSpread): Html {
  const { piece: d, part, blocks: bs } = spread;
  const end = !spread.jump && bs.length > 0;
  const [a, b] = split(bs, 0.5);
  return html`${board(part)}${part === 0 && html`<div class="pg pg-l tl-open">
      <div class="tl-head">
        ${d.kicker && html`<p class="dr-kicker">${d.kicker}</p>`}
        ${reg({ as: 'h2', text: d.title, class: 't-tower tl-title' })}
      </div>
      <div class="tl-ticket">
        <p class="tl-ticket-head"><span>Call ticket</span> <span>No. 0914</span></p>
        <p class="dr-dek">${linked(d.dekParts)}</p>
        <p class="tl-ticket-foot"><span>From codex:…</span> <span>To claude:…</span></p>
      </div>
      ${inkFig(img(d, 'ill-1-candlestick'), { class: 'tl-phone', caption: false })}
    </div>
    <div class="pg pg-r">
      ${prose(d.key, bs, { cols: 2, dropcap: true, end })}
      ${cont(spread)}
    </div>`}
  ${part === 1 && html`<div class="pg pg-l">
      ${inkFig(img(d, 'fig-4-team'), { class: 'tl-fig' })}
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r">
      <p class="tl-pull" aria-hidden="true"><span>Telephone takes me</span> <span>out of the middle.</span></p>
      ${prose(d.key, b, { cols: 2 })}
      ${inkFig(img(d, 'fig-3-two-phones'), { class: 'tl-fig' })}
      ${cont(spread)}
    </div>`}
  ${part === 2 && html`<div class="pg pg-l">
      ${inkFig(img(d, 'fig-1-route'), { class: 'tl-fig' })}
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r">
      ${inkFig(img(d, 'fig-2-window'), { class: 'tl-fig' })}
      ${prose(d.key, b, { cols: 2, end })}
      ${cont(spread)}
    </div>`}`;
}

// The jack field: sixteen jacks, and one cord between two of them, a
// different pair on each spread.
const JACKS = 16;
const PATCHES: [number, number][] = [[2, 9], [5, 13], [1, 14]];
function board(part: number): Html {
  const [p, q] = PATCHES[part % PATCHES.length];
  const x = (i: number) => 20 + i * (960 / (JACKS - 1));
  const sag = 10 + (q - p);
  return html`<div class="tl-board" aria-hidden="true">
    <svg viewBox="0 0 1000 34">
      ${Array.from({ length: JACKS }, (_, i) => html`<circle${attr('class', i === p || i === q ? 'tl-jack is-on' : 'tl-jack')}${attr('cx', x(i))} cy="12" r="5"></circle>`)}
      <path class="tl-cord"${attr('d', `M${x(p)} 12 C${x(p)} ${12 + sag}, ${x(q)} ${12 + sag}, ${x(q)} 12`)}></path>
    </svg>
  </div>`;
}
