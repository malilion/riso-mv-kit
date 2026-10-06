# riso-mv-kit

**孔版印刷（Riso）風的繪本 MV 工具包**
用程式畫出每一格畫面，在 Chrome 裡逐格渲染，最後和音樂合成影片。

*Riso-print picture-book music videos, drawn entirely by code and rendered frame by frame in headless Chrome.*

第一支作品是「芽吹の唄」（《無職轉生》第三季 OP2）的 MV，5 分 14 秒、1080p、30 fps。完整的分鏡和場景程式都放在 [`projects/mebuki/`](projects/mebuki/)，可以當作範例參考。

## 特色

- **印刷質感**：每格畫面都像重新印一次，包括分色版、半色調網點（每個顏色不同角度）、套色錯位、油墨不均和紙張纖維。
- **手繪節奏**：圖畫每秒 12 張（一拍二），線條每張微微抖動；鏡頭和文字則維持每秒 30 格的流暢。
- **跟著音樂走**：場景以小節為單位排程，翻頁剛好落在樂句開頭的小節線上；植物在重拍上發芽，人物踩著節拍走路。
- **歌詞排版**：日文直書逐字浮現，中文字幕放在下方，字周圍會留一圈紙白，讓文字在任何背景上都看得清楚。
- **素材全部由程式產生**：人物、植物、天空、道路、雨、陽光都是程式繪製，不需要 AI 生圖，也不需要外部素材。

## 快速開始

需要 macOS（或 Linux）、Node.js 18 以上、Google Chrome、ffmpeg（`brew install ffmpeg`）。

```bash
npm install
```

```bash
node tools/server.mjs
```

伺服器啟動後請讓它一直開著，接著打開：

- 範本專案預覽：<http://localhost:8766/studio.html?project=_template&play>（點一下畫面開始播放）
- 單一畫面：`studio.html?project=_template&t=12`
- 單獨看某個場景：`studio.html?project=_template&scene=sc_rainy&t=3`

## 做一支新的 MV

```bash
./tools/new_project.sh my-song
```

接著把歌放進 `projects/my-song/audio/song.mp3`、歌詞貼進 `projects/my-song/lyrics.txt`，再依照 **[docs/WORKFLOW.md](docs/WORKFLOW.md)** 一步步做：

1. 分析節奏
2. 取得歌詞時間
3. 寫分鏡和場景
4. 預覽
5. 分段渲染
6. 合成影片

做法和原理寫在 **[docs/TECHNIQUES.md](docs/TECHNIQUES.md)**：印刷引擎、網點、套色錯位、一拍二、植物生長、偽 3D 道路、直書歌詞、翻頁、鉛筆稿淡出、回憶卡片、節奏與人聲分析、從歌詞影片讀時間等等。

## 資料夾

| 路徑 | 內容 |
|---|---|
| `engine/` | 共用引擎：`riso.js` 印刷、`draw.js` 繪本素材、`plant.js` 植物、`road.js` 道路、`type.js` 歌詞排版、`transitions.js` 翻頁、`timeline.js` 排程、`kit.js` 場景積木 |
| `projects/NAME/` | 一支 MV：`song.json` 設定、`timing.json` 歌詞時間、`story.js` 分鏡表、`scenes.js` 場景 |
| `projects/_template/` | 開新專案用的範本 |
| `projects/mebuki/` | 「芽吹の唄」完整範例 |
| `tools/` | 伺服器、渲染、分段渲染、合成、節奏分析、人聲分析、歌詞合併、從歌詞影片讀時間 |
| `studio.html` | 預覽與渲染用的頁面 |
| `timing.html` | 邊聽邊按空白鍵的對時間工具 |

## 版權

歌曲、歌詞和翻譯都有各自的版權，**不會**被放進這個 repo：`projects/*/audio/`、`lyrics.txt`、`lyrics.json` 和所有渲染輸出都已列在 `.gitignore`。範例專案只保留程式碼和純數字的時間表，要重現範例，需要自己準備合法取得的音源和歌詞。公開發布用到別人作品的影片前，請先確認授權。

## 來源與授權

ISC License。逐格渲染加 FFmpeg 合成的流程，參考自 [2606156052/Pdoom-video-anime-version](https://github.com/2606156052/Pdoom-video-anime-version) 與 [JohnHeibel/PDoomVideo](https://github.com/JohnHeibel/PDoomVideo)（皆為 ISC），原授權聲明保留在 [LICENSE](LICENSE)。引擎、場景和工具由 Claude（Anthropic）與 malilion 一起製作。字型使用 Google Fonts 的 Klee One 與 LXGW WenKai TC（SIL OFL）。
