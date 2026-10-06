// tools/vocal.mjs PROJECT [from] [to]: rough lead-vocal presence over time (for finding where sung lines
// end, breaths, or which of two lines shown together starts where). The lead vocal sits in the centre of the
// mix, so per bin take max(0, |mid| - |side|) in 250-3500 Hz, smoothed. Prints a bar chart every 0.5 s and
// writes qa/PROJECT/vocal.json (pairs [t, presence] every 0.25 s).
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process';
const ROOT = path.resolve(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname)), '..');
const PROJECT = process.argv[2] || 'mebuki', PDIR = path.join(ROOT, 'projects', PROJECT);
const song = JSON.parse(fs.readFileSync(path.join(PDIR, 'song.json'), 'utf8'));
const [from = 0, to = 90] = process.argv.slice(3).map(Number), SR = 22050;
const raw = execFileSync(process.env.FFMPEG || 'ffmpeg', ['-v', 'error', '-ss', String(from), '-t', String(to - from), '-i', path.join(PDIR, song.audio || 'audio/song.mp3'), '-ac', '2', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
const x = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4), n = x.length / 2, N = 2048, HOP = 256;
function fft(re, im) { const m = re.length; for (let i = 1, j = 0; i < m; i++) { let b = m >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= m; len <<= 1) { const a = -2 * Math.PI / len; for (let i = 0; i < m; i += len) for (let k = 0; k < len / 2; k++) { const c = Math.cos(a * k), s = Math.sin(a * k), p = i + k, q = p + len / 2, vr = re[q] * c - im[q] * s, vi = re[q] * s + im[q] * c; re[q] = re[p] - vr; im[q] = im[p] - vi; re[p] += vr; im[p] += vi; } } }
const win = Float64Array.from({ length: N }, (_, i) => .5 - .5 * Math.cos(2 * Math.PI * i / N)), b0 = Math.round(250 * N / SR), b1 = Math.round(3500 * N / SR);
const V = [];
for (let s = 0; s + N < n; s += HOP) {
  const mr = new Float64Array(N), mi = new Float64Array(N), sr = new Float64Array(N), si = new Float64Array(N);
  for (let i = 0; i < N; i++) { const L = x[(s + i) * 2], R = x[(s + i) * 2 + 1]; mr[i] = (L + R) * .5 * win[i]; sr[i] = (L - R) * .5 * win[i]; }
  fft(mr, mi); fft(sr, si); let v = 0;
  for (let k = b0; k < b1; k++) v += Math.max(0, Math.hypot(mr[k], mi[k]) - 1.1 * Math.hypot(sr[k], si[k]));
  V.push(v);
}
const fps = SR / HOP, sm = V.map((_, i) => { let a = 0, c = 0; for (let j = i - 4; j <= i + 4; j++) if (V[j] !== undefined) { a += V[j]; c++; } return a / c; });
const sorted = [...sm].sort((a, b) => a - b), p95 = sorted[Math.floor(sorted.length * .95)];
const out = []; for (let t = 0; t < (to - from); t += .25) { const i = Math.round(t * fps); out.push([+(from + t).toFixed(2), +(Math.min(1.5, (sm[i] || 0) / p95)).toFixed(3)]); }
fs.mkdirSync(path.join(ROOT, 'qa', PROJECT), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'qa', PROJECT, 'vocal.json'), JSON.stringify(out));
for (const [t, v] of out) if (Math.round(t * 4) % 2 === 0) console.log(t.toFixed(1).padStart(5), '#'.repeat(Math.round(v * 40)));
