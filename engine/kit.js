// kit.js: reusable picture-book building blocks for scenes — looks, ink sets, skies, the clock-world,
// rain, rays, umbrella, flowers, the pencil/ink fade, treasures, chapter page, the drum-by-drum print reveal.
// Projects override LOOK / INKS in their own scenes file if they want different travellers or inks.

// scenes.js: each scene is (P, t, t0) -> print config. t is song time, t0 the scene's start.
// Inks are chosen per scene, like loading drums for a print run.
const LOOK = {
  // the two travellers: drum densities per garment
  a: { hair: { k: 1 }, coat: { d: .85 }, hat: { c: 1 } },
  b: { hair: { k: 1 }, coat: { b: .85 }, bag: { c: .8 } },
};

const INKS = {
  meadow: { k: INK.spruce, a: INK.kelly, b: INK.cornflower, c: INK.yellow, d: INK.bubblegum },
  soil: { k: INK.spruce, a: INK.kelly, b: INK.cornflower, c: INK.yellow, d: INK.brown },
  clock: { k: INK.spruce, a: INK.kelly, b: INK.lake, c: INK.yellow, d: INK.coral },
  dusk: { k: INK.spruce, a: INK.kelly, b: INK.cornflower, c: INK.yellow, d: INK.coral },
};

const CLOUDS = [[300, 170, 380, 120, 3], [980, 120, 300, 90, 7], [1500, 300, 460, 130, 11], [2100, 200, 340, 100, 5]];

const lyr = (P, t, o = {}) => { const li = lyricIdx(t); jaVert(P, t, li, { x: W - 150, y: 120, size: 76, ...o.ja }); zhSub(P, t, li, { ...o.zh }); };

const bookFrame = (P, tt) => curve([[90, 70], [W - 90, 70], [W - 90, H - 70], [90, H - 70]].flatMap(([x, y], i, a) => { const [nx, ny] = a[(i + 1) % 4]; return [0, .25, .5, .75].map(u => [lerp(x, nx, u), lerp(y, ny, u)]); }), true, tt, 2.2);

function skyAndHills(P, t, pan, hor, o = {}) {
  const tt = onTwos(t), ink = o.ink ?? 1;
  P.ramp(FULL, 'b', 0, 0, (o.skyTop ?? .5) * ink, 0, hor + 40, (o.skyLow ?? .05) * ink);
  const sx = o.sunX ?? 1460, sy = o.sunY ?? 210, sr = o.sunR ?? 82, sun = sunPaths(sx, sy, sr, 16, t * .05);
  P.erase(circle(sx, sy, sr * 2.1), ['b']); P.radial(circle(sx, sy, sr * 4.5), 'c', sx, sy, sr, .6 * ink, sr * 4.5, 0);
  P.add(sun.rays, { c: .45 * ink }); P.paint(sun.disc, { c: ink });
  for (const [cx, cy, w, h, sd] of CLOUDS) {
    const x = ((cx - pan * .25 + t * 9) % 2700 + 2700) % 2700 - 400, cp = cloudPath(x, cy, w, h, sd, tt);
    P.paint(cp, {}); P.add(cloudPath(x + w * .04, cy + h * .12, w * .9, h * .6, sd + 1), { b: .1 * ink }); P.outline(cp, 'k', 1.6, ink > .5 ? 1 : .4);
  }
  // far ranges: printed, or only pencilled in while the world ahead is still unprinted
  const far = ridge(x => hor - 30 - 110 * (fbm1((x + pan * .2) * .0019 + 3) * .9 + .5), -60, W + 60, 24, H + 60, tt);
  P.paint(far, { b: .45 * ink, a: .1 * ink }); if (ink < .6) P.outline(far, 'k', 1.2, .38);
  const mid = ridge(x => hor + 4 - 70 * (fbm1((x + pan * .45) * .0034 + 9) * .9 + .45), -60, W + 60, 24, H + 60, tt);
  P.paint(mid, { a: .45 * ink, b: .22 * ink, c: .08 * ink }); if (ink < .6) P.outline(mid, 'k', 1.2, .38);
}

