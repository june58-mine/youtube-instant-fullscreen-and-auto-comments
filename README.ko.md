[English](./README.md) · **한국어** · [日本語](./README.ja.md) · [简体中文](./README.zh-CN.md)

# YouTube 즉시 전체화면 & 자동 댓글창

**YouTube Instant Fullscreen & Auto Comments**

YouTube 전체화면 전환 시 확대 효과가 부자연스럽게 끊기는 현상을 제거하고, 댓글창 애니메이션 비활성화 및 영상 재생·전체화면 일시정지 시 댓글창 자동 열기를 지원하는 유저스크립트입니다.

- **버전:** `1.9.0`
- **작성자:** [`june58-mine`](https://github.com/june58-mine)
- **라이선스:** `MIT`
- **대상 사이트:** `https://www.youtube.com/*`
- **스크립트 파일:** [`youtube-instant-fullscreen-and-auto-comments.user.js`](./youtube-instant-fullscreen-and-auto-comments.user.js)

---

## 주요 기능

### 전체화면 (Fullscreen)

- **전체화면 중간 크기 단계 제거** (`기본값: 켜짐`)
  - YouTube의 `external_fullscreen` 및 `externalFullscreen` 설정을 비활성화해 영상을 전체화면으로 전환할 때 확대 효과가 부자연스럽게 끊기는 현상을 제거합니다.
  - 전체화면 진입 전에 열어 두었던 패널(댓글창, 실시간 채팅, 스크립트 등)은 전체화면을 해제할 때 원래 상태로 자동 복원됩니다.
- **영상 재생 시 자동 전체화면** (`기본값: 꺼짐`)
  - 시청 페이지(`/watch`, `/live/*`)에서 영상 재생이 시작될 때 자동으로 전체화면으로 전환합니다. (영상이 끝나거나 다시 재생하기 전까지 영상당 한 번만 실행)
  - 브라우저 정책(`navigator.userActivation`)에 따라 클릭·키 입력 등 사용자 동작이 수반된 재생에서 작동합니다.

### 댓글창 (Comments)

- **댓글창 애니메이션 제거** (`기본값: 켜짐`)
  - 댓글창과 사이드 패널을 열고 닫을 때의 슬라이드·리사이즈·View Transition 애니메이션을 제거합니다. (`watch-flexy`, `watch-grid`, `watch-learning-journey` 레이아웃 지원)
  - `window.matchMedia`의 `prefers-reduced-motion` 쿼리를 훅킹하고 CSS 지속 시간을 `0.001ms`로 설정해, YouTube 내부의 `transitionend` / `animationend` 완료 이벤트가 깨지지 않도록 처리합니다.
- **영상 재생 시작 시 댓글창 열기** (`기본값: 켜짐`)
  - 시청 페이지에서 재생이 시작되면 댓글 패널(`engagement-panel-comments-section`)을 자동으로 열고, SPA 데이터 갱신(`yt-page-data-updated`) 시 패널 상태가 초기화되지 않도록 다시 확인합니다.
  - `<html>` 전체화면 상태에서는 재생 화면이 좁아지지 않도록 전체화면 해제 시점까지 열기를 보류합니다.
- **전체화면에서 일시정지 시 댓글창 열기** (`기본값: 꺼짐`)
  - 전체화면 중 일시정지하면 상황에 맞게 댓글창을 엽니다:
    - **플레이어 단독 전체화면** (기본 모드): 전체화면을 잠시 해제해 댓글창을 보여주고, 다시 재생하면 자동으로 전체화면에 재진입합니다.
    - **`<html>` 전체화면** (중간 단계 제거 옵션을 끈 경우): 전체화면을 유지한 채 우측 사이드 댓글창을 열고, 다시 재생하면 닫습니다.
  - 대기열 전환·재생 종료 시 발생하는 인위적인 pause 신호(`playerState` 5/0)는 무시하고 `30ms` 디바운스를 적용해 오동작을 막습니다.

### 설정 UI 및 다국어 지원

- 유저스크립트 확장 프로그램 메뉴(`설정`)에서 설정 모달을 바로 열 수 있으며, YouTube 라이트/다크 테마(`html[dark]`)에 맞춰 자동으로 색상이 적용됩니다.
- 브라우저 시스템 언어를 감지해 `한국어`, `English`, `日本語`, `中文` 중 하나로 표시하며(미지원 언어는 `English` 기본값), 모달 내 언어 전환 버튼(`시스템`, `English`, `한국어`, `日本語`, `中文`)을 누르면 새로고침 없이 즉시 반영됩니다.

---

## 설치 방법

1. 브라우저에 유저스크립트 관리 확장 프로그램을 설치합니다.
   - [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Edge, Firefox, Safari)
   - [Violentmonkey](https://violentmonkey.github.io/) (Chrome, Edge, Firefox)
2. 이 저장소의 [`youtube-instant-fullscreen-and-auto-comments.user.js`](./youtube-instant-fullscreen-and-auto-comments.user.js) 파일을 열고 **Raw** 버튼을 클릭합니다.
   - 확장 프로그램이 설치 화면을 자동으로 띄우면 **설치**를 누릅니다.
   - 또는 확장 프로그램 대시보드에서 새 스크립트를 만든 뒤 파일 내용을 그대로 붙여넣어 저장해도 됩니다.
3. YouTube(`https://www.youtube.com/`) 페이지를 새로고침합니다.
4. 브라우저 툴바의 확장 프로그램 아이콘 → **`설정`** 메뉴를 눌러 원하는 옵션을 켜거나 끕니다. 변경 사항은 즉시 저장 및 적용됩니다.

> [!TIP]
> 다음 Raw 링크로 바로 원클릭 설치할 수 있습니다: [`https://github.com/june58-mine/youtube-instant-fullscreen-and-auto-comments/raw/main/youtube-instant-fullscreen-and-auto-comments.user.js`](https://github.com/june58-mine/youtube-instant-fullscreen-and-auto-comments/raw/main/youtube-instant-fullscreen-and-auto-comments.user.js)

---

## 기본 설정표

| 구분 | 설정 항목 | 내부 키 | 기본값 |
| :--- | :--- | :--- | :---: |
| **전체화면** | 전체화면 중간 크기 단계 제거 | `directFullscreen` | **켜짐 (`true`)** |
| **전체화면** | 영상 재생 시 자동 전체화면 | `autoFullscreenOnPlay` | 꺼짐 (`false`) |
| **댓글창** | 댓글창 애니메이션 제거 | `disableCommentsAnimation` | **켜짐 (`true`)** |
| **댓글창 → 자동 열기** | 영상 재생 시작 시 댓글창 열기 | `openCommentsOnPlay` | **켜짐 (`true`)** |
| **댓글창 → 자동 열기** | 전체화면에서 일시정지 시 댓글창 열기 | `openCommentsOnFullscreenPause` | 꺼짐 (`false`) |
| **언어** | 표시 언어 | `language` | `'auto'` (`시스템`) |

---

## 기술 및 호환성 참고

- **`@run-at document-start` 실행**: 플레이어가 초기화되기 전에 `ytcfg`, `ytplayer`, `yt.player.Application`, `matchMedia`를 선점해 전환 단계가 발생하기 전에 설정을 주입합니다.
- **Trusted Types CSP 준수**: YouTube의 엄격한 보안 정책 환경에서도 오류가 나지 않도록 `innerHTML`을 전혀 쓰지 않고 DOM API와 `textContent`만으로 UI와 스타일시트를 구성합니다.
- **성능 영향 최소화**: 미디어 이벤트(`play`, `playing`, `pause`, `ended`) 앞단에 O(1) 조기 반환 가드를 두고, `Escape` 키 리스너는 설정 창이 열린 동안에만 등록하며, 상시 DOM 감시(MutationObserver) 대신 `yt-page-data-updated` 이벤트를 사용합니다.
- **설정 데이터 호환성**: `GM_setValue` / `GM_getValue`(미지원 시 `localStorage`)의 `yt_no_zoom_animation_settings_v2` 키에 저장되며, 기존 `v1` 설정이 있으면 자동으로 마이그레이션합니다.

---

## 라이선스

스크립트 헤더(`@license MIT`)에 명시된 **MIT License**에 따라 배포됩니다.
