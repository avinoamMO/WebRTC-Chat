/**
 * WebRTC Chat — Peer-to-peer video, audio & text chat.
 *
 * Uses WebRTC for media transport and ScaleDrone as the signaling channel.
 * Modernized from the original 2019 codebase:
 *   - async/await instead of callback-based RTCPeerConnection APIs
 *   - proper connection-state management
 *   - screen sharing, media controls, fullscreen
 *   - chat rendered as styled message bubbles
 *
 * References:
 *   https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection
 *   https://www.scaledrone.com/docs/api-clients/javascript
 */

// ============================================================
// DOM References
// ============================================================
const dom = {
  // Landing
  landing:        document.getElementById('landing'),
  roomInput:      document.getElementById('roomInput'),
  nameInput:      document.getElementById('nameInput'),
  joinBtn:        document.getElementById('joinBtn'),

  // App shell
  app:            document.getElementById('app'),
  roomLabel:      document.getElementById('roomLabel'),
  copyLinkBtn:    document.getElementById('copyLinkBtn'),
  statusDot:      document.getElementById('statusDot'),
  statusText:     document.getElementById('statusText'),
  qualityIndicator: document.getElementById('qualityIndicator'),

  // Video
  localVideo:     document.getElementById('localVideo'),
  remoteVideo:    document.getElementById('remoteVideo'),
  remotePlaceholder: document.getElementById('remotePlaceholder'),
  remoteLabel:    document.getElementById('remoteLabel'),
  localLabel:     document.getElementById('localLabel'),
  videoArea:      document.getElementById('videoArea'),

  // Media controls
  toggleAudioBtn: document.getElementById('toggleAudioBtn'),
  toggleVideoBtn: document.getElementById('toggleVideoBtn'),
  screenShareBtn: document.getElementById('screenShareBtn'),
  fullscreenBtn:  document.getElementById('fullscreenBtn'),
  endCallBtn:     document.getElementById('endCallBtn'),
  audioIcon:      document.getElementById('audioIcon'),
  videoIcon:      document.getElementById('videoIcon'),
  screenIcon:     document.getElementById('screenIcon'),
  audioTooltip:   document.getElementById('audioTooltip'),
  videoTooltip:   document.getElementById('videoTooltip'),
  screenTooltip:  document.getElementById('screenTooltip'),

  // Chat
  chatSidebar:    document.getElementById('chatSidebar'),
  chatToggleBtn:  document.getElementById('chatToggleBtn'),
  chatMessages:   document.getElementById('chatMessages'),
  chatInput:      document.getElementById('chatInput'),
  sendBtn:        document.getElementById('sendBtn'),

  // Toast
  toast:          document.getElementById('toast'),
};

// ============================================================
// State
// ============================================================

/** @type {string} */
let userName = '';

/** @type {string} Room name without the 'observable-' prefix */
let roomName = '';

/** @type {ScaleDrone|null} */
let drone = null;

/** @type {object|null} ScaleDrone room subscription */
let room = null;

/** @type {RTCPeerConnection|null} */
let peerConnection = null;

/** @type {MediaStream|null} Local camera/mic stream */
let localStream = null;

/** @type {MediaStream|null} Screen-share stream */
let screenStream = null;

/** @type {boolean} */
let audioMuted = false;

/** @type {boolean} */
let videoOff = false;

/** @type {boolean} */
let isScreenSharing = false;

/** @type {boolean} */
let isFullscreen = false;

/** @type {number|null} Connection quality polling interval */
let qualityInterval = null;

/** WebRTC configuration with public STUN server */
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// ============================================================
// Initialization — Landing Page
// ============================================================

/**
 * Pre-fill room name from URL hash (enables shareable room links).
 * e.g. https://avinoammo.github.io/WebRTC-Chat/#my-room
 */
function initFromURL() {
  const hash = window.location.hash.slice(1);
  if (hash) {
    dom.roomInput.value = decodeURIComponent(hash);
  }
}

initFromURL();

// Join button & enter-key handlers
dom.joinBtn.addEventListener('click', handleJoin);
dom.roomInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleJoin(); });
dom.nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleJoin(); });

/**
 * Validates inputs and transitions from landing to the call view.
 */
