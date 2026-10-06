// draw.js: picture-book vocabulary. Everything builds Path2D shapes; scenes decide which drums they print on.
const F = {
  klee: (s, w = 600) => `${w} ${s}px "Klee One"`, wenkai: (s, w = 700) => `${w} ${s}px "LXGW WenKai TC"`,
};

// ---- hand-drawn line boil: points drift through a noise field that is re-rolled on every drawing (twos)
function boil(x, y, t, amp = 1.6, freq = .012) {
  const s = boilSeed(t) * 7.31;
  return [x + noise2(x * freq + s, y * freq) * amp, y + noise2(x * freq + 31.7, y * freq + s) * amp];
}
// Catmull-Rom through points -> smooth Path2D (optionally closed), with boil
function curve(pts, closed = false, t = null, amp = 1.6, path = new Path2D()) {
  const q = t === null ? pts : pts.map(([x, y]) => boil(x, y, t, amp)); const n = q.length; if (n < 2) return path;
  const at = i => closed ? q[(i + n) % n] : q[clamp(i, 0, n - 1)];
  path.moveTo(q[0][0], q[0][1]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    path.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
  }
  if (closed) path.closePath();
  return path;
}
const poly = (pts, closed = true, path = new Path2D()) => { pts.forEach(([x, y], i) => i ? path.lineTo(x, y) : path.moveTo(x, y)); if (closed) path.closePath(); return path; };
const rect = (x, y, w, h) => { const p = new Path2D(); p.rect(x, y, w, h); return p; };
const circle = (x, y, r) => { const p = new Path2D(); p.arc(x, y, Math.max(0, r), 0, TAU); return p; };
const ellipse = (x, y, rx, ry, rot = 0) => { const p = new Path2D(); p.ellipse(x, y, Math.max(0, rx), Math.max(0, ry), rot, 0, TAU); return p; };
const FULL = rect(-50, -50, W + 100, H + 100);

// organic circle
function blobPts(cx, cy, r, seed = 1, irr = .12, n = 22, ry = r) {
  const out = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, k = 1 + irr * (noise1(seed * 13.7 + i * .9) * .7 + noise1(seed * 3.1 + i * 2.3) * .3); out.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * ry * k]); }
  return out;
}
const blob = (cx, cy, r, seed, t = null, irr = .12, ry = r) => curve(blobPts(cx, cy, r, seed, irr, 22, ry), true, t);
// cumulus: a row of overlapping puffs on a flat-ish base (one Path2D, nonzero fill = union)
function cloudPath(cx, cy, w, h, seed = 1, t = null) {
  const r = rng(seed), p = new Path2D(), n = 4 + Math.floor(w / h * 1.2);
  for (let i = 0; i < n; i++) { const u = (i + .5) / n, x = cx - w / 2 + u * w, bump = Math.sin(u * Math.PI); const rr = h * (.35 + .45 * bump) * (.8 + .4 * r());
    curve(blobPts(x, cy - rr * .45 * bump, rr, seed * 10 + i, .06, 18), true, t, 1.4, p); }
  curve(blobPts(cx, cy + h * .06, w * .52, seed + 77, .03, 24, h * .26), true, t, 1.4, p);   // flat underside
  return p;
}
// hills: ridgeline y(x) closed down to the bottom of the frame
function ridge(yfn, x0 = -60, x1 = W + 60, step = 24, bottom = H + 60, t = null) {
  const pts = []; for (let x = x0; x <= x1 + step; x += step) pts.push([x, yfn(x)]);
  const p = curve(pts, false, t, 1.2); p.lineTo(x1 + step, bottom); p.lineTo(x0, bottom); p.closePath(); return p;
}
// leaf outline along +x from the petiole (0,0) to the tip (len,0)
function leafPts(len, wid, o = {}) {
  const n = o.n || 10, bend = o.bend || 0, round = o.round ?? .5, top = [], bot = [];
  for (let i = 0; i <= n; i++) { const u = i / n;
    // o.oval: rounded tip (seed leaves); otherwise a pointed tip whose fullness follows `round`
    const prof = (o.oval ? Math.sqrt(Math.max(0, 1 - Math.pow(2 * u - 1, 2))) * Math.pow(u, .15) : Math.pow(Math.sin(Math.PI * Math.pow(u, lerp(.9, .55, round))), .9)) * wid / 2;
    const yc = bend * len * u * u; top.push([u * len, yc - prof]); bot.push([u * len, yc + prof * (o.asym ?? 1)]); }
  return [...top, ...bot.reverse().slice(1, -1)];
}
function leafPath(x, y, len, wid, ang, o = {}, t = null) {
  const c = Math.cos(ang), s = Math.sin(ang);
  return curve(leafPts(len, wid, o).map(([u, v]) => [x + u * c - v * s, y + u * s + v * c]), true, t, o.amp ?? 1);
}
function midrib(x, y, len, ang, bend = 0, t = null) {
  const c = Math.cos(ang), s = Math.sin(ang), pts = [];
  for (let i = 0; i <= 6; i++) { const u = i / 6 * .86; const v = bend * len * u * u; pts.push([x + u * len * c - v * s, y + u * len * s + v * c]); }
  return curve(pts, false, t, .8);
}
// ---- the sun: a flat disc + halftone glow, rays as wedges
function sunPaths(x, y, r, n = 14, rot = 0, len = 1.9) {
  const rays = new Path2D(); for (let i = 0; i < n; i++) { const a = rot + i / n * TAU, w = Math.PI / n * .38;
    rays.moveTo(x + Math.cos(a - w) * r * 1.22, y + Math.sin(a - w) * r * 1.22); rays.lineTo(x + Math.cos(a) * r * len, y + Math.sin(a) * r * len); rays.lineTo(x + Math.cos(a + w) * r * 1.22, y + Math.sin(a + w) * r * 1.22); rays.closePath(); }
  return { disc: circle(x, y, r), rays };
}

