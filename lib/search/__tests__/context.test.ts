import { describe, expect, it } from 'vitest';
import { getContext } from '../context';

describe('getContext', () => {
  it('extracts the surrounding sentence', () => {
    const text = 'Hello world. The cat sat here. Goodbye.';
    const start = text.indexOf('cat');
    const ctx = getContext(text, { start, end: start + 3 });
    expect(ctx.before).toBe('The ');
    expect(ctx.match).toBe('cat');
    expect(ctx.after).toBe(' sat here.');
  });

  it('keeps the space between the match and the following word', () => {
    const text = 'The cat sat here. Done.';
    const start = text.indexOf('cat');
    const ctx = getContext(text, { start, end: start + 3 });
    // Regression: `after` must not swallow the leading space.
    expect(ctx.after.startsWith(' ')).toBe(true);
    expect(`${ctx.before}${ctx.match}${ctx.after}`).toBe('The cat sat here.');
  });

  it('falls back to a fixed radius when there is no nearby punctuation', () => {
    const text = 'x'.repeat(200) + 'TARGET' + 'y'.repeat(200);
    const ctx = getContext(text, { start: 200, end: 206 });
    expect(ctx.match).toBe('TARGET');
    expect(ctx.before).toBe('x'.repeat(60));
    expect(ctx.after).toBe('y'.repeat(60));
  });

  it('collapses runs of whitespace and newlines', () => {
    const text = 'alpha.  The   quick\n\nbrown cat\tjumps now. End.';
    const start = text.indexOf('cat');
    const ctx = getContext(text, { start, end: start + 3 });
    expect(ctx.match).toBe('cat');
    expect(ctx.before).not.toMatch(/\s\s|[\n\t]/);
    expect(ctx.after).not.toMatch(/\s\s|[\n\t]/);
  });
});
