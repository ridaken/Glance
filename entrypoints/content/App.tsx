import { useCallback, useEffect, useRef, useState } from 'react';
import { SearchController } from '@/lib/search/controller';
import {
  clampPanelWidth,
  resolveScale,
  settingsItem,
  type ThemePref,
} from '@/lib/settings';
import { applyPagePush, removePagePush } from '@/lib/pagePush';
import { Panel } from '@/components/Panel';

interface AppProps {
  /** Called once on mount with the function the content script should invoke to toggle. */
  registerToggle: (toggle: () => void) => void;
}

function resolveDark(theme: ThemePref): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return (
    typeof matchMedia !== 'undefined' &&
    matchMedia('(prefers-color-scheme: dark)').matches
  );
}

export default function App({ registerToggle }: AppProps) {
  const controllerRef = useRef<SearchController>(null);
  if (controllerRef.current === null) controllerRef.current = new SearchController();
  const controller = controllerRef.current;

  const [open, setOpen] = useState(false);
  const [render, setRender] = useState(false);
  const [theme, setTheme] = useState<ThemePref>('auto');
  const [dark, setDark] = useState(false);
  const [pushPage, setPushPage] = useState(true);
  const [scale, setScale] = useState(1);
  const [width, setWidth] = useState(() =>
    clampPanelWidth(380, typeof window !== 'undefined' ? window.innerWidth : 1280),
  );
  // True only while the user is actively dragging the resize handle, so the
  // page-push reflow tracks the panel instantly (no transition lag) during drag.
  const draggingRef = useRef(false);

  // Load persisted settings into the controller + theme + scale + width.
  useEffect(() => {
    let active = true;
    void settingsItem.getValue().then((s) => {
      if (!active) return;
      controller.debounceMs = s.debounceMs;
      controller.setOptions(s.defaultOptions);
      setTheme(s.theme);
      setPushPage(s.pushPage);
      setScale(resolveScale(s.textSize));
      setWidth(clampPanelWidth(s.panelWidth, window.innerWidth));
    });
    const unwatch = settingsItem.watch((s) => {
      controller.debounceMs = s.debounceMs;
      setTheme(s.theme);
      setPushPage(s.pushPage);
      setScale(resolveScale(s.textSize));
      // Don't fight an in-progress drag with an echoed sync update.
      if (!draggingRef.current) setWidth(clampPanelWidth(s.panelWidth, window.innerWidth));
    });
    return () => {
      active = false;
      unwatch();
    };
  }, [controller]);

  // Track system theme for "auto".
  useEffect(() => {
    setDark(resolveDark(theme));
    if (theme !== 'auto' || typeof matchMedia === 'undefined') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setDark(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const close = useCallback(() => setOpen(false), []);

  // Live width update during a drag: reflow the page with it, no transition.
  const handleResize = useCallback((next: number) => {
    draggingRef.current = true;
    setWidth(next);
  }, []);

  // Drag finished: clear the dragging flag and persist the chosen width.
  const handleResizeEnd = useCallback((next: number) => {
    draggingRef.current = false;
    setWidth(next);
    void settingsItem.getValue().then((s) =>
      settingsItem.setValue({ ...s, panelWidth: next }),
    );
  }, []);

  // Toggle from background command / icon / Ctrl+F. Keep the handler trivial:
  // flip `open` only, and let effects derive mount/visibility + cleanup.
  useEffect(() => {
    registerToggle(() => setOpen((o) => !o));
  }, [registerToggle]);

  // Mount the panel when opening; clear highlights when closing.
  useEffect(() => {
    if (open) setRender(true);
    else controller.clear();
  }, [open, controller]);

  // Close when the user clicks back onto the page. `composedPath()` crosses the
  // shadow boundary, so a click on any of our UI (panel, scrollbar rail, resize
  // handle) contains the `glance-root` wrapper; a click on the page does not.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const insideGlance = e
        .composedPath()
        .some((n) => n instanceof HTMLElement && n.classList.contains('glance-root'));
      if (!insideGlance) setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown, true);
    return () => window.removeEventListener('pointerdown', onPointerDown, true);
  }, [open]);

  // Reserve page space for the dock when open (unless the user prefers overlay).
  // Re-runs as the width changes during a drag; skip the animation mid-drag.
  useEffect(() => {
    if (open && pushPage) applyPagePush(width, !draggingRef.current);
    else removePagePush();
  }, [open, pushPage, width]);

  useEffect(() => {
    return () => {
      removePagePush();
      controller.dispose();
    };
  }, [controller]);

  if (!render) return null;

  return (
    <Panel
      controller={controller}
      open={open}
      dark={dark}
      scale={scale}
      width={width}
      onResize={handleResize}
      onResizeEnd={handleResizeEnd}
      onClose={close}
      onExited={() => setRender(false)}
    />
  );
}
