import assert from 'node:assert/strict';
import test from 'node:test';
import { inline, takeBlocks, type Block } from '../src/lib/zine';
import { split } from '../src/components/riso/drafts/util';

const p = (n: number): Block => ({ t: 'p', text: 'x'.repeat(n) }) as Block;
const h = (text: string): Block => ({ t: 'h', text }) as Block;

test('a frame never ends on a heading', () => {
  const bs = [p(100), p(100), h('Next'), p(100)];
  const cut = takeBlocks(bs, 201);
  assert.equal(cut.blocks.length, 2);
  assert.equal(bs[cut.next].t, 'h');
});

test('a split never leaves a heading at the foot of the first part', () => {
  const [a, b] = split([p(100), h('Next'), p(100)], 0.6);
  assert.deepEqual(a.map((x) => x.t), ['p']);
  assert.equal(b[0].t, 'h');
});

test('inline text keeps snake_case and code, and drops emphasis', () => {
  assert.equal(inline('from `queue_tasks` to land_builds'), 'from queue_tasks to land_builds');
  assert.equal(inline('a `*ptr` and *this* and _that_ and **bold**'), 'a *ptr and this and that and bold');
  assert.equal(inline('see [the plan](https://example.com) for __more__'), 'see the plan for more');
});
