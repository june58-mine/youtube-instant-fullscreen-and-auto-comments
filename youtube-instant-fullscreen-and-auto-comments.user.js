// ==UserScript==
// @name         YouTube Instant Fullscreen & Auto Comments
// @name:ko      YouTube 즉시 전체화면 & 자동 댓글창
// @name:ja      YouTube 即時全画面 & コメント自動表示
// @name:zh-CN   YouTube 瞬时全屏与自动展开评论区
// @namespace    https://github.com/june58-mine/youtube-instant-fullscreen-and-auto-comments
// @version      1.9.0
// @description  Remove choppy YouTube fullscreen zoom transitions, disable comments drawer animations, and auto-open comments on playback or fullscreen pause.
// @description:ko YouTube 전체화면 전환 시 확대 효과가 부자연스럽게 끊기는 현상을 제거하고, 댓글창 애니메이션 비활성화 및 재생·전체화면 일시정지 시 댓글창 자동 열기를 지원합니다.
// @description:ja YouTubeの全画面切り替え時の不自然なズームのカクつきを解消し、コメント欄のアニメーション無効化や再生・全画面一時停止時のコメント自動表示を提供します。
// @description:zh-CN 消除 YouTube 全屏切换时画面放大卡顿的问题，禁用评论区动画，并支持播放或全屏暂停时自动展开评论区。
// @author       june58-mine
// @license      MIT
// @homepageURL  https://github.com/june58-mine/youtube-instant-fullscreen-and-auto-comments
// @supportURL   https://github.com/june58-mine/youtube-instant-fullscreen-and-auto-comments/issues
// @updateURL    https://raw.githubusercontent.com/june58-mine/youtube-instant-fullscreen-and-auto-comments/main/youtube-instant-fullscreen-and-auto-comments.user.js
// @downloadURL  https://raw.githubusercontent.com/june58-mine/youtube-instant-fullscreen-and-auto-comments/main/youtube-instant-fullscreen-and-auto-comments.user.js
// @match        https://www.youtube.com/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        unsafeWindow
// ==/UserScript==