function handleJoin() {
  roomName = dom.roomInput.value.trim() || 'default-room';
  userName = dom.nameInput.value.trim() || 'Anonymous';

  // Update URL hash so the link is shareable
  window.location.hash = encodeURIComponent(roomName);

  // Switch views
  dom.landing.classList.add('hidden');
  dom.app.classList.add('active');

  dom.roomLabel.textContent = roomName;
  dom.localLabel.textContent = userName;

  connectToSignaling();
}

// ============================================================
// Signaling — ScaleDrone
// ============================================================

/**
 * Opens a ScaleDrone connection and subscribes to the room.
 * ScaleDrone observable rooms require the 'observable-' prefix.
 */
function connectToSignaling() {
  setStatus('connecting');

  const channelRoom = 'observable-' + roomName;

  drone = new ScaleDrone('yiS12Ts5RdNhebyM', {
    data: { name: userName },
  });

  drone.on('error', (error) => {
    console.error('[ScaleDrone] Error:', error);
    setStatus('disconnected');
  });

  drone.on('close', () => {
    console.warn('[ScaleDrone] Connection closed');
    setStatus('disconnected');
  });

  drone.on('reconnect', () => {
    console.log('[ScaleDrone] Reconnected');
  });

  drone.on('open', (error) => {
    if (error) {
      console.error('[ScaleDrone] Open error:', error);
      setStatus('disconnected');
      return;
    }

    room = drone.subscribe(channelRoom);

    room.on('open', (error) => {
      if (error) {
        console.error('[ScaleDrone] Room open error:', error);
        setStatus('disconnected');
        return;
      }
      addSystemMessage('Connected to room: ' + roomName);
    });

    room.on('members', (members) => {
      console.log('[Room] Members:', members.length);
      // If we are the second participant, we are the offerer
      const isOfferer = members.length === 2;
      startWebRTC(isOfferer);
    });

    room.on('member_join', (member) => {
      const name = member.clientData?.name || 'Someone';
      addSystemMessage(name + ' joined the room');
    });

    room.on('member_leave', (member) => {
      const name = member.clientData?.name || 'Someone';
      addSystemMessage(name + ' left the room');
      dom.remotePlaceholder.classList.remove('hidden');
      setStatus('connecting');
      stopQualityMonitor();
    });

    // Chat messages arrive through the room's message event
    room.on('message', (message) => {
      if (message.data?.chatText !== undefined) {
        const isSelf = message.clientId === drone.clientId;
        addChatMessage(message.data.user, message.data.chatText, isSelf);
      }
    });
  });
}

// ============================================================
// WebRTC
// ============================================================

/**
 * Initializes the RTCPeerConnection, captures local media, and wires
 * up the signaling data channel.
 *
 * @param {boolean} isOfferer - True if this client should create the offer.
 */
async function startWebRTC(isOfferer) {
  peerConnection = new RTCPeerConnection(rtcConfig);

  // ---- ICE candidates ----
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      sendSignal({ candidate: event.candidate });
    }
  };

  // ---- Connection state ----
  peerConnection.onconnectionstatechange = () => {
    const state = peerConnection.connectionState;
    console.log('[WebRTC] Connection state:', state);
    switch (state) {
      case 'connecting':
        setStatus('connecting');
        break;
      case 'connected':
        setStatus('connected');
        startQualityMonitor();
        break;
      case 'disconnected':
      case 'failed':
      case 'closed':
        setStatus('disconnected');
        stopQualityMonitor();
        break;
    }
  };

  // ---- Negotiation (offerer only) ----
  if (isOfferer) {
    peerConnection.onnegotiationneeded = async () => {
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        sendSignal({ sdp: peerConnection.localDescription });
      } catch (err) {
        console.error('[WebRTC] Offer creation failed:', err);
      }
    };
  }

  // ---- Remote track ----
  peerConnection.ontrack = (event) => {
    const stream = event.streams[0];
    if (!dom.remoteVideo.srcObject || dom.remoteVideo.srcObject.id !== stream.id) {
      dom.remoteVideo.srcObject = stream;
      dom.remotePlaceholder.classList.add('hidden');
    }
  };

  // ---- Local media ----
  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    dom.localVideo.srcObject = localStream;
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });
  } catch (err) {
    console.error('[Media] getUserMedia failed:', err);
    showToast('Camera/mic access denied');
  }

  // ---- Listen for signaling data from ScaleDrone ----
  room.on('data', async (message, client) => {
    if (client.id === drone.clientId) return; // ignore own messages

    try {
      if (message.sdp) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(message.sdp));
        if (peerConnection.remoteDescription.type === 'offer') {
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          sendSignal({ sdp: peerConnection.localDescription });
        }
      } else if (message.candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
      }
    } catch (err) {
      console.error('[WebRTC] Signaling error:', err);
    }
  });
}

