// road.js: the country road that keeps going (pseudo-3D segment projection, printed in riso drums).
// Ground bands are projected near -> far with exact occlusion clipping, so they can simply overprint;
// roadside sprites and the walkers are painted far -> near on top, clipped behind nearer hill crests.
const ROAD = (() => {
  const SEG = 200, RW = 430, DRAW = 240;
  const segs = [];
  const lastY = () => segs.length ? segs[segs.length - 1].y2 : 0;
  function seg(curve, y) { const n = segs.length; segs.push({ i: n, curve, y1: lastY(), y2: y }); }
  function road(enter, hold, leave, curve, rise) {
    const y0 = lastY(), y1 = y0 + rise * SEG, tot = enter + hold + leave;
    for (let n = 0; n < enter; n++) seg(lerp(0, curve, E.inQ(n / enter)), lerp(y0, y1, E.ioS(n / tot)));
    for (let n = 0; n < hold; n++) seg(curve, lerp(y0, y1, E.ioS((enter + n) / tot)));
    for (let n = 0; n < leave; n++) seg(lerp(curve, 0, E.ioS(n / leave)), lerp(y0, y1, E.ioS((enter + hold + n) / tot)));
  }
  // the route: gentle bends, slopes up and down, then a long climb toward the far hills
  road(12, 18, 12, 0, 0); road(20, 25, 20, 1.6, 6); road(20, 20, 20, -2.4, -3); road(15, 30, 15, .8, 9);
  road(20, 15, 20, -1.4, -6); road(25, 40, 25, 2.0, 14); road(20, 30, 20, -1.8, -4); road(20, 30, 20, 0, 8);
  road(20, 20, 20, 2.6, -7); road(30, 40, 30, -1.2, 12); road(20, 40, 20, 0, -10);
  const N = segs.length, LEN = N * SEG;
  // cumulative bend, used to pan the backdrop as the road turns
  const bend = [0]; for (let i = 0; i < N; i++) bend.push(bend[i] + segs[i].curve);
  const S = i => segs[((i % N) + N) % N];
  const groundY = z => { const i = Math.floor(z / SEG), s = S(i); return lerp(s.y1, s.y2, (z - i * SEG) / SEG); };
  const bendAt = z => { const i = Math.floor(z / SEG), k = ((i % N) + N) % N; return lerp(bend[k], bend[k + 1], (z - i * SEG) / SEG) + Math.floor(i / N) * bend[N]; };

  // crops per field (side, block). density sets for drums a (green) c (yellow) d (pink)
  const CROPS = [{ a: .62 }, { a: .78, c: .18 }, { c: .9, a: .22 }, { a: .5, d: .22 }, { a: .7 }, { a: .55, c: .35 }];
  const field = (i, zone) => CROPS[Math.floor(hash(Math.floor((i + zone * 5) / 13) + 7, zone + 9) * CROPS.length)];
  const ZONES = [2.2, 6.5, 14, 0];   // field strip boundaries in road half-widths from the edge; 0 = to the horizon

  // o: { z (camera world z), camH, fov, hor (horizon px), walk: {ahead, ph, s, looks (one look = a lone walker)}, haze }
  function render(P, t, o) {
    const camZ = o.z, depth = 1 / Math.tan((o.fov || 62) / 2 * Math.PI / 180), hor = o.hor ?? H * .42, F2 = W / 2;
    const inkAt = n => o.blank ? 1 - smooth(inv(o.blank[0], o.blank[1], n / DRAW)) : 1;   // 0 = unprinted paper
    const n0 = Math.floor(camZ / SEG), pct = camZ / SEG - n0;
    const camY = (groundY(camZ) + groundY(camZ + 900)) / 2 + (o.camH || 900);
    const base = S(n0);
    let x = 0, dx = -base.curve * pct;
    const list = [];
    for (let n = 0; n < DRAW; n++) {
      const s = S(n0 + n), z1 = (n0 + n) * SEG - camZ, z2 = z1 + SEG;
      const pr = (wx, wy, cz) => { const k = depth / cz; return { x: F2 + k * wx * F2, y: hor - k * (wy - camY) * F2, k, w: k * RW * F2, cz }; };
      const p1 = pr(x, s.y1, Math.max(z1, 1)), p2 = pr(x + dx, s.y2, z2);
      list.push({ s, n, p1, p2, z1 }); x += dx; dx += s.curve;
    }
    // ---- backdrop pans with the accumulated bend
    const pan = bendAt(camZ) * .9;
    // ---- ground bands near -> far with occlusion
    let maxy = H + 2; const bands = [];
    for (const g of list) {
      g.clip = maxy; const { p1, p2 } = g;
      if (g.z1 + SEG <= 40 || p2.y >= p1.y) continue;
      const yT = p2.y, yB = Math.min(p1.y, maxy); if (yT >= yB - .01) continue;
      const u = (yB - p2.y) / (p1.y - p2.y || 1), xb = lerp(p2.x, p1.x, u), wb = lerp(p2.w, p1.w, u);
      bands.push({ g, yT, yB, xt: p2.x, wt: p2.w, xb, wb }); maxy = yT;
    }
    const groundTop = maxy;
    if (o.backdrop) o.backdrop(P, pan, groundTop, hor);
    P.erase(rect(-50, groundTop, W + 100, H + 100 - groundTop));
    for (const b of bands) {
      const { g, yT, yB, xt, wt, xb, wb } = b, i = g.s.i, far = clamp(g.n / DRAW), haze = (o.haze ?? .45) * smooth(far), ink = inkAt(g.n);
      const row = (i % 3 === 0 ? .1 : 0) * (1 - far) * clamp((yB - yT) / 3);
      const dims = d => { const r = {}; for (const k in d) r[k] = (d[k] * (1 - haze) + (k === 'a' ? row : 0)) * ink; r.b = ((r.b || 0) + haze * .38 * ink); return r; };
      // fields: strips parallel to the road (edges converge on the horizon), crops change by block
      for (const side of [-1, 1]) {
        let prevT = side < 0 ? xt - wt : xt + wt, prevB = side < 0 ? xb - wb : xb + wb;
        ZONES.forEach((zw, zi) => {
          const eT = zw ? xt + side * (wt + wt * zw) : side * 4000, eB = zw ? xb + side * (wb + wb * zw) : side * 4000;
          P.add(poly([[prevT, yT], [eT, yT], [eB, yB], [prevB, yB]]), dims(field(i, side * 3 + zi)));
          if (zw && yB - yT > .6) { const e = new Path2D(); e.moveTo(eT, yT); e.lineTo(eB, yB); P.stroke(e, 'k', clamp(wb * .006, .4, 1.6), ink > .5 ? .5 * (1 - haze) : .3); }
          prevT = eT; prevB = eB;
        });
      }
      const road = poly([[xt - wt, yT], [xt + wt, yT], [xb + wb, yB], [xb - wb, yB]]);
      P.add(road, { c: .1 * (1 - haze) * ink, b: haze * .2 * ink });
      const mid = poly([[xt - wt * .1, yT], [xt + wt * .1, yT], [xb + wb * .1, yB], [xb - wb * .1, yB]]); P.add(mid, { a: .38 * (1 - haze) * ink });
      if (yB - yT > .6) { const e = new Path2D(); e.moveTo(xt - wt, yT); e.lineTo(xb - wb, yB); e.moveTo(xt + wt, yT); e.lineTo(xb + wb, yB); P.stroke(e, 'k', clamp(wb * .012, .6, 3), ink > .5 ? 1 : .42); }
    }
    // ---- sprites far -> near, clipped behind nearer terrain
    const wz = o.walk ? camZ + o.walk.ahead : -1;
    for (let k = list.length - 1; k >= 0; k--) {
      const g = list[k]; if (g.z1 < 60) continue; const { s, p1 } = g;
      const sc = p1.k * F2, haze = (o.haze ?? .45) * smooth(clamp(g.n / DRAW)), ink = inkAt(g.n);
      P.save(); P.each(c => { c.beginPath(); c.rect(-50, -50, W + 100, g.clip + 50); c.clip(); });
      const r = rng(s.i * 31 + 5);
      for (const side of [-1, 1]) {
        const kind = r();
        const hz = 1 - (1 - haze) * ink;   // fading into paper reads like extra haze, minus the blue
        if (kind < .12) tree(P, p1.x + side * (RW * (1.6 + r() * 2.6)) * sc, p1.y, sc, s.i * 2 + side, t, hz, ink);
        else if (kind < .3) bush(P, p1.x + side * (RW * (1.3 + r() * 1.5)) * sc, p1.y, sc, s.i * 3 + side, t, hz, ink);
        else if (kind < .44) flowers(P, p1.x + side * (RW * (1.15 + r() * .6)) * sc, p1.y, sc, s.i + side, hz);
      }
      if (wz >= 0 && Math.floor(wz / SEG) === (n0 + g.n)) {
        const u = (wz % SEG) / SEG, nx = list[k + 1] ? list[k + 1].p1 : g.p2, wx = lerp(p1.x, nx.x, u), wy = lerp(p1.y, nx.y, u), wk = lerp(p1.k, nx.k, u) * F2;
        if (o.walk.looks.length > 1) pair(P, wx + (o.walk.dx || 0) * wk, wy, (o.walk.h || 560) * wk, o.walk.ph, t, o.walk.looks);
        else walker(P, wx + (o.walk.dx || 0) * wk, wy, (o.walk.h || 560) * wk, o.walk.ph, o.walk.looks[0], t);   // a lone traveller
        if (o.walk.after) o.walk.after(P, wx, wy, wk);
      }
      P.restore();
    }
    return { groundTop, pan, camY };
  }
  // ---- roadside sprites (sizes in world units * sc)
  function tree(P, x, y, sc, seed, t, haze, ink = 1) {
    const h = (620 + hash(seed) * 420) * sc, cr = (230 + hash(seed, 2) * 140) * sc; if (cr < .8) return;
    const blue = ink * .4 * Math.min(haze, .6);
    const trunk = poly([[x - cr * .08, y], [x + cr * .08, y], [x + cr * .05, y - h * .62], [x - cr * .05, y - h * .62]]);
    if (ink > .5) P.paint(trunk, { k: haze > .5 ? .5 : 1 }); else P.stroke(trunk, 'k', .8, .42);
    const cy = y - h * .62 - cr * .55, can = blob(x, cy, cr, seed, cr > 6 ? t : null, .14, cr * 1.05);
    P.paint(can, { a: .85 * (1 - haze), b: blue });
    if (cr > 4) { P.add(blob(x - cr * .38, cy - cr * .42, cr * .38, seed + 9, null, .12), { c: .7 * (1 - haze) });
      P.add(blob(x + cr * .3, cy + cr * .45, cr * .55, seed + 4, null, .12, cr * .35), { b: .25 * (1 - haze) });
      P.outline(can, 'k', clamp(cr * .018, .5, 2.2), ink > .5 ? 1 : .42); }
    else if (ink < .5) P.stroke(can, 'k', .8, .42);
  }
  function bush(P, x, y, sc, seed, t, haze, ink = 1) {
    const r = (110 + hash(seed) * 90) * sc; if (r < .8) return;
    const b = blob(x, y - r * .6, r * 1.3, seed, r > 6 ? t : null, .16, r * .75); P.paint(b, { a: .7 * (1 - haze), b: (.12 + Math.min(haze, .6) * .3) * ink });
    if (r > 4) { P.add(blob(x - r * .4, y - r * .9, r * .5, seed + 3, null, .1, r * .3), { c: .6 * (1 - haze) }); P.outline(b, 'k', clamp(r * .02, .5, 2), ink > .5 ? 1 : .42); }
  }
  function flowers(P, x, y, sc, seed, haze) {
    const r = rng(seed * 7 + 1), s = 26 * sc; if (s < .6) return;
    for (let i = 0; i < 7; i++) { const fx = x + (r() - .5) * 260 * sc, fy = y - r() * 40 * sc; P.paint(circle(fx, fy - s, s * .5), i % 3 ? { d: .9 * (1 - haze) } : { c: 1 * (1 - haze) }); }
  }
  return { render, SEG, RW, LEN, groundY, bendAt };
})();
