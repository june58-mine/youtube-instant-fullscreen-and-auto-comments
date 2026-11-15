<div align="center">

[English](./README.md) · **한국어** · [日本語](./README.ja.md) · [简体中文](./README.zh-CN.md)

# YouTube 즉시 전체화면 & 자동 댓글창

**YouTube Instant Fullscreen & Auto Comments**

유튜브 전체화면 전환 시 화면이 끊기며 확대되는 현상을 없애고, 댓글창 애니메이션을 끄거나 재생·일시정지 상태에 맞춰 댓글창을 자동으로 열어 주는 유저스크립트입니다.

<p>
  <img src="https://img.shields.io/badge/version-1.9.0-19191b?style=flat-square&labelColor=0f0f10" alt="Version 1.9.0" />
  <img src="https://img.shields.io/badge/license-MIT-19191b?style=flat-square&labelColor=0f0f10" alt="MIT License" />
  <img src="https://img.shields.io/badge/userscript-Tampermonkey%20%7C%20Violentmonkey-19191b?style=flat-square&labelColor=0f0f10" alt="Tampermonkey and Violentmonkey" />
</p>

</div>

## 주요 기능

### 전체화면

- **전체화면 중간 크기 단계 제거** (`기본값: 켜짐`): 영상을 전체화면으로 전환할 때 확대 효과가 부자연스럽게 끊기는 현상을 제거합니다.
- **영상 재생 시 자동 전체화면** (`기본값: 꺼짐`): 시청 페이지(`/watch`, `/live/*`)에서 재생이 시작되면 자동으로 전체화면으로 전환합니다. 한 영상당 처음 한 번만 동작하며, 영상이 끝나거나 다시 재생하면 초기화됩니다.

### 댓글창

- **댓글창 애니메이션 제거** (`기본값: 켜짐`): 댓글창과 사이드 패널을 열고 닫을 때 나오는 슬라이드·크기 전환 효과를 끕니다.
- **영상 재생 시작 시 댓글창 열기** (`기본값: 켜짐`): 영상을 재생하면 댓글창이 자동으로 열립니다. 이미 전체화면으로 보고 있을 때는 화면을 가리지 않도록 전체화면을 나간 뒤에 열어 줍니다.
- **전체화면에서 일시정지 시 댓글창 열기** (`기본값: 꺼짐`): 전체화면 중 영상을 멈추면 댓글창을 보여 주고, 다시 재생하면 전체화면으로 돌아갑니다. 일반 플레이어 전체화면에서는 잠시 전체화면을 빠져나와 아래쪽 댓글창을 보여 주며, 중간 크기 단계 제거 옵션을 끈 경우에는 전체화면을 유지한 채 오른쪽 댓글창을 엽니다.

### 설정 창과 언어

- 확장 프로그램 메뉴의 **설정**에서 모든 옵션을 바로 켜고 끌 수 있으며, 바꾼 내용은 즉시 저장됩니다.
- 유튜브 라이트·다크 테마에 맞춰 색상이 자동으로 바뀝니다. 브라우저 언어에 따라 한국어, 영어, 일본어, 중국어 중 하나가 적용되며(미지원 언어는 영어 기본값), 설정 창 안에서 `시스템`, `English`, `한국어`, `日本語`, `中文`으로 바로 바꿀 수도 있습니다.

## 설치 방법

1. 브라우저에 [Tampermonkey](https://www.tampermonkey.net/) 또는 [Violentmonkey](https://violentmonkey.github.io/)를 설치합니다.
2. 아래 **Install UserScript** 버튼을 눌러 스크립트를 설치합니다:

   <p>
     <a href="https://raw.githubusercontent.com/june58-mine/youtube-instant-fullscreen-and-auto-comments/main/youtube-instant-fullscreen-and-auto-comments.user.js">
       <img src="https://img.shields.io/badge/Install_UserScript-v1.9.0-e5484d?style=for-the-badge&logo=youtube&logoColor=white" alt="Install UserScript v1.9.0" />
     </a>
   </p>

3. 설치 확인 창이 뜨면 **설치**를 누른 뒤 유튜브 탭을 새로고침합니다.
4. 브라우저 툴바의 확장 프로그램 아이콘을 눌러 **설정** 메뉴에서 원하는 옵션을 조절하세요.

<details>
<summary>수동 설치 및 자동 업데이트 안내</summary>

- 원클릭 설치 화면이 자동으로 열리지 않으면 [`youtube-instant-fullscreen-and-auto-comments.user.js`](./youtube-instant-fullscreen-and-auto-comments.user.js) 내용을 복사해 스크립트 관리자의 새 스크립트에 붙여넣고 저장하세요.
- 헤더에 `@updateURL`과 `@downloadURL`이 들어 있어 새 버전이 올라오면 확장 프로그램에서 자동으로 업데이트를 확인합니다.

</details>

## 기술 및 호환 참고

- `@run-at document-start` 시점에 실행되어 플레이어 초기화 전에 `ytcfg`와 플레이어 설정의 `external_fullscreen`과 `externalFullscreen` 값을 끕니다. 덕분에 `<html>` 문서 전체를 거치지 않고 `#movie_player`만 바로 전체화면으로 전환됩니다.
- `window.matchMedia`에서 `(prefers-reduced-motion: reduce)`를 참으로 반환하고, `watch-flexy`·`watch-grid`·`watch-learning-journey` 레이아웃 패널의 CSS 지속 시간을 `0.001ms`로 덮어씁니다. `0s`로 완전히 끄면 유튜브 내부의 `transitionend`·`animationend` 완료 이벤트가 막힐 수 있어 `0.001ms`를 사용합니다.
- 자동 전체화면은 브라우저의 `navigator.userActivation` 정책을 따르므로 클릭이나 키 입력으로 재생을 시작할 때 동작합니다. 재생 시 댓글창 자동 열기는 브라우저 초기 로딩과 SPA 이동(`yt-page-data-updated`, `yt-navigate-finish`)을 추적해 단계적으로 재시도하며, 전체화면 일시정지 감지는 `30ms` 디바운스로 대기열 전환·종료 시 발생하는 가짜 정지 신호(`playerState` `5`·`0`)를 걸러냅니다.
- 스타일과 설정 모달을 `innerHTML` 없이 DOM API와 `textContent`만으로 만들어 유튜브의 Trusted Types CSP 환경에서도 차단되지 않습니다.

## 라이선스

[MIT License](./LICENSE)를 따릅니다.
