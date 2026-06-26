import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { browser } from 'wxt/browser';
import { EmptyState } from '../EmptyState';
import { OPEN_OPTIONS_MESSAGE } from '@/lib/messaging';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('EmptyState', () => {
  it('asks the background to open the options page when "Open settings" is clicked', () => {
    const sendMessage = vi.spyOn(browser.runtime, 'sendMessage').mockResolvedValue(undefined);
    render(<EmptyState history={[]} query="" noMatches={false} onPick={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));

    expect(sendMessage).toHaveBeenCalledWith(OPEN_OPTIONS_MESSAGE);
  });

  it('runs a recent search when a recent chip is clicked', () => {
    const onPick = vi.fn();
    render(
      <EmptyState history={['react', 'vitest']} query="" noMatches={false} onPick={onPick} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'vitest' }));

    expect(onPick).toHaveBeenCalledWith('vitest');
  });

  it('shows a no-matches message for an unmatched query', () => {
    render(<EmptyState history={[]} query="zzz" noMatches onPick={vi.fn()} />);
    expect(screen.getByText(/No matches for/)).toBeTruthy();
  });
});
