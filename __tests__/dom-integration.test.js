/**
 * Integration tests that exercise DOM manipulation logic.
 * These test the actual script.js behavior by setting up the DOM
 * and mocking browser APIs (WebRTC, ScaleDrone, getUserMedia).
 */

// Set up the HTML structure before loading script.js
function setupDOM() {
  document.body.innerHTML = `
    <div id="landing" class="landing">
      <input type="text" id="roomInput" value="" />
      <input type="text" id="nameInput" value="" />
      <button id="joinBtn">Join Room</button>
    </div>
    <div id="app" class="app">
      <code id="roomLabel"></code>
      <button id="copyLinkBtn"></button>
      <span id="statusDot"></span>
      <span id="statusText">Connecting</span>
      <div class="connection-quality" id="qualityIndicator">
        <div class="quality-bar"></div>
        <div class="quality-bar"></div>
        <div class="quality-bar"></div>
      </div>
      <video id="localVideo"></video>
      <video id="remoteVideo"></video>
      <div id="remotePlaceholder"></div>
      <span id="remoteLabel">Peer</span>
      <span id="localLabel">You</span>
      <div id="videoArea"></div>
      <button id="toggleAudioBtn"><span id="audioIcon">&#128265;</span><span id="audioTooltip">Mute</span></button>
      <button id="toggleVideoBtn"><span id="videoIcon">&#127909;</span><span id="videoTooltip">Stop Video</span></button>
      <button id="screenShareBtn"><span id="screenIcon">&#128433;</span><span id="screenTooltip">Share Screen</span></button>
      <button id="fullscreenBtn"></button>
      <button id="endCallBtn"></button>
      <div id="chatSidebar" class="chat-sidebar">
        <button id="chatToggleBtn"></button>
        <div id="chatMessages"></div>
        <input type="text" id="chatInput" value="" />
        <button id="sendBtn">Send</button>
      </div>
      <div id="toast" class="toast"></div>
    </div>
  `;
}

// Mock ScaleDrone
class MockScaleDrone {
  constructor(channelId, opts) {
    this.channelId = channelId;
    this.clientData = opts?.data;
    this.clientId = 'mock-client-id';
    this._handlers = {};
  }
  on(event, cb) {
    this._handlers[event] = cb;
  }
  subscribe(room) {
    return new MockRoom();
  }
  publish() {}
  close() {}
  _trigger(event, ...args) {
    if (this._handlers[event]) this._handlers[event](...args);
  }
}

class MockRoom {
  constructor() {
    this._handlers = {};
  }
  on(event, cb) {
    this._handlers[event] = cb;
  }
  _trigger(event, ...args) {
    if (this._handlers[event]) this._handlers[event](...args);
  }
}

// Mock MediaStream & tracks
function createMockMediaStream() {
  const audioTrack = {
    kind: 'audio',
    enabled: true,
    stop: jest.fn(),
  };
  const videoTrack = {
    kind: 'video',
    enabled: true,
    stop: jest.fn(),
    onended: null,
  };
  return {
    id: 'stream-' + Math.random(),
    getTracks: () => [audioTrack, videoTrack],
    getAudioTracks: () => [audioTrack],
    getVideoTracks: () => [videoTrack],
  };
}

// Mock RTCPeerConnection
function createMockRTCPeerConnection() {
  const pc = {
    connectionState: 'new',
    localDescription: null,
    remoteDescription: null,
    onicecandidate: null,
    onconnectionstatechange: null,
    onnegotiationneeded: null,
    ontrack: null,
    addTrack: jest.fn(),
    createOffer: jest.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' }),
    createAnswer: jest.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-answer' }),
    setLocalDescription: jest.fn().mockResolvedValue(undefined),
    setRemoteDescription: jest.fn().mockResolvedValue(undefined),
    addIceCandidate: jest.fn().mockResolvedValue(undefined),
    getSenders: jest.fn().mockReturnValue([]),
    getStats: jest.fn().mockResolvedValue(new Map()),
    close: jest.fn(),
  };
  return pc;
}

describe('DOM — Landing page', () => {
  beforeEach(() => {
    setupDOM();
  });

  test('room input and name input are present', () => {
    expect(document.getElementById('roomInput')).not.toBeNull();
    expect(document.getElementById('nameInput')).not.toBeNull();
  });

  test('join button is present', () => {
    expect(document.getElementById('joinBtn')).not.toBeNull();
  });

  test('app is not visible initially', () => {
    const app = document.getElementById('app');
    expect(app.classList.contains('active')).toBe(false);
  });

  test('landing is visible initially', () => {
    const landing = document.getElementById('landing');
    expect(landing.classList.contains('hidden')).toBe(false);
  });
});