// ---------- the road over the hills, the two travellers ahead. From bar 8 the far end of the road is no
// longer printed: blank paper with only pencil lines, which they keep walking into.
// (pencil lines print through a grain screen so they read as graphite, not dots)
const STEP = 330;   // world units per stride; one stride every two beats

// ---------- a little clock-world: the travellers walk its rim, every turn is a day
function daySky(P, ph, x0 = 0, y0 = 0, w = W, h = H) {
  const night = smooth(inv(.5, .6, ph)) * (1 - smooth(inv(.9, 1, ph))), glow = [0, .5, 1].reduce((s, c) => s + Math.exp(-Math.pow((ph - c) / .07, 2)), 0);
  const R = rect(x0, y0, w, h);
  P.ramp(R, 'b', 0, y0, lerp(.32, 1, night), 0, y0 + h, lerp(.06, .8, night));
  if (glow > .01) P.ramp(R, 'd', 0, y0 + h, .75 * glow, 0, y0 + h * .3, 0);
  P.ramp(R, 'c', 0, y0 + h, .25 * (1 - night), 0, y0, 0);
  if (night > .05) { const r = rng(17); for (let i = 0; i < 90; i++) { const sx = x0 + r() * w, sy = y0 + r() * h * .8, tw = .6 + .4 * Math.sin(i * 7 + ph * 60); P.erase(circle(sx, sy, (1.2 + r() * 2.4) * (w / W + .3) * tw * night), ['b', 'k']); } }
  return night;
}

