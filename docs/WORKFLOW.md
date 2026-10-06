<p align="right"><b>中文</b> · <a href="WORKFLOW.en.md">English</a></p>

# 製作流程：從一首歌到一支 MV

以下用 `my-song` 當專案名稱。所有指令都在 repo 根目錄執行。

## 0. 準備

```bash
npm install
```

需要 Node.js 18+、Google Chrome、ffmpeg（`brew install ffmpeg`）。整個製作過程中，伺服器要一直開著：

```bash
node tools/server.mjs
```

建議開在終端機分頁，不要放在會被自動關掉的背景工作裡。

## 1. 建立專案

```bash
./tools/new_project.sh my-song
```

會從 `projects/_template` 複製出 `projects/my-song/`，裡面的檔案：

| 檔案 | 用途 |
|---|---|
| `song.json` | `title`、`artist`、`audio`（相對於專案資料夾）、`bpm`、`phase`（第一個重拍的秒數）、`meter`（每小節幾拍）、`dur`（影片長度）、`fadeOut`（結尾淡出秒數）、`scripts`（要載入的場景檔）、`fontSample`（標題和名單會用到的字，確保字型載入） |
| `timing.json` | 每句歌詞的時間，只有數字，可以放進 repo |
| `story.js` | 分鏡表：哪個場景在什麼時候出現 |
| `scenes.js` | 場景程式 |
| `lyrics.example.txt` | 歌詞檔格式說明 |
| `lyrics.sample.json` | 佔位歌詞：還沒有真歌詞時，用來測試版面 |

## 2. 放音訊和歌詞

- 音訊放到 `projects/my-song/audio/song.mp3`。檔名不同的話，改 `song.json` 的 `audio`。
- 把 `lyrics.example.txt` 複製成 `lyrics.txt`，貼上歌詞。每句一行日文，下一行放中文翻譯。羅馬拼音、作詞作曲等資訊行會自動略過，所以直接從歌詞網站整段複製也可以。解析規則在 `engine/lyrics.js`。

音訊和歌詞都在 `.gitignore` 裡，不會被推上 GitHub。

## 3. 分析節奏

```bash
node tools/analyze.mjs my-song
```

會把 `bpm` 和 `phase`（第一個重拍）寫進 `song.json`，並印出：

- **每 20 秒的拍點漂移**：都在 ±0.01 秒內，代表節奏固定，可以放心用小節排場景。
- **整首的能量曲線**：能量突然變大或變小的地方通常就是段落交界，例如主歌進副歌、間奏、最後一段前的安靜段落。用它來規劃分鏡。

BPM 判斷成一半或兩倍時，可以手動指定：

```bash
node tools/analyze.mjs my-song 137
```

確定之後在 `song.json` 加上 `"bpmLocked": true`，之後重跑分析就不會改掉。

## 4. 歌詞時間

`timing.json` 的格式：

```json
{ "lines": [
  { "t0": 1.30, "t1": 13.6, "parts": [[1.30, 6.6], [7.5, 13.6]] },
  { "t0": 15.03, "t1": 20.4 }
]}
```

- `t0`：這句開始唱的時間
- `t1`：唱完的時間
- `parts`（選填）：歌詞中有空格分成兩段時，各段自己的時間窗。逐字浮現會在換氣處停住，等下一段開始才繼續。

取得時間的三種方法：

**A. 邊聽邊按（最準，大約幾分鐘）**
打開 <http://localhost:8766/timing.html?project=my-song>，每句一開始唱就按住空白鍵、唱完放開。介面可以切換中英文：按工具列最右邊的語言按鈕，或在網址加上 `&lang=en`。每對完一句會自動存成 `lyrics.json`。對完後執行下面這行，把時間抽出成 `timing.json`，數字就能留在 repo 裡：

```bash
node tools/make_lyrics.mjs my-song --extract
```

**B. 從有字幕的歌詞影片讀取**
如果網路上有同一個音源版本、字幕直接燒在畫面上的歌詞影片（先確認影片長度和你的音檔一致），可以用 `tools/video-lyric-scan.js` 讀出每次換字幕的時間：

1. 在瀏覽器打開影片頁，把腳本貼進主控台執行。請 Claude 用內建瀏覽器執行也可以。
2. **分頁要保持顯示**：瀏覽器在背景不會繪製影片畫面。腳本切走會自動暫停，回來會繼續。
3. 完成後用 `copy(JSON.stringify(__lyricScan.segments(), null, 1))` 拿到每段字幕的開始、結束和「墨量」。
4. 對應到歌詞：
   - 墨量大約和字數成正比，可以用來確認順序。
   - 一段字幕可能放了兩句：用樂句長度（通常 8 小節）和人聲起音拆開。
   - 一句也可能被拆成兩段字幕。
