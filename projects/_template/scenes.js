// scenes.js (template): small scenes built from engine/kit.js — copy, rename and change freely.
// A scene is (P, t, t0) -> print config. t = song time, t0 = this scene's start; draw on drums
// k (lines) a (green) b (blue) c (yellow) d (accent) with P.paint / P.add / P.stroke / P.outline.

// ---------- cover: title + sprout under the sun, printed one drum per beat
async function sc_title(P, t, t0) {
  const tt = onTwos(t);
  P.stroke(bookFrame(P, tt), 'k', 5, 1); P.add(rect(120, 100, W - 240, H - 200), { c: .1 });
  P.paint(circle(700, 640, 250), { c: .95 }); P.add(sunPaths(700, 640, 250, 18, t * .04, 1.32).rays, { c: .35 });
  sprout(P, 700, 820, 470, 1.02, tt, { seed: 4, coat: false });
  const mound = curve([[440, 840], [540, 806], [700, 792], [860, 806], [960, 840]], false, tt, 1.2); mound.closePath(); P.paint(mound, { a: .7, c: .35 }); P.stroke(mound, 'k', 3, 1);
  text(P, SONG.title || '', 1360, 240, 170, F.klee(170, 600), { vertical: true, lh: 1.08 });
  text(P, SONG.artist || '', 1180, 940, 40, F.klee(40, 600));
  drumPasses(P, t, t0 + .2);
  return { inks: { k: INK.spruce, a: INK.kelly, c: INK.yellow, d: INK.bubblegum } };
}
// ---------- the two travellers walking through a meadow, seen from behind
async function sc_meadow(P, t, t0) {
  const lt = t - t0, tt = onTwos(t), hor = 520;
  skyAndHills(P, t, lt * 30, hor);
  const field = ridge(x => hor + 40 + Math.sin(x * .003 + lt * .2) * 12, -60, W + 60, 30, H + 60, tt); P.paint(field, { a: .75, c: .2 }); P.outline(field, 'k', 2, 1);
  for (let i = 0; i < 60; i++) { const x = hash(i, 1) * W, y = hor + 80 + hash(i, 2) * 420; blossom(P, x, y, 10 + hash(i, 3) * 10, 1, tt, { col: i % 2 ? { d: .9 } : { c: 1 } }); }
  pair(P, 960, 900, 300, beatOf(tt) * .25, tt, [LOOK.a, LOOK.b]);
  drift(P, t, { n: 24, kind: 'petal', drum: 'd', size: 12, speed: 45, wind: 50 });
  lyr(P, t);
  return { inks: INKS.meadow };
}
// ---------- rain; the two keep a seedling dry under an umbrella
async function sc_rainy(P, t, t0) {
  const lt = t - t0, tt = onTwos(t);
  P.ramp(FULL, 'b', 0, 0, .6, 0, H, .3); P.add(FULL, { k: .06 });
  const ground = ridge(x => 800 + noise1(x * .004) * 10, -60, W + 60, 30, H + 60, tt); P.paint(ground, { a: .55, b: .3 }); P.outline(ground, 'k', 2, 1);
  sprout(P, 1270, 830, 230, .62, tt, { seed: 17, sway: .5 });
  const U = umbrella(P, 1230, 520, 250, -.12 + Math.sin(t * 1.3) * .015, t, { col: { d: .9 } });
  const A = walkerSide(P, 960, 846, 330, .1, LOOK.a, tt);
  const shaft = new Path2D(); shaft.moveTo(...U.shaftTop); shaft.lineTo(A.front[0] + 8, A.front[1] - 4); P.stroke(shaft, 'k', 5, 1);
  rainFx(P, t, { n: 420, drum: 'b', dens: 1, lw: 2.6, len: 64, shelter: U.shelter });
  lyr(P, t);
  return { inks: { ...INKS.meadow, d: INK.coral } };
}
// ---------- rows of seedlings pop up, one row per eighth note
async function sc_sprouts(P, t, t0) {
  const lt = t - t0, tt = onTwos(t), hor = 430, B = beatLen();
  skyAndHills(P, t, lt * 40, hor, { sunX: 1300, sunY: 190 });
  P.paint(rect(-50, hor + 2, W + 100, H), { a: .32, c: .28 });
  for (let r = 9; r >= 0; r--) { const k = 1 / (1.05 + r * .55), y = hor + 470 * k, n = 6 + r * 2;
    for (let i = 0; i < n; i++) { const x = W / 2 + (i - (n - 1) / 2) * 300 * k, u = (lt - .2 - r * B * .5) / 1.1;
      if (u > 0) sprout(P, x, y, 230 * k, clamp(.12 + u * .5, 0, .555), tt + i * .3, { seed: i + r * 7, sway: .7, bud: false, stemK: .42, leafK: 1.6 }); } }
  lyr(P, t);
  return { inks: { ...INKS.meadow, d: INK.brown } };
}
// ---------- last page
async function sc_last(P, t, t0) {
  const lt = t - t0, tt = onTwos(t);
  P.stroke(bookFrame(P, tt), 'k', 5, 1); P.add(rect(120, 100, W - 240, H - 200), { c: .08 });
  P.paint(circle(760, 540, 210), { c: .9 });
  const G = sprout(P, 760, 720, 330, 1, tt, { seed: 11, sway: .8, bud: false });
  if (G) blossom(P, G.tip[0], G.tip[1] - 6, 46, E.outB(clamp((lt - .6) / 1.4)), tt, { col: { d: .9 } });
  text(P, 'おわり', 1170, 420, 120, F.klee(120, 600), { vertical: true, lh: 1.1, dens: clamp(lt / .8) });
  text(P, [SONG.title, SONG.artist].filter(Boolean).join('　'), W / 2, H - 150, 30, F.klee(30, 600), { dens: clamp((lt - 1.2) / .8) });
  return { inks: { ...INKS.meadow, d: INK.coral } };
}
