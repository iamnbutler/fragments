/**
 * The page rail: on a wide screen, a tick for every spread down the right
 * margin, like Time Machine's timeline. The spread in view is marked and
 * labelled; ticks swell toward the pointer, and clicking one turns to it.
 * It only appears when the margin beside the spread can hold it.
 */

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Room the rail needs to the right of the spread, in CSS pixels. */
const MIN_GAP = 64;
/** Room it needs to show labels beside the ticks without covering the spread. */
const LABEL_GAP = 250;
/** How far, in pixels, a tick's swell reaches toward the pointer. */
const REACH = 44;

export function pageRail(sheets: HTMLElement[]) {
  const spread = sheets[0]?.querySelector<HTMLElement>('.spread');
  if (!spread) return;

  const nav = document.createElement('nav');
  nav.className = 'pagerail';
  nav.setAttribute('aria-label', 'Pages');
  nav.style.setProperty('--n', String(sheets.length));
  const list = document.createElement('ol');
  nav.append(list);

  let section = '';
  const items = sheets.map((s) => {
    const page = Number(s.id.replace('p-', ''));
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = `#${s.id}`;
    const tick = document.createElement('span');
    tick.className = 'pr-tick';
    tick.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.className = 'pr-label';
    const title = document.createElement('b');
    title.textContent = s.dataset.title || s.dataset.sectionTitle || `Page ${page}`;
    const folio = document.createElement('span');
    folio.textContent = page === 0 ? 'Cover' : `pp. ${page}–${page + 1}`;
    label.append(title, folio);
    a.append(tick, label);
    li.append(a);
    // a longer tick where a new piece starts
    if (s.dataset.section !== section) li.classList.add('pr-start');
    section = s.dataset.section ?? '';
    a.addEventListener('click', (e) => {
      e.preventDefault();
      s.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
    });
    list.append(li);
    return { li, a };
  });
  document.body.append(nav);

  // ── only where the margin has room ──────────────────────────────────────
  const fit = () => {
    const gap = innerWidth - spread.getBoundingClientRect().right;
    nav.classList.toggle('is-on', gap >= MIN_GAP && innerWidth > 760);
    nav.classList.toggle('is-bare', gap < LABEL_GAP);
    nav.style.setProperty('--gap', `${Math.round(gap)}px`);
  };

  // ── the spread in view ──────────────────────────────────────────────────
  let now = -1;
  const mark = () => {
    const mid = innerHeight / 2;
    let best = 0, dist = Infinity;
    sheets.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d < dist) { dist = d; best = i; }
    });
    if (best === now) return;
    if (now >= 0) items[now].a.removeAttribute('aria-current');
    items[best].a.setAttribute('aria-current', 'page');
    now = best;
  };

  let raf = 0;
  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(() => { raf = 0; mark(); });
  };

  // ── ticks swell toward the pointer ──────────────────────────────────────
  let centers: number[] = [];
  nav.addEventListener('pointerenter', () => {
    centers = items.map(({ li }) => { const r = li.getBoundingClientRect(); return r.top + r.height / 2; });
  });
  nav.addEventListener('pointermove', (e) => {
    let hot = -1, near = Infinity;
    items.forEach(({ li }, i) => {
      const d = Math.abs(e.clientY - centers[i]);
      li.style.setProperty('--m', Math.exp(-((d / REACH) ** 2)).toFixed(3));
      if (d < near) { near = d; hot = i; }
    });
    items.forEach(({ li }, i) => li.classList.toggle('is-hot', i === hot));
  });
  nav.addEventListener('pointerleave', () => {
    for (const { li } of items) { li.style.removeProperty('--m'); li.classList.remove('is-hot'); }
  });

  fit();
  mark();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { fit(); mark(); });
}
