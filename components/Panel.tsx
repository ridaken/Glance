import { useEffect, useRef, useState } from 'react';
import {
  CaseSensitive,
  ChevronDown,
  ChevronUp,
  Regex,
  Search,
  WholeWord,
  X,
} from 'lucide-react';
import type { SearchController } from '@/lib/search/controller';
import { useSearchState } from '@/hooks/useSearchState';
import { historyItem, pushHistory } from '@/lib/settings';
import { PANEL_WIDTH } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { OptionChip } from './OptionChip';
import { ResultsList } from './ResultsList';
import { ScrollbarMarkers } from './ScrollbarMarkers';

interface PanelProps {
  controller: SearchController;
  open: boolean;
  dark: boolean;
  onClose: () => void;
  onExited: () => void;
}

export function Panel({ controller, open, dark, onClose, onExited }: PanelProps) {
  const state = useSearchState(controller);
  const inputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<string[]>([]);

  // Focus & select the input whenever the panel opens.
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      inputRef.current?.select();
      void historyItem.getValue().then(setHistory);
    }
  }, [open]);

  // Persist completed searches to history.
  useEffect(() => {
    if (state.status === 'done' && state.total > 0 && state.query) {
      void pushHistory(state.query);
    }
  }, [state.status, state.total, state.query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (state.total > 0) {
        e.shiftKey ? controller.prev() : controller.next();
      } else {
        controller.runNow();
      }
    } else if (e.key === 'ArrowDown' && e.altKey) {
      e.preventDefault();
      controller.next();
    } else if (e.key === 'ArrowUp' && e.altKey) {
      e.preventDefault();
      controller.prev();
    }
  };

  const { options } = state;
  const position = state.total > 0 ? state.currentIndex + 1 : 0;

  return (
    <div
      className={cn('glance-root', dark && 'dark')}
      onKeyDown={handleKeyDown}
    >
      {open && (
        <ScrollbarMarkers
          controller={controller}
          count={state.total}
          currentIndex={state.currentIndex}
          onSelect={(i) => controller.goTo(i)}
        />
      )}

      <div
        role="dialog"
        aria-label="Glance find in page"
        onAnimationEnd={() => {
          if (!open) onExited();
        }}
        // Flush full-height right dock. Critical layout/visibility as inline
        // styles so the panel is visible even if the Tailwind stylesheet fails to
        // inject into the shadow root. Utility classes layer the polish on top.
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: PANEL_WIDTH,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 2147483647,
          pointerEvents: 'auto',
          background: dark ? '#181a1e' : '#ffffff',
          color: dark ? '#e8eaed' : '#1a1c1e',
          borderLeft: `1px solid ${dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)'}`,
          boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
        }}
        className={cn(
          'pointer-events-auto fixed inset-y-0 right-0 z-[2] flex h-screen flex-col',
          'border-l border-[var(--g-border)] text-[var(--g-fg)]',
          'bg-[var(--g-surface)] shadow-[var(--g-shadow)] backdrop-blur-xl',
          open ? 'glance-panel-enter' : 'glance-panel-exit',
        )}
      >
        {/* Search row */}
        <div className="flex items-center gap-2 px-3 pt-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--g-muted)]" />
          <input
            ref={inputRef}
            value={state.query}
            list="glance-history"
            spellCheck={false}
            autoComplete="off"
            placeholder="Find in page…"
            onChange={(e) => controller.setQuery(e.target.value)}
            className="h-8 min-w-0 flex-1 bg-transparent text-[15px] text-[var(--g-fg)] outline-none placeholder:text-[var(--g-muted)]"
          />
          <datalist id="glance-history">
            {history.map((h) => (
              <option key={h} value={h} />
            ))}
          </datalist>
          <button
            type="button"
            aria-label="Close"
            title="Close (Esc)"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--g-muted)] hover:bg-[var(--g-row-hover)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-1 px-3 py-2">
          <OptionChip
            active={options.caseSensitive}
            onToggle={() => controller.setOptions({ caseSensitive: !options.caseSensitive })}
            label="Match case"
            title="Match case"
          >
            <CaseSensitive className="h-4 w-4" />
          </OptionChip>
          <OptionChip
            active={options.wholeWord}
            onToggle={() => controller.setOptions({ wholeWord: !options.wholeWord })}
            label="Whole word"
            title="Whole word"
            disabled={options.regex}
          >
            <WholeWord className="h-4 w-4" />
          </OptionChip>
          <OptionChip
            active={options.regex}
            onToggle={() => controller.setOptions({ regex: !options.regex })}
            label="Regular expression"
            title="Regular expression"
          >
            <Regex className="h-4 w-4" />
          </OptionChip>
          <OptionChip
            active={options.ignoreAccents}
            onToggle={() => controller.setOptions({ ignoreAccents: !options.ignoreAccents })}
            label="Ignore accents"
            title="Ignore accents (café = cafe)"
          >
            <span className="text-[15px] leading-none">á</span>
          </OptionChip>

          <div className="ml-auto flex items-center gap-1">
            <span
              className="min-w-[64px] text-right text-[12px] tabular-nums text-[var(--g-muted)]"
              aria-hidden
            >
              {state.status === 'searching'
                ? 'Searching…'
                : state.total > 0
                  ? `${position} / ${state.total}`
                  : state.query && state.status === 'done'
                    ? 'No results'
                    : ''}
            </span>
            <button
              type="button"
              aria-label="Previous match"
              title="Previous (Shift+Enter)"
              disabled={state.total === 0}
              onClick={() => controller.prev()}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--g-muted)] hover:bg-[var(--g-row-hover)] disabled:opacity-30"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next match"
              title="Next (Enter)"
              disabled={state.total === 0}
              onClick={() => controller.next()}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--g-muted)] hover:bg-[var(--g-row-hover)] disabled:opacity-30"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        {state.error && (
          <div className="border-t border-[var(--g-border)] px-3 py-2 text-[12px] text-red-500">
            Invalid regex: {state.error}
          </div>
        )}

        {state.capped && (
          <div className="border-t border-[var(--g-border)] px-3 py-1.5 text-[11px] text-[var(--g-muted)]">
            Showing the first {state.total.toLocaleString()} matches.
          </div>
        )}

        {/* Results */}
        {state.total > 0 && (
          <div className="flex min-h-0 flex-1 flex-col border-t border-[var(--g-border)]">
            <ResultsList
              controller={controller}
              matches={state.matches}
              currentIndex={state.currentIndex}
              onSelect={(i) => controller.goTo(i)}
            />
          </div>
        )}

        {/* Screen-reader live region for match counts. */}
        <div role="status" aria-live="polite" className="sr-only">
          {state.status === 'done'
            ? `${state.total} ${state.total === 1 ? 'match' : 'matches'} found`
            : ''}
        </div>
      </div>
    </div>
  );
}
