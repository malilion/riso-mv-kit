// tools/video-lyric-scan.js — read lyric timing from a video with burned-in (on-screen) subtitles.
// It plays the video muted at 2x and records every moment the subtitle area changes. It never downloads
// the video; it only looks at frames while they play, like watching it. Only use it on videos you may watch.
//
// How to use (Claude can do this with the built-in browser, or you can paste it in the DevTools console):
//   1. open the video page (YouTube works; any page with a <video> element does)
//   2. adjust BAND below if the subtitles are not in the bottom quarter, then run this script
//   3. KEEP THE TAB VISIBLE — browsers do not draw video frames in hidden tabs. A badge shows progress;
//      the scan pauses itself when hidden and continues when visible again
//   4. when the badge says done:  copy(JSON.stringify(__lyricScan.segments(), null, 1))
//      -> segments [{ t0, t1, ink }] where ink ~ how much subtitle text was on screen (longer lines = more ink)
//   5. match segments to lyric lines (ink grows with glyph count; one segment can hold two lines, or one line
//      can be split in two), then write projects/NAME/timing.json — see docs/WORKFLOW.md
(() => {
  const FROM = 0, TO = null /* null = whole video */, RATE = 2;
  const BAND = { x0: .125, x1: .875, y0: .71, y1: .99 };   // subtitle area, as fractions of the frame
  const WHITE = 225;                                        // subtitle pixels brighter than this on all channels
  const v = document.querySelector('#movie_player video') || document.querySelector('video'); if (!v) return console.log('no <video> on this page');
  const yt = document.querySelector('#movie_player');
  const ctl = yt && yt.seekTo ? { play: () => yt.playVideo(), pause: () => yt.pauseVideo(), seek: t => yt.seekTo(t, true), rate: r => yt.setPlaybackRate(r), mute: () => yt.mute(), paused: () => yt.getPlayerState() === 2 }
    : { play: () => v.play(), pause: () => v.pause(), seek: t => { v.currentTime = t; }, rate: r => { v.playbackRate = r; }, mute: () => { v.muted = true; }, paused: () => v.paused };
  const c = document.createElement('canvas'); c.width = 320; c.height = 180; const x = c.getContext('2d', { willReadFrequently: true });
  const bx = Math.round(BAND.x0 * 320), by = Math.round(BAND.y0 * 180), bw = Math.round((BAND.x1 - BAND.x0) * 320), bh = Math.round((BAND.y1 - BAND.y0) * 180);
  const mask = () => { x.drawImage(v, 0, 0, 320, 180); const d = x.getImageData(bx, by, bw, bh).data, m = new Uint8Array(bw * bh); let n = 0;
    for (let i = 0; i < m.length; i++) { const o = i * 4; if (d[o] > WHITE && d[o + 1] > WHITE && d[o + 2] > WHITE) { m[i] = 1; n++; } } return { m, n }; };
  const S = window.__lyricScan = { from: FROM, to: TO || v.duration - .2, pos: FROM, done: false, changes: [], prev: null, active: false,
    segments() { const seg = []; let cur = null; for (const ch of this.changes) { if (cur) { cur.t1 = ch.t; seg.push(cur); cur = null; } if (ch.n > 20) cur = { t0: ch.t, ink: ch.n }; }
      if (cur) { cur.t1 = this.pos; seg.push(cur); } return seg; } };
  function sample(now, meta) {
    if (!S.active) return;
    if (!document.hidden && meta.mediaTime > S.pos - .001) { const { m, n } = mask(); let df = 0; if (S.prev) for (let i = 0; i < m.length; i++) df += m[i] ^ S.prev[i];
      if (df > 40 || !S.prev) S.changes.push({ t: +meta.mediaTime.toFixed(3), n, df }); S.prev = m; S.pos = meta.mediaTime; }
    if (S.pos >= S.to) { S.done = true; S.active = false; ctl.pause(); ctl.rate(1); return; }
    v.requestVideoFrameCallback(sample);
  }
  const resume = () => { if (S.done || document.hidden || S.active) return; S.active = true; ctl.mute(); ctl.rate(RATE); ctl.seek(Math.max(0, S.pos - .3)); ctl.play(); v.requestVideoFrameCallback(sample); };
  const hold = () => { if (!S.active) return; S.active = false; ctl.pause(); };
  document.addEventListener('visibilitychange', () => document.hidden ? hold() : setTimeout(resume, 300));
  setInterval(() => { if (!document.hidden && S.active && ctl.paused()) ctl.play(); if (!document.hidden && !S.active && !S.done) resume(); }, 600);
  const b = document.createElement('div'); document.body.appendChild(b);
  Object.assign(b.style, { position: 'fixed', zIndex: 2147483647, left: '50%', top: '12px', transform: 'translateX(-50%)', background: '#2E3B37', color: '#F4EEE1', font: '600 18px system-ui, sans-serif', padding: '10px 18px', borderRadius: '10px', pointerEvents: 'none' });
  setInterval(() => { const p = Math.min(100, Math.round((S.pos - S.from) / (S.to - S.from) * 100)); b.textContent = S.done ? 'lyric scan done ✓' : `reading lyric timing ${p}% — keep this tab visible`; b.style.background = S.done ? '#397E58' : '#2E3B37'; }, 400);
  resume();
})();
