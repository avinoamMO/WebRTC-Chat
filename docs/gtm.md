# Go-to-Market Plan

## Positioning

**WebRTC Chat** is positioned as an **educational reference implementation** and **starter template** for developers building real-time communication features. It is not a product competing with Zoom or Google Meet -- it is the project you study to understand how those products work under the hood.

**One-liner:** "The simplest way to understand peer-to-peer video chat -- 400 lines of vanilla JS, no framework, no build step."

---

## Target Audience

### Primary: Developers learning WebRTC

- Junior to mid-level web developers who have heard of WebRTC but never built with it
- Students working on capstone/portfolio projects involving real-time communication
- Developers evaluating whether WebRTC fits their product requirements

**Why they care:** WebRTC documentation is notoriously fragmented. Most tutorials are outdated (callback-based APIs from 2018). This project provides a clean, modern (async/await) implementation they can read end-to-end in 20 minutes.

### Secondary: Teams needing a lightweight internal tool

- Small teams (2-5 people) who want a quick video chat without installing software
- Hackathon teams needing real-time features fast
- Open-source contributors looking for a well-scoped project to contribute to

---

## Distribution Channels

### 1. GitHub Discovery

- **README quality**: Badges, architecture diagram, feature list, screenshots -- optimized for the 5-second decision to star
- **Topics/tags**: `webrtc`, `video-chat`, `peer-to-peer`, `vanilla-javascript`, `real-time`, `screen-sharing`
- **GitHub Pages demo**: Live link in repo description so visitors can try it instantly

### 2. Technical Blog Post (dev.to / Hashnode / Medium)

**Article title ideas:**
- "Build a P2P Video Chat in 400 Lines of JavaScript (No React, No Build Step)"
- "WebRTC in 2026: The Modern APIs You Should Be Using"
- "I Rewrote My 2019 WebRTC Project -- Here's What Changed"

**Structure:**
1. Hook: "Most WebRTC tutorials still use deprecated callback APIs from 2018"
2. Architecture overview (the ASCII diagram from the README)
3. Walk through the code in 4 sections: signaling, connection, media, chat
4. Deploy to GitHub Pages in 2 minutes
5. CTA: Star the repo, fork it, build on it

**Cross-post to:** dev.to (primary -- best for discovery), Hashnode, personal blog

### 3. Community Seeding

| Community | Approach |
|-----------|----------|
| r/webdev | "Show Reddit" post with demo link |
| r/javascript | Post the blog article |
| Hacker News (Show HN) | Only if the blog post gets traction first |
| WebRTC Google Group | Share as a modern reference implementation |
| Discord servers (Reactiflux, The Coding Den) | Share in #show-off or #resources |
| Twitter/X | Thread walking through the architecture diagram |

### 4. SEO / Evergreen

The blog post targets long-tail search queries:
- "webrtc video chat javascript tutorial"
- "peer to peer video call browser"
- "webrtc screen sharing example"
- "simple webrtc project"

The GitHub Pages demo itself ranks for "webrtc chat demo" over time.

---

## Success Metrics

| Metric | Target (90 days) | How to measure |
|--------|-----------------|----------------|
| GitHub stars | 100+ | GitHub |
| Blog post views | 5,000+ | dev.to analytics |
| Forks | 20+ | GitHub |
| Demo page visits | 1,000+ | Simple analytics or GitHub Pages traffic |

---

## Timeline

| Week | Action |
|------|--------|
| 1 | Deploy updated version to GitHub Pages. Take screenshots for README. |
| 2 | Write and publish the blog post on dev.to. Cross-post to Hashnode. |
| 2 | Share on r/webdev, r/javascript, relevant Discord servers. |
| 3 | Post Twitter/X thread. Submit to Show HN if blog got 50+ reactions. |
| 4+ | Monitor issues/PRs. Write a follow-up post if there is interest (e.g., "Adding TURN Servers" or "Multi-Party Calls with an SFU"). |

---

## Risks

- **ScaleDrone dependency**: Free tier may rate-limit if the demo gets popular. Mitigation: document how to swap in your own channel ID.
- **STUN-only**: Some corporate networks block P2P. Mitigation: add a note about TURN servers in the README; consider adding a free TURN option.
- **2-person limit**: Not impressive for "video chat" if people expect group calls. Mitigation: position clearly as educational/1:1 template, not a product.