/**
 * Publishes a signaling message through ScaleDrone.
 * @param {object} message - SDP or ICE candidate data.
 */
function sendSignal(message) {
  drone.publish({
    room: 'observable-' + roomName,
    message,
  });
}

// ============================================================
// Media Controls
// ============================================================

dom.toggleAudioBtn.addEventListener('click', toggleAudio);
dom.toggleVideoBtn.addEventListener('click', toggleVideo);
dom.screenShareBtn.addEventListener('click', toggleScreenShare);
dom.fullscreenBtn.addEventListener('click', toggleFullscreen);
dom.endCallBtn.addEventListener('click', endCall);

/** Toggle microphone mute state. */
function toggleAudio() {
  if (!localStream) return;
  audioMuted = !audioMuted;
  localStream.getAudioTracks().forEach((t) => (t.enabled = !audioMuted));

  dom.toggleAudioBtn.classList.toggle('active', audioMuted);
  dom.audioIcon.innerHTML = audioMuted ? '&#128263;' : '&#128265;';
  dom.audioTooltip.textContent = audioMuted ? 'Unmute' : 'Mute';
}

/** Toggle camera on/off. */
function toggleVideo() {
  if (!localStream) return;
  videoOff = !videoOff;
  localStream.getVideoTracks().forEach((t) => (t.enabled = !videoOff));

  dom.toggleVideoBtn.classList.toggle('active', videoOff);
  dom.videoIcon.innerHTML = videoOff ? '&#128683;' : '&#127909;';
  dom.videoTooltip.textContent = videoOff ? 'Start Video' : 'Stop Video';
}

/**
 * Toggles screen sharing. Replaces the video track sent to the remote
 * peer with the screen capture stream, then restores the camera when
 * sharing stops.
 */
async function toggleScreenShare() {
  if (!peerConnection) return;

  if (!isScreenSharing) {
    try {
      screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = peerConnection.getSenders().find((s) => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(screenTrack);
      }

      // When the user stops sharing via the browser's native control
      screenTrack.onended = () => stopScreenShare();

      isScreenSharing = true;
      dom.screenShareBtn.classList.add('sharing');
      dom.screenTooltip.textContent = 'Stop Sharing';
      showToast('Screen sharing started');
    } catch (err) {
      console.error('[ScreenShare] Error:', err);
      showToast('Screen share cancelled');
    }
  } else {
    stopScreenShare();
  }
}

/**
 * Restores the camera track after screen sharing ends.
 */
async function stopScreenShare() {
  if (screenStream) {
    screenStream.getTracks().forEach((t) => t.stop());
    screenStream = null;
  }

  if (localStream && peerConnection) {
    const cameraTrack = localStream.getVideoTracks()[0];
    const sender = peerConnection.getSenders().find((s) => s.track?.kind === 'video');
    if (sender && cameraTrack) {
      await sender.replaceTrack(cameraTrack);
    }
  }

  isScreenSharing = false;
  dom.screenShareBtn.classList.remove('sharing');
  dom.screenTooltip.textContent = 'Share Screen';
}

/** Toggle fullscreen on the video area. */
function toggleFullscreen() {
  const el = dom.videoArea;
  if (!document.fullscreenElement) {
    el.requestFullscreen().catch((err) => {
      console.error('[Fullscreen] Error:', err);
    });
  } else {
    document.exitFullscreen();
  }
}

document.addEventListener('fullscreenchange', () => {
  isFullscreen = !!document.fullscreenElement;
  dom.videoArea.classList.toggle('fullscreen', isFullscreen);
});

/** Leave the call and return to the landing page. */
function endCall() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }
  if (screenStream) {
    screenStream.getTracks().forEach((t) => t.stop());
    screenStream = null;
  }
  if (drone) {
    drone.close();
    drone = null;
  }
  stopQualityMonitor();

  // Reset UI
  dom.app.classList.remove('active');
  dom.landing.classList.remove('hidden');
  dom.remoteVideo.srcObject = null;
  dom.localVideo.srcObject = null;
  dom.remotePlaceholder.classList.remove('hidden');
  dom.chatMessages.innerHTML = '';
  setStatus('connecting');
  window.location.hash = '';
}

