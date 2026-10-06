// scenes.js (tabibito): 「旅人の唄」 as a picture book — one traveller and a small blue bird crossing
// mountains, water, wind, changing skies and dreams, toward a place no one can stand.
// Each scene is (P, t, t0, o) -> print config. Building blocks come from engine/kit.js and draw.js.

const TRAV = { hair: { k: 1 }, coat: { d: .85 }, hat: { c: 1 }, bag: { b: .7 } };
const TINK = {
  day: { k: INK.spruce, a: INK.kelly, b: INK.cornflower, c: INK.yellow, d: INK.coral },
  peak: { k: INK.spruce, a: INK.grass, b: INK.sky, c: INK.yellow, d: INK.coral },
  water: { k: INK.spruce, a: INK.kelly, b: INK.aqua, c: INK.yellow, d: INK.coral },
  dusk: { k: INK.spruce, a: INK.grass, b: INK.cornflower, c: INK.sunflower, d: INK.bubblegum },
  night: { k: INK.midnight, a: INK.grass, b: INK.lake, c: INK.yellow, d: INK.coral },
};
const SKIN = { c: .12, d: .2 };
const flapOf = (t, k = 0) => Math.sin(t * 15 + k);

// ---------- the bird: flap in -1..1 (wings up..down); perched folds the wing. dir -1 faces left.
function bird(P, x, y, s, flap, t, o = {}) {
  const dir = o.dir ?? 1, col = o.col || { b: .9 }, lw = Math.max(1.2, s * .05);
  P.save(); P.translate(x, y); P.scale(dir, 1);
  const tail = poly([[-s * .36, -s * .04], [-s * .86, -s * .22], [-s * .8, s * .1]]); P.paint(tail, col); P.stroke(tail, 'k', lw, 1);
  const wingBack = o.perched ? null : leafPath(-s * .02, -s * .14, s * .62, s * .26, Math.PI + .5 + flap * .75, { round: .5 }, t);
  if (wingBack) { P.paint(wingBack, { b: .5 }); P.stroke(wingBack, 'k', lw, 1); }
  const body = ellipse(0, 0, s * .5, s * .3, -.12); P.paint(body, col); P.stroke(body, 'k', lw, 1);
  P.add(ellipse(s * .08, s * .11, s * .28, s * .13, -.1), { c: .9 });
  const head = circle(s * .42, -s * .2, s * .21); P.paint(head, col); P.stroke(head, 'k', lw, 1);
  const beak = poly([[s * .6, -s * .25], [s * .82, -s * .17], [s * .6, -s * .11]]); P.paint(beak, { c: 1, d: .4 }); P.stroke(beak, 'k', lw * .7, 1);
  P.paint(circle(s * .48, -s * .24, Math.max(1, s * .045)), { k: 1 });
  P.add(circle(s * .4, -s * .1, s * .06), { d: .6 });
  const wing = o.perched ? leafPath(-s * .1, -s * .08, s * .5, s * .22, Math.PI - .08, { round: .5 }, t) : leafPath(s * .02, -s * .1, s * .66, s * .3, Math.PI + .25 + flap * .9, { round: .5 }, t);
  P.paint(wing, { b: .9, k: .12 }); P.stroke(wing, 'k', lw, 1);
  if (o.perched) { const f = new Path2D(); f.moveTo(-s * .05, s * .28); f.lineTo(-s * .05, s * .42); f.moveTo(s * .1, s * .28); f.lineTo(s * .1, s * .42); P.stroke(f, 'k', lw, 1); }
  P.restore();
}

// ---------- a range of hand-drawn peaks: pk = [[cx, height, halfWidth], ...] standing on baseline y
function peakRange(P, pk, y, t, o = {}) {
  const sharp = o.sharp ?? 1.15;
  const fy = x => { let m = y + 80; for (const [cx, h, w] of pk) { const u = 1 - Math.abs(x - cx) / w; if (u > 0) m = Math.min(m, y - h * Math.pow(u, sharp) - noise1(x * .02 + cx) * 7 * u); } return m; };
  const R = ridge(fy, o.x0 ?? -60, o.x1 ?? W + 60, o.step ?? 12, o.bottom ?? H + 60, t);
  P.paint(R, o.col || { b: .55, a: .2 }); P.outline(R, 'k', o.lw ?? 2.2, o.line ?? 1);
  if (o.snow !== false) for (const [cx, h, w] of pk) {
    const sh = h * (o.snowK ?? .24), wd = w * (1 - Math.pow(1 - sh / h, 1 / sharp)), top = [], bot = [];
    for (let i = 0; i <= 12; i++) { const x = cx - wd + i / 12 * 2 * wd; top.push([x, fy(x) + 1]); bot.push([x, y - h + sh + (i % 2 ? -sh * .28 : sh * .05)]); }
    const cap = curve([...top, ...bot.reverse()], true, t, .8); P.paint(cap, o.snowCol || {}); P.stroke(cap, 'k', (o.lw ?? 2.2) * .7, o.line ?? 1);
  }
  return fy;
}

function pine(P, x, y, h, t, col = { a: .85, b: .2 }) {
  const tr = rect(x - h * .04, y - h * .2, h * .08, h * .22); P.paint(tr, { k: .8 });
  for (let i = 0; i < 3; i++) { const yy = y - h * (.15 + i * .27), w = h * (.36 - i * .08), p = curve([[x - w, yy], [x, yy - h * .42], [x + w, yy]], true, t, .8); P.paint(p, col); P.stroke(p, 'k', Math.max(1.2, h * .015), 1); }
}
function roundTree(P, x, y, h, seed, t, col = { a: .9 }) {
  P.paint(rect(x - h * .05, y - h * .55, h * .1, h * .56), { k: 1 });
  const c = blob(x, y - h * .72, h * .34, seed, t, .14); P.paint(c, col); P.add(blob(x - h * .1, y - h * .85, h * .12, seed + 3), { c: .6 }); P.outline(c, 'k', Math.max(1.2, h * .012), 1);
}
function starsOn(P, n, seed, t, y1 = H * .7, k = 1) {
  const r = rng(seed); for (let i = 0; i < n; i++) { const sx = r() * W, sy = r() * y1, tw = .55 + .45 * Math.sin(i * 7 + t * 3); P.erase(circle(sx, sy, (1.2 + r() * 2.6) * tw * k), ['b', 'k']); }
}

// ---------- cover: the title page prints itself drum by drum
async function sc_cover(P, t, t0) {
  const tt = onTwos(t), lt = t - t0, z = 1 + .01 * lt;
  P.save(); P.translate(W / 2, H / 2); P.scale(z); P.translate(-W / 2, -H / 2);
  P.stroke(bookFrame(P, tt), 'k', 5, 1);
  P.add(rect(120, 100, W - 240, H - 200), { c: .08 });
  P.each(c => { c.save(); c.beginPath(); c.rect(120, 100, 1100, H - 200); c.clip(); });
  P.paint(circle(660, 450, 160), { c: .95 }); P.add(sunPaths(660, 450, 160, 16, t * .04, 1.6).rays, { c: .3 });
  peakRange(P, [[330, 330, 300], [700, 430, 360], [1060, 300, 280]], 830, tt, { col: { b: .6, a: .15 } });
  const hill = ridge(x => 860 + Math.sin(x * .004) * 24, 100, 1240, 24, H, tt); P.paint(hill, { a: .7, c: .3 }); P.outline(hill, 'k', 2.4, 1);
  const path = new Path2D(); path.moveTo(130, 930); path.bezierCurveTo(400, 870, 600, 900, 1220, 850); P.stroke(path, 'k', 3, 1, { dash: [14, 12] });
  const wx = 200 + ((lt * 40) % 900);
  walkerSide(P, wx, 920 - (wx - 130) * .07, 120, beatOf(tt) * .25, TRAV, tt);
  P.each(c => c.restore());
  bird(P, 860 + Math.cos(lt * .7) * 120, 300 + Math.sin(lt * 1.4) * 40, 46, flapOf(t), tt, { dir: Math.sin(lt * .7) < 0 ? 1 : -1 });
  text(P, '旅人の唄', 1460, 230, 170, F.klee(170, 600), { vertical: true, lh: 1.08 });
  text(P, 'たびびとのうた', 1270, 290, 44, F.klee(44, 400), { vertical: true, drum: 'd', dens: .95 });
  text(P, '大原ゆい子', 1270, 940, 40, F.klee(40, 600));
  drift(P, t, { n: 12, kind: 'fluff', drum: 'k', size: 14, speed: -20, wind: 30, seed: 12 });
  P.restore();
  drumPasses(P, t, t0 + .2);
  return { inks: TINK.day, mis: 1 + 1.5 * (1 - clamp(lt / 4)) };
}

