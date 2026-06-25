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
