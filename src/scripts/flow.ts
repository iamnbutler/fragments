/**
 * Copyfitting. An essay is set across a chain of frames (its opener, then
 * its jump spreads). The build guesses where each frame breaks; this pours
 * the text through the frames at the real size, splitting the paragraph that
 * straddles a break, so nothing is hidden behind a frame edge.
 */

const overflows = (el: HTMLElement) =>
  el.scrollWidth - el.clientWidth > 1 || el.scrollHeight - el.clientHeight > 1;

type Token = Node;

/** Words and inline elements of a block, as separate nodes. */
function tokens(block: HTMLElement): Token[] {
  const out: Token[] = [];
  for (const n of [...block.childNodes]) {
    if (n.nodeType === Node.TEXT_NODE) {
      for (const w of (n.textContent ?? '').split(/(?<=\s)/)) if (w) out.push(document.createTextNode(w));
    } else out.push(n);
  }
  return out;
}

/** Fill `frame` with as much of `block` as fits; return the remainder, if any. */
function splitInto(frame: HTMLElement, block: HTMLElement): HTMLElement | null {
  if (block.tagName === 'PRE' || block.classList.contains('b-h')) return block;
  const toks = tokens(block);
  if (toks.length < 6) return block;
  const head = block.cloneNode(false) as HTMLElement;
  frame.appendChild(head);
  const fill = (n: number) => {
    head.replaceChildren(...toks.slice(0, n).map((t) => t.cloneNode(true)));
  };
  let lo = 0, hi = toks.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    fill(mid);
    if (overflows(frame)) hi = mid - 1;
    else lo = mid;
  }
  // keep at least two lines' worth on each side of a break
  if (lo < 4) { head.remove(); return block; }
  fill(lo);
  if (lo >= toks.length) return null;
  head.classList.add('split-head');
  const tail = block.cloneNode(false) as HTMLElement;
  tail.classList.add('split-tail');
  tail.replaceChildren(...toks.slice(lo).map((t) => t.cloneNode(true)));
  return tail;
}

function pour(frames: HTMLElement[]) {
  for (const f of frames) f.style.maxHeight = '';
  fill(frames);
  balance(frames);
}

/**
 * The final spread of a chain is usually part-full. Shorten its frames
 * together until the text only just fits, so the columns end level instead
 * of leaving one page blank.
 */
function balance(frames: HTMLElement[]) {
  const sheet = frames[frames.length - 1].closest('.sheet');
  const tail = frames.filter((f) => f.closest('.sheet') === sheet);
  if (tail.length < 2 || !sheet?.matches('[data-kind="jump"]')) return;
  const full = tail.map((f) => f.clientHeight);
  const fits = (k: number) => {
    tail.forEach((f, i) => (f.style.maxHeight = `${Math.ceil(full[i] * k)}px`));
    fill(tail);
    return !tail.some((f) => overflows(f));
  };
  let lo = 0.2, hi = 1;
  if (!fits(hi)) return;
  for (let i = 0; i < 7; i++) {
    const mid = (lo + hi) / 2;
    if (fits(mid)) hi = mid;
    else lo = mid;
  }
  fits(hi);
}

function fill(frames: HTMLElement[]) {
  const blocks = frames.flatMap((f) => [...f.children] as HTMLElement[]);
  // stitch back any paragraphs a previous pass split
  const whole: HTMLElement[] = [];
  for (const b of blocks) {
    const prev = whole[whole.length - 1];
    if (b.classList.contains('split-tail') && prev?.classList.contains('split-head')) {
      prev.append(...b.childNodes);
      prev.classList.remove('split-head');
      continue;
    }
    whole.push(b);
  }
  for (const f of frames) f.replaceChildren();
  let fi = 0;
  let queue = whole;
  while (queue.length && fi < frames.length) {
    const frame = frames[fi];
    let b = queue.shift()!;
    frame.appendChild(b);
    if (!overflows(frame)) continue;
    b.remove();
    const rest = fi === frames.length - 1 ? b : splitInto(frame, b);
    if (rest) queue.unshift(rest);
    fi++;
  }
  // whatever doesn't fit stays in the last frame, hidden; say where it went
  const last = frames[frames.length - 1];
  for (const b of queue) last.appendChild(b);
  const cont = last.closest('.pg')?.querySelector<HTMLAnchorElement>('.cont-single');
  if (cont) cont.textContent = queue.length ? 'The rest is on its own page' : 'Read on its own page';
}

export function copyfit() {
  const chains = new Map<string, HTMLElement[]>();
  for (const el of document.querySelectorAll<HTMLElement>('[data-flow]')) {
    const k = el.dataset.flow!;
    if (!chains.has(k)) chains.set(k, []);
    chains.get(k)!.push(el);
  }
  const run = () => {
    // stacked pages on phones have no frame edges to fit to
    if (matchMedia('(max-width: 760px)').matches) return;
    for (const frames of chains.values()) pour(frames);
  };
  const go = () => (document.fonts?.ready ?? Promise.resolve()).then(run);
  go();
  let t = 0;
  let w = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth === w) return;
    w = innerWidth;
    clearTimeout(t);
    t = window.setTimeout(run, 200);
  });
}
