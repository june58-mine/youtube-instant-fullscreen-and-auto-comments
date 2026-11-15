[English](./README.md) · [한국어](./README.ko.md) · **日本語** · [简体中文](./README.zh-CN.md)

# YouTube 即時全画面 & コメント自動表示

**YouTube Instant Fullscreen & Auto Comments**

YouTube の全画面切り替え時の不自然なズームのカクつきを取り除き、コメント欄のアニメーション無効化や再生開始・全画面一時停止時のコメント自動表示を提供するユーザースクリプトです。

- **バージョン:** `1.9.0`
- **作成者:** [`june58-mine`](https://github.com/june58-mine)
- **ライセンス:** `MIT`
- **対象サイト:** `https://www.youtube.com/*`
- **スクリプト:** [`youtube-instant-fullscreen-and-auto-comments.user.js`](./youtube-instant-fullscreen-and-auto-comments.user.js)

---

## 主な機能

### 全画面表示 (Fullscreen)

- **全画面の中間サイズ段階をスキップ** (`デフォルト: ON`)
  - YouTube の `external_fullscreen` / `externalFullscreen` 設定を無効化し、動画を全画面に切り替える際の不自然なズームのカクつきを取り除きます。
  - 全画面へ入る前に開いていたパネル（コメント欄、チャット、文字起こしなど）は、全画面解除時に自動で復元されます。
- **再生開始時に自動で全画面** (`デフォルト: OFF`)
  - 視聴ページ（`/watch`, `/live/*`）で動画の再生が始まると自動で全画面に切り替えます（再生終了またはリプレイまで動画ごとに 1 回実行）。
  - ブラウザのユーザー操作ポリシー（`navigator.userActivation`）に従い、操作を伴う再生時に動作します。

### コメント欄 (Comments)

- **コメント欄のアニメーションを無効化** (`デフォルト: ON`)
  - コメント欄やサイドパネルを開閉する際のスライド・リサイズ・View Transition アニメーションを無効化します（`watch-flexy` / `watch-grid` / `watch-learning-journey` レイアウト対応）。
  - `window.matchMedia` の `prefers-reduced-motion` クエリと `0.001ms` の CSS タイマーを用いることで、YouTube 側の `transitionend` / `animationend` リスナーが正常に完了するようにしています。
- **再生開始時にコメント欄を開く** (`デフォルト: ON`)
  - 視聴ページで再生が始まるとコメントパネル（`engagement-panel-comments-section`）を自動で開き、YouTube SPA のデータ更新（`yt-page-data-updated`）後にも開いた状態を維持します。
  - `<html>` 全画面中はプレーヤー領域が狭まらないよう、全画面解除後に開くように遅延させます。
- **全画面で一時停止時にコメント欄を開く** (`デフォルト: OFF`)
  - 全画面中に一時停止すると、モードに応じてコメント欄を表示します：
    - **プレーヤー単独の全画面**（デフォルト設定）: 全画面を一度解除してコメント欄を表示し、再生を再開すると自動で全画面へ戻ります。
    - **`<html>` 全画面**（中間サイズスキップが OFF の場合）: 全画面を維持したまま右側のサイドパネルでコメント欄を開き、再生再開時に自動で閉じます。
  - キュー読み込みや再生終了に伴う擬似的な pause イベント（`playerState` 5 / 0）を除外し、`30ms` のデバウンスで誤作動を防ぎます。

### 設定 UI & 多言語対応

- ユーザースクリプトマネージャーのメニュー（`設定`）からいつでも設定モーダルを開けます。YouTube のライト/ダークテーマ（`html[dark]`）に自動追従します。
- ブラウザの言語設定を検出して `English`・`한국어`・`日本語`・`中文` で表示し（未対応言語は `English` にフォールバック）、モーダル内の言語ボタン（`システム` / `English` / `한국어` / `日本語` / `中文`）でリロード不要・即時切り替えが可能です。

---

## インストール方法

1. ブラウザにユーザースクリプトマネージャー拡張機能をインストールします。
   - [Tampermonkey](https://www.tampermonkey.net/)（Chrome / Edge / Firefox / Safari）
   - [Violentmonkey](https://violentmonkey.github.io/)（Chrome / Edge / Firefox）
2. このリポジトリの [`youtube-instant-fullscreen-and-auto-comments.user.js`](./youtube-instant-fullscreen-and-auto-comments.user.js) を開き、**Raw** ボタンをクリックします。
   - 拡張機能のインストール画面が開いたらインストールを確定してください。
   - もしくは拡張機能上で新規スクリプトを作成し、ファイル内容をコピー＆ペーストして保存します。
3. YouTube（`https://www.youtube.com/`）を再読み込みします。
4. 拡張機能アイコンのメニューから **`設定`** を開くと、設定をリアルタイムで変更・保存できます。

> [!TIP]
> 次の Raw リンクからワンクリックで直接インストールできます: [`https://github.com/june58-mine/youtube-instant-fullscreen-and-auto-comments/raw/main/youtube-instant-fullscreen-and-auto-comments.user.js`](https://github.com/june58-mine/youtube-instant-fullscreen-and-auto-comments/raw/main/youtube-instant-fullscreen-and-auto-comments.user.js)

---

## デフォルト設定一覧

| セクション | 設定項目 | キー名 | デフォルト |
| :--- | :--- | :--- | :---: |
| **全画面表示** | 全画面の中間サイズ段階をスキップ | `directFullscreen` | **ON (`true`)** |
| **全画面表示** | 再生開始時に自動で全画面 | `autoFullscreenOnPlay` | OFF (`false`) |
| **コメント欄** | コメント欄のアニメーションを無効化 | `disableCommentsAnimation` | **ON (`true`)** |
| **コメント欄 → 自動表示** | 再生開始時にコメント欄を開く | `openCommentsOnPlay` | **ON (`true`)** |
| **コメント欄 → 自動表示** | 全画面で一時停止時にコメント欄を開く | `openCommentsOnFullscreenPause` | OFF (`false`) |
| **言語** | 表示言語 | `language` | `'auto'` (`システム`) |

---

## 技術仕様・互換性メモ

- **`@run-at document-start` 実行**: プレーヤー生成前に `ytcfg`・`ytplayer`・`yt.player.Application`・`matchMedia` をフックし、初期化段階から設定を反映します。
- **Trusted Types CSP 準拠**: `innerHTML` を一切使わず、DOM API と `textContent` のみでスタイルおよびモーダル UI を生成します。
- **軽量なイベント処理**: メディアイベント（`play` / `playing` / `pause` / `ended`）冒頭に O(1) の早期リターンを配置し、`Escape` キーの監視は設定モーダル表示中のみ有効化しています。常時 DOM 監視は行わず `yt-page-data-updated` で確認します。
- **設定の永続化**: `GM_setValue` / `GM_getValue`（利用不可時は `localStorage`）の `yt_no_zoom_animation_settings_v2` に保存され、旧 `v1` 設定からの自動移行にも対応しています。

---

## ライセンス

スクリプトヘッダー（`@license MIT`）の記載通り **MIT License** の下で提供されています。
