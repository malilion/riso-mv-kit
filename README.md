<p align="right"><b>中文</b> · <a href="README.en.md">English</a></p>

<p align="center">
  <img src="assets/icon.png" width="180" alt="riso-mv-kit mascot: a little seed with a sprout on its head, in front of the sun">
</p>

<h1 align="center">riso-mv-kit</h1>

<p align="center">孔版印刷風的繪本 MV 工具包</p>

<p align="center"><img src="assets/social-preview.png" width="640" alt="riso-mv-kit banner"></p>

用程式畫出每一格畫面，在 Chrome 裡逐格渲染，最後和音樂合成影片。

目前做了兩支 MV，完整的分鏡和場景程式都在 `projects/` 裡，可以當作範例參考。

## 作品

下面是兩支 MV 的精華片段，**沒有聲音、也沒有歌詞**（歌曲和歌詞的版權屬於原作者，不放進 repo）。點圖片可以看較清楚的 mp4 版本。

<table>
<tr>
<td width="50%" valign="top"><a href="assets/previews/mebuki.mp4"><img src="assets/previews/mebuki.webp" alt="「芽吹の唄」MV 精華（無聲、無歌詞）"></a></td>
<td width="50%" valign="top"><a href="assets/previews/tabibito.mp4"><img src="assets/previews/tabibito.webp" alt="「旅人の唄」MV 精華（無聲、無歌詞）"></a></td>
</tr>
<tr>
<td valign="top"><b>「芽吹の唄」</b>（《無職轉生》第三季 OP2）<br>5:14。兩個旅人走在會發芽的紙上世界：鄉間路、時鐘小星球、整片田在重拍上冒芽。<br><a href="projects/mebuki/">分鏡與程式 →</a></td>
<td valign="top"><b>「旅人の唄」</b>（《無職轉生》第一季 ED）<br>4:24。一個旅人和一隻小鳥：翻山、泉水、雲海上的浮島、營火的夢、打勾勾、天燈。<br><a href="projects/tabibito/">分鏡與程式 →</a></td>
</tr>
</table>

## 特色

- **印刷質感**：每格畫面都像重新印一次，包括分色版、半色調網點（每個顏色不同角度）、套色錯位、油墨不均和紙張纖維。
- **手繪節奏**：圖畫每秒 12 張（一拍二），線條每張微微抖動；鏡頭和文字則維持每秒 30 格的流暢。
- **跟著音樂走**：場景以小節為單位排程，翻頁剛好落在樂句開頭的小節線上；植物在重拍上發芽，人物踩著節拍走路。
- **歌詞排版**：日文直書逐字浮現，中文字幕放在下方，字周圍會留一圈紙白，讓文字在任何背景上都看得清楚。
- **素材全部由程式產生**：人物、植物、天空、道路、雨、陽光都是程式繪製，不需要 AI 生圖，也不需要外部素材。連這個 repo 的 icon 都是用同一套引擎印出來的（`projects/_brand/`）。

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

接著把歌放進 `projects/my-song/audio/song.mp3`、歌詞貼進 `projects/my-song/lyrics.txt`，再依照 **[docs/WORKFLOW.md](docs/WORKFLOW.md)**一步步做：

1. 分析節奏
2. 取得歌詞時間
3. 寫分鏡和場景
4. 預覽
5. 分段渲染
6. 合成影片

想在 README 放自己的作品時，`tools/make_preview.sh` 會只渲染指定的幾段、關掉歌詞、不加音樂，輸出可以放進 repo 的 mp4 和會動的 webp。

做法和原理寫在 **[docs/TECHNIQUES.md](docs/TECHNIQUES.md)**：印刷引擎、網點、套色錯位、一拍二、植物生長、偽 3D 道路、直書歌詞、翻頁、鉛筆稿淡出、回憶卡片、節奏與人聲分析、從歌詞影片讀時間等等。

## 資料夾

| 路徑 | 內容 |
|---|---|
| `engine/` | 共用引擎：`riso.js` 印刷、`draw.js` 繪本素材、`plant.js` 植物、`road.js` 道路、`type.js` 歌詞排版、`transitions.js` 翻頁、`timeline.js` 排程、`kit.js` 場景積木 |
| `projects/NAME/` | 一支 MV：`song.json` 設定、`timing.json` 歌詞時間、`story.js` 分鏡表、`scenes.js` 場景 |
| `projects/_template/` | 開新專案用的範本 |
| `projects/mebuki/` | 「芽吹の唄」完整範例 |
| `projects/tabibito/` | 「旅人の唄」完整範例（單一主角、語音辨識對時間） |
| `projects/_brand/` | repo 的 icon 和社群預覽圖（`tools/make_brand.sh` 重新產生） |
| `assets/previews/` | 作品精華（無聲、無歌詞，`tools/make_preview.sh` 產生） |
| `tools/` | 伺服器、渲染、分段渲染、合成、精華預覽、節奏分析、人聲分析、歌詞合併、從歌詞影片讀時間 |
| `studio.html` | 預覽與渲染用的頁面 |
| `timing.html` | 邊聽邊按空白鍵的對時間工具（中英介面切換） |

## 版權

歌曲、歌詞和翻譯都有各自的版權，**不會**被放進這個 repo：`projects/*/audio/`、`lyrics.txt`、`lyrics.json` 和所有渲染輸出都已列在 `.gitignore`。範例專案只保留程式碼和純數字的時間表；`assets/previews/` 裡的精華片段是關掉歌詞、不含音樂另外渲染的。要重現範例，需要自己準備合法取得的音源和歌詞。公開發布用到別人作品的影片前，請先確認授權。

## 來源與授權

ISC License。逐格渲染加 FFmpeg 合成的流程，參考自 [2606156052/Pdoom-video-anime-version](https://github.com/2606156052/Pdoom-video-anime-version)（ISC）與 [JohnHeibel/PDoomVideo](https://github.com/JohnHeibel/PDoomVideo)（package.json 標示 ISC），原授權聲明保留在 [LICENSE](LICENSE)。引擎、場景和工具由 Claude（Anthropic）與 malilion 一起製作。字型使用 Google Fonts 的 Klee One 與 LXGW WenKai TC（SIL OFL）。
