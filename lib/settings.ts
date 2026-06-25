import { storage } from 'wxt/utils/storage';
import { defaultSearchOptions, type SearchOptions } from './search/types';
import { PANEL_WIDTH } from './constants';

export type ThemePref = 'auto' | 'light' | 'dark';

/** UI scale preference. `auto` enlarges on high-resolution (>1080p) displays. */
export type TextSize = 'auto' | 'default' | 'large' | 'larger';

export interface GlanceSettings {
  /** Intercept the page's Ctrl+F (best-effort; off by default). */
  overrideCtrlF: boolean;
  debounceMs: number;
  theme: ThemePref;
  /** UI text/icon scale (font/icon/spacing only — not panel width). */
  textSize: TextSize;
  /** Push page content aside to make room for the panel (vs. overlay it). */
  pushPage: boolean;
  /** Persisted width of the docked panel, in CSS pixels. */
  panelWidth: number;
  /** Search options to start each session with. */
  defaultOptions: SearchOptions;
}

export const defaultSettings: GlanceSettings = {
  overrideCtrlF: false,
  debounceMs: 300,
  theme: 'auto',
  textSize: 'auto',
  pushPage: true,
  panelWidth: PANEL_WIDTH,
  defaultOptions: defaultSearchOptions,
};

/** Explicit text-size choices map to a uniform scale multiplier. */
const TEXT_SIZE_SCALE: Record<Exclude<TextSize, 'auto'>, number> = {
  default: 1,
  large: 1.15,
  larger: 1.3,
};

export interface ScreenInfo {
  width: number;
  height: number;
  devicePixelRatio: number;
}

/**
 * Resolve a `textSize` preference to a numeric UI scale. `auto` bumps to 1.15 on
 * displays taller/wider than 1080p (e.g. 1440p) or with a high pixel ratio, where
 * the default sizing reads as too small; otherwise it stays at 1.
 */
export function resolveScale(pref: TextSize, screen?: ScreenInfo): number {
  if (pref !== 'auto') return TEXT_SIZE_SCALE[pref];
  const info =
    screen ??
    (typeof window !== 'undefined'
      ? {
          width: window.screen?.width ?? 0,
          height: window.screen?.height ?? 0,
          devicePixelRatio: window.devicePixelRatio ?? 1,
        }
      : undefined);
  if (!info) return 1;
  const longEdge = Math.max(info.width, info.height) * (info.devicePixelRatio || 1);
  // 1920 == the long edge of a 1080p display; anything beyond gets enlarged.
  return longEdge > 1920 ? 1.15 : 1;
}

export const PANEL_WIDTH_MIN = 320;

/** Clamp a desired panel width to sane bounds for the given viewport width. */
export function clampPanelWidth(width: number, viewportWidth: number): number {
  const max = Math.max(PANEL_WIDTH_MIN, Math.min(900, viewportWidth * 0.9));
  return Math.round(Math.min(Math.max(width, PANEL_WIDTH_MIN), max));
}

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
