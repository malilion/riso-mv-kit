// scenes2.js (mebuki, second half): verse 2, chorus 2, the bridge, the last chorus and the ending.

async function sc_chapter2(P, t, t0) { chapterPage(P, t, t0, '二'); return { inks: INKS.meadow }; }

async function sc_chapter3(P, t, t0) { chapterPage(P, t, t0, '三'); return { inks: { ...INKS.meadow, d: INK.coral } }; }

async function sc_lineage(P, t, t0, o = {}) {
  const lt = t - t0, tt = onTwos(t), dur = o.dur || 14, n = 16, gap = 210, worldW = (n - 1) * gap;
  const camX = lerp(-200, worldW - W + 520, E.ioS(clamp(lt / dur))), ridgeY = wx => 700 + Math.sin(wx * .0016 + 1) * 60 + Math.sin(wx * .0041) * 18;
  P.ramp(FULL, 'b', 0, 0, .4, 0, 640, 0); P.ramp(FULL, 'c', 0, 700, .65, 0, 160, 0); P.ramp(FULL, 'd', 0, 700, .5, 0, 380, 0);
  const sx = 1500 - camX * .08, sun = sunPaths(sx, 560, 110, 20, t * .03, 2.4); P.add(sun.rays, { c: .45, d: .1 }); P.paint(sun.disc, { c: 1, d: .25 });
  P.paint(ridge(x => 640 - 50 * (fbm1((x + camX * .3) * .0021 + 2) + .5), -60, W + 60, 24, H + 60, tt), { b: .3, d: .25, a: .15 });
  const hill = ridge(x => ridgeY(x + camX) + 40, -60, W + 60, 20, H + 100, tt); P.paint(hill, { a: .85, b: .2 }); P.outline(hill, 'k', 2.4, 1);
  for (let i = 0; i < 70; i++) { const wx = i * 41 - (camX % 41), gy = ridgeY(wx + camX) + 40, p = new Path2D(); p.moveTo(wx, gy + 2); p.quadraticCurveTo(wx + 4, gy - 12, wx + 8 + Math.sin(t * 1.4 + i) * 3, gy - 22); P.stroke(p, 'k', 2, 1); }
  // the chain, oldest on the left; each holds the next one's hand
  const hands = [];
  for (let i = 0; i < n; i++) {
    const wx = i * gap, x = wx - camX; if (x < -250 || x > W + 250) { hands.push(null); continue; }
    const last = i >= n - 2, kin = last ? (i === n - 1 ? LOOK.a : LOOK.b) : KIN[i % KIN.length], s = (last ? 230 : 200 + 50 * hash(i, 3)) * (i % 5 === 2 ? .7 : 1);
    const k = last ? 1 : smooth(inv(0, worldW * .92, wx)) * .9, Q = inkProxy(P, k);
    hands.push(walkerSide(Q, x, ridgeY(wx) + 40, s, beatOf(tt) * .25 + i * .13, kin, tt));
    hands[i].k = k;
  }
  for (let i = 0; i + 1 < n; i++) { const A = hands[i], B = hands[i + 1]; if (!A || !B) continue; const p = new Path2D();
    p.moveTo(A.front[0], A.front[1]); p.quadraticCurveTo((A.front[0] + B.back[0]) / 2, Math.max(A.front[1], B.back[1]) + 14, B.back[0], B.back[1]); P.stroke(p, 'k', 4, Math.min(A.k, B.k) > .5 ? 1 : .38); }
  lyr(P, t);
  return { inks: INKS.dusk, screens: { k: [45, 6, 2] } };
}

