/**
 * Flats: the whole issue laid out on the pasteboard, the way a layout
 * program shows every spread at once. Zooming is one continuous move: the
 * pasteboard starts scaled so the spread you're reading sits exactly where
 * it is in the feed, then pulls back until every spread is in view. Zooming
 * into any spread runs the same move in reverse and lands you on it.
 *
 * Thumbnails are live clones of the spreads, laid out at a fixed design width
 * and scaled down, so they're the real pages rather than pictures of them.
 * The halftone SVG filters are swapped for cheap CSS duotones in the clones,
 * and the whole pasteboard moves as one transformed layer.
 */

import { reveal, shown } from './seen';

const DESIGN = 1280; // px width the clones are laid out at
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const narrow = () => matchMedia('(max-width: 760px)').matches;
const clamp = (x: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

interface Board {
  layer: HTMLElement;
  scroller: HTMLElement;
  board: HTMLElement;
  cells: HTMLButtonElement[];
  back: HTMLButtonElement;
}

interface Geometry {
  k: number; // pasteboard scale at p = 0
  bx: number; by: number; // pasteboard origin, untransformed
  cx: number; cy: number; // cell centre, untransformed
  rx: number; ry: number; // where that cell sits at p = 0
}

export function flats(sheets: HTMLElement[]) {
  const root = document.documentElement;
  let ui: Board | null = null;
  let geo: Geometry | null = null;
  let p = 0; // 0: reading the feed, 1: flats
  let v = 0;
  let raf = 0;
  let anim: Animation | null = null;
  let mode: 'feed' | 'flats' = 'feed';
  let target = 0; // spread index the current move is about
  let origin = 0; // spread index flats was opened from

  const build = () => (ui ??= buildBoard(sheets, (i) => zoomInto(i), () => zoomInto(origin)));

  // Build the pasteboard ahead of time so the first gesture doesn't wait.
  const idle = (window as any).requestIdleCallback ?? ((f: () => void) => setTimeout(f, 1500));
  idle(() => build(), { timeout: 5000 });

  // ── the visible control ────────────────────────────────────────────────
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'flats-toggle';
  toggle.setAttribute('aria-label', 'Flats: show every spread');
  toggle.setAttribute('aria-keyshortcuts', 'F');
  toggle.innerHTML =
    '<svg viewBox="0 0 20 14" aria-hidden="true"><rect x="0.5" y="0.5" width="8.5" height="5.5"/><rect x="11" y="0.5" width="8.5" height="5.5"/><rect x="0.5" y="8" width="8.5" height="5.5"/><rect x="11" y="8" width="8.5" height="5.5"/></svg><span>Flats</span>';
  toggle.addEventListener('click', () => zoomOut());
  document.body.append(toggle);

  /** The spread nearest the middle of the screen. */
  const current = () => {
    const mid = innerHeight / 2;
    let best = 0, bestD = Infinity;
    sheets.forEach((s, i) => {
      if (!shown(s)) return;
      const r = s.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestD) { bestD = d; best = i; }
    });
    return best;
  };

  /** Measure the move between spread `i` in the feed and its cell. */
  const measure = (i: number, centreCell: boolean): Geometry => {
    const u = build();
    u.board.style.transform = 'none';
    sizeCells(u);
    const cell = u.cells[i].querySelector<HTMLElement>('.flat-frame')!;
    if (centreCell) {
      const c = cell.getBoundingClientRect();
      u.scroller.scrollTop += c.top + c.height / 2 - innerHeight / 2;
    }
    const c = cell.getBoundingClientRect();
    const b = u.board.getBoundingClientRect();
    const live = sheets[i].querySelector<HTMLElement>('.spread')!.getBoundingClientRect();
    const k = live.width / c.width;
    // On phones a spread is a tall stack of pages: land the cell at its top.
    const ry = narrow() ? Math.max(live.top, 0) + (c.height * k) / 2 : live.top + live.height / 2;
    return {
      k,
      bx: b.left, by: b.top,
      cx: c.left + c.width / 2, cy: c.top + c.height / 2,
      rx: live.left + live.width / 2, ry,
    };
  };

  /** The pasteboard's transform at progress `at`. */
  const transformAt = (at: number) => {
    const g = geo!;
    const s = Math.pow(g.k, 1 - at);
    // Move the cell's centre in step with the scale, so the zoom feels
    // anchored on the spread rather than sliding past it.
    const w = Math.abs(g.k - 1) < 1e-3 ? at : (g.k - s) / (g.k - 1);
    const tcx = lerp(g.rx, g.cx, w);
    const tcy = lerp(g.ry, g.cy, w);
    const tx = tcx - g.bx - (g.cx - g.bx) * s;
    const ty = tcy - g.by - (g.cy - g.by) * s;
    return `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) scale(${s.toFixed(5)})`;
  };

  const fades = () => {
    ui!.layer.style.setProperty('--fade', clamp(p / 0.14).toFixed(3));
    ui!.layer.style.setProperty('--chrome', clamp((p - 0.55) / 0.45).toFixed(3));
  };

  const apply = () => {
    if (!ui || !geo) return;
    ui.board.style.transform = transformAt(p);
    fades();
  };

  /** Stop a running move where it is. */
  const halt = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    if (!anim) return;
    anim.cancel();
    anim = null;
    apply();
  };

  /** Begin a move from rest. */
  const start = (from: 'feed' | 'flats', i: number) => {
    const u = build();
    halt();
    target = i;
    if (from === 'feed') {
      origin = i;
      u.cells.forEach((c, j) => c.classList.toggle('is-origin', j === i));
      const n = sheets[i].id.replace('p-', '');
      u.back.querySelector('span')!.textContent = n === '0' ? 'Back to the cover' : `Back to page ${n}`;
      root.classList.add('flats-open', 'flats-moving');
      geo = measure(i, true);
      p = 0;
    } else {
      root.classList.add('flats-moving');
      root.classList.remove('flats-rest');
      reveal(sheets[i]);
      sheets[i].scrollIntoView({ block: narrow() ? 'start' : 'center', behavior: 'instant' as ScrollBehavior });
      geo = measure(i, false);
      p = 1;
    }
    v = 0;
    apply();
  };

  const finish = (to: 0 | 1) => {
    if (!ui) return;
    p = to;
    v = 0;
    root.classList.remove('flats-moving');
    if (to === 1) {
      mode = 'flats';
      ui.board.style.transform = 'none';
      ui.layer.style.setProperty('--fade', '1');
      ui.layer.style.setProperty('--chrome', '1');
      root.classList.add('flats-rest');
      ui.cells[target].focus({ preventScroll: true });
    } else {
      mode = 'feed';
      root.classList.remove('flats-open', 'flats-rest');
      ui.board.style.transform = 'none';
    }
  };

  /** Spring the move to rest at `to`, from wherever it is now. */
  //
  // The spring is worked out up front and handed to the compositor as a
  // transform animation. Scaling the pasteboard from script makes Chrome
  // re-raster the whole layer at every new scale, and on a large retina
  // screen that can't keep up: frames go out with the pasteboard blank.
  // A compositor animation is rastered once for its whole run. Only the
  // fades are stepped from script, and they don't touch the raster scale.
  const settle = (to: 0 | 1) => {
    halt();
    if (reduced() || !ui || !geo) { finish(to); return; }
    const K = 64, C = 2 * Math.sqrt(K) * 0.9; // a touch underdamped: it lands, then settles
    const FRAME = 1000 / 60;
    const path: { p: number; v: number }[] = [{ p, v }];
    let sp = p, sv = v;
    while (!(Math.abs(to - sp) < 0.0015 && Math.abs(sv) < 0.01) && path.length < 600) {
      for (let j = 0; j < 4; j++) { sv += (K * (to - sp) - C * sv) / 240; sp += sv / 240; }
      path.push({ p: sp, v: sv });
    }
    const duration = (path.length - 1) * FRAME;
    anim = ui.board.animate(path.map((q) => ({ transform: transformAt(q.p) })), { duration, easing: 'linear' });
    const t0 = performance.now();
    const step = (now: number) => {
      const at = Math.max(0, now - t0) / FRAME;
      const j = Math.min(path.length - 1, Math.floor(at));
      const q = path[j], r = path[Math.min(path.length - 1, j + 1)];
      p = lerp(q.p, r.p, at - j);
      v = lerp(q.v, r.v, at - j);
      fades();
      if (j >= path.length - 1) { anim?.cancel(); anim = null; raf = 0; finish(to); return; }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };

  const moving = () => root.classList.contains('flats-moving');

  function zoomOut() {
    if (mode !== 'feed' || moving()) return;
    start('feed', current());
    settle(1);
  }
  function zoomInto(i: number) {
    if (mode !== 'flats' || moving()) return;
    start('flats', i);
    settle(0);
  }

  // ── keyboard ───────────────────────────────────────────────────────────
  addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target as HTMLElement;
    if (t.closest('input, textarea, select, [contenteditable]')) return;
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      if (mode === 'feed') zoomOut();
      else {
        const focused = ui?.cells.indexOf(document.activeElement as HTMLButtonElement) ?? -1;
        zoomInto(focused >= 0 ? focused : origin);
      }
    } else if (e.key === 'Escape' && mode === 'flats') {
      e.preventDefault();
      zoomInto(origin);
    }
  });

  // ── ctrl/cmd + scroll, and trackpad pinch (which arrives as ctrl + wheel) ─
  let wheelTimer = 0;
  let dir = 0;
  addEventListener(
    'wheel',
    (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : 1;
      const d = clamp(e.deltaY * unit * 0.0045, -0.22, 0.22);
      if (!moving()) {
        if (mode === 'feed' && d > 0) start('feed', current());
        else if (mode === 'flats' && d < 0) start('flats', cellAt(e.clientX, e.clientY) ?? origin);
        else return;
      }
      if (reduced()) { settle(d > 0 ? 1 : 0); return; }
      halt();
      dir = d;
      p = clamp(p + d, -0.08, 1.08);
      apply();
      clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => settle(dir > 0 ? (p > 0.12 ? 1 : 0) : p < 0.88 ? 0 : 1), 140);
    },
    { passive: false },
  );

  // ── pinch ──────────────────────────────────────────────────────────────
  let pinch: { d0: number; p0: number } | null = null;
  const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length !== 2 || raf) return;
      const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const my = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      if (mode === 'feed') start('feed', current());
      else start('flats', cellAt(mx, my) ?? origin);
      pinch = { d0: dist(e.touches), p0: p };
    },
    { passive: true },
  );
  addEventListener(
    'touchmove',
    (e) => {
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();
      const ratio = dist(e.touches) / pinch.d0;
      const next = mode === 'feed' ? pinch.p0 + (1 - ratio) * 1.7 : pinch.p0 - (ratio - 1) * 1.1;
      dir = next - p;
      p = clamp(next, -0.08, 1.08);
      apply();
    },
    { passive: false },
  );
  const endPinch = () => {
    if (!pinch) return;
    pinch = null;
    const towardFlats = mode === 'feed';
    if (towardFlats) settle(p > 0.18 ? 1 : 0);
    else settle(p < 0.82 ? 0 : 1);
  };
  addEventListener('touchend', (e) => { if (e.touches.length < 2) endPinch(); });
  addEventListener('touchcancel', endPinch);

  function cellAt(x: number, y: number): number | null {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('.flat');
    return el ? Number(el.dataset.i) : null;
  }

  // keep the clone scale right when the window changes
  addEventListener('resize', () => ui && sizeCells(ui));
}

