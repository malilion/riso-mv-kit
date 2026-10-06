// lyrics.js: turn whatever the user pasted into lyrics.txt into [{ja, zh}] pairs.
// Handles one script per line, or "日本語 romaji 中文" glued on one line (the Bahamut translation layout).
const KANA = /[぀-ヿ]/, LATIN_RUN = /[A-Za-z][A-Za-z'’\-\s,.!?]{3,}/;
// header lines to drop: credits written as "label：value", and title lines of anime/drama songs
const CREDIT = /(作詞|作曲|編曲|歌唱|演唱|翻譯|翻訳|作词|编曲|Lyrics|Music|Vocals?)\s*[：:]/i;
const HEADER = /^【[^】]*】|\bOP\d*\b|\bED\d*\b|主題歌|主题歌|片頭曲|片尾曲|第.季|TV\s*size/i;
function splitScripts(raw) {
  const s = raw.replace(/\s+/g, ' ').trim();
  if (!s) return {};
  if (!/[^\x00-\x7F]/.test(s)) return { romaji: s };                    // pure ASCII: romaji line
  if (KANA.test(s)) {
    const m = LATIN_RUN.exec(s);
    if (!m || m.index === 0) return { ja: s.replace(LATIN_RUN, '').trim() };
    const ja = s.slice(0, m.index).trim(), rest = s.slice(m.index + m[0].length).trim();
    return { ja, romaji: m[0].trim(), zh: rest || undefined };
  }
  return { zh: s };
}
function parseLyrics(text) {
  const out = [], lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    if (CREDIT.test(raw) || HEADER.test(raw)) continue;
    // a bare song title above the lyrics is skipped — unless a translation follows it, then it is a quoted lyric line
    if (!out.length && /^[「『《][^」』》]{1,24}[」』》]$/.test(raw)) { const nx = lines[i + 1] || ''; if (!nx || KANA.test(nx) || CREDIT.test(nx) || HEADER.test(nx)) continue; }
    const p = splitScripts(raw);
    if (p.ja) out.push({ ja: p.ja, zh: p.zh || '' });
    else if (p.zh && out.length && !out[out.length - 1].zh) out[out.length - 1].zh = p.zh;
  }
  return out;
}
if (typeof module !== 'undefined') module.exports = { parseLyrics, splitScripts };