// ---------- the map: a route is dotted across mountains, a lake and the sea of clouds, two dashes a beat
const ROUTE = [[150, 900], [420, 800], [640, 840], [860, 700], [1040, 600], [1260, 560], [1480, 640], [1700, 540], [1900, 420], [2120, 330], [2330, 250]];
function routeUpTo(pts, len) {
  const p = new Path2D(); p.moveTo(...pts[0]); let acc = 0, at = pts[0];
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], l = Math.hypot(x1 - x0, y1 - y0);
    if (acc + l >= len) { const u = (len - acc) / l; at = [lerp(x0, x1, u), lerp(y0, y1, u)]; p.lineTo(...at); return { p, at }; }
    acc += l; p.lineTo(x1, y1); at = [x1, y1]; }
  return { p, at };
}
async function sc_map(P, t, t0, o = {}) {
  const lt = t - t0, tt = onTwos(t), dur = o.dur || 14, B = beatLen();
  P.add(FULL, { c: .16, d: .04 });
  P.add(ridge(x => 40 + noise1(x * .01) * 10, -60, W + 60, 30, -60), { k: .2 });
  const pan = o.full ? -lerp(380, 560, E.ioS(clamp(lt / dur))) : -lerp(0, 560, E.ioS(clamp(lt / dur)));
  P.save(); P.translate(pan, 0);
  // sea, waves
  const sea = curve([[-80, 760], [120, 800], [260, 920], [330, 1140], [-80, 1140]], true, tt, 1.5); P.paint(sea, { b: .5 }); P.stroke(sea, 'k', 2.5, 1);
  for (let i = 0; i < 9; i++) { const wx = 20 + (i % 3) * 80, wy = 860 + Math.floor(i / 3) * 60, w = new Path2D(); w.moveTo(wx, wy); w.quadraticCurveTo(wx + 15, wy - 12, wx + 30, wy); w.quadraticCurveTo(wx + 45, wy - 12, wx + 60, wy); P.stroke(w, 'k', 2, 1); }
  // river from the mountains to the sea
  const riv = curve([[1000, 470], [880, 560], [760, 700], [520, 760], [330, 820], [200, 860]], false, tt, 1.2); P.stroke(riv, 'b', 16, 1); P.stroke(riv, 'k', 2, 1);
  // little mountains with hatching
  for (const [mx, my, s] of [[880, 520, 120], [1000, 470, 160], [1120, 500, 130], [1240, 480, 110], [1340, 520, 90]]) {
    const m = curve([[mx - s * .8, my + s * .5], [mx, my - s * .6], [mx + s * .8, my + s * .5]], true, tt, .8); P.paint(m, { b: .2, a: .25 }); P.stroke(m, 'k', 2.4, 1);
    const h = new Path2D(); for (let k = 1; k < 5; k++) { h.moveTo(mx + s * .12 * k, my - s * .6 + s * .26 * k); h.lineTo(mx + s * .12 * k - s * .1, my - s * .6 + s * .26 * k + s * .14); } P.stroke(h, 'k', 1.6, 1);
    const cap = curve([[mx - s * .22, my - s * .3], [mx, my - s * .6], [mx + s * .22, my - s * .3], [mx + s * .08, my - s * .36], [mx - s * .06, my - s * .28]], true, tt, .6); P.paint(cap, {}); P.stroke(cap, 'k', 1.6, 1);
  }
  // forest
  for (let i = 0; i < 16; i++) { const fx = 520 + hash(i, 2) * 300, fy = 880 + hash(i, 3) * 140, s = 26 + hash(i, 4) * 14; P.paint(rect(fx - 2, fy, 4, s * .5), { k: 1 }); const c = circle(fx, fy - s * .1, s * .5); P.paint(c, { a: .85 }); P.stroke(c, 'k', 1.8, 1); }
  // the spring-lake, a village, the floating island (destination, circled)
  const lake = blob(1500, 760, 110, 4, tt, .2, 60); P.paint(lake, { b: .6 }); P.stroke(lake, 'k', 2.4, 1);
  for (let i = 0; i < 4; i++) { const hx = 1700 + i * 46, hy = 700 + (i % 2) * 24, hb = rect(hx - 16, hy - 20, 32, 24), rf = poly([[hx - 22, hy - 18], [hx, hy - 40], [hx + 22, hy - 18]]); P.paint(hb, { c: .5 }); P.paint(rf, { d: .9 }); P.stroke(hb, 'k', 1.6, 1); P.stroke(rf, 'k', 1.6, 1); }
  for (const [cx, cy, w, h, sd] of [[2150, 360, 260, 70, 3], [2400, 300, 300, 80, 6], [2260, 440, 240, 60, 9]]) { const cp = cloudPath(cx, cy, w, h, sd, tt); P.paint(cp, {}); P.outline(cp, 'k', 1.6, 1); }
  const isl = curve([[2250, 230], [2400, 225], [2370, 270], [2330, 300], [2290, 280]], true, tt, 1); P.paint(isl, { d: .3, c: .4 }); P.stroke(isl, 'k', 2, 1); roundTree(P, 2330, 230, 70, 5, tt);
  P.stroke(blob(2330, 230, 110, 2, tt, .1, 80), 'd', 4, 1, { dash: [10, 10] });
  // the route, revealed two dashes a beat, with the traveller at its tip
  const steps = o.full ? 1e4 : Math.max(0, Math.floor((lt - .2) / (B / 2))), { p, at } = routeUpTo(ROUTE, steps * 46 + 10);
  P.stroke(p, 'd', 7, 1, { dash: [22, 24] });
  P.paint(circle(...ROUTE[0], 14), { d: 1 }); P.stroke(circle(...ROUTE[0], 14), 'k', 2, 1);
  walkerSide(P, at[0], at[1] - 4, 90, beatOf(tt) * .25, TRAV, tt);
  bird(P, at[0] + 50, at[1] - 110 + Math.sin(lt * 3) * 10, 26, flapOf(t), tt);
  P.restore();
  // compass rose
  P.save(); P.translate(1700, 900); P.rotate(Math.sin(lt * .6) * .08);
  const rose = poly([[0, -90], [16, -16], [90, 0], [16, 16], [0, 90], [-16, 16], [-90, 0], [-16, -16]]); P.paint(rose, { c: .8 }); P.stroke(rose, 'k', 2.4, 1);
  P.paint(poly([[0, -90], [16, -16], [0, 0], [-16, -16]]), { d: .9 }); P.stroke(circle(0, 0, 60), 'k', 1.6, 1); text(P, 'N', 0, -118, 34, F.klee(34, 600));
  P.restore();
  lyr(P, t);
  return { inks: TINK.day };
}