// ---- tiny picture-book walkers seen from behind. look: {hair, coat, hat}
function walker(P, x, y, s, ph, look = {}, t = 0) {
  // y is the feet line; s ~ figure height in px
  const step = Math.sin(ph * TAU), lift = Math.abs(Math.cos(ph * TAU)) * s * .015, bob = -lift;
  const legL = s * .3, hip = y - legL + bob, sh = hip - s * .36, headR = s * .125, hy = sh - headR * 1.05;
  const legs = new Path2D(); [-1, 1].forEach(k => { const sw = step * k * s * .07; legs.moveTo(x + k * s * .055, hip); legs.lineTo(x + k * s * .055 + sw, y - (k * step > 0 ? s * .02 : 0)); });
  P.stroke(legs, 'k', Math.max(2, s * .045), 1);
  const coat = curve([[x - s * .1, sh + s * .02], [x + s * .1, sh + s * .02], [x + s * .16, hip + s * .03], [x - s * .16, hip + s * .03]], true, t, .8);
  P.paint(coat, look.coat || {}); P.stroke(coat, 'k', Math.max(1.5, s * .022), .9);
  const head = circle(x, hy, headR); P.paint(head, look.hair || {}); P.stroke(head, 'k', Math.max(1.5, s * .022), .9);
  if (look.hat) { const hat = new Path2D(); hat.ellipse(x, hy - headR * .35, headR * 1.9, headR * .42, 0, 0, TAU); hat.ellipse(x, hy - headR * .6, headR * 1.05, headR * .8, 0, Math.PI, TAU);
    P.paint(hat, look.hat); P.stroke(hat, 'k', Math.max(1.5, s * .02), .9); }
  if (look.bag) { const b = curve(blobPts(x - s * .02, sh + s * .16, s * .09, 4, .05, 12, s * .11), true, t, .6); P.paint(b, look.bag); P.stroke(b, 'k', Math.max(1.2, s * .018), .9); }
  return { hand: (k) => [x + k * s * .15, sh + s * .27 + bob] };
}
// two walkers holding hands
function pair(P, x, y, s, ph, t, looks) {
  const gap = s * .42;
  const A = walker(P, x - gap / 2, y, s, ph, looks[0], t), B = walker(P, x + gap / 2, y, s * .9, ph + .5, looks[1], t);
  const [ax, ay] = A.hand(1), [bx, by] = B.hand(-1); const arm = new Path2D(); arm.moveTo(ax - s * .04, ay - s * .12); arm.quadraticCurveTo((ax + bx) / 2, Math.max(ay, by) + s * .05, bx + s * .04, by - s * .12);
  P.stroke(arm, 'k', Math.max(1.6, s * .03), 1);
}

// ---- falling petals / drifting seeds. kind: 'petal' | 'fluff'
function drift(P, t, o = {}) {
  const r = rng(o.seed || 7), n = o.n || 40, d = o.drum || 'b';
  for (let i = 0; i < n; i++) {
    const depth = .4 + r() * .9, x0 = r() * (W + 400) - 200, sp = (o.speed || 70) * depth, ph = r() * 50, sw = 40 + r() * 80;
    const u = t + ph, y = ((u * sp + r() * H) % (H + 200)) - 100, x = x0 + Math.sin(u * .8 + i) * sw + (o.wind || 30) * u * depth % (W + 400);
    const xx = ((x % (W + 400)) + W + 400) % (W + 400) - 200, sz = (o.size || 14) * depth, rot = u * (1.5 + r() * 2) + i;
    if (o.kind === 'fluff') { const p = new Path2D(); for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + rot * .2; p.moveTo(xx, y); p.lineTo(xx + Math.cos(a) * sz, y + Math.sin(a) * sz); } P.stroke(p, d, Math.max(1, sz * .1), .9); P.add(circle(xx, y, sz * .14), { [d]: 1 }); }
    else { const flip = Math.abs(Math.cos(u * 2 + i)); const p = new Path2D(); p.ellipse(xx, y, sz, sz * (.35 + .4 * flip), rot, 0, TAU); P.add(p, { [d]: o.dens || .95 }); }
  }
}

