// scenes.js (mebuki, first half): cover, road, clock-world, the same days, seedling, field, hilltop.
// Each scene is (P, t, t0) -> print config. Building blocks come from engine/kit.js.

async function sc_cover(P, t, t0) {
  const tt = onTwos(t), lt = t - t0, z = 1 + .012 * lt;
  P.save(); P.translate(W / 2, H / 2); P.scale(z); P.translate(-W / 2, -H / 2);
  P.stroke(bookFrame(P, tt), 'k', 5, 1);
  P.add(rect(120, 100, W - 240, H - 200), { c: .1 });
  P.paint(circle(700, 640, 250), { c: .95 }); P.add(sunPaths(700, 640, 250, 18, t * .04, 1.32).rays, { c: .35 });
  sprout(P, 700, 820, 470, 1.02, tt, { seed: 4, coat: false });
  const mound = curve([[440, 840], [540, 806], [700, 792], [860, 806], [960, 840]], false, tt, 1.2); mound.closePath(); P.paint(mound, { a: .7, c: .35 }); P.stroke(mound, 'k', 3, 1);
  text(P, '芽吹の唄', 1360, 240, 190, F.klee(190, 600), { vertical: true, lh: 1.08 });
  text(P, 'めぶきのうた', 1180, 300, 46, F.klee(46, 400), { vertical: true, drum: 'd', dens: .95 });
  text(P, '大原ゆい子', 1180, 940, 40, F.klee(40, 600), { dens: 1 });
  drift(P, t, { n: 14, kind: 'fluff', drum: 'k', size: 14, speed: -20, wind: 30, seed: 12 });
  P.restore();
  jaVert(P, t, lyricIdx(t), { x: 1690, y: 150, size: 62, maxY: H - 160 });
  zhSub(P, t, lyricIdx(t), { y: H - 36, size: 38 });   // below the book frame, like a caption
  drumPasses(P, t, t0 + .2);   // the cover prints itself, one drum per beat
  return { inks: { k: INK.spruce, a: INK.kelly, c: INK.yellow, d: INK.bubblegum }, mis: 1 + 1.5 * (1 - clamp(lt / 4)) };
}

async function sc_road(P, t, t0) {
  const lt = t - t0, tt = onTwos(t), hor = 470, fr = smooth(inv(barT(8) - .4, barT(10), t));
  ROAD.render(P, tt, {
    z: 9200 + lt * SONG.bpm / 60 / 2 * STEP, camH: 1150, fov: 62, hor, haze: .5,
    blank: fr > 0 ? [lerp(1.05, .07, fr), lerp(1.3, .3, fr)] : null,
    backdrop: (P, pan, top, hor) => skyAndHills(P, t, pan, hor, { ink: lerp(1, .14, fr) }),
    walk: { ahead: 3600, ph: beatOf(tt) * .25, h: 560, looks: [LOOK.a, LOOK.b] },
  });
  lyr(P, t);
  return { inks: INKS.meadow, screens: { k: [45, 6, 2] } };
}

async function sc_clock(P, t, t0, o = {}) {
  const lt = t - t0, dayLen = o.dayLen || beatLen() * 8, d = lt / dayLen, day = Math.floor(d), ph = d - day;
  daySky(P, ph);
  const z = 1 + .04 * lt, R = 330 * z; clockWorld(P, W / 2, 640 + (z - 1) * 120, R, ph, day, t);
  lyr(P, t);
  return { inks: INKS.clock };
}

// ---------- the same day, again and again: a calendar of little worlds, each sprout a bit taller
async function sc_days(P, t, t0, o = {}) {
  const lt = t - t0, cols = 4, rows = 2, pw = 360, ph_ = 360, gx = 46, gy = 56;
  const ox = (W - (cols * pw + (cols - 1) * gx)) / 2 - 110, oy = (H - (rows * ph_ + (rows - 1) * gy)) / 2 + 10;
  P.add(FULL, { c: .08 });
  const step = o.step || beatLen() * SONG.meter;   // one new day per bar
  for (let i = 0; i < cols * rows; i++) {
    const u = clamp((lt - i * step) / .25); if (u <= 0) continue;
    const c = i % cols, r = Math.floor(i / cols), x = ox + c * (pw + gx), y = oy + r * (ph_ + gy), s = lerp(1.25, 1, E.outB(u));
    P.save(); P.translate(x + pw / 2, y + ph_ / 2); P.scale(s); P.rotate((hash(i, 4) - .5) * .05); P.translate(-pw / 2, -ph_ / 2);
    P.each(cx => { cx.save(); cx.beginPath(); cx.rect(0, 0, pw, ph_); cx.clip(); });
    P.erase(rect(0, 0, pw, ph_)); const dph = .16 + .01 * Math.sin(lt + i);   // the same morning, every day
    daySky(P, dph, 0, 0, pw, ph_);
    clockWorld(P, pw / 2, ph_ * .8, 140, dph, 0, t + i * .37, { g0: .22 + i * .1, gPerDay: 0, spin: -.22 - .02 * Math.sin(lt * 1.5 + i) });
    P.each(cx => cx.restore());
    P.stroke(rect(0, 0, pw, ph_), 'k', 4, 1);
    text(P, `${i + 1}`, 28, 36, 34, F.klee(34, 600), { halo: .3 });
    P.restore();
  }
  lyr(P, t, { ja: { x: W - 120 } });
  return { inks: INKS.clock };
}