// ---------- verse 1a: over the mountain — the slope scrolls under the traveller, the far peaks sink as we climb
async function sc_climb(P, t, t0, o = {}) {
  const lt = t - t0, tt = onTwos(t), off = lt * 120, rise = lt * 5;
  P.ramp(FULL, 'b', 0, 0, .55, 0, 700, .08);
  const sun = sunPaths(380, 200, 70, 14, t * .06); P.erase(circle(380, 200, 150), ['b']); P.radial(circle(380, 200, 400), 'c', 380, 200, 70, .5, 400, 0); P.add(sun.rays, { c: .4 }); P.paint(sun.disc, { c: 1 });
  for (const [cx, cy, w, h, sd] of [[700, 300 + rise, 340, 90, 4], [1500, 520 + rise, 500, 110, 8]]) { const cp = cloudPath(((cx - off * .1) % 2400 + 2400) % 2400 - 250, cy, w, h, sd, tt); P.paint(cp, {}); P.outline(cp, 'k', 1.6, 1); }
  peakRange(P, [[200 - off * .05, 300, 300], [620 - off * .05, 380, 340], [1100 - off * .05, 260, 260]], 760 + rise * 2, tt, { col: { b: .5, a: .12 }, line: .9 });
  const gy = x => 830 - (x - 960) * .36 + noise1((x + off) * .004) * 22;
  const ground = ridge(gy, -60, W + 60, 20, H + 60, tt); P.paint(ground, { a: .7, c: .2, b: .1 }); P.outline(ground, 'k', 2.5, 1);
  // world objects on the slope: pines, rocks, tufts
  for (let i = 0; i < 40; i++) { const wx = i * 260 + hash(i, 5) * 120, x = wx - off; if (x < -200 || x > W + 200) continue;
    const y = gy(x) + 6, k = hash(i, 6);
    if (k < .4) pine(P, x, y, 160 + hash(i, 7) * 90, tt);
    else if (k < .65) { const r = blob(x, y - 18, 34 + hash(i, 8) * 20, i, tt, .25, 24); P.paint(r, { k: .2, b: .2 }); P.stroke(r, 'k', 2, 1); }
    else { const p = new Path2D(); for (let j = -2; j <= 2; j++) { p.moveTo(x + j * 6, y); p.quadraticCurveTo(x + j * 9, y - 20, x + j * 14 + Math.sin(t * 2 + i) * 4, y - 34); } P.stroke(p, 'k', 2.4, 1); } }
  walkerSide(P, 900, gy(900) + 4, 300, beatOf(tt) * .25, TRAV, tt);
  const stick = new Path2D(); stick.moveTo(990, gy(990) - 4); stick.lineTo(955 + Math.sin(beatOf(tt) * Math.PI * .5) * 12, gy(900) - 190); P.stroke(stick, 'k', 5, 1);
  bird(P, 1150 + Math.sin(lt * 1.3) * 40, gy(1150) - 330 + Math.sin(lt * 2.1) * 30, 44, flapOf(t), tt);
  // wind
  const wind = new Path2D(); for (let i = 0; i < 6; i++) { const y = 180 + i * 90 + hash(i) * 40, x = ((i * 410 - lt * 520) % 2600 + 2600) % 2600 - 300; wind.moveTo(x, y); wind.bezierCurveTo(x + 120, y - 20, x + 220, y + 20, x + 320, y - 6); }
  P.stroke(wind, 'k', 2, .5);
  lyr(P, t, { ja: { x: W - 140 } });
  return { inks: TINK.peak };
}

// ---------- verse 1b: a spring overflowing in the forest; rings spread on the beat, sprouts follow the stream
async function sc_spring(P, t, t0, o = {}) {
  const lt = t - t0, tt = onTwos(t), dur = o.dur || 20, B = beatLen();
  P.ramp(FULL, 'a', 0, 0, .55, 0, 560, .2); P.add(FULL, { c: .1 });
  godRays(P, 700, -80, t, { n: 7, spread: .14, dens: .45 });
  for (let i = 0; i < 9; i++) { const x = i * 240 + hash(i, 2) * 100 - 40, w = 26 + hash(i, 3) * 26, tr = rect(x - w / 2, -40, w, 620 + hash(i, 4) * 60); P.paint(tr, { k: .65, a: .2 }); P.stroke(tr, 'k', 2, 1); }
  const can = curve(Array.from({ length: 30 }, (_, i) => [i * 70 - 60, 90 + Math.sin(i * 1.7) * 40]).concat([[W + 60, -60], [-60, -60]]), true, tt, 2); P.paint(can, { a: .9, b: .2 }); P.outline(can, 'k', 2, 1);
  const ground = ridge(x => 600 + noise1(x * .003) * 18, -60, W + 60, 30, H + 60, tt); P.paint(ground, { a: .45, c: .25 }); P.outline(ground, 'k', 2, 1);
  // the stream, widening to the front
  const sL = [], sR = []; for (let i = 0; i <= 16; i++) { const u = i / 16, x = 560 + Math.sin(u * 4) * 160 * u + u * 380, y = 640 + u * 500, w = 40 + u * 260; sL.push([x - w / 2, y]); sR.push([x + w / 2, y]); }
  const stream = curve([...sL, ...sR.reverse()], true, tt, 1.5); P.paint(stream, { b: .7 }); P.stroke(stream, 'k', 2.4, 1);
  for (let i = 0; i < 14; i++) { const u = ((i / 14 + lt * .12) % 1), x = 560 + Math.sin(u * 4) * 160 * u + u * 380 + (hash(i, 9) - .5) * (40 + u * 200), y = 640 + u * 500, l = 20 + u * 50, p = new Path2D(); p.moveTo(x - l / 2, y); p.quadraticCurveTo(x, y - 6, x + l / 2, y); P.erase(ellipse(x, y, l * .5, 3 + u * 4), ['b']); }
  // the basin, water spilling over its lip, rings each beat
  const rock = blob(560, 650, 170, 7, tt, .18, 90); P.paint(rock, { k: .22, b: .15 }); P.stroke(rock, 'k', 2.5, 1);
  const pool = ellipse(560, 590, 130, 34); P.paint(pool, { b: .85 }); P.stroke(pool, 'k', 2.5, 1);
  const bt = beatOf(t) % 1; for (let k = 0; k < 2; k++) { const u = (bt + k) / 2; P.stroke(ellipse(560, 590, 130 * u, 34 * u), 'k', 2, .5 * (1 - u)); }
  const spill = new Path2D(); for (let j = 0; j < 4; j++) { const x = 600 + j * 18; spill.moveTo(x, 610); spill.quadraticCurveTo(x + 16, 640, x + 10 + j * 6, 700); } P.stroke(spill, 'b', 12, 1); P.stroke(spill, 'k', 1.4, .6);
  for (let i = 0; i < 10; i++) { const u = ((lt * 1.6 + i * .37) % 1), x = 620 + i * 7 + u * 30, y = 610 + u * 110; P.paint(circle(x, y, 5 * (1 - u * .5)), { b: 1 }); }
  // sprouts and flowers along the banks, appearing in order downstream
  for (let i = 0; i < 18; i++) { const side = i % 2 ? 1 : -1, u = .15 + (i >> 1) / 9 * .85, x = 560 + Math.sin(u * 4) * 160 * u + u * 380 + side * (30 + u * 150 + 40), y = 640 + u * 500;
    const g = clamp((lt - i * B) / (B * 6)); if (g <= 0) continue; const s = 90 + u * 150;
    if (i % 3 === 2) blossom(P, x, y - s * .25, s * .2, g, tt, { col: i % 2 ? { d: .9 } : { c: 1 }, rot: i });
    else sprout(P, x, y, s, lerp(.15, .95, g), tt + i, { seed: i + 3, sway: .6, coat: false }); }
  // the traveller kneels to drink, the bird hops on the rock
  sitter(P, 1020, 640, 250, TRAV, tt, .28);
  bird(P, 440, 548 - Math.abs(Math.sin(beatOf(t) * Math.PI)) * 18, 42, 0, tt, { perched: true });
  lyr(P, t, { ja: { x: W - 140 } });
  return { inks: TINK.water };
}

