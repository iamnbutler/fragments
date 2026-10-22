// Checks the built site in public/: run after `bongo build`.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const read = (path) => readFileSync(`public/${path}`, 'utf8');
const manifest = JSON.parse(readFileSync('src/media.json', 'utf8'));
const keys = new Set(Object.values(manifest).map((m) => m.key));

// One kind of post: every content/<slug>.md is a piece with its own page at /<slug>/.
const slugs = readdirSync('content').filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
const pages = ['index.html', 'styleguide/index.html', ...slugs.map((slug) => `${slug}/index.html`)];

// The issue: cover, bio, then each piece in its own spreads.
const home = read('index.html');
assert.match(home, /class="[^"]*\bspread-cover\b/);
assert.match(home, /class="[^"]*\bspread-bio\b/);
assert.match(home, /class="[^"]*\bdr-desktop-tools-0\b/);
assert.match(home, /class="[^"]*\bdr-desktop-tools-1\b/);
assert.match(home, /class="[^"]*\bdr-jev-demos-0\b/);
assert.match(home, /class="[^"]*\bdr-jev-demos-1\b/);
for (let part = 0; part < 4; part++) assert.match(home, new RegExp(`class="[^"]*\\bdr-tasks-${part}\\b`));
for (const slug of slugs) assert.match(home, new RegExp(`class="[^"]*\\bdr-${slug}-0\\b`), `${slug} has no opening spread`);
// Pieces over three years old wear the archive mark.
assert.match(home, /class="[^"]*\barchive-mark\b/);
assert.ok(!existsSync('public/d') && !existsSync('public/e'), 'no /d/ or /e/ pages');
assert.match(read('_redirects'), /^\/d\/:slug\/ \/:slug\/ 301$/m);
assert.match(read('_redirects'), /^\/f\/\* \/ 302$/m);
// Cover loops are made in JS when the cover is on screen, never autoplayed in the HTML.
assert.doesNotMatch(home, /<video\b/);
assert.ok(!existsSync('public/f'), 'no /f/ pages');

// Every local reference is a hashed bundle or a media file that exists in R2.
for (const page of pages) {
  const html = read(page);
  for (const [, url] of html.matchAll(/(?:src|href|srcset)="(\/[^"#?\s,]+)/g)) {
    if (url.startsWith('/m/')) assert.ok(keys.has(url.slice(3)), `${page}: unknown media ${url}`);
    else assert.ok(existsSync(`public${url}`) || existsSync(`public${url}/index.html`), `${page}: ${url} is not built`);
  }
  // Media lives in R2: nothing loads from another host.
  const external = [...html.matchAll(/<(?:img|video|source|audio|iframe)\b[^>]*\ssrc="(https?:[^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(external, [], `${page}: external media`);
  for (const [, url] of html.matchAll(/url\((\/m\/[^)"']+)\)/g)) assert.ok(keys.has(url.slice(3)), `${page}: unknown media ${url}`);
}

// Piece spreads are art-directed in CSS: every class their markup uses
// needs a rule, or a spread renders unstyled.
const css = [...home.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
const markup = home.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '').replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');
const used = new Set([...markup.matchAll(/class="([^"]*)"/g)].flatMap((m) => m[1].split(/\s+/)));
const missing = [...used].filter((c) => /^(dt|jv|tk|tl|gen|inkfig)-/.test(c) && !new RegExp(`\\.${c}(?![\\w-])`).test(css));
assert.deepEqual(missing, [], `classes without CSS rules: ${missing.join(', ')}`);

// A piece's own page, and cache headers for hashed bundles.
const single = read('desktop-tools/index.html');
assert.match(single, /<h1\b/);
for (const ext of ['js', 'css']) assert.match(read('_headers'), new RegExp(`^/\\*\\.${ext}\\n\\s+Cache-Control: public, max-age=31536000, immutable`, 'm'));
// Dev-only tools stay out of the build.
assert.doesNotMatch(home, /data-dev|annotate/);

console.log(`Build smoke checks passed (${pages.length} pages, ${keys.size} media files).`);
