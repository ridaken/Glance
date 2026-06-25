import { memo } from 'react';
import type { SearchController } from '@/lib/search/controller';
import type { SearchMatch } from '@/lib/search/types';
import { cn } from '@/lib/utils';

interface ResultRowProps {
  controller: SearchController;
  match: SearchMatch;
  index: number;
  active: boolean;
  onSelect: (index: number) => void;
}

export const ResultRow = memo(function ResultRow({
  controller,
  match,
  index,
  active,
  onSelect,
}: ResultRowProps) {
  const ctx = controller.getContextFor(match);
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={() => onSelect(index)}
      className={cn(
        'flex w-full gap-2 px-3 py-2 text-left text-[13px] leading-snug',
        'border-l-2 border-transparent transition-colors',
        'hover:bg-[var(--g-row-hover)]',
        active && 'border-l-[var(--g-accent)] bg-[var(--g-row-active)]',
      )}
    >
      <span className="mt-px w-7 shrink-0 text-right text-[11px] tabular-nums text-[var(--g-muted)]">
        {index + 1}
      </span>
      <span className="min-w-0 break-words text-[var(--g-fg)]">
        <span className="opacity-70">{ctx.before}</span>
        <mark className="rounded-[2px] bg-[var(--g-accent)] px-0.5 text-[var(--g-accent-fg)]">
          {ctx.match}
        </mark>
        <span className="opacity-70">{ctx.after}</span>
      </span>
    </button>
  );
});
