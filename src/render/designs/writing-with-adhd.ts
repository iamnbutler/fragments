import { html, type Html } from '../html';
import { reg, linked } from '../riso';
import { img } from '../../lib/pieces';
import { split, inkFig, prose, cont, type PieceSpread } from './kit';

/**
 * writing-with-adhd, "Writing with ADHD". Yellow and red: the title is
 * highlighted like a note to self, and the odd piece out sits a little
 * crooked on the opener. Geraint's four traits get the second spread.
 */
export function writingWithAdhd(spread: PieceSpread): Html {
  const { piece: d, part, blocks: bs } = spread;
  const end = !spread.jump && bs.length > 0;
  const [a, b] = split(bs, 0.5);
  return html`${part === 0 && html`<div class="pg pg-l wa-open">
      ${d.kicker && html`<p class="dr-kicker">${d.kicker}</p>`}
      ${reg({ as: 'h2', text: d.title, class: 't-tower wa-title' })}
      <p class="dr-dek">${linked(d.dekParts)}</p>
      ${inkFig(img(d, 'ill-1-odd-piece'), { class: 'wa-odd', caption: false })}
    </div>
    <div class="pg pg-r">
      ${prose(d.key, bs, { cols: 2, dropcap: true, end })}
      ${cont(spread)}
    </div>`}
  ${part === 1 && html`<div class="pg pg-l">
      ${inkFig(img(d, 'fig-1-four-traits'), { class: 'wa-fig' })}
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r">
      ${prose(d.key, b, { cols: 2, end })}
      ${inkFig(img(d, 'ill-2-drafts-then-sent'), { class: 'wa-sent', caption: false })}
      ${cont(spread)}
    </div>`}`;
}
