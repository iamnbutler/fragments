import { html, attr, cls, type Html } from '../html';
import { reg, linked } from '../riso';
import { img } from '../../lib/pieces';
import { split, inkFig, prose, cont, type PieceSpread } from './kit';

/**
 * desktop-tools. Blue and red on off-white, no yellow, so it reads as
 * Ace's sibling rather than its next chapter. Black is only for the patent
 * line work and the three outcome words.
 */
export function desktopTools(spread: PieceSpread): Html {
  const { piece: d, part, blocks: bs } = spread;
  const end = !spread.jump && bs.length > 0;
  const [a, b] = split(bs, part === 0 ? 0.42 : 0.5);
  const keys = ['Accessibility', 'Screen Recording', 'Event Synthesizing'];
  return html`${part === 0 && html`<div class="pg pg-l dt-open">
      <div class="dt-window" aria-hidden="true">
        <span class="dt-lights"><i></i><i></i><i></i></span>
        <span class="dt-screen"></span>
        <span class="dt-cursor"></span>
      </div>
      ${reg({ as: 'h2', text: d.title, class: 't-tower dt-title', style: '--lt:var(--blue);--dk:var(--red)' })}
      <div class="dt-deck">
        ${d.kicker && html`<p class="dr-kicker">${d.kicker}</p>`}
        <p class="dr-dek">${linked(d.dekParts)}</p>
      </div>
      ${prose(d.key, a, { cols: 2, dropcap: true })}
    </div>
    <div class="pg pg-r dt-manual">
      ${inkFig(img(d, 'fig-1-boundary'), { class: 'dt-fig1' })}
      <div class="dt-hook" role="group" aria-label="The three macOS grants, held by the app">
        <span class="dt-hook-bar" aria-hidden="true"></span>
        ${keys.map((k, i) => html`<span class="dt-key"${attr('style', `--i:${i}`)}>
            <svg viewBox="0 0 60 24" aria-hidden="true"><circle cx="11" cy="12" r="8" /><circle cx="11" cy="12" r="3" /><path d="M19 12h38M44 12v7M51 12v5" /></svg>
            <span>${k}</span>
          </span>`)}
      </div>
      ${prose(d.key, b, { cols: 2, end })}
      ${cont(spread)}
    </div>`}
  ${part === 1 && html`<div class="dt-strip">
      ${inkFig(img(d, 'fig-2-loop'), { caption: false })}
    </div>
    <div class="dt-stamps" role="group" aria-label="The three outcomes">
      <span class="dt-out out-done">Completed</span>
      <span class="dt-out out-refused">Refused</span>
      <span class="dt-out out-unknown" data-text="Unknown">Unknown</span>
    </div>
    <div class="dt-body">
      <p class="cap">${`${img(d, 'fig-2-loop')?.caption ?? ''} ${img(d, 'fig-3-stack-to-port')?.caption ?? ''}`.trim()}</p>
      ${prose(d.key, bs, { cols: 3, end })}
      ${cont(spread)}
    </div>
    <div class="dt-stack">
      ${inkFig(img(d, 'fig-3-stack-to-port'), { caption: false })}
      <div class="dt-war">
        <p class="dt-war-note"><span class="dt-war-no">Sheet 02, insert</span>Typing a newline into a web composer would press Return and send it.</p>
        <p class="dt-war-note"><span class="dt-war-no">Sheet 04, quit</span>A normal quit can leave an app waiting on an unsaved-changes dialog. Now it’s one dispatched operation, outcome unknown, unsafe to retry.</p>
      </div>
    </div>`}`;
}