5. 用人聲分析找唱完的時間和句中換氣：

   ```bash
   node tools/vocal.mjs my-song 90 180
   ```

   它會印出每 0.5 秒的人聲強度，低谷就是停頓。

這個方法只是「看著」影片播放，不會下載影片，請只用在你可以合法觀看的影片上。

**C. 自己寫**
直接編輯 `timing.json`。

最後合併成 studio 讀取的 `lyrics.json`：

```bash
node tools/make_lyrics.mjs my-song
```

## 5. 分鏡與場景

**`story.js`**：場景排程。每一項可以用四種方式指定開始時間：

| 寫法 | 意思 |
|---|---|
| `{ bar: 8, fn }` | 第 8 小節的重拍 |
| `{ line: 5, fn }` | 第 5 句（從 0 數）開始前的那條小節線 |
| `{ after: 21, fn }` | 第 21 句唱完後的第一條小節線 |
| `{ at: 12.5, fn }` | 絕對秒數 |

加上 `tr: 'page'`（翻頁）或 `tr: 'fade'`（淡入）時，轉場會剛好在場景開始的那一刻完成。也可以寫成 `function STORY()`，依歌詞多寡回傳不同版本，例如試作版和完整版。

**`scenes.js`**：每個場景是 `async (P, t, t0) => 印刷設定`：

- `t` 是歌曲時間，`t0` 是這個場景的開始時間。
- `P` 是五個色版：`k` 線稿、`a` 綠、`b` 藍、`c` 黃、`d` 強調色。用 `P.paint`（不透明，會挖空底下）、`P.add`（疊印）、`P.stroke`、`P.outline`、`P.ramp`（漸層網點）作畫。
- 回傳 `{ inks: { k, a, b, c, d } }` 決定每個色版上什麼油墨。`INK` 是孔版油墨色票，`INKS` 是幾組配好的組合。也可以設 `screens`（網點角度、大小、模式）、`mis`（錯位量）、`grain`、`vig`、`flash`。
- 現成積木在 `engine/kit.js`：天空和山、日夜天空、時鐘小星球、坐著的人、雨、雲隙陽光、雨傘、花、寶物圖示、章節頁、逐色印刷、鉛筆稿淡出。
- 「芽吹の唄」的 19 個場景都在 `projects/mebuki/`，可以直接複製來改。

跟節拍同步常用：

- `beatOf(t)`：第幾拍
- `barT(n)`：第 n 小節的時間
- `pulse(t)`：每拍衰減的脈衝
- `keys(lt, [[秒, 值], ...])`：關鍵影格，例如讓子葉剛好在重拍打開
- 走路的步伐：`beatOf(tt) * .25`，每兩拍一步

歌詞的位置用 `lyr(P, t, { ja: { x, y, size }, zh: { y } })` 調整。

測試單一場景：

- 預覽：`studio.html?project=my-song&scene=sc_rainy&t=3`
- 輸出畫面：

  ```bash
  node tools/render.mjs --project=my-song --stills=3,10,25
  ```

  畫面會存到 `qa/my-song/`。

## 6. 預覽

<http://localhost:8766/studio.html?project=my-song&play>，點一下畫面開始播放。加 `&from=60` 可以從第 60 秒開始。即時預覽可能會比實際慢，正式影片以渲染結果為準。

## 7. 渲染與合成

**整首**（建議）：

```bash
./tools/render_chunks.sh my-song
```

每 100 秒一段：渲染、合成、刪掉影格，再做下一段，最後無損接起來並加上音樂。中斷後重跑會從還沒完成的段落繼續。產出：

- `video/my-song.mp4`：母帶
- `video/my-song_share.mp4`：約 6 Mbps，方便傳送

**短片段或試作**：

```bash
node tools/render.mjs --project=my-song --range=0:90 --workers=4
```

```bash
./tools/encode.sh my-song
```

**硬碟**：每格約 1.3 MB，5 分鐘的歌約 13 GB，所以整首請用分段渲染。

**速度**：M1、4 個渲染程序時，每格約 30 到 160 毫秒，5 分鐘的歌大約 10 到 30 分鐘。

## 8. 常見問題

- **一直顯示「page not ready」**：字型從 Google Fonts 下載，需要網路，會自動重試。
- **渲染中途伺服器斷線**：伺服器請開在終端機分頁。
- **讀取歌詞影片停在 0%**：影片分頁沒有顯示在畫面上。
- **公開發布**：換成正式取得的音源，片尾標註歌曲和翻譯者。
