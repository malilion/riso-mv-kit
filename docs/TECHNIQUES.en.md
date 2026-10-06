<p align="right"><a href="TECHNIQUES.md">中文</a> · <b>English</b></p>

# Techniques and patterns

How the pictures in these videos are made, and the habits worth keeping when you write new scenes. Each section points to the code that does it.

---

## 1. The risograph engine (`engine/riso.js`)

A real risograph prints one colour per drum, and the paper goes through the machine once for every colour. The engine works the same way:

- **Draw on drums, not in colours**: a scene draws how much ink goes where (canvas alpha is ink density) on five drums: `k` (line art), `a`, `b`, `c` and `d`. `RISO.print()` then decides which ink sits on each drum and composites them on the GPU.
- **Overprinting multiplies**: riso inks are translucent, so yellow over blue turns green. The compositor multiplies each drum's ink over the paper colour.
- **Ways to draw**:
  - `P.paint(path, {a: .8})` is opaque: it clears every drum inside the shape first, then lays down ink. Use it for objects in front.
  - `P.add(path, {c: .3})` overprints without clearing anything. Use it for light, shadow and gradients.
  - `P.erase(path)` clears back to bare paper.
  - `P.stroke` draws lines; `P.outline` draws only the outer edge of a union of shapes (a cloud made of many circles gets one outline, not one per circle).
- **Halftone screens**: wherever the density is below 1, the ink is printed as halftone dots, at a different angle on every drum (15°, 45°, 75°…), which gives the rosette pattern of printed matter. `screens` sets the angle, the cell size and the mode: `1` for dots, `2` for grain (used for pencil lines). Lines are always printed solid so the screen never cuts them into dashes.
- **Misregistration**: every drum has its own fixed offset, plus a random jitter of about a pixel on every print.
- **Uneven ink and paper**: solid areas get mottling and tiny starved white specks; the paper gets fibres and tooth; then grain and a slight vignette.

## 2. On twos, and printing every drawing again (`engine/core.js`)

- `onTwos(t)` snaps time to 12 drawings a second, and `boilSeed(t)` changes the random seed with every drawing.
- Lines wobble slightly on every drawing through `boil()` and `curve()`, and the misregistration and ink mottling are re-rolled too, so the result looks like a hand-drawn flip book printed page by page.
- Camera positions and the lyric reveal use continuous time `t` and stay smooth at 30 fps. **Use `tt = onTwos(t)` for the handmade parts and `t` for what should glide.**

## 3. Picture-book drawing (`engine/draw.js`, `engine/kit.js`)

- `curve(points, closed, t)`: a smooth curve through points, plus the wobble. Every hand-drawn shape starts here.
- `blob` (a wobbly circle), `cloudPath`, `ridge` (hill silhouettes), `leafPath`, `sunPaths` (the sun and its rays).
- Characters: `walker` (seen from behind), `walkerSide` (walking in profile; returns both hand positions so figures can hold hands), `pair`, `pairSide`, `sitter` (sitting, seen from behind). Their outfits live in `LOOK`, written as ink densities per drum.
- Building blocks in `kit.js`:
  - skies: `skyAndHills` (sky, sun, clouds, distant hills), `daySky` (a sky that cycles through day and night)
  - `clockWorld`: the little clock planet, where one turn is one day
  - weather and light: `rainFx` (rain that can leave a dry patch under an umbrella), `godRays` (light through gaps in the clouds)
  - objects: `umbrella`, `blossom` (from bud to full flower), `TREASURE` (12 small treasure icons)
  - pages: `chapterPage`, `bookFrame` (the picture-book border)
  - effects: `drumPasses` (the drum-by-drum print reveal), `inkProxy` (the pencil fade)

## 4. Seedlings (`engine/plant.js`)

In `sprout(P, x, y, height, g, t, options)`, `g` runs from 0 to 1 through the real stages of germination:

| g | Stage |
|---|---|
| 0.04–0.30 | the stem breaks the soil bent into a hook, still wearing the seed coat |
| 0.22–0.46 | it straightens |
| 0.42–0.58 | the seed coat falls off and two round seed leaves open |
| 0.56–0.95 | a pair of pointed true leaves grows from the tip |
| 0.86–1.00 | a bud |

- Options: `stemK` (stem length), `leafK` (seed leaf size), `thick`, `sway`, `bud`, `coat`. A short stem with big seed leaves gives a field of cute two-leaf sprouts.
- **Time the growth to the music**: instead of linear time, use keyframes such as `keys(lt, [[0, .02], [B * 3.6, .44], [B * 4, .52], ...])` so the seed leaves open exactly on a downbeat.

## 5. The road that goes on (`engine/road.js`)

A pseudo-3D road (segment projection, as in OutRun):

- The road is made of many segments, each with its own curve and height. Stacking the bends and slopes gives a country road that rises and falls into the distance.
- **The ground is drawn near to far.** Each ground band only draws the part not yet hidden by a nearer hill, so bands can simply overprint without clearing anything.
- **Roadside objects are drawn far to near**, clipped behind nearer terrain, so hills hide them correctly.
- Fields are strips parallel to the road that converge on the horizon, each with its own crop (a different mix of densities and drums), with blue aerial perspective in the distance.
- `blank: [from, to]` fades the distance into **paper that has not been printed yet**, leaving only pencil lines: a way to show a future you cannot see yet.

