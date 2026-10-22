import { html, attr, cls, type Html } from '../html';
import { reg, linked } from '../riso';
import { img } from '../../lib/pieces';
import { split, inkFig, prose, cont, type PieceSpread } from './kit';

/**
 * jev-demos, "What does fast get us?". Yellow and black, then yellow and
 * red: a signal ink for a piece about speed. The figures carry the
 * explanation; a millisecond rule across the opening is the only ornament.
 */
export function jevDemos(spread: PieceSpread): Html {
  const { piece: d, part, blocks: bs } = spread;
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
      ${inkFig(img(d, 'fig-1-call'), { class: 'jv-fig' })}
    </div>
    <div class="pg pg-r">
      ${prose(d.key, bs, { cols: 2, dropcap: true, end })}
      ${inkFig(img(d, 'fig-2-modes'), { class: 'jv-fig' })}
      ${cont(spread)}
    </div>`}
  ${part === 1 && html`<div class="pg pg-l">
      ${inkFig(img(d, 'fig-3-budget'), { class: 'jv-fig' })}
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r">
      ${inkFig(img(d, 'fig-4-pairs'), { class: 'jv-fig' })}
      ${prose(d.key, b, { cols: 2, end })}
      ${cont(spread)}
    </div>`}`;
}
