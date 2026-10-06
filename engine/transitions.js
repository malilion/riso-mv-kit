// transitions.js: how one printed page gives way to the next. Works on finished prints (RGB canvases),
// so the two scenes can load different inks. u runs 0 -> 1 across the transition.
const PAPER_BACK = '#E9E1CF';

// clip a convex polygon to the half-plane n·p >= d (Sutherland–Hodgman, one plane)
function clipHalf(pts, nx, ny, d) {
  const out = [], f = p => p[0] * nx + p[1] * ny - d;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], fa = f(a), fb = f(b);
    if (fa >= 0) out.push(a);
    if ((fa >= 0) !== (fb >= 0)) { const k = fa / (fa - fb); out.push([lerp(a[0], b[0], k), lerp(a[1], b[1], k)]); }
  }
  return out;
}
const toPath = pts => poly(pts);

const TRANS = {
  cut(cx, A, B, u) { cx.drawImage(u < .5 ? A : B, 0, 0); },
  fade(cx, A, B, u) { cx.drawImage(A, 0, 0); cx.globalAlpha = smooth(u); cx.drawImage(B, 0, 0); cx.globalAlpha = 1; },
  // a page of the picture book turned from the bottom-right corner: the flat part of the old page stays,
  // the lifted part folds over (paper back with a little show-through), the next page is revealed beneath
  page(cx, A, B, u, o = {}) {
    const al = o.angle ?? .32, nx = Math.cos(al), ny = Math.sin(al), dMax = W * nx + H * ny, dMin = -Math.abs(H * ny) - 60;
    const d = lerp(dMax + 4, dMin, E.ioC(clamp(u)));
    const rectPts = [[0, 0], [W, 0], [W, H], [0, H]];
    const lifted = clipHalf(rectPts, nx, ny, d);                                // part of the old page that is turning
    const flat = clipHalf(rectPts, -nx, -ny, -d);                              // part still lying flat
    const refl = ([x, y]) => { const k = 2 * (x * nx + y * ny - d); return [x - k * nx, y - k * ny]; };
    const flap = lifted.map(refl);
    cx.save(); cx.drawImage(B, 0, 0);
    // shade the newly revealed page along the fold
    if (lifted.length) { cx.save(); cx.clip(toPath(lifted)); const g = cx.createLinearGradient(d * nx, d * ny, (d + 160) * nx, (d + 160) * ny);
      g.addColorStop(0, 'rgba(40,36,28,.42)'); g.addColorStop(1, 'rgba(40,36,28,0)'); cx.globalCompositeOperation = 'multiply'; cx.fillStyle = g; cx.fillRect(0, 0, W, H); cx.restore(); }
    if (flat.length) { cx.save(); cx.clip(toPath(flat)); cx.drawImage(A, 0, 0); cx.restore(); }
    if (flap.length > 2) {
      // soft drop shadow of the flap onto whatever lies under it
      cx.save(); cx.filter = 'blur(10px)'; cx.fillStyle = 'rgba(30,26,20,.28)'; cx.translate(10, 12); cx.fill(toPath(flap)); cx.restore();
      cx.save(); cx.clip(toPath(flap)); cx.fillStyle = PAPER_BACK; cx.fillRect(0, 0, W, H);
      // show-through: the old print seen from behind (mirrored across the fold), faint
      cx.globalAlpha = .13; cx.globalCompositeOperation = 'multiply';
      cx.transform(1 - 2 * nx * nx, -2 * nx * ny, -2 * nx * ny, 1 - 2 * ny * ny, 2 * d * nx, 2 * d * ny); cx.drawImage(A, 0, 0);
      cx.restore();
      // the curl: light at the fold, darker toward the free edge
      cx.save(); cx.clip(toPath(flap)); const g = cx.createLinearGradient(d * nx, d * ny, (d - 420) * nx, (d - 420) * ny);
      g.addColorStop(0, 'rgba(255,255,255,.28)'); g.addColorStop(.25, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(60,50,40,.16)');
      cx.fillStyle = g; cx.fillRect(0, 0, W, H); cx.restore();
      cx.save(); cx.strokeStyle = 'rgba(60,50,40,.35)'; cx.lineWidth = 1.5; cx.stroke(toPath(flap)); cx.restore();
    }
    cx.restore();
  },
};
