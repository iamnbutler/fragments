import { html, type Html } from '../html';
import { reg, linked } from '../riso';
import { img } from '../../lib/pieces';
import { inkFig, prose, cont, type PieceSpread } from './kit';

/**
 * fig-gen, "Sixty gens in two hours". The series was black frames with
 * one-pixel marks, so the opener prints on toner: one generation, large,
 * on the left page. The graphing calculator closes it out.
 */
export function figGen(spread: PieceSpread): Html {
  const { piece: d, part, blocks: bs } = spread;
  const end = !spread.jump && bs.length > 0;
  return html`${part === 0 && html`<div class="pg pg-l fg-open">
      ${d.kicker && html`<p class="dr-kicker">${d.kicker}</p>`}
      ${reg({ as: 'h2', text: d.title, class: 't-tower fg-title' })}
      <p class="dr-dek">${linked(d.dekParts)}</p>
      ${inkFig(img(d, 'fig-1-one-gen'), { class: 'fg-gen' })}
    </div>
    <div class="pg pg-r">
      ${prose(d.key, bs, { cols: 2, dropcap: true, end })}
      ${cont(spread)}
    </div>`}
  ${part === 1 && html`<div class="pg pg-l">
      ${prose(d.key, bs, { cols: 2, end })}
      ${cont(spread)}
    </div>
    <div class="pg pg-r fg-calc">
      ${inkFig(img(d, 'ill-1-graphing-calculator'), { caption: false })}
    </div>`}`;
}
