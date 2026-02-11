/**
 * Extracted testable logic from the WebRTC Chat application.
 *
 * This module contains pure functions and stateful helpers that can
 * be unit-tested without a live browser environment. The original
 * script.js remains the production entry-point loaded by index.html.
 */

// ============================================================
// Room & URL helpers
// ============================================================

/**
 * Extracts a room name from a URL hash fragment.
 * @param {string} hash - The raw location.hash value (e.g. '#my-room').
 * @returns {string} Decoded room name, or empty string if none.
 */
function parseRoomFromHash(hash) {
  const raw = (hash || '').slice(1);
  if (!raw) return '';
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Builds a shareable room link.
 * @param {string} origin - window.location.origin
 * @param {string} pathname - window.location.pathname
 * @param {string} roomName - Plain room name.
 * @returns {string} Full URL with encoded hash.
 */
function buildRoomLink(origin, pathname, roomName) {
  return origin + pathname + '#' + encodeURIComponent(roomName);
}

/**
 * Normalises user input for room name. Falls back to 'default-room'.
 * @param {string} raw - Raw input value.
 * @returns {string}
 */
function normalizeRoomName(raw) {
  const trimmed = (raw || '').trim();
  return trimmed || 'default-room';
}

/**
 * Normalises user name input. Falls back to 'Anonymous'.
 * @param {string} raw - Raw input value.
 * @returns {string}
 */
function normalizeUserName(raw) {
  const trimmed = (raw || '').trim();
  return trimmed || 'Anonymous';
}

/**
 * Returns the ScaleDrone channel room name.
 * @param {string} roomName - Plain room name.
 * @returns {string}
 */
function getChannelRoom(roomName) {
  return 'observable-' + roomName;
}

// ============================================================
// Quality monitoring
// ============================================================

/**
 * Determines the CSS quality class based on round-trip time.
 * @param {number|null} rtt - Round-trip time in seconds.
 * @returns {string} CSS class: 'quality-good', 'quality-fair', 'quality-poor', or ''.
 */
function qualityLevel(rtt) {
  if (rtt === null || rtt === undefined) return '';
  if (rtt < 0.15) return 'quality-good';
  if (rtt < 0.4) return 'quality-fair';
  return 'quality-poor';
}

/**
 * Extracts the round-trip time from a WebRTC stats report.
 * @param {Map|Array} statsEntries - Iterable of [key, report] pairs or report objects.
 * @returns {number|null} RTT in seconds, or null.
 */
function extractRTT(statsEntries) {
  let rtt = null;
  if (!statsEntries) return rtt;

  const iterate = (report) => {
    if (report.type === 'candidate-pair' && report.state === 'succeeded') {
      rtt = report.currentRoundTripTime;
    }
  };

  if (typeof statsEntries.forEach === 'function') {
    statsEntries.forEach(iterate);
  }
  return rtt;
}

// ============================================================
// Status helpers
// ============================================================

const STATUS_LABELS = {
  connecting: 'Connecting',
  connected: 'Connected',
  disconnected: 'Disconnected',
};

/**
 * Returns the display label for a connection status.
 * @param {string} status
 * @returns {string}
 */
function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}

/**
 * Maps an RTCPeerConnection.connectionState to our internal status.
 * @param {string} connectionState
 * @returns {'connecting'|'connected'|'disconnected'|null}
 */
function mapConnectionState(connectionState) {
  switch (connectionState) {
    case 'connecting':
      return 'connecting';
    case 'connected':
      return 'connected';
    case 'disconnected':
    case 'failed':
    case 'closed':
      return 'disconnected';
    default:
      return null;
  }
}

// ============================================================
// Chat message helpers
// ============================================================

/**
 * Creates a chat message DOM element.
 * @param {Document} doc - Document to create elements on.
 * @param {string} author - Display name.
 * @param {string} text - Message body.
 * @param {boolean} isSelf - Whether the current user sent it.
 * @returns {HTMLElement}
 */
function createChatMessageElement(doc, author, text, isSelf) {
  const el = doc.createElement('div');
  el.className = 'chat-msg ' + (isSelf ? 'own' : 'peer');

  const authorEl = doc.createElement('div');
  authorEl.className = 'msg-author';
  authorEl.textContent = isSelf ? 'You' : author;

  const bodyEl = doc.createElement('div');
  bodyEl.textContent = text;

  el.appendChild(authorEl);
  el.appendChild(bodyEl);
  return el;
}

