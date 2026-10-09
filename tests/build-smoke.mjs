import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(`dist/${path}`, 'utf8');
assert.equal(read('CNAME').trim(), 'nate.rip');

// Home: one issue of spreads, opening on the cover and the bio.
const home = read('index.html');
assert.match(home, /<main\b/);
assert.match(home, /class="[^"]*\bspread-cover\b/);
assert.match(home, /class="[^"]*\bspread-bio\b/);
assert.doesNotMatch(home, /<video[^>]*\sautoplay(?:\s|=|>)/);
for (const id of [5, 6, 7, 8]) {
  const videos = home.match(new RegExp(`<video\\b[^>]*aria-label="Fixture video ${id}"[^>]*>[\\s\\S]*?</video>`, 'g')) ?? [];
  assert.equal(videos.length, 1, `Exactly one homepage player for fragment ${id}`);
  assert.match(videos[0], /<video[^>]*\scontrols(?:\s|=|>)/);
  assert.match(videos[0], new RegExp(`<source[^>]*fixture-video-${id}[^>]*type="video/mp4"`));
}
assert.match(home, /<img[^>]*fixture-image[^>]*alt="Fixture image"/);

for (let id = 1; id <= 8; id++) {
  const page = read(`f/${id}/index.html`);
  assert.match(page, /id="repeated-heading-1"/);
  assert.match(page, /href="#repeated-heading-1"/);
  assert.match(page, /rel="site.standard.document"/);
}
for (const id of [5, 6, 7, 8]) {
  const page = read(`f/${id}/index.html`);
  const videos = page.match(/<video\b[^>]*>[\s\S]*?<\/video>/g) ?? [];
  assert.equal(videos.length, 1, `Exactly one player for fragment ${id}`);
  const video = videos[0];
  assert.match(video, /<video[^>]*\scontrols(?:\s|=|>)/);
  assert.match(video, /<video[^>]*\splaysinline(?:\s|=|>)/);
  assert.match(video, /<video[^>]*preload="metadata"/);
  assert.match(video, new RegExp(`aria-label="Fixture video ${id}"`));
  assert.match(video, new RegExp(`<source[^>]*fixture-video-${id}[^>]*type="video/mp4"`));
  assert.match(video, new RegExp(`<a[^>]*href="[^"]*fixture-video-${id}"`));
  assert.doesNotMatch(video, /\sautoplay(?:\s|=|>)/);
  assert.doesNotMatch(page, new RegExp(`<img[^>]*fixture-video-${id}`));
}
assert.match(read('f/2/index.html'), /<img[^>]*fixture-image[^>]*alt="Fixture image"/);
assert.match(read('f/5/index.html'), /<img[^>]*fixture-mixed-image[^>]*alt="Mixed gallery image"/);
assert.match(read('.well-known/site.standard.publication'), /^at:\/\//);
console.log('Offline build smoke checks passed (8 fixture fragments; not production content).');
