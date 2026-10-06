// tools/make_lyrics.mjs PROJECT: lyrics.txt (your text, never committed) + timing.json (numbers only)
// -> lyrics.json, which the studio reads. Lines are paired by order.
// tools/make_lyrics.mjs PROJECT --extract: lyrics.json (from timing.html) -> timing.json (numbers only)
import fs from 'fs'; import path from 'path'; import vm from 'vm';
const ROOT = path.resolve(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname)), '..');
const PDIR = path.join(ROOT, 'projects', process.argv[2] || 'mebuki');
// --extract: the other direction — keep only the numbers from lyrics.json (saved by timing.html) in timing.json
if (process.argv.includes('--extract')) {
  const L = JSON.parse(fs.readFileSync(path.join(PDIR, 'lyrics.json'), 'utf8')).lines;
  const lines = L.map(l => ({ t0: +(+l.t0).toFixed(3), t1: +(+l.t1).toFixed(3), ...(l.parts ? { parts: l.parts } : {}) }));
  fs.writeFileSync(path.join(PDIR, 'timing.json'), JSON.stringify({ source: 'timing.html (tap tool)', lines }, null, 1));
  console.log(`timing.json: ${lines.filter(l => l.t0 >= 0).length}/${lines.length} lines timed`); process.exit(0);
}
const ctx = {}; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(ROOT, 'engine/lyrics.js'), 'utf8') + ';this.parseLyrics=parseLyrics;', ctx);
const text = ctx.parseLyrics(fs.readFileSync(path.join(PDIR, 'lyrics.txt'), 'utf8'));
const timing = JSON.parse(fs.readFileSync(path.join(PDIR, 'timing.json'), 'utf8')).lines;
const lines = text.map((l, i) => ({ ...(timing[i] || { t0: -1, t1: -1 }), ja: l.ja, zh: l.zh, ...(timing[i] ? { sing: 1 } : {}) }));
fs.writeFileSync(path.join(PDIR, 'lyrics.json'), JSON.stringify({ savedAt: new Date().toISOString(), from: 'tools/make_lyrics.mjs', lines }, null, 1));
console.log(`lyrics.json: ${lines.length} lines, ${lines.filter(l => l.t0 >= 0).length} timed`);
