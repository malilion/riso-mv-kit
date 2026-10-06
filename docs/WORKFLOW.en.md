<p align="right"><a href="WORKFLOW.md">中文</a> · <b>English</b></p>

# Workflow: from a song to a music video

The examples use `my-song` as the project name. Run every command from the repo root.

## 0. Setup

```bash
npm install
```

You need Node.js 18+, Google Chrome and ffmpeg (`brew install ffmpeg`). Keep the server running for the whole production:

```bash
node tools/server.mjs
```

Run it in a terminal tab rather than as a background job that may be stopped automatically.

## 1. Create the project

```bash
./tools/new_project.sh my-song
```

This copies `projects/_template` to `projects/my-song/`:

| File | Purpose |
|---|---|
| `song.json` | `title`, `artist`, `audio` (relative to the project folder), `bpm`, `phase` (time of the first downbeat in seconds), `meter` (beats per bar), `dur` (video length), `fadeOut` (fade at the end, seconds), `scripts` (scene files to load), `fontSample` (characters used by titles and credits, so the fonts get loaded) |
| `timing.json` | When each lyric line is sung. Numbers only, safe to commit |
| `story.js` | The storyboard: which scene appears when |
| `scenes.js` | The scenes themselves |
| `lyrics.example.txt` | Lyrics file format |
| `lyrics.sample.json` | Placeholder lyrics for testing the layout before you have real ones |

## 2. Add the audio and lyrics

- Put the audio at `projects/my-song/audio/song.mp3`. For another file name, change `audio` in `song.json`.
- Copy `lyrics.example.txt` to `lyrics.txt` and paste the lyrics: one Japanese line, then its translation on the next line. Romaji lines and credit lines (lyricist, composer, etc.) are skipped automatically, so you can paste a whole block from a lyrics site. The parsing rules are in `engine/lyrics.js`.

The audio and the lyrics are both in `.gitignore`, so they never go to GitHub.

## 3. Analyse the tempo

```bash
node tools/analyze.mjs my-song
```

It writes `bpm` and `phase` (the first downbeat) to `song.json` and prints:

- **Beat-grid drift every 20 seconds**: if it stays within ±0.01 s, the tempo is constant and scenes can safely be scheduled by bar.
- **The energy curve of the whole song**: sudden rises or drops usually mark section boundaries, such as verse into chorus, an interlude, or the quiet part before the last chorus. Use it to plan the storyboard.

If the bpm comes out at half or double speed, give it yourself:

```bash
node tools/analyze.mjs my-song 137
```

Once it is right, add `"bpmLocked": true` to `song.json` so re-running the analysis keeps it.

## 4. Lyric timing

The format of `timing.json`:

```json
{ "lines": [
  { "t0": 1.30, "t1": 13.6, "parts": [[1.30, 6.6], [7.5, 13.6]] },
  { "t0": 15.03, "t1": 20.4 }
]}
```

- `t0`: when the line starts being sung
- `t1`: when it ends
- `parts` (optional): when a line has a space in it, a time window for each phrase. The glyph-by-glyph reveal then waits through the breath and resumes when the next phrase starts.

Three ways to get the times:

**A. Tap along (most accurate, takes a few minutes)**
Open <http://localhost:8766/timing.html?project=my-song>. Hold space as soon as a line starts and release it when the line ends. Each line is saved to `lyrics.json` as soon as you finish it. When you are done, run this to copy the numbers into `timing.json` so they can live in the repo:

```bash
node tools/make_lyrics.mjs my-song --extract
```

**B. Read them from a lyric video**
If there is a lyric video of the same recording with the subtitles burned into the picture (check that its length matches your audio file), `tools/video-lyric-scan.js` can read the time of every subtitle change:

1. Open the video page in a browser and paste the script into the console. Claude can also run it in its built-in browser.
2. **Keep the tab visible**: browsers do not draw video frames in a hidden tab. The script pauses when you switch away and continues when you come back.
3. When it is done, `copy(JSON.stringify(__lyricScan.segments(), null, 1))` gives the start, end and "ink" of every subtitle.
4. Match them to the lyrics:
   - The ink is roughly proportional to the number of characters, which confirms the order.
   - One subtitle may hold two lines: split it using the phrase length (usually 8 bars) and the vocal onset.
   - One line may also be split across two subtitles.
