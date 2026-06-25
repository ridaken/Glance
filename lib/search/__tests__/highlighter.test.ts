import { beforeEach, describe, expect, it } from 'vitest';
import { Highlighter } from '../highlighter';
import { findMatches, isMatchError } from '../matcher';
import { defaultSearchOptions } from '../types';
import { rangeFromOffsets, walk } from '../walker';

// jsdom has no CSS Custom Highlight API, so the Highlighter naturally exercises
// the <mark> fallback path here.

function rangesFor(query: string): Range[] {
  const { text, segments } = walk(document);
  const ms = findMatches(text, query, defaultSearchOptions);
  if (isMatchError(ms)) throw new Error(ms.error);
  return ms.map((m) => {
    const r = rangeFromOffsets(segments, m.start, m.end);
    if (!r) throw new Error('no range');
    return r;
  });
}

const marks = () => [...document.querySelectorAll('mark[data-glance-mark]')];

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('Highlighter <mark> fallback', () => {
  it('wraps a single-node match and unwraps cleanly on clear', () => {
    document.body.innerHTML = '<p>find the cat here</p>';
    const h = new Highlighter();
    h.setRanges(rangesFor('cat'), 0);

    expect(marks()).toHaveLength(1);
    expect(marks()[0].textContent).toBe('cat');
    expect(marks()[0].getAttribute('data-glance-mark')).toBe('current');
    // Highlighting must not alter the underlying text.
    expect(document.querySelector('p')!.textContent).toBe('find the cat here');

    h.clear();
    expect(marks()).toHaveLength(0);
    expect(document.querySelector('p')!.textContent).toBe('find the cat here');
  });

  it('wraps a match spanning multiple inline nodes', () => {
    document.body.innerHTML = '<p>find <b>the c</b>at here</p>';
    const h = new Highlighter();
    h.setRanges(rangesFor('cat'), 0);

    const ms = marks();
    expect(ms.length).toBeGreaterThanOrEqual(1);
    expect(ms.map((m) => m.textContent).join('')).toBe('cat');

    h.clear();
    expect(marks()).toHaveLength(0);
  });

  it('distinguishes the current match from the others', () => {
    document.body.innerHTML = '<p>cat cat</p>';
    const h = new Highlighter();
    h.setRanges(rangesFor('cat'), 1);

    const kinds = marks().map((m) => m.getAttribute('data-glance-mark'));
    expect(kinds).toContain('current');
    expect(kinds).toContain('match');
  });
});
