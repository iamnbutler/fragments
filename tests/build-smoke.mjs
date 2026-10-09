// Checks the built site in dist/: run after `astro build`.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = (path) => readFileSync(`dist/${path}`, 'utf8');
const manifest = JSON.parse(readFileSync('src/media.json', 'utf8'));
const keys = new Set(Object.values(manifest).map((m) => m.key));

const pages = ['index.html', 'd/desktop-tools/index.html', 'styleguide/index.html'];

// The issue: cover, bio, then the desktop-tools feature in its own spreads.
const home = read('index.html');
assert.match(home, /class="[^"]*\bspread-cover\b/);
assert.match(home, /class="[^"]*\bspread-bio\b/);
assert.match(home, /class="[^"]*\bdr-desktop-tools-0\b/);
assert.match(home, /class="[^"]*\bdr-desktop-tools-1\b/);
// Cover loops are made in JS when the cover is on screen, never autoplayed in the HTML.
assert.doesNotMatch(home, /<video\b/);
assert.ok(!existsSync('dist/f'), 'no /f/ pages');

// Every local reference is a hashed bundle or a media file that exists in R2.
for (const page of pages) {
  const html = read(page);
  for (const [, url] of html.matchAll(/(?:src|href|srcset)="(\/[^"#?\s,]+)/g)) {
    if (url.startsWith('/m/')) assert.ok(keys.has(url.slice(3)), `${page}: unknown media ${url}`);
    else assert.ok(url.startsWith('/_astro/') || existsSync(`dist${url}`) || existsSync(`dist${url}/index.html`), `${page}: ${url} is not built`);
  }
  for (const [, url] of html.matchAll(/url\((\/m\/[^)"']+)\)/g)) assert.ok(keys.has(url.slice(3)), `${page}: unknown media ${url}`);
}

// Feature spreads are art-directed in CSS: every class their markup uses
// needs a rule, or a spread renders unstyled.
const css = [...home.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
const markup = home.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '').replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');
const used = new Set([...markup.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)));
const missing = [...used].filter((c) => /^(dt|gen|inkfig)-/.test(c) && !new RegExp(`\\.${c}(?![\\w-])`).test(css));
assert.deepEqual(missing, [], `classes without CSS rules: ${missing.join(', ')}`);

// The draft's own page, and cache headers for hashed bundles.
const single = read('d/desktop-tools/index.html');
assert.match(single, /<h1\b/);
assert.match(read('_headers'), /^\/_astro\/\*\n\s+Cache-Control: public, max-age=31536000, immutable/m);

console.log(`Build smoke checks passed (${pages.length} pages, ${keys.size} media files).`);
