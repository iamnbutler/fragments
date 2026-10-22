/**
 * HTML as strings, for bongo partials and loaders. `html` escapes every
 * interpolated value unless it is already HTML (the result of `html` or
 * `raw`); arrays are joined, and null, undefined and false print nothing.
 */
export class Html {
  constructor(readonly value: string) {}
  toString() {
    return this.value;
  }
}

export const raw = (s: string) => new Html(s);

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ESC[c]);

type Value = Html | string | number | boolean | null | undefined | Value[];

function show(v: Value): string {
  if (v == null || v === false || v === true) return '';
  if (v instanceof Html) return v.value;
  if (Array.isArray(v)) return v.map(show).join('');
  return esc(String(v));
}

export function html(strings: TemplateStringsArray, ...values: Value[]): Html {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += show(values[i]) + strings[i + 1];
  return new Html(out);
}

/** An attribute, or nothing when its value is null, undefined or false. */
export function attr(name: string, value: string | number | boolean | null | undefined): Html {
  if (value == null || value === false) return raw('');
  if (value === true) return raw(` ${name}`);
  return raw(` ${name}="${esc(String(value))}"`);
}

/** A class list from the truthy values, like Astro's class:list. */
export const cls = (...xs: unknown[]) => xs.filter(Boolean).join(' ');
