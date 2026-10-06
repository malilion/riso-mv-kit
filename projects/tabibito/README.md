<p align="right"><b>中文</b> · <a href="README.en.md">English</a></p>

# 範例：「旅人の唄」旅人繪本 MV

「旅人の唄」（作詞・作曲・歌：大原ゆい子，編曲：MANYO；《無職轉生》第一季 ED）的 MV。264.1 秒，137 BPM，第一個重拍在 0.43 秒。

<p align="center"><a href="../../assets/previews/tabibito.mp4"><img src="../../assets/previews/tabibito.webp" width="640" alt="「旅人の唄」MV 精華（無聲、無歌詞）"></a></p>

和「芽吹の唄」不同，這支只有一個主角：戴草帽的旅人，加上一隻藍色小鳥。旅人和小鳥都由這個資料夾的 `scenes.js` 畫出來（`TRAV`、`bird()`），山、浮島、天燈、打勾勾的手等素材也在同一個檔案。

這個資料夾只有程式和時間表。**音檔和歌詞不在 repo 裡**，要重現的話：

1. 把合法取得的音源放到 `audio/song.mp3`。時間表是用 264.1 秒的版本對的；音源不同的話，請重新對時間。
2. 把歌詞（日文，下一行中文翻譯）貼進 `lyrics.txt`。
3. 執行：

   ```bash
   node tools/make_lyrics.mjs tabibito
   ```

4. 預覽：<http://localhost:8766/studio.html?project=tabibito&play>
5. 整首渲染：

   ```bash
   ./tools/render_chunks.sh tabibito
   ```

## 分鏡

| 時間 | 段落 | 場景 | 畫面 |
|---|---|---|---|
| 0:00 | 前奏 | `sc_cover` | 繪本封面一色一色印出 |
| 0:06 | 前奏 | `sc_map` | 樂團進來，地圖上的路線一拍畫兩格 |
| 0:21 | 第 1 句 | `sc_climb` | 拄著手杖翻山，遠山隨著爬升慢慢下沉 |
| 0:32 | 第 2–3 句 | `sc_spring` | 森林裡湧出的泉水，每拍一圈漣漪，芽沿著溪流一株株冒出 |
| 0:55 | 副歌 第 4–6 句 | `sc_cloudsea` | 雲海上的浮島；第 6 句時旅人手上聚起一團光 |
| 1:19 | 第 7–8 句 | `sc_wind` | 風吹過草原，小鳥順著風，在第 8 句停上樹枝 |
| 1:32 | 第 9–10 句 | `sc_skies` | 同一座山丘，天空每小節換一次：早晨、晚霞、星空、雨、彩虹 |
| 1:42 | 第 11 句 | `sc_campfire` | 營火旁睡著，夢用鉛筆稿畫在泡泡裡往上飄 |
| 1:53 | 第 12 句 | `sc_onward` | 一個人走向黎明的路，不回頭 |
| 2:03 | 第二次副歌 第 13 句 | `sc_cloudsea` | 黃昏的雲海與浮島 |
| 2:12 | 第 14 句 | `sc_promise` | 兩隻小指勾在一起，中間亮起光 |
| 2:24 | 間奏 | `sc_chapter` → `sc_journey` | 章節頁「三」，接著整段旅程變成一幅橫向捲動的長畫 |
| 2:52 | 第 15 句 | `sc_lanterns` | 夜空升起天燈，一拍多一盞 |
| 3:04 | 橋段 第 16–19 句 | `sc_farewell` | 過去的自己站在路邊揮手，每唱一次「再見」就淡掉一個；白紙飄走 |
| 3:27 | 最後副歌 第 20–22 句 | `sc_summit` | 日出，旅人站上浮島，小鳥停在帽子上，最後一句聚起光 |
| 3:52 | 尾奏 | `sc_map` | 路線畫滿的地圖 |
| 4:07 | 尾奏 | `sc_fin` | おわり 與製作名單 |

## 時間怎麼來的

這首歌在網路上找不到字幕燒在畫面上的同音源影片，所以改用語音辨識：[whisper.cpp](https://github.com/ggerganov/whisper.cpp) 的 small 模型加 DTW 逐字時間（做法見 [docs/WORKFLOW.md](../../docs/WORKFLOW.md) 的方法 D）。每句的開始時間取自第一個字，結束時間取自最後一個字，再和 137 BPM 的拍點比對過。

`engine/road.js` 為這支加了單人走路（`walk.looks` 只給一個造型時，畫一個旅人而不是兩人牽手）。
