/**
 * A small, hand-rolled highlighter for the code the zine prints: Rust,
 * TypeScript, shell, JSON and compiler output. It only has to be right for
 * short listings, so it's a handful of regexes per language rather than a
 * grammar, and it runs synchronously inside the spread renderers.
 */

export type TokKind = 'kw' | 'str' | 'num' | 'com' | 'ty' | 'attr' | 'fn' | 'flag' | 'cmd' | 'key' | 'err' | 'dim' | 'pun';
export interface Tok { k?: TokKind; s: string }

const KW = new Set(
  ('as async await break const continue crate dyn else enum export extends false fn for from function if impl import in interface ' +
    'let loop match mod move mut new null pub ref return self Self static struct super trait true type typeof undefined unsafe use where while yield')
    .split(' '),
);

type Rule = [RegExp, TokKind | ((m: string, src: string, at: number) => TokKind | undefined)];

const word = (m: string, src: string, at: number): TokKind | undefined =>
  /^\s*\??:(?!:)/.test(src.slice(at + m.length)) ? 'key'
  : KW.has(m) ? 'kw' : /^[A-Z]/.test(m) ? 'ty' : /^\s*[(!]/.test(src.slice(at + m.length)) ? 'fn' : undefined;

const RULES: Record<string, Rule[]> = {
  code: [
    [/\/\/[^\n]*|\/\*[\s\S]*?\*\//y, 'com'],
    [/#!?\[[^\]\n]*\]/y, 'attr'],
    [/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/y, 'str'],
    [/\b\d[\d_]*(?:\.\d+)?\b/y, 'num'],
    [/[A-Za-z_][A-Za-z0-9_]*/y, word],
    [/[{}()[\]<>|;:,.=&]/y, 'pun'],
  ],
  sh: [
    [/#[^\n]*/y, 'com'],
    [/'[^'\n]*'|"(?:\\.|[^"\\\n])*"/y, 'str'],
    [/<[a-z-]+>/y, 'dim'],
    [/(?<=^|\s)--?[A-Za-z][\w-]*/my, 'flag'],
    [/(?<=^|\n)export(?=\s)/y, 'kw'],
    [/(?<=^|\n)[A-Za-z_][\w-]*/y, 'cmd'],
    [/[A-Z_][A-Z0-9_]*(?==)/y, 'ty'],
  ],
  json: [
    [/"(?:\\.|[^"\\\n])*"(?=\s*:)/y, 'key'],
    [/"(?:\\.|[^"\\\n])*"/y, 'str'],
    [/-?\b\d+(?:\.\d+)?\b/y, 'num'],
    [/\b(?:true|false|null)\b/y, 'kw'],
    [/[{}[\]:,]/y, 'pun'],
  ],
  rustc: [
    [/^(?:error|warning)(?:\[\w+\])?(?=:)/my, 'err'],
    [/\^+[^\n]*/y, 'err'],
    [/-->|^\s*\d*\s*\||^\s*=/my, 'dim'],
    [/`[^`\n]*`/y, 'str'],
    [/#\[[^\]\n]*\]/y, 'attr'],
  ],
};

const LANGS: Record<string, string> = { rust: 'code', rs: 'code', ts: 'code', typescript: 'code', js: 'code', javascript: 'code', sh: 'sh', bash: 'sh', shell: 'sh', json: 'json' };

/** The highlighter a fence's language uses; unlabelled fences are guessed. */
export function langOf(lang: string | undefined, src: string): string {
  if (lang && LANGS[lang]) return LANGS[lang];
  return /^(?:error|warning)\b/m.test(src) ? 'rustc' : 'code';
}

/** Split source into runs, each with the kind of token it is, if any. */
export function tokenize(src: string, lang?: string): Tok[] {
  const rules = RULES[langOf(lang, src)];
  const out: Tok[] = [];
  let plain = '';
  let i = 0;
  const push = (t: Tok) => {
    if (plain) out.push({ s: plain }), (plain = '');
    out.push(t);
  };
  outer: while (i < src.length) {
    for (const [re, kind] of rules) {
      re.lastIndex = i;
      const m = re.exec(src);
      if (m && m[0]) {
        const k = typeof kind === 'function' ? kind(m[0], src, i) : kind;
        if (k) push({ k, s: m[0] });
        else plain += m[0];
        i += m[0].length;
        continue outer;
      }
    }
    plain += src[i++];
  }
  if (plain) out.push({ s: plain });
  return out;
}
