import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Agentation } from 'agentation';

/** Mounts the toolbar; call the result with a modal dialog to raise the toolbar above it. */
export function mount() {
  const host = document.createElement('div');
  host.id = 'agentation';
  document.body.append(host);
  const root = createRoot(host);
  const render = (portalContainer: HTMLElement | null) =>
    root.render(createElement(Agentation, { portalContainer }));
  render(null);
  return render;
}