function clockWorld(P, cx, cy, R, ph, days, t, o = {}) {
  const tt = onTwos(t), rot = o.spin ?? -(days + ph) * TAU, s = R / 330;    // the world turns under the walkers: one turn a day
  const sa = -ph * TAU, sunP = [cx + Math.cos(sa) * R * 1.75, cy + Math.sin(sa) * R * 1.75], moonP = [cx - Math.cos(sa) * R * 1.75, cy - Math.sin(sa) * R * 1.75];
  P.paint(circle(...sunP, 70 * s), { c: 1 }); P.add(sunPaths(...sunP, 70 * s, 12, t * .1).rays, { c: .5 });
  const moon = new Path2D(); moon.arc(...moonP, 50 * s, 0, TAU); moon.arc(moonP[0] + 22 * s, moonP[1] - 12 * s, 44 * s, 0, TAU, true); P.paint(moon, { c: .9 }); P.stroke(moon, 'k', 2 * s, 1);
  P.paint(circle(cx, cy, R * 1.06), { a: .85, c: .2 }); P.outline(blob(cx, cy, R * 1.06, 4, tt, .015), 'k', 2.5 * s, 1);
  P.paint(circle(cx, cy, R * .93), { c: .14 }); P.stroke(circle(cx, cy, R * .93), 'k', 3 * s, 1); P.stroke(circle(cx, cy, R * .89), 'k', 1.5 * s, 1);
  P.save(); P.translate(cx, cy); P.rotate(rot);
  for (let i = 0; i < 60; i++) { const a = i / 60 * TAU, big = i % 5 === 0, p = new Path2D(); p.moveTo(Math.sin(a) * R * .89, -Math.cos(a) * R * .89); p.lineTo(Math.sin(a) * R * (big ? .8 : .85), -Math.cos(a) * R * (big ? .8 : .85)); P.stroke(p, 'k', (big ? 4 : 1.6) * s, 1); }
  for (let h = 1; h <= 12; h++) { const a = h / 12 * TAU; P.save(); P.translate(Math.sin(a) * R * .68, -Math.cos(a) * R * .68); P.rotate(a); text(P, String(h), 0, 0, 54 * s, F.klee(54 * s, 600)); P.restore(); }
  // living on the rim: a sprout that grows a little every day, a tree, a little house
  const g = clamp((o.g0 ?? .2) + (days + ph) * (o.gPerDay ?? .16));
  P.save(); P.rotate(.35); sprout(P, 0, -R * 1.04, 300 * s, g, tt, { seed: 5, sway: .6 }); P.restore();
  P.save(); P.rotate(2.3); const tr = blob(0, -R * 1.04 - 120 * s, 70 * s, 3, tt, .12); P.paint(rect(-7 * s, -R * 1.04 - 70 * s, 14 * s, 72 * s), { k: 1 }); P.paint(tr, { a: .9 }); P.add(blob(-22 * s, -R * 1.04 - 145 * s, 26 * s, 8), { c: .7 }); P.outline(tr, 'k', 1.8 * s, 1); P.restore();
  P.save(); P.rotate(4.2); const hb = rect(-50 * s, -R * 1.04 - 70 * s, 100 * s, 72 * s), roof = poly([[-64 * s, -R * 1.04 - 66 * s], [0, -R * 1.04 - 130 * s], [64 * s, -R * 1.04 - 66 * s]]);
  P.paint(hb, { d: .3, c: .4 }); P.paint(roof, { d: .9 }); P.paint(rect(-12 * s, -R * 1.04 - 40 * s, 24 * s, 42 * s), { k: .7 }); P.paint(rect(18 * s, -R * 1.04 - 56 * s, 20 * s, 18 * s), { c: 1 }); P.stroke(hb, 'k', 2 * s, 1); P.stroke(roof, 'k', 2 * s, 1); P.restore();
  if (o.lush) {   // the world after the second chorus: more trees, a ring of flowers
    for (const a of [1.05, 2.95, 3.6, 5.35]) { P.save(); P.rotate(a); const h = (80 + 50 * hash(Math.round(a * 10))) * s, tr = blob(0, -R * 1.04 - h - 50 * s, 64 * s, Math.round(a * 7), tt, .14);
      P.paint(rect(-6 * s, -R * 1.04 - h, 12 * s, h + 4 * s), { k: 1 }); P.paint(tr, { a: .9 }); P.add(blob(-20 * s, -R * 1.04 - h - 70 * s, 22 * s, Math.round(a * 3)), { c: .7 }); P.outline(tr, 'k', 1.8 * s, 1); P.restore(); }
    for (let i = 0; i < 40; i++) { const a = i / 40 * TAU + .04; if ([.35, 1.05, 2.3, 2.95, 3.6, 4.2, 5.35].some(b => Math.abs(((a - b + Math.PI) % TAU + TAU) % TAU - Math.PI) < .1)) continue;
      P.save(); P.rotate(a); const st = new Path2D(); st.moveTo(0, -R * 1.03); st.lineTo(0, -R * 1.03 - 24 * s); P.stroke(st, 'a', 3 * s, 1);
      blossom(P, 0, -R * 1.03 - 28 * s, 15 * s, 1, tt, { col: i % 2 ? { d: .9 } : { c: 1 }, center: i % 2 ? { c: 1 } : { d: .8 }, rot: i }); P.restore(); }
  }
  P.restore();
  // one hand from the centre, always pointing at the travellers: they are the time of day
  const hand = poly([[cx - 9 * s, cy], [cx, cy - R * .62], [cx + 9 * s, cy]]); P.paint(hand, { k: 1 }); P.paint(circle(cx, cy, 16 * s), { k: 1 }); P.paint(circle(cx, cy, 6 * s), { c: 1 });
  pairSide(P, cx + 10 * s, cy - R * 1.04, 150 * s, beatOf(tt) * .25, tt, [LOOK.a, LOOK.b]);
}