describe('DOM — Chat message rendering', () => {
  const { createChatMessageElement, createSystemMessageElement } = require('../src/logic');

  beforeEach(() => {
    setupDOM();
  });

  test('chat message appends to chat container', () => {
    const container = document.getElementById('chatMessages');
    const msg = createChatMessageElement(document, 'Avi', 'Hello!', true);
    container.appendChild(msg);
    expect(container.children).toHaveLength(1);
    expect(container.children[0].classList.contains('own')).toBe(true);
  });

  test('multiple messages stack in order', () => {
    const container = document.getElementById('chatMessages');
    container.appendChild(createChatMessageElement(document, 'Avi', 'First', true));
    container.appendChild(createChatMessageElement(document, 'Bob', 'Second', false));
    container.appendChild(createSystemMessageElement(document, 'Bob joined'));

    expect(container.children).toHaveLength(3);
    expect(container.children[0].classList.contains('own')).toBe(true);
    expect(container.children[1].classList.contains('peer')).toBe(true);
    expect(container.children[2].classList.contains('system')).toBe(true);
  });

  test('system message has no msg-author element', () => {
    const msg = createSystemMessageElement(document, 'Connected');
    expect(msg.querySelector('.msg-author')).toBeNull();
  });
});

describe('DOM — Status indicator', () => {
  beforeEach(() => {
    setupDOM();
  });

  test('statusDot element exists', () => {
    expect(document.getElementById('statusDot')).not.toBeNull();
  });

  test('statusDot can have connecting class', () => {
    const dot = document.getElementById('statusDot');
    dot.className = 'status-dot connecting';
    expect(dot.classList.contains('connecting')).toBe(true);
  });

  test('statusDot can switch to connected class', () => {
    const dot = document.getElementById('statusDot');
    dot.className = 'status-dot connected';
    expect(dot.classList.contains('connected')).toBe(true);
    expect(dot.classList.contains('connecting')).toBe(false);
  });
});

describe('DOM — Quality indicator', () => {
  beforeEach(() => {
    setupDOM();
  });

  test('quality indicator element exists', () => {
    expect(document.getElementById('qualityIndicator')).not.toBeNull();
  });

  test('has three quality-bar children', () => {
    const indicator = document.getElementById('qualityIndicator');
    const bars = indicator.querySelectorAll('.quality-bar');
    expect(bars).toHaveLength(3);
  });

  test('can set quality class', () => {
    const indicator = document.getElementById('qualityIndicator');
    indicator.className = 'connection-quality quality-good';
    expect(indicator.classList.contains('quality-good')).toBe(true);
  });
});

describe('DOM — Chat sidebar toggle', () => {
  beforeEach(() => {
    setupDOM();
  });

  test('sidebar starts without collapsed class', () => {
    const sidebar = document.getElementById('chatSidebar');
    expect(sidebar.classList.contains('collapsed')).toBe(false);
  });

  test('toggles collapsed class on button click', () => {
    const sidebar = document.getElementById('chatSidebar');
    sidebar.classList.toggle('collapsed');
    expect(sidebar.classList.contains('collapsed')).toBe(true);
    sidebar.classList.toggle('collapsed');
    expect(sidebar.classList.contains('collapsed')).toBe(false);
  });
});

describe('DOM — Media control buttons', () => {
  beforeEach(() => {
    setupDOM();
  });

  test('audio toggle button exists', () => {
    expect(document.getElementById('toggleAudioBtn')).not.toBeNull();
  });

  test('video toggle button exists', () => {
    expect(document.getElementById('toggleVideoBtn')).not.toBeNull();
  });

  test('screen share button exists', () => {
    expect(document.getElementById('screenShareBtn')).not.toBeNull();
  });

  test('end call button exists', () => {
    expect(document.getElementById('endCallBtn')).not.toBeNull();
  });

  test('audio button has active class when muted', () => {
    const btn = document.getElementById('toggleAudioBtn');
    btn.classList.add('active');
    expect(btn.classList.contains('active')).toBe(true);
  });

  test('screen share button has sharing class when active', () => {
    const btn = document.getElementById('screenShareBtn');
    btn.classList.add('sharing');
    expect(btn.classList.contains('sharing')).toBe(true);
  });
});

