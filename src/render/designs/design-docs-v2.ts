import { html, type Html } from '../html';
import { reg, linked } from '../riso';
import { img } from '../../lib/pieces';
import { split, inkFig, prose, cont, type PieceSpread } from './kit';

/**
 * design-docs-v2, "Design Docs, version two". A guide's page: a red margin
 * rule down the left like a ruled notebook, the road that forks on the
 * opener, and the many hands that keep it going on the second spread.
 */
export function designDocsV2(spread: PieceSpread): Html {
  const { piece: d, part, blocks: bs } = spread;
  const end = !spread.jump && bs.length > 0;
  const [a, b] = split(bs, 0.45);
  return html`${part === 0 && html`<div class="pg pg-l dd-open">
      ${d.kicker && html`<p class="dr-kicker">${d.kicker}</p>`}
      ${reg({ as: 'h2', text: d.title, class: 't-tower dd-title' })}
      <p class="dr-dek">${linked(d.dekParts)}</p>
      ${inkFig(img(d, 'ill-1-branching-road'), { class: 'dd-road', caption: false })}
    </div>
    <div class="pg pg-r">
      ${prose(d.key, bs, { cols: 2, dropcap: true, end })}
      ${cont(spread)}
    </div>`}
  ${part === 1 && html`<div class="pg pg-l">
      ${inkFig(img(d, 'fig-1-words-in-files'), { class: 'dd-fig' })}
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r">
      ${prose(d.key, b, { cols: 2, end })}
      ${inkFig(img(d, 'ill-2-many-hands'), { class: 'dd-hands', caption: false })}
      ${cont(spread)}
    </div>`}`;
}