5. Find where lines end and where the singer breathes with the vocal analysis:

   ```bash
   node tools/vocal.mjs my-song 90 180
   ```

   It prints the vocal level every 0.5 s; the dips are the pauses.

This only watches the video play; it never downloads it. Use it only on videos you may legally watch.

**C. Write them yourself**
Edit `timing.json` directly.

Finally, merge everything into the `lyrics.json` that the studio reads:

```bash
node tools/make_lyrics.mjs my-song
```

## 5. Storyboard and scenes

**`story.js`** schedules the scenes. Each entry can give its start time in one of four ways:

| Entry | Meaning |
|---|---|
| `{ bar: 8, fn }` | the downbeat of bar 8 |
| `{ line: 5, fn }` | the bar line just before line 5 (counting from 0) is sung |
| `{ after: 21, fn }` | the first bar line after line 21 has ended |
| `{ at: 12.5, fn }` | an absolute time in seconds |

Add `tr: 'page'` (page turn) or `tr: 'fade'` (fade in) and the transition finishes exactly when the scene starts. `STORY` can also be a function that returns a different list depending on how many lines are timed, for example a short pilot or the full cut.

**`scenes.js`**: every scene is `async (P, t, t0) => print settings`:

- `t` is the song time and `t0` the time this scene starts.
- `P` holds five ink drums: `k` line art, `a` green, `b` blue, `c` yellow, `d` accent. Draw with `P.paint` (opaque: clears what is underneath), `P.add` (overprint), `P.stroke`, `P.outline` and `P.ramp` (a gradient that prints as a halftone).
- Return `{ inks: { k, a, b, c, d } }` to choose the ink on each drum. `INK` is the swatch book of risograph inks and `INKS` holds a few ready-made sets. You can also set `screens` (halftone angle, cell size and mode), `mis` (misregistration), `grain`, `vig` and `flash`.
- Ready-made building blocks live in `engine/kit.js`:
  - skies and hills, a day-and-night sky, the clock-world
  - a sitting figure, rain, light through the clouds, an umbrella, flowers, treasure icons
  - a chapter page, the drum-by-drum print reveal, the pencil fade
- All 19 scenes of 「芽吹の唄」 are in `projects/mebuki/`; copy any of them and change it.

Useful for staying on the beat:

- `beatOf(t)`: which beat it is
- `barT(n)`: the time of bar n
- `pulse(t)`: a pulse that decays after every beat
- `keys(lt, [[seconds, value], ...])`: keyframes, for example to open the seed leaves exactly on a downbeat
- Walking pace: `beatOf(tt) * .25`, one step every two beats

Move the lyrics with `lyr(P, t, { ja: { x, y, size }, zh: { y } })`.

Testing a single scene:

- Preview: `studio.html?project=my-song&scene=sc_rainy&t=3`
- Save frames:

  ```bash
  node tools/render.mjs --project=my-song --stills=3,10,25
  ```

  The frames are saved to `qa/my-song/`.

## 6. Preview

Open <http://localhost:8766/studio.html?project=my-song&play> and click the page to start. Add `&from=60` to start at 60 seconds. The live preview may run slower than real time; the rendered video is what counts.

## 7. Render and encode

**The whole song** (recommended):

```bash
./tools/render_chunks.sh my-song
```

It works in 100-second chunks: render, encode, delete the frames, then the next chunk. At the end the chunks are joined without re-encoding and the music is added. If it stops, run it again and it continues with the chunks that are not finished yet. Output:

- `video/my-song.mp4`: the master
- `video/my-song_share.mp4`: about 6 Mbps, easier to send

**A short section or a pilot**:

```bash
node tools/render.mjs --project=my-song --range=0:90 --workers=4
```

```bash
./tools/encode.sh my-song
```

**Disk space**: each frame is about 1.3 MB, so a 5-minute song is about 13 GB of frames. Render whole songs in chunks.

**Speed**: on an M1 with 4 workers, 30 to 160 ms per frame, so a 5-minute song takes about 10 to 30 minutes.

## 8. Troubleshooting

- **"page not ready" keeps appearing**: the fonts come from Google Fonts, so a network connection is needed. The renderer retries automatically.
- **The server stopped in the middle of a render**: run the server in a terminal tab.
- **The lyric-video scan stays at 0%**: the video tab is not visible on screen.
- **Publishing**: switch to a legally obtained recording, and credit the song and the translator at the end.