// ---------- chorus: above a sea of clouds, an island hangs where no one can stand.
// o.loveAt: seconds after t0 when a light gathers in the traveller's hands
async function sc_cloudsea(P, t, t0, o = {}) {
  const lt = t - t0, tt = onTwos(t), dur = o.dur || 20, z = 1.08 - .08 * E.ioS(clamp(lt / dur)), dusk = o.dusk ? 1 : 0;
  P.save(); P.translate(W / 2, H * .55); P.scale(z); P.translate(-W / 2, -H * .55);
  P.ramp(FULL, 'b', 0, 0, lerp(.6, .75, dusk), 0, 620, .05); P.ramp(FULL, 'c', 0, 640, .6, 0, 200, 0); P.ramp(FULL, 'd', 0, 640, lerp(.25, .6, dusk), 0, 300, 0);
  if (dusk) starsOn(P, 60, 4, t, 300, .8);
  const sx = 1500, sy = 560, sun = sunPaths(sx, sy, 110, 22, t * .03, 2.6); P.add(sun.rays, { c: .45, d: .1 }); P.paint(sun.disc, { c: 1, d: .25 * dusk });
  // the floating island with its tree and a thin waterfall
  const iy = 300 + Math.sin(lt * .6) * 12, ix = 1080;
  const isl = curve([[ix - 230, iy], [ix + 230, iy - 6], [ix + 170, iy + 60], [ix + 80, iy + 150], [ix - 20, iy + 210], [ix - 110, iy + 120], [ix - 190, iy + 60]], true, tt, 1.2);
  P.paint(isl, { d: .35, c: .3, k: .1 }); P.stroke(isl, 'k', 2.6, 1);
  P.paint(ellipse(ix, iy, 232, 26), { a: .85 }); P.stroke(ellipse(ix, iy, 232, 26), 'k', 2.4, 1);
  roundTree(P, ix + 40, iy + 4, 230, 6, tt); pine(P, ix - 140, iy + 2, 110, tt);
  const fall = new Path2D(); fall.moveTo(ix + 150, iy + 10); fall.lineTo(ix + 155, iy + 340); P.stroke(fall, 'b', 10, .8); P.stroke(fall, 'k', 1.2, .5, { dash: [8, 14] });
  // cloud sea: three bands drifting at different speeds
  for (let b = 0; b < 3; b++) { const y = 640 + b * 120, sp = (b + 1) * 14;
    for (let i = 0; i < 6; i++) { const w = 420 + hash(i, b) * 260, x = ((i * 430 + lt * sp + b * 170) % 2600 + 2600) % 2600 - 400, cp = cloudPath(x, y + hash(i, b + 4) * 30, w, 120 + b * 20, i + b * 7, tt);
      P.paint(cp, { d: .06 * (2 - b), c: .08 }); P.outline(cp, 'k', 1.6, 1); } }
  // the peak the traveller stands on, foreground left
  const peak = curve([[-60, 1140], [-60, 760], [160, 690], [300, 640], [420, 700], [620, 1140]], true, tt, 1.2); P.paint(peak, { b: .45, k: .25, a: .15 }); P.outline(peak, 'k', 2.6, 1);
  sitter(P, 300, 646, 230, TRAV, tt, .06);
  if (o.loveAt !== undefined) { const u = clamp((lt - o.loveAt) / 1.2); if (u > 0) { const hx = 330, hy = 545, pr = 30 + 10 * pulse(t);
    P.radial(circle(hx, hy, 260 * u), 'c', hx, hy, 0, .9 * u, 260 * u, 0); P.radial(circle(hx, hy, 160 * u), 'd', hx, hy, 0, .5 * u, 160 * u, 0);
    P.paint(circle(hx, hy, pr * u), { c: 1, d: .3 }); P.stroke(circle(hx, hy, pr * u), 'k', 2, 1);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + lt, r = (60 + 30 * Math.sin(lt * 2 + i)) * u; P.add(circle(hx + Math.cos(a) * r, hy + Math.sin(a) * r, 5), { c: 1 }); } } }
  // the bird flies out to the island and back in a loop
  const bp = lt * .35, bx = lerp(420, ix - 60, .5 - .5 * Math.cos(bp * TAU)), by = 470 - Math.sin(bp * TAU) * 120;
  bird(P, bx, by, 40, flapOf(t), tt, { dir: Math.sin(bp * TAU) > 0 ? 1 : -1 });
  P.restore();
  lyr(P, t, { ja: { x: W - 150 } });
  return { inks: o.dusk ? TINK.dusk : TINK.peak };
}

// ---------- interlude: chapter page with a numeral and the traveller's things
async function sc_chapter(P, t, t0, o = {}) {
  const lt = t - t0, tt = onTwos(t);
  P.stroke(bookFrame(P, tt), 'k', 5, 1); P.add(rect(120, 100, W - 240, H - 200), { c: .08 });
  const ring = circle(W / 2, 470, 190); P.paint(ring, { c: .9 }); P.stroke(ring, 'k', 4, 1); P.stroke(circle(W / 2, 470, 172), 'k', 1.6, 1);
  text(P, o.num || '二', W / 2, 470, 210, F.klee(210, 600), { dens: clamp(lt / .6) });
  // hat on the left, the bird on a branch on the right
  const hx = W / 2 - 380, hy = 760, hat = new Path2D(); hat.ellipse(hx, hy, 140, 32, 0, 0, TAU); hat.ellipse(hx, hy - 20, 80, 70, 0, Math.PI, TAU); P.paint(hat, { c: 1 }); P.stroke(hat, 'k', 3, 1);
  P.paint(rect(hx - 80, hy - 40, 160, 18), { d: .85 }); P.stroke(rect(hx - 80, hy - 40, 160, 18), 'k', 2, 1);
  const br = new Path2D(); br.moveTo(W / 2 + 240, 790); br.quadraticCurveTo(W / 2 + 380, 770, W / 2 + 520, 800); P.stroke(br, 'k', 9, 1);
  for (let i = 0; i < 3; i++) { const lf = leafPath(W / 2 + 280 + i * 90, 785 - i * 4, 60, 26, -.9 - i * .3, {}, tt); P.paint(lf, { a: .9 }); P.stroke(lf, 'k', 1.8, 1); }
  bird(P, W / 2 + 390, 740 - Math.abs(Math.sin(beatOf(t) * Math.PI / 2)) * 10, 70, 0, tt, { perched: true, dir: -1 });
  drift(P, t, { n: 14, kind: 'petal', drum: 'd', size: 12, speed: 40, wind: 40, seed: 40 });
  return { inks: TINK.day };
}