(function () {
  'use strict';

  const pageWin = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  const pageDoc = pageWin.document || document;

  // ---------------------------------------------------------------------------
  // Constants, Default Settings & Localization
  // ---------------------------------------------------------------------------

  const STORAGE_KEY = 'yt_no_zoom_animation_settings_v2';
  const LEGACY_STORAGE_KEY = 'yt_no_zoom_animation_settings_v1';
  const FEATURE_STYLE_ID = 'yt-no-zoom-animation-style';
  const UI_STYLE_ID = 'yt-no-zoom-ui-style';
  const MODAL_BACKDROP_ID = 'yt-no-zoom-modal-backdrop';

  const PANEL_EXPANDED = 'ENGAGEMENT_PANEL_VISIBILITY_EXPANDED';
  const COMMENTS_PANEL_ID = 'engagement-panel-comments-section';
  const ENGAGEMENT_PANEL_SELECTOR =
    'ytd-watch-flexy #panels ytd-engagement-panel-section-list-renderer, ' +
    'ytd-watch-flexy #panels-full-bleed-container ytd-engagement-panel-section-list-renderer, ' +
    'ytd-watch-grid #panels ytd-engagement-panel-section-list-renderer, ' +
    'ytd-watch-learning-journey #panels ytd-engagement-panel-section-list-renderer, ' +
    'ytd-watch-learning-journey #plj-panels ytd-engagement-panel-section-list-renderer';
  const COMMENT_OPEN_RETRY_DELAYS = [150, 300, 600, 1000, 1500];
  const COMMENTS_CONFIRM_WINDOW_MS = 5000;

  const VALID_LANGUAGES = new Set(['auto', 'en', 'ko', 'ja', 'zh']);
  const LANGUAGE_ENDONYMS = {
    en: 'English',
    ko: '한국어',
    ja: '日本語',
    zh: '中文',
  };

  const DEFAULT_SETTINGS = {
    directFullscreen: true,
    autoFullscreenOnPlay: false,
    disableCommentsAnimation: true,
    openCommentsOnPlay: true,
    openCommentsOnFullscreenPause: false,
    language: 'auto',
  };

  const I18N = {
    en: {
      menuSettings: 'Settings',
      modalTitle: 'YouTube Instant Fullscreen & Auto Comments',
      closeLabel: 'Close',
      footerHint: 'Saved automatically',
      sections: {
        fullscreen: 'Fullscreen',
        comments: 'Comments',
        language: 'Language',
      },
      subGroups: {
        autoOpen: 'Auto-open',
      },
      items: {
        directFullscreen: {
          label: 'Skip intermediate fullscreen sizing',
          description: 'Removes choppy zoom steps when switching a video to fullscreen',
        },
        autoFullscreenOnPlay: {
          label: 'Auto-fullscreen on playback',
          description: 'Switches to fullscreen automatically when playback begins',
        },
        disableCommentsAnimation: {
          label: 'Disable comments animations',
          description: 'Turns off slide and resize transitions on comments and side panels',
        },
        openCommentsOnPlay: {
          label: 'Open comments when playback starts',
          description: 'Expands the comments panel when playback begins',
        },
        openCommentsOnFullscreenPause: {
          label: 'Open comments on fullscreen pause',
          description:
            'Shows comments when paused in fullscreen and returns to fullscreen on resume',
        },
      },
      languageRow: {
        label: 'Display language',
        description: (detected) =>
          `Matches browser language when supported · Detected: ${LANGUAGE_ENDONYMS[detected]}`,
        autoOption: 'System',
      },
    },
    ko: {
      menuSettings: '설정',
      modalTitle: 'YouTube 즉시 전체화면 & 자동 댓글창',
      closeLabel: '닫기',
      footerHint: '변경 시 자동 저장',
      sections: {
        fullscreen: '전체화면',
        comments: '댓글창',
        language: '언어',
      },
      subGroups: {
        autoOpen: '자동 열기',
      },
      items: {
        directFullscreen: {
          label: '전체화면 중간 크기 단계 제거',
          description: '영상을 전체화면으로 전환할 때 확대 효과가 부자연스럽게 끊기는 현상을 제거합니다',
        },
        autoFullscreenOnPlay: {
          label: '영상 재생 시 자동 전체화면',
          description: '영상 재생이 시작될 때 자동으로 전체화면으로 전환합니다',
        },
        disableCommentsAnimation: {
          label: '댓글창 애니메이션 제거',
          description: '댓글창과 사이드 패널의 슬라이드·크기 전환 효과를 끕니다',
        },
        openCommentsOnPlay: {
          label: '영상 재생 시작 시 댓글창 열기',
          description: '영상 재생이 시작될 때 댓글창을 자동으로 엽니다',
        },
        openCommentsOnFullscreenPause: {
          label: '전체화면에서 일시정지 시 댓글창 열기',
          description: '전체화면 중 멈추면 댓글창을 열고 다시 재생하면 전체화면으로 돌아갑니다',
        },
      },
      languageRow: {
        label: '표시 언어',
        description: (detected) =>
          `지원되는 브라우저 언어 자동 적용 · 감지됨: ${LANGUAGE_ENDONYMS[detected]}`,
        autoOption: '시스템',
      },
    },
    ja: {
      menuSettings: '設定',
      modalTitle: 'YouTube 即時全画面 & コメント自動表示',
      closeLabel: '閉じる',
      footerHint: '変更時に自動保存',
      sections: {
        fullscreen: '全画面表示',
        comments: 'コメント欄',
        language: '言語',
      },
      subGroups: {
        autoOpen: '自動表示',
      },
      items: {
        directFullscreen: {
          label: '全画面の中間サイズ段階をスキップ',
          description: '動画を全画面に切り替える際の不自然なズームのカクつきを取り除きます',
        },
        autoFullscreenOnPlay: {
          label: '再生開始時に自動で全画面',
          description: '動画の再生が始まると自動で全画面に切り替えます',
        },
        disableCommentsAnimation: {
          label: 'コメント欄のアニメーションを無効化',
          description: 'コメント欄やサイドパネル開閉時のスライド・リサイズ演出を止めます',
        },
        openCommentsOnPlay: {
          label: '再生開始時にコメント欄を開く',
          description: '再生が始まるとコメント欄を自動で開きます',
        },
        openCommentsOnFullscreenPause: {
          label: '全画面で一時停止時にコメント欄を開く',
          description: '全画面中に一時停止するとコメント欄を開き、再生再開で全画面に戻ります',
        },
      },
      languageRow: {
        label: '表示言語',
        description: (detected) =>
          `対応するブラウザ言語を自動適用 · 検出: ${LANGUAGE_ENDONYMS[detected]}`,
        autoOption: 'システム',
      },
    },
    zh: {
      menuSettings: '设置',
      modalTitle: 'YouTube 瞬时全屏与自动展开评论区',
      closeLabel: '关闭',
      footerHint: '更改后自动保存',
      sections: {
        fullscreen: '全屏模式',
        comments: '评论区',
        language: '语言',
      },
      subGroups: {
        autoOpen: '自动展开',
      },
      items: {
        directFullscreen: {
          label: '跳过全屏中间尺寸过渡',
          description: '消除将视频切换为全屏时画面放大卡顿的现象',
        },
        autoFullscreenOnPlay: {
          label: '播放时自动全屏',
          description: '视频开始播放时自动切换为全屏模式',
        },
        disableCommentsAnimation: {
          label: '禁用评论区动画',
          description: '关闭打开或收起评论区及侧边栏时的滑动与缩放效果',
        },
        openCommentsOnPlay: {
          label: '开始播放时打开评论区',
          description: '视频开始播放时自动展开评论区',
        },
        openCommentsOnFullscreenPause: {
          label: '全屏暂停时打开评论区',
          description: '全屏播放暂停时展开评论区，恢复播放后重新进入全屏',
        },
      },
      languageRow: {
        label: '显示语言',
        description: (detected) =>
          `自动匹配浏览器语言 · 已检测: ${LANGUAGE_ENDONYMS[detected]}`,
        autoOption: '系统',
      },
    },
  };

  const SETTING_GROUPS = [
    {
      id: 'fullscreen',
      itemKeys: ['directFullscreen', 'autoFullscreenOnPlay'],
    },
    {
      id: 'comments',
      itemKeys: ['disableCommentsAnimation'],
      subGroup: {
        id: 'autoOpen',
        itemKeys: ['openCommentsOnPlay', 'openCommentsOnFullscreenPause'],
      },
    },
  ];

  const LANGUAGE_OPTIONS = [
    { value: 'auto', fixedLabel: null },
    { value: 'en', fixedLabel: 'English' },
    { value: 'ko', fixedLabel: '한국어' },
    { value: 'ja', fixedLabel: '日本語' },
    { value: 'zh', fixedLabel: '中文' },
  ];

  const COMMENTS_DISABLED_CSS = `
    ytd-watch-flexy #secondary,
    ytd-watch-flexy #below,
    ytd-watch-flexy #panels,
    ytd-watch-grid #panels,
    ytd-watch-learning-journey #secondary,
    ytd-watch-learning-journey #below {
      view-transition-name: none !important;
    }
    /* Use 0.001ms instead of 0s so YouTube's transitionend/animationend listeners still resolve. */
    ytd-watch-flexy #columns,
    ytd-watch-flexy #columns::after,
    ytd-watch-flexy #secondary,
    ytd-watch-flexy #secondary::after,
    ytd-watch-flexy #panels,
    ytd-watch-flexy #panels ytd-engagement-panel-section-list-renderer,
    ytd-watch-flexy #panels-full-bleed-container,
    ytd-watch-flexy #panels-full-bleed-container ytd-engagement-panel-section-list-renderer,
    ytd-watch-flexy #chat,
    ytd-watch-flexy #fixed-side-menu,
    ytd-watch-grid #secondary-inner,
    ytd-watch-grid #fixed-secondary,
    ytd-watch-grid #chat,
    ytd-watch-grid #panels ytd-engagement-panel-section-list-renderer,
    ytd-watch-grid ytd-playlist-panel-renderer,
    ytd-watch-learning-journey #chat,
    #plj-playlist.ytd-watch-learning-journey,
    ytd-watch-learning-journey #plj-panels ytd-engagement-panel-section-list-renderer {
      transition-duration: 0.001ms !important;
      transition-delay: 0s !important;
      animation-duration: 0.001ms !important;
      animation-delay: 0s !important;
    }
  `.trim();

  // ---------------------------------------------------------------------------
  // Locale Detection & Settings Storage
  // ---------------------------------------------------------------------------

  function normalizeLanguageTag(tag) {
    if (typeof tag !== 'string') return null;
    const lower = tag.trim().toLowerCase();
    if (!lower) return null;
    if (lower === 'ko' || lower.startsWith('ko-') || lower.startsWith('ko_')) return 'ko';
    if (lower === 'ja' || lower.startsWith('ja-') || lower.startsWith('ja_')) return 'ja';
    if (lower === 'zh' || lower.startsWith('zh-') || lower.startsWith('zh_')) return 'zh';
    if (lower === 'en' || lower.startsWith('en-') || lower.startsWith('en_')) return 'en';
    return null;
  }

  function detectSystemLocale() {
    const nav = pageWin.navigator || (typeof navigator !== 'undefined' ? navigator : null);
    let primaryTag = '';
    if (nav) {
      if (typeof nav.language === 'string' && nav.language) {
        primaryTag = nav.language;
      } else if (Array.isArray(nav.languages) && nav.languages.length > 0 && nav.languages[0]) {
        primaryTag = nav.languages[0];
      }
    }
    if (!primaryTag && typeof Intl !== 'undefined') {
      try {
        primaryTag = Intl.DateTimeFormat().resolvedOptions().locale || '';
      } catch {
        // Fallback to default English when Intl locale inspection is unavailable.
      }
    }
    return normalizeLanguageTag(primaryTag) || 'en';
  }

  function resolveLocale() {
    if (settings.language !== 'auto' && VALID_LANGUAGES.has(settings.language)) {
      return settings.language;
    }
    return detectSystemLocale();
  }

  function getLocaleBundle() {
    return I18N[resolveLocale()] || I18N.en;
  }

  let settings = loadSettings();

  const originalExternalFsFlags = new WeakMap();
  const originalContextExtFs = new WeakMap();
  const originalAppExtFs = new WeakMap();
  const trackedPlayerApps = new Set();

  function sanitizeSettings(rawObj) {
    const src = rawObj && typeof rawObj === 'object' ? rawObj : {};
    const sanitized = {};
    for (const [key, fallback] of Object.entries(DEFAULT_SETTINGS)) {
      if (key === 'language') {
        sanitized.language = VALID_LANGUAGES.has(src.language) ? src.language : fallback;
      } else {
        sanitized[key] = typeof src[key] === 'boolean' ? src[key] : fallback;
      }
    }
    return sanitized;
  }

  function readStorageRaw(key) {
    try {
      const raw =
        typeof GM_getValue === 'function'
          ? GM_getValue(key, null)
          : pageWin.localStorage?.getItem(key);
      if (!raw) return null;
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return null;
    }
  }

  function writeStorageObj(key, obj) {
    try {
      const serialized = JSON.stringify(obj);
      if (typeof GM_setValue === 'function') {
        GM_setValue(key, serialized);
      } else {
        pageWin.localStorage?.setItem(key, serialized);
      }
    } catch {
      // Keep the updated settings active in memory even if storage write is blocked.
    }
  }

  function loadSettings() {
    const current = readStorageRaw(STORAGE_KEY);
    if (current && typeof current === 'object') {
      return sanitizeSettings(current);
    }

    const legacy = readStorageRaw(LEGACY_STORAGE_KEY);
    if (legacy && typeof legacy === 'object') {
      // Preserve animation/pause preferences from legacy v1 storage while adopting v2 defaults.
      const migrated = sanitizeSettings({
        disableCommentsAnimation: legacy.disableCommentsAnimation,
        openCommentsOnFullscreenPause: legacy.openCommentsOnFullscreenPause,
      });
      writeStorageObj(STORAGE_KEY, migrated);
      return migrated;
    }

    return { ...DEFAULT_SETTINGS };
  }

  function saveSettings(nextSettings) {
    settings = sanitizeSettings({ ...settings, ...nextSettings });
    writeStorageObj(STORAGE_KEY, settings);
  }

  // ---------------------------------------------------------------------------
  // Stylesheet Injection & Reduced-Motion Hook
  // ---------------------------------------------------------------------------

  function upsertStyleElement(styleId, cssText) {
    const existing = pageDoc.getElementById(styleId);
    if (!cssText) {
      if (existing) existing.remove();
      return;
    }

    const mountTarget = pageDoc.head || pageDoc.documentElement;
    if (!mountTarget) return;

    if (!existing) {
      const styleEl = pageDoc.createElement('style');
      styleEl.id = styleId;
      // Use textContent rather than innerHTML to satisfy YouTube Trusted Types CSP.
      styleEl.textContent = cssText;
      mountTarget.appendChild(styleEl);
    } else if (existing.textContent !== cssText) {
      existing.textContent = cssText;
    }
  }

  function syncFeatureStylesheet() {
    upsertStyleElement(
      FEATURE_STYLE_ID,
      settings.disableCommentsAnimation ? COMMENTS_DISABLED_CSS : ''
    );
  }

  function hookMatchMedia() {
    if (typeof pageWin.matchMedia !== 'function') return;

    const origMatchMedia = pageWin.matchMedia;
    if (origMatchMedia.__ytNoZoomHooked) return;

    const nativeMatchesGetter = Object.getOwnPropertyDescriptor(
      pageWin.MediaQueryList?.prototype || {},
      'matches'
    )?.get;

    function wrappedMatchMedia(query) {
      const mql = origMatchMedia.call(pageWin, query);
      if (
        typeof query !== 'string' ||
        (!query.includes('prefers-reduced-motion') && !/prefers-reduced-motion/i.test(query))
      ) {
        return mql;
      }

      const isReduceQuery = /prefers-reduced-motion\s*:\s*reduce/i.test(query);
      const isNoPrefQuery = !isReduceQuery && /prefers-reduced-motion\s*:\s*no-preference/i.test(query);
      if (!isReduceQuery && !isNoPrefQuery) {
        return mql;
      }

      try {
        Object.defineProperty(mql, 'matches', {
          configurable: true,
          get() {
            if (!settings.disableCommentsAnimation) {
              return nativeMatchesGetter ? nativeMatchesGetter.call(mql) : false;
            }
            return isReduceQuery;
          },
        });
      } catch {
        // Leave native behavior intact if MediaQueryList properties cannot be redefined.
      }
      return mql;
    }

    wrappedMatchMedia.__ytNoZoomHooked = true;
    pageWin.matchMedia = wrappedMatchMedia;
  }

  // ---------------------------------------------------------------------------
  // Direct Player Fullscreen Hooks (Skip Intermediate Sizing)
  // ---------------------------------------------------------------------------

  function getFullscreenElement() {
    return pageDoc.fullscreenElement || pageDoc.webkitFullscreenElement || null;
  }

  function isDocumentFullscreen() {
    return Boolean(getFullscreenElement());
  }

  function isHtmlFullscreen() {
    return getFullscreenElement() === pageDoc.documentElement;
  }

  function trapProperty(target, prop, transformOnSet) {
    if (!target || (typeof target !== 'object' && typeof target !== 'function')) return false;

    const desc = Object.getOwnPropertyDescriptor(target, prop);
    if (desc && !desc.configurable) {
      if (target[prop] !== undefined) {
        const mapped = transformOnSet(target[prop]);
        if (desc.writable && mapped !== target[prop]) {
          target[prop] = mapped;
        }
      }
      return false;
    }

    let current = target[prop];
    try {
      Object.defineProperty(target, prop, {
        configurable: true,
        enumerable: true,
        get() {
          return current;
        },
        set(next) {
          current = next;
          if (next !== undefined) {
            current = transformOnSet(next);
          }
        },
      });
    } catch {
      return false;
    }

    if (current !== undefined) {
      current = transformOnSet(current);
    }
    return true;
  }

  function patchContextExternalFullscreen(ctx) {
    if (!ctx || typeof ctx !== 'object' || !('externalFullscreen' in ctx)) return;
    if (!originalContextExtFs.has(ctx)) {
      originalContextExtFs.set(ctx, Boolean(ctx.externalFullscreen));
    }
    ctx.externalFullscreen = settings.directFullscreen ? false : originalContextExtFs.get(ctx);
  }

  function patchConfigObject(cfg) {
    if (!cfg || typeof cfg !== 'object') return;

    const flags = cfg.EXPERIMENT_FLAGS;
    if (flags && typeof flags === 'object' && 'external_fullscreen' in flags) {
      if (!originalExternalFsFlags.has(flags)) {
        originalExternalFsFlags.set(flags, Boolean(flags.external_fullscreen));
      }
      flags.external_fullscreen = settings.directFullscreen
        ? false
        : originalExternalFsFlags.get(flags);
    }

    if (cfg.WEB_PLAYER_CONTEXT_CONFIGS && typeof cfg.WEB_PLAYER_CONTEXT_CONFIGS === 'object') {
      for (const ctx of Object.values(cfg.WEB_PLAYER_CONTEXT_CONFIGS)) {
        patchContextExternalFullscreen(ctx);
      }
    }
  }

  function syncDirectFullscreenConfigs() {
    const ytCfgObj = pageWin.yt?.config_;
    const ytcfgData = pageWin.ytcfg?.d?.();
    if (ytCfgObj) patchConfigObject(ytCfgObj);
    if (ytcfgData && ytcfgData !== ytCfgObj) patchConfigObject(ytcfgData);
    patchContextExternalFullscreen(pageWin.ytplayer?.bootstrapWebPlayerContextConfig);
  }

  function applyAppExternalFullscreen(app, fallbackCtx) {
    if (!app || typeof app.O !== 'function') return;
    const zmbCfg = app.O();
    if (!zmbCfg || typeof zmbCfg !== 'object' || !('externalFullscreen' in zmbCfg)) return;

    if (!originalAppExtFs.has(zmbCfg)) {
      const ctx =
        fallbackCtx ||
        app.webPlayerContextConfig ||
        pageWin.ytplayer?.bootstrapWebPlayerContextConfig;
      const origVal = settings.directFullscreen
        ? ctx && originalContextExtFs.has(ctx)
          ? originalContextExtFs.get(ctx)
          : true
        : Boolean(zmbCfg.externalFullscreen);
      originalAppExtFs.set(zmbCfg, origVal);
    }
    // Defer externalFullscreen flips while fullscreen is active so exitFullscreen target cannot mismatch.
    if (isDocumentFullscreen()) return;

    zmbCfg.externalFullscreen = settings.directFullscreen ? false : originalAppExtFs.get(zmbCfg);
  }

  function registerPlayerApp(app, passedCtx) {
    if (!app || typeof app !== 'object' || typeof app.O !== 'function') return;
    if (!trackedPlayerApps.has(app)) {
      trackedPlayerApps.add(app);
      if (typeof app.addOnDisposeCallback === 'function') {
        try {
          app.addOnDisposeCallback(() => trackedPlayerApps.delete(app));
        } catch {
          // Ignore environments that restrict dispose callbacks; the Set remains bounded by active players.
        }
      }
    }
    applyAppExternalFullscreen(app, passedCtx);
  }

  function syncDirectFullscreen() {
    syncDirectFullscreenConfigs();
    for (const app of trackedPlayerApps) {
      applyAppExternalFullscreen(app);
    }
  }

  function wrapYtcfgSetFn(cfg, setFn) {
    if (typeof setFn !== 'function' || setFn.__ytNoZoomSetWrapped) return setFn;
    function wrappedYtcfgSet() {
      const result = setFn.apply(this, arguments);
      const target = typeof cfg.d === 'function' ? cfg.d() : pageWin.yt?.config_;
      patchConfigObject(target);
      return result;
    }
    wrappedYtcfgSet.__ytNoZoomSetWrapped = true;
    return wrappedYtcfgSet;
  }

  function wrapYtcfgObject(cfg) {
    if (!cfg || typeof cfg !== 'object' || cfg.__ytNoZoomHooked) {
      return cfg;
    }

    cfg.__ytNoZoomHooked = true;
    trapProperty(cfg, 'set', (fn) => wrapYtcfgSetFn(cfg, fn));
    const initialTarget = typeof cfg.d === 'function' ? cfg.d() : pageWin.yt?.config_;
    patchConfigObject(initialTarget);
    return cfg;
  }

  function wrapApplicationCreateFn(fn) {
    if (typeof fn !== 'function' || fn.__ytNoZoomWrapped) return fn;

    function wrappedCreate() {
      syncDirectFullscreenConfigs();
      patchContextExternalFullscreen(arguments[2]);
      const app = fn.apply(this, arguments);
      registerPlayerApp(app, arguments[2]);
      return app;
    }

    wrappedCreate.__ytNoZoomWrapped = true;
    return wrappedCreate;
  }

  function hookApplicationNamespace(appNs) {
    if (!appNs || typeof appNs !== 'object' || appNs.__ytNoZoomAppHooked) return appNs;
    appNs.__ytNoZoomAppHooked = true;
    trapProperty(appNs, 'create', wrapApplicationCreateFn);
    trapProperty(appNs, 'createAlternate', wrapApplicationCreateFn);
    return appNs;
  }

  function hookPlayerNamespace(playerNs) {
    if (!playerNs || typeof playerNs !== 'object' || playerNs.__ytNoZoomPlayerHooked) {
      return playerNs;
    }
    playerNs.__ytNoZoomPlayerHooked = true;
    trapProperty(playerNs, 'Application', hookApplicationNamespace);
    return playerNs;
  }

  function hookYtNamespace(ytNs) {
    if (!ytNs || typeof ytNs !== 'object' || ytNs.__ytNoZoomYtHooked) return ytNs;
    ytNs.__ytNoZoomYtHooked = true;
    trapProperty(ytNs, 'player', hookPlayerNamespace);
    return ytNs;
  }

  function hookYtPlayerBootstrap(ytplayerObj) {
    if (!ytplayerObj || typeof ytplayerObj !== 'object' || ytplayerObj.__ytNoZoomHooked) {
      return ytplayerObj;
    }
    ytplayerObj.__ytNoZoomHooked = true;
    trapProperty(ytplayerObj, 'bootstrapWebPlayerContextConfig', (ctx) => {
      patchContextExternalFullscreen(ctx);
      return ctx;
    });
    return ytplayerObj;
  }

  function installConfigAndPlayerHooks() {
    trapProperty(pageWin, 'ytcfg', wrapYtcfgObject);
    trapProperty(pageWin, 'ytplayer', hookYtPlayerBootstrap);
    trapProperty(pageWin, 'yt', hookYtNamespace);
  }

  // ---------------------------------------------------------------------------
  // Watch Page DOM & Fullscreen / Comments Automation
  // ---------------------------------------------------------------------------

  function getWatchEngagementPanels() {
    return Array.from(pageDoc.querySelectorAll(ENGAGEMENT_PANEL_SELECTOR));
  }

  function getCommentsPanel() {
    const matches = getWatchEngagementPanels().filter(
      (panel) => panel.getAttribute('target-id') === COMMENTS_PANEL_ID
    );
    if (matches.length === 0) return null;
    return matches.find((panel) => !panel.closest?.('[hidden]')) || matches[0];
  }

  function getExpandedPanelIds() {
    return getWatchEngagementPanels()
      .filter((panel) => panel.getAttribute('visibility') === PANEL_EXPANDED)
      .map((panel) => panel.getAttribute('target-id'))
      .filter(Boolean);
  }

  function restorePanelsByIds(panelIds) {
    if (isDocumentFullscreen() || panelIds.length === 0) return [];

    const panels = getWatchEngagementPanels();
    const pendingIds = [];
    for (const targetId of panelIds) {
      const panel = panels.find((el) => el.getAttribute('target-id') === targetId);
      if (!panel) continue;
      if (panel.getAttribute('visibility') === PANEL_EXPANDED) continue;

      if (typeof panel.showPanel === 'function') {
        panel.showPanel();
      }
      if (panel.getAttribute('visibility') !== PANEL_EXPANDED) {
        pendingIds.push(targetId);
      }
    }
    return pendingIds;
  }

  function exitActiveFullscreen(mp) {
    try {
      if (typeof pageDoc.exitFullscreen === 'function' && pageDoc.fullscreenElement) {
        return pageDoc.exitFullscreen();
      }
      if (typeof pageDoc.webkitExitFullscreen === 'function' && pageDoc.webkitFullscreenElement) {
        return pageDoc.webkitExitFullscreen();
      }
      if (mp && typeof mp.toggleFullscreen === 'function' && mp.isFullscreen?.()) {
        return mp.toggleFullscreen();
      }
    } catch {
      // Ignore errors when fullscreen has already exited.
    }
    return Promise.resolve();
  }

  function isWatchPage() {
    const path = pageWin.location?.pathname || '';
    return path === '/watch' || path.startsWith('/live/');
  }

  function getWatchVideoKey(mp) {
    const loc = pageWin.location;
    if (!loc) return null;
    const urlVid =
      loc.pathname === '/watch' ? new URLSearchParams(loc.search || '').get('v') : loc.pathname;
    const dataVid =
      mp && typeof mp.getVideoData === 'function' ? mp.getVideoData()?.video_id || null : null;

    // Require URL video ID and player metadata to agree so stale SPA events do not misfire.
    if (loc.pathname === '/watch' && urlVid && dataVid && urlVid !== dataVid) {
      return null;
    }
    return urlVid || dataVid || null;
  }

  function isPlayerCurrentlyFullscreen(mp) {
    if (isDocumentFullscreen()) return true;
    return Boolean(mp && typeof mp.isFullscreen === 'function' && mp.isFullscreen());
  }

  function getWatchMoviePlayer(event) {
    const media = event?.target;
    if (!media || media.tagName !== 'VIDEO') return null;
    const mp = typeof media.closest === 'function' ? media.closest('.html5-video-player') : null;
    if (!mp || mp.id !== 'movie_player') return null;
    if (typeof mp.closest === 'function' && mp.closest('ytd-miniplayer')) return null;
    return { media, mp };
  }

  function setupWatchFullscreenAndComments() {
    let wasInFullscreen = isDocumentFullscreen();
    let savedPanelIds = [];
    let forceCommentsOnNextExit = false;
    let restoreTimers = [];

    let navTransitioning = false;
    let navResetTimer = null;
    let navSeq = 0;
    let pageDataNavSeq = -1;
    let navFinishSeq = -1;

    let handledCommentsOnPlayKey = null;
    let pendingCommentsOpenKey = null;
    let pendingCommentsConfirmKey = null;
    let pendingCommentsConfirmAt = 0;
    let commentsRetryTimer = null;
    let commentsRetryAttempt = 0;
    let waitingForPanelUpgrade = false;

    let handledAutoFsKey = null;
    let autoFsInFlight = false;

    let pauseConfirmTimer = null;
    let resumeFullscreenKey = null;
    let openedSidePanelInHtmlFs = false;

    function clearRestoreTimers() {
      for (const id of restoreTimers) clearTimeout(id);
      restoreTimers.length = 0;
    }

    function clearCommentsRetryTimer() {
      if (commentsRetryTimer !== null) {
        clearTimeout(commentsRetryTimer);
        commentsRetryTimer = null;
      }
      commentsRetryAttempt = 0;
    }

    function clearPauseConfirmTimer() {
      if (pauseConfirmTimer !== null) {
        clearTimeout(pauseConfirmTimer);
        pauseConfirmTimer = null;
      }
    }

    function ensureCommentsOpenNow() {
      const panel = getCommentsPanel();
      if (!panel) return 'missing';
      if (panel.getAttribute('visibility') === PANEL_EXPANDED) return 'expanded';
      if (typeof panel.showPanel === 'function') {
        panel.showPanel();
      }
      return panel.getAttribute('visibility') === PANEL_EXPANDED ? 'expanded' : 'pending';
    }

    function hideCommentsNow() {
      const panel = getCommentsPanel();
      if (!panel || panel.getAttribute('visibility') !== PANEL_EXPANDED) return;
      if (typeof panel.hidePanel === 'function') {
        panel.hidePanel();
      }
    }

    function markCommentsExpandedForPlay(videoKey) {
      handledCommentsOnPlayKey = videoKey;
      pendingCommentsOpenKey = null;
      clearCommentsRetryTimer();
      if (pageDataNavSeq !== navSeq || navFinishSeq !== navSeq) {
        // Confirm once after cold/SPA data and navigation finish so YouTube panel resets do not hide comments.
        pendingCommentsConfirmKey = videoKey;
        pendingCommentsConfirmAt = Date.now();
      }
    }

    function watchPanelElementUpgrade(videoKey) {
      if (waitingForPanelUpgrade) return;
      const registry = pageWin.customElements;
      if (!registry || typeof registry.whenDefined !== 'function') return;

      waitingForPanelUpgrade = true;
      registry
        .whenDefined('ytd-engagement-panel-section-list-renderer')
        .then(() => {
          waitingForPanelUpgrade = false;
          if (!settings.openCommentsOnPlay || isHtmlFullscreen() || !isWatchPage()) return;
          if (pendingCommentsOpenKey !== videoKey) return;
          if (getWatchVideoKey(pageDoc.getElementById('movie_player')) !== videoKey) return;
          if (ensureCommentsOpenNow() === 'expanded') {
            markCommentsExpandedForPlay(videoKey);
          }
        })
        .catch(() => {
          waitingForPanelUpgrade = false;
        });
    }

    function scheduleNextCommentsRetry(videoKey) {
      if (commentsRetryTimer !== null) return;
      if (commentsRetryAttempt >= COMMENT_OPEN_RETRY_DELAYS.length) return;

      const delay = COMMENT_OPEN_RETRY_DELAYS[commentsRetryAttempt++];
      commentsRetryTimer = setTimeout(() => {
        commentsRetryTimer = null;
        if (!settings.openCommentsOnPlay || isHtmlFullscreen() || !isWatchPage()) return;
        if (pendingCommentsOpenKey !== videoKey) return;
        if (getWatchVideoKey(pageDoc.getElementById('movie_player')) !== videoKey) return;

        const status = ensureCommentsOpenNow();
        if (status === 'expanded') {
          markCommentsExpandedForPlay(videoKey);
          return;
        }
        if (status === 'pending') {
          watchPanelElementUpgrade(videoKey);
        }
        scheduleNextCommentsRetry(videoKey);
      }, delay);
    }

    function scheduleCommentsOpenOnPlay(videoKey) {
      if (!settings.openCommentsOnPlay || videoKey === handledCommentsOnPlayKey) return;

      // In <html> fullscreen, defer opening until fullscreen exit so the side drawer doesn't shrink playback.
      if (isHtmlFullscreen()) {
        forceCommentsOnNextExit = true;
        handledCommentsOnPlayKey = videoKey;
        return;
      }

      const status = ensureCommentsOpenNow();
      if (status === 'expanded') {
        markCommentsExpandedForPlay(videoKey);
        return;
      }

      // Preserve any active stepped retry chain for this video instead of restarting backoff on 'playing'.
      if (pendingCommentsOpenKey !== videoKey) {
        clearCommentsRetryTimer();
        pendingCommentsOpenKey = videoKey;
      }
      if (status === 'pending') {
        watchPanelElementUpgrade(videoKey);
      }
      scheduleNextCommentsRetry(videoKey);
    }

    function checkActiveWatchPlaybackForComments() {
      if (!settings.openCommentsOnPlay || !isWatchPage() || isHtmlFullscreen()) return;
      const mp = pageDoc.getElementById('movie_player');
      if (!mp || mp.classList?.contains('ad-showing') || mp.classList?.contains('ad-interrupting')) {
        return;
      }
      const video = mp.querySelector?.('video');
      if (!video || video.paused || video.ended || !(Number(video.currentTime) > 0)) return;
      const videoKey = getWatchVideoKey(mp);
      if (videoKey && videoKey !== handledCommentsOnPlayKey) {
        scheduleCommentsOpenOnPlay(videoKey);
      }
    }

    function reconcileCommentsOnSettle() {
      if (!settings.openCommentsOnPlay || !isWatchPage() || isHtmlFullscreen()) return;

      const mp = pageDoc.getElementById('movie_player');
      const videoKey = getWatchVideoKey(mp);
      if (!videoKey) return;

      if (pendingCommentsOpenKey === videoKey) {
        const status = ensureCommentsOpenNow();
        if (status === 'expanded') {
          markCommentsExpandedForPlay(videoKey);
        } else {
          if (status === 'pending') {
            watchPanelElementUpgrade(videoKey);
          }
          // Keep pending state and stepped retries active when panels stamp after this event fires.
          scheduleNextCommentsRetry(videoKey);
        }
        return;
      }

      if (
        pendingCommentsConfirmKey === videoKey &&
        Date.now() - pendingCommentsConfirmAt < COMMENTS_CONFIRM_WINDOW_MS
      ) {
        const status = ensureCommentsOpenNow();
        if (status === 'expanded') {
          handledCommentsOnPlayKey = videoKey;
          if (pageDataNavSeq === navSeq && navFinishSeq === navSeq) {
            pendingCommentsConfirmKey = null;
          }
        } else {
          pendingCommentsConfirmKey = null;
          pendingCommentsOpenKey = videoKey;
          commentsRetryAttempt = 0;
          if (status === 'pending') {
            watchPanelElementUpgrade(videoKey);
          }
          scheduleNextCommentsRetry(videoKey);
        }
        return;
      }

      checkActiveWatchPlaybackForComments();
    }

    function onPageDataUpdated() {
      pageDataNavSeq = navSeq;
      reconcileCommentsOnSettle();
    }

    function onNavigateFinish() {
      navFinishSeq = navSeq;
      reconcileCommentsOnSettle();
    }

    function onFullscreenChangeCapture() {
      const inFullscreen = isDocumentFullscreen();
      if (inFullscreen === wasInFullscreen) return;

      if (inFullscreen) {
        wasInFullscreen = true;
        clearRestoreTimers();
        clearPauseConfirmTimer();
        savedPanelIds = getExpandedPanelIds();
        resumeFullscreenKey = null;
        openedSidePanelInHtmlFs = false;

        if (isWatchPage()) {
          const mp = pageDoc.getElementById('movie_player');
          const key = getWatchVideoKey(mp);
          if (key) {
            handledAutoFsKey = key;
          }
        }
        return;
      }

      wasInFullscreen = false;
      openedSidePanelInHtmlFs = false;
      syncDirectFullscreen();

      const includeForcedComments = forceCommentsOnNextExit;
      forceCommentsOnNextExit = false;

      // Restore panels that were open before entering fullscreen, plus any deferred comments request.
      const toRestore = includeForcedComments
        ? savedPanelIds.includes(COMMENTS_PANEL_ID)
          ? [...savedPanelIds]
          : [...savedPanelIds, COMMENTS_PANEL_ID]
        : [...savedPanelIds];
      savedPanelIds = [];

      if (toRestore.length === 0) return;

      clearRestoreTimers();
      let remainingIds = toRestore;
      restoreTimers.push(
        setTimeout(() => {
          remainingIds = restorePanelsByIds(remainingIds);
          if (remainingIds.length > 0) {
            restoreTimers.push(
              setTimeout(() => {
                restorePanelsByIds(remainingIds);
              }, 160)
            );
          }
        }, 60)
      );
    }

    function attemptEnterFullscreen(mp, videoKey) {
      if (autoFsInFlight || isPlayerCurrentlyFullscreen(mp)) return;

      const userActivation = pageWin.navigator?.userActivation;
      if (userActivation && !userActivation.isActive) return;

      autoFsInFlight = true;
      let actionResult;
      try {
        if (typeof mp.toggleFullscreen === 'function') {
          actionResult = mp.toggleFullscreen();
        } else if (typeof mp.requestFullscreen === 'function') {
          actionResult = mp.requestFullscreen();
        }
      } catch {
        autoFsInFlight = false;
        return;
      }

      Promise.resolve(actionResult)
        .catch(() => {})
        .finally(() => {
          autoFsInFlight = false;
          if (isPlayerCurrentlyFullscreen(mp)) {
            handledAutoFsKey = videoKey;
            if (resumeFullscreenKey === videoKey) {
              resumeFullscreenKey = null;
            }
          }
        });
    }

    function onMediaPlay(event) {
      const media = event?.target;
      if (!media || media.tagName !== 'VIDEO' || media.paused) return;

      if (
        !navTransitioning &&
        pauseConfirmTimer === null &&
        !openedSidePanelInHtmlFs &&
        !resumeFullscreenKey &&
        !settings.openCommentsOnPlay &&
        !settings.autoFullscreenOnPlay
      ) {
        return;
      }

      if (!isWatchPage()) return;

      const target = getWatchMoviePlayer(event);
      if (!target) return;

      const { mp } = target;
      const videoKey = getWatchVideoKey(mp);
      if (!videoKey) return;

      navTransitioning = false;
      if (navResetTimer !== null) {
        clearTimeout(navResetTimer);
        navResetTimer = null;
      }
      clearPauseConfirmTimer();

      // Close the pause-triggered side drawer when resuming playback inside <html> fullscreen.
      if (openedSidePanelInHtmlFs && isHtmlFullscreen()) {
        openedSidePanelInHtmlFs = false;
        hideCommentsNow();
      }

      if (settings.openCommentsOnPlay && videoKey !== handledCommentsOnPlayKey) {
        scheduleCommentsOpenOnPlay(videoKey);
      }

      const isPauseResume =
        settings.openCommentsOnFullscreenPause && resumeFullscreenKey === videoKey;
      const isInitialAutoFs = settings.autoFullscreenOnPlay && videoKey !== handledAutoFsKey;

      if (isPauseResume || isInitialAutoFs) {
        attemptEnterFullscreen(mp, videoKey);
      }
    }

    function onMediaPause(event) {
      if (!settings.openCommentsOnFullscreenPause || navTransitioning) return;
      if (!isWatchPage()) return;

      const media = event?.target;
      if (!media || media.tagName !== 'VIDEO' || !media.paused || media.ended || media.seeking) {
        return;
      }

      const target = getWatchMoviePlayer(event);
      if (!target) return;

      const { mp } = target;
      if (!isPlayerCurrentlyFullscreen(mp)) return;

      const playerState = typeof mp.getPlayerState === 'function' ? mp.getPlayerState() : 1;
      // Ignore synthetic pause events emitted while queueing (5) or ending (0).
      if (playerState === 5 || playerState === 0) return;

      const videoKey = getWatchVideoKey(mp);
      if (!videoKey) return;

      clearPauseConfirmTimer();
      pauseConfirmTimer = setTimeout(() => {
        pauseConfirmTimer = null;
        if (!settings.openCommentsOnFullscreenPause || navTransitioning || !isWatchPage()) return;
        if (!media.paused || media.ended || media.seeking) return;
        if (!isPlayerCurrentlyFullscreen(mp)) return;
        if (getWatchVideoKey(mp) !== videoKey) return;

        // In <html> fullscreen, open the right-hand side comments panel without exiting fullscreen.
        if (isHtmlFullscreen()) {
          const panel = getCommentsPanel();
          if (panel && panel.getAttribute('visibility') !== PANEL_EXPANDED) {
            if (ensureCommentsOpenNow() === 'expanded') {
              openedSidePanelInHtmlFs = true;
            }
          }
          return;
        }

        // In player-only fullscreen, Top Layer hides DOM panels, so exit fullscreen and open comments.
        forceCommentsOnNextExit = true;
        resumeFullscreenKey = videoKey;
        Promise.resolve(exitActiveFullscreen(mp)).catch(() => {});
      }, 30);
    }

    function onMediaEnded(event) {
      if (
        !settings.autoFullscreenOnPlay &&
        !settings.openCommentsOnPlay &&
        !resumeFullscreenKey
      ) {
        return;
      }
      if (!isWatchPage()) return;

      const target = getWatchMoviePlayer(event);
      if (!target) return;
      const { mp } = target;
      if (mp.classList?.contains('ad-showing') || mp.classList?.contains('ad-interrupting')) return;

      // Reset per-video state so replaying the video can re-trigger play automation.
      handledAutoFsKey = null;
      handledCommentsOnPlayKey = null;
      pendingCommentsOpenKey = null;
      pendingCommentsConfirmKey = null;
      resumeFullscreenKey = null;
    }

    function onNavigateStart() {
      navSeq += 1;
      navTransitioning = true;

      if (navResetTimer !== null) clearTimeout(navResetTimer);
      navResetTimer = setTimeout(() => {
        navTransitioning = false;
        navResetTimer = null;
      }, 1500);

      clearRestoreTimers();
      clearCommentsRetryTimer();
      clearPauseConfirmTimer();

      handledAutoFsKey = null;
      handledCommentsOnPlayKey = null;
      pendingCommentsOpenKey = null;
      pendingCommentsConfirmKey = null;
      autoFsInFlight = false;
      resumeFullscreenKey = null;
      openedSidePanelInHtmlFs = false;

      if (!isDocumentFullscreen()) {
        savedPanelIds = [];
        forceCommentsOnNextExit = false;
      }
    }

    if ('onfullscreenchange' in pageWin || 'onfullscreenchange' in pageDoc) {
      pageWin.addEventListener('fullscreenchange', onFullscreenChangeCapture, true);
    } else {
      pageWin.addEventListener('fullscreenchange', onFullscreenChangeCapture, true);
      pageWin.addEventListener('webkitfullscreenchange', onFullscreenChangeCapture, true);
    }
    pageDoc.addEventListener('play', onMediaPlay, true);
    pageDoc.addEventListener('playing', onMediaPlay, true);
    pageDoc.addEventListener('pause', onMediaPause, true);
    pageDoc.addEventListener('ended', onMediaEnded, true);
    pageWin.addEventListener('yt-navigate-start', onNavigateStart);
    pageWin.addEventListener('yt-navigate-finish', onNavigateFinish);
    pageWin.addEventListener('yt-page-data-updated', onPageDataUpdated);

    if (pageDoc.readyState === 'loading') {
      pageDoc.addEventListener('DOMContentLoaded', checkActiveWatchPlaybackForComments, { once: true });
    } else {
      checkActiveWatchPlaybackForComments();
    }
  }

  // ---------------------------------------------------------------------------
  // Settings Modal UI (Trusted Types Safe: DOM APIs Only, Zero innerHTML)
  // ---------------------------------------------------------------------------

  function buildUiStylesheetText() {
    return `
      #${MODAL_BACKDROP_ID} {
        --ynz-bg: #ffffff;
        --ynz-surface-raised: #f4f4f5;
        --ynz-surface-active: #ffffff;
        --ynz-text: #171717;
        --ynz-sub: #525252;
        --ynz-muted: #737373;
        --ynz-border: rgba(23, 23, 23, 0.08);
        --ynz-border-strong: rgba(23, 23, 23, 0.14);
        --ynz-hover: rgba(23, 23, 23, 0.05);
        --ynz-hover-strong: rgba(23, 23, 23, 0.09);
        --ynz-switch-off: rgba(23, 23, 23, 0.22);
        --ynz-thumb: #ffffff;
        --ynz-thumb-checked: #ffffff;
        --ynz-accent: #065fd4;
        --ynz-card-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        --ynz-segment-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        background: rgba(0, 0, 0, 0.44);
        font-family: "YouTube Sans", "Roboto", system-ui, -apple-system, "Segoe UI", sans-serif;
        color: var(--ynz-text);
      }
      html[dark] #${MODAL_BACKDROP_ID} {
        --ynz-bg: #19191b;
        --ynz-surface-raised: #232325;
        --ynz-surface-active: #2e2e32;
        --ynz-text: #ededed;
        --ynz-sub: #a1a1a6;
        --ynz-muted: #85858b;
        --ynz-border: rgba(237, 237, 237, 0.08);
        --ynz-border-strong: rgba(237, 237, 237, 0.14);
        --ynz-hover: rgba(237, 237, 237, 0.06);
        --ynz-hover-strong: rgba(237, 237, 237, 0.11);
        --ynz-switch-off: rgba(237, 237, 237, 0.22);
        --ynz-thumb: #ededed;
        --ynz-thumb-checked: #19191b;
        --ynz-accent: #3ea6ff;
        --ynz-card-shadow: 0 4px 16px rgba(0, 0, 0, 0.36);
        --ynz-segment-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
        background: rgba(0, 0, 0, 0.64);
      }
      #${MODAL_BACKDROP_ID}[hidden] {
        display: none;
      }
      .yt-no-zoom-card * {
        box-sizing: border-box;
      }
      .yt-no-zoom-card {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 464px;
        max-height: calc(100vh - 32px);
        background: var(--ynz-bg);
        color: var(--ynz-text);
        border: 1px solid var(--ynz-border);
        border-radius: 16px;
        box-shadow: var(--ynz-card-shadow);
        overflow: hidden;
      }
      .yt-no-zoom-header {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 16px 20px;
        border-bottom: 1px solid var(--ynz-border);
      }
      .yt-no-zoom-title {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
        line-height: 24px;
      }
      .yt-no-zoom-close {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        padding: 0;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: var(--ynz-muted);
        cursor: pointer;
        transition:
          background-color 150ms cubic-bezier(0.22, 1, 0.36, 1),
          color 150ms cubic-bezier(0.22, 1, 0.36, 1),
          transform 120ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      .yt-no-zoom-close:hover {
        background: var(--ynz-hover);
        color: var(--ynz-text);
      }
      .yt-no-zoom-close:active {
        transform: scale(0.96);
      }
      .yt-no-zoom-close:focus-visible {
        outline: 2px solid var(--ynz-accent);
        outline-offset: 2px;
      }
      .yt-no-zoom-body {
        flex: 1 1 auto;
        overflow-y: auto;
        padding: 20px;
      }
      .yt-no-zoom-section {
        padding-bottom: 16px;
        margin-bottom: 16px;
        border-bottom: 1px solid var(--ynz-border);
      }
      .yt-no-zoom-section:last-child {
        padding-bottom: 0;
        margin-bottom: 0;
        border-bottom: none;
      }
      .yt-no-zoom-section-title {
        margin: 0 0 8px 0;
        font-size: 12px;
        font-weight: 500;
        line-height: 16px;
        letter-spacing: 0.01em;
        color: var(--ynz-muted);
      }
      .yt-no-zoom-subgroup {
        margin: 8px 0 0 4px;
        padding-left: 12px;
        border-left: 2px solid var(--ynz-border-strong);
      }
      .yt-no-zoom-subgroup-title {
        margin: 0 0 4px 0;
        font-size: 12px;
        font-weight: 500;
        line-height: 16px;
        color: var(--ynz-muted);
      }
      .yt-no-zoom-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin: 0 -8px;
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        transition: background-color 150ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      .yt-no-zoom-row + .yt-no-zoom-row {
        margin-top: 4px;
      }
      .yt-no-zoom-row:hover {
        background: var(--ynz-hover);
      }
      .yt-no-zoom-row-text {
        flex: 1 1 auto;
        min-width: 0;
      }
      .yt-no-zoom-row-label {
        display: block;
        font-size: 14px;
        font-weight: 500;
        line-height: 20px;
        color: var(--ynz-text);
      }
      .yt-no-zoom-row-desc {
        display: block;
        margin-top: 4px;
        font-size: 13px;
        font-weight: 400;
        line-height: 18px;
        color: var(--ynz-sub);
      }
      .yt-no-zoom-switch {
        position: relative;
        flex: 0 0 auto;
        width: 36px;
        height: 20px;
      }
      .yt-no-zoom-switch input {
        position: absolute;
        inset: 0;
        margin: 0;
        opacity: 0;
        cursor: pointer;
      }
      .yt-no-zoom-slider {
        position: absolute;
        inset: 0;
        border-radius: 999px;
        background: var(--ynz-switch-off);
        transition: background-color 150ms cubic-bezier(0.22, 1, 0.36, 1);
        pointer-events: none;
      }
      .yt-no-zoom-slider::after {
        content: "";
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--ynz-thumb);
        transition:
          transform 150ms cubic-bezier(0.22, 1, 0.36, 1),
          background-color 150ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      .yt-no-zoom-switch input:checked + .yt-no-zoom-slider {
        background: var(--ynz-accent);
      }
      .yt-no-zoom-switch input:checked + .yt-no-zoom-slider::after {
        background: var(--ynz-thumb-checked);
        transform: translateX(16px);
      }
      .yt-no-zoom-switch input:focus-visible + .yt-no-zoom-slider {
        outline: 2px solid var(--ynz-accent);
        outline-offset: 2px;
      }
      .yt-no-zoom-row-stacked {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
        padding: 4px 0 0 0;
      }
      .yt-no-zoom-lang-group {
        display: flex;
        flex-wrap: wrap;
        padding: 4px;
        gap: 4px;
        border-radius: 12px;
        background: var(--ynz-surface-raised);
        box-shadow: inset 0 0 0 1px var(--ynz-border);
      }
      .yt-no-zoom-lang-btn {
        flex: 1 1 0;
        min-height: 32px;
        border: none;
        border-radius: 8px;
        padding: 8px;
        font-family: inherit;
        font-size: 13px;
        font-weight: 500;
        line-height: 16px;
        cursor: pointer;
        background: transparent;
        color: var(--ynz-sub);
        transition:
          background-color 150ms cubic-bezier(0.22, 1, 0.36, 1),
          color 150ms cubic-bezier(0.22, 1, 0.36, 1),
          transform 120ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      .yt-no-zoom-lang-btn:hover {
        color: var(--ynz-text);
      }
      .yt-no-zoom-lang-btn:active {
        transform: scale(0.98);
      }
      .yt-no-zoom-lang-btn[aria-checked="true"] {
        background: var(--ynz-surface-active);
        color: var(--ynz-accent);
        box-shadow: var(--ynz-segment-shadow);
      }
      .yt-no-zoom-lang-btn:focus-visible {
        outline: 2px solid var(--ynz-accent);
        outline-offset: 2px;
      }
      .yt-no-zoom-footer {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 12px 20px;
        border-top: 1px solid var(--ynz-border);
        font-size: 12px;
        line-height: 16px;
        color: var(--ynz-muted);
      }
      .yt-no-zoom-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 32px;
        border: 1px solid var(--ynz-border);
        border-radius: 8px;
        padding: 0 16px;
        font-family: inherit;
        font-size: 13px;
        font-weight: 500;
        line-height: 16px;
        cursor: pointer;
        background: var(--ynz-surface-raised);
        color: var(--ynz-text);
        transition:
          background-color 150ms cubic-bezier(0.22, 1, 0.36, 1),
          transform 120ms cubic-bezier(0.22, 1, 0.36, 1);
      }
      .yt-no-zoom-btn:hover {
        background: var(--ynz-hover-strong);
      }
      .yt-no-zoom-btn:active {
        transform: scale(0.98);
      }
      .yt-no-zoom-btn:focus-visible {
        outline: 2px solid var(--ynz-accent);
        outline-offset: 2px;
      }
    `;
  }

  function createCloseIconSvg() {
    if (typeof pageDoc.createElementNS !== 'function') {
      return null;
    }
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const svg = pageDoc.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('width', '16');
    svg.setAttribute('height', '16');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');

    const path = pageDoc.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', 'M4 4L12 12M12 4L4 12');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.5');
    path.setAttribute('stroke-linecap', 'round');

    svg.appendChild(path);
    return svg;
  }

  function createToggleRowElement(key, uiRefs) {
    const row = pageDoc.createElement('label');
    row.className = 'yt-no-zoom-row';

    const textBox = pageDoc.createElement('span');
    textBox.className = 'yt-no-zoom-row-text';

    const labelEl = pageDoc.createElement('span');
    labelEl.className = 'yt-no-zoom-row-label';

    const descEl = pageDoc.createElement('span');
    descEl.className = 'yt-no-zoom-row-desc';

    textBox.appendChild(labelEl);
    textBox.appendChild(descEl);

    const switchBox = pageDoc.createElement('span');
    switchBox.className = 'yt-no-zoom-switch';

    const input = pageDoc.createElement('input');
    input.type = 'checkbox';
    input.checked = Boolean(settings[key]);
    input.addEventListener('change', () => {
      saveSettings({ [key]: input.checked });
      syncAll();
    });

    const slider = pageDoc.createElement('span');
    slider.className = 'yt-no-zoom-slider';

    switchBox.appendChild(input);
    switchBox.appendChild(slider);

    row.appendChild(textBox);
    row.appendChild(switchBox);

    uiRefs.checkboxMap.set(key, input);
    uiRefs.itemTextNodes.set(key, { labelEl, descEl });
    return row;
  }

  function createSettingSectionElement(group, uiRefs) {
    const section = pageDoc.createElement('section');
    section.className = 'yt-no-zoom-section';

    const sectionTitle = pageDoc.createElement('h3');
    sectionTitle.className = 'yt-no-zoom-section-title';
    section.appendChild(sectionTitle);
    uiRefs.sectionTitles.set(group.id, sectionTitle);

    for (const key of group.itemKeys) {
      section.appendChild(createToggleRowElement(key, uiRefs));
    }

    if (group.subGroup) {
      const subWrap = pageDoc.createElement('div');
      subWrap.className = 'yt-no-zoom-subgroup';

      const subTitle = pageDoc.createElement('div');
      subTitle.className = 'yt-no-zoom-subgroup-title';
      subWrap.appendChild(subTitle);
      uiRefs.subGroupTitles.set(group.subGroup.id, subTitle);

      for (const key of group.subGroup.itemKeys) {
        subWrap.appendChild(createToggleRowElement(key, uiRefs));
      }
      section.appendChild(subWrap);
    }

    return section;
  }

  function createLanguageSectionElement(uiRefs) {
    const section = pageDoc.createElement('section');
    section.className = 'yt-no-zoom-section';

    const sectionTitle = pageDoc.createElement('h3');
    sectionTitle.className = 'yt-no-zoom-section-title';
    section.appendChild(sectionTitle);
    uiRefs.sectionTitles.set('language', sectionTitle);

    const row = pageDoc.createElement('div');
    row.className = 'yt-no-zoom-row-stacked';

    const textBox = pageDoc.createElement('div');
    textBox.className = 'yt-no-zoom-row-text';

    const langLabelEl = pageDoc.createElement('span');
    langLabelEl.className = 'yt-no-zoom-row-label';

    const langDescEl = pageDoc.createElement('span');
    langDescEl.className = 'yt-no-zoom-row-desc';

    textBox.appendChild(langLabelEl);
    textBox.appendChild(langDescEl);

    const groupEl = pageDoc.createElement('div');
    groupEl.className = 'yt-no-zoom-lang-group';
    groupEl.setAttribute('role', 'radiogroup');

    for (const opt of LANGUAGE_OPTIONS) {
      const btn = pageDoc.createElement('button');
      btn.type = 'button';
      btn.className = 'yt-no-zoom-lang-btn';
      btn.setAttribute('role', 'radio');
      if (opt.fixedLabel) {
        btn.textContent = opt.fixedLabel;
      }
      btn.addEventListener('click', () => {
        if (settings.language === opt.value) return;
        saveSettings({ language: opt.value });
        refreshSettingsModalUI();
      });
      groupEl.appendChild(btn);
      uiRefs.langButtons.push({ value: opt.value, fixedLabel: opt.fixedLabel, btn });
    }

    row.appendChild(textBox);
    row.appendChild(groupEl);
    section.appendChild(row);

    uiRefs.langLabelEl = langLabelEl;
    uiRefs.langDescEl = langDescEl;
    uiRefs.langGroupEl = groupEl;
    return section;
  }

  let modalState = null;

  function refreshSettingsModalUI() {
    if (!modalState) return;
    const bundle = getLocaleBundle();
    const detected = detectSystemLocale();

    modalState.card.setAttribute('aria-label', bundle.modalTitle);
    modalState.heading.textContent = bundle.modalTitle;
    modalState.closeIconBtn.setAttribute('aria-label', bundle.closeLabel);
    modalState.hint.textContent = bundle.footerHint;
    modalState.closeBtn.textContent = bundle.closeLabel;

    for (const [sectionId, titleEl] of modalState.sectionTitles.entries()) {
      titleEl.textContent = bundle.sections[sectionId] || '';
    }
    for (const [subGroupId, subTitleEl] of modalState.subGroupTitles.entries()) {
      subTitleEl.textContent = bundle.subGroups[subGroupId] || '';
    }
    for (const [key, nodes] of modalState.itemTextNodes.entries()) {
      const text = bundle.items[key];
      if (!text) continue;
      nodes.labelEl.textContent = text.label;
      nodes.descEl.textContent = text.description;
    }
    for (const [key, checkbox] of modalState.checkboxMap.entries()) {
      checkbox.checked = Boolean(settings[key]);
    }

    modalState.langLabelEl.textContent = bundle.languageRow.label;
    modalState.langDescEl.textContent = bundle.languageRow.description(detected);
    modalState.langGroupEl.setAttribute('aria-label', bundle.languageRow.label);
    for (const entry of modalState.langButtons) {
      if (!entry.fixedLabel) {
        entry.btn.textContent = bundle.languageRow.autoOption;
      }
      entry.btn.setAttribute('aria-checked', settings.language === entry.value ? 'true' : 'false');
    }
  }

  function onModalKeyDown(event) {
    if (event.key === 'Escape' && modalState && !modalState.backdrop.hidden) {
      closeSettingsModal();
    }
  }

  function closeSettingsModal() {
    if (!modalState) return;
    modalState.backdrop.hidden = true;
    pageWin.removeEventListener?.('keydown', onModalKeyDown, true);
  }

  function ensureSettingsModal() {
    if (modalState && modalState.backdrop.isConnected) {
      return modalState;
    }

    const existingBackdrop = pageDoc.getElementById(MODAL_BACKDROP_ID);
    if (existingBackdrop) existingBackdrop.remove();

    upsertStyleElement(UI_STYLE_ID, buildUiStylesheetText());

    const backdrop = pageDoc.createElement('div');
    backdrop.id = MODAL_BACKDROP_ID;
    backdrop.hidden = true;

    const card = pageDoc.createElement('div');
    card.className = 'yt-no-zoom-card';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');

    const header = pageDoc.createElement('div');
    header.className = 'yt-no-zoom-header';

    const heading = pageDoc.createElement('h2');
    heading.className = 'yt-no-zoom-title';

    const closeIconBtn = pageDoc.createElement('button');
    closeIconBtn.type = 'button';
    closeIconBtn.className = 'yt-no-zoom-close';
    const closeSvg = createCloseIconSvg();
    if (closeSvg) {
      closeIconBtn.appendChild(closeSvg);
    } else {
      closeIconBtn.textContent = '×';
    }
    closeIconBtn.addEventListener('click', closeSettingsModal);

    header.appendChild(heading);
    header.appendChild(closeIconBtn);

    const body = pageDoc.createElement('div');
    body.className = 'yt-no-zoom-body';

    const uiRefs = {
      checkboxMap: new Map(),
      sectionTitles: new Map(),
      subGroupTitles: new Map(),
      itemTextNodes: new Map(),
      langLabelEl: null,
      langDescEl: null,
      langGroupEl: null,
      langButtons: [],
    };
    for (const group of SETTING_GROUPS) {
      body.appendChild(createSettingSectionElement(group, uiRefs));
    }
    body.appendChild(createLanguageSectionElement(uiRefs));

    const footer = pageDoc.createElement('div');
    footer.className = 'yt-no-zoom-footer';

    const hint = pageDoc.createElement('span');

    const closeBtn = pageDoc.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'yt-no-zoom-btn';
    closeBtn.addEventListener('click', closeSettingsModal);

    footer.appendChild(hint);
    footer.appendChild(closeBtn);

    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(footer);
    backdrop.appendChild(card);

    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) {
        closeSettingsModal();
      }
    });

    const mountHost = pageDoc.fullscreenElement || pageDoc.body || pageDoc.documentElement;
    mountHost.appendChild(backdrop);

    modalState = {
      backdrop,
      card,
      heading,
      closeIconBtn,
      hint,
      closeBtn,
      ...uiRefs,
    };
    refreshSettingsModalUI();
    return modalState;
  }

  function openSettingsModal() {
    const show = () => {
      const state = ensureSettingsModal();
      refreshSettingsModalUI();
      const preferredHost = pageDoc.fullscreenElement || pageDoc.body || pageDoc.documentElement;
      if (preferredHost && state.backdrop.parentElement !== preferredHost) {
        preferredHost.appendChild(state.backdrop);
      }
      state.backdrop.hidden = false;
      // Attach Escape handler only while modal is open to avoid idle keystroke overhead.
      pageWin.removeEventListener?.('keydown', onModalKeyDown, true);
      pageWin.addEventListener('keydown', onModalKeyDown, true);
      state.closeIconBtn.focus();
    };

    if (!pageDoc.body && pageDoc.readyState === 'loading') {
      pageDoc.addEventListener('DOMContentLoaded', show, { once: true });
      return;
    }
    show();
  }

  // ---------------------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------------------

  function registerTampermonkeyMenu() {
    if (typeof GM_registerMenuCommand !== 'function') return;
    GM_registerMenuCommand(getLocaleBundle().menuSettings, openSettingsModal);
  }

  function syncAll() {
    syncFeatureStylesheet();
    syncDirectFullscreen();
  }

  installConfigAndPlayerHooks();
  hookMatchMedia();
  setupWatchFullscreenAndComments();
  registerTampermonkeyMenu();
  syncAll();

  if (pageDoc.readyState === 'loading') {
    pageDoc.addEventListener('DOMContentLoaded', syncAll, { once: true });
  }
  pageWin.addEventListener('yt-navigate-finish', syncDirectFullscreen);
})();
