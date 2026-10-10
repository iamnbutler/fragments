/**
 * Agentation, for leaving notes on spreads during development: click an
 * element, write a note, copy it as markdown for an agent. Dev only; the
 * production build drops this branch and never bundles React.
 *
 * Ctrl+Shift+A turns annotating on and off; Cmd+Shift+A is Chrome's tab
 * search, so it's Control on a Mac too (Agentation's own key, Cmd/Ctrl+Shift+F,
 * also works). A modal dialog makes the rest of the page inert, so
 * while one is open the toolbar is portalled into it, as a popover in the
 * top layer, and notes can go on the modal.
 */
if (import.meta.env.DEV) {
  import('./annotate-mount').then((m) => {
    const render = m.mount();
    let over: Element | null = null;
    const place = () => {
      const modal = document.querySelector<HTMLElement>('dialog:modal');
      if (modal !== over) { over = modal; render(modal); }
    };
    new MutationObserver(place).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] });
    place();

    addEventListener('keydown', (e) => {
      if (!e.ctrlKey || e.metaKey || !e.shiftKey || e.code !== 'KeyA') return;
      e.preventDefault();
      e.stopPropagation();
      place();
      document.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'F', code: 'KeyF', shiftKey: true, ctrlKey: true, bubbles: true,
      }));
    }, true);
  });
}