// ---------- verse 2a: the voice of the wind in a quiet meadow; the bird follows it to a perch.
// o.landAt: seconds after t0 when the bird lands on the branch
async function sc_wind(P, t, t0, o = {}) {
  const lt = t - t0, tt = onTwos(t), hor = 560, landAt = o.landAt ?? 10;
  P.ramp(FULL, 'b', 0, 0, .5, 0, hor, .1); P.ramp(FULL, 'd', 0, hor, .35, 0, 200, 0); P.add(FULL, { c: .1 });
  for (const [cx, cy, w, h, sd] of [[500, 200, 480, 90, 2], [1500, 140, 380, 80, 5]]) { const cp = cloudPath(cx + lt * 10, cy, w, h, sd, tt); P.paint(cp, { d: .12 }); P.outline(cp, 'k', 1.6, 1); }
  P.paint(ridge(x => hor - 50 * (fbm1(x * .0025 + 2) + .5), -60, W + 60, 24, H + 60, tt), { a: .35, b: .3 });
  const field = ridge(x => hor + 20 + Math.sin(x * .002) * 16, -60, W + 60, 24, H + 60, tt); P.paint(field, { a: .6, c: .3 }); P.outline(field, 'k', 2, 1);
  // the lone tree and its perch branch
  const tx = 1380, ty = 700; P.paint(curve([[tx - 22, ty], [tx - 12, ty - 300], [tx + 12, ty - 300], [tx + 26, ty]], true, tt, .8), { k: .85 });
  const can = blob(tx, ty - 420, 210, 3, tt, .16, 150); P.paint(can, { a: .85 }); P.add(blob(tx - 60, ty - 470, 80, 4), { c: .5 }); P.outline(can, 'k', 2.4, 1);
  const br = new Path2D(); br.moveTo(tx - 10, ty - 230); br.quadraticCurveTo(tx - 140, ty - 250, tx - 260, ty - 236); P.stroke(br, 'k', 10, 1);
  // grass: a gust rolls across the meadow
  const grass = new Path2D(); for (let i = 0; i < 220; i++) { const x = hash(i, 1) * (W + 80) - 40, y = hor + 40 + Math.pow(hash(i, 2), .8) * 520, h = 30 + (y - hor) * .18, sw = Math.sin(x * .004 - t * 2.4) * .5 + .5;
    grass.moveTo(x, y); grass.quadraticCurveTo(x + 6, y - h * .6, x + 10 + sw * h * .55, y - h * (1 - sw * .15)); } P.stroke(grass, 'k', 2.2, 1);
  const wind = new Path2D(); for (let i = 0; i < 8; i++) { const y = 260 + i * 70 + hash(i, 3) * 30, x = ((i * 330 + lt * 380) % 2400) - 300; wind.moveTo(x, y); wind.bezierCurveTo(x + 140, y - 30, x + 220, y + 30, x + 380, y); wind.moveTo(x + 400, y - 4); wind.arc(x + 400, y - 20, 16, Math.PI / 2, Math.PI * 2.2); }
  P.stroke(wind, 'k', 2, .45);
  sitter(P, tx + 70, ty + 6, 210, TRAV, tt, -.08);
  // the bird glides in on the wind, then lands on the branch exactly at landAt
  const lx = tx - 200, ly = ty - 236 - 20;
  if (lt < landAt) { const u = clamp(lt / landAt), e = E.ioS(u), bx = lerp(-100, lx, e), by = lerp(260, ly, e) - Math.sin(u * Math.PI * 3) * 60 * (1 - u);
    bird(P, bx, by, 46, flapOf(t) * (u > .85 ? .4 : 1), tt); }
  else bird(P, lx, ly, 46, 0, tt, { perched: true, dir: lt - landAt < 2 ? 1 : (Math.floor((lt - landAt) / 3) % 2 ? -1 : 1) });
  drift(P, t, { n: 20, kind: 'fluff', drum: 'k', size: 12, speed: -14, wind: 120, seed: 9 });
  lyr(P, t, { ja: { x: 260 } });
  return { inks: TINK.dusk };
}

// ---------- verse 2b: never the same sky twice — the sky is reprinted every bar over the same hill
const SKIES = [
  { ph: .12 }, { ph: .3, clouds: 7 }, { ph: .5, glow: 1 }, { ph: .75, stars: 1 }, { ph: .28, rain: 1 }, { ph: .32, bow: 1 }, { ph: .05 }, { ph: .48, clouds: 3 },
  { ph: .62, stars: 1 }, { ph: .2, clouds: 11 }, { ph: .4, bow: 1 }, { ph: .55 },
];
async function sc_skies(P, t, t0) {
  const lt = t - t0, tt = onTwos(t), bar = Math.max(0, Math.floor(lt / barLen() + .02)), S = SKIES[bar % SKIES.length], lb = lt - bar * barLen();
  const night = daySky(P, S.ph);
  if (S.clouds) for (let i = 0; i < 4; i++) { const cp = cloudPath(200 + i * 480 + hash(i, S.clouds) * 120 + lt * 8, 160 + hash(i, S.clouds + 1) * 200, 300 + hash(i, S.clouds + 2) * 200, 90, i + S.clouds, tt); P.paint(cp, {}); P.outline(cp, 'k', 1.6, 1); }
  if (S.bow) for (let k = 0; k < 4; k++) { const r = 760 - k * 40, a = new Path2D(); a.arc(W / 2, 900, r, Math.PI, TAU); P.stroke(a, ['d', 'c', 'a', 'b'][k], 36, .85); }
  if (S.rain) rainFx(P, t, { n: 260, drum: 'b', dens: .9, lw: 2.2, len: 50 });
  if (S.stars) { const m = new Path2D(); m.arc(1500, 220, 60, 0, TAU); m.arc(1524, 206, 52, 0, TAU, true); P.paint(m, { c: .95 }); P.stroke(m, 'k', 2, 1); }
  const hill = ridge(x => 820 + Math.pow((x - 900) / 900, 2) * 200, -60, W + 60, 20, H + 60, tt); P.paint(hill, { a: lerp(.85, .6, night), b: .4 * night }); P.outline(hill, 'k', 2.5, 1);
  sitter(P, 900, 824, 230, TRAV, tt, -.04);
  bird(P, 1010, 704, 34, 0, tt, { perched: true });
  // a fresh page each bar: a quick flash and a page number
  P.add(FULL, { c: .5 * (1 - clamp(lb / .25)) });
  text(P, String(bar + 1), 170, 150, 46, F.klee(46, 600), { halo: .3 });
  lyr(P, t, { ja: { x: W - 150 } });
  return { inks: night > .5 ? TINK.night : TINK.day };
}

