import { html, type Html } from '../html';
import { reg, linked } from '../riso';
import { img } from '../../lib/pieces';
import { split, inkFig, prose, cont, type PieceSpread } from './kit';

/**
 * autoblog, "How did we do that again?". Yellow and black, then blue. The
 * journal's index card sits on the opener; the figures walk through how an
 * entry gets written, then how it's found again.
 */
export function autoblog(spread: PieceSpread): Html {
  const { piece: d, part, blocks: bs } = spread;
  const end = !spread.jump && bs.length > 0;
  const [a, b] = split(bs, 0.5);
  return html`${part === 0 && html`<div class="pg pg-l ab-open">
      <p class="ab-tab" aria-hidden="true">Journal · notes &amp; posts</p>
      ${d.kicker && html`<p class="dr-kicker">${d.kicker}</p>`}
      ${reg({ as: 'h2', text: d.title, class: 't-tower ab-title' })}
      <p class="dr-dek">${linked(d.dekParts)}</p>
      ${inkFig(img(d, 'ill-1-card'), { class: 'ab-card', caption: false })}
    </div>
    <div class="pg pg-r">
      ${prose(d.key, bs, { cols: 2, dropcap: true, end })}
      ${cont(spread)}
    </div>`}
  ${part === 1 && html`<div class="pg pg-l">
      ${inkFig(img(d, 'fig-1-checkpoint'), { class: 'ab-fig' })}
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r">
      ${inkFig(img(d, 'fig-2-two-passes'), { class: 'ab-fig' })}
      ${prose(d.key, b, { cols: 2, end })}
      ${cont(spread)}
    </div>`}
  ${part === 2 && html`<div class="pg pg-l">
      ${prose(d.key, a, { cols: 2 })}
      ${inkFig(img(d, 'fig-3-recall'), { class: 'ab-fig' })}
    </div>
    <div class="pg pg-r">
      ${inkFig(img(d, 'fig-4-timeline'), { class: 'ab-fig' })}
      ${prose(d.key, b, { cols: 2, end })}
      ${cont(spread)}
    </div>`}`;
}
