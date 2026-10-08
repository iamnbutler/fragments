/**
 * The specimen book's controls: the misregistration and grain dials, the
 * print-again button, motion demos, plate proofs and the flats shortcut.
 * Everything else on the page is the zine's own press (press.ts).
 */

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const twoFrames = (f: () => void) => requestAnimationFrame(() => requestAnimationFrame(f));

export function styleguide() {
  const root = document.documentElement;

  // ── misregistration: scale every seeded --mx/--my on the page ─────────
  const shifted = [...document.querySelectorAll<HTMLElement>('.sb [style*="--mx"]')].map((el) => ({
    el,
    mx: parseFloat(el.style.getPropertyValue('--mx')) || 0,
    my: parseFloat(el.style.getPropertyValue('--my')) || 0,
  }));
  const knob = (name: string, apply: (v: number) => string) => {
    const input = document.querySelector<HTMLInputElement>(`[data-knob="${name}"]`);
    const out = input?.parentElement?.querySelector('output');
    input?.addEventListener('input', () => {
      if (out) out.textContent = apply(parseFloat(input.value));
    });
  };
  knob('mis', (k) => {
    for (const { el, mx, my } of shifted) {
      el.style.setProperty('--mx', `${(mx * k).toFixed(2)}px`);
      el.style.setProperty('--my', `${(my * k).toFixed(2)}px`);
    }
    return `${k.toFixed(1)}×`;
  });
  knob('grain', (v) => {
    root.style.setProperty('--grain', String(v));
    return v.toFixed(2);
  });

  // ── print the specimens again ─────────────────────────────────────────
  document.querySelector('[data-replay]')?.addEventListener('click', () => {
    const sheets = [...document.querySelectorAll<HTMLElement>('.sheet')];
    sheets.forEach((s) => s.classList.remove('is-printed'));
    if (!root.classList.contains('js-press')) return;
    twoFrames(() => {
      const view = innerHeight;
      for (const s of sheets) {
        const r = s.getBoundingClientRect();
        if (r.bottom > 0 && r.top < view) s.classList.add('is-printed');
        else {
          const io = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) { s.classList.add('is-printed'); io.disconnect(); }
          }, { threshold: 0.28 });
          io.observe(s);
        }
      }
    });
  });

  // ── easing demos ──────────────────────────────────────────────────────
  const eases = document.querySelector<HTMLElement>('.sb-eases');
  document.querySelector('[data-ease-run]')?.addEventListener('click', () => {
    if (!eases) return;
    if (reduced()) { eases.classList.toggle('is-run'); return; }
    eases.classList.remove('is-run');
    void eases.offsetWidth;
    eases.classList.add('is-run');
  });

  const demo = document.querySelector<HTMLElement>('[data-printdemo]');
  document.querySelector('[data-print-run]')?.addEventListener('click', () => {
    if (!demo || reduced()) return;
    demo.classList.remove('is-going');
    demo.classList.add('is-armed');
    void demo.offsetWidth;
    twoFrames(() => {
      demo.classList.add('is-going');
      demo.classList.remove('is-armed');
    });
  });

  // ── plates: show the original photo ───────────────────────────────────
  for (const btn of document.querySelectorAll<HTMLButtonElement>('.sb-proof')) {
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', String(on));
      btn.closest('.sb-plate')?.querySelector('.plate')?.classList.toggle('show-proof', on);
    });
  }

  // ── flats ─────────────────────────────────────────────────────────────
  document.querySelector('[data-flats]')?.addEventListener('click', () => {
    document.querySelector<HTMLButtonElement>('.flats-toggle')?.click();
  });
}