// ---------- macro: the seedling breaking the soil (g0 -> g1 over dur seconds)
async function sc_sprout(P, t, t0) {
  const lt = t - t0, tt = onTwos(t), soil = 700, B = beatLen();
  // hook breaks the soil, straightens, then the seed leaves open exactly on the next downbeat
  const g = keys(lt, [[0, .02], [B * 1.5, .2], [B * 3.6, .44], [B * 4, .52], [B * 4.4, .6], [B * 14, .86]]);
  P.ramp(FULL, 'b', 0, 0, .32, 0, soil, .04);
  const sun = sunPaths(1580, 190, 70, 14, t * .08); P.erase(circle(1580, 190, 150), ['b']); P.radial(circle(1580, 190, 420), 'c', 1580, 190, 70, .5, 420, 0); P.add(sun.rays, { c: .4 }); P.paint(sun.disc, { c: 1 });
  const top = ridge(x => soil + noise1(x * .01) * 6, -60, W + 60, 30, H + 60, tt);
  P.paint(top, { d: .55 });
  P.add(ridge(x => soil + 26 + noise1(x * .006 + 4) * 10, -60, W + 60, 30, H + 60, tt), { d: .45 });
  P.add(ridge(x => soil + 330 + noise1(x * .005 + 8) * 40, -60, W + 60, 30, H + 60, tt), { k: .12 });
  const sp = rng(9); for (let i = 0; i < 420; i++) { const px = sp() * W, py = soil + 30 + sp() * 380; P.add(circle(px, py, 1.5 + sp() * 2.5), { k: 1 }); }
  const r = rng(5); for (let i = 0; i < 26; i++) { const px = r() * W, py = soil + 40 + r() * 360, pr = 8 + r() * 26; const pb = blob(px, py, pr * 1.4, i, tt, .2, pr); P.paint(pb, { d: .15 }); P.stroke(pb, 'k', 1.6, 1); }
  for (let i = 0; i < 40; i++) { const gx = hash(i, 3) * W, h = 20 + hash(i, 4) * 40, p = new Path2D(); for (let k = -1; k <= 1; k++) { p.moveTo(gx + k * 6, soil + 2); p.quadraticCurveTo(gx + k * 10, soil - h * .6, gx + k * 18 + Math.sin(t + i) * 4, soil - h); } P.stroke(p, 'a', 3, 1); }
  const sx = 960, seedY = soil + 90;
  if (g < .08) { const seed = ellipse(sx, seedY - g * 300, 34, 24, -.3); P.paint(seed, { d: 1 }); P.stroke(seed, 'k', 2.5, 1); }
  roots(P, sx, seedY + 10, 900, g, tt, { seed: 2 });
  const stem = new Path2D(); stem.moveTo(sx, seedY - 10); stem.lineTo(sx, soil); P.stroke(stem, 'a', 16 * clamp(g * 4), 1);
  sprout(P, sx, soil, 470, g, tt, { seed: 1, drums: { coat: 'd' }, stemK: .8, leafK: 1.35, thick: 1.5 });
  lyr(P, t);
  return { inks: INKS.soil, screens: { d: [22, 6, 1] } };
}

// ---------- a whole field answering: rows of sprouts pop up row by row, on the beat
async function sc_field(P, t, t0, o = {}) {
  const lt = t - t0, tt = onTwos(t), hor = 430, cam = lt * .07;
  skyAndHills(P, t, lt * 40, hor, { sunX: 1300, sunY: 190 });
  P.paint(rect(-50, hor + 2, W + 100, H), { a: .32, c: .28 });
  const rows = 12, F2 = W / 2, rowStep = o.rowStep ?? beatLen() * .5;
  for (let r = rows - 1; r >= 0; r--) {
    const z = 1.05 + r * .55 - cam, k = 1 / Math.max(z, .3), y = hor + 470 * k;
    P.add(ridge(x => y + noise1(x * .01 * k + r) * 4 * k, -60, W + 60, 40, y + 34 * k), { d: .38 * clamp(k * 1.3), k: .04 });
    const n = 6 + r * 2, popAt = (o.pop0 ?? .2) + r * rowStep;
    for (let i = 0; i < n; i++) {
      const jit = hash(i, r * 3 + 1) - .5, wx = (i - (n - 1) / 2 + jit * .5) * 300, x = F2 + wx * k + Math.sin(r * 3.1) * 50 * k, yy = y + jit * 10 * k;
      const u = (lt - popAt - hash(i, r) * rowStep * .9) / 1.1;
      P.paint(ellipse(x, yy + 3 * k, 26 * k, 8 * k), { d: .75 }); P.stroke(ellipse(x, yy + 3 * k, 26 * k, 8 * k), 'k', Math.max(.8, 2 * k), 1);
      if (u > 0) sprout(P, x, yy, 230 * k, clamp(.12 + u * .5, 0, .555), tt + i * .3, { seed: i + r * 7, coat: true, sway: .7, bud: false, stemK: .42, leafK: 1.6 });
    }
  }
  drift(P, t, { n: 26, kind: 'fluff', drum: 'k', size: 16, speed: -28, wind: 50 });
  lyr(P, t);
  return { inks: { ...INKS.meadow, d: INK.brown } };
}