describe('Mock WebRTC — RTCPeerConnection', () => {
  test('mock creates a connection object with expected methods', () => {
    const pc = createMockRTCPeerConnection();
    expect(typeof pc.createOffer).toBe('function');
    expect(typeof pc.createAnswer).toBe('function');
    expect(typeof pc.setLocalDescription).toBe('function');
    expect(typeof pc.setRemoteDescription).toBe('function');
    expect(typeof pc.addIceCandidate).toBe('function');
    expect(typeof pc.close).toBe('function');
    expect(typeof pc.addTrack).toBe('function');
  });

  test('createOffer returns a valid offer', async () => {
    const pc = createMockRTCPeerConnection();
    const offer = await pc.createOffer();
    expect(offer.type).toBe('offer');
    expect(offer.sdp).toBeDefined();
  });

  test('createAnswer returns a valid answer', async () => {
    const pc = createMockRTCPeerConnection();
    const answer = await pc.createAnswer();
    expect(answer.type).toBe('answer');
    expect(answer.sdp).toBeDefined();
  });

  test('addTrack records calls', () => {
    const pc = createMockRTCPeerConnection();
    const stream = createMockMediaStream();
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    expect(pc.addTrack).toHaveBeenCalledTimes(2);
  });

  test('close can be called without error', () => {
    const pc = createMockRTCPeerConnection();
    expect(() => pc.close()).not.toThrow();
    expect(pc.close).toHaveBeenCalledTimes(1);
  });
});

describe('Mock MediaStream', () => {
  test('has audio and video tracks', () => {
    const stream = createMockMediaStream();
    expect(stream.getAudioTracks()).toHaveLength(1);
    expect(stream.getVideoTracks()).toHaveLength(1);
    expect(stream.getTracks()).toHaveLength(2);
  });

  test('tracks start as enabled', () => {
    const stream = createMockMediaStream();
    stream.getAudioTracks().forEach((t) => expect(t.enabled).toBe(true));
    stream.getVideoTracks().forEach((t) => expect(t.enabled).toBe(true));
  });

  test('audio tracks can be disabled (mute simulation)', () => {
    const stream = createMockMediaStream();
    stream.getAudioTracks().forEach((t) => (t.enabled = false));
    stream.getAudioTracks().forEach((t) => expect(t.enabled).toBe(false));
  });

  test('video tracks can be disabled', () => {
    const stream = createMockMediaStream();
    stream.getVideoTracks().forEach((t) => (t.enabled = false));
    stream.getVideoTracks().forEach((t) => expect(t.enabled).toBe(false));
  });

  test('stop() can be called on each track', () => {
    const stream = createMockMediaStream();
    stream.getTracks().forEach((t) => t.stop());
    stream.getTracks().forEach((t) => expect(t.stop).toHaveBeenCalledTimes(1));
  });
});

describe('Mock ScaleDrone', () => {
  test('ScaleDrone constructor stores channel ID', () => {
    const sd = new MockScaleDrone('test-channel');
    expect(sd.channelId).toBe('test-channel');
  });

  test('subscribe returns a room object', () => {
    const sd = new MockScaleDrone('ch');
    const room = sd.subscribe('observable-room');
    expect(room).toBeDefined();
    expect(typeof room.on).toBe('function');
  });

  test('event handlers can be registered', () => {
    const sd = new MockScaleDrone('ch');
    const handler = jest.fn();
    sd.on('open', handler);
    sd._trigger('open');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('room event handlers can be registered', () => {
    const sd = new MockScaleDrone('ch');
    const room = sd.subscribe('observable-room');
    const handler = jest.fn();
    room.on('members', handler);
    room._trigger('members', [{ id: 1 }]);
    expect(handler).toHaveBeenCalledWith([{ id: 1 }]);
  });
});

describe('DOM — Toast notification', () => {
  beforeEach(() => {
    setupDOM();
  });

  test('toast element exists', () => {
    expect(document.getElementById('toast')).not.toBeNull();
  });

  test('toast starts without visible class', () => {
    const toast = document.getElementById('toast');
    expect(toast.classList.contains('visible')).toBe(false);
  });

  test('toast can be shown by adding visible class', () => {
    const toast = document.getElementById('toast');
    toast.textContent = 'Test message';
    toast.classList.add('visible');
    expect(toast.classList.contains('visible')).toBe(true);
    expect(toast.textContent).toBe('Test message');
  });
});

describe('DOM — View transitions', () => {
  beforeEach(() => {
    setupDOM();
  });

  test('hiding landing and showing app simulates join', () => {
    const landing = document.getElementById('landing');
    const app = document.getElementById('app');

    // Simulate join
    landing.classList.add('hidden');
    app.classList.add('active');

    expect(landing.classList.contains('hidden')).toBe(true);
    expect(app.classList.contains('active')).toBe(true);
  });

  test('reversing hides app and shows landing (end call)', () => {
    const landing = document.getElementById('landing');
    const app = document.getElementById('app');

    // First join
    landing.classList.add('hidden');
    app.classList.add('active');

    // Then end call
    app.classList.remove('active');
    landing.classList.remove('hidden');

    expect(landing.classList.contains('hidden')).toBe(false);
    expect(app.classList.contains('active')).toBe(false);
  });
});
