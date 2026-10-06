// tools/analyze.mjs PROJECT [bpm]: tempo, beat phase (first downbeat), energy + onset envelopes
// -> projects/PROJECT/analysis.json, and seeds song.json (bpm / phase) without touching hand-tuned fields
// (set "bpmLocked": true in song.json to keep your own bpm/phase). Optional 2nd argument forces the bpm.
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process';
const ROOT = path.resolve(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname)), '..');
const PROJECT = process.argv[2] || 'mebuki', PDIR = path.join(ROOT, 'projects', PROJECT);
const sp = path.join(PDIR, 'song.json'), song = fs.existsSync(sp) ? JSON.parse(fs.readFileSync(sp, 'utf8')) : {};
const rel = song.audio || 'audio/song.mp3', file = path.join(PDIR, rel);
const FF = [process.env.FFMPEG, 'ffmpeg'].filter(Boolean).find(f => { try { execFileSync(f, ['-version'], { stdio: 'ignore' }); return true; } catch (e) { return false; } });
if (!FF) { console.error('ffmpeg not found (brew install ffmpeg)'); process.exit(1); }
if (!fs.existsSync(file)) { console.error('audio not found:', file); process.exit(1); }

const SR = 22050, raw = execFileSync(FF, ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
const x = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
const HOP = 256, N = 1024, nF = Math.floor((x.length - N) / HOP), fps = SR / HOP;
function fftMag(re) {
  const n = re.length, im = new Float64Array(n);
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) [re[i], re[j]] = [re[j], re[i]]; }
  for (let len = 2; len <= n; len <<= 1) { const a = -2 * Math.PI / len;
    for (let i = 0; i < n; i += len) for (let k = 0; k < len / 2; k++) {
      const c = Math.cos(a * k), s = Math.sin(a * k), ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * c - im[i + k + len / 2] * s, vi = re[i + k + len / 2] * s + im[i + k + len / 2] * c;
      re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi; } }
  const m = new Float64Array(n / 2); for (let i = 0; i < n / 2; i++) m[i] = Math.log1p(Math.hypot(re[i], im[i])); return m;
}
const win = Float64Array.from({ length: N }, (_, i) => .5 - .5 * Math.cos(2 * Math.PI * i / N)), bin = f => Math.round(f * N / SR);
let prev = null; const flux = new Float64Array(nF), rms = new Float64Array(nF), low = new Float64Array(nF), voc = new Float64Array(nF), hi = new Float64Array(nF);
for (let f = 0; f < nF; f++) {
  const fr = new Float64Array(N); let e = 0; for (let i = 0; i < N; i++) { const v = x[f * HOP + i]; fr[i] = v * win[i]; e += v * v; }
  rms[f] = Math.sqrt(e / N); const m = fftMag(fr);
  let s = 0; if (prev) for (let k = 1; k < m.length; k++) s += Math.max(0, m[k] - prev[k]); flux[f] = s; prev = m;
  for (let k = bin(30); k < bin(150); k++) low[f] += m[k];
  for (let k = bin(300); k < bin(3400); k++) voc[f] += m[k];
  for (let k = bin(5000); k < bin(10000); k++) hi[f] += m[k];
}
const mean = a => { let s = 0; for (const v of a) s += v; return s / (a.length || 1); };
const on = flux.map((v, i) => Math.max(0, v - mean(flux.subarray(Math.max(0, i - 20), i + 20))));
// tempo: onset autocorrelation 60-180 bpm, phase: best grid alignment
let best = [0, 0]; const scores = [];
for (let bpm = 60; bpm <= 180; bpm += .05) { const lag = 60 * fps / bpm; let s = 0;
  for (let i = 0; i + lag * 4 < nF; i++) { const j = i + lag, a = Math.floor(j), q = j - a; s += on[i] * (on[a] * (1 - q) + on[a + 1] * q); }
  scores.push([bpm, s]); if (s > best[1]) best = [bpm, s]; }
