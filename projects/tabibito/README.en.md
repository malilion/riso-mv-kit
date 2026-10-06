<p align="right"><a href="README.md">中文</a> · <b>English</b></p>

# Example: 「旅人の唄」, a traveller's picture-book MV

An MV for 「旅人の唄」 (words, music and vocals: Yuiko Ohara, arrangement: MANYO; Mushoku Tensei season 1 ending). 264.1 s, 137 BPM, first downbeat at 0.43 s.

<p align="center"><a href="../../assets/previews/tabibito.mp4"><img src="../../assets/previews/tabibito.webp" width="640" alt="「旅人の唄」 MV highlights (silent, no lyrics)"></a></p>

Unlike 「芽吹の唄」, this one has a single lead: a traveller in a straw hat, with a small blue bird. Both are drawn in this folder's `scenes.js` (`TRAV`, `bird()`), together with the mountains, the floating island, the lanterns and the hooked little fingers.

This folder holds only code and a timing table. **The audio and the lyrics are not in the repo.** To reproduce it:

1. Put a legally obtained copy of the song at `audio/song.mp3`. The timing was made against the 264.1-second version; re-time it if yours differs.
2. Paste the lyrics (Japanese, with the Chinese translation on the next line) into `lyrics.txt`.
3. Run:

   ```bash
   node tools/make_lyrics.mjs tabibito
   ```

4. Preview: <http://localhost:8766/studio.html?project=tabibito&play>
5. Render the whole song:

   ```bash
   ./tools/render_chunks.sh tabibito
   ```

## Storyboard

| Time | Section | Scene | Picture |
|---|---|---|---|
| 0:00 | Intro | `sc_cover` | The cover prints itself, one ink at a time |
| 0:06 | Intro | `sc_map` | The band comes in; the route is dotted across a map, two dashes a beat |
| 0:21 | Line 1 | `sc_climb` | Climbing a mountain with a stick; the far peaks sink as we rise |
| 0:32 | Lines 2–3 | `sc_spring` | A spring overflowing in the forest, a ripple on every beat, sprouts following the stream |
| 0:55 | Chorus, lines 4–6 | `sc_cloudsea` | An island floating above a sea of clouds; on line 6 a light gathers in the traveller's hands |
| 1:19 | Lines 7–8 | `sc_wind` | Wind across a meadow; the bird rides it and lands on a branch on line 8 |
| 1:32 | Lines 9–10 | `sc_skies` | The same hill under a new sky every bar: morning, sunset, stars, rain, a rainbow |
| 1:42 | Line 11 | `sc_campfire` | Asleep by the fire; dreams float up as pencil sketches in bubbles |
| 1:53 | Line 12 | `sc_onward` | Walking alone into the dawn, not looking back |
| 2:03 | Second chorus, line 13 | `sc_cloudsea` | The cloud sea and the island at dusk |
| 2:12 | Line 14 | `sc_promise` | Two little fingers hook together, a light between them |
| 2:24 | Instrumental | `sc_chapter` → `sc_journey` | Chapter page 三, then the whole journey as one long scrolling panorama |
| 2:52 | Line 15 | `sc_lanterns` | Lanterns rise into the night sky, one more every beat |
| 3:04 | Bridge, lines 16–19 | `sc_farewell` | Earlier selves wave from the roadside and fade, one per goodbye; blank pages blow away |
| 3:27 | Last chorus, lines 20–22 | `sc_summit` | Sunrise: the traveller stands on the island, the bird on the hat, a light on the last line |
| 3:52 | Outro | `sc_map` | The finished map |
| 4:07 | Outro | `sc_fin` | おわり and credits |

## Where the timing came from

No lyric video with the same audio and burnt-in subtitles could be found, so the timing comes from speech recognition: [whisper.cpp](https://github.com/ggerganov/whisper.cpp) with the small model and DTW word timestamps (method D in [docs/WORKFLOW.en.md](../../docs/WORKFLOW.en.md)). Each line starts at its first word and ends at its last, checked against the 137 BPM beat grid.

`engine/road.js` gained a lone walker for this MV: when `walk.looks` has a single look, it draws one traveller instead of a pair holding hands.