/**
 * Creates a system message DOM element.
 * @param {Document} doc
 * @param {string} text
 * @returns {HTMLElement}
 */
function createSystemMessageElement(doc, text) {
  const el = doc.createElement('div');
  el.className = 'chat-msg system';
  el.textContent = text;
  return el;
}

/**
 * Validates whether a chat message should be sent.
 * @param {string} text - Raw input text.
 * @param {object|null} drone - ScaleDrone instance.
 * @returns {boolean}
 */
function shouldSendMessage(text, drone) {
  const trimmed = (text || '').trim();
  return trimmed.length > 0 && drone !== null && drone !== undefined;
}

/**
 * Builds the publish payload for a chat message.
 * @param {string} roomName
 * @param {string} userName
 * @param {string} text
 * @returns {object}
 */
function buildChatPayload(roomName, userName, text) {
  return {
    room: 'observable-' + roomName,
    message: {
      chatText: text.trim(),
      user: userName,
    },
  };
}

// ============================================================
// Media control helpers
// ============================================================

/**
 * Computes the new audio UI state after toggling.
 * @param {boolean} currentlyMuted
 * @returns {{ muted: boolean, icon: string, tooltip: string }}
 */
function toggleAudioState(currentlyMuted) {
  const muted = !currentlyMuted;
  return {
    muted,
    icon: muted ? '\u{1F509}' : '\u{1F509}',  // speaker icons
    iconHTML: muted ? '&#128263;' : '&#128265;',
    tooltip: muted ? 'Unmute' : 'Mute',
  };
}

/**
 * Computes the new video UI state after toggling.
 * @param {boolean} currentlyOff
 * @returns {{ off: boolean, icon: string, tooltip: string }}
 */
function toggleVideoState(currentlyOff) {
  const off = !currentlyOff;
  return {
    off,
    iconHTML: off ? '&#128683;' : '&#127909;',
    tooltip: off ? 'Start Video' : 'Stop Video',
  };
}

/**
 * Determines if the current client is the offerer based on member count.
 * In a 2-member room, the second joiner is the offerer.
 * @param {number} memberCount
 * @returns {boolean}
 */
function isOfferer(memberCount) {
  return memberCount === 2;
}

// ============================================================
// WebRTC config
// ============================================================

const DEFAULT_RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

/**
 * Creates a mock-friendly RTCPeerConnection configuration.
 * @param {object} [overrides]
 * @returns {object}
 */
function getRTCConfig(overrides) {
  return { ...DEFAULT_RTC_CONFIG, ...overrides };
}

// ============================================================
// Signal helpers
// ============================================================

/**
 * Builds a signaling publish payload for ScaleDrone.
 * @param {string} roomName
 * @param {object} message - SDP or ICE candidate data.
 * @returns {object}
 */
function buildSignalPayload(roomName, message) {
  return {
    room: 'observable-' + roomName,
    message,
  };
}

/**
 * Checks if a signaling message contains an SDP.
 * @param {object} message
 * @returns {boolean}
 */
function isSDPMessage(message) {
  return !!(message && message.sdp);
}

/**
 * Checks if a signaling message contains an ICE candidate.
 * @param {object} message
 * @returns {boolean}
 */
function isICEMessage(message) {
  return !!(message && message.candidate);
}

/**
 * Checks if a message is a chat message (vs signaling).
 * @param {object} data
 * @returns {boolean}
 */
function isChatMessage(data) {
  return !!(data && data.chatText !== undefined);
}

// ============================================================
// Toast helper
// ============================================================

/**
 * Default toast duration in milliseconds.
 */
const DEFAULT_TOAST_DURATION = 2500;

// ============================================================
// Exports
// ============================================================

module.exports = {
  // Room & URL
  parseRoomFromHash,
  buildRoomLink,
  normalizeRoomName,
  normalizeUserName,
  getChannelRoom,

  // Quality
  qualityLevel,
  extractRTT,

  // Status
  STATUS_LABELS,
  statusLabel,
  mapConnectionState,

  // Chat
  createChatMessageElement,
  createSystemMessageElement,
  shouldSendMessage,
  buildChatPayload,
  isChatMessage,

  // Media
  toggleAudioState,
  toggleVideoState,
  isOfferer,

  // WebRTC
  DEFAULT_RTC_CONFIG,
  getRTCConfig,
  buildSignalPayload,
  isSDPMessage,
  isICEMessage,

  // Toast
  DEFAULT_TOAST_DURATION,
};
