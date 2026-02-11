/**
 * Tests for media control state logic (audio, video, screen share, offerer).
 */
const { toggleAudioState, toggleVideoState, isOfferer } = require('../src/logic');

describe('toggleAudioState', () => {
  test('mutes when currently unmuted', () => {
    const state = toggleAudioState(false);
    expect(state.muted).toBe(true);
    expect(state.tooltip).toBe('Unmute');
  });

  test('unmutes when currently muted', () => {
    const state = toggleAudioState(true);
    expect(state.muted).toBe(false);
    expect(state.tooltip).toBe('Mute');
  });

  test('returns iconHTML string', () => {
    const mutedState = toggleAudioState(false);
    expect(typeof mutedState.iconHTML).toBe('string');
    expect(mutedState.iconHTML.length).toBeGreaterThan(0);

    const unmutedState = toggleAudioState(true);
    expect(typeof unmutedState.iconHTML).toBe('string');
  });

  test('muted and unmuted icon HTML differ', () => {
    const mutedState = toggleAudioState(false);
    const unmutedState = toggleAudioState(true);
    expect(mutedState.iconHTML).not.toBe(unmutedState.iconHTML);
  });
});

describe('toggleVideoState', () => {
  test('turns off when currently on', () => {
    const state = toggleVideoState(false);
    expect(state.off).toBe(true);
    expect(state.tooltip).toBe('Start Video');
  });

  test('turns on when currently off', () => {
    const state = toggleVideoState(true);
    expect(state.off).toBe(false);
    expect(state.tooltip).toBe('Stop Video');
  });

  test('returns iconHTML string', () => {
    const offState = toggleVideoState(false);
    expect(typeof offState.iconHTML).toBe('string');

    const onState = toggleVideoState(true);
    expect(typeof onState.iconHTML).toBe('string');
  });

  test('on and off icon HTML differ', () => {
    const offState = toggleVideoState(false);
    const onState = toggleVideoState(true);
    expect(offState.iconHTML).not.toBe(onState.iconHTML);
  });
});

describe('isOfferer', () => {
  test('returns true for 2 members (second joiner is offerer)', () => {
    expect(isOfferer(2)).toBe(true);
  });

  test('returns false for 1 member (first joiner waits)', () => {
    expect(isOfferer(1)).toBe(false);
  });

  test('returns false for 0 members', () => {
    expect(isOfferer(0)).toBe(false);
  });

  test('returns false for 3 members', () => {
    expect(isOfferer(3)).toBe(false);
  });
});
