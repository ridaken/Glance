import { afterEach, describe, expect, it, vi } from 'vitest';
import { pulseRange } from '../pulse';

function rangeWithRect(rect: Partial<DOMRect>): Range {
  const range = document.createRange();
  range.getBoundingClientRect = vi.fn(
    () =>
      ({
        top: 0, left: 0, width: 0, height: 0, right: 0, bottom: 0, x: 0, y: 0,
        toJSON() {},
        ...rect,
      }) as DOMRect,
  );
  return range;
}

afterEach(() => {
  document.querySelectorAll('.glance-pulse').forEach((e) => e.remove());
  vi.useRealTimers();
});

describe('pulseRange', () => {
  it('overlays a flash box over the match and cleans it up', () => {
    vi.useFakeTimers();
    pulseRange(rangeWithRect({ top: 100, left: 50, width: 40, height: 16 }));

    const box = document.querySelector('.glance-pulse') as HTMLElement;
    expect(box).toBeTruthy();
    expect(box.style.width).toBe('44px'); // 40 + 2*pad
    expect(box.style.left).toBe('48px'); // 50 - pad (scrollX = 0)

    vi.advanceTimersByTime(1500); // safety-net removal
    expect(document.querySelector('.glance-pulse')).toBeNull();
  });

  it('does nothing for a zero-size range', () => {
    pulseRange(rangeWithRect({ width: 0, height: 0 }));
    expect(document.querySelector('.glance-pulse')).toBeNull();
  });
});
