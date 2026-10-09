/**
 * The press: prints spreads as they come into view, lets the reader knock
 * plates out of register with the pointer, and turns pages from the keyboard.
 */

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => matchMedia('(pointer: fine)').matches;

import { copyfit } from './flow';

export function pressRun() {
  const root = document.documentElement;
  const sheets = [...document.querySelectorAll<HTMLElement>('.sheet')];
  if (!sheets.length) return;
  copyfit();

  // ── print-in ────────────────────────────────────────────────────────────
  if (!reduced() && 'IntersectionObserver' in window) {
    root.classList.add('js-press');
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-printed');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.28 },
    );
    // Let the first paint happen unprinted so the plates visibly land.
    requestAnimationFrame(() => requestAnimationFrame(() => sheets.forEach((s) => io.observe(s))));
  }

  // ── pointer pushes the plates out of register ──────────────────────────
  if (!reduced() && finePointer()) {
    let active: HTMLElement | null = null;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const tick = () => {
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      if (active) {
        active.style.setProperty('--px', x.toFixed(3));
        active.style.setProperty('--py', y.toFixed(3));
      }
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.002 ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    for (const spread of document.querySelectorAll<HTMLElement>('.spread')) {
      spread.addEventListener('pointermove', (e) => {
        if (active !== spread) {
          if (active) { active.style.removeProperty('--px'); active.style.removeProperty('--py'); }
          active = spread; x = 0; y = 0;
        }
        const r = spread.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
        kick();
      });
      spread.addEventListener('pointerleave', () => { tx = 0; ty = 0; kick(); });
    }
  }

  // ── keyboard page turns ─────────────────────────────────────────────────
  const current = () => {
    const mid = innerHeight / 2;
    let best = 0, dist = Infinity;
    sheets.forEach((s, i) => {
      const r = s.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  };
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || root.classList.contains('flats-open')) return;
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, select, [contenteditable], video')) return;
    const next = e.key === 'j' || e.key === 'ArrowRight';
    const prev = e.key === 'k' || e.key === 'ArrowLeft';
    if (!next && !prev) return;
    const i = Math.max(0, Math.min(sheets.length - 1, current() + (next ? 1 : -1)));
    e.preventDefault();
    sheets[i].scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
  });

  // Flats and the cover press wait until the page has loaded and gone idle:
  // the cover's still is the largest paint, and the press only reprints it.
  afterLoad(() => {
    // ── flats: every spread at once ─────────────────────────────────────
    import('./flats').then((m) => m.flats(sheets));

    // ── cover: a proof of one of Nate's renders ─────────────────────────
    const cover = document.querySelector<HTMLElement>('.sheet[data-kind="cover"]');
    if (cover) import('./cover-press').then((m) => m.coverPress(cover)).catch(() => {});
  });
}

function afterLoad(f: () => void) {
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(f, { timeout: 1500 }) : setTimeout(f, 200));
  if (document.readyState === 'complete') idle();
  else addEventListener('load', idle, { once: true });
}
