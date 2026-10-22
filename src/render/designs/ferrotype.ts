import { html, type Html } from '../html';
import { reg, linked } from '../riso';
import { img } from '../../lib/pieces';
import { split, inkFig, prose, cont, type PieceSpread } from './kit';

/**
 * ferrotype, "Types worth keeping". Named for the tintype, so the opener is a
 * plate: the illustration and the title reversed out of black. Then blue and
 * black for the derive, and red for the drift it exists to catch.
 */
export function ferrotype(spread: PieceSpread): Html {
  const { piece: d, part, blocks: bs } = spread;
  const end = !spread.jump && bs.length > 0;
  const [a, b] = split(bs, 0.5);
  return html`${part === 0 && html`<div class="pg pg-l fe-open">
      <div class="fe-plate">
        ${inkFig(img(d, 'ill-1-tintype'), { class: 'fe-tintype', caption: false })}
        ${reg({ as: 'h2', text: d.title, class: 't-tower fe-title' })}
      </div>
      ${d.kicker && html`<p class="dr-kicker">${d.kicker}</p>`}
      <p class="dr-dek">${linked(d.dekParts)}</p>
    </div>
    <div class="pg pg-r">
      ${inkFig(img(d, 'fig-1-tree'), { class: 'fe-fig' })}
      ${prose(d.key, bs, { cols: 2, dropcap: true, end })}
      ${cont(spread)}
    </div>`}
  ${part === 1 && html`<div class="pg pg-l">
      ${inkFig(img(d, 'fig-2-registry'), { class: 'fe-fig' })}
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r">
      ${inkFig(img(d, 'fig-3-compile-error'), { class: 'fe-fig fe-tall' })}
      ${prose(d.key, b, { cols: 2, end })}
      ${cont(spread)}
    </div>`}
  ${part === 2 && html`<div class="pg pg-l">
      ${inkFig(img(d, 'fig-4-drift'), { class: 'fe-fig' })}
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r">
      ${inkFig(img(d, 'fig-5-timeline'), { class: 'fe-fig' })}
      ${prose(d.key, b, { cols: 2, end })}
      ${cont(spread)}
    </div>`}`;
}
