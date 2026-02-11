/**
 * Tests for connection quality monitoring logic.
 */
const { qualityLevel, extractRTT } = require('../src/logic');

describe('qualityLevel', () => {
  test('returns empty string for null RTT', () => {
    expect(qualityLevel(null)).toBe('');
  });

  test('returns empty string for undefined RTT', () => {
    expect(qualityLevel(undefined)).toBe('');
  });

  test('returns quality-good for RTT < 0.15s', () => {
    expect(qualityLevel(0)).toBe('quality-good');
    expect(qualityLevel(0.05)).toBe('quality-good');
    expect(qualityLevel(0.149)).toBe('quality-good');
  });

  test('returns quality-fair for 0.15 <= RTT < 0.4', () => {
    expect(qualityLevel(0.15)).toBe('quality-fair');
    expect(qualityLevel(0.25)).toBe('quality-fair');
    expect(qualityLevel(0.399)).toBe('quality-fair');
  });

  test('returns quality-poor for RTT >= 0.4', () => {
    expect(qualityLevel(0.4)).toBe('quality-poor');
    expect(qualityLevel(1.0)).toBe('quality-poor');
    expect(qualityLevel(5.0)).toBe('quality-poor');
  });

  test('boundary: 0.15 is fair, not good', () => {
    expect(qualityLevel(0.15)).toBe('quality-fair');
  });

  test('boundary: 0.4 is poor, not fair', () => {
    expect(qualityLevel(0.4)).toBe('quality-poor');
  });
});

describe('extractRTT', () => {
  test('returns null for null input', () => {
    expect(extractRTT(null)).toBeNull();
  });

  test('returns null for undefined input', () => {
    expect(extractRTT(undefined)).toBeNull();
  });

  test('returns null when no candidate-pair report exists', () => {
    const stats = new Map();
    stats.set('id1', { type: 'inbound-rtp', bytesReceived: 1000 });
    expect(extractRTT(stats)).toBeNull();
  });

  test('returns null when candidate-pair is not in succeeded state', () => {
    const stats = new Map();
    stats.set('pair1', {
      type: 'candidate-pair',
      state: 'in-progress',
      currentRoundTripTime: 0.05,
    });
    expect(extractRTT(stats)).toBeNull();
  });

  test('extracts RTT from succeeded candidate-pair', () => {
    const stats = new Map();
    stats.set('pair1', {
      type: 'candidate-pair',
      state: 'succeeded',
      currentRoundTripTime: 0.123,
    });
    expect(extractRTT(stats)).toBe(0.123);
  });

  test('returns last succeeded candidate-pair RTT if multiple exist', () => {
    const stats = new Map();
    stats.set('pair1', {
      type: 'candidate-pair',
      state: 'succeeded',
      currentRoundTripTime: 0.1,
    });
    stats.set('pair2', {
      type: 'candidate-pair',
      state: 'succeeded',
      currentRoundTripTime: 0.25,
    });
    expect(extractRTT(stats)).toBe(0.25);
  });

  test('works with array-like forEach objects', () => {
    const reports = [
      { type: 'local-candidate', address: '192.168.1.1' },
      { type: 'candidate-pair', state: 'succeeded', currentRoundTripTime: 0.08 },
    ];
    expect(extractRTT(reports)).toBe(0.08);
  });
});
