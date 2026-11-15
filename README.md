**English** · [한국어](./README.ko.md) · [日本語](./README.ja.md) · [简体中文](./README.zh-CN.md)

# YouTube Instant Fullscreen & Auto Comments

A lightweight userscript for YouTube that removes choppy zoom steps when switching to fullscreen, disables comments drawer animations, and automatically opens comments when playback starts or when pausing in fullscreen.

- **Version:** `1.9.0`
- **Author:** [`june58-mine`](https://github.com/june58-mine)
- **License:** `MIT`
- **Target:** `https://www.youtube.com/*`
- **Script:** [`youtube-instant-fullscreen-and-auto-comments.user.js`](./youtube-instant-fullscreen-and-auto-comments.user.js)

---

## Features

### Fullscreen

- **Skip intermediate fullscreen sizing** (`Enabled by default`)
  - Removes choppy zoom stutter when switching a video to fullscreen by disabling YouTube's `external_fullscreen` / `externalFullscreen` hooks so fullscreen targets the player directly.
  - Automatically restores panels (comments, live chat, transcript, etc.) that were expanded before entering fullscreen once you exit fullscreen.
- **Auto-fullscreen on playback** (`Disabled by default`)
  - Switches to fullscreen automatically when playback begins on `/watch` or `/live/*` pages (triggers once per video until playback ends or replays).
  - Respects browser autoplay rules (`navigator.userActivation`), running on user-initiated playback.

### Comments

- **Disable comments animations** (`Enabled by default`)
  - Removes slide, resize, and view-transition animations across comments and side engagement panels (`watch-flexy`, `watch-grid`, and `watch-learning-journey` layouts).
  - Spoofs `prefers-reduced-motion` queries inside `window.matchMedia` while using `0.001ms` CSS timings so YouTube's internal `transitionend` / `animationend` callbacks still complete reliably.
- **Open comments when playback starts** (`Enabled by default`)
  - Automatically expands the comments panel (`engagement-panel-comments-section`) when playback begins on watch pages and confirms state across YouTube SPA updates (`yt-page-data-updated`).
  - When inside `<html>` fullscreen, opening is deferred until fullscreen exit so the side drawer does not shrink the fullscreen video.
- **Open comments on fullscreen pause** (`Disabled by default`)
  - Automatically surfaces comments when you pause in fullscreen:
    - **Player-only fullscreen** (default): exits fullscreen to display comments below the player, and re-enters fullscreen automatically when playback resumes.
    - **`<html>` fullscreen** (when direct fullscreen is turned off): opens the right-hand comments drawer inside fullscreen and closes it again on resume.
  - Debounced (`30ms`) and filtered so synthetic pause events during video queueing or playback ending do not trigger unintended toggles.

### Settings UI & Localization

- Built-in modal accessible from your userscript manager's menu (`Settings`), with YouTube light/dark theme support (`html[dark]`).
- Auto-detects browser language (`en`, `ko`, `ja`, `zh`), defaults to **English** for unsupported locales, and provides an instant 5-option switcher (`System`, `English`, `한국어`, `日本語`, `中文`) that updates the modal live without reloading.

---

## Installation

1. Install a userscript manager extension in your browser:
   - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Edge, Firefox, Safari)
   - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Edge, Firefox)
2. Open [`youtube-instant-fullscreen-and-auto-comments.user.js`](./youtube-instant-fullscreen-and-auto-comments.user.js) in this repository and click **Raw**.
   - Your userscript manager should prompt you to install it automatically.
   - Alternatively, create a new script in your userscript manager and paste the contents of `youtube-instant-fullscreen-and-auto-comments.user.js`.
3. Open or reload YouTube (`https://www.youtube.com/`).
4. Click your extension icon and choose **`Settings`** to adjust preferences at any time. All changes are saved and applied immediately.

> [!TIP]
> You can install directly using the one-click Raw link: [`https://github.com/june58-mine/youtube-instant-fullscreen-and-auto-comments/raw/main/youtube-instant-fullscreen-and-auto-comments.user.js`](https://github.com/june58-mine/youtube-instant-fullscreen-and-auto-comments/raw/main/youtube-instant-fullscreen-and-auto-comments.user.js)

---

## Default Settings

| Section | Option | Key | Default |
| :--- | :--- | :--- | :---: |
| **Fullscreen** | Skip intermediate fullscreen sizing | `directFullscreen` | **ON** |
| **Fullscreen** | Auto-fullscreen on playback | `autoFullscreenOnPlay` | OFF |
| **Comments** | Disable comments animations | `disableCommentsAnimation` | **ON** |
| **Comments → Auto-open** | Open comments when playback starts | `openCommentsOnPlay` | **ON** |
| **Comments → Auto-open** | Open comments on fullscreen pause | `openCommentsOnFullscreenPause` | OFF |
| **Language** | Display language | `language` | `'auto'` (`System`) |

---

## Technical Notes

- **Runs at `document-start`**: Traps `ytcfg`, `ytplayer`, `yt.player.Application`, and `matchMedia` early so YouTube reads the configured settings before initializing player UI.
- **Trusted Types CSP safe**: Builds all injected stylesheets and modal elements exclusively through DOM APIs and `textContent` with zero `innerHTML` usage.
- **Low runtime overhead**: Uses O(1) fast-path checks on media events (`play`, `playing`, `pause`, `ended`), attaches the modal `Escape` key listener only while the settings modal is open, and listens for `yt-page-data-updated` instead of continuous DOM polling.
- **Settings persistence**: Saved via `GM_setValue` / `GM_getValue` (falling back to `localStorage`) under `yt_no_zoom_animation_settings_v2`, with automatic migration from legacy `v1` keys.

---

## License

Released under the **MIT License** (as declared via `@license MIT` in the userscript header).
