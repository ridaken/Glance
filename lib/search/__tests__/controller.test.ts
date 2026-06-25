import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchController, type SearchState } from '../controller';
import { Highlighter } from '../highlighter';

/** Resolve once the controller's state satisfies `pred`. */
function waitFor(c: SearchController, pred: (s: SearchState) => boolean) {
  return new Promise<void>((resolve) => {
    const check = () => {
      if (pred(c.getSnapshot())) {
        unsub();
        resolve();
      }
    };
    const unsub = c.subscribe(check);
    check();
  });
}

async function searched(html: string, query: string) {
  document.body.innerHTML = html;
  const c = new SearchController();
  c.setQuery(query);
  c.runNow(); // bypass debounce
  await waitFor(c, (s) => s.status === 'done');
  return c;
}

beforeEach(() => {
  // Isolate state logic from DOM highlighting + scrolling side effects.
  vi.spyOn(Highlighter.prototype, 'setRanges').mockImplementation(() => {});
  vi.spyOn(Highlighter.prototype, 'setCurrent').mockImplementation(() => {});
  vi.spyOn(Highlighter.prototype, 'clear').mockImplementation(() => {});
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  Element.prototype.scrollIntoView = vi.fn();
  // jsdom doesn't implement Range geometry; zeros route scroll to the element fallback.
  Range.prototype.getBoundingClientRect = vi.fn(
    () => ({ top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON() {} }) as DOMRect,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('SearchController', () => {
  it('finds matches and selects the first', async () => {
    const c = await searched('<p>cat cat cat</p>', 'cat');
    expect(c.getSnapshot().total).toBe(3);
    expect(c.getSnapshot().currentIndex).toBe(0);
  });

  it('cycles next/prev with wrap-around', async () => {
    const c = await searched('<p>cat cat cat</p>', 'cat');
    c.next();
    expect(c.getSnapshot().currentIndex).toBe(1);
    c.next();
    expect(c.getSnapshot().currentIndex).toBe(2);
    c.next();
    expect(c.getSnapshot().currentIndex).toBe(0); // wrap forward
    c.prev();
    expect(c.getSnapshot().currentIndex).toBe(2); // wrap backward
  });

  it('goTo selects an explicit index and ignores out-of-range', async () => {
    const c = await searched('<p>cat cat cat</p>', 'cat');
    c.goTo(2);
    expect(c.getSnapshot().currentIndex).toBe(2);
    c.goTo(99);
    expect(c.getSnapshot().currentIndex).toBe(2); // unchanged
    c.goTo(-1);
    expect(c.getSnapshot().currentIndex).toBe(2); // unchanged
  });

  it('reports zero matches as done', async () => {
    const c = await searched('<p>only dogs here</p>', 'cat');
    expect(c.getSnapshot().total).toBe(0);
    expect(c.getSnapshot().currentIndex).toBe(-1);
  });

  it('clear() resets to the idle state', async () => {
    const c = await searched('<p>cat</p>', 'cat');
    c.clear();
    const s = c.getSnapshot();
    expect(s.total).toBe(0);
    expect(s.currentIndex).toBe(-1);
    expect(s.status).toBe('idle');
  });

  it('treats an empty query as idle', async () => {
    document.body.innerHTML = '<p>cat</p>';
    const c = new SearchController();
    c.setQuery('');
    c.runNow();
    expect(c.getSnapshot().status).toBe('idle');
    expect(c.getSnapshot().total).toBe(0);
  });
});
