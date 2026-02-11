# WebRTC Chat

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![WebRTC](https://img.shields.io/badge/WebRTC-P2P-brightgreen)
![Vanilla JS](https://img.shields.io/badge/JavaScript-Vanilla-yellow)
![No Backend](https://img.shields.io/badge/Backend-None-lightgrey)

Peer-to-peer video, audio, and text chat running entirely in the browser. No backend server handles your media -- WebRTC sends it directly between peers. ScaleDrone provides the signaling layer so peers can find each other.

**[Live Demo](https://avinoammo.github.io/WebRTC-Chat/)**

---

## Screenshots

<!-- Replace with actual screenshots after deploying the updated version -->
| Landing Page | In-Call View |
|:---:|:---:|
| ![Landing](assets/scrnsht-landing.png) | ![Call](assets/scrnsht-call.png) |

---

## Features

- **Video & Audio** -- Camera and microphone captured via `getUserMedia`
- **Text Chat** -- Real-time messaging alongside video, rendered as styled bubbles
- **Screen Sharing** -- Share your screen with `getDisplayMedia`, one click to toggle
- **Media Controls** -- Mute audio, disable video, leave call
- **Fullscreen** -- Expand the video area to fill the screen
- **Connection Status** -- Live indicator (connecting / connected / disconnected)
- **Connection Quality** -- RTT-based quality bars via `RTCPeerConnection.getStats()`
- **Shareable Rooms** -- Room name stored in the URL hash; copy link to invite peers
- **Dark Theme** -- Modern UI with CSS custom properties, responsive down to mobile
- **Zero Dependencies** -- Vanilla JS, no build step, no framework

---

## How It Works

WebRTC enables direct peer-to-peer media transport, but peers need a way to exchange connection metadata (offers, answers, ICE candidates) before the direct link is established. This exchange is called **signaling**.

```
 ┌──────────┐                                      ┌──────────┐
 │  Peer A  │                                      │  Peer B  │
 │ (Browser)│                                      │ (Browser)│
 └────┬─────┘                                      └────┬─────┘
      │                                                  │
      │  1. getUserMedia()                               │
      │     (capture camera + mic)                       │
      │                                                  │
      │  2. new RTCPeerConnection()                      │
      │                                                  │
      │  3. createOffer() ─────┐                         │
      │                        │ SDP Offer               │
      │                        ▼                         │
      │              ┌──────────────────┐                │
      │              │    ScaleDrone     │                │
      │              │  (Signaling Hub)  │                │
      │              └──────────────────┘                │
      │                        │                         │
      │                        │ SDP Offer               │
      │                        └────────────────────►    │
      │                                                  │
      │                              setRemoteDescription│
      │                              createAnswer()      │
      │                                                  │
      │              ┌──────────────────┐                │
      │              │    ScaleDrone     │◄───────────────│
      │              │  (Signaling Hub)  │  SDP Answer    │
      │              └──────────────────┘                │
      │                        │                         │
      │  SDP Answer            │                         │
      │◄───────────────────────┘                         │
      │                                                  │
      │  4. ICE candidates exchanged (same path)         │
      │◄────────────────────────────────────────────────►│
      │                                                  │
      │  5. Direct P2P media stream established          │
      │◄═══════════════════════════════════════════════►│
      │     (video + audio, no server in the middle)     │
      │                                                  │
```

**Key concepts:**

| Term | What it does |
|------|-------------|
| **SDP** (Session Description Protocol) | Describes media capabilities (codecs, resolution, etc.) |
| **ICE** (Interactive Connectivity Establishment) | Finds the best network path between peers |
| **STUN** server | Helps peers discover their public IP addresses |
| **Signaling** | The metadata exchange before the direct connection -- handled by ScaleDrone |

Once the P2P connection is established, **all media flows directly between browsers**. ScaleDrone is only used for the initial handshake and chat messages.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Media Transport | WebRTC (`RTCPeerConnection`, `getUserMedia`, `getDisplayMedia`) |
| Signaling | [ScaleDrone](https://www.scaledrone.com/) (WebSocket-based pub/sub) |
| Frontend | Vanilla JavaScript (ES2020+), HTML5, CSS3 |
| Hosting | GitHub Pages |

---

## Getting Started

### Run locally

```bash
# Clone
git clone https://github.com/avinoamMO/WebRTC-Chat.git
cd WebRTC-Chat

# Serve (any static server works)
npx serve .
# or
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser. Enter a room name and your display name, then open the same URL in a second browser tab (or on another device) and join the same room.

### Deploy to GitHub Pages

The repo is already configured for GitHub Pages. Push to `master` and enable Pages in Settings > Pages > Source: Deploy from branch (`master`, root `/`).

---

## Project Structure

```
WebRTC-Chat/
├── index.html       # Landing page + app shell
├── script.js        # WebRTC logic, signaling, media controls, chat
├── style.css        # Dark theme, responsive layout
├── assets/          # Screenshots
├── docs/
│   └── gtm.md       # Go-to-market notes
└── README.md
```

---

## Limitations

- **2-person rooms only** -- WebRTC mesh topology; for group calls you would need an SFU
- **STUN only** -- No TURN server configured; connections behind symmetric NATs may fail
- **ScaleDrone free tier** -- Rate-limited; fine for demos, not production traffic
- **No persistence** -- Chat history is lost on reload

---

## Contributing

Contributions are welcome. Fork the repo, create a branch, and open a PR.

Areas that could use help:
- TURN server integration for better NAT traversal
- Data channel for chat (currently routed through ScaleDrone)
- Multi-party support via an SFU
- Recording / download of calls

---

## License

MIT
