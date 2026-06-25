/**
 * Highlighting layer. Prefers the CSS Custom Highlight API (zero DOM mutation,
 * no reflow — the fast path on long documents) and falls back to wrapping
 * matches in <mark> for browsers without it (e.g. Firefox < 149).
 */

const MATCH_NAME = 'glance-match';
const CURRENT_NAME = 'glance-current';
const STYLE_ID = 'glance-highlight-style';
const MARK_ATTR = 'data-glance-mark';

export const supportsHighlightApi =
  typeof CSS !== 'undefined' &&
  'highlights' in CSS &&
  typeof Highlight !== 'undefined';

/** Colors live in the page (light DOM) so ::highlight() can style page text. */
const HIGHLIGHT_CSS = `
::highlight(${MATCH_NAME}) {
  background-color: rgba(255, 214, 0, 0.40);
  color: inherit;
}
::highlight(${CURRENT_NAME}) {
  background-color: rgba(255, 145, 0, 0.85);
  color: #000;
}
mark[${MARK_ATTR}] {
  background-color: rgba(255, 214, 0, 0.45);
  color: inherit;
}
mark[${MARK_ATTR}="current"] {
  background-color: rgba(255, 145, 0, 0.85);
  color: #000;
}
`;

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = HIGHLIGHT_CSS;
  document.head.appendChild(style);
}

export class Highlighter {
  private marks: HTMLElement[] = [];

  /** Register/replace all match ranges, with `current` styled distinctly. */
  setRanges(ranges: Range[], currentIndex: number) {
    ensureStyle();
    if (supportsHighlightApi) {
      const all = new Highlight();
      const current = new Highlight();
      ranges.forEach((r, i) => {
        if (i === currentIndex) current.add(r);
        else all.add(r);
      });
      CSS.highlights.set(MATCH_NAME, all);
      CSS.highlights.set(CURRENT_NAME, current);
    } else {
      this.renderMarks(ranges, currentIndex);
    }
  }

  /** Update only which range is the "current" one (cheap path). */
  setCurrent(ranges: Range[], currentIndex: number) {
    this.setRanges(ranges, currentIndex);
  }

  clear() {
    if (supportsHighlightApi) {
      CSS.highlights.delete(MATCH_NAME);
      CSS.highlights.delete(CURRENT_NAME);
    }
    this.removeMarks();
  }

  // --- <mark> fallback -------------------------------------------------------

  private renderMarks(ranges: Range[], currentIndex: number) {
    this.removeMarks();
    // Wrap from last to first so earlier offsets/ranges stay valid.
    for (let i = ranges.length - 1; i >= 0; i--) {
      const kind = i === currentIndex ? 'current' : 'match';
      this.wrapRange(ranges[i], kind);
    }
  }

  private wrapRange(range: Range, kind: string) {
    // A match may span multiple text nodes; wrap each intersecting text portion.
    const textNodes = this.textNodesInRange(range);
    for (const { node, start, end } of textNodes) {
      let target = node;
      if (end < target.data.length) target.splitText(end);
      if (start > 0) target = target.splitText(start);
      const mark = document.createElement('mark');
      mark.setAttribute(MARK_ATTR, kind);
      target.parentNode?.insertBefore(mark, target);
      mark.appendChild(target);
      this.marks.push(mark);
    }
  }

  private textNodesInRange(
    range: Range,
  ): Array<{ node: Text; start: number; end: number }> {
    const out: Array<{ node: Text; start: number; end: number }> = [];
    const startNode = range.startContainer as Text;
    const endNode = range.endContainer as Text;
    if (startNode === endNode) {
      out.push({ node: startNode, start: range.startOffset, end: range.endOffset });
      return out;
    }
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_TEXT,
    );
    let n = walker.nextNode() as Text | null;
    let inside = false;
    while (n) {
      if (n === startNode) {
        inside = true;
        out.push({ node: n, start: range.startOffset, end: n.data.length });
      } else if (n === endNode) {
        out.push({ node: n, start: 0, end: range.endOffset });
        break;
      } else if (inside) {
        out.push({ node: n, start: 0, end: n.data.length });
      }
      n = walker.nextNode() as Text | null;
    }
    return out;
  }

  private removeMarks() {
    for (const mark of this.marks) {
      const parent = mark.parentNode;
      if (!parent) continue;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
      parent.normalize();
    }
    this.marks = [];
  }
}
