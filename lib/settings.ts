import { storage } from 'wxt/utils/storage';
import { defaultSearchOptions, type SearchOptions } from './search/types';

export type ThemePref = 'auto' | 'light' | 'dark';

export interface GlanceSettings {
  /** Intercept the page's Ctrl+F (best-effort; off by default). */
  overrideCtrlF: boolean;
  debounceMs: number;
  theme: ThemePref;
  /** Push page content aside to make room for the panel (vs. overlay it). */
  pushPage: boolean;
  /** Search options to start each session with. */
  defaultOptions: SearchOptions;
}

export const defaultSettings: GlanceSettings = {
  overrideCtrlF: false,
  debounceMs: 300,
  theme: 'auto',
  pushPage: true,
  defaultOptions: defaultSearchOptions,
};

export const settingsItem = storage.defineItem<GlanceSettings>('sync:glanceSettings', {
  fallback: defaultSettings,
});

const HISTORY_MAX = 25;

export const historyItem = storage.defineItem<string[]>('local:glanceHistory', {
  fallback: [],
});

export async function pushHistory(term: string): Promise<void> {
  const trimmed = term.trim();
  if (!trimmed) return;
  const current = await historyItem.getValue();
  const next = [trimmed, ...current.filter((t) => t !== trimmed)].slice(0, HISTORY_MAX);
  await historyItem.setValue(next);
}
