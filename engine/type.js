// type.js: lyric typesetting. Japanese runs vertically (Klee One), printed glyph by glyph as it is sung;
// the Chinese translation sits horizontally below (LXGW WenKai). Both get a paper "halo" knocked out of
// every drum so they stay readable over busy prints.
const SMALL = 'ゃゅょぁぃぅぇぉっャュョァィゥェォッ', PUNCT = '、。，．・！？!?「」『』（）()…― ';
function glyphWeight(ch) {
  if (ch === ' ' || ch === '　') return .6;
  if (PUNCT.includes(ch)) return 0;
  if (SMALL.includes(ch)) return .45;
  if (/[一-鿿々]/.test(ch)) return 1.6;
  return 1;
}
// per-glyph start times (spaces dropped). With L.parts = [[a,b],...] (one window per space-separated phrase),
// each phrase is spread over its own window, so the reveal waits through the breath between them.
const _gt = new Map();
function columns(text) { return text.split(/[ 　]+/).filter(Boolean); }
function glyphTimes(li) {
  const L = LY[li], key = li + '|' + L.t0 + '|' + L.t1 + '|' + L.ja; if (_gt.has(key)) return _gt.get(key);
  const chunks = columns(L.ja || ''), out = [], sing = L.sing ?? .88;
  const spread = (str, a, b) => { const ch = [...str], w = ch.map(glyphWeight), tot = w.reduce((p, c) => p + c, 0) || 1; let acc = 0;
    ch.forEach((c, i) => { if (c !== ' ' && c !== '　') out.push({ c, t: a + (b - a) * sing * acc / tot }); acc += w[i]; }); };
  if (L.parts && L.parts.length === chunks.length) chunks.forEach((c, k) => spread(c, L.parts[k][0], L.parts[k][1]));
  else spread(L.ja || '', L.t0, L.t1);
  _gt.set(key, out); return out;
}
// lay glyphs into vertical columns: one per phrase, long phrases wrapped into balanced columns
function jaColumns(text, maxPer) {
  const cols = []; let gi = 0;
  for (const chunk of columns(text)) { const g = [...chunk], k = Math.ceil(g.length / maxPer), per = Math.ceil(g.length / k);
    for (let i = 0; i < g.length; i += per) cols.push(g.slice(i, i + per).map((c, j) => ({ c, gi: gi + i + j }))); gi += g.length; }
  return cols;
}

function haloText(P, text, x, y, size, font, o = {}) {
  P.each(c => { c.save(); c.font = font; c.textAlign = o.align || 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.globalCompositeOperation = 'destination-out'; c.lineWidth = size * (o.halo ?? .28); c.strokeStyle = `rgba(0,0,0,${o.haloA ?? 1})`; c.strokeText(text, x, y); c.restore(); });
}
// o: {x: right-most column centre, y: top, size, drum, dens, gap (column spacing), halo, maxY}
function jaVert(P, t, li, o = {}) {
  if (window.NO_LYRICS || li < 0 || !LY[li] || !LY[li].ja) return;
  const L = LY[li], size = o.size || 74, drum = o.drum || 'k', gap = o.gap || size * 1.45, font = F.klee(size, o.weight || 600);
  const out = clamp((t - (L.t1 + (o.hold ?? .35))) / .45), gts = glyphTimes(li), y0 = o.y ?? 150;
  const maxPer = Math.max(4, Math.floor(((o.maxY ?? H - 150) - y0) / (size * 1.04)));
  jaColumns(L.ja, maxPer).forEach((col, ci) => {
    const x = (o.x ?? W - 170) - ci * gap; let y = y0 + (o.stagger ?? .5) * ci * size;
    for (const { c: ch, gi } of col) {
      const gt = gts[gi] ? gts[gi].t : L.t0, u = clamp((t - gt) / .16), sm = SMALL.includes(ch);
      if (u > 0) {
        const rot = /[ー〜～]/.test(ch), s = lerp(1.35, 1, E.outB(u)), a = clamp(u * 1.6) * (1 - out);
        const gx = x + (sm ? size * .14 : 0), gy = y + size * .5 - (sm ? size * .08 : 0) - out * 18;
        P.save(); P.each(c => { c.translate(gx, gy); c.scale(s, s); if (rot) c.rotate(Math.PI / 2); });
        if (o.halo !== false) haloText(P, ch, 0, 0, size, font, { halo: o.haloW ?? .3, haloA: a });
        const c = P[drum]; c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = dens((o.dens ?? 1) * a); c.fillText(ch, 0, 0);
        P.restore();
      }
      y += size * (sm ? .8 : 1.04);
    }
  });
}
// o: {y (baseline centre), size, drum, dens}
function zhSub(P, t, li, o = {}) {
  if (window.NO_LYRICS || li < 0 || !LY[li] || !LY[li].zh) return;
  const L = LY[li], a = clamp((t - L.t0 + .1) / .35) * (1 - clamp((t - (L.t1 + (o.hold ?? .35))) / .4)); if (a <= 0) return;
  const size = o.size || 44, font = F.wenkai(size), x = o.x ?? W / 2, y = (o.y ?? H - 96);
  haloText(P, L.zh, x, y, size, font, { halo: .34, haloA: a, align: o.align });
  const c = P[o.drum || 'k']; c.save(); c.font = font; c.textAlign = o.align || 'center'; c.textBaseline = 'middle'; c.fillStyle = dens((o.dens ?? .95) * a); c.fillText(L.zh, x, y); c.restore();
}
// plain text on one drum (titles, credits)
function text(P, s, x, y, size, font, o = {}) {
  if (o.halo) haloText(P, s, x, y, size, font, { halo: o.halo, align: o.align });
  const c = P[o.drum || 'k']; c.save(); c.font = font; c.textAlign = o.align || 'center'; c.textBaseline = o.base || 'middle'; c.fillStyle = dens(o.dens ?? 1);
  if (o.vertical) { let yy = y; for (const ch of [...s]) { c.fillText(ch, x, yy); yy += size * (o.lh || 1.05); } } else c.fillText(s, x, y);
  c.restore();
}
