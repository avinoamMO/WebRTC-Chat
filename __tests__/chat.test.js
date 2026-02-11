/**
 * Tests for chat message logic (DOM creation, validation, payloads).
 */
const {
  createChatMessageElement,
  createSystemMessageElement,
  shouldSendMessage,
  buildChatPayload,
  isChatMessage,
} = require('../src/logic');

describe('createChatMessageElement', () => {
  test('creates an own message with correct classes', () => {
    const el = createChatMessageElement(document, 'Avi', 'Hello', true);
    expect(el.className).toBe('chat-msg own');
  });

  test('creates a peer message with correct classes', () => {
    const el = createChatMessageElement(document, 'Bob', 'Hi', false);
    expect(el.className).toBe('chat-msg peer');
  });

  test('shows "You" as author for own messages', () => {
    const el = createChatMessageElement(document, 'Avi', 'Hello', true);
    const authorEl = el.querySelector('.msg-author');
    expect(authorEl.textContent).toBe('You');
  });

  test('shows actual name as author for peer messages', () => {
    const el = createChatMessageElement(document, 'Bob', 'Hi', false);
    const authorEl = el.querySelector('.msg-author');
    expect(authorEl.textContent).toBe('Bob');
  });

  test('sets the message body text correctly', () => {
    const el = createChatMessageElement(document, 'Avi', 'Test message', true);
    // The body is the second child (after .msg-author)
    const bodyEl = el.children[1];
    expect(bodyEl.textContent).toBe('Test message');
  });

  test('escapes HTML in message text (textContent, not innerHTML)', () => {
    const el = createChatMessageElement(document, 'Avi', '<script>alert(1)</script>', true);
    const bodyEl = el.children[1];
    expect(bodyEl.textContent).toBe('<script>alert(1)</script>');
    expect(bodyEl.innerHTML).not.toContain('<script>');
  });

  test('has exactly two child elements', () => {
    const el = createChatMessageElement(document, 'Avi', 'msg', true);
    expect(el.children).toHaveLength(2);
  });
});

describe('createSystemMessageElement', () => {
  test('creates an element with system class', () => {
    const el = createSystemMessageElement(document, 'User joined');
    expect(el.className).toBe('chat-msg system');
  });

  test('sets the text content', () => {
    const el = createSystemMessageElement(document, 'Connected to room: test');
    expect(el.textContent).toBe('Connected to room: test');
  });

  test('escapes HTML in system messages', () => {
    const el = createSystemMessageElement(document, '<b>bold</b>');
    expect(el.textContent).toBe('<b>bold</b>');
    expect(el.innerHTML).not.toContain('<b>');
  });
});

describe('shouldSendMessage', () => {
  test('returns false for empty text', () => {
    expect(shouldSendMessage('', {})).toBe(false);
    expect(shouldSendMessage('   ', {})).toBe(false);
  });

  test('returns false for null text', () => {
    expect(shouldSendMessage(null, {})).toBe(false);
  });

  test('returns false for undefined text', () => {
    expect(shouldSendMessage(undefined, {})).toBe(false);
  });

  test('returns false when drone is null', () => {
    expect(shouldSendMessage('hello', null)).toBe(false);
  });

  test('returns false when drone is undefined', () => {
    expect(shouldSendMessage('hello', undefined)).toBe(false);
  });

  test('returns true for valid text and drone', () => {
    expect(shouldSendMessage('hello', { publish: jest.fn() })).toBe(true);
  });

  test('returns true for whitespace-padded valid text', () => {
    expect(shouldSendMessage('  hello  ', {})).toBe(true);
  });
});

describe('buildChatPayload', () => {
  test('builds correct payload structure', () => {
    const payload = buildChatPayload('room1', 'Avi', 'Hello!');
    expect(payload).toEqual({
      room: 'observable-room1',
      message: {
        chatText: 'Hello!',
        user: 'Avi',
      },
    });
  });

  test('trims message text', () => {
    const payload = buildChatPayload('room1', 'Avi', '  Hello!  ');
    expect(payload.message.chatText).toBe('Hello!');
  });

  test('preserves room name as-is', () => {
    const payload = buildChatPayload('test-room', 'Bob', 'msg');
    expect(payload.room).toBe('observable-test-room');
  });
});

describe('isChatMessage', () => {
  test('returns true for data with chatText', () => {
    expect(isChatMessage({ chatText: 'hello', user: 'Avi' })).toBe(true);
  });

  test('returns true for empty chatText (still valid)', () => {
    expect(isChatMessage({ chatText: '', user: 'Avi' })).toBe(true);
  });

  test('returns false for signaling data (SDP)', () => {
    expect(isChatMessage({ sdp: {} })).toBe(false);
  });

  test('returns false for signaling data (ICE candidate)', () => {
    expect(isChatMessage({ candidate: {} })).toBe(false);
  });

  test('returns false for null', () => {
    expect(isChatMessage(null)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isChatMessage(undefined)).toBe(false);
  });
});
