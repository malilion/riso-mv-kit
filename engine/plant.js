// plant.js: a seedling's life on paper. It breaks the soil bent over in a hook, straightens, sheds the
// seed coat, opens its two seed leaves, then pushes a pair of true leaves (and a bud) from the tip.
// g = growth 0..1 (stages below); past 1 it just sways. s = mature height in px.
const STAGE = { hook: [.04, .3], lift: [.22, .46], open: [.42, .58], leaves: [.56, .95], bud: [.86, 1] };

function sproutGeom(x, y, s, g, t, o = {}) {
  const lean = o.lean || 0, side = o.side || 1;
  const Lh = s * (.05 + .55 * E.outQ(inv(.02, .5, g))) * (o.stemK ?? 1);   // hypocotyl: soil -> seed leaves
  const Le = s * .4 * E.outQ(inv(.55, 1, g));                       // epicotyl: seed leaves -> tip
  const hook = Math.PI * 1.05 * (1 - E.ioS(inv(STAGE.lift[0], STAGE.lift[1], g)));
  const sway = (o.sway ?? 1) * (.05 * Math.sin(t * 1.3 + (o.seed || 0)) + .025 * Math.sin(t * 2.9 + 1.7)) * E.outQ(clamp(g * 1.5));
  const N = 18, L = Lh + Le, pts = []; let th = lean, px = x, py = y;
  for (let i = 0; i <= N; i++) {
    const u = i / N, l = u * L; pts.push([px, py, th, l]);
    // curvature: the hook lives in the top third of the hypocotyl, sway grows toward the tip
    const uh = l / Math.max(Lh, 1e-3), bump = Math.exp(-Math.pow((uh - .86) / .12, 2)) * (l <= Lh ? 1 : 0);
    const k = side * hook * bump / (.12 * Math.sqrt(Math.PI)) / Math.max(Lh, 1) + sway * (u * 2) / Math.max(L, 1) + side * .0004 * Math.sin(u * 3 + (o.seed || 0));
    const dl = L / N; th += k * dl; px += Math.sin(th) * dl; py -= Math.cos(th) * dl;
  }
  const at = l => { for (let i = 1; i < pts.length; i++) if (pts[i][3] >= l) { const a = pts[i - 1], b = pts[i], u = (l - a[3]) / (b[3] - a[3] || 1); return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; } return pts.at(-1).slice(0, 3); };
  return { pts, Lh, Le, L, node: at(Lh), tip: pts.at(-1).slice(0, 3), hook };
}

