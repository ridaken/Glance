import { describe, expect, it } from 'vitest';
import {
  OPEN_OPTIONS_MESSAGE,
  TOGGLE_MESSAGE,
  isOpenOptionsMessage,
  isToggleMessage,
} from '../messaging';

describe('message guards', () => {
  it('recognizes the toggle message', () => {
    expect(isToggleMessage(TOGGLE_MESSAGE)).toBe(true);
    expect(isToggleMessage(OPEN_OPTIONS_MESSAGE)).toBe(false);
    expect(isToggleMessage({ type: 'other' })).toBe(false);
    expect(isToggleMessage(null)).toBe(false);
    expect(isToggleMessage('glance:toggle')).toBe(false);
  });

  it('recognizes the open-options message', () => {
    expect(isOpenOptionsMessage(OPEN_OPTIONS_MESSAGE)).toBe(true);
    expect(isOpenOptionsMessage(TOGGLE_MESSAGE)).toBe(false);
    expect(isOpenOptionsMessage(undefined)).toBe(false);
    expect(isOpenOptionsMessage({})).toBe(false);
  });
});