// side view walker facing +x (or -x with dir = -1); y = feet line, s = height. Returns hand points.
function walkerSide(P, x, y, s, ph, look = {}, t = 0, dir = 1) {
  const sw = Math.sin(ph * TAU), bob = -Math.abs(Math.cos(ph * TAU)) * s * .02, legL = s * .32, hip = y - legL + bob, sh = hip - s * .33, hr = s * .13, hy = sh - hr * 1.05;
  const lw = Math.max(1.5, s * .045), leg = (a, d) => { const p = new Path2D(); const kx = x + Math.sin(a) * legL * dir, ky = hip + Math.cos(a) * legL; p.moveTo(x, hip); p.lineTo(kx, ky); P.stroke(p, 'k', lw, d);
    P.paint(ellipse(kx + dir * s * .03, ky - s * .01, s * .05, s * .025), { k: d }); };
  const arm = (a, d) => { const p = new Path2D(); p.moveTo(x, sh + s * .04); const hx = x + Math.sin(a) * s * .26 * dir, hyy = sh + s * .04 + Math.cos(a) * s * .26; p.lineTo(hx, hyy); P.stroke(p, 'k', lw * .85, d); return [hx, hyy]; };
  leg(-sw * .5, .55); const back = arm(sw * .55, .55);
  const coat = curve([[x - s * .09, sh], [x + s * .09, sh], [x + s * .13, hip + s * .04], [x - s * .14, hip + s * .04]], true, t, .8);
  P.paint(coat, look.coat || {}); P.stroke(coat, 'k', Math.max(1.2, s * .02), 1);
  leg(sw * .5, 1); const front = arm(-sw * .55, 1);
  const head = circle(x, hy, hr); P.paint(head, { c: .12, d: .18 }); P.stroke(head, 'k', Math.max(1.2, s * .02), 1);
  const hair = new Path2D(); hair.arc(x - dir * hr * .1, hy - hr * .1, hr * 1.02, dir > 0 ? Math.PI * .95 : -Math.PI * .05, dir > 0 ? Math.PI * 2.15 : Math.PI * 1.05); hair.closePath();
  P.paint(hair, look.hair || { k: 1 });
  P.paint(circle(x + dir * hr * .5, hy + hr * .15, Math.max(.8, hr * .1)), { k: 1 });                 // eye
  P.add(circle(x + dir * hr * .35, hy + hr * .5, hr * .2), { d: .6 });                                // blush
  if (look.hat) { const hat = new Path2D(); hat.ellipse(x, hy - hr * .55, hr * 1.7, hr * .3, 0, 0, TAU); hat.ellipse(x - dir * hr * .05, hy - hr * .75, hr * .95, hr * .7, 0, Math.PI, TAU);
    P.paint(hat, look.hat); P.stroke(hat, 'k', Math.max(1.2, s * .018), 1); }
  return { front, back };
}
// two side-view walkers, the far one a step behind, holding hands
function pairSide(P, x, y, s, ph, t, looks, dir = 1) {
  const B = walkerSide(P, x - dir * s * .3, y - s * .02, s * .92, ph + .5, looks[1], t, dir);
  const A = walkerSide(P, x + dir * s * .02, y, s, ph, looks[0], t, dir);
  const p = new Path2D(); p.moveTo(A.back[0], A.back[1]); p.quadraticCurveTo((A.back[0] + B.front[0]) / 2, Math.max(A.back[1], B.front[1]) + s * .04, B.front[0], B.front[1]);
  P.stroke(p, 'k', Math.max(1.4, s * .035), 1);
}
// a flower pot (front view), base at y
function pot(P, x, y, w, t, dr = { d: .85 }) {
  const body = curve([[x - w * .5, y - w * .78], [x + w * .5, y - w * .78], [x + w * .38, y], [x - w * .38, y]], true, t, .6);
  P.paint(body, dr); P.stroke(body, 'k', Math.max(1.5, w * .04), 1);
  const rim = rect(x - w * .56, y - w * .9, w * 1.12, w * .16); P.paint(rim, dr); P.add(rim, { k: .25 }); P.stroke(rim, 'k', Math.max(1.5, w * .04), 1);
  P.paint(ellipse(x, y - w * .9, w * .5, w * .06), { k: .55 });
}
