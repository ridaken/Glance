/** Search options controlled by the options bar. */
export interface SearchOptions {
  caseSensitive: boolean;
  regex: boolean;
  /** Whole-word matching. Ignored when `regex` is true. */
  wholeWord: boolean;
  /** Accent/diacritic-insensitive matching (café === cafe). */
  ignoreAccents: boolean;
}

export const defaultSearchOptions: SearchOptions = {
  caseSensitive: false,
  regex: false,
  wholeWord: false,
  ignoreAccents: false,
};

/** A contiguous run of text from a single DOM Text node, mapped to global offsets. */
export interface Segment {
  node: Text;
  /** Inclusive global start offset into the concatenated document text. */
  start: number;
  /** Exclusive global end offset. */
  end: number;
}

/** Result of walking a DOM subtree: concatenated text + offset->node map. */
export interface WalkResult {
  text: string;
  segments: Segment[];
}

/** A single match expressed as offsets into the raw concatenated document text. */
export interface RawMatch {
  /** Inclusive start offset in the raw document text. */
  start: number;
  /** Exclusive end offset in the raw document text. */
  end: number;
}

/** A match enriched with a Range and (lazily filled) context for the UI. */
export interface SearchMatch extends RawMatch {
  index: number;
  range: Range;
}

/** Context snippet for one result row. */
export interface MatchContext {
  /** Text before the match within the snippet. */
  before: string;
  /** The matched text. */
  match: string;
  /** Text after the match within the snippet. */
  after: string;
}

/** Hard cap on matches to keep memory/rendering bounded on pathological pages. */
export const MAX_MATCHES = 10_000;
