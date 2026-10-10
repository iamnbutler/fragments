/**
 * Folding what you've read. With the reader's say-so, a cookie keeps a note
 * of which spreads they've looked at; on their next visit, every piece
 * they've seen all of is folded shut, the way a layout program collapses a
 * spread, so the new pages come up first. A folded piece is a strip with its
 * title on it, and opens when you click it or land in it some other way.
 *
 * Nothing is moved: page numbers and "continued on page N" stay true.
 */

/** Until this ships, it only runs in dev or with ?fold, and asks on every load. */
const SHIP = false;

const CHOICE = 'fr_fold'; // 'yes' | 'no'
const SEEN = 'fr_seen'; // piece:mask|piece:mask, a bit per spread, base 36
const YEAR = 60 * 60 * 24 * 365;
/** How long a spread has to be mostly on screen to count as seen, in ms. */
const DWELL = 1000;

const enabled = () => SHIP || import.meta.env.DEV || new URLSearchParams(location.search).has('fold');

// ── cookies ────────────────────────────────────────────────────────────────
const getCookie = (name: string) => {
  const hit = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`));
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : null;
};
const setCookie = (name: string, value: string) => {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${YEAR}; Path=/; SameSite=Lax${secure}`;
};
const dropCookie = (name: string) => { document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`; };

const readSeen = () => {
  const out = new Map<string, number>();
  for (const part of (getCookie(SEEN) ?? '').split('|')) {
    const i = part.lastIndexOf(':');
    if (i > 0) out.set(part.slice(0, i), parseInt(part.slice(i + 1), 36) || 0);
  }
  return out;
};
const writeSeen = (m: Map<string, number>) =>
  setCookie(SEEN, [...m].map(([k, v]) => `${k}:${v.toString(36)}`).join('|'));

// ── pieces ─────────────────────────────────────────────────────────────────
interface Piece { key: string; title: string; sheets: HTMLElement[] }

const piecesOf = (sheets: HTMLElement[]) => {
  const out = new Map<string, Piece>();
  for (const s of sheets) {
    const key = s.dataset.section ?? 'front';
    if (!out.has(key)) out.set(key, { key, title: s.dataset.sectionTitle ?? '', sheets: [] });
    out.get(key)!.sheets.push(s);
  }
  return out;
};

const page = (s: HTMLElement) => Number(s.id.replace('p-', ''));

/** Whether a sheet is on the page, rather than folded away. */
export const shown = (s: HTMLElement) => !s.classList.contains('is-folded');

/** Open the piece a sheet belongs to, if it's folded. */
export function reveal(sheet: HTMLElement) {
  if (shown(sheet)) return false;
  const key = sheet.dataset.section;
  for (const s of document.querySelectorAll<HTMLElement>('.zine > .sheet.is-folded')) {
    if (s.dataset.section === key) { s.classList.remove('is-folded'); s.removeAttribute('inert'); }
  }
  document.querySelector(`.fold[data-section="${CSS.escape(key ?? '')}"]`)?.remove();
  return true;
}

function fold(p: Piece) {
  const first = p.sheets[0], last = p.sheets[p.sheets.length - 1];
  const strip = document.createElement('div');
  strip.className = 'fold';
  strip.dataset.section = p.key;
  strip.style.setProperty('--n', String(p.sheets.length));
  const from = page(first), to = page(last) + 1;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'fold-tab';
  btn.setAttribute('aria-label', `${p.title}, pages ${from} to ${to}. Read; unfold it.`);
  btn.innerHTML =
    '<span class="fold-leaves" aria-hidden="true"></span>' +
    '<span class="fold-kicker" aria-hidden="true">Read</span>' +
    '<b class="fold-title" aria-hidden="true"></b>' +
    `<span class="fold-pages" aria-hidden="true">pp. ${from}–${to}</span>` +
    '<span class="fold-open" aria-hidden="true">Unfold</span>';
  btn.querySelector('.fold-title')!.textContent = p.title;
  btn.addEventListener('click', () => {
    reveal(first);
    first.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
  });
  strip.append(btn);
  first.before(strip);
  for (const s of p.sheets) { s.classList.add('is-folded'); s.setAttribute('inert', ''); }
}

// ── keeping track ──────────────────────────────────────────────────────────
function track(pieces: Map<string, Piece>) {
  const part = new Map<HTMLElement, [string, number]>();
  for (const p of pieces.values()) p.sheets.forEach((s, i) => part.set(s, [p.key, i]));
  const timers = new Map<Element, number>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const s = e.target as HTMLElement;
        if (e.intersectionRatio >= 0.5 && shown(s)) {
          if (timers.has(s)) continue;
          timers.set(s, window.setTimeout(() => {
            const [key, i] = part.get(s)!;
            // read it fresh: folding by hand writes marks too
            const marks = readSeen();
            marks.set(key, (marks.get(key) ?? 0) | (1 << i));
            if (getCookie(CHOICE) === 'yes') writeSeen(marks);
            io.unobserve(s);
          }, DWELL));
        } else {
          clearTimeout(timers.get(s));
          timers.delete(s);
        }
      }
    },
    { threshold: [0, 0.5] },
  );
  for (const s of part.keys()) io.observe(s);
  return () => io.disconnect();
}

// ── asking ─────────────────────────────────────────────────────────────────
function ask(onChoice: (yes: boolean) => void) {
  document.querySelector('dialog.fold-ask')?.remove();
  const d = document.createElement('dialog');
  d.className = 'fold-ask';
  d.setAttribute('aria-labelledby', 'fold-ask-title');
  d.innerHTML = `
    <form method="dialog" class="fa-card">
      <p class="fa-kicker">_fragments <span aria-hidden="true">·</span> before you start</p>
      <h2 class="fa-title" id="fold-ask-title">Fold what you’ve read?</h2>
      <p class="fa-lede">This issue keeps growing. With a cookie, the pieces you’ve read fold shut on your next visit, so the new pages come first.</p>
      <div class="fa-paths">
        <button class="fa-path fa-yes" value="yes">
          <span class="fa-arrow" aria-hidden="true">←</span>
          <b>Use a cookie</b>
          <span>Fold what I’ve read next time</span>
        </button>
        <span class="fa-fold" aria-hidden="true"><span>fold here</span></span>
        <button class="fa-path fa-no" value="no">
          <span class="fa-arrow" aria-hidden="true">→</span>
          <b>No thanks</b>
          <span>Just take me to the issue</span>
        </button>
      </div>
      <p class="fa-small">The cookie lists the spreads you’ve looked at and nothing else, and only this site reads it. Saying no keeps just that answer. You can change your mind at the end of the issue.</p>
    </form>`;
  d.addEventListener('close', () => {
    if (d.returnValue === 'yes' || d.returnValue === 'no') onChoice(d.returnValue === 'yes');
    d.remove();
  });
  document.body.append(d);
  d.showModal();
  // land on the paths, not the first link in the page
  d.querySelector<HTMLButtonElement>('.fa-yes')!.focus();
}

// ── the control at the end of the issue ────────────────────────────────────
function control(state: () => 'yes' | 'no' | null, reopen: () => void, forget: () => void) {
  const end = document.querySelector('.colophon-end');
  if (!end) return () => {};
  const p = document.createElement('p');
  p.className = 'fold-ctl';
  end.append(p);
  const draw = () => {
    const on = state() === 'yes';
    p.innerHTML = `<span>Folding what you’ve read: <b>${on ? 'on' : 'off'}</b></span>`;
    if (on) {
      const f = document.createElement('button');
      f.type = 'button'; f.textContent = 'Forget what I’ve read';
      f.addEventListener('click', forget);
      p.append(f);
    }
    const c = document.createElement('button');
    c.type = 'button'; c.textContent = on ? 'Turn it off' : 'Turn it on';
    c.addEventListener('click', reopen);
    p.append(c);
  };
  draw();
  return draw;
}

export function seen(sheets: HTMLElement[]) {
  if (!enabled() || !('IntersectionObserver' in window)) return;
  const pieces = piecesOf(sheets);
  pieces.delete('front'); // the cover and the welcome always open the issue
  let stop: (() => void) | null = null;

  const foldSeen = () => {
    const marks = readSeen();
    for (const p of pieces.values()) {
      const all = (1 << p.sheets.length) - 1;
      if (((marks.get(p.key) ?? 0) & all) === all) fold(p);
    }
  };
  const unfoldAll = () => { for (const p of pieces.values()) reveal(p.sheets[0]); };

  const choose = (yes: boolean) => {
    setCookie(CHOICE, yes ? 'yes' : 'no');
    if (yes) stop ??= track(pieces);
    else { stop?.(); stop = null; dropCookie(SEEN); unfoldAll(); }
    redraw();
  };
  const redraw = control(
    () => getCookie(CHOICE) as 'yes' | 'no' | null,
    () => ask(choose),
    () => { dropCookie(SEEN); unfoldAll(); stop?.(); stop = track(pieces); },
  );

  if (getCookie(CHOICE) === 'yes') {
    foldSeen();
    stop = track(pieces);
  }

  // a link straight into a folded piece opens it: the rail, jump lines, #p-N
  document.addEventListener('click', (e) => {
    const a = (e.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#p-"]');
    const s = a && document.getElementById(a.hash.slice(1));
    if (s) reveal(s);
  }, true);
  const fromHash = () => {
    const s = location.hash.startsWith('#p-') ? document.getElementById(location.hash.slice(1)) : null;
    if (s && reveal(s)) s.scrollIntoView({ block: 'center' });
  };
  fromHash();
  addEventListener('hashchange', fromHash);

  // c folds the piece in view, and with cookies on, keeps it folded
  addEventListener('keydown', (e) => {
    if (e.key !== 'c' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (document.documentElement.classList.contains('flats-open') || document.querySelector('dialog[open]')) return;
    const t = (e.composedPath()[0] ?? e.target) as HTMLElement;
    if (t.closest?.('input, textarea, select, [contenteditable], video')) return;
    const mid = innerHeight / 2;
    let at: HTMLElement | null = null, dist = Infinity;
    for (const s of sheets.filter(shown)) {
      const r = s.getBoundingClientRect();
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d < dist) { dist = d; at = s; }
    }
    const p = at && pieces.get(at.dataset.section ?? 'front');
    if (!p) return;
    e.preventDefault();
    if (getCookie(CHOICE) === 'yes') {
      const marks = readSeen();
      marks.set(p.key, (1 << p.sheets.length) - 1);
      writeSeen(marks);
    }
    fold(p);
    document.querySelector<HTMLElement>(`.fold[data-section="${CSS.escape(p.key)}"] .fold-tab`)?.focus({ preventScroll: true });
    document.querySelector(`.fold[data-section="${CSS.escape(p.key)}"]`)?.scrollIntoView({ block: 'center' });
  });

  if (!SHIP || getCookie(CHOICE) === null) ask(choose);
}
