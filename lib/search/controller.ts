import { getContext } from './context';
import { Highlighter } from './highlighter';
import { findMatches, isMatchError } from './matcher';
import { pulseRange } from './pulse';
import { runChunked } from './scheduler';
import { documentFraction, scrollToRange } from './scroll';
import {
  defaultSearchOptions,
  type MatchContext,
  type SearchMatch,
  type SearchOptions,
} from './types';
import { rangeFromOffsets, walk } from './walker';

export type SearchStatus = 'idle' | 'searching' | 'done' | 'error';

export interface SearchState {
  query: string;
  options: SearchOptions;
  status: SearchStatus;
  error: string | null;
  matches: SearchMatch[];
  currentIndex: number;
  total: number;
  capped: boolean;
}

const EMPTY: SearchState = {
  query: '',
  options: defaultSearchOptions,
  status: 'idle',
  error: null,
  matches: [],
  currentIndex: -1,
  total: 0,
  capped: false,
};

/**
 * Owns all search state and the highlight lifecycle. Exposes a
 * subscribe/getSnapshot pair for React's useSyncExternalStore. The raw document
 * text is kept privately so result rows can compute context lazily.
 */
export class SearchController {
  private state: SearchState = EMPTY;
  private listeners = new Set<() => void>();
  private highlighter = new Highlighter();
  private rawText = '';
  private cancelChunk: (() => void) | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  debounceMs = 300;

  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  };

  getSnapshot = (): SearchState => this.state;

  private set(patch: Partial<SearchState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
  }

  /** Context for a result row, computed on demand from the raw document text. */
  getContextFor(match: SearchMatch): MatchContext {
    return getContext(this.rawText, match);
  }

  /** Normalized 0..1 vertical positions of every match, for scrollbar markers. */
  markerFractions(): number[] {
    return this.state.matches.map((m) => documentFraction(m.range));
  }

  setQuery(query: string) {
    this.set({ query });
    this.scheduleSearch();
  }

  setOptions(options: Partial<SearchOptions>) {
    this.set({ options: { ...this.state.options, ...options } });
    this.scheduleSearch();
  }

  private scheduleSearch() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.run(), this.debounceMs);
  }

  /** Run immediately, bypassing the debounce (e.g. on Enter). */
  runNow() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.run();
  }

  private run() {
    this.cancelChunk?.();
    this.highlighter.clear();
    const { query, options } = this.state;

    if (!query) {
      this.set({ status: 'idle', matches: [], currentIndex: -1, total: 0, error: null, capped: false });
      return;
    }

    this.set({ status: 'searching', error: null });

    const { text, segments } = walk(document);
    this.rawText = text;

    const outcome = findMatches(text, query, options);
    if (isMatchError(outcome)) {
      this.set({ status: 'error', error: outcome.error, matches: [], currentIndex: -1, total: 0 });
      return;
    }

    const capped = outcome.length >= 10_000;
    const built: SearchMatch[] = [];

    this.cancelChunk = runChunked(
      outcome,
      (raw, i) => {
        const range = rangeFromOffsets(segments, raw.start, raw.end);
        if (range) built.push({ ...raw, index: built.length, range });
      },
      {
        onChunk: () => {
          this.highlighter.setRanges(built.map((m) => m.range), this.state.currentIndex);
          this.set({ matches: [...built], total: built.length });
        },
        onDone: () => {
          const currentIndex = built.length > 0 ? 0 : -1;
          this.highlighter.setRanges(built.map((m) => m.range), currentIndex);
          this.set({
            status: 'done',
            matches: built,
            total: built.length,
            currentIndex,
            capped,
          });
        },
      },
    );
  }

  goTo(index: number, scroll = true) {
    const { matches } = this.state;
    if (index < 0 || index >= matches.length) return;
    this.set({ currentIndex: index });
    this.highlighter.setCurrent(matches.map((m) => m.range), index);
    if (scroll) {
      scrollToRange(matches[index].range);
      pulseRange(matches[index].range);
    }
  }

  next() {
    if (this.state.matches.length === 0) return;
    this.goTo((this.state.currentIndex + 1) % this.state.matches.length);
  }

  prev() {
    if (this.state.matches.length === 0) return;
    const n = this.state.matches.length;
    this.goTo((this.state.currentIndex - 1 + n) % n);
  }

  clear() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.cancelChunk?.();
    this.highlighter.clear();
    this.rawText = '';
    this.set({ ...EMPTY, options: this.state.options });
  }

  dispose() {
    this.clear();
    this.listeners.clear();
  }
}
