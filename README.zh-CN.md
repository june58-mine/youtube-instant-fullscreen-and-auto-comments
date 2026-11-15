[English](./README.md) · [한국어](./README.ko.md) · [日本語](./README.ja.md) · **简体中文**

# YouTube 瞬时全屏与自动展开评论区

**YouTube Instant Fullscreen & Auto Comments**

用于 YouTube 的轻量级用户脚本：消除将视频切换为全屏时画面放大卡顿的现象，禁用评论区与侧边栏动画，并在视频开始播放或全屏暂停时自动展开评论区。

- **版本：** `1.9.0`
- **作者：** [`june58-mine`](https://github.com/june58-mine)
- **开源协议：** `MIT`
- **适用页面：** `https://www.youtube.com/*`
- **脚本文件：** [`youtube-instant-fullscreen-and-auto-comments.user.js`](./youtube-instant-fullscreen-and-auto-comments.user.js)

---

## 功能特性

### 全屏模式 (Fullscreen)

- **跳过全屏中间尺寸过渡** (`默认开启`)
  - 禁用 YouTube 的 `external_fullscreen` 与 `externalFullscreen` 配置，消除将视频切换为全屏时画面放大卡顿的现象。
  - 退出全屏后，会自动恢复进入全屏前已打开的面板（如评论区、实时聊天、字幕文本等）。
- **播放时自动全屏** (`默认关闭`)
  - 在播放页（`/watch`、`/live/*`）视频开始播放时自动切换为全屏模式（每个视频触发一次，直至播放结束或重播）。
  - 遵循浏览器的用户手势策略（`navigator.userActivation`），在用户触发播放时生效。

### 评论区 (Comments)

- **禁用评论区动画** (`默认开启`)
  - 移除打开或关闭评论区及侧边栏时的滑动、缩放及 View Transition 动画（兼容 `watch-flexy`、`watch-grid`、`watch-learning-journey` 布局）。
  - 挂钩 `window.matchMedia` 的 `prefers-reduced-motion` 查询，并保留 `0.001ms` CSS 动画时长，确保 YouTube 内部的 `transitionend` / `animationend` 回调仍能正常完成。
- **开始播放时打开评论区** (`默认开启`)
  - 在播放页视频开始播放时自动展开评论区面板（`engagement-panel-comments-section`），并在 YouTube SPA 数据刷新（`yt-page-data-updated`）后确认保持展开状态。
  - 若当前处于 `<html>` 全屏下，会延迟到退出全屏后再打开评论区，避免侧边栏挤压全屏画面。
- **全屏暂停时打开评论区** (`默认关闭`)
  - 全屏播放期间暂停视频时，根据当前全屏类型自动显示评论区：
    - **播放器独立全屏**（默认模式）：退出全屏以在下方展示评论区；恢复播放后自动重新进入全屏。
    - **`<html>` 整页全屏**（关闭跳过中间过渡选项时）：保持全屏并在右侧边栏打开评论区，恢复播放后自动收起。
  - 已过滤队列切换与播放结束时触发的伪暂停事件（`playerState` 为 5 或 0），并设置 `30ms` 防抖以避免误触发。

### 设置界面与多语言支持

- 可通过脚本管理器的扩展菜单（`设置`）随时打开内置设置弹窗，自动适配 YouTube 浅色/深色主题（`html[dark]`）。
- 自动检测浏览器语言（支持 `English`、`한국어`、`日本語`、`中文`，未支持语言默认回退为 `English`），并可在设置弹窗内实时切换语言（`系统` / `English` / `한국어` / `日本語` / `中文`），无需刷新页面。

---

## 安装指南

1. 在浏览器中安装用户脚本管理器扩展：
   - [Tampermonkey](https://www.tampermonkey.net/)（Chrome、Edge、Firefox、Safari）
   - [Violentmonkey](https://violentmonkey.github.io/)（Chrome、Edge、Firefox）
2. 打开本仓库中的 [`youtube-instant-fullscreen-and-auto-comments.user.js`](./youtube-instant-fullscreen-and-auto-comments.user.js) 文件，点击页面右上方的 **Raw** 按钮。
   - 脚本管理器通常会自动弹出安装确认页面。
   - 也可以在脚本管理器中新建脚本，直接复制并保存该文件全部内容。
3. 打开或刷新 YouTube（`https://www.youtube.com/`）。
4. 点击扩展菜单中的 **`设置`** 即可按需调整各项开关，所有更改都会立即保存并生效。

> [!TIP]
> 可直接点击以下 Raw 链接一键安装：[`https://github.com/june58-mine/youtube-instant-fullscreen-and-auto-comments/raw/main/youtube-instant-fullscreen-and-auto-comments.user.js`](https://github.com/june58-mine/youtube-instant-fullscreen-and-auto-comments/raw/main/youtube-instant-fullscreen-and-auto-comments.user.js)

---

## 默认设置一览

| 分组 | 设置项 | 配置键 | 默认值 |
| :--- | :--- | :--- | :---: |
| **全屏模式** | 跳过全屏中间尺寸过渡 | `directFullscreen` | **开启 (`true`)** |
| **全屏模式** | 播放时自动全屏 | `autoFullscreenOnPlay` | 关闭 (`false`) |
| **评论区** | 禁用评论区动画 | `disableCommentsAnimation` | **开启 (`true`)** |
| **评论区 → 自动展开** | 开始播放时打开评论区 | `openCommentsOnPlay` | **开启 (`true`)** |
| **评论区 → 自动展开** | 全屏暂停时打开评论区 | `openCommentsOnFullscreenPause` | 关闭 (`false`) |
| **语言** | 显示语言 | `language` | `'auto'` (`系统`) |

---

## 技术说明与兼容性

- **在 `document-start` 阶段运行**：在播放器实例创建前提前挂钩 `ytcfg`、`ytplayer`、`yt.player.Application` 和 `matchMedia`，避免页面初始化后再补改配置导致切换闪烁。
- **兼容 Trusted Types CSP**：全程仅使用原生 DOM API 与 `textContent` 构建样式和设置界面，不使用 `innerHTML`。
- **极低运行时开销**：在媒体事件（`play`、`playing`、`pause`、`ended`）入口进行 O(1) 快速判断；`Escape` 键盘监听仅在设置弹窗打开时绑定；结合 `yt-page-data-updated` 事件替代持续 DOM 轮询。
- **配置存储与迁移**：通过 `GM_setValue` / `GM_getValue`（或回退至 `localStorage`）保存在 `yt_no_zoom_animation_settings_v2` 键中，并兼容自动迁移旧版 `v1` 配置。

---

## 开源协议

基于脚本头部声明的 **MIT License**（`@license MIT`）发布。