// ---------- verse 2c: dozing by a campfire; dreams rise as pencil sketches in bubbles
function lyingFigure(P, x, y, s, look, t) {
  const blanket = curve([[x - s * .55, y], [x - s * .5, y - s * .2], [x + s * .1, y - s * .26], [x + s * .4, y - s * .14], [x + s * .45, y]], true, t, .8);
  P.paint(blanket, look.coat); P.stroke(blanket, 'k', Math.max(1.5, s * .012), 1);
  const head = circle(x - s * .62, y - s * .1, s * .1); P.paint(head, SKIN); P.stroke(head, 'k', 2, 1);
  const hair = new Path2D(); hair.arc(x - s * .62, y - s * .12, s * .105, Math.PI * .9, Math.PI * 2.05); hair.closePath(); P.paint(hair, look.hair);
  const eye = new Path2D(); eye.arc(x - s * .66, y - s * .08, s * .025, .2, Math.PI - .2); P.stroke(eye, 'k', 2, 1);
  const hat = new Path2D(); hat.ellipse(x + s * .7, y - s * .02, s * .2, s * .05, 0, 0, TAU); hat.ellipse(x + s * .7, y - s * .06, s * .11, s * .09, 0, Math.PI, TAU); P.paint(hat, look.hat); P.stroke(hat, 'k', 2, 1);
}
const DREAMS = [
  (Q, s, t) => { const m = curve([[-s * .4, s * .25], [-s * .1, -s * .3], [s * .05, -s * .05], [s * .2, -s * .2], [s * .45, s * .25]], true, t, .6); Q.paint(m, { b: .7 }); Q.stroke(m, 'k', 2, 1); },
  (Q, s, t) => { const d = new Path2D(); d.moveTo(0, -s * .35); d.bezierCurveTo(s * .3, 0, s * .25, s * .3, 0, s * .3); d.bezierCurveTo(-s * .25, s * .3, -s * .3, 0, 0, -s * .35); Q.paint(d, { b: .8 }); Q.stroke(d, 'k', 2, 1); },
  (Q, s, t) => { const i = curve([[-s * .4, -s * .05], [s * .4, -s * .05], [s * .1, s * .3], [-s * .1, s * .3]], true, t, .6); Q.paint(i, { d: .5 }); Q.stroke(i, 'k', 2, 1); const c = circle(0, -s * .22, s * .18); Q.paint(c, { a: .9 }); Q.stroke(c, 'k', 2, 1); },
  (Q, s, t) => { const h = new Path2D(); h.moveTo(0, s * .3); h.bezierCurveTo(-s * .5, -s * .05, -s * .2, -s * .4, 0, -s * .12); h.bezierCurveTo(s * .2, -s * .4, s * .5, -s * .05, 0, s * .3); Q.paint(h, { d: .9 }); Q.stroke(h, 'k', 2, 1); },
];
async function sc_campfire(P, t, t0) {
  const lt = t - t0, tt = onTwos(t), hor = 640, B = beatLen();
  P.ramp(FULL, 'b', 0, 0, .95, 0, hor, .55); starsOn(P, 120, 21, t, hor - 40);
  const moon = new Path2D(); moon.arc(1180, 170, 56, 0, TAU); moon.arc(1204, 156, 48, 0, TAU, true); P.paint(moon, { c: .95 }); P.stroke(moon, 'k', 2, 1);
  P.paint(ridge(x => hor - 80 * (fbm1(x * .002 + 6) + .5), -60, W + 60, 24, H + 60, tt), { b: .7, k: .35 });
  const ground = ridge(x => hor + 30 + noise1(x * .003) * 10, -60, W + 60, 30, H + 60, tt); P.paint(ground, { a: .5, b: .55 }); P.outline(ground, 'k', 2, 1);
  for (const x of [180, 330, 1720, 1850]) pine(P, x, hor + 40, 260 + hash(x) * 100, tt, { a: .6, b: .6 });
  // the fire and its glow
  const fx = 1100, fy = 860, fl = .85 + .15 * Math.sin(t * 9) + .1 * noise1(t * 6);
  P.radial(circle(fx, fy - 40, 520), 'c', fx, fy - 40, 40, .75 * fl, 520, 0); P.radial(circle(fx, fy - 40, 360), 'd', fx, fy - 40, 20, .4 * fl, 360, 0);
  P.erase(circle(fx, fy - 40, 300 * fl), ['b']);
  const logs = new Path2D(); logs.moveTo(fx - 80, fy + 10); logs.lineTo(fx + 80, fy - 10); logs.moveTo(fx - 80, fy - 10); logs.lineTo(fx + 80, fy + 10); P.stroke(logs, 'k', 16, 1);
  for (let k = 0; k < 3; k++) { const h = (160 - k * 40) * fl, w = 60 - k * 14, f = curve([[fx - w, fy], [fx - w * .6, fy - h * .5], [fx + Math.sin(t * 7 + k) * 14, fy - h], [fx + w * .6, fy - h * .45], [fx + w, fy]], true, tt, 2);
    P.paint(f, k === 2 ? { c: 1 } : { d: .9 - k * .3, c: .6 }); if (k === 0) P.stroke(f, 'k', 2, 1); }
  for (let i = 0; i < 10; i++) { const u = ((lt * .5 + hash(i)) % 1), x = fx + Math.sin(i * 3 + lt * 2) * 40 * u, y = fy - 120 - u * 380; P.add(circle(x, y, 4 * (1 - u)), { c: 1, d: .6 }); }
  lyingFigure(P, 700, 900, 360, TRAV, tt);
  bird(P, 940, 890, 36, 0, tt, { perched: true, dir: -1 });
  // dream bubbles, one every two beats, drifting up from the sleeper, sketched in pencil
  for (let i = 0; i < 8; i++) { const u = (lt - i * B * 2) / (B * 9); if (u <= 0 || u >= 1) continue;
    const bx = 470 + Math.sin(i * 2.3 + u * 3) * 90 + u * 200, by = 800 - u * 640, r = 30 + E.outQ(clamp(u * 3)) * 70, a = 1 - clamp((u - .8) / .2);
    P.stroke(circle(bx, by, r), 'k', 2, .5 * a); P.add(circle(bx - r * .35, by - r * .35, r * .15), { c: .3 * a });
    P.save(); P.translate(bx, by); DREAMS[i % DREAMS.length](inkProxy(P, .35 * a), r * 1.2, tt); P.restore(); }
  lyr(P, t, { ja: { x: W - 150 } });
  return { inks: TINK.night };
}

// ---------- verse 2d: if it is a dream, don't look back — the lone traveller walks the road into the dawn
async function sc_onward(P, t, t0) {
  const lt = t - t0, tt = onTwos(t), hor = 470;
  ROAD.render(P, tt, {
    z: 32000 + lt * SONG.bpm / 60 / 2 * STEP, camH: 1150, fov: 62, hor, haze: .5,
    backdrop: (P, pan, top, hor) => skyAndHills(P, t, pan, hor, { sunX: 960, sunY: hor - 30, sunR: 110, skyTop: .35 }),
    walk: { ahead: 3000, ph: beatOf(tt) * .25, h: 600, looks: [TRAV] },
  });
  P.ramp(FULL, 'd', 0, hor, .35, 0, 0, 0);
  bird(P, 1040 + Math.sin(lt * 1.5) * 30, 520 + Math.sin(lt * 2.2) * 20, 30, flapOf(t), tt);
  lyr(P, t);
  return { inks: TINK.dusk, screens: { k: [45, 6, 2] } };
}

// ---------- chorus 2b: a promise exchanged at the fingertips — two hooked little fingers, a light between
function hand(P, side, t, sleeve) {
  // side -1: comes from the left; +1: from the right (mirrored)
  P.save(); if (side > 0) { P.translate(W, 0); P.scale(-1, 1); }
  const arm = curve([[-80, 720], [560, 590], [600, 700], [-80, 900]], true, t, 1); P.paint(arm, sleeve); P.stroke(arm, 'k', 3, 1);
  const cuff = curve([[540, 586], [600, 574], [640, 712], [580, 724]], true, t, .8); P.paint(cuff, { c: .9 }); P.stroke(cuff, 'k', 2.5, 1);
  const fist = blob(700, 640, 110, side > 0 ? 3 : 8, t, .06, 90); P.paint(fist, SKIN); P.stroke(fist, 'k', 3, 1);
  const kn = new Path2D(); for (let i = 0; i < 3; i++) { kn.moveTo(740 + i * 4, 570 + i * 34); kn.quadraticCurveTo(790, 584 + i * 34, 800, 610 + i * 34); } P.stroke(kn, 'k', 2.2, 1);
  P.restore();
}
function pinky(P, side, t) {
  P.save(); if (side > 0) { P.translate(W, 0); P.scale(-1, 1); }
  const pts = side < 0 ? [[770, 700], [850, 690], [920, 650], [950, 610], [935, 585]] : [[770, 700], [850, 712], [920, 700], [955, 670], [960, 640]];
  const f = new Path2D(); pts.forEach(([x, y], i) => { const r = 24 - i * 1.5; f.moveTo(x + r, y); f.arc(x, y, r, 0, TAU); });
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; for (let k = 1; k < 4; k++) { const u = k / 4, r = 24 - (i - 1 + u) * 1.5; f.moveTo(lerp(x0, x1, u) + r, lerp(y0, y1, u)); f.arc(lerp(x0, x1, u), lerp(y0, y1, u), r, 0, TAU); } }
  P.paint(f, SKIN); P.outline(f, 'k', 1.6, 1);
  P.restore();
}
async function sc_promise(P, t, t0, o = {}) {
  const lt = t - t0, tt = onTwos(t), meet = E.outQ(clamp(lt / (beatLen() * 4))), dx = (1 - meet) * 260;
  P.ramp(FULL, 'd', 0, 0, .25, 0, H, .55); P.ramp(FULL, 'c', W / 2, H / 2, .6, W / 2, 0, .05);
  const hx = W / 2, hy = 640, glow = meet * (.8 + .2 * pulse(t));
  P.radial(circle(hx, hy, 640), 'c', hx, hy, 0, .95 * glow, 640, 0); P.add(sunPaths(hx, hy, 120, 24, t * .05, 4).rays, { c: .25 * glow });
  P.save(); P.translate(-dx, 0); hand(P, -1, tt, { d: .85 }); pinky(P, -1, tt); P.restore();
  P.save(); P.translate(dx, 0); hand(P, 1, tt, { b: .8 }); pinky(P, 1, tt); P.restore();
  for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + lt * .4, r = 160 + 120 * hash(i, 2) + Math.sin(lt * 2 + i) * 20, s = (3 + hash(i, 3) * 6) * meet;
    const st = poly([[0, -s * 2], [s * .5, -s * .5], [s * 2, 0], [s * .5, s * .5], [0, s * 2], [-s * .5, s * .5], [-s * 2, 0], [-s * .5, -s * .5]]);
    P.save(); P.translate(hx + Math.cos(a) * r, hy + Math.sin(a) * r * .7); P.add(st, { c: 1 }); P.restore(); }
  lyr(P, t, { ja: { x: W - 150 } });
  return { inks: TINK.dusk };
}

