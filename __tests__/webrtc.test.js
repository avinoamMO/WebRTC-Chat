/**
 * Tests for WebRTC configuration and signaling helpers.
 */
const {
  DEFAULT_RTC_CONFIG,
  getRTCConfig,
  buildSignalPayload,
  isSDPMessage,
  isICEMessage,
} = require('../src/logic');

describe('DEFAULT_RTC_CONFIG', () => {
  test('has iceServers array', () => {
    expect(Array.isArray(DEFAULT_RTC_CONFIG.iceServers)).toBe(true);
  });

  test('contains at least one STUN server', () => {
    expect(DEFAULT_RTC_CONFIG.iceServers.length).toBeGreaterThanOrEqual(1);
    const hasStun = DEFAULT_RTC_CONFIG.iceServers.some((s) =>
      s.urls.startsWith('stun:')
    );
    expect(hasStun).toBe(true);
  });

  test('uses Google STUN servers', () => {
    const urls = DEFAULT_RTC_CONFIG.iceServers.map((s) => s.urls);
    expect(urls).toContain('stun:stun.l.google.com:19302');
  });
});

describe('getRTCConfig', () => {
  test('returns default config when no overrides', () => {
    const config = getRTCConfig();
    expect(config.iceServers).toEqual(DEFAULT_RTC_CONFIG.iceServers);
  });

  test('merges overrides with default config', () => {
    const config = getRTCConfig({ bundlePolicy: 'max-bundle' });
    expect(config.iceServers).toEqual(DEFAULT_RTC_CONFIG.iceServers);
    expect(config.bundlePolicy).toBe('max-bundle');
  });

  test('overrides can replace iceServers', () => {
    const custom = [{ urls: 'turn:my-server.com' }];
    const config = getRTCConfig({ iceServers: custom });
    expect(config.iceServers).toEqual(custom);
  });

  test('does not mutate the default config', () => {
    const original = JSON.parse(JSON.stringify(DEFAULT_RTC_CONFIG));
    getRTCConfig({ extra: true });
    expect(DEFAULT_RTC_CONFIG).toEqual(original);
  });
});

describe('buildSignalPayload', () => {
  test('builds SDP signal payload', () => {
    const sdp = { type: 'offer', sdp: 'v=0...' };
    const payload = buildSignalPayload('my-room', { sdp });
    expect(payload).toEqual({
      room: 'observable-my-room',
      message: { sdp },
    });
  });

  test('builds ICE candidate signal payload', () => {
    const candidate = { candidate: 'candidate:...', sdpMid: '0' };
    const payload = buildSignalPayload('room1', { candidate });
    expect(payload).toEqual({
      room: 'observable-room1',
      message: { candidate },
    });
  });

  test('room gets observable- prefix', () => {
    const payload = buildSignalPayload('test', {});
    expect(payload.room).toBe('observable-test');
  });
});

describe('isSDPMessage', () => {
  test('returns true for message with sdp', () => {
    expect(isSDPMessage({ sdp: { type: 'offer' } })).toBe(true);
  });

  test('returns false for message without sdp', () => {
    expect(isSDPMessage({ candidate: {} })).toBe(false);
  });

  test('returns false for null', () => {
    expect(isSDPMessage(null)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isSDPMessage(undefined)).toBe(false);
  });

  test('returns false for empty object', () => {
    expect(isSDPMessage({})).toBe(false);
  });
});

describe('isICEMessage', () => {
  test('returns true for message with candidate', () => {
    expect(isICEMessage({ candidate: { candidate: 'candidate:...' } })).toBe(true);
  });

  test('returns false for message without candidate', () => {
    expect(isICEMessage({ sdp: {} })).toBe(false);
  });

  test('returns false for null', () => {
    expect(isICEMessage(null)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isICEMessage(undefined)).toBe(false);
  });
});
