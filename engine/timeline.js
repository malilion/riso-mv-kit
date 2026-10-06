// timeline.js: turns a project's STORY into a schedule and draws it.
// STORY (from the project's story.js) is an array — or a function returning one — of entries:
//   { bar: n, fn }        start on the downbeat of bar n (0 = first downbeat in song.json "phase")
//   { line: i, fn }       start on the bar line just before lyric line i is sung (index into lyrics.json)
//   { after: i, fn }      start on the first bar line after lyric line i has ended
//   { at: seconds, fn }   start at an absolute time
// plus optional tr: 'page' | 'fade' — the transition INTO that scene, timed to finish exactly at its start,
// so page turns land on the bar line that begins the phrase.
const TR = { page: { type: 'page', dur: 1.3 }, fade: { type: 'fade', dur: .8 }, cut: null };
const lineT = i => LY[i] && LY[i].t0 >= 0 ? LY[i].t0 : NaN;
const sinceLine = (i, t0) => lineT(i) - t0;            // seconds from a scene's start to line i
const barLen = () => beatLen() * SONG.meter;
const barBefore = t => barT(Math.floor((t - SONG.phase + .35) / barLen()));   // sung lines start just after their bar line
let TL = [];
function buildTimeline() {
  const story = typeof STORY === 'function' ? STORY() : STORY;
  TL = story.map(s => {
    let t = 0;
    if (s.at !== undefined) t = s.at;
    else if (s.bar !== undefined) t = s.bar ? barT(s.bar) : 0;
    else if (s.line !== undefined) t = barBefore(lineT(s.line));
    else if (s.after !== undefined) t = barT(Math.ceil((LY[s.after].t1 + .6 - SONG.phase) / barLen()));
    return { t, fn: s.fn, tr: s.tr ? TR[s.tr] : null };
  }).sort((a, b) => a.t - b.t);
}
const _buf = [0, 1].map(() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c.getContext('2d'); });
async function printScene(e, t) {
  const P = RISO.begin(); P.save(); const cfg = await e.fn(P, t, e.t) || {}; P.restore();
  return RISO.print(t, cfg);
}
async function drawTimeline(cx, t) {
  let i = TL.length - 1; while (i > 0 && TL[i].t > t) i--;
  const nx = TL[i + 1];
  if (nx && nx.tr && t > nx.t - nx.tr.dur) {
    _buf[0].drawImage(await printScene(TL[i], t), 0, 0);
    _buf[1].drawImage(await printScene(nx, t), 0, 0);
    TRANS[nx.tr.type](cx, _buf[0].canvas, _buf[1].canvas, (t - (nx.t - nx.tr.dur)) / nx.tr.dur, nx.tr);
  } else cx.drawImage(await printScene(TL[i], t), 0, 0);
  // fade back to blank paper at the very end
  const fo = clamp((t - (SONG.dur - (SONG.fadeOut ?? 2))) / (SONG.fadeOut ?? 2)); if (fo > 0) { cx.fillStyle = `rgba(244,238,225,${fo})`; cx.fillRect(0, 0, W, H); }
}
