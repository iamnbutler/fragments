/**
 * Figures with a looping version play it while they're in view. The loop is
 * loaded before it's swapped in, so the plate never goes blank while it
 * arrives; leaving the view puts the still figure back.
 */

const loaded = new Map<string, Promise<unknown>>();
const load = (src: string) => {
  if (!loaded.has(src)) {
    const im = new Image();
    im.src = src;
    loaded.set(src, im.decode().catch(() => {}));
  }
  return loaded.get(src)!;
};

let started = false;

export function figMotion() {
  if (started) return;
  started = true;
  const figs = document.querySelectorAll<HTMLElement>('.inkfig.has-motion');
  if (!figs.length || !('IntersectionObserver' in window)) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const fig = e.target as HTMLElement;
        if (e.intersectionRatio >= 0.35) load(fig.dataset.motion!).then(() => fig.classList.add('is-playing'));
        else fig.classList.remove('is-playing');
        // fetch ahead as it approaches
        if (e.isIntersecting) load(fig.dataset.motion!);
      }
    },
    { rootMargin: '200px 0px', threshold: [0, 0.35] },
  );
  figs.forEach((f) => io.observe(f));
}
