// core.js: frame size, song clock, math, noise, rng, asset cache, lyric store.
const W = 1920, H = 1080, FPS = 30;
const TAU = Math.PI * 2;

// ---- song clock. song.json (written by analyze.mjs, then hand-tuned) overrides these on load,
// so scenes can be drafted before the audio exists.
const SONG = { audio: 'audio/song.mp3', bpm: 80, phase: 0, meter: 4, dur: 90, sections: {} };
const beatLen = () => 60 / SONG.bpm;
const beatOf = t => (t - SONG.phase) / beatLen();
const beatT = b => SONG.phase + b * beatLen();
const barOf = t => beatOf(t) / SONG.meter;
// decaying pulse on every beat (1 on the beat, then fades); div = 2 for eighths
const pulse = (t, k = 6, div = 1) => { const b = beatOf(t) * div; return b < 0 ? 0 : Math.exp(-(b - Math.floor(b)) * k); };
const onTwos = t => Math.floor(t * 12) / 12; // hand-drawn motion: 12 drawings per second
const boilSeed = t => Math.floor(t * 12);    // every drawing is a fresh print

// ---- math / easing
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const smooth = u => u * u * (3 - 2 * u);
const E = {
  lin: u => u, inQ: u => u * u, outQ: u => 1 - (1 - u) * (1 - u), ioQ: u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2,
  outC: u => 1 - Math.pow(1 - u, 3), inC: u => u * u * u, ioC: u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2,
  outX: u => u >= 1 ? 1 : 1 - Math.pow(2, -10 * u), ioS: u => -(Math.cos(Math.PI * u) - 1) / 2,
  outB: u => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); },
  outEl: u => u === 0 ? 0 : u === 1 ? 1 : Math.pow(2, -10 * u) * Math.sin((u * 10 - .75) * TAU / 3) + 1,
};
function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const hash = (a, b = 0) => { const r = rng(a * 7919 + b * 104729 + 13); r(); return r(); };
// smooth value noise, both in -1..1
const noise1 = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };
const _h2 = (x, y) => { let n = (x * 374761393 + y * 668265263) | 0; n = (n ^ (n >>> 13)) * 1274126177 | 0; return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
function noise2(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(_h2(ix, iy), _h2(ix + 1, iy), ux), lerp(_h2(ix, iy + 1), _h2(ix + 1, iy + 1), ux), uy) * 2 - 1;
}
const fbm1 = (x, oct = 4) => { let s = 0, a = .5, f = 1; for (let i = 0; i < oct; i++) { s += a * noise1(x * f + i * 17.3); f *= 2.03; a *= .5; } return s; };

// ---- assets
const _cache = new Map();
function img(src) {
  if (!_cache.has(src)) _cache.set(src, new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('img ' + src)); i.src = src; }));
  return _cache.get(src);
}

// ---- lyrics: [{t0, t1, ja, zh}] from lyrics.json (made with timing.html from the user's lyrics.txt)
let LY = [];
// the latest line that has started and not yet faded (pad covers the fade-out after the sung end)
const lyricIdx = (t, pad = 1.2) => { for (let i = LY.length - 1; i >= 0; i--) { const l = LY[i]; if (l.t0 >= 0 && t >= l.t0) return t < l.t1 + pad ? i : -1; } return -1; };
const barT = n => SONG.phase + n * SONG.meter * beatLen();
// piecewise-smooth keyframes: keys = [[t, v], ...] sorted by t
const keys = (t, ks) => { if (t <= ks[0][0]) return ks[0][1]; for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) return lerp(ks[i - 1][1], ks[i][1], E.ioS(inv(ks[i - 1][0], ks[i][0], t))); return ks[ks.length - 1][1]; };