// ---------- hilltop at golden hour: the two sit shoulder to shoulder, a young tree grows between them
function sitter(P, x, y, s, look, t, lean = 0) {
  const body = curve([[x - s * .2, y], [x - s * .16, y - s * .42], [x - s * .08, y - s * .55], [x + s * .08, y - s * .55], [x + s * .16, y - s * .42], [x + s * .2, y]], true, t, .8);
  P.save(); P.translate(x, y); P.rotate(lean); P.translate(-x, -y);
  P.paint(body, look.coat); P.stroke(body, 'k', Math.max(1.5, s * .02), 1);
  const head = circle(x, y - s * .68, s * .14); P.paint(head, look.hair); P.stroke(head, 'k', Math.max(1.5, s * .02), 1);
  if (look.hat) { const hat = new Path2D(); hat.ellipse(x, y - s * .76, s * .27, s * .055, 0, 0, TAU); hat.ellipse(x, y - s * .8, s * .15, s * .11, 0, Math.PI, TAU); P.paint(hat, look.hat); P.stroke(hat, 'k', Math.max(1.5, s * .018), 1); }
  P.restore();
}

// ---- an ink fade wrapper: the same drawing calls, printed at k (1 = full ink, 0 = only a pencilled outline).
// Used for things that are "not printed yet" — the past, the far distance.
function inkProxy(P, k, pencil = .38) {
  if (k >= .999) return P;
  const sk = 1 - k, sc = d => { const r = {}; for (const n in d) r[n] = d[n] * k; return r; };
  return {
    ...P,
    paint(path, d = {}, rule) { P.paint(path, sc(d), rule); if (sk > .02) P.stroke(path, 'k', 1.3, pencil * clamp(sk * 1.6)); },
    add(path, d = {}, rule) { P.add(path, sc(d), rule); },
    stroke(path, n = 'k', lw = 3, d = 1, o) { P.stroke(path, n, lw * lerp(.6, 1, k), k > .5 ? d : pencil, o); },
    outline(path, n = 'k', lw = 3, d = 1) { P.outline(path, n, lw, k > .5 ? d : pencil); },
  };
}

// ---- a blossom: closed bud (open 0) to full flower (open 1)
function blossom(P, x, y, r, open, t, o = {}) {
  const n = o.n || 5, col = o.col || { d: .9 }, lw = Math.max(1, r * .07), rot = o.rot || 0;
  if (open < .15) { const b = ellipse(x, y - r * .3, r * .28, r * .45, o.ang || 0); P.paint(b, col); P.stroke(b, 'k', lw, 1); return; }
  const pr = r * (.35 + .65 * E.outB(clamp(open)));
  for (let i = 0; i < n; i++) { const a = rot + i / n * TAU, pe = ellipse(x + Math.cos(a) * pr * .55, y + Math.sin(a) * pr * .55, pr * .52, pr * .32, a); P.paint(pe, col); P.stroke(pe, 'k', lw, 1); }
  const c = circle(x, y, r * .22 * (.6 + .4 * open)); P.paint(c, o.center || { c: 1 }); P.stroke(c, 'k', lw, 1);
}

// ---- rain: slanted streaks on one drum; `shelter` (Path2D) keeps a dry patch (under an umbrella)
function rainFx(P, t, o = {}) {
  const r = rng(o.seed || 31), n = o.n ?? 220, d = o.drum || 'b', ang = o.ang ?? .18, len = o.len || 46, sp = o.speed || 1400, f = boilSeed(t);
  const p = new Path2D();
  for (let i = 0; i < n; i++) { const x0 = r() * (W + 300) - 150, ph = r(), y = ((f / 12 * sp * (.8 + .4 * ph) + ph * H * 3) % (H + 200)) - 100, x = x0 + y * Math.tan(ang), l = len * (.6 + .8 * r());
    p.moveTo(x, y); p.lineTo(x - Math.sin(ang) * l, y - Math.cos(ang) * l); }
  P.save(); if (o.shelter) P.each(c => { c.beginPath(); c.rect(-50, -50, W + 100, H + 100); c.clip(o.shelter, 'nonzero'); });
  if (o.erase) P.each(c => { c.save(); c.globalCompositeOperation = 'destination-out'; c.lineWidth = o.lw || 2.2; c.strokeStyle = '#000'; c.globalAlpha = o.dens ?? .8; c.stroke(p); c.restore(); }, [d]);
  else P.stroke(p, d, o.lw || 2.2, o.dens ?? .8);
  P.restore();
}

