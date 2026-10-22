import { html, attr, cls, type Html } from '../html';
import { reg, linked } from '../riso';
import { img } from '../../lib/pieces';
import { split, inkFig, prose, cont, type PieceSpread } from './kit';

/**
 * tasks, "Serial by Design". Blue and black, with red for the stretch about
 * the orchestrator. A task's states run across the head of every spread and
 * advance one stage per spread, so the feature reads like a task moving
 * through the pipeline it describes.
 */
export function tasks(spread: PieceSpread): Html {
  const { piece: d, part, blocks: bs } = spread;
  const end = !spread.jump && bs.length > 0;
  const [a, b] = split(bs, part === 0 ? 0 : 0.5);
  const states = ['backlog', 'queued', 'scouting', 'in review', 'ready to build', 'building', 'awaiting merge', 'done'];
  const at = [1, 3, 5, 7][part] ?? 7;
  return html`<ol class="tk-rail"${attr('aria-label', `Task state: ${states[at]}`)}>
  ${states.map((s, i) => html`<li${attr('class', cls('tk-state', i < at && 'past', i === at && 'now'))}><span>${s}</span></li>`)}
</ol>
${part === 0 && html`<div class="pg pg-l tk-open">
      <div class="tk-head">
        ${d.kicker && html`<p class="dr-kicker">${d.kicker}</p>`}
        ${reg({ as: 'h2', text: d.title, class: 't-tower tk-title' })}
        <p class="dr-dek">${linked(d.dekParts)}</p>
      </div>
      ${inkFig(img(d, 'fig-1-shapes'), { class: 'tk-fig' })}
    </div>
    <div class="pg pg-r tk-body">
      ${prose(d.key, bs, { cols: 2, dropcap: true, end })}
      ${cont(spread)}
    </div>`}
${part === 1 && html`<div class="pg pg-l tk-body">
      ${inkFig(img(d, 'fig-2-barrier'), { class: 'tk-fig' })}
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r tk-body">
      ${prose(d.key, b, { cols: 2, end })}
      ${cont(spread)}
    </div>`}
${part === 2 && html`<div class="pg pg-l tk-body">
      ${inkFig(img(d, 'fig-3-tick'), { class: 'tk-fig' })}
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r tk-body">
      <p class="tk-pull" aria-hidden="true"><span>Accumulated context</span> <span>is the product.</span></p>
      ${prose(d.key, b, { cols: 2, end })}
      ${cont(spread)}
    </div>`}
${part === 3 && html`<div class="pg pg-l tk-body">
      ${inkFig(img(d, 'fig-4-charter'), { class: 'tk-fig' })}
      ${prose(d.key, a, { cols: 2 })}
    </div>
    <div class="pg pg-r tk-body">
      ${inkFig(img(d, 'fig-5-merged'), { class: 'tk-fig' })}
      ${prose(d.key, b, { cols: 2, end })}
      ${cont(spread)}
    </div>`}`;
}
