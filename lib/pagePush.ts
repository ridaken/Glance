import { PANEL_WIDTH } from './constants';
import { prefersReducedMotion } from './search/scroll';

/**
 * Reserve space for the docked panel by reflowing the page: animate a
 * `margin-right` on the document element so normal-flow content shifts out from
 * under the panel.
 *
 * Caveat (by design): only normal-flow content moves. Page elements using
 * `position: fixed` or `width: 100vw` stay viewport-width and can still sit under
 * the panel — hence the user-facing toggle.
 */

const TRANSITION = 'margin-right 220ms cubic-bezier(0.22, 1, 0.36, 1)';

let original: { marginRight: string; transition: string } | null = null;
let restoreTimer: ReturnType<typeof setTimeout> | null = null;

export function applyPagePush(): void {
  const el = document.documentElement;
  // Save the page's own inline values once so we can restore them exactly.
  if (!original) {
    original = { marginRight: el.style.marginRight, transition: el.style.transition };
  }
  if (restoreTimer) {
    clearTimeout(restoreTimer);
    restoreTimer = null;
  }
  el.style.transition = prefersReducedMotion() ? original.transition : TRANSITION;
  el.style.marginRight = `${PANEL_WIDTH}px`;
}

export function removePagePush(): void {
  if (!original) return; // never applied
  const el = document.documentElement;
  const saved = original;

  // Animate back to the page's original margin, then drop our transition so we
  // leave the element exactly as we found it.
  el.style.marginRight = saved.marginRight;

  const cleanup = () => {
    el.style.transition = saved.transition;
    original = null;
    restoreTimer = null;
  };

  if (prefersReducedMotion()) {
    cleanup();
  } else {
    if (restoreTimer) clearTimeout(restoreTimer);
    restoreTimer = setTimeout(cleanup, 240);
  }
}
