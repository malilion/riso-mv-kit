// scenes.js (_brand): the repo icon and the social preview banner, printed with the kit's own riso engine.
// The mascot: a little seed with a face, a pair of seed leaves sprouting from its head, in front of the sun.

// the seed mascot, centred at (x, y) with body radius r
function seedling(P, x, y, r, t) {
  const tt = onTwos(t);
  // seed leaves first, so the body sits in front of the stem
  sprout(P, x + r * .06, y - r * .78, r * 2.1, .565, tt, { seed: 3, sway: .35, bud: false, coat: false, stemK: .32, leafK: 1.75, thick: 1.6 });
  const body = curve(blobPts(x, y, r * 1.08, 12, .035, 26, r * .92), true, tt, 1.4);
  P.paint(body, { c: .9, d: .42 }); P.add(blob(x - r * .38, y - r * .38, r * .32, 5, null, .06, r * .22), { c: .5 }); P.outline(body, 'k', r * .045, 1);
  const crack = new Path2D(); crack.moveTo(x - r * .18, y - r * .9); crack.lineTo(x - r * .06, y - r * .74); crack.lineTo(x + r * .1, y - r * .86); crack.lineTo(x + r * .2, y - r * .72); P.stroke(crack, 'k', r * .035, 1);
  // face: eyes with a highlight, blush, a small smile
  for (const k of [-1, 1]) { const ex = x + k * r * .34, ey = y + r * .02; P.paint(ellipse(ex, ey, r * .1, r * .13), { k: 1 }); P.erase(circle(ex + r * .03, ey - r * .05, r * .035), ['k']);
    P.paint(ellipse(x + k * r * .6, y + r * .26, r * .17, r * .1), { d: .9 }); }
  const smile = new Path2D(); smile.arc(x, y + r * .18, r * .13, .15 * Math.PI, .85 * Math.PI); P.stroke(smile, 'k', r * .045, 1);
}
function sparkle(P, x, y, s, drum = 'c') {
  const p = new Path2D(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? s * .3 : s; i ? p.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : p.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  p.closePath(); P.paint(p, { [drum]: 1 }); P.outline(p, 'k', Math.max(2, s * .08), 1);
}
// ---------- square icon: the centre 1080 x 1080 of the frame is cropped and given round corners
async function sc_icon(P, t) {
  const tt = onTwos(t), cx = W / 2;
  P.add(FULL, { c: .14 }); P.ramp(FULL, 'b', 0, 0, .42, 0, 640, 0);
  const sun = sunPaths(cx, 470, 300, 18, .2, 1.45); P.add(sun.rays, { c: .5 }); P.paint(sun.disc, { c: 1 });
  const hill = ridge(x => 850 + Math.pow((x - cx) / 560, 2) * 120, -60, W + 60, 20, H + 60, tt); P.paint(hill, { a: .85, c: .2 }); P.outline(hill, 'k', 5, 1);
  for (let i = 0; i < 26; i++) { const gx = 470 + hash(i, 4) * 980, gy = 850 + Math.pow((gx - cx) / 560, 2) * 120, p = new Path2D(); p.moveTo(gx, gy + 3); p.quadraticCurveTo(gx + 5, gy - 16, gx + 11, gy - 30); P.stroke(p, 'k', 4, 1); }
  for (const [x, y, s] of [[1250, 760, 18], [700, 810, 14], [1330, 860, 12]]) blossom(P, x, y, s * 2, 1, tt, { col: { d: .9 }, center: { c: 1 } });
  seedling(P, cx, 770, 175, t);
  sparkle(P, 640, 300, 34); sparkle(P, 1300, 240, 26, 'd'); sparkle(P, 1360, 560, 18);
  return { inks: { k: INK.spruce, a: INK.kelly, b: INK.cornflower, c: INK.yellow, d: INK.bubblegum }, mis: 2.2, vig: .05 };
}
// ---------- social preview banner (cropped to 1920 x 960, then scaled to 1280 x 640)
async function sc_banner(P, t) {
  const tt = onTwos(t);
  P.add(FULL, { c: .1 }); P.ramp(FULL, 'b', 0, 60, .3, 0, 700, 0);
  P.stroke(curve([[110, 110], [W - 110, 110], [W - 110, H - 110], [110, H - 110]].flatMap(([x, y], i, a) => { const [nx, ny] = a[(i + 1) % 4]; return [0, .25, .5, .75].map(u => [lerp(x, nx, u), lerp(y, ny, u)]); }), true, tt, 2.2), 'k', 6, 1);
  const sun = sunPaths(560, 500, 250, 16, .2, 1.4); P.add(sun.rays, { c: .5 }); P.paint(sun.disc, { c: 1 });
  const hill = ridge(x => 840 + Math.pow((x - 560) / 520, 2) * 110, -60, W + 60, 20, H + 400, tt); P.paint(hill, { a: .85, c: .2 }); P.outline(hill, 'k', 5, 1);
  seedling(P, 560, 745, 150, t); sparkle(P, 300, 330, 30); sparkle(P, 820, 280, 22, 'd');
  text(P, 'riso-mv-kit', 1380, 420, 132, F.klee(132, 600));
  text(P, '孔版印刷風的繪本 MV 工具包', 1380, 560, 54, F.wenkai(54, 700), { drum: 'k' });
  text(P, 'Riso-print picture-book music videos,', 1380, 650, 38, F.klee(38, 600), { dens: .9 });
  text(P, 'drawn by code', 1380, 700, 38, F.klee(38, 600), { dens: .9 });
  P.paint(rect(1080, 760, 600, 14), { d: .9 }); P.paint(rect(1080, 790, 420, 14), { a: .9 });
  return { inks: { k: INK.spruce, a: INK.kelly, b: INK.cornflower, c: INK.yellow, d: INK.bubblegum }, mis: 2, vig: .05 };
}