async function sc_together(P, t, t0, o = {}) {
  const lt = t - t0, tt = onTwos(t), dur = o.dur || 14, z = 1.12 - .1 * E.ioS(clamp(lt / dur));
  P.save(); P.translate(W / 2, H * .62); P.scale(z); P.translate(-W / 2, -H * .62);
  const hor = 640;
  P.ramp(FULL, 'b', 0, 0, .42, 0, hor, 0); P.ramp(FULL, 'c', 0, hor, .7, 0, 120, 0); P.ramp(FULL, 'd', 0, hor, .65, 0, 330, 0);
  const sx = 1250, sy = hor - 40, sun = sunPaths(sx, sy, 120, 20, t * .03, 2.6); P.add(sun.rays, { c: .5, d: .15 }); P.paint(sun.disc, { c: 1, d: .3 });
  for (const [cx, cy, w, h, sd] of [[420, 220, 520, 120, 2], [1600, 160, 420, 100, 9]]) { const cp = cloudPath(cx + lt * 6, cy, w, h, sd, tt); P.paint(cp, { d: .25, c: .2 }); P.outline(cp, 'k', 1.6, 1); }
  P.paint(ridge(x => hor + 10 - 40 * (fbm1(x * .002 + 5) + .5), -60, W + 60, 24, H + 60, tt), { a: .4, c: .35, d: .22, b: .1 });
  const hill = ridge(x => 760 + Math.pow((x - 860) / 900, 2) * 260, -200, W + 200, 20, H + 400, tt); P.paint(hill, { a: .9, b: .25 }); P.outline(hill, 'k', 2.5, 1);
  for (let i = 0; i < 50; i++) { const gx = hash(i, 8) * W, gy = 760 + Math.pow((gx - 860) / 900, 2) * 260, p = new Path2D(); p.moveTo(gx, gy + 2); p.quadraticCurveTo(gx + 4, gy - 14, gx + 9 + Math.sin(t * 1.5 + i) * 3, gy - 24); P.stroke(p, 'k', 2, 1); }
  sprout(P, 860, 762, 330, lerp(.75, 1.05, clamp(lt / dur)), tt, { seed: 8, sway: .8, budDrum: 'd' });
  sitter(P, 750, 766, 230, LOOK.a, tt, .1); sitter(P, 975, 768, 210, LOOK.b, tt, -.12);
  drift(P, t, { n: 30, kind: 'petal', drum: 'd', size: 12, speed: 50, wind: 40, seed: 3 });
  P.restore();
  lyr(P, t, { ja: { x: 260 } });
  return { inks: INKS.dusk };
}

// ---------- last page of the pilot
async function sc_end(P, t, t0) {
  const lt = t - t0, tt = onTwos(t);
  P.stroke(bookFrame(P, tt), 'k', 5, 1); P.add(rect(120, 100, W - 240, H - 200), { c: .08 });
  P.paint(circle(760, 560, 190), { c: .9 });
  sprout(P, 760, 700, 300, lerp(.6, 1.05, E.outQ(clamp(lt / 3))), tt, { seed: 11, sway: .8 });
  const mound = curve([[600, 716], [680, 690], [760, 684], [840, 690], [920, 716]], false, tt, 1.2); mound.closePath(); P.paint(mound, { a: .7, c: .35 }); P.stroke(mound, 'k', 3, 1);
  text(P, 'つづく', 1170, 470, 120, F.klee(120, 600), { vertical: true, lh: 1.1, dens: clamp(lt / .8) });
  const ca = clamp((lt - 1.2) / .8);
  if (ca > 0) { text(P, '「芽吹の唄」　作詞・作曲・歌：大原ゆい子　編曲：MANYO', W / 2, H - 170, 30, F.klee(30, 600), { dens: ca });
    text(P, '中文翻譯：rarab89w57（巴哈姆特）', W / 2, H - 126, 26, F.wenkai(26, 400), { dens: ca * .9 }); }
  return { inks: INKS.meadow };
}