// ---------- instrumental: the whole journey as one long panorama, seen flying alongside the bird —
// mountains, the spring, the windy meadow, the camp, then the sea of clouds
async function sc_journey(P, t, t0, o = {}) {
  const lt = t - t0, tt = onTwos(t), off = lt * 240, hor = 560, B = beatLen();
  P.ramp(FULL, 'b', 0, 0, .5, 0, hor, .06); P.ramp(FULL, 'd', 0, hor, .3, 0, 240, 0);
  for (let i = 0; i < 8; i++) { const x = ((i * 520 - off * .3) % 3600 + 3600) % 3600 - 500, cp = cloudPath(x, 140 + hash(i, 2) * 200, 300 + hash(i, 3) * 200, 90, i, tt); P.paint(cp, {}); P.outline(cp, 'k', 1.6, 1); }
  peakRange(P, [0, 1, 2, 3, 4, 5].map(i => [((i * 700 - off * .25) % 4200 + 4200) % 4200 - 600, 220 + hash(i, 7) * 160, 300]), hor + 20, tt, { col: { b: .45, a: .12 }, line: .9 });
  const gy = x => hor + 120 + Math.sin((x + off) * .0021) * 40;
  const ground = ridge(gy, -60, W + 60, 20, H + 60, tt); P.paint(ground, { a: .6, c: .25 }); P.outline(ground, 'k', 2.4, 1);
  // landmarks laid out along the way, in story order, looping
  const LEN = 6400;
  for (let i = 0; i < 64; i++) { const wx = i * 100, x = ((wx - off) % LEN + LEN) % LEN - 300; if (x < -300 || x > W + 300) continue; const y = gy(x) + 6, zone = Math.floor(wx / 1600);
    if (zone === 0 && i % 2 === 0) pine(P, x, y, 140 + hash(i, 1) * 120, tt);
    if (zone === 1 && i % 4 === 0) { const pool = ellipse(x, y + 30, 110, 26); P.paint(pool, { b: .8 }); P.stroke(pool, 'k', 2, 1); sprout(P, x + 130, y + 10, 150, .9, tt + i, { seed: i, coat: false, sway: .7 }); }
    if (zone === 2 && i % 6 === 0) roundTree(P, x, y, 340, i, tt);
    if (zone === 2 && i % 2 === 1) { const g = new Path2D(); for (let j = -3; j <= 3; j++) { const sw = Math.sin((x + j * 12) * .004 - t * 2.4) * 14; g.moveTo(x + j * 12, y); g.quadraticCurveTo(x + j * 12 + 4, y - 30, x + j * 12 + sw + 10, y - 50); } P.stroke(g, 'k', 2.2, 1); }
    if (zone === 3 && i % 5 === 0) { const hb = rect(x - 50, y - 70, 100, 72), rf = poly([[x - 64, y - 66], [x, y - 130], [x + 64, y - 66]]); P.paint(hb, { c: .45 }); P.paint(rf, { d: .9 }); P.paint(rect(x + 10, y - 56, 22, 20), { c: 1 }); P.stroke(hb, 'k', 2, 1); P.stroke(rf, 'k', 2, 1); } }
  // the traveller walks; the bird flies with the camera, close and large, wingbeats on the beat
  walkerSide(P, 760, gy(760) + 4, 220, beatOf(tt) * .25, TRAV, tt);
  const fl = Math.cos(beatOf(t) * Math.PI * 2);
  bird(P, 1200 + Math.sin(lt * .5) * 120, 330 + Math.sin(lt * 1.1) * 60 - fl * 8, 120, fl, tt);
  const wind = new Path2D(); for (let i = 0; i < 7; i++) { const y = 200 + i * 80 + hash(i, 4) * 30, x = ((i * 370 - lt * 700) % 2400 + 2400) % 2400 - 300; wind.moveTo(x, y); wind.lineTo(x + 160 + hash(i, 5) * 120, y); }
  P.stroke(wind, 'k', 2, .45);
  return { inks: TINK.day };
}

// ---------- chorus 2c: prayers overflow — lanterns rise from the valley into the night, one more per beat
function lantern(P, x, y, s, t, k = 1) {
  P.radial(circle(x, y, s * 2.2), 'c', x, y, 0, .55 * k, s * 2.2, 0);
  const body = curve([[x - s * .4, y - s * .55], [x + s * .4, y - s * .55], [x + s * .3, y + s * .5], [x - s * .3, y + s * .5]], true, t, .5);
  P.paint(body, { c: .95 * k, d: .35 * k }); P.stroke(body, 'k', Math.max(1, s * .05), k);
  P.add(rect(x - s * .1, y + s * .3, s * .2, s * .14), { d: .9 * k });
}
async function sc_lanterns(P, t, t0) {
  const lt = t - t0, tt = onTwos(t), B = beatLen(), hor = 700;
  P.ramp(FULL, 'b', 0, 0, 1, 0, hor, .6); starsOn(P, 100, 33, t, hor);
  P.paint(ridge(x => hor - 120 * (fbm1(x * .0018 + 1) + .5), -60, W + 60, 24, H + 60, tt), { b: .8, k: .3 });
  const ground = ridge(x => hor + 120 + Math.pow((x - 960) / 960, 2) * -60, -60, W + 60, 24, H + 60, tt); P.paint(ground, { a: .5, b: .6 }); P.outline(ground, 'k', 2, 1);
  for (let i = 0; i < 40; i++) { const born = i * B * .5, u = (lt - born) / 16; if (u <= 0) continue;
    const depth = .35 + hash(i, 1) * .65, x = 200 + hash(i, 2) * 1520 + Math.sin(lt * .8 + i) * 30 * depth, y = hor + 80 - u * 1100 * depth, s = 46 * depth;
    if (y < -100) continue; lantern(P, x, y, s, tt, clamp(.5 + depth)); }
  // the traveller lets one go, the bird beside
  const rel = clamp((lt - B * 2) / (B * 8)), ly = lerp(760, 300, E.inQ(rel));
  lantern(P, 905, ly, 70, tt);
  sitter(P, 880, 836, 240, TRAV, tt, -.1);
  bird(P, 990, 714, 34, 0, tt, { perched: true });
  lyr(P, t, { ja: { x: W - 150 } });
  return { inks: TINK.night };
}

