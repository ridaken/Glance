import { createRoot } from 'react-dom/client';
import { browser } from 'wxt/browser';
import { isToggleMessage } from '@/lib/messaging';
import { settingsItem } from '@/lib/settings';
import App from './App';
// Import the compiled CSS as a string so we can inject it into the shadow root.
import tailwindCss from '@/assets/tailwind.css?inline';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'manual',
  runAt: 'document_idle',

  main(ctx) {
    // Direct toggle callback — React registers the real handler on mount. No
    // EventTarget/event-dispatch indirection that could fail to deliver.
    const controls: { toggle: () => void } = { toggle: () => {} };
    const requestToggle = () => controls.toggle();

    // --- Manual shadow-root mount (full control + real style isolation) ------
    const host = document.createElement('glance-host');
    host.style.cssText =
      'position: fixed; top: 0; left: 0; width: 0; height: 0; ' +
      'z-index: 2147483647; pointer-events: none; color-scheme: normal;';
    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = tailwindCss;
    shadow.appendChild(style);

    const mountPoint = document.createElement('div');
    mountPoint.style.pointerEvents = 'none';
    shadow.appendChild(mountPoint);

    document.documentElement.appendChild(host);

    const root = createRoot(mountPoint);
    root.render(<App registerToggle={(fn) => (controls.toggle = fn)} />);

    // --- Toggle sources -----------------------------------------------------
    browser.runtime.onMessage.addListener((msg) => {
      if (isToggleMessage(msg)) requestToggle();
    });

    // Best-effort Ctrl+F override (only when enabled in settings).
    let overrideCtrlF = false;
    void settingsItem.getValue().then((s) => (overrideCtrlF = s.overrideCtrlF));
    settingsItem.watch((next) => (overrideCtrlF = next.overrideCtrlF));

    ctx.addEventListener(
      window,
      'keydown',
      (e: KeyboardEvent) => {
        if (!overrideCtrlF) return;
        const isFind =
          (e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey &&
          e.key.toLowerCase() === 'f';
        if (!isFind) return;
        e.preventDefault();
        e.stopPropagation();
        requestToggle();
      },
      { capture: true },
    );

    ctx.onInvalidated(() => {
      root.unmount();
      host.remove();
    });
  },
});
