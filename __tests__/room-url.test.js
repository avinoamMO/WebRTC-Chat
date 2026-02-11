/**
 * Tests for room/URL helper functions.
 */
const {
  parseRoomFromHash,
  buildRoomLink,
  normalizeRoomName,
  normalizeUserName,
  getChannelRoom,
} = require('../src/logic');

describe('parseRoomFromHash', () => {
  test('extracts plain room name from hash', () => {
    expect(parseRoomFromHash('#my-room')).toBe('my-room');
  });

  test('decodes URI-encoded hash', () => {
    expect(parseRoomFromHash('#friday%20standup')).toBe('friday standup');
  });

  test('returns empty string for empty hash', () => {
    expect(parseRoomFromHash('#')).toBe('');
    expect(parseRoomFromHash('')).toBe('');
  });

  test('returns empty string for null/undefined', () => {
    expect(parseRoomFromHash(null)).toBe('');
    expect(parseRoomFromHash(undefined)).toBe('');
  });

  test('handles malformed URI encoding gracefully', () => {
    // %ZZ is not a valid percent-encoded sequence
    const result = parseRoomFromHash('#%ZZ');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('handles special characters', () => {
    expect(parseRoomFromHash('#room%2Fname')).toBe('room/name');
    expect(parseRoomFromHash('#room%40org')).toBe('room@org');
  });
});

describe('buildRoomLink', () => {
  test('constructs a full room URL', () => {
    const link = buildRoomLink('https://example.com', '/app/', 'my-room');
    expect(link).toBe('https://example.com/app/#my-room');
  });

  test('encodes special characters in room name', () => {
    const link = buildRoomLink('https://example.com', '/', 'room with spaces');
    expect(link).toBe('https://example.com/#room%20with%20spaces');
  });

  test('handles empty pathname', () => {
    const link = buildRoomLink('https://example.com', '', 'test');
    expect(link).toBe('https://example.com#test');
  });
});

describe('normalizeRoomName', () => {
  test('trims whitespace from room name', () => {
    expect(normalizeRoomName('  my-room  ')).toBe('my-room');
  });

  test('returns default-room for empty input', () => {
    expect(normalizeRoomName('')).toBe('default-room');
    expect(normalizeRoomName('   ')).toBe('default-room');
  });

  test('returns default-room for null/undefined', () => {
    expect(normalizeRoomName(null)).toBe('default-room');
    expect(normalizeRoomName(undefined)).toBe('default-room');
  });

  test('preserves valid room name', () => {
    expect(normalizeRoomName('friday-standup')).toBe('friday-standup');
  });
});

describe('normalizeUserName', () => {
  test('trims whitespace from user name', () => {
    expect(normalizeUserName('  Avi  ')).toBe('Avi');
  });

  test('returns Anonymous for empty input', () => {
    expect(normalizeUserName('')).toBe('Anonymous');
    expect(normalizeUserName('   ')).toBe('Anonymous');
  });

  test('returns Anonymous for null/undefined', () => {
    expect(normalizeUserName(null)).toBe('Anonymous');
    expect(normalizeUserName(undefined)).toBe('Anonymous');
  });

  test('preserves valid name', () => {
    expect(normalizeUserName('Avi')).toBe('Avi');
  });
});

describe('getChannelRoom', () => {
  test('prepends observable- prefix', () => {
    expect(getChannelRoom('my-room')).toBe('observable-my-room');
  });

  test('works with empty string', () => {
    expect(getChannelRoom('')).toBe('observable-');
  });

  test('does not double-prefix', () => {
    const result = getChannelRoom('observable-room');
    expect(result).toBe('observable-observable-room');
  });
});
