import { browser } from 'wxt/browser';
import { TOGGLE_MESSAGE } from '@/lib/messaging';

export default defineBackground(() => {
  // MV3 exposes `browser.action`; Firefox MV2 only has `browser.browserAction`.
  // Referencing the missing one throws and would crash background startup.
  const action =
    browser.action ??
    (browser as unknown as { browserAction?: typeof browser.action }).browserAction;

  async function toggleActiveTab() {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id == null) return;
    try {
      await browser.tabs.sendMessage(tab.id, TOGGLE_MESSAGE);
    } catch {
      // Content script not present (restricted page, or page not reloaded
      // after install). Nothing to toggle.
    }
  }

  browser.commands.onCommand.addListener((command) => {
    if (command === 'toggle-glance') void toggleActiveTab();
  });

  // Fires only if no popup is set; harmless to keep alongside the popup.
  action?.onClicked.addListener(() => void toggleActiveTab());
});