// d: drums {stem, leaf, hi, line, coat}; returns the geometry so scenes can attach things (bud, light)
function sprout(P, x, y, s, g, t, o = {}) {
  const d = { stem: 'a', leaf: 'a', hi: 'c', line: 'k', coat: 'd', ...(o.drums || {}) };
  if (g <= 0) return null;
  const G = sproutGeom(x, y, s, g, t, o), lw = Math.max(1.2, s * .011), W0 = s * .03 * (.7 + .3 * clamp(g * 2)) * (o.thick ?? 1);
  // stem as a tapered ribbon
  const L = [], R = [];
  G.pts.forEach(([px, py, th, l]) => { const w = W0 * (1 - .4 * l / Math.max(G.L, 1)); L.push([px - Math.cos(th) * w, py - Math.sin(th) * w]); R.push([px + Math.cos(th) * w, py + Math.sin(th) * w]); });
  const stem = curve([...L, ...R.reverse()], true, t, .7);
  // seed leaves: thick, round and paler than true leaves; folded together while hooked, then swing open
  const [nx, ny, nth] = G.node, open = E.outB(inv(STAGE.open[0], STAGE.open[1], g)), cl = s * (.07 + .07 * E.outQ(inv(.3, .7, g))) * (o.leafK ?? 1);
  const cots = [-1, 1].map(k => { const a = nth - Math.PI / 2 + k * lerp(.14, 1.3, open);
    return { path: leafPath(nx, ny, cl, cl * .78, a, { oval: true, n: 12, bend: -k * .06, asym: .85 }, t), a, k }; });
  // true leaves at the tip
  const lg = E.outQ(inv(STAGE.leaves[0], STAGE.leaves[1], g)), [tx, ty, tth] = G.tip, tl = s * .2 * lg;
  const trues = lg > 0 ? [-1, 1].map(k => { const a = tth - Math.PI / 2 + k * lerp(.1, .95, E.outQ(inv(.62, .98, g))); return { path: leafPath(tx, ty, tl, tl * .5, a, { round: .3, n: 10, bend: -k * .12 }, t), a, k }; }) : [];
  // print: stem, seed leaves, true leaves (front-most last)
  P.paint(stem, { [d.stem]: .9 }); P.stroke(stem, d.line, lw, 1);
  for (const c of cots) { P.paint(c.path, { [d.leaf]: .75, [d.hi]: .45 }); P.add(leafPath(nx, ny, cl * .8, cl * .32, c.a - c.k * .2, { oval: true }, null), { [d.hi]: .6 });
    P.stroke(c.path, d.line, lw, 1); }
  for (const c of trues) { P.paint(c.path, { [d.leaf]: 1 }); P.stroke(c.path, d.line, lw, 1); P.stroke(midrib(tx, ty, tl, c.a, -c.k * .12, t), d.line, lw * .7, 1);
    const vein = new Path2D(), ca = Math.cos(c.a), sa = Math.sin(c.a);
    for (let v = 1; v <= 3; v++) { const u = v / 4.2, bx = tx + ca * tl * u, by = ty + sa * tl * u;
      [-1, 1].forEach(sd => { vein.moveTo(bx, by); vein.lineTo(bx + Math.cos(c.a + sd * .75) * tl * .15, by + Math.sin(c.a + sd * .75) * tl * .15); }); }
    P.stroke(vein, d.line, lw * .5, .45); }
  // bud
  const bg = E.outB(inv(STAGE.bud[0], STAGE.bud[1], g)); if (bg > 0 && o.bud !== false) { const b = ellipse(tx, ty - s * .02 * bg, s * .022 * bg, s * .035 * bg, tth); P.paint(b, { [o.budDrum || 'd']: .9, [d.hi]: .3 }); P.stroke(b, d.line, lw * .8, .8); }
  // seed coat riding on the closed seed leaves, falling away as they open
  if (o.coat !== false && open < .9) { const fall = E.inQ(inv(.42, .6, g)), cx = nx + Math.sin(nth) * cl * .55 + fall * s * .12, cy = ny - Math.cos(nth) * cl * .55 + fall * fall * s * .5;
    const coat = ellipse(cx, cy, cl * .45, cl * .32, nth + fall * 2); P.paint(coat, { [d.coat]: .8 }); P.stroke(coat, d.line, lw, .85); }
  return G;
}
// roots under the soil line: a tap root and a few hairs
function roots(P, x, y, s, g, t, o = {}) {
  const len = s * .45 * E.outQ(inv(0, .7, g)); if (len < 2) return; const r = rng(o.seed || 3), p = new Path2D(); const pts = [];
  for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([x + Math.sin(u * 3 + (o.seed || 0)) * s * .03 * u, y + u * len]); }
  curve(pts, false, t, .8, p);
  for (let i = 0; i < 9; i++) { const u = .2 + r() * .75; if (u * len > len * .95) continue; const [bx, by] = [x + Math.sin(u * 3 + (o.seed || 0)) * s * .03 * u, y + u * len], k = r() < .5 ? -1 : 1, l = s * (.04 + r() * .08) * clamp(g * 1.4 - u * .5);
    p.moveTo(bx, by); p.quadraticCurveTo(bx + k * l * .6, by + l * .2, bx + k * l, by + l * .7); }
  P.stroke(p, o.drum || 'k', Math.max(1, s * .008), .8);
}