async function sc_umbrella(P, t, t0, o = {}) {
  const lt = t - t0, tt = onTwos(t), dur = o.dur || 26, clear = smooth(inv(dur - 6, dur - 1, lt));   // the rain eases at the end
  P.ramp(FULL, 'b', 0, 0, lerp(.6, .3, clear), 0, H, lerp(.32, .08, clear)); P.add(FULL, { k: .07 * (1 - clear) });
  if (clear > .01) P.radial(FULL, 'c', 1500, 120, 40, .7 * clear, 900, 0);
  P.paint(ridge(x => 520 - 60 * (fbm1(x * .0024 + 6) + .5), -60, W + 60, 24, H + 60, tt), { b: .45, a: .3 });
  for (let i = 0; i < 6; i++) { const tx = 150 + i * 330 + hash(i, 2) * 60, tr = blob(tx, 470, 70 + hash(i) * 30, i + 5, tt, .14); P.paint(rect(tx - 7, 470, 14, 70), { b: .7, k: .3 }); P.paint(tr, { a: .55, b: .45 }); }
  const ground = ridge(x => 800 + noise1(x * .004) * 10, -60, W + 60, 30, H + 60, tt); P.paint(ground, { a: .55, b: .3 }); P.outline(ground, 'k', 2, 1);
  for (const [px, py, pw] of [[420, 900, 160], [1500, 960, 220], [980, 1010, 120]]) { P.paint(ellipse(px, py, pw, pw * .16), { b: .7, a: .2 });
    for (let k = 0; k < 2; k++) { const u = ((lt * 1.3 + k * .5 + px) % 1); P.stroke(ellipse(px + (k - .5) * pw * .4, py, pw * .25 * u, pw * .05 * u), 'k', 1.5, (1 - u) * (1 - clear) > .3 ? 1 : .4); } }
  // the seedling and the two keeping it dry
  const sx = 1270, sy = 830; sprout(P, sx, sy, 230, lerp(.5, .66, clamp(lt / dur)), tt, { seed: 17, sway: .5 });
  const U = umbrella(P, 1230, 520, 250, -.12 + Math.sin(t * 1.3) * .015, t, { col: { d: .9 } });
  const ph = .1 + Math.sin(t * .8) * .02;
  const B = walkerSide(P, 860, 842, 300, ph + .5, LOOK.b, tt), A = walkerSide(P, 960, 846, 330, ph, LOOK.a, tt);
  const shaft = new Path2D(); shaft.moveTo(...U.shaftTop); shaft.lineTo(A.front[0] + 8, A.front[1] - 4); shaft.quadraticCurveTo(A.front[0] + 6, A.front[1] + 22, A.front[0] - 12, A.front[1] + 18); P.stroke(shaft, 'k', 5, 1);
  const hold = new Path2D(); hold.moveTo(B.front[0], B.front[1]); hold.quadraticCurveTo((B.front[0] + A.back[0]) / 2, Math.max(B.front[1], A.back[1]) + 14, A.back[0], A.back[1]); P.stroke(hold, 'k', 4, 1);
  const rainAmt = 1 - clear; if (rainAmt > .02) rainFx(P, t, { n: Math.round(460 * rainAmt), drum: 'b', dens: 1, lw: 2.6, len: 64, shelter: U.shelter });
  lyr(P, t);
  return { inks: { ...INKS.meadow, d: INK.coral } };
}

// ---------- chorus 2a: the field from the first chorus, grown — buds open into flowers row by row, on the beat
async function sc_bloom(P, t, t0, o = {}) {
  const lt = t - t0, tt = onTwos(t), hor = 430, cam = lt * .06, B = beatLen();
  skyAndHills(P, t, lt * 40, hor, { sunX: 1250, sunY: 170 });
  P.paint(rect(-50, hor + 2, W + 100, H), { a: .5, c: .3 });
  const rows = 11, F2 = W / 2;
  for (let r = rows - 1; r >= 0; r--) {
    const z = 1.05 + r * .55 - cam, k = 1 / Math.max(z, .3), y = hor + 470 * k, n = 6 + r * 2, popAt = .2 + r * B * .5;
    for (let i = 0; i < n; i++) {
      const jit = hash(i, r * 3 + 1) - .5, x = F2 + (i - (n - 1) / 2 + jit * .5) * 300 * k + Math.sin(r * 3.1) * 50 * k, yy = y + jit * 10 * k;
      const G = sprout(P, x, yy, 260 * k, .8, tt + i * .3, { seed: i + r * 7, coat: false, sway: .8, bud: false, stemK: .8 });
      if (!G) continue; const [bx, by] = G.tip, op = clamp((lt - popAt - hash(i, r) * B) / .5);
      blossom(P, bx, by, 40 * k, op, tt, { col: (i + r) % 3 === 0 ? { c: 1 } : (i + r) % 3 === 1 ? { d: .9 } : {}, center: (i + r) % 3 === 0 ? { d: .8 } : { c: 1 }, rot: i + r });
    }
  }
  drift(P, t, { n: 34, kind: 'petal', drum: 'd', size: 12, speed: 45, wind: 60, seed: 8 });
  lyr(P, t);
  return { inks: INKS.meadow };
}

