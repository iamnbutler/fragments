/**
 * _fragments, built by bongo. Pages render from TypeScript (src/render) as
 * partials and as the loader for the pieces in content/; layouts/html.hbs
 * wraps every page in the document.
 */
import './src/render/dev-media';
import path from 'node:path';
import type { Config } from 'bongo';
import matter from 'gray-matter';
import { issue, issueDescription, piecePage } from './src/render/pages';
import { styleguide } from './src/render/styleguide';
import { inks } from './src/render/riso';
import { loadPieces } from './src/lib/pieces';
import { media } from './src/lib/media';

const dev = process.argv.includes('dev');

// Variable Latin subsets of Archivo and Source Serif 4, served from media.
// Archivo is preloaded; the roman serif only when a page asks, since on the
// issue it would compete with the cover still for the first paint.
function head(params: { preloadSerif?: boolean }): string {
  const archivo = media('fonts/archivo').url;
  const serif = media('fonts/source-serif-4').url;
  const serifItalic = media('fonts/source-serif-4-italic').url;
  return [
    `<link rel="preload" href="${archivo}" as="font" type="font/woff2" crossorigin />`,
    params.preloadSerif ? `<link rel="preload" href="${serif}" as="font" type="font/woff2" crossorigin />` : '',
    `<style>
@font-face { font-family: 'Archivo'; font-style: normal; font-weight: 100 900; font-stretch: 62% 125%; font-display: swap; src: url(${archivo}) format('woff2'); }
@font-face { font-family: 'Source Serif 4'; font-style: normal; font-weight: 300 700; font-display: swap; src: url(${serif}) format('woff2'); }
@font-face { font-family: 'Source Serif 4'; font-style: italic; font-weight: 300 700; font-display: swap; src: url(${serifItalic}) format('woff2'); }
</style>`,
  ].filter(Boolean).join('\n  ');
}

// a blue underscore on yellow, inline so it costs no request
const ICON = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="#FCC135"/><rect x="3" y="11" width="10" height="2.5" fill="#4F77D6"/></svg>')}`;

// `dev` and `icon` are ours; templates read them as $site.dev and $site.icon.
const site = { title: '_fragments', url: 'https://nate.rip/', lang: 'en', dev, icon: ICON };

export default {
  $site: site,
  $build: { target: ['chrome >= 120', 'safari >= 17.4', 'firefox >= 121'] },
  $utils: { head, issueDescription },
  $partials: {
    issue: () => issue().value,
    styleguide: () => styleguide().value,
    inks: () => inks().value,
  },
  $loaders: {
    // A piece (content/<slug>.md) on its own page.
    async md(file: string) {
      const slug = path.basename(file, '.md');
      const piece = loadPieces().find((p) => p.slug === slug);
      if (!piece || path.basename(path.dirname(file)) !== 'content') throw new Error(`${file}: pieces live in content/<slug>.md`);
      const page = await piecePage(piece);
      return {
        filename: file.replace(/\.md$/, '.html'),
        content: page.body.value,
        // `draft` and `date` stay out: bongo would hold back drafts and future dates.
        metadata: { title: page.title, description: page.description, bodyClass: 'single', preloadSerif: true, script: 'single' },
      };
    },
  },
} satisfies Config;
