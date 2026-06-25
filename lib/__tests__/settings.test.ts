import { describe, expect, it } from 'vitest';
import { clampPanelWidth, PANEL_WIDTH_MIN, resolveScale } from '../settings';

describe('resolveScale', () => {
  it('maps explicit sizes to fixed multipliers', () => {
    expect(resolveScale('default')).toBe(1);
    expect(resolveScale('large')).toBe(1.15);
    expect(resolveScale('larger')).toBe(1.3);
  });

  it('auto stays at 1 on a 1080p display', () => {
    expect(
      resolveScale('auto', { width: 1920, height: 1080, devicePixelRatio: 1 }),
    ).toBe(1);
  });

  it('auto enlarges above 1080p (e.g. 1440p)', () => {
    expect(
      resolveScale('auto', { width: 2560, height: 1440, devicePixelRatio: 1 }),
    ).toBe(1.15);
  });

  it('auto accounts for the device pixel ratio', () => {
    // A "1280px" CSS viewport on a 2x display has a 2560px long edge.
    expect(
      resolveScale('auto', { width: 1280, height: 720, devicePixelRatio: 2 }),
    ).toBe(1.15);
  });
});

describe('clampPanelWidth', () => {
  it('keeps a normal width unchanged', () => {
    expect(clampPanelWidth(380, 1920)).toBe(380);
  });

  it('enforces the minimum', () => {
    expect(clampPanelWidth(100, 1920)).toBe(PANEL_WIDTH_MIN);
  });

  it('caps at 90% of the viewport (and never above 900)', () => {
    expect(clampPanelWidth(5000, 1000)).toBe(900);
    expect(clampPanelWidth(5000, 600)).toBe(540); // 0.9 * 600
  });

  it('rounds to whole pixels', () => {
    expect(clampPanelWidth(380.6, 1920)).toBe(381);
  });
});
