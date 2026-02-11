---
name: Bug Report
about: Report a bug with video, audio, chat, or connection issues
title: "[Bug] "
labels: bug
assignees: ''
---

## Description

A clear description of what the bug is.

## Steps to Reproduce

1. Open the app at [URL or localhost]
2. Enter room name and display name
3. Perform the action (e.g., toggle screen sharing, send a chat message)
4. Observe the issue

## Expected Behavior

What should happen (e.g., video connects, chat message appears).

## Actual Behavior

What actually happens (e.g., black screen, no audio, connection drops).

## Environment

- **Browser**: Chrome / Firefox / Safari / Edge (version)
- **OS**: macOS / Windows / Linux / iOS / Android
- **Network**: Same LAN / Different networks / Behind VPN
- **Device**: Desktop / Mobile / Tablet

## Console Errors

```
Open DevTools (F12) > Console tab and paste any errors here.
```

## Connection Details

- Does `chrome://webrtc-internals/` show ICE candidates being exchanged?
- Is the connection status indicator showing "connected" or stuck on "connecting"?
- Are both peers able to see each other's video, or is it one-directional?

## Additional Context

- Does the issue happen on every call or intermittently?
- Does refreshing the page fix it?
- Have you tried in a different browser?
