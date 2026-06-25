import { beforeEach, describe, expect, it } from 'vitest';
import { findMatches, isMatchError } from '../matcher';
import { defaultSearchOptions } from '../types';
import { rangeFromOffsets, walk } from '../walker';

function setBody(html: string) {
  document.body.innerHTML = html;
}

beforeEach(() => setBody(''));

describe('walk', () => {
  it('concatenates text across inline elements without separators', () => {
    setBody('<p>Hello <b>wor</b>ld</p>');
    expect(walk(document).text).toBe('Hello world');
  });

  it('inserts a boundary between block elements', () => {
    setBody('<p>foo</p><p>bar</p>');
    expect(walk(document).text).toBe('foo\nbar');
  });

  it('skips script and style content', () => {
    setBody('<p>hi</p><script>var x=1</script><style>p{}</style>');
    expect(walk(document).text).toBe('hi');
  });
});

describe('rangeFromOffsets', () => {
  it('builds a range spanning multiple inline nodes', () => {
    setBody('<p>Hello <b>wor</b>ld</p>');
    const { text, segments } = walk(document);
    const r = findMatches(text, 'world', defaultSearchOptions);
    if (isMatchError(r)) throw new Error(r.error);
    const range = rangeFromOffsets(segments, r[0].start, r[0].end);
    expect(range?.toString()).toBe('world');
  });

  it('does not match across a block boundary', () => {
    setBody('<p>foo</p><p>bar</p>');
    const { text } = walk(document);
    const r = findMatches(text, 'foobar', defaultSearchOptions);
    expect(isMatchError(r) ? [] : r).toEqual([]);
  });
});