function buildBoard(sheets: HTMLElement[], open: (i: number) => void, back: () => void): Board {
  const layer = document.createElement('div');
  layer.className = 'flats';
  layer.setAttribute('role', 'dialog');
  layer.setAttribute('aria-label', 'Flats: every spread in this issue');

  const scroller = document.createElement('div');
  scroller.className = 'flats-scroll';
  const board = document.createElement('div');
  board.className = 'flats-board';

  const issue = document.querySelector<HTMLElement>('.cv')?.dataset.issue ?? '';
  const pages = sheets.length * 2;
  const slug = document.createElement('header');
  slug.className = 'flats-slug';
  const inks = ['yellow', 'teal', 'blue', 'black'];
  const bars = inks.flatMap((ink) => [100, 70, 40, 15].map((t) => `<span style="--c:var(--${ink});--t:${t / 100}"></span>`)).join('');
  const reg = '<svg class="reg-mark" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6"/><path d="M12 0v24M0 12h24"/></svg>';
  slug.innerHTML = `${reg}<p class="slug-text"><span>_fragments</span><span>Issue ${issue}</span><span>${sheets.length} spreads, ${pages} pages</span><span>Flats</span></p><div class="bars" aria-hidden="true">${bars}</div>${reg}`;
  board.append(slug);

  const cells: HTMLButtonElement[] = [];
  let group: HTMLElement | null = null;
  let grid: HTMLElement | null = null;
  let groupKey = '';
  let firstPage = 0;
  const closeGroup = (lastPage: number) => {
    const range = group?.querySelector('.sig-range');
    if (range) range.textContent = `Pages ${firstPage}–${lastPage + 1}`;
  };
  let sig = 0;
  sheets.forEach((sheet, i) => {
    const key = sheet.dataset.section ?? 'front';
    const page = Number(sheet.id.replace('p-', ''));
    if (key !== groupKey) {
      if (group) closeGroup(page - 2);
      groupKey = key;
      firstPage = page;
      group = document.createElement('section');
      group.className = 'flats-sig';
      group.innerHTML = `<h2 class="sig-head"><span class="sig-letter">${String.fromCharCode(65 + sig++)}</span><span class="sig-title"></span><span class="sig-range"></span></h2>`;
      group.querySelector('.sig-title')!.textContent = sheet.dataset.sectionTitle ?? '';
      grid = document.createElement('div');
      grid.className = 'flats-grid';
      group.append(grid);
      board.append(group);
    }
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'flat';
    cell.dataset.i = String(i);
    cell.setAttribute('aria-label', `Pages ${page}–${page + 1}: ${sheet.dataset.title ?? ''}`);
    const frame = document.createElement('div');
    frame.className = 'flat-frame';
    const scale = document.createElement('div');
    scale.className = 'flat-scale';
    scale.append(cloneSheet(sheet));
    const marks = document.createElement('span');
    marks.className = 'flat-marks';
    marks.setAttribute('aria-hidden', 'true');
    frame.append(scale, marks);
    const meta = document.createElement('span');
    meta.className = 'flat-meta';
    meta.setAttribute('aria-hidden', 'true');
    meta.innerHTML = `<span>${page}</span><span class="flat-title"></span><span>${page + 1}</span>`;
    meta.querySelector('.flat-title')!.textContent = sheet.dataset.title ?? '';
    cell.append(frame, meta);
    cell.addEventListener('click', () => open(i));
    grid!.append(cell);
    cells.push(cell);
  });
  closeGroup(Number(sheets[sheets.length - 1].id.replace('p-', '')));

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'flats-back';
  backBtn.innerHTML = '<span>Back</span><kbd>Esc</kbd>';
  backBtn.addEventListener('click', back);

  scroller.append(board);
  layer.append(scroller, backBtn);
  document.body.append(layer);
  const ui = { layer, scroller, board, cells, back: backBtn };
  sizeCells(ui);
  return ui;
}

