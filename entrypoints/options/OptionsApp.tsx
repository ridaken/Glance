import { useEffect, useState } from 'react';
import { browser } from 'wxt/browser';
import {
  defaultSettings,
  settingsItem,
  type GlanceSettings,
  type ThemePref,
} from '@/lib/settings';
import { TOGGLE_MESSAGE } from '@/lib/messaging';
import type { SearchOptions } from '@/lib/search/types';

const QUICK_SHORTCUTS = ['Ctrl+Shift+F', 'Alt+Shift+F', 'Ctrl+Shift+G', 'Ctrl+Shift+Y'];

// `commands.update`/`reset` are Firefox-only and absent from the Chrome types.
interface CommandsRebind {
  update?: (details: { name: string; shortcut: string }) => Promise<void>;
  reset?: (name: string) => Promise<void>;
}
const commandsExt = browser.commands as typeof browser.commands & CommandsRebind;

const SHORTCUTS_URL =
  typeof navigator !== 'undefined' && navigator.userAgent.includes('Firefox')
    ? 'about:addons'
    : 'chrome://extensions/shortcuts';

export default function OptionsApp() {
  const [settings, setSettings] = useState<GlanceSettings>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [shortcut, setShortcut] = useState('');
  const [draft, setDraft] = useState('');
  const [shortcutMsg, setShortcutMsg] = useState('');
  const [launchMsg, setLaunchMsg] = useState('');

  useEffect(() => {
    void settingsItem.getValue().then(setSettings);
    void browser.commands.getAll().then((cmds) => {
      const c = cmds.find((x) => x.name === 'toggle-glance');
      setShortcut(c?.shortcut ?? '');
      setDraft(c?.shortcut ?? '');
    });
  }, []);

  const commandsUpdatable = typeof commandsExt.update === 'function';

  const saveShortcut = async (value: string) => {
    setShortcutMsg('');
    if (!commandsExt.update) {
      setShortcutMsg('Rebinding here is Firefox-only. On Chrome, use chrome://extensions/shortcuts.');
      return;
    }
    try {
      await commandsExt.update({ name: 'toggle-glance', shortcut: value });
      setShortcut(value);
      setDraft(value);
      setShortcutMsg(`Saved “${value}”. Try it on a web page.`);
    } catch (e) {
      setShortcutMsg(`Couldn't set that combo: ${(e as Error).message}`);
    }
  };

  const resetShortcut = async () => {
    if (!commandsExt.reset) return;
    await commandsExt.reset('toggle-glance');
    const c = (await browser.commands.getAll()).find((x) => x.name === 'toggle-glance');
    setShortcut(c?.shortcut ?? '');
    setDraft(c?.shortcut ?? '');
    setShortcutMsg('Reset to default.');
  };

  // Manual launch: toggle every active tab (one per window). The web page gets
  // it even though this options page can't message itself.
  const launchNow = async () => {
    setLaunchMsg('');
    const tabs = await browser.tabs.query({ active: true });
    let sent = 0;
    for (const t of tabs) {
      if (t.id == null) continue;
      try {
        await browser.tabs.sendMessage(t.id, TOGGLE_MESSAGE);
        sent++;
      } catch {
        // No content script in that tab (extension page, restricted, not reloaded).
      }
    }
    setLaunchMsg(
      sent > 0
        ? `Toggle sent to ${sent} tab(s). If the panel still doesn't appear on your web page, it's a rendering issue — not the shortcut.`
        : 'No reachable web page. Open/reload a normal http(s) page, then click again.',
    );
  };

  const update = (patch: Partial<GlanceSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    void settingsItem.setValue(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const updateOption = (patch: Partial<SearchOptions>) =>
    update({ defaultOptions: { ...settings.defaultOptions, ...patch } });

  const dark =
    settings.theme === 'dark' ||
    (settings.theme === 'auto' &&
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div
      className={`glance-root ${dark ? 'dark' : ''} min-h-screen bg-[var(--g-elevated)] text-[var(--g-fg)]`}
    >
      <div className="mx-auto max-w-xl px-6 py-10">
        <h1 className="text-2xl font-semibold">Glance</h1>
        <p className="mt-1 text-sm text-[var(--g-muted)]">
          Find in page, reimagined. Configure behavior below — changes save
          automatically.{' '}
          {saved && <span className="text-[var(--g-accent)]">Saved ✓</span>}
        </p>

        <Section title="Shortcut & launch">
          <Row
            label="Open / close shortcut"
            hint={
              commandsUpdatable
                ? 'Type a combo (e.g. Alt+Shift+F) or pick one below. Must include Ctrl or Alt.'
                : 'Current shortcut. Rebind on Chrome via chrome://extensions/shortcuts.'
            }
          >
            <div className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                spellCheck={false}
                placeholder="Ctrl+Shift+F"
                className="w-36 rounded-md border border-[var(--g-border)] bg-[var(--g-surface-solid)] px-2 py-1 text-sm"
              />
              <button
                type="button"
                onClick={() => void saveShortcut(draft)}
                className="rounded-md bg-[var(--g-accent)] px-3 py-1 text-sm font-medium text-[var(--g-accent-fg)]"
              >
                Save
              </button>
              {commandsUpdatable && (
                <button
                  type="button"
                  onClick={() => void resetShortcut()}
                  className="rounded-md border border-[var(--g-border)] px-3 py-1 text-sm"
                >
                  Reset
                </button>
              )}
            </div>
          </Row>

          <div className="flex flex-wrap gap-2">
            {QUICK_SHORTCUTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => void saveShortcut(s)}
                className={`rounded-md border px-2 py-1 text-xs ${
                  s === shortcut
                    ? 'border-[var(--g-accent)] text-[var(--g-accent)]'
                    : 'border-[var(--g-border)] text-[var(--g-muted)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {shortcutMsg && (
            <p className="text-xs text-[var(--g-muted)]">{shortcutMsg}</p>
          )}

          <div className="flex items-center gap-3 border-t border-[var(--g-border)] pt-3">
            <button
              type="button"
              onClick={() => void launchNow()}
              className="rounded-md bg-[var(--g-accent)] px-3 py-1.5 text-sm font-medium text-[var(--g-accent-fg)]"
            >
              Open Glance on the current tab
            </button>
            <span className="text-xs text-[var(--g-muted)]">
              Keyboard-independent test. Also works from the toolbar icon.
            </span>
          </div>
          {launchMsg && <p className="text-xs text-[var(--g-muted)]">{launchMsg}</p>}
        </Section>

        <Section title="Activation">
          <Row
            label="Override the page's Ctrl+F"
            hint="Best-effort: works on most normal pages, but not on browser-internal pages, the PDF viewer, or when focus is in the browser UI."
          >
            <Toggle
              checked={settings.overrideCtrlF}
              onChange={(v) => update({ overrideCtrlF: v })}
            />
          </Row>
          <p className="mt-2 text-xs text-[var(--g-muted)]">
            The reliable shortcut is <Kbd>Ctrl/⌘ + Shift + F</Kbd>. Rebind it at{' '}
            <code className="rounded bg-[var(--g-surface-solid)] px-1 py-0.5">
              {SHORTCUTS_URL}
            </code>
            .
          </p>
        </Section>

        <Section title="Behavior">
          <Row
            label="Push page content"
            hint="Reflow the page to make room for the panel instead of overlaying it. Some full-width or fixed page elements may still sit under the panel."
          >
            <Toggle
              checked={settings.pushPage}
              onChange={(v) => update({ pushPage: v })}
            />
          </Row>
          <Row label="Search debounce" hint="Delay after typing before searching.">
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={100}
                max={1000}
                step={50}
                value={settings.debounceMs}
                onChange={(e) => update({ debounceMs: Number(e.target.value) })}
              />
              <span className="w-14 text-right text-sm tabular-nums">
                {settings.debounceMs} ms
              </span>
            </div>
          </Row>
          <Row label="Theme">
            <select
              value={settings.theme}
              onChange={(e) => update({ theme: e.target.value as ThemePref })}
              className="rounded-md border border-[var(--g-border)] bg-[var(--g-surface-solid)] px-2 py-1 text-sm"
            >
              <option value="auto">Auto (system)</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </Row>
        </Section>

        <Section title="Default search options">
          <Row label="Match case">
            <Toggle
              checked={settings.defaultOptions.caseSensitive}
              onChange={(v) => updateOption({ caseSensitive: v })}
            />
          </Row>
          <Row label="Whole word">
            <Toggle
              checked={settings.defaultOptions.wholeWord}
              onChange={(v) => updateOption({ wholeWord: v })}
            />
          </Row>
          <Row label="Regular expression">
            <Toggle
              checked={settings.defaultOptions.regex}
              onChange={(v) => updateOption({ regex: v })}
            />
          </Row>
          <Row label="Ignore accents">
            <Toggle
              checked={settings.defaultOptions.ignoreAccents}
              onChange={(v) => updateOption({ ignoreAccents: v })}
            />
          </Row>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--g-muted)]">
        {title}
      </h2>
      <div className="space-y-3 rounded-xl border border-[var(--g-border)] bg-[var(--g-surface-solid)] p-4">
        {children}
      </div>
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="mt-0.5 text-xs text-[var(--g-muted)]">{hint}</div>}
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        checked ? 'bg-[var(--g-accent)]' : 'bg-[var(--g-border)]'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-[var(--g-border)] bg-[var(--g-surface-solid)] px-1.5 py-0.5 text-xs">
      {children}
    </kbd>
  );
}
