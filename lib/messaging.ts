/** Message sent from the background (command / icon click) to the content script. */
export interface ToggleMessage {
  type: 'glance:toggle';
}

export const TOGGLE_MESSAGE: ToggleMessage = { type: 'glance:toggle' };

export function isToggleMessage(msg: unknown): msg is ToggleMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as { type?: string }).type === 'glance:toggle'
  );
}

/**
 * Message sent from the content-script UI to the background asking it to open the
 * options page. Content scripts can't call `runtime.openOptionsPage` directly.
 */
export interface OpenOptionsMessage {
  type: 'glance:open-options';
}

export const OPEN_OPTIONS_MESSAGE: OpenOptionsMessage = { type: 'glance:open-options' };

export function isOpenOptionsMessage(msg: unknown): msg is OpenOptionsMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as { type?: string }).type === 'glance:open-options'
  );
}
