import { html, type Html } from '../html';
import { reg, linked } from '../riso';
import { img } from '../../lib/pieces';
import { split, inkFig, prose, cont, type PieceSpread } from './kit';

/**
 * spool, "A lease on the work". Blue and black on bone, then yellow. The
 * spool itself stands beside the title, and its thread runs across the head
 * of every spread, one event per bead.
 */
export function spool(spread: PieceSpread): Html {
  const { piece: d, part, blocks: bs } = spread;
  const end = !spread.jump && bs.length > 0;
  const [a, b] = split(bs, 0.5);
  const thread = html`<div class="sp-thread" aria-hidden="true"></div>`;
  return html`${thread}${part === 0 && html`<div class="pg pg-l sp-open">
      <div class="sp-head">
        ${d.kicker && html`<p class="dr-kicker">${d.kicker}</p>`}
        ${reg({ as: 'h2', text: d.title, class: 't-tower sp-title' })}
        <p class="dr-dek">${linked(d.dekParts)}</p>
      </div>
      ${inkFig(img(d, 'ill-1-spool'), { class: 'sp-spool', caption: false })}
    </div>
    <div class="pg pg-r">
      ${prose(d.key, bs, { cols: 2, dropcap: true, end })}
      ${cont(spread)}
    </div>`}
  ${part === 1 && html`<div class="pg pg-l">
      ${inkFig(img(d, 'fig-1-two-places'), { class: 'sp-fig' })}
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r">
      ${inkFig(img(d, 'fig-2-lease'), { class: 'sp-fig' })}
      ${prose(d.key, b, { cols: 2, end })}
      ${cont(spread)}
    </div>`}
  ${part === 2 && html`<div class="pg pg-l">
      ${inkFig(img(d, 'fig-3-append'), { class: 'sp-fig' })}
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r">
      ${prose(d.key, b, { cols: 2, end })}
      ${inkFig(img(d, 'fig-4-race'), { class: 'sp-fig' })}
      ${cont(spread)}
    </div>`}`;
}