## 6. Lyric typesetting (`engine/type.js`)

- Japanese runs vertically and each character prints at its own moment with a little springy scale. Time is shared out by the weight of each character: kana 1, small kana 0.45, kanji 1.6, and a space is a pause.
- When a line has a space in it, `parts` gives each phrase its own time window, so the reveal waits through the breath.
- A line that does not fit wraps into two even columns, and small kana shift up and to the right.
- Every character gets a ring of bare paper cleared on all drums around it (`haloText`), so it reads on any background. The Chinese subtitle sits underneath, set in LXGW WenKai.
- `lyricIdx(t)` finds the line to show; `lyr(P, t, placement)` draws the Japanese and the Chinese in one call.

## 7. Timeline and beat (`engine/timeline.js`, `tools/analyze.mjs`)

- All song time comes from `bpm` and `phase` (the first downbeat) in `song.json`, for example `beatOf`, `barT` and `pulse`.
- Most pop songs move in 8-bar phrases. Subtitles and vocals usually start about 0.2 s after the bar line, so scenes are scheduled on the bar line just before their lyric line (`barBefore`), and transitions finish exactly there.
- **How the tempo analysis works**:
  1. Autocorrelation of the spectral flux finds bpm candidates.
  2. Half and double tempo are resolved by preferring 80–160 bpm.
  3. A fine search in steps of 0.01 bpm within ±1.5%: a 1% error drifts a whole beat within a minute.
  4. Low-frequency onsets decide which beat is the downbeat.
  5. Drift of the beat grid is checked every 20 seconds to confirm the tempo is constant.

## 8. Transitions (`engine/transitions.js`)

Transitions work on finished prints (RGB), so the two pages can use different inks.

- `page`: a page turns from the bottom-right corner. The lifted part is mirrored across the fold and shows the paper back, with a faint show-through of the old print, like ink seen through thin paper. The fold gets a highlight and the newly revealed page gets a shadow.
- `fade`: a fade in. At the very end the whole picture fades back to paper.

## 9. The drum-by-drum opening

`drumPasses(P, t, start)` lets one drum's ink roll down the sheet on every beat, light inks first: yellow, green, pink, and the black line art last. On the light drums you can see the areas left empty for the other colours, just like a real colour separation.

## 10. The pencil fade (`inkProxy`)

`inkProxy(P, k)` takes the same drawing calls but multiplies every ink density by `k` and adds a pencil outline. Together with a grain screen on the `k` drum (`screens: { k: [45, 6, 2] }`), faint lines look like graphite. Use it for things that are "not printed yet": the distance, the past, memories.

## 11. Memory cards (`RISO.snapshot`)

`RISO.snapshot(name, Q => someScene(Q, time, start))` draws another scene onto the drums, keeps a half-size copy (each scene is drawn only once), and lets you paste it back into the current picture as a card. Good for looking back at earlier pages. Set `window.NO_LYRICS = true` while taking snapshots so the lyrics are not printed onto the cards.

## 12. Reading timing from a lyric video (`tools/video-lyric-scan.js`)

The script plays the video muted at 2x and compares the white text in the subtitle area on every frame. It records each time the subtitle changes, and how much "ink" (text pixels, roughly proportional to the number of characters) was on screen.

- Browsers do not draw video frames while the tab is hidden, so the tab must stay visible during the scan. The script pauses when you switch away and continues when you come back.
- Matching subtitles to lyric lines:
  - The ratio of characters to ink confirms which subtitle belongs to which line.
  - Two lines in one subtitle: split them with the phrase length and the vocal onset.
  - One line split across two subtitles: give each half its own subtitle.

## 13. Vocal analysis (`tools/vocal.mjs`)

The lead vocal usually sits in the middle of the mix, so for every frequency the script takes the mid level minus the side level and adds it up over 250–3500 Hz. The result shows roughly where the singing is and where the singer breathes.

- Sections with the full band playing are noisier, so read them together with the phrase structure.
- Quiet sections are very accurate.

## 14. Chunked rendering (`tools/render_chunks.sh`)

Each JPG frame is about 1.3 MB, so a whole song needs well over 10 GB. Chunked rendering avoids that:

1. Render one chunk.
2. Encode it with the same x264 settings as every other chunk.
3. Delete that chunk's frames, then move on to the next.
4. When all chunks are done, join them losslessly with concat and add the music and the fade-out.

Running it again skips the chunks that are already finished. The renderer can resume too: frames that already exist are skipped, and a page that fails to load its fonts or data is retried.

## 15. Small rules for new scenes

- **Give each drum a role first**, for example `a` plants, `b` sky and shade, `c` light, `d` accent, and keep it the same across one video. Memory cards, transitions and the overall palette then stay consistent.
- **`paint` for things in front, `add` for light and shade**, `outline` for edges.
- **`tt` for handmade motion, `t` for the camera.**
- **Put important moments on the beat** with `barT`, `beatOf` and `keys`.
- **Move the lyrics with each scene** so they stay off the main character. The paper halo keeps them readable on top of the background.
- Tune one scene on its own with `?scene=name&t=seconds` before adding it to `story.js`.