// ---------- chorus 2b: the little clock-world again, now overgrown with trees and flowers; the camera pulls away
async function sc_world(P, t, t0, o = {}) {
  const lt = t - t0, tt = onTwos(t), dur = o.dur || 14, d = lt / (beatLen() * 16), ph = .12 + (d % 1) * .3;
  daySky(P, ph);
  const R = lerp(560, 250, E.ioS(clamp(lt / dur))), cx = W / 2, cy = lerp(1010, 600, E.ioS(clamp(lt / dur)));
  clockWorld(P, cx, cy, R, ph, d, t, { g0: 1, gPerDay: 0, lush: true });
  lyr(P, t);
  return { inks: { ...INKS.clock, d: INK.bubblegum } };
}

async function sc_treasures(P, t, t0, o = {}) {
  const lt = t - t0, tt = onTwos(t), B = beatLen(), cols = 6, rows = 4, cw = 228, ch = 210, ox = 140, oy = 150;
  P.add(FULL, { c: .1 });
  const grid = new Path2D(); for (let x = 0; x <= W; x += 48) { grid.moveTo(x, 0); grid.lineTo(x, H); } for (let y = 0; y <= H; y += 48) { grid.moveTo(0, y); grid.lineTo(W, y); } P.stroke(grid, 'b', 1, .25);
  // one item per two beats at first, then one per beat: more and more
  const half = o.half || 14, idxAt = lt < half ? lt / (B * 2) : half / (B * 2) + (lt - half) / B;
  for (let i = 0; i < cols * rows; i++) {
    const u = clamp((idxAt - i) * 2.5); const c = i % cols, r = Math.floor(i / cols), x = ox + c * cw + cw / 2, y = oy + r * ch + ch / 2;
    P.stroke(rect(x - cw * .42, y - ch * .42, cw * .84, ch * .84), 'k', 1.6, .4, { dash: [6, 6] });
    text(P, String(i + 1), x - cw * .36, y - ch * .32, 22, F.klee(22, 600), { dens: .8 });
    if (u <= 0) continue;
    P.save(); P.translate(x, y + 6); P.scale(lerp(1.5, 1, E.outB(u))); P.rotate((hash(i, 6) - .5) * .4 * (1.6 - u)); TREASURE[(i * 5) % TREASURE.length](P, 150, tt); P.restore();
  }
  lyr(P, t);
  return { inks: { ...INKS.meadow, d: INK.apricot } };
}

// ---------- bridge b: ordinary sunlight through a gap in the clouds, falling on the fields; the two look up
async function sc_rays(P, t, t0, o = {}) {
  const lt = t - t0, tt = onTwos(t), dur = o.dur || 14, warm = smooth(clamp(lt / dur)), hor = 560;
  P.ramp(FULL, 'b', 0, 0, .55, 0, hor, .1); P.ramp(FULL, 'd', 0, hor, .35 * warm, 0, 200, 0);
  P.radial(FULL, 'c', 980, 200, 30, .7, 700, 0);
  godRays(P, 980, 230, t, { n: 11, len: 1500, dens: .45 + .25 * warm, spread: .13 + .02 * Math.sin(t * .2), width: .04 });
  for (const [cx, cy, w, h, sd] of [[420, 230, 760, 220, 3], [1530, 210, 820, 240, 9], [980, 90, 520, 120, 5]]) { const cp = cloudPath(cx + Math.sin(t * .1 + sd) * 20, cy, w, h, sd, tt); P.paint(cp, { b: .12, k: .05 }); P.outline(cp, 'k', 1.8, 1); }
  P.paint(ridge(x => hor - 60 * (fbm1(x * .002 + 1) + .5), -60, W + 60, 24, H + 60, tt), { b: .4, a: .2 });
  P.paint(ridge(x => hor + 70 - 40 * (fbm1(x * .003 + 5) + .5), -60, W + 60, 24, H + 60, tt), { a: .6, c: .3 * warm });
  const near = ridge(x => 900 + Math.sin(x * .002) * 20, -60, W + 60, 30, H + 60, tt); P.paint(near, { a: .85, b: .15 }); P.outline(near, 'k', 2, 1);
  godRays(P, 980, 230, t + 3, { n: 5, len: 1400, dens: .22 * (.5 + warm), spread: .2, width: .05, drum: 'c' });
  for (let i = 0; i < 7; i++) { const bx = ((i * 260 + lt * (60 + i * 8)) % (W + 300)) - 150, by = 330 + Math.sin(i * 2.1) * 80 + Math.sin(lt * 2 + i) * 10, fl = Math.sin(t * 9 + i) * 10, p = new Path2D();
    p.moveTo(bx - 18, by - fl * .3); p.quadraticCurveTo(bx - 8, by - 10 - fl, bx, by); p.quadraticCurveTo(bx + 8, by - 10 - fl, bx + 18, by - fl * .3); P.stroke(p, 'k', 3, 1); }
  pair(P, 960, 905, 240, .02, tt, [LOOK.a, LOOK.b]);
  lyr(P, t);
  return { inks: { ...INKS.dusk } };
}

