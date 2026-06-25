import type { MatchContext, RawMatch } from './types';

const FALLBACK_RADIUS = 60;
const MAX_SNIPPET = 240;
const SENTENCE_END = /[.!?\n]/;

/**
 * Build a context snippet around a match. Prefers sentence boundaries; falls
 * back to ±FALLBACK_RADIUS characters when no nearby boundary is found.
 * Whitespace (including the block-separator newlines from the walker) is
 * collapsed for display.
 */
export function getContext(text: string, match: RawMatch): MatchContext {
  const { start, end } = match;

  let from = start;
  const lowBound = Math.max(0, start - MAX_SNIPPET);
  while (from > lowBound && !SENTENCE_END.test(text[from - 1])) from--;
  if (start - from > FALLBACK_RADIUS && from === lowBound) {
    from = start - FALLBACK_RADIUS;
  }

  let to = end;
  const highBound = Math.min(text.length, end + MAX_SNIPPET);
  while (to < highBound && !SENTENCE_END.test(text[to])) to++;
  if (to - end > FALLBACK_RADIUS && to === highBound) {
    to = end + FALLBACK_RADIUS;
  }
  if (to < text.length && SENTENCE_END.test(text[to])) to++; // include the punctuation

  const before = collapse(text.slice(from, start), from > 0);
  const matchText = collapse(text.slice(start, end), false);
  // Trim only the trailing edge of `after` (where it may be truncated) — keep
  // the leading space that separates the match from the following word.
  const after = collapse(text.slice(end, to), false, to < text.length);

  return { before, match: matchText, after };
}

function collapse(s: string, ellipsisLeft = false, ellipsisRight = false): string {
  let out = s.replace(/\s+/g, ' ');
  if (ellipsisLeft) out = out.replace(/^ /, '');
  if (ellipsisRight) out = out.replace(/ $/, '');
  return out;
}
