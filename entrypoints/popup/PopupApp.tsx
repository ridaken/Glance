import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { browser } from 'wxt/browser';
import { TOGGLE_MESSAGE } from '@/lib/messaging';

const QUICK_SHORTCUTS = ['Ctrl+Shift+F', 'Alt+Shift+F', 'Ctrl+Shift+G', 'Ctrl+Shift+Y'];

interface CommandsRebind {
  update?: (details: { name: string; shortcut: string }) => Promise<void>;
  reset?: (name: string) => Promise<void>;
}
const commandsExt = browser.commands as typeof browser.commands & CommandsRebind;

function isDark(): boolean {
  return (
    typeof matchMedia !== 'undefined' &&
    matchMedia('(prefers-color-scheme: dark)').matches
  );
}

export default function PopupApp() {
  const [shortcut, setShortcut] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    void browser.commands.getAll().then((cmds) => {
      setShortcut(cmds.find((c) => c.name === 'toggle-glance')?.shortcut ?? '');
    });
  }, []);

  // The popup's active tab is the underlying web page, so this is a clean,
  // keyboard-independent trigger.
  const launch = async () => {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id == null) {
      setMsg('No active tab.');
      return;
    }
    try {
      await browser.tabs.sendMessage(tab.id, TOGGLE_MESSAGE);
      window.close();
    } catch {
      setMsg('Glance can’t run on this page (reload it, or it may be a restricted page).');
    }
  };

  const rebind = async (value: string) => {
    setMsg('');
    if (!commandsExt.update) {
      setMsg('Rebinding is Firefox-only; on Chrome use chrome://extensions/shortcuts.');
      return;
    }
    try {
      await commandsExt.update({ name: 'toggle-glance', shortcut: value });
      setShortcut(value);
      setMsg(`Shortcut set to ${value}.`);
    } catch (e) {
      setMsg(`Couldn’t set that combo: ${(e as Error).message}`);
    }
  };

  return (
    <div
      className={`glance-root ${isDark() ? 'dark' : ''}`}
      style={{
        width: 280,
        background: isDark() ? '#181a1e' : '#ffffff',
        color: isDark() ? '#e8eaed' : '#1a1c1e',
        padding: 14,
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <div className="mb-3 flex items-center gap-2">
        <Search className="h-4 w-4 text-[var(--g-accent)]" />
        <span className="text-sm font-semibold">Glance</span>
      </div>

      <button
        type="button"
        onClick={() => void launch()}
        className="w-full rounded-lg bg-[var(--g-accent)] px-3 py-2 text-sm font-medium text-[var(--g-accent-fg)]"
      >
        Find on this page
      </button>

      <div className="mt-3 text-[11px] text-[var(--g-muted)]">
        Keyboard shortcut: <strong>{shortcut || 'unset'}</strong>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {QUICK_SHORTCUTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => void rebind(s)}
            className={`rounded-md border px-1.5 py-0.5 text-[11px] ${
              s === shortcut
                ? 'border-[var(--g-accent)] text-[var(--g-accent)]'
                : 'border-[var(--g-border)] text-[var(--g-muted)]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {msg && <p className="mt-2 text-[11px] text-[var(--g-muted)]">{msg}</p>}

      <button
        type="button"
        onClick={() => void browser.runtime.openOptionsPage()}
        className="mt-3 w-full rounded-md border border-[var(--g-border)] px-3 py-1.5 text-xs text-[var(--g-muted)]"
      >
        All options…
      </button>
    </div>
  );
}
