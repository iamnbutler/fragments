/**
 * The press: prints spreads as they come into view, lets the reader knock
 * plates out of register with the pointer, turns pages from the keyboard,
 * and lets clippings be picked up and moved.
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

  // ── clippings can be picked up ──────────────────────────────────────────
  if (finePointer()) {
    for (const clip of document.querySelectorAll<HTMLElement>('[data-drag]')) dragClip(clip);
  }

  // ── flats: every spread at once ───────────────────────────────────────
  import('./flats').then((m) => m.flats(sheets));

  // ── cover ──────────────────────────────────────────────────────────────
  const cover = document.querySelector<HTMLElement>('.sheet[data-kind="cover"]');
  if (cover) {
    import('./solid').then((m) => m.spinSolid(cover));
    import('./cover-gl').then((m) => m.printCover(cover)).catch(() => {});
  }
}

function dragClip(clip: HTMLElement) {
  let sx = 0, sy = 0, ox = 0, oy = 0, dx = 0, dy = 0;
  let swing = 0, vx = 0, lastX = 0, dragging = false, raf = 0, id = -1;

  const settle = () => {
    // a released clipping swings back to rest like paper on a pin
    vx *= 0.82;
    swing += (-swing) * 0.14 + vx * 0.02;
    clip.style.setProperty('--swing', `${swing.toFixed(2)}deg`);
    raf = dragging || Math.abs(swing) > 0.02 || Math.abs(vx) > 0.02 ? requestAnimationFrame(settle) : 0;
  };

  clip.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('a, button, video, .clip-text')) return;
    id = e.pointerId;
    sx = e.clientX; sy = e.clientY; ox = dx; oy = dy; lastX = e.clientX;
    dragging = true;
    clip.setPointerCapture(id);
    clip.classList.add('is-lifted');
    if (!reduced() && !raf) raf = requestAnimationFrame(settle);
  });
  clip.addEventListener('pointermove', (e) => {
    if (!dragging || e.pointerId !== id) return;
    dx = ox + e.clientX - sx;
    dy = oy + e.clientY - sy;
    vx = e.clientX - lastX;
    lastX = e.clientX;
    clip.style.setProperty('--dx', `${dx}px`);
    clip.style.setProperty('--dy', `${dy}px`);
    if (!reduced()) swing = Math.max(-14, Math.min(14, swing + vx * 0.25));
  });
  const drop = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    dragging = false;
    clip.classList.remove('is-lifted');
    if (clip.hasPointerCapture(id)) clip.releasePointerCapture(id);
  };
  clip.addEventListener('pointerup', drop);
  clip.addEventListener('pointercancel', drop);
}