// ---------- last chorus a: happy days go by fast — earlier pages flick past as small prints
const MEMO = [['road', 12, 'sc_road', 7.95], ['clock', 31, 'sc_clock', 28.98], ['field', 68, 'sc_field', 64.01], ['together', 78, 'sc_together', 71.02], ['bloom', 0, 'sc_bloom', -2], ['world', 0, 'sc_world', -6], ['treasure', 0, 'sc_treasures', -20], ['rays', 0, 'sc_rays', -8]];

async function sc_memories(P, t, t0, o = {}) {
  const lt = t - t0, B = beatLen();
  window.NO_LYRICS = true;
  const snaps = []; for (const [key, ts, fn, s0] of MEMO) snaps.push(await RISO.snapshot(key, async Q => { await window[fn](Q, ts, s0); }));
  window.NO_LYRICS = false;
  RISO.begin();
  P.add(FULL, { c: .1 }); const grid = new Path2D(); for (let x = 0; x <= W; x += 48) { grid.moveTo(x, 0); grid.lineTo(x, H); } P.stroke(grid, 'b', 1, .2);
  // a card every beat slides in from the right, lands on the pile, and is gone two beats later
  const k0 = Math.floor(lt / B);
  for (let k = Math.max(0, k0 - 3); k <= k0; k++) {
    const u = (lt - k * B) / B, snap = snaps[k % snaps.length], inU = E.outC(clamp(u / .5)), outU = E.inC(clamp((u - 2) / .9));
    const x = lerp(W + 700, 900 + (k % 3 - 1) * 40, inU) - outU * 1700, y = 520 + (k % 2 ? -20 : 20) + outU * 140, rot = (hash(k, 3) - .5) * .25 - outU * .5, cw = 1100, chh = 620;
    P.save(); P.translate(x, y); P.rotate(rot);
    P.paint(rect(-cw / 2 - 18, -chh / 2 - 18, cw + 36, chh + 36), {}); P.stroke(rect(-cw / 2 - 18, -chh / 2 - 18, cw + 36, chh + 36), 'k', 3, 1);
    P.each((c, n) => { if (snap[n]) c.drawImage(snap[n], -cw / 2, -chh / 2, cw, chh); });
    P.restore();
  }
  lyr(P, t, { ja: { x: W - 120 } });
  return { inks: INKS.meadow };
}

