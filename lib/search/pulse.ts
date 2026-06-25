/**
 * A one-shot visual "look here" cue. The CSS Custom Highlight API can't be
 * animated, so we overlay a short-lived box on the match that flashes once and
 * removes itself.
 *
 * The box is positioned in absolute *document* coordinates and appended to
 * <html>, so it stays anchored to the match (and scrolls with the page) — no
 * need to time it against the smooth scroll.
 */

const STYLE_ID = 'glance-pulse-style';

const PULSE_CSS = `
@keyframes glance-pulse {
  0%   { opacity: 0; transform: scale(1.25); }
  15%  { opacity: 1; transform: scale(1); }
  55%  { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1); }
}
@keyframes glance-pulse-flat {
  0% { opacity: 0; }
  15% { opacity: 1; }
  55% { opacity: 1; }
  100% { opacity: 0; }
}
.glance-pulse {
  position: absolute;
  pointer-events: none;
  z-index: 2147483646;
  border-radius: 3px;
  background: rgba(255, 145, 0, 0.40);
  box-shadow: 0 0 0 3px rgba(255, 145, 0, 0.65), 0 0 18px 5px rgba(255, 145, 0, 0.5);
  transform-origin: center;
  animation: glance-pulse 1100ms ease-out forwards;
}
@media (prefers-reduced-motion: reduce) {
  .glance-pulse { animation: glance-pulse-flat 900ms ease-out forwards; }
}
`;

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = PULSE_CSS;
  document.head.appendChild(style);
}

/** Flash a one-shot highlight over `range` to draw the eye to it. */
export function pulseRange(range: Range): void {
  const rect = range.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return;

  ensureStyle();
  const pad = 2;
  const box = document.createElement('div');
  box.className = 'glance-pulse';
  box.style.left = `${window.scrollX + rect.left - pad}px`;
  box.style.top = `${window.scrollY + rect.top - pad}px`;
  box.style.width = `${rect.width + pad * 2}px`;
  box.style.height = `${rect.height + pad * 2}px`;

  box.addEventListener('animationend', () => box.remove());
  // Safety net in case animationend doesn't fire (e.g. tab hidden mid-animation).
  setTimeout(() => box.remove(), 1500);

  document.documentElement.appendChild(box);
}