// half/double-tempo ambiguity: if the octave partner scores nearly as well, prefer the one in 80-160 bpm
const scoreAt = b => { let m = 0; for (const [bb, s] of scores) if (Math.abs(bb - b) < .6) m = Math.max(m, s); return m; };
let bpm = best[0];
for (const k of [2, .5]) { const alt = best[0] * k; if (alt >= 60 && alt <= 180 && scoreAt(alt) > best[1] * .7 && (bpm < 80 || bpm > 160) && alt >= 80 && alt <= 160) bpm = alt; }
// refine: a 1% tempo error drifts a full beat within a minute, so search finely around the estimate,
// scoring how well a beat grid lands on onsets (phase optimised per candidate)
function gridScore(b, from = 0, to = nF / fps) { const per = 60 / b; let bestS = 0, bestPh = 0;
  for (let ph = 0; ph < per; ph += .004) { let s = 0; for (let t = ph + Math.ceil((from - ph) / per) * per; t < to; t += per) { const i = Math.round(t * fps); s += (on[i] || 0) + .6 * ((on[i - 1] || 0) + (on[i + 1] || 0)); } if (s > bestS) { bestS = s; bestPh = ph; } }
  return [bestS, bestPh]; }
{ let rb = [bpm, 0]; for (let b = bpm * .985; b <= bpm * 1.015; b += .01) { const [sc] = gridScore(b); if (sc > rb[1]) rb = [b, sc]; } bpm = rb[0]; }
if (process.argv[3]) bpm = +process.argv[3];   // manual override: node tools/analyze.mjs NAME 132.5
const period = 60 / bpm;
let bp = [0, 0]; for (let ph = 0; ph < period; ph += .002) { let s = 0; for (let t = ph; t < nF / fps; t += period) { const i = Math.round(t * fps); s += on[i] + .5 * (on[i - 1] || 0) + .5 * (on[i + 1] || 0); } if (s > bp[1]) bp = [ph, s]; }
// downbeat guess: which of 4 beat offsets carries the most low-end onset energy
const lowOn = low.map((v, i) => Math.max(0, v - (low[i - 1] || v)));
const bar = [0, 1, 2, 3].map(k => { let s = 0; for (let t = bp[0] + k * period; t < nF / fps; t += period * 4) s += lowOn[Math.round(t * fps)] || 0; return s; });
const down = bar.indexOf(Math.max(...bar));
const seg = (a, t0, t1) => mean(a.subarray(Math.floor(t0 * fps), Math.floor(t1 * fps)));
const env = []; for (let t = 0; t < nF / fps - .5; t += .5) env.push({ t, rms: +seg(rms, t, t + .5).toFixed(4), low: +seg(low, t, t + .5).toFixed(1), voc: +seg(voc, t, t + .5).toFixed(1), hi: +seg(hi, t, t + .5).toFixed(1), on: +seg(on, t, t + .5).toFixed(2) });
const hits = []; for (let i = 2; i < nF - 2; i++) if (on[i] > on[i - 1] && on[i] >= on[i + 1]) hits.push([i / fps, on[i]]);
hits.sort((a, b) => b[1] - a[1]);
const out = { audio: rel, duration: +(x.length / SR).toFixed(3), bpm: +bpm.toFixed(2), topTempos: [...scores].sort((a, b) => b[1] - a[1]).filter((s, i, a) => a.findIndex(o => Math.abs(o[0] - s[0]) < 2) === i).slice(0, 6).map(a => +a[0].toFixed(1)),
  beatPhase: +bp[0].toFixed(3), downbeatOffset: down, firstDownbeat: +(bp[0] + down * period).toFixed(3), env, topHits: hits.slice(0, 80).map(h => +h[0].toFixed(3)).sort((a, b) => a - b) };
fs.writeFileSync(path.join(PDIR, 'analysis.json'), JSON.stringify(out));
// seed song.json: keep hand-tuned fields, refresh the measured ones
Object.assign(song, { audio: rel, bpm: song.bpmLocked ? song.bpm : out.bpm, phase: song.bpmLocked ? song.phase : out.firstDownbeat, meter: song.meter || 4, fullDuration: out.duration });
if (!song.dur) song.dur = Math.min(90, out.duration);
fs.writeFileSync(sp, JSON.stringify(song, null, 1));
console.log(`duration ${out.duration}s  bpm ${out.bpm} (alternatives ${out.topTempos.join(', ')})  first downbeat ${out.firstDownbeat}s`);
const fit = []; for (let a = 0; a < out.duration - 20; a += 20) { const [, ph] = gridScore(bpm, a, a + 20); const d = ((ph - bp[0]) % period + period) % period; fit.push(`${a}s:${(d > period / 2 ? d - period : d).toFixed(3)}`); }
console.log('grid phase drift per 20 s window (s):', fit.join('  '));
const mx = Math.max(...env.map(e => e.rms)), mv = Math.max(...env.map(e => e.voc));
for (let i = 0; i < env.length; i += 2) { const e = env[i]; console.log(e.t.toFixed(1).padStart(6), '#'.repeat(Math.round(36 * e.rms / mx)).padEnd(36), 'v' + '·'.repeat(Math.round(12 * e.voc / mv))); }
