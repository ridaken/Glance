import { describe, expect, it } from 'vitest';
import { findMatches, isMatchError } from '../matcher';
import { defaultSearchOptions, type SearchOptions } from '../types';

const opts = (o: Partial<SearchOptions> = {}): SearchOptions => ({
  ...defaultSearchOptions,
  ...o,
});

function matches(text: string, q: string, o?: Partial<SearchOptions>) {
  const r = findMatches(text, q, opts(o));
  if (isMatchError(r)) throw new Error(r.error);
  return r;
}

describe('findMatches — plain', () => {
  it('finds all case-insensitive occurrences by default', () => {
    const r = matches('The Cat sat on the cat', 'cat');
    expect(r).toEqual([
      { start: 4, end: 7 },
      { start: 19, end: 22 },
    ]);
  });

  it('respects match case', () => {
    const r = matches('Cat cat', 'cat', { caseSensitive: true });
    expect(r).toEqual([{ start: 4, end: 7 }]);
  });

  it('respects whole word', () => {
    const r = matches('cat category scatter', 'cat', { wholeWord: true });
    expect(r).toEqual([{ start: 0, end: 3 }]);
  });

  it('returns empty for empty query', () => {
    expect(matches('hello', '')).toEqual([]);
  });
});

describe('findMatches — accents', () => {
  it('ignores accents when enabled (precomposed)', () => {
    const r = matches('café cafe', 'cafe', { ignoreAccents: true });
    expect(r).toEqual([
      { start: 0, end: 4 },
      { start: 5, end: 9 },
    ]);
  });

  it('does not match accents when disabled', () => {
    const r = matches('café', 'cafe', { ignoreAccents: false });
    expect(r).toEqual([]);
  });

  it('maps offsets through decomposed source text', () => {
    // "cafe" + combining acute => 5 source chars; folded "cafe" matches 0..4.
    const r = matches('café', 'cafe', { ignoreAccents: true });
    expect(r).toEqual([{ start: 0, end: 4 }]);
  });
});

describe('findMatches — regex', () => {
  it('matches a pattern globally', () => {
    const r = matches('a1 b2 c3', '\\w\\d', { regex: true });
    expect(r).toHaveLength(3);
    expect(r[0]).toEqual({ start: 0, end: 2 });
  });

  it('honors case sensitivity in regex', () => {
    const r = matches('Foo foo', 'foo', { regex: true, caseSensitive: true });
    expect(r).toEqual([{ start: 4, end: 7 }]);
  });

  it('returns a MatchError for an invalid pattern', () => {
    const r = findMatches('abc', '(', opts({ regex: true }));
    expect(isMatchError(r)).toBe(true);
  });

  it('does not hang on zero-width matches', () => {
    const r = matches('abc', 'x*', { regex: true });
    expect(Array.isArray(r)).toBe(true);
  });
});
