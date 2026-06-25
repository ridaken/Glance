import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../App';

afterEach(cleanup);

async function openPanel() {
  let toggle: () => void = () => {};
  render(<App registerToggle={(fn) => (toggle = fn)} />);
  await act(async () => {
    toggle();
  });
  await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
  return screen.getByRole('dialog');
}

describe('App render path', () => {
  it('mounts without crashing and shows the panel on toggle', async () => {
    const dialog = await openPanel();
    expect(dialog).toBeTruthy();
    expect(screen.getByPlaceholderText('Find in page…')).toBeTruthy();
  });

  it('closes when the user clicks back onto the page', async () => {
    const dialog = await openPanel();
    expect(dialog.className).toContain('glance-panel-enter');

    // A pointerdown on the page (outside our glance-root) triggers the close: the
    // panel switches to its exit animation (and unmounts once it finishes).
    await act(async () => {
      fireEvent.pointerDown(document.body);
    });
    expect(screen.getByRole('dialog').className).toContain('glance-panel-exit');
  });

  it('stays open when clicking inside the panel', async () => {
    const dialog = await openPanel();

    await act(async () => {
      fireEvent.pointerDown(dialog);
    });

    // Still the entering/open panel — not closing.
    expect(screen.getByRole('dialog').className).toContain('glance-panel-enter');
  });
});
