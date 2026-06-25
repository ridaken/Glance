/** Smooth-scroll the viewport so a Range is centered, honoring reduced motion. */
export function scrollToRange(range: Range) {
  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    // Collapsed/zero-size range (e.g. hidden); fall back to the element.
    (range.startContainer.parentElement ?? undefined)?.scrollIntoView({
      block: 'center',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
    return;
  }
  const targetY = window.scrollY + rect.top - window.innerHeight / 2 + rect.height / 2;
  const targetX = window.scrollX + rect.left - window.innerWidth / 2 + rect.width / 2;
  window.scrollTo({
    top: Math.max(0, targetY),
    left: Math.max(0, targetX),
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  });
}

export function prefersReducedMotion(): boolean {
  return (
    typeof matchMedia !== 'undefined' &&
    matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Vertical position (0..1) of a range within the full scrollable document,
 * used to place scrollbar tick markers.
 */
export function documentFraction(range: Range): number {
  const rect = range.getBoundingClientRect();
  const docHeight = Math.max(
    document.documentElement.scrollHeight,
    document.body?.scrollHeight ?? 0,
  );
  if (docHeight <= 0) return 0;
  const absoluteTop = window.scrollY + rect.top;
  return Math.min(1, Math.max(0, absoluteTop / docHeight));
}
