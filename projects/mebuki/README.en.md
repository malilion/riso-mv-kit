<p align="right"><a href="README.md">中文</a> · <b>English</b></p>

# Example: 「芽吹の唄」, a riso picture-book MV

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

## Storyboard

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

## Where the timings come from

The start of every line in `timing.json` comes from a lyric video of the same recording: `tools/video-lyric-scan.js` read the time of each subtitle change, and the ink per subtitle compared with each line's length confirmed the order. Line endings and mid-line breaths came from `tools/vocal.mjs`. Where one subtitle showed two lines, they were split on the 8-bar phrase and the vocal onset, at 197.2 s and 225.2 s.
