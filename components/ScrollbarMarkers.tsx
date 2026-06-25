import { useEffect, useState } from 'react';
import type { SearchController } from '@/lib/search/controller';
import { PANEL_WIDTH } from '@/lib/constants';

interface ScrollbarMarkersProps {
  controller: SearchController;
  count: number;
  currentIndex: number;
  onSelect: (index: number) => void;
}

/**
 * A thin rail down the right edge of the viewport with a tick per match,
 * positioned by each match's vertical location in the document — an at-a-glance
 * map of where results are. Lives outside the panel so it's always visible.
 */
export function ScrollbarMarkers({
  controller,
  count,
  currentIndex,
  onSelect,
}: ScrollbarMarkersProps) {
  const [fractions, setFractions] = useState<number[]>([]);

  // Recompute positions when the result set changes or the page resizes.
  useEffect(() => {
    const update = () => setFractions(controller.markerFractions());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [controller, count]);

  if (fractions.length === 0) return null;

  return (
    <div
      className="pointer-events-auto fixed top-0 z-[1] h-screen w-2.5"
      style={{ right: PANEL_WIDTH }}
      aria-hidden
    >
      {fractions.map((f, i) => (
        <button
          type="button"
          key={i}
          tabIndex={-1}
          onClick={() => onSelect(i)}
          title={`Match ${i + 1}`}
          className="absolute right-0 h-[3px] w-2.5 -translate-y-1/2 rounded-l-sm transition-[width,background-color] hover:w-3.5"
          style={{
            top: `${f * 100}%`,
            backgroundColor:
              i === currentIndex ? 'var(--g-accent)' : 'rgba(255,170,0,0.55)',
          }}
        />
      ))}
    </div>
  );
}
