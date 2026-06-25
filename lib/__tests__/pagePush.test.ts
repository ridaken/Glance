import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { applyPagePush, removePagePush } from '../pagePush';

const el = () => document.documentElement;

beforeEach(() => {
  vi.useFakeTimers();
  el().removeAttribute('style');
});

afterEach(() => {
  // Flush any deferred restore so module state resets between tests.
  removePagePush();
  vi.runAllTimers();
  vi.useRealTimers();
  el().removeAttribute('style');
});

describe('pagePush', () => {
  it('reserves the panel width on the page root', () => {
    expect(el().style.marginRight).toBe('');
    applyPagePush(380);
    expect(el().style.marginRight).toBe('380px');
  });

  it('restores the original margin on remove', () => {
    applyPagePush(380);
    removePagePush();
    expect(el().style.marginRight).toBe(''); // restored synchronously
    vi.runAllTimers();
    expect(el().style.transition).toBe(''); // transition cleaned up after animation
  });

  it('preserves a pre-existing inline margin', () => {
    el().style.marginRight = '12px';
    applyPagePush(380);
    expect(el().style.marginRight).toBe('380px');
    removePagePush();
    expect(el().style.marginRight).toBe('12px');
  });

  it('is a no-op when never applied', () => {
    el().style.marginRight = '5px';
    removePagePush();
    expect(el().style.marginRight).toBe('5px');
  });

  it('is idempotent across repeated applies', () => {
    applyPagePush(380);
    applyPagePush(380);
    expect(el().style.marginRight).toBe('380px');
  });

  it('reflects the requested width', () => {
    applyPagePush(520);
    expect(el().style.marginRight).toBe('520px');
  });
});
