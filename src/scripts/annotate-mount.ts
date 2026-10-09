import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Agentation } from 'agentation';

export function mount() {
  const host = document.createElement('div');
  host.id = 'agentation';
  document.body.append(host);
  createRoot(host).render(createElement(Agentation));
}
