# Glance

[![CI](https://github.com/ridaken/Glance/actions/workflows/ci.yml/badge.svg)](https://github.com/ridaken/Glance/actions/workflows/ci.yml)

Find in page, reimagined. Glance replaces the browser's bare Ctrl+F with a sleek
slide-in panel that lists **every match with surrounding context**, so you can tell
the right result from the wrong one at a glance — then click to jump to it.

Built with [WXT](https://wxt.dev) for a single codebase that ships to both **Chrome
(MV3)** and **Firefox**.

## Features

- **Context for every match** — each result row shows the surrounding sentence with the
  term highlighted. Hover to focus, click to scroll the page to it.
- **Fast on long documents** — highlighting uses the [CSS Custom Highlight API][chl]
  (zero DOM mutation, no reflow) with a `<mark>` fallback for older browsers. Match
  building is time-sliced so the main thread stays responsive.
- **Powerful search modes** — match case, whole word, regular expressions, and
  accent-insensitive matching (`café` = `cafe`).
- **Matches across element boundaries** — `<b>Hel</b>lo` still matches "Hello", and text
  inside open Shadow DOM (web components) is searched too.
- **Navigation** — `Enter` / `Shift+Enter` for next/previous, a current-match indicator
  (`3 / 47`), a virtualized result list that stays smooth at thousands of matches, and
  **scrollbar tick markers** showing where every match sits on the page.
- **Polish** — slide-in animation (respects `prefers-reduced-motion`), light/dark themes,
  search history, focus management, and an ARIA live region announcing match counts.

## Activation

- **`Ctrl/⌘ + Shift + F`** — the reliable shortcut (rebind at
  `chrome://extensions/shortcuts`).
- **Toolbar icon** — click to toggle.
- **`Ctrl/⌘ + F` override** — optional, off by default (Options page). Best-effort: it
  can't work on browser-internal pages (`chrome://`, the extension store, the PDF
  viewer) or when focus is in the browser UI, because Ctrl+F is browser-reserved.

Press the shortcut again, `Esc`, or the ✕ to close.

## Development

```bash
npm install
npm run dev          # Chrome, with HMR
npm run dev:firefox  # Firefox
npm run build        # production build -> .output/chrome-mv3
npm run build:firefox
npm test             # unit tests (matcher + walker)
npm run compile      # typecheck
npm run icons        # regenerate public/icon/*.png from assets/logo.svg
```

Load the unpacked build from `.output/chrome-mv3` via `chrome://extensions`
(Developer mode → Load unpacked), or `.output/firefox-mv2` via `about:debugging`.

> **Measuring real performance:** the `dev`/`dev:firefox` runners serve **unminified
> React and recompile Tailwind on every page open**, so the options/popup feel slow
> there. To judge actual speed, run `npm run build:firefox` and load
> `.output/firefox-mv2/manifest.json` via `about:debugging → This Firefox → Load
> Temporary Add-on` — the optimized build paints instantly.

## Architecture

| Area | Files |
| --- | --- |
| Search engine (pure, tested) | `lib/search/{walker,matcher,highlighter,context,scroll,scheduler}.ts` |
| State + lifecycle | `lib/search/controller.ts` |
| Content UI (Shadow DOM) | `entrypoints/content/{index.tsx,App.tsx}`, `components/*` |
| Background (commands/icon) | `entrypoints/background.ts` |
| Options page | `entrypoints/options/*` |
| Settings + history storage | `lib/settings.ts` |

The content script mounts a React UI inside a Shadow DOM (style isolation), while the
search engine operates directly on the page document for highlighting and scrolling —
both share the same content-script context.

## Known limitations

- No effect on browser-internal pages or the built-in PDF viewer (content scripts can't
  run there).
- "Push page content" (on by default) reflows normal-flow content to make room for the
  dock, but a content script can't shrink the real viewport — page elements using
  `position: fixed` or `width: 100vw` can still sit under the panel. Toggle it off in
  Options to overlay instead.
- Cross-origin iframes can't be searched (browser security).
- On Firefox, the Custom Highlight API ignores `text-decoration`/`text-shadow`, so
  highlights use background/color only (already the case here).

## Deferred (future versions)

Dynamic-content re-search (MutationObserver), same-origin iframe search, find & replace,
and cross-tab search.

[chl]: https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API
