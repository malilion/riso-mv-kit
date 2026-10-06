// tools/server.mjs [--port=8766]: local studio server (localhost only), serving the kit root.
// Byte ranges let audio seek; POST /api/save?project=NAME&file=lyrics.json is used by timing.html.
//   node tools/server.mjs   ->  http://localhost:8766/studio.html?project=NAME   /timing.html?project=NAME
import http from 'http'; import fs from 'fs'; import path from 'path';
const arg = k => { const a = process.argv.find(a => a.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : undefined; };
const PORT = +(arg('port') || process.env.PORT || 8766);
const root = path.resolve(path.dirname(decodeURIComponent(new URL(import.meta.url).pathname)), '..');
const T = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css',
  '.txt': 'text/plain; charset=utf-8', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.flac': 'audio/flac', '.ogg': 'audio/ogg' };
const SAVABLE = new Set(['lyrics.json', 'song.json']);
http.createServer((q, r) => {
  const url = new URL(q.url, 'http://localhost');
  if (q.method === 'POST' && url.pathname === '/api/save') {
    const name = url.searchParams.get('file'), project = url.searchParams.get('project') || '';
    if (!SAVABLE.has(name) || !/^[\w-]+$/.test(project) || !fs.existsSync(path.join(root, 'projects', project))) { r.writeHead(400); return r.end('not savable'); }
    let body = ''; q.on('data', d => { body += d; if (body.length > 4e6) q.destroy(); });
    q.on('end', () => { try { JSON.parse(body); fs.writeFileSync(path.join(root, 'projects', project, name), body); r.writeHead(200); r.end('ok'); } catch (e) { r.writeHead(400); r.end('bad json'); } });
    return;
  }
  let p = path.join(root, decodeURIComponent(url.pathname)); if (p.endsWith(path.sep)) p += 'studio.html';
  if (!p.startsWith(root)) { r.writeHead(403); return r.end(); }
  fs.stat(p, (e, st) => {
    if (e || !st.isFile()) { r.writeHead(404); return r.end(); }
    const type = T[path.extname(p).toLowerCase()] || 'application/octet-stream', range = /bytes=(\d*)-(\d*)/.exec(q.headers.range || '');
    if (range) {
      const a = range[1] ? +range[1] : 0, b = range[2] ? +range[2] : st.size - 1;
      r.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1, 'Cache-Control': 'no-store' });
      return fs.createReadStream(p, { start: a, end: b }).pipe(r);
    }
    r.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' });
    fs.createReadStream(p).pipe(r);
  });
}).listen(PORT, '127.0.0.1', () => console.log(`riso-mv-kit studio on http://localhost:${PORT}/studio.html?project=NAME`));
