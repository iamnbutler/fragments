/**
 * The bodies of the site's pages. The layout (layouts/html.hbs) wraps each in
 * the document: head, fonts, the print shop's filters and the grain.
 */
import { html, raw, attr, cls, type Html } from './html';
import { reg, linked, plate, cover, bio, jumpSpread, postSpread } from './riso';
import { draftSpread, inkFig, plateOf } from './drafts';
import { loadDrafts, type Draft } from '../lib/drafts';
import { loadPosts, type Post } from '../lib/posts';
import { renderMarkdownWithHeadings, type MarkdownHeading } from '../lib/markdown';
import { impose, draftDesign, INK_PAIRS, printDate, readingMinutes, hash, rng, type Spread } from '../lib/zine';
import { ISSUE } from '../lib/issue';

export function spread(s: Spread): Html {
  switch (s.kind) {
    case 'cover': return cover(s);
    case 'bio': return bio(s);
    case 'jump': return jumpSpread(s);
    case 'draft': return draftSpread(s);
    case 'post': return postSpread(s);
  }
}

/** The issue: every spread, cover to colophon. */
export function issue(): Html {
  const spreads = impose(loadDrafts(), loadPosts());
  return html`<main class="zine">
    ${spreads.map(spread)}
    <footer class="colophon-end">
      <p>End of issue ${ISSUE.number}. Back to the <a href="#p-0">cover</a>.</p>
    </footer>
  </main>`;
}

export const issueDescription = () => `_fragments, issue ${ISSUE.number}, ${ISSUE.season}: work and writing from Nate Butler.`;

const titleSize = (title: string) => `--fs:clamp(44px, ${Math.min(13, Math.max(6, 110 / Math.pow(title.length, 0.7))).toFixed(2)}vw, 150px)`;

function toc(headings: MarkdownHeading[]): Html {
  return html`${headings.length > 1 && html`<nav class="margin-toc" aria-label="In this piece">
    <p class="cap">In this piece</p>
    <ol>${headings.map((h) => html`<li${attr('class', `toc-${h.level}`)}><a${attr('href', `#${h.slug}`)}>${h.text}</a></li>`)}</ol>
  </nav>`}`;
}

export interface SinglePage {
  title: string;
  description: string;
  body: Html;
}

/** An essay on its own page: the whole text, with its pictures. */
export async function essayPage(p: Post): Promise<SinglePage> {
  const { html: body, headings } = await renderMarkdownWithHeadings(p.text);
  const r = rng(hash(p.key));
  const [lt, dk] = r.pick(INK_PAIRS);
  const mins = readingMinutes(p.text);
  const description = p.text.replace(/```[\s\S]*?```|!\[[^\]]*\]\([^)]*\)|[#*_`>]/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\s+/g, ' ').trim().slice(0, 160);
  return {
    title: p.title,
    description,
    body: html`<main class="single-page single-post"${attr('style', `--lt:var(--${lt});--dk:var(--${dk});--mx:${r.range(-2.4, 2.4).toFixed(2)}px;--my:${r.range(-1.8, 1.8).toFixed(2)}px;--lx:0px;--ly:0px`)}>
    <nav class="single-nav" aria-label="Issue">
      <a href="/">_fragments, issue ${ISSUE.number}</a>
    </nav>
    <article class="sheet single-sheet paper-newsprint" data-kind="post">
      <div class="single-paper">
        <header class="single-head">
          <p class="single-kind">Essay</p>
          ${reg({ as: 'h1', text: p.title, class: 't-tower single-title', style: titleSize(p.title) })}
          <p class="cap single-meta">
            <time${attr('datetime', p.date)}>${printDate(p.date)}</time>
            <span>${mins} minute read</span>
          </p>
        </header>
        <div${attr('class', cls('single-body', headings.length > 1 && 'has-toc'))}>
          ${toc(headings)}
          <div class="prose-article dropcap-article">${raw(body)}</div>
        </div>
      </div>
    </article>
  </main>`,
  };
}

/** A local draft on its own page: the whole text, its figures and facts. */
export async function draftPage(d: Draft): Promise<SinglePage> {
  const { html: body, headings } = await renderMarkdownWithHeadings(d.text);
  const [lt, dk] = draftDesign(d.slug).inks[0];
  const r = rng(hash(d.key));
  const mins = readingMinutes(d.text);
  // Hang the pictures between sections, in order.
  const parts = body.split(/(?=<h2[\s>])/);
  const figs = d.images;
  const per = Math.max(1, Math.ceil(figs.length / Math.max(1, parts.length - 1)));
  const sections = parts.map((h, i) => ({ html: h, figs: i === 0 ? [] : figs.slice((i - 1) * per, i * per) }));
  const leftover = figs.slice((parts.length - 1) * per);
  const fig = (im: Draft['images'][number]) => im.figure
    ? inkFig(im, { ink: 'dk', class: 'draft-fig' })
    : html`<figure class="draft-shot single-plate">
        ${plate({ media: plateOf(im)!, inks: [lt, dk], fit: 'contain', proof: true })}
        <figcaption class="cap">${im.caption} <button class="proof-toggle" type="button" aria-pressed="false">Show original color</button></figcaption>
      </figure>`;
  return {
    title: d.title,
    description: d.dek,
    body: html`<main class="single-page single-post single-draft"${attr('style', `--lt:var(--${lt});--dk:var(--${dk});--mx:${r.range(-2.4, 2.4).toFixed(2)}px;--my:${r.range(-1.8, 1.8).toFixed(2)}px;--lx:0px;--ly:0px`)}>
    <nav class="single-nav" aria-label="Issue">
      <a href="/">_fragments, issue ${ISSUE.number}</a>
    </nav>
    <article class="sheet single-sheet paper-newsprint" data-kind="draft">
      <div class="single-paper">
        <header class="single-head">
          ${d.kicker && html`<p class="single-kind">${d.kicker}</p>`}
          ${reg({ as: 'h1', text: d.title, class: 't-tower single-title', style: titleSize(d.title) })}
          <p class="draft-dek">${linked(d.dekParts)}</p>
          <p class="cap single-meta">
            <time${attr('datetime', d.date)}>${printDate(d.date)}</time>
            <span>${mins} minute read</span>
            ${d.repo && html`<a${attr('href', d.repo)} target="_blank" rel="noopener">Source</a>`}
          </p>
        </header>
        <div${attr('class', cls('single-body', headings.length > 1 && 'has-toc'))}>
          ${toc(headings)}
          <div class="prose-article dropcap-article">
            ${sections.map((s) => html`${raw(s.html)}${s.figs.map(fig)}`)}
            ${leftover.map(fig)}
          </div>
        </div>
        <footer class="draft-foot">
          ${d.facts.length > 0 && html`<dl class="draft-facts">${d.facts.map((f) => html`<dt>${f.label}</dt><dd>${f.value}</dd>`)}</dl>`}
          ${d.links.length > 0 && html`<ul class="draft-links">${d.links.map((l) => html`<li><a${attr('href', l.url)} target="_blank" rel="noopener">${l.label}</a></li>`)}</ul>`}
        </footer>
      </div>
    </article>
  </main>`,
  };
}
