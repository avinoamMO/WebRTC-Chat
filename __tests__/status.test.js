/**
 * Tests for connection status helpers.
 */
const { statusLabel, mapConnectionState, STATUS_LABELS } = require('../src/logic');

describe('statusLabel', () => {
  test('returns Connecting for connecting status', () => {
    expect(statusLabel('connecting')).toBe('Connecting');
  });

  test('returns Connected for connected status', () => {
    expect(statusLabel('connected')).toBe('Connected');
  });

  test('returns Disconnected for disconnected status', () => {
    expect(statusLabel('disconnected')).toBe('Disconnected');
  });

  test('returns raw status for unknown values', () => {
    expect(statusLabel('new')).toBe('new');
    expect(statusLabel('checking')).toBe('checking');
  });

  test('returns empty string for empty input', () => {
    expect(statusLabel('')).toBe('');
  });
});

describe('STATUS_LABELS', () => {
  test('contains exactly three entries', () => {
    expect(Object.keys(STATUS_LABELS)).toHaveLength(3);
  });

  test('all values are capitalised strings', () => {
    Object.values(STATUS_LABELS).forEach((label) => {
      expect(typeof label).toBe('string');
      expect(label[0]).toBe(label[0].toUpperCase());
    });
  });
});

describe('mapConnectionState', () => {
  test('maps connecting to connecting', () => {
    expect(mapConnectionState('connecting')).toBe('connecting');
  });

  test('maps connected to connected', () => {
    expect(mapConnectionState('connected')).toBe('connected');
  });

  test('maps disconnected to disconnected', () => {
    expect(mapConnectionState('disconnected')).toBe('disconnected');
  });

  test('maps failed to disconnected', () => {
    expect(mapConnectionState('failed')).toBe('disconnected');
  });

  test('maps closed to disconnected', () => {
    expect(mapConnectionState('closed')).toBe('disconnected');
  });

  test('returns null for new (unhandled state)', () => {
    expect(mapConnectionState('new')).toBeNull();
  });

  test('returns null for unknown states', () => {
    expect(mapConnectionState('checking')).toBeNull();
    expect(mapConnectionState('')).toBeNull();
  });
});