function sizeCells(ui: Board) {
  const frame = ui.cells[0]?.querySelector<HTMLElement>('.flat-frame');
  if (!frame) return;
  const t = ui.board.style.transform;
  ui.board.style.transform = 'none';
  const w = frame.offsetWidth;
  ui.board.style.transform = t;
  ui.board.style.setProperty('--flat-s', (w / DESIGN).toFixed(5));
}

/** A copy of a spread for the pasteboard: inert, printed, cheap to draw. */
function cloneSheet(sheet: HTMLElement): HTMLElement {
  const c = sheet.cloneNode(true) as HTMLElement;
  c.removeAttribute('id');
  c.removeAttribute('aria-label');
  c.classList.add('is-printed');
  c.setAttribute('inert', '');
  c.setAttribute('aria-hidden', 'true');
  for (const el of c.querySelectorAll('[id]')) el.removeAttribute('id');
  for (const el of c.querySelectorAll('[data-flow]')) el.removeAttribute('data-flow');
  // the cover's live proof can't be cloned: its flat shows the render
  c.querySelector('.cv')?.classList.remove('is-live');
  for (const el of c.querySelectorAll('canvas, script, iframe')) el.remove();
  for (const el of c.querySelectorAll('video')) {
    const ph = document.createElement('div');
    ph.className = 'flat-video';
    el.replaceWith(ph);
  }
  for (const img of c.querySelectorAll('img')) {
    if (img.classList.contains('proof')) { img.remove(); continue; }
    img.loading = 'lazy';
    img.decoding = 'async';
    img.src = img.src.replace('/feed_fullsize/', '/feed_thumbnail/');
  }
  const spread = c.querySelector<HTMLElement>('.spread');
  spread?.style.removeProperty('--px');
  spread?.style.removeProperty('--py');
  return c;
}
