import { html, type Html } from '../html';
import { reg, linked } from '../riso';
import { img } from '../../lib/pieces';
import { split, inkFig, prose, cont, type PieceSpread } from './kit';

/**
 * desktop-tools. Blue and red on off-white, so it reads as Ace's sibling
 * rather than its next chapter. It opens on the agent working a Mac on
 * strings; each figure gets a page's width, and the stamps and keys live in
 * the figures themselves.
 */
export function desktopTools(spread: PieceSpread): Html {
  const { piece: d, part, blocks: bs } = spread;
  const end = !spread.jump && bs.length > 0;
  const [a, b] = split(bs, part === 0 ? 0.42 : part === 1 ? 0.45 : 0.62);
  return html`${part === 0 && html`<div class="pg pg-l dt-open">
      ${inkFig(img(d, 'ill-1-strings'), { class: 'dt-strings', caption: false })}
      ${reg({ as: 'h2', text: d.title, class: 't-tower dt-title', style: '--lt:var(--blue);--dk:var(--red)' })}
      <div class="dt-deck">
        ${d.kicker && html`<p class="dr-kicker">${d.kicker}</p>`}
        <p class="dr-dek">${linked(d.dekParts)}</p>
      </div>
      ${prose(d.key, a, { cols: 2, dropcap: true })}
    </div>
    <div class="pg pg-r dt-body">
      ${inkFig(img(d, 'fig-1-boundary'), { class: 'dt-fig' })}
      ${prose(d.key, b, { cols: 2, end })}
      ${cont(spread)}
    </div>`}
  ${part === 1 && html`<div class="pg pg-l dt-body">
      ${inkFig(img(d, 'fig-2-loop'), { class: 'dt-fig' })}
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r dt-body">
      ${prose(d.key, b, { cols: 2, end })}
      ${inkFig(img(d, 'fig-3-stack-to-port'), { class: 'dt-fig dt-fig-foot' })}
      ${cont(spread)}
    </div>`}
  ${part === 2 && html`<div class="pg pg-l dt-body">
      ${inkFig(img(d, 'fig-4-handover'), { class: 'dt-fig' })}
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r dt-body">
      ${prose(d.key, b, { cols: 2, end })}
      <figure class="dt-nums">
        <div class="dt-num"><span class="dt-num-was">115</span><span class="dt-num-is">6<small>ms</small></span><span class="dt-num-what"><code class="ic">desktop_windows</code>, at the median</span></div>
        <div class="dt-num"><span class="dt-num-was">551</span><span class="dt-num-is">42<small>ms</small></span><span class="dt-num-what">inspecting a Ghostty window</span></div>
        <div class="dt-num"><span class="dt-num-was">84</span><span class="dt-num-is">6<small>MB</small></span><span class="dt-num-what">the app’s binaries, about</span></div>
        <figcaption class="cap">Before native2, struck through; after, in red.</figcaption>
      </figure>
      ${cont(spread)}
    </div>`}`;
}