// ---- crepuscular rays fanning down from (x, y)
function godRays(P, x, y, t, o = {}) {
  const n = o.n || 9, len = o.len || 1700, d = o.drum || 'c';
  for (let i = 0; i < n; i++) { const a = (o.dir ?? Math.PI / 2) + (i - (n - 1) / 2) * (o.spread ?? .16) + Math.sin(t * .3 + i * 1.7) * .02, w = (o.width ?? .045) * (.6 + hash(i, 5) * .8);
    const p = poly([[x, y], [x + Math.cos(a - w) * len, y + Math.sin(a - w) * len], [x + Math.cos(a + w) * len, y + Math.sin(a + w) * len]]);
    P.ramp(p, d, x, y, (o.dens ?? .5) * (.6 + .4 * hash(i, 9)), x + Math.cos(a) * len, y + Math.sin(a) * len, 0); }
}

// ---------- verse 2b: a small, fragile thing kept dry — the two hold an umbrella over a seedling in the rain
function umbrella(P, x, y, r, tilt, t, o = {}) {
  const tt = onTwos(t), c = Math.cos(tilt), s = Math.sin(tilt), R = (u, v) => [x + u * c - v * s, y + u * s + v * c];
  // dome on top, scalloped hem underneath (right to left)
  const top = []; for (let i = 0; i <= 16; i++) { const a = Math.PI + i / 16 * Math.PI; top.push(R(Math.cos(a) * r, Math.sin(a) * r * .62)); }
  const hem = []; for (let j = 1; j <= 8; j++) { hem.push(R(r - (j - .5) * r / 4, r * .1)); hem.push(R(r - j * r / 4, 0)); }
  const canopy = curve([...top, ...hem.slice(0, -1)], true, tt, 1); P.paint(canopy, o.col || { d: .9 }); P.outline(canopy, 'k', 2.4, 1);
  const ribs = new Path2D(); for (let i = 1; i < 4; i++) { const u = -r + i * r / 2; ribs.moveTo(...R(0, -r * .62)); ribs.lineTo(...R(u, 0)); } P.stroke(ribs, 'k', 2, 1);
  const tip = poly([R(-4, -r * .62), R(4, -r * .62), R(0, -r * .62 - 18)]); P.paint(tip, { k: 1 });
  return { shaftTop: R(0, 0), shelter: poly([R(-r * 1.02, 0), R(r * 1.02, 0), R(r * 1.25, 900), R(-r * .8, 900)]) };
}

// ---- book chapter page shown during the instrumental breaks
function chapterPage(P, t, t0, num) {
  const lt = t - t0, tt = onTwos(t);
  P.stroke(bookFrame(P, tt), 'k', 5, 1); P.add(rect(120, 100, W - 240, H - 200), { c: .08 });
  const ring = circle(W / 2, 470, 190); P.paint(ring, { c: .9 }); P.stroke(ring, 'k', 4, 1); P.stroke(circle(W / 2, 470, 172), 'k', 1.6, 1);
  text(P, num, W / 2, 470, 210, F.klee(210, 600), { dens: clamp(lt / .6) });
  sprout(P, W / 2 - 330, 780, 230, lerp(.5, .95, E.outQ(clamp(lt / 6))), tt, { seed: 21, sway: .8 }); pot(P, W / 2 - 330, 860, 110, tt);
  sprout(P, W / 2 + 330, 780, 200, lerp(.3, .8, E.outQ(clamp((lt - 1) / 6))), tt, { seed: 22, sway: .8 }); pot(P, W / 2 + 330, 860, 100, tt, { b: .7 });
  drift(P, t, { n: 12, kind: 'fluff', drum: 'k', size: 14, speed: -18, wind: 30, seed: 40 });
}

