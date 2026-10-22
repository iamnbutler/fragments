import { html, attr, cls, type Html } from '../html';
import { reg, linked } from '../riso';
import { img } from '../../lib/pieces';
import { split, inkFig, prose, cont, type PieceSpread } from './kit';

/** A piece with no design of its own yet: title, dek, facts and text. */
export function generic(spread: PieceSpread): Html {
  const { piece: d, blocks: bs } = spread;
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
