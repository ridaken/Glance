import type { RawMatch, SearchOptions } from './types';
import { MAX_MATCHES } from './types';

const COMBINING_MARKS = /[̀-ͯ]/g;

interface FoldConfig {
  lowercase: boolean;
  stripAccents: boolean;
}

interface Folded {
  /** The transformed text actually searched. */
  text: string;
  /** foldToRaw[j] = raw index of the source char that produced folded char j. */
  foldToRaw: Uint32Array;
}

/**
 * Fold raw text per config while keeping a map from every folded char position
 * back to the raw source index. Folding can change length (NFD decomposition,
 * locale-less casing), so the map is essential for highlighting the right range.
 */
function fold(raw: string, cfg: FoldConfig): Folded {
  // Fast path: no transform requested.
  if (!cfg.lowercase && !cfg.stripAccents) {
    const map = new Uint32Array(raw.length);
    for (let i = 0; i < raw.length; i++) map[i] = i;
    return { text: raw, foldToRaw: map };
  }

  let out = '';
  const map: number[] = [];
  for (let i = 0; i < raw.length; i++) {
    let ch = raw[i];
    if (cfg.lowercase) ch = ch.toLowerCase();
    if (cfg.stripAccents) ch = ch.normalize('NFD').replace(COMBINING_MARKS, '');
    for (let k = 0; k < ch.length; k++) {
      out += ch[k];
      map.push(i);
    }
  }
  return { text: out, foldToRaw: Uint32Array.from(map) };
}

/** Fold just a query string (no map needed). */
function foldQuery(raw: string, cfg: FoldConfig): string {
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    let ch = raw[i];
    if (cfg.lowercase) ch = ch.toLowerCase();
    if (cfg.stripAccents) ch = ch.normalize('NFD').replace(COMBINING_MARKS, '');
    out += ch;
  }
  return out;
}

const WORD_CHAR = /[\p{L}\p{N}_]/u;

function isWordChar(ch: string | undefined): boolean {
  return ch !== undefined && WORD_CHAR.test(ch);
}

export interface MatchError {
  error: string;
}

export type MatchOutcome = RawMatch[] | MatchError;

export function isMatchError(o: MatchOutcome): o is MatchError {
  return !Array.isArray(o);
}

/**
 * Find all matches of `query` in `rawText` honoring `options`. Returns matches as
 * raw offsets into `rawText`, or a MatchError for an invalid regex.
 *
 * Capped at MAX_MATCHES to bound memory on pathological inputs.
 */
export function findMatches(
  rawText: string,
  query: string,
  options: SearchOptions,
): MatchOutcome {
  if (!query) return [];

  // Regex mode keeps original case in the text and uses the `i` flag, so the
  // user's pattern isn't corrupted by lowercasing. Accent-stripping is still
  // applied to the text (it doesn't affect pattern validity).
  const cfg: FoldConfig = options.regex
    ? { lowercase: false, stripAccents: options.ignoreAccents }
    : { lowercase: !options.caseSensitive, stripAccents: options.ignoreAccents };

  const { text, foldToRaw } = fold(rawText, cfg);
  const toRaw = (foldedIndex: number): number =>
    foldedIndex < foldToRaw.length
      ? foldToRaw[foldedIndex]
      : rawText.length; // end boundary

  const matches: RawMatch[] = [];

  if (options.regex) {
    let re: RegExp;
    try {
      re = new RegExp(query, options.caseSensitive ? 'g' : 'gi');
    } catch (e) {
      return { error: (e as Error).message };
    }
    let guard = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (++guard > MAX_MATCHES * 4) break; // runaway protection
      const s = m.index;
      let e = m.index + m[0].length;
      if (e === s) {
        // Zero-width match: advance to avoid an infinite loop.
        re.lastIndex++;
        continue;
      }
      matches.push({ start: toRaw(s), end: toRaw(e - 1) + 1 });
      if (matches.length >= MAX_MATCHES) break;
    }
    return matches;
  }

  // Plain (and whole-word) mode.
  const needle = foldQuery(query, cfg);
  if (!needle) return [];
  let from = 0;
  while (matches.length < MAX_MATCHES) {
    const idx = text.indexOf(needle, from);
    if (idx === -1) break;
    const endFolded = idx + needle.length;
    if (
      !options.wholeWord ||
      (!isWordChar(text[idx - 1]) && !isWordChar(text[endFolded]))
    ) {
      matches.push({ start: toRaw(idx), end: toRaw(endFolded - 1) + 1 });
    }
    from = idx + needle.length;
  }
  return matches;
}
