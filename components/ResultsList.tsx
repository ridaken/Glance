import { useEffect, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { SearchController } from '@/lib/search/controller';
import type { SearchMatch } from '@/lib/search/types';
import { ResultRow } from './ResultRow';

interface ResultsListProps {
  controller: SearchController;
  matches: SearchMatch[];
  currentIndex: number;
  onSelect: (index: number) => void;
}

const ESTIMATED_ROW = 46;

export function ResultsList({
  controller,
  matches,
  currentIndex,
  onSelect,
}: ResultsListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: matches.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_ROW,
    overscan: 8,
  });

  // Keep the current match visible as the user navigates with the keyboard.
  useEffect(() => {
    if (currentIndex >= 0) virtualizer.scrollToIndex(currentIndex, { align: 'auto' });
  }, [currentIndex, virtualizer]);

  return (
    <div
      ref={parentRef}
      // Right gutter (`mr-2.5`) insets the scrollbar from the viewport edge so it
      // isn't flush against the page's own scrollbar and is easy to grab.
      className="glance-scroll mr-2.5 min-h-0 flex-1 overflow-y-auto overscroll-contain"
      role="listbox"
      aria-label="Search results"
    >
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
        {virtualizer.getVirtualItems().map((vi) => (
          <div
            key={vi.key}
            data-index={vi.index}
            ref={virtualizer.measureElement}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${vi.start}px)`,
            }}
          >
            <ResultRow
              controller={controller}
              match={matches[vi.index]}
              index={vi.index}
              active={vi.index === currentIndex}
              onSelect={onSelect}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