// ---------- bridge: goodbye to the days gone by — earlier selves line the road behind, pencilled and fading.
// o.byes: seconds after t0 when each past self fades away (one per goodbye)
async function sc_farewell(P, t, t0, o = {}) {
  const lt = t - t0, tt = onTwos(t), hor = 600, pan = lt * 70, byes = o.byes || [2, 6, 10, 14], B = beatLen();
  P.ramp(FULL, 'd', 0, 0, .3, 0, hor, .05); P.ramp(FULL, 'c', 0, hor, .45, 0, 0, 0);
  P.paint(ridge(x => hor - 60 * (fbm1((x + pan * .2) * .002 + 8) + .5), -60, W + 60, 24, H + 60, tt), { b: .4, a: .2 });
  const gy = x => 820 + Math.sin((x + pan) * .0015) * 30;
  const ground = ridge(gy, -60, W + 60, 24, H + 60, tt); P.paint(ground, { a: .55, c: .25 }); P.outline(ground, 'k', 2, 1);
  const road = new Path2D(); for (let x = -60; x <= W + 60; x += 30) x < -50 ? road.moveTo(x, gy(x) + 30) : road.lineTo(x, gy(x) + 30); P.stroke(road, 'c', 40, .7); P.stroke(road, 'k', 2, 1, { dash: [24, 18] });
  // past selves, smaller (younger) the further back; each one fades on its goodbye
  for (let i = 0; i < 4; i++) { const wx = 1100 - (i + 1) * 360 - pan * .6 + 360, k = 1 - clamp((lt - byes[i]) / (B * 3)); if (k <= 0 || wx < -200) continue;
    const s = 260 - i * 34, Q = inkProxy(P, k * .5, .5 * k);
    walkerSide(Q, wx, gy(wx) + 22, s, .25, TRAV, tt, -1);
    const wave = new Path2D(); const hy = gy(wx) + 22 - s * .62; wave.moveTo(wx - 4, hy); wave.lineTo(wx - 4 + Math.sin(lt * 6 + i) * s * .1, hy - s * .25); P.stroke(wave, 'k', Math.max(2, s * .03), .5 * k); }
  walkerSide(P, 1180, gy(1180) + 22, 300, beatOf(tt) * .25, TRAV, tt);
  bird(P, 1320, gy(1320) - 250 + Math.sin(lt * 2) * 20, 40, flapOf(t), tt);
  // memories leave as blank pages, drifting off in the wind
  const r = rng(77); for (let i = 0; i < 16; i++) { const u = ((lt * .11 + r()) % 1), x = W + 100 - u * (W + 400), y = 120 + r() * 520 + Math.sin(lt * 1.5 + i) * 40, s = 40 + r() * 40, rot = lt * (1 + r()) + i;
    P.save(); P.translate(x, y); P.rotate(rot); const pg = rect(-s / 2, -s * .65, s, s * 1.3); P.paint(pg, { c: .08 }); P.stroke(pg, 'k', 1.6, 1);
    const ln = new Path2D(); for (let j = 0; j < 3; j++) { ln.moveTo(-s * .3, -s * .3 + j * s * .25); ln.lineTo(s * .3 * (1 - u), -s * .3 + j * s * .25); } P.stroke(ln, 'k', 1.4, .4); P.restore(); }
  lyr(P, t, { ja: { x: 260 } });
  return { inks: TINK.dusk };
}

// ---------- last chorus: the summit at sunrise; the traveller has reached the floating island, the bird on the hat.
// o.loveAt: seconds after t0 when the light gathers in their hands
async function sc_summit(P, t, t0, o = {}) {
  const lt = t - t0, tt = onTwos(t), dur = o.dur || 30, z = 1.15 - .15 * E.ioS(clamp(lt / dur));
  P.save(); P.translate(W / 2, H * .6); P.scale(z); P.translate(-W / 2, -H * .6);
  P.ramp(FULL, 'b', 0, 0, .55, 0, 700, 0); P.ramp(FULL, 'c', 0, 760, .8, 0, 150, 0); P.ramp(FULL, 'd', 0, 760, .5, 0, 380, 0);
  const sx = 960, sy = 700, sun = sunPaths(sx, sy, 150, 28, t * .03, 3.4); P.add(sun.rays, { c: .5, d: .15 }); P.paint(sun.disc, { c: 1, d: .2 });
  godRays(P, sx, sy, t, { n: 14, dir: -Math.PI / 2, spread: .22, len: 1200, dens: .3 });
  for (let b = 0; b < 2; b++) { const y = 770 + b * 140; for (let i = 0; i < 6; i++) { const w = 460 + hash(i, b) * 220, x = ((i * 430 + lt * (b + 1) * 12 + b * 210) % 2600 + 2600) % 2600 - 400, cp = cloudPath(x, y, w, 130, i + b * 5, tt);
    P.paint(cp, { d: .1, c: .1 }); P.outline(cp, 'k', 1.6, 1); } }
  // the island, grown lush, with the traveller standing on it
  const ix = 960, iy = 520 + Math.sin(lt * .5) * 8;
  const isl = curve([[ix - 420, iy], [ix + 420, iy - 8], [ix + 300, iy + 90], [ix + 120, iy + 220], [ix - 40, iy + 300], [ix - 200, iy + 170], [ix - 340, iy + 80]], true, tt, 1.2);
  P.paint(isl, { d: .35, c: .3, k: .1 }); P.stroke(isl, 'k', 2.8, 1);
  P.paint(ellipse(ix, iy, 422, 40), { a: .85 }); P.stroke(ellipse(ix, iy, 422, 40), 'k', 2.6, 1);
  roundTree(P, ix - 250, iy + 6, 300, 6, tt); pine(P, ix + 300, iy + 4, 170, tt); pine(P, ix + 360, iy + 8, 120, tt);
  for (let i = 0; i < 20; i++) { const fx = ix - 360 + i * 38, fy = iy + Math.sin(i) * 12; const st = new Path2D(); st.moveTo(fx, fy); st.lineTo(fx, fy - 20); P.stroke(st, 'a', 3, 1);
    blossom(P, fx, fy - 24, 13, clamp((lt - i * .3) / 2), tt, { col: i % 2 ? { d: .9 } : { c: 1 }, rot: i }); }
  // standing, seen from behind, facing the sun
  walker(P, ix + 40, iy + 10, 300, 0, TRAV, tt);
  bird(P, ix + 40, iy + 10 - 300 * .9, 34, 0, tt, { perched: true });
  if (o.loveAt !== undefined) { const u = clamp((lt - o.loveAt) / 1.5); if (u > 0) {
    P.radial(circle(ix + 40, iy - 140, 420 * u), 'c', ix + 40, iy - 140, 0, .9 * u, 420 * u, 0); P.radial(circle(ix + 40, iy - 140, 220 * u), 'd', ix + 40, iy - 140, 0, .5 * u, 220 * u, 0);
    for (let i = 0; i < 30; i++) { const a = i / 30 * TAU + lt * .3, r = (120 + 220 * hash(i, 4)) * u + Math.sin(lt * 2 + i) * 14; P.add(circle(ix + 40 + Math.cos(a) * r, iy - 140 + Math.sin(a) * r * .7, 4 + hash(i, 5) * 4), { c: 1 }); } } }
  drift(P, t, { n: 30, kind: 'petal', drum: 'd', size: 12, speed: 40, wind: 50, seed: 6 });
  P.restore();
  lyr(P, t, { ja: { x: W - 150 } });
  return { inks: TINK.dusk };
}

// ---------- last page
async function sc_fin(P, t, t0) {
  const lt = t - t0, tt = onTwos(t);
  P.stroke(bookFrame(P, tt), 'k', 5, 1); P.add(rect(120, 100, W - 240, H - 200), { c: .08 });
  P.paint(circle(760, 520, 200), { c: .9 });
  const hx = 760, hy = 690, hat = new Path2D(); hat.ellipse(hx, hy, 200, 44, 0, 0, TAU); hat.ellipse(hx, hy - 28, 112, 100, 0, Math.PI, TAU); P.paint(hat, { c: 1 }); P.stroke(hat, 'k', 3.5, 1);
  P.paint(rect(hx - 112, hy - 56, 224, 24), { d: .85 }); P.stroke(rect(hx - 112, hy - 56, 224, 24), 'k', 2.5, 1);
  const land = E.outB(clamp((lt - .4) / 1)); bird(P, hx + 30, lerp(300, hy - 128, land), 80, land < 1 ? flapOf(t) : 0, tt, { perched: land >= 1, dir: -1 });
  text(P, 'おわり', 1170, 420, 120, F.klee(120, 600), { vertical: true, lh: 1.1, dens: clamp(lt / .8) });
  const ca = clamp((lt - 1.2) / .8);
  if (ca > 0) text(P, '「旅人の唄」　作詞・作曲・歌：大原ゆい子　編曲：MANYO', W / 2, H - 170, 30, F.klee(30, 600), { dens: ca });
  return { inks: TINK.day };
}
