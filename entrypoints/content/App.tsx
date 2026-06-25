import { useCallback, useEffect, useRef, useState } from 'react';
import { SearchController } from '@/lib/search/controller';
import { settingsItem, type ThemePref } from '@/lib/settings';
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

  // Load persisted settings into the controller + theme.
  useEffect(() => {
    let active = true;
    void settingsItem.getValue().then((s) => {
      if (!active) return;
      controller.debounceMs = s.debounceMs;
      controller.setOptions(s.defaultOptions);
      setTheme(s.theme);
      setPushPage(s.pushPage);
    });
    const unwatch = settingsItem.watch((s) => {
      controller.debounceMs = s.debounceMs;
      setTheme(s.theme);
      setPushPage(s.pushPage);
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

  // Reserve page space for the dock when open (unless the user prefers overlay).
  useEffect(() => {
    if (open && pushPage) applyPagePush();
    else removePagePush();
  }, [open, pushPage]);

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
      onClose={close}
      onExited={() => setRender(false)}
    />
  );
}