// ---------- verse 2a: a long line of people holding hands along the ridge, the past only pencilled in,
// ending at the two travellers in full ink. The camera pans from the past to the present.
const KIN = [
  { coat: { b: .8 }, hair: { k: 1 } }, { coat: { d: .8 }, hair: { k: 1 }, hat: { c: 1 } }, { coat: { a: .8 }, hair: { k: 1 } }, { coat: { c: .9, d: .2 }, hair: { k: 1 } },
  { coat: { b: .55, d: .4 }, hair: { k: .5 } }, { coat: { a: .5, c: .5 }, hair: { k: 1 }, hat: { d: .9 } },
];

// ---------- bridge a: a page of small treasures; one more on every beat, then faster — the pile keeps growing
const TREASURE = [
  (P, s, t) => { P.paint(leafPath(-s * .42, s * .18, s * .84, s * .42, -.55, { round: .6 }, t), { a: .9 }); P.stroke(leafPath(-s * .42, s * .18, s * .84, s * .42, -.55, { round: .6 }, t), 'k', 2, 1); P.stroke(midrib(-s * .42, s * .18, s * .84, -.55, 0, t), 'k', 1.6, 1); },
  (P, s, t) => { const b = ellipse(0, s * .1, s * .26, s * .32); P.paint(b, { d: .75, c: .3 }); P.stroke(b, 'k', 2, 1); const cap = ellipse(0, -s * .14, s * .32, s * .15); P.paint(cap, { k: .55, d: .3 }); P.stroke(cap, 'k', 2, 1); const st = new Path2D(); st.moveTo(0, -s * .28); st.lineTo(s * .05, -s * .4); P.stroke(st, 'k', 3, 1); },
  (P, s, t) => { const p = new Path2D(); p.moveTo(0, s * .32); for (let i = 0; i <= 10; i++) { const a = Math.PI * (1.1 + i / 10 * .8); p.lineTo(Math.cos(a) * s * .42, s * .32 + Math.sin(a) * s * .6); } p.closePath(); P.paint(p, { d: .45, c: .25 }); P.stroke(p, 'k', 2, 1);
    const r = new Path2D(); for (let i = 1; i < 10; i++) { const a = Math.PI * (1.1 + i / 10 * .8); r.moveTo(0, s * .32); r.lineTo(Math.cos(a) * s * .4, s * .32 + Math.sin(a) * s * .56); } P.stroke(r, 'k', 1.2, 1); },
  (P, s, t) => { const q = new Path2D(); q.moveTo(-s * .3, s * .38); q.quadraticCurveTo(0, 0, s * .32, -s * .4); P.stroke(q, 'k', 2.4, 1); const v = curve([[-s * .2, s * .26], [-s * .1, 0], [s * .1, -s * .26], [s * .3, -s * .4], [s * .2, -s * .16], [s * .02, s * .12]], true, t, .6); P.paint(v, { b: .8 }); P.stroke(v, 'k', 1.8, 1); },
  (P, s, t) => { const p = new Path2D(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? s * .17 : s * .4; i ? p.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : p.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } p.closePath(); P.paint(p, { c: 1 }); P.stroke(p, 'k', 2.2, 1); },
  (P, s, t) => { const b = blob(0, s * .05, s * .36, 7, t, .2, s * .26); P.paint(b, { k: .22, b: .2 }); P.stroke(b, 'k', 2, 1); P.erase(ellipse(-s * .12, -s * .06, s * .09, s * .05, -.3)); },
  (P, s, t) => { const b = circle(0, 0, s * .32); P.paint(b, { b: .8 }); P.stroke(b, 'k', 2, 1); P.stroke(circle(0, 0, s * .24), 'k', 1.2, 1); for (const [hx, hy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) P.erase(circle(hx * s * .07, hy * s * .07, s * .035)); },
  (P, s, t) => { const e = rect(-s * .4, -s * .26, s * .8, s * .52); P.paint(e, {}); P.stroke(e, 'k', 2, 1); const f = new Path2D(); f.moveTo(-s * .4, -s * .26); f.lineTo(0, s * .06); f.lineTo(s * .4, -s * .26); P.stroke(f, 'k', 2, 1);
    const h = new Path2D(); h.moveTo(0, s * .14); h.bezierCurveTo(-s * .14, 0, -s * .06, -s * .1, 0, -s * .02); h.bezierCurveTo(s * .06, -s * .1, s * .14, 0, 0, s * .14); P.paint(h, { d: 1 }); },
  (P, s, t) => { blossom(P, 0, 0, s * .4, 1, t, { col: { d: .85 }, center: { c: 1 } }); },
  (P, s, t) => { const r = new Path2D(); r.arc(-s * .2, 0, s * .15, 0, TAU); r.moveTo(-s * .05, -s * .03); r.lineTo(s * .38, -s * .03); r.lineTo(s * .38, s * .1); r.lineTo(s * .3, s * .1); r.lineTo(s * .3, s * .03); r.lineTo(s * .22, s * .03); r.lineTo(s * .22, s * .1); r.lineTo(s * .14, s * .1); r.lineTo(s * .14, s * .03); r.lineTo(-s * .05, s * .03);
    P.paint(r, { c: .9, d: .15 }, 'evenodd'); P.stroke(r, 'k', 1.8, 1); },
  (P, s, t) => { const c = poly([[-s * .28, -s * .22], [s * .2, -s * .22], [s * .16, s * .3], [-s * .24, s * .3]]); P.paint(c, { b: .55, a: .2 }); P.stroke(c, 'k', 2, 1); P.stroke(ellipse(s * .26, s * .02, s * .1, s * .13), 'k', 3, 1);
    const st = new Path2D(); for (let i = 0; i < 2; i++) { const x0 = -s * .1 + i * s * .14; st.moveTo(x0, -s * .3); st.bezierCurveTo(x0 + s * .06, -s * .38, x0 - s * .06, -s * .44, x0, -s * .52); } P.stroke(st, 'k', 1.6, 1); },
  (P, s, t) => { for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2, p = new Path2D(), cx = Math.cos(a) * s * .17, cy = Math.sin(a) * s * .17; p.arc(cx + Math.cos(a + 1.2) * s * .07, cy + Math.sin(a + 1.2) * s * .07, s * .12, 0, TAU); p.arc(cx + Math.cos(a - 1.2) * s * .07, cy + Math.sin(a - 1.2) * s * .07, s * .12, 0, TAU); P.paint(p, { a: .9 }); P.stroke(p, 'k', 1.6, 1); }
    const st = new Path2D(); st.moveTo(0, 0); st.quadraticCurveTo(s * .05, s * .25, s * .2, s * .4); P.stroke(st, 'k', 3, 1); },
];

// ---- print reveal: each drum's pass runs over the sheet top to bottom, one beat apart (light inks first, key last)
const DRUM_ORDER = [['c', 0], ['a', 1], ['d', 2], ['k', 3]];   // [drum, beat offset]
function drumPasses(P, t, start, order = DRUM_ORDER) {
  const b0 = beatT(Math.ceil(beatOf(start))), pass = beatLen() * .9;
  for (const [d, k] of order) { const u = E.ioS(clamp((t - (b0 + k * beatLen())) / pass)); if (u < 1) P.erase(rect(-50, lerp(-50, H + 50, u), W + 100, H + 100), [d]); }
}
