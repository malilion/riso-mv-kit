<p align="right"><a href="#中文">中文</a> · <a href="#english">English</a></p>

# 範例：「芽吹の唄」紙上萌芽繪本 MV

## 中文

「芽吹の唄」（作詞・作曲・歌：大原ゆい子，編曲：MANYO；《無職轉生》第三季 OP2）的 MV。313.7 秒，137 BPM，第一個重拍在 0.948 秒，整首以 8 小節為一個樂句。

這個資料夾只有程式和時間表。**音檔和歌詞不在 repo 裡**，要重現的話：

1. 把合法取得的音源放到 `audio/song.mp3`。時間表是用 313.7 秒的版本對的；音源不同的話，請重新對時間。
2. 把歌詞（日文，下一行中文翻譯）貼進 `lyrics.txt`。
3. 執行：

   ```bash
   node tools/make_lyrics.mjs mebuki
   ```

4. 預覽：<http://localhost:8766/studio.html?project=mebuki&play>
5. 整首渲染：

   ```bash
   ./tools/render_chunks.sh mebuki
   ```

### 分鏡

| 時間 | 段落 | 場景 | 畫面 |
|---|---|---|---|
| 0:00 | 第 1 句前半 | `sc_cover` | 繪本封面一色一色印出 |
| 0:08 | 第 1–3 句 | `sc_road` | 往前延伸的鄉間路；第 2 句起，遠方變成還沒印的鉛筆稿 |
| 0:29 | 第 4 句 | `sc_clock` | 時鐘小星球，兩人走在邊緣，一圈一天 |
| 0:43 | 第 5 句 | `sc_days` | 一模一樣的早晨排成日曆，盆裡的芽每天高一點 |
| 0:57 | 副歌 第 6 句 | `sc_sprout` → `sc_field` | 種子破土，子葉在第 33 小節重拍打開；整片田一排排冒芽 |
| 1:11 | 第 7 句 | `sc_together` | 夕陽山丘，兩人並肩，中間的小樹長大 |
| 1:25 | 間奏 | `sc_chapter2` | 章節頁「二」 |
| 1:39 | 第 8–9 句 | `sc_lineage` | 手牽手的長隊伍，過去只是鉛筆稿，一路連到印好的兩人 |
| 2:07 | 第 10–11 句 | `sc_umbrella` | 雨中替小芽撐傘，最後雨停 |
| 2:35 | 第二次副歌 第 12 句 | `sc_bloom` | 田野開成花海 |
| 2:49 | 第 13 句 | `sc_world` | 長滿樹和花的時鐘小星球，鏡頭拉遠 |
| 3:01 | 橋段 第 14–15 句 | `sc_treasures` | 寶物一拍一個排滿整頁，越來越快 |
| 3:29 | 第 16–17 句 | `sc_rays` | 雲隙灑下的陽光 |
| 3:59 | 第 18 句 | `sc_memories` | 前面的頁面縮成卡片一張張閃過 |
| 4:15 | 第 19–20 句 | `sc_night` | 夜雨裡兩人躲在樹下，四周的新芽一株株亮起 |
| 4:43 | 第 21–22 句 | `sc_finalRoad` | 回到同一條路，這次一路印到地平線，鏡頭升高 |
| 5:04 | 尾奏 | `sc_fin` | おわり 與製作名單 |

### 時間怎麼來的

`timing.json` 的每句開始時間，取自一支同音源的歌詞影片：用 `tools/video-lyric-scan.js` 讀出每次換字幕的時間，再用墨量和字數比對每句的順序。唱完時間和句中換氣則用 `tools/vocal.mjs` 判斷。字幕同時顯示兩句的地方，依 8 小節樂句和人聲起音拆開：197.2 秒、225.2 秒。

---

## English

A music video for 「芽吹の唄」 (lyrics, music and vocals: 大原ゆい子 / Yuiko Ohara; arrangement: MANYO; the second opening of *Mushoku Tensei* season 3). 313.7 seconds at 137 bpm, first downbeat at 0.948 s, built from 8-bar phrases.

This folder holds only code and timings. **The audio and the lyrics are not in the repo.** To rebuild the video:

1. Put a legally obtained recording at `audio/song.mp3`. The timings match the 313.7-second version; with a different recording, time the lyrics again.
2. Paste the lyrics (a Japanese line, then its translation on the next line) into `lyrics.txt`.
3. Run:

   ```bash
   node tools/make_lyrics.mjs mebuki
   ```

4. Preview: <http://localhost:8766/studio.html?project=mebuki&play>
5. Render the whole song:

   ```bash
   ./tools/render_chunks.sh mebuki
   ```

### Storyboard

| Time | Section | Scene | Picture |
|---|---|---|---|
| 0:00 | line 1, first half | `sc_cover` | The picture-book cover prints itself one colour at a time |
| 0:08 | lines 1–3 | `sc_road` | A country road that keeps going; from line 2 the distance turns into unprinted pencil sketch |
| 0:29 | line 4 | `sc_clock` | The little clock planet: the two walk its rim, one turn a day |
| 0:43 | line 5 | `sc_days` | The same morning again and again, laid out like a calendar; the potted sprout grows a little each day |
| 0:57 | chorus, line 6 | `sc_sprout` → `sc_field` | A seed breaks the soil and its seed leaves open on the downbeat of bar 33; then the whole field sprouts row by row |
| 1:11 | line 7 | `sc_together` | A hilltop at sunset, the two side by side while a young tree grows between them |
| 1:25 | interlude | `sc_chapter2` | Chapter page "二" |
| 1:39 | lines 8–9 | `sc_lineage` | A long chain of people holding hands; the past is only pencilled in, leading to the two in full ink |
| 2:07 | lines 10–11 | `sc_umbrella` | Holding an umbrella over a seedling in the rain, until the rain stops |
| 2:35 | second chorus, line 12 | `sc_bloom` | The field bursts into flower |
| 2:49 | line 13 | `sc_world` | The clock planet again, now covered in trees and flowers, as the camera pulls away |
| 3:01 | bridge, lines 14–15 | `sc_treasures` | Treasures fill the page one per beat, then faster and faster |
| 3:29 | lines 16–17 | `sc_rays` | Sunlight falling through a gap in the clouds |
| 3:59 | line 18 | `sc_memories` | Earlier pages flick past as small cards |
| 4:15 | lines 19–20 | `sc_night` | Night rain; the two shelter under a tree as sprouts light up around them one by one |
| 4:43 | lines 21–22 | `sc_finalRoad` | The same road as the beginning, now printed all the way to the horizon, as the camera rises |
| 5:04 | outro | `sc_fin` | おわり (The End) and the credits |

### Where the timings come from

The start of every line in `timing.json` comes from a lyric video of the same recording: `tools/video-lyric-scan.js` read the time of each subtitle change, and the ink per subtitle compared with each line's length confirmed the order. Line endings and mid-line breaths came from `tools/vocal.mjs`. Where one subtitle showed two lines, they were split on the 8-bar phrase and the vocal onset, at 197.2 s and 225.2 s.
