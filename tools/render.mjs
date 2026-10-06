// tools/render.mjs --project=NAME  (needs tools/server.mjs running)
//   --stills=1.2,3.4 [--outdir=qa/NAME]          -> still_<t>.png
//   --range=a:b --workers=4 [--out=out/NAME]     -> 30 fps jpg frames, resumable (existing frames are skipped)
//   --query=scene=sc_rays                        extra studio.html parameters (comma separated)
//   --port=8766  --chrome=/path/to/chrome
import puppeteer from 'puppeteer-core'; import fs from 'fs';
const arg = k => { const a = process.argv.find(a => a.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
const PROJECT = arg('project') || 'mebuki';
const CHROME = process.env.CHROME_BIN || arg('chrome') || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const URL0 = `http://localhost:${arg('port') || 8766}/studio.html?project=${PROJECT}${arg('query') ? '&' + arg('query').replace(/,/g, '&') : ''}`;
const launch = () => puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'], defaultViewport: { width: 960, height: 540 } });
// window.ready waits for fonts/data itself; a page that fails to get ready (network hiccup) is retried
async function page(b, tries = 4) {
  for (let i = 1; ; i++) {
    const p = await b.newPage(); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) console.log('PAGE', m.text()); }); p.on('pageerror', e => console.log('PAGEERR', e.message));
    try { await p.goto(URL0, { waitUntil: 'load', timeout: 120000 }); await p.evaluate(() => window.ready); return p; }
    catch (e) { console.log(`page not ready (${e.message}); retry ${i}/${tries}`); await p.close(); if (i >= tries) throw e; await new Promise(r => setTimeout(r, 3000 * i)); }
  }
}
const save = (f, d) => fs.writeFileSync(f, Buffer.from(d.split(',')[1], 'base64'));
if (arg('stills')) {
  const dir = arg('outdir') || `qa/${PROJECT}`, b = await launch(); const p = await page(b); fs.mkdirSync(dir, { recursive: true });
  for (const t of arg('stills').split(',').map(Number)) { const t0 = Date.now(); save(`${dir}/still_${t.toFixed(2)}.png`, await p.evaluate(t => window.renderFrame(t, 'image/png'), t)); console.log('still', t, Date.now() - t0, 'ms'); }
  await b.close();
} else if (arg('range')) {
  const [a, z] = arg('range').split(':').map(Number); const FPS = 30, N = +(arg('workers') || 4), out = arg('out') || `out/${PROJECT}`;
  fs.mkdirSync(out, { recursive: true });
  const todo = []; for (let f = Math.round(a * FPS); f < Math.round(z * FPS); f++) if (!fs.existsSync(`${out}/${String(f).padStart(5, '0')}.jpg`)) todo.push(f);
  console.log('frames to render', todo.length); const t0 = Date.now(); let done = 0;
  const b = await launch();
  await Promise.all(Array.from({ length: N }, async (_, w) => { const p = await page(b);
    for (let i = w; i < todo.length; i += N) { const f = todo[i]; save(`${out}/${String(f).padStart(5, '0')}.jpg`, await p.evaluate(t => window.renderFrame(t, 'image/jpeg'), f / FPS));
      if (++done % 100 === 0) console.log(done, '/', todo.length, ((Date.now() - t0) / done).toFixed(0), 'ms/frame'); } }));
  await b.close(); console.log('done in', ((Date.now() - t0) / 1000).toFixed(0), 's');
} else console.log('usage: node tools/render.mjs --project=NAME --stills=1,2,3 | --range=0:30 [--workers=4]');
