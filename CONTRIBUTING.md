# Contributing to WebRTC Chat

Thanks for your interest in contributing. This guide covers how to set up the project, make changes, and submit a pull request.

## Development Setup

### Prerequisites

- A modern browser with WebRTC support (Chrome, Firefox, Safari, Edge)
- Any static file server for local development
- A [ScaleDrone](https://www.scaledrone.com/) account (free tier works for development)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/avinoamMO/WebRTC-Chat.git
cd WebRTC-Chat

# Serve locally (pick any method)
npx serve .
# or
python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser. To test a call, open the same URL in a second browser tab and join the same room name.

### Testing Changes

This project has no build step and no automated test suite. It is vanilla HTML/CSS/JS served as static files.

To test your changes:

1. Open the app in two separate browser tabs (or two different browsers)
2. Join the same room name in both tabs
3. Verify video/audio connects between peers
4. Test your specific change (e.g., screen sharing, chat messages, media controls)
5. Check the browser console for errors (DevTools > Console)
6. Test on mobile if your change affects responsive layout

### Debugging Tips

- Open Chrome DevTools > `chrome://webrtc-internals/` to inspect WebRTC stats
- Check `RTCPeerConnection.getStats()` output in the console
- ScaleDrone connection issues show up as errors in the Console tab
- ICE candidate failures indicate NAT traversal problems (expected without TURN)

## Project Structure

```
WebRTC-Chat/
  index.html     # Landing page and app shell
  script.js      # WebRTC logic, signaling, media controls, chat
  style.css      # Dark theme, responsive layout, CSS custom properties
  assets/        # Screenshots for README
  docs/
    gtm.md       # Go-to-market notes
```

All application logic lives in `script.js`. There is no module system, bundler, or framework.

## Code Style

- **Vanilla JavaScript** -- no frameworks, no build tools, no transpilation
- **ES2020+** features are fine (async/await, optional chaining, nullish coalescing)
- **CSS custom properties** for theming -- add new colors to the `:root` block in `style.css`
- **Semantic HTML** -- use appropriate elements (`<button>`, `<input>`, `<section>`)
- Keep it dependency-free -- the zero-dependency approach is intentional
- Use descriptive variable and function names
- Add comments for non-obvious WebRTC behavior (ICE, SDP, negotiation edge cases)

## Making Changes

### Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test manually in at least two browser tabs (see Testing Changes above)
5. Verify no console errors in DevTools
6. Commit with a clear message: `git commit -m "Add screen recording support"`
7. Push and open a pull request

### Commit Messages

Use clear, descriptive messages:

- `Add: data channel for direct peer chat`
- `Fix: ICE restart on connection failure`
- `Update: improve mobile layout for chat panel`
- `Docs: add TURN server setup instructions`

## Areas Where Help Is Welcome

### High Priority
- **TURN server integration** -- Config for Twilio or Metered TURN to improve NAT traversal
- **Data channel chat** -- Move text chat from ScaleDrone to RTCDataChannel for true P2P messaging
- **Multi-party support** -- SFU integration for group calls (3+ participants)

### Medium Priority
- **Call recording** -- Record and download calls using MediaRecorder API
- **Noise suppression** -- Web Audio API noise gate or integration with RNNoise
- **Bandwidth adaptation** -- Adjust video quality based on connection stats

### Nice to Have
- **File sharing** -- Send files over RTCDataChannel
- **Virtual backgrounds** -- Canvas-based background replacement
- **Emoji reactions** -- Lightweight reaction overlays during calls

## Reporting Bugs

Open an issue with:

1. Browser name and version
2. Steps to reproduce (room name, actions taken)
3. Expected vs. actual behavior
4. Console errors (copy from DevTools)
5. Whether both peers are on the same network or different networks
6. Screenshots if the issue is visual

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
