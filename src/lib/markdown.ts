import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeShiki from '@shikijs/rehype';
import rehypeSlug from 'rehype-slug';
import type { Root, RootContent } from 'hast';

// Code on a piece's own page prints like a listing in the zine (render/riso.ts
// listing, lib/code.ts): key-plate text, keywords and names in blue, strings
// and numbers in red, comments and punctuation screened back.
const RISO_THEME = {
  name: 'riso',
  type: 'light' as const,
  colors: { 'editor.background': '#00000000', 'editor.foreground': '#242627' },
  tokenColors: [
    { scope: ['keyword', 'storage', 'constant.language', 'variable.language'], settings: { foreground: '#1F6AB8', fontStyle: 'bold' } },
    { scope: ['string', 'constant.numeric', 'constant.character', 'invalid'], settings: { foreground: '#FF2925' } },
    { scope: ['comment'], settings: { foreground: '#24262794', fontStyle: 'italic' } },
    { scope: ['entity.name.type', 'support.type', 'entity.name.class', 'entity.other.inherited-class', 'entity.name.function.shell'], settings: { fontStyle: 'bold' } },
    { scope: ['meta.object-literal.key', 'variable.other.property', 'support.type.property-name', 'variable.other.member', 'constant.other.option'], settings: { foreground: '#1F6AB8' } },
    { scope: ['meta.attribute', 'entity.name.function.macro', 'meta.annotation'], settings: { foreground: '#1F6AB8', fontStyle: 'italic' } },
    { scope: ['punctuation', 'keyword.operator', 'meta.brace'], settings: { foreground: '#24262794' } },
  ],
};

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeSlug)
  .use(rehypeShiki, {
    theme: RISO_THEME,
    // the language tabs the listing, as in the zine
    transformers: [{ pre(node) { if (this.options.lang && this.options.lang !== 'text') node.properties['data-lang'] = this.options.lang; } }],
  })
  .use(rehypeStringify, { allowDangerousHtml: true });

export interface MarkdownHeading {
  text: string;
  slug: string;
  level: 2 | 3;
}

function headingText(node: RootContent): string {
  if (node.type === 'text') return node.value;
  return 'children' in node ? node.children.map(headingText).join('') : '';
}

/** Render once, collecting TOC entries from the same AST and IDs as the HTML. */
export async function renderMarkdownWithHeadings(md: string): Promise<{
  html: string;
  headings: MarkdownHeading[];
}> {
  const tree = await processor.run(processor.parse(md));
  const headings: MarkdownHeading[] = [];

  function collect(node: Root | RootContent): void {
    if (node.type === 'element' && (node.tagName === 'h2' || node.tagName === 'h3')) {
      const id = node.properties.id;
      // Even an empty ID (e.g. a punctuation-only heading) is rehype-slug's ID.
      if (typeof id === 'string') {
        headings.push({
          text: headingText(node),
          slug: id,
          level: node.tagName === 'h2' ? 2 : 3,
        });
      }
    }
    if ('children' in node) node.children.forEach(collect);
  }

  collect(tree);
  return { html: processor.stringify(tree), headings };
}

export async function renderMarkdown(md: string): Promise<string> {
  return (await renderMarkdownWithHeadings(md)).html;
}
