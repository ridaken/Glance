import { browser } from 'wxt/browser';
import { OPEN_OPTIONS_MESSAGE } from '@/lib/messaging';
import { Logo } from './Logo';

interface EmptyStateProps {
  /** Recent search terms (most-recent first). */
  history: string[];
  /** Current query — drives the "no matches" message when set. */
  query: string;
  /** True when a search completed with zero matches (vs. the just-opened state). */
  noMatches: boolean;
  /** Run one of the recent searches. */
  onPick: (term: string) => void;
}

/**
 * Fills the panel body when there are no results — both the just-opened state and
 * the no-matches state — with branding, recent searches, and a few shortcut tips,
 * instead of a large blank void.
 */
export function EmptyState({ history, query, noMatches, onPick }: EmptyStateProps) {
  const recents = history.slice(0, 8);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 overflow-y-auto px-5 py-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <Logo size={52} />
        <div className="text-lg font-semibold text-[var(--g-fg)]">Glance</div>
        <div className="max-w-[16em] text-[0.75em] text-[var(--g-muted)]">
          Find every match on the page, each shown with its surrounding context.
        </div>
      </div>

      {noMatches && query && (
        <div className="text-[0.8125em] text-[var(--g-muted)]">
          No matches for{' '}
          <span className="font-medium text-[var(--g-fg)]">“{query}”</span>.
        </div>
      )}

      {recents.length > 0 && (
        <div className="flex w-full flex-col items-center gap-2">
          <div className="text-[0.6875em] font-semibold uppercase tracking-wide text-[var(--g-muted)]">
            Recent searches
          </div>
          <div className="flex flex-wrap justify-center gap-1.5">
            {recents.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onPick(term)}
                title={`Search “${term}”`}
                className="max-w-[14em] truncate rounded-full border border-[var(--g-border)] px-2.5 py-1 text-[0.75em] text-[var(--g-fg)] transition-colors hover:bg-[var(--g-row-hover)]"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-1.5 text-[0.6875em] text-[var(--g-muted)]">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <Tip keys="Enter">Next</Tip>
          <Tip keys="Shift+Enter">Previous</Tip>
          <Tip keys="Esc">Close</Tip>
        </div>
        <div>Type above to search this page.</div>
      </div>

      <button
        type="button"
        onClick={() => void browser.runtime.sendMessage(OPEN_OPTIONS_MESSAGE)}
        className="text-[0.6875em] text-[var(--g-muted)] underline underline-offset-2 transition-colors hover:text-[var(--g-fg)]"
      >
        Open settings
      </button>
    </div>
  );
}

function Tip({ keys, children }: { keys: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      <kbd className="rounded border border-[var(--g-border)] bg-[var(--g-surface-solid)] px-1 py-0.5 text-[0.9em] leading-none">
        {keys}
      </kbd>
      <span>{children}</span>
    </span>
  );
}
