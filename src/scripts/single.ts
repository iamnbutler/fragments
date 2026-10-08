/** A single page: print it in, let the pointer nudge the plates, flip proofs. */
export function pressSingle() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sheet = document.querySelector<HTMLElement>('.single-sheet');
  if (!sheet) return;

  if (!reduced) {
    document.documentElement.classList.add('js-press');
    requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add('is-printed')));
  }

  if (!reduced && matchMedia('(pointer: fine)').matches) {
    const main = document.querySelector<HTMLElement>('.single-page')!;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const tick = () => {
      x += (tx - x) * 0.1;
      y += (ty - y) * 0.1;
      main.style.setProperty('--px', x.toFixed(3));
      main.style.setProperty('--py', y.toFixed(3));
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.002 ? requestAnimationFrame(tick) : 0;
    };
    addEventListener('pointermove', (e) => {
      tx = (e.clientX / innerWidth - 0.5) * 1.4;
      ty = (e.clientY / innerHeight - 0.5) * 1.4;
      if (!raf) raf = requestAnimationFrame(tick);
    });
  }

  for (const btn of document.querySelectorAll<HTMLButtonElement>('.proof-toggle')) {
    btn.addEventListener('click', () => {
      const plate = btn.closest('.single-plate')?.querySelector('.plate');
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      btn.textContent = on ? 'Show the print' : 'Show original color';
      plate?.classList.toggle('show-proof', on);
    });
  }
}