// ---------- last chorus b: night rain with no end in sight; the two huddle under a tree.
// Then small sprouts light up around them on the beat, and the dark slowly lifts.
async function sc_night(P, t, t0, o = {}) {
  const lt = t - t0, tt = onTwos(t), B = beatLen(), glowFrom = o.glowFrom ?? 14, g = smooth(clamp((lt - glowFrom) / 12));
  P.ramp(FULL, 'b', 0, 0, lerp(1, .7, g), 0, H, lerp(.8, .4, g)); P.add(FULL, { k: .22 * (1 - g) });
  const r = rng(51); for (let i = 0; i < 70; i++) P.erase(circle(r() * W, r() * 500, (1 + r() * 2) * (.6 + .4 * Math.sin(t * 2 + i))), ['b', 'k']);
  const ground = ridge(x => 820 + noise1(x * .003) * 14, -60, W + 60, 30, H + 60, tt); P.paint(ground, { b: .7, a: .35, k: .15 * (1 - g) }); P.outline(ground, 'k', 2, 1);
  const trunk = poly([[620, 830], [700, 830], [690, 420], [640, 420]]); P.paint(trunk, { k: .8 });
  const crown = new Path2D(); for (const [cx, cy, rr] of [[560, 360, 190], [770, 330, 210], [660, 230, 200], [880, 420, 150], [450, 450, 140]]) curve(blobPts(cx, cy, rr, cx, .12, 18), true, tt, 1.2, crown);
  P.paint(crown, { a: .6, b: .6, k: .15 }); P.outline(crown, 'k', 2.4, 1);
  sitter(P, 820, 832, 200, LOOK.a, tt, .12); sitter(P, 1000, 834, 185, LOOK.b, tt, -.14);
  // sprouts that glow up one per beat, spreading out from the two
  const n = 14;
  for (let i = 0; i < n; i++) { const born = glowFrom + i * B; if (lt < born) continue; const u = clamp((lt - born) / 1.2), a = (i * 2.4) % TAU, d = 220 + i * 55;
    const x = 910 + Math.cos(a) * d * 1.3, y = 860 + Math.abs(Math.sin(a)) * 90 + (i % 3) * 25;
    P.radial(circle(x, y - 40, 150), 'c', x, y - 40, 0, .75 * E.outQ(u), 150, 0);
    sprout(P, x, y, 150, lerp(.1, .6, E.outQ(u)), tt + i, { seed: 60 + i, coat: false, sway: .5, bud: false, stemK: .5, leafK: 1.5 }); }
  const rainAmt = 1 - smooth(clamp((lt - glowFrom - 4) / 8)); if (rainAmt > .02) rainFx(P, t, { n: Math.round(260 * rainAmt), drum: 'b', erase: true, dens: .9, lw: 2.4, ang: .12 });
  lyr(P, t);
  return { inks: { ...INKS.clock, d: INK.mauve } };
}

// ---------- the end: the same road as the beginning, printed all the way to the horizon now.
// The camera rises while the two walk on ahead, smaller and smaller.
async function sc_finalRoad(P, t, t0, o = {}) {
  const lt = t - t0, tt = onTwos(t), dur = o.dur || 20, u = E.ioS(clamp(lt / dur)), hor = lerp(470, 330, u);
  ROAD.render(P, tt, {
    z: 26000 + lt * SONG.bpm / 60 / 2 * STEP, camH: lerp(1150, 3600, u), fov: 62, hor, haze: .45,
    backdrop: (P, pan, top, hor) => { skyAndHills(P, t, pan, hor, { sunX: 1150, sunY: lerp(240, 330, u), sunR: 95 }); P.ramp(FULL, 'd', 0, hor, .45, 0, 120, 0); },
    walk: { ahead: lerp(3600, 9000, u), ph: beatOf(tt) * .25, h: 560, looks: [LOOK.a, LOOK.b] },
  });
  drift(P, t, { n: 26, kind: 'petal', drum: 'd', size: 13, speed: 40, wind: 70, seed: 15 });
  lyr(P, t);
  return { inks: { ...INKS.meadow, d: INK.coral } };
}

// ---------- last page
async function sc_fin(P, t, t0) {
  const lt = t - t0, tt = onTwos(t);
  P.stroke(bookFrame(P, tt), 'k', 5, 1); P.add(rect(120, 100, W - 240, H - 200), { c: .08 });
  P.paint(circle(760, 540, 210), { c: .9 });
  const G = sprout(P, 760, 720, 330, 1, tt, { seed: 11, sway: .8, bud: false });
  if (G) blossom(P, G.tip[0], G.tip[1] - 6, 46, E.outB(clamp((lt - .6) / 1.4)), tt, { col: { d: .9 } });
  const mound = curve([[580, 736], [670, 708], [760, 702], [850, 708], [940, 736]], false, tt, 1.2); mound.closePath(); P.paint(mound, { a: .7, c: .35 }); P.stroke(mound, 'k', 3, 1);
  text(P, 'おわり', 1170, 420, 120, F.klee(120, 600), { vertical: true, lh: 1.1, dens: clamp(lt / .8) });
  const ca = clamp((lt - 1.5) / .8);
  if (ca > 0) { text(P, '「芽吹の唄」　作詞・作曲・歌：大原ゆい子　編曲：MANYO', W / 2, H - 170, 30, F.klee(30, 600), { dens: ca });
    text(P, '中文翻譯：rarab89w57（巴哈姆特）', W / 2, H - 126, 26, F.wenkai(26, 400), { dens: ca * .9 }); }
  return { inks: { ...INKS.meadow, d: INK.coral } };
}
