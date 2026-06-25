import type { Segment, WalkResult } from './types';

/** Tags whose text content we never want to search. */
const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEMPLATE',
  'IFRAME',
  'OBJECT',
  'svg',
  'SVG',
]);

/**
 * Inline elements that do NOT introduce a text boundary. Anything not in this
 * set is treated as a block container, so text in adjacent blocks won't merge
 * into a single false match (e.g. `<p>foo</p><p>bar</p>` must not match "foobar"),
 * while text split across inline elements still does (`<b>Hel</b>lo` => "Hello").
 */
const INLINE_TAGS = new Set([
  'A', 'ABBR', 'B', 'BDI', 'BDO', 'CITE', 'CODE', 'DATA', 'DFN', 'EM', 'I',
  'KBD', 'MARK', 'Q', 'S', 'SAMP', 'SMALL', 'SPAN', 'STRONG', 'SUB', 'SUP',
  'TIME', 'U', 'VAR', 'WBR', 'FONT', 'INS', 'DEL', 'LABEL', 'OUTPUT',
]);

const visibilityCache = new WeakMap<Element, boolean>();

function isHidden(el: Element): boolean {
  const cached = visibilityCache.get(el);
  if (cached !== undefined) return cached;

  let hidden = false;
  if (
    (el as HTMLElement).hidden ||
    el.getAttribute('aria-hidden') === 'true'
  ) {
    hidden = true;
  } else {
    const style = getComputedStyle(el);
    hidden =
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.visibility === 'collapse' ||
      style.opacity === '0';
  }
  visibilityCache.set(el, hidden);
  return hidden;
}

const blockContainerCache = new WeakMap<Text, Element>();

/** Nearest ancestor element that is a block container (not inline). */
function blockContainerOf(node: Text): Element | null {
  const cached = blockContainerCache.get(node);
  if (cached) return cached;
  let el: Element | null = node.parentElement;
  while (el && INLINE_TAGS.has(el.tagName)) {
    el = el.parentElement;
  }
  if (el) blockContainerCache.set(node, el);
  return el;
}

/**
 * Walk a root (Document, ShadowRoot, or Element) collecting visible text into a
 * single string plus a segment map back to the originating Text nodes. Recurses
 * into open shadow roots so web-component content is searchable.
 *
 * Clears its internal caches on each top-level call so it always reflects the
 * current DOM/layout state.
 */
export function walk(root: Node): WalkResult {
  const segments: Segment[] = [];
  const parts: string[] = [];
  let offset = 0;
  let prevBlock: Element | null = null;

  const append = (text: string) => {
    parts.push(text);
    offset += text.length;
  };

  const walkRoot = (rootNode: Node) => {
    const filterRoot =
      rootNode.nodeType === Node.DOCUMENT_NODE
        ? (rootNode as Document).body ?? rootNode
        : rootNode;

    const walker = document.createTreeWalker(
      filterRoot,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode(node: Node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            if (SKIP_TAGS.has(el.tagName) || isHidden(el)) {
              return NodeFilter.FILTER_REJECT; // skip subtree
            }
            // Recurse into open shadow roots; they aren't visited by the walker.
            if ((el as Element & { shadowRoot?: ShadowRoot | null }).shadowRoot) {
              walkRoot((el as Element & { shadowRoot: ShadowRoot }).shadowRoot);
            }
            return NodeFilter.FILTER_SKIP; // descend, but element itself isn't text
          }
          return (node as Text).data.length > 0
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      },
    );

    let current = walker.nextNode();
    while (current) {
      const textNode = current as Text;
      const block = blockContainerOf(textNode);
      if (prevBlock !== null && block !== prevBlock) {
        append('\n'); // boundary between blocks
      }
      prevBlock = block;

      const start = offset;
      append(textNode.data);
      segments.push({ node: textNode, start, end: offset });

      current = walker.nextNode();
    }
  };

  // Reset per-run; layout/visibility may have changed since last search.
  blockContainerCache; // (WeakMap, no explicit clear needed)
  walkRoot(root);

  return { text: parts.join(''), segments };
}

/**
 * Map a raw global offset to the segment containing it (binary search).
 * Returns the index into `segments`, or -1 if outside any segment.
 */
export function findSegment(segments: Segment[], offset: number): number {
  let lo = 0;
  let hi = segments.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const seg = segments[mid];
    if (offset < seg.start) hi = mid - 1;
    else if (offset >= seg.end) lo = mid + 1;
    else return mid;
  }
  return -1;
}

/**
 * Build a DOM Range spanning [start, end) raw offsets, which may cross multiple
 * Text nodes / inline elements. Returns null if the offsets can't be mapped
 * (e.g. the match falls on an inserted block separator).
 */
export function rangeFromOffsets(
  segments: Segment[],
  start: number,
  end: number,
): Range | null {
  // Clamp end to the last char of the match; separators are 1-char so an end
  // landing on a separator maps to the preceding segment's tail.
  let startIdx = findSegment(segments, start);
  let endIdx = findSegment(segments, end - 1);
  if (startIdx === -1 || endIdx === -1) return null;

  const startSeg = segments[startIdx];
  const endSeg = segments[endIdx];
  const range = document.createRange();
  range.setStart(startSeg.node, start - startSeg.start);
  range.setEnd(endSeg.node, end - endSeg.start);
  return range;
}
