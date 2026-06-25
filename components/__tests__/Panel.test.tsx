import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Panel } from '../Panel';
import type { SearchController, SearchState } from '@/lib/search/controller';
import { defaultSearchOptions, type SearchMatch } from '@/lib/search/types';

afterEach(cleanup);

/** A minimal controller stub exposing just what `Panel` consumes. */
function makeController(partial: Partial<SearchState> = {}) {
  const state: SearchState = {
    query: 'hello',
    options: defaultSearchOptions,
    status: 'done',
    error: null,
    matches: [{}, {}, {}] as SearchMatch[],
    currentIndex: 0,
    total: 3,
    capped: false,
    ...partial,
  };
  const controller = {
    subscribe: () => () => {},
    getSnapshot: () => state,
    next: vi.fn(),
    prev: vi.fn(),
    goTo: vi.fn(),
    setQuery: vi.fn(),
    runNow: vi.fn(),
    setOptions: vi.fn(),
    getContextFor: () => ({ before: '', match: 'hello', after: '' }),
    markerFractions: () => [0.1, 0.5, 0.9],
  };
  return controller as unknown as SearchController & {
    next: ReturnType<typeof vi.fn>;
    prev: ReturnType<typeof vi.fn>;
  };
}

function renderPanel(controller: SearchController) {
  return render(
    <Panel
      controller={controller}
      open
      dark={false}
      scale={1}
      width={380}
      onResize={vi.fn()}
      onResizeEnd={vi.fn()}
      onClose={vi.fn()}
      onExited={vi.fn()}
    />,
  );
}

describe('Panel keyboard navigation', () => {
  it('ArrowDown advances to the next match', () => {
    const controller = makeController();
    renderPanel(controller);
    fireEvent.keyDown(screen.getByPlaceholderText('Find in page…'), { key: 'ArrowDown' });
    expect(controller.next).toHaveBeenCalledTimes(1);
    expect(controller.prev).not.toHaveBeenCalled();
  });

  it('ArrowUp goes to the previous match', () => {
    const controller = makeController();
    renderPanel(controller);
    fireEvent.keyDown(screen.getByPlaceholderText('Find in page…'), { key: 'ArrowUp' });
    expect(controller.prev).toHaveBeenCalledTimes(1);
    expect(controller.next).not.toHaveBeenCalled();
  });

  it('Enter and Shift+Enter move next/previous', () => {
    const controller = makeController();
    renderPanel(controller);
    const input = screen.getByPlaceholderText('Find in page…');
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(controller.next).toHaveBeenCalledTimes(1);
    expect(controller.prev).toHaveBeenCalledTimes(1);
  });

  it('does not navigate when there are no matches', () => {
    const controller = makeController({ total: 0, matches: [], currentIndex: -1 });
    renderPanel(controller);
    fireEvent.keyDown(screen.getByPlaceholderText('Find in page…'), { key: 'ArrowDown' });
    expect(controller.next).not.toHaveBeenCalled();
  });
});

describe('Panel search input', () => {
  it('has no autocomplete dropdown wiring', () => {
    const { container } = renderPanel(makeController());
    const input = screen.getByPlaceholderText('Find in page…');
    expect(input.getAttribute('autocomplete')).toBe('off');
    expect(input.hasAttribute('list')).toBe(false);
    expect(container.querySelector('datalist')).toBeNull();
  });
});