// ============================================================
// Chat
// ============================================================

dom.sendBtn.addEventListener('click', sendChatMessage);
dom.chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendChatMessage();
});
dom.chatToggleBtn.addEventListener('click', () => {
  dom.chatSidebar.classList.toggle('collapsed');
});

/** Sends a text chat message via ScaleDrone. */
function sendChatMessage() {
  const text = dom.chatInput.value.trim();
  if (!text || !drone) return;

  drone.publish({
    room: 'observable-' + roomName,
    message: {
      chatText: text,
      user: userName,
    },
  });

  dom.chatInput.value = '';
  dom.chatInput.focus();
}

/**
 * Appends a styled chat message bubble to the chat panel.
 *
 * @param {string} author   - Display name of the sender.
 * @param {string} text     - Message body.
 * @param {boolean} isSelf  - True if the current user sent the message.
 */
function addChatMessage(author, text, isSelf) {
  const el = document.createElement('div');
  el.className = 'chat-msg ' + (isSelf ? 'own' : 'peer');

  const authorEl = document.createElement('div');
  authorEl.className = 'msg-author';
  authorEl.textContent = isSelf ? 'You' : author;

  const bodyEl = document.createElement('div');
  bodyEl.textContent = text;

  el.appendChild(authorEl);
  el.appendChild(bodyEl);
  dom.chatMessages.appendChild(el);
  dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
}

/**
 * Appends a system/notification message (join, leave, etc.).
 * @param {string} text
 */
function addSystemMessage(text) {
  const el = document.createElement('div');
  el.className = 'chat-msg system';
  el.textContent = text;
  dom.chatMessages.appendChild(el);
  dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
}

// ============================================================
// Connection Status & Quality
// ============================================================

/**
 * Updates the connection status indicator.
 * @param {'connecting'|'connected'|'disconnected'} status
 */
function setStatus(status) {
  dom.statusDot.className = 'status-dot ' + status;
  const labels = { connecting: 'Connecting', connected: 'Connected', disconnected: 'Disconnected' };
  dom.statusText.textContent = labels[status] || status;
}

/**
 * Begins polling WebRTC stats to display a connection quality indicator.
 * Uses RTCPeerConnection.getStats() to measure round-trip time.
 */
function startQualityMonitor() {
  stopQualityMonitor();
  qualityInterval = setInterval(async () => {
    if (!peerConnection) return;
    try {
      const stats = await peerConnection.getStats();
      let rtt = null;
      stats.forEach((report) => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          rtt = report.currentRoundTripTime;
        }
      });
      updateQualityUI(rtt);
    } catch (err) {
      // Stats not available; ignore
    }
  }, 3000);
}

/** Stops the quality monitoring interval. */
function stopQualityMonitor() {
  if (qualityInterval) {
    clearInterval(qualityInterval);
    qualityInterval = null;
  }
  dom.qualityIndicator.className = 'connection-quality';
}

/**
 * Sets the visual quality indicator based on round-trip time.
 * @param {number|null} rtt - Round-trip time in seconds.
 */
function updateQualityUI(rtt) {
  let level = '';
  if (rtt === null) {
    level = '';
  } else if (rtt < 0.15) {
    level = 'quality-good';
  } else if (rtt < 0.4) {
    level = 'quality-fair';
  } else {
    level = 'quality-poor';
  }
  dom.qualityIndicator.className = 'connection-quality ' + level;
}

// ============================================================
// Utilities
// ============================================================

// Copy room link to clipboard
dom.copyLinkBtn.addEventListener('click', () => {
  const url = window.location.origin + window.location.pathname + '#' + encodeURIComponent(roomName);
  navigator.clipboard.writeText(url).then(() => {
    showToast('Room link copied to clipboard');
  }).catch(() => {
    showToast('Could not copy link');
  });
});

/**
 * Shows a transient toast notification at the bottom of the screen.
 * @param {string} message
 * @param {number} [duration=2500] - How long to display in ms.
 */
function showToast(message, duration = 2500) {
  dom.toast.textContent = message;
  dom.toast.classList.add('visible');
  setTimeout(() => {
    dom.toast.classList.remove('visible');
  }, duration);
}
