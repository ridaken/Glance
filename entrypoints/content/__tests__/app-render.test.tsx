import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import App from '../App';

afterEach(cleanup);

describe('App render path', () => {
  it('mounts without crashing and shows the panel on toggle', async () => {
    let toggle: () => void = () => {};
    render(<App registerToggle={(fn) => (toggle = fn)} />);

    // Closed initially: no dialog.
    expect(screen.queryByRole('dialog')).toBeNull();

    // Invoke the same callback the content script calls on the toggle command.
    await act(async () => {
      toggle();
    });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeTruthy();
    });
    expect(screen.getByPlaceholderText('Find in page…')).toBeTruthy();
  });
});
