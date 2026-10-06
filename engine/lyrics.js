// lyrics.js: turn whatever the user pasted into lyrics.txt into [{ja, zh}] pairs.
// Handles one script per line, or "日本語 romaji 中文" glued on one line (the Bahamut translation layout).
const KANA = /[぀-ヿ]/, LATIN_RUN = /[A-Za-z][A-Za-z'’\-\s,.!?]{3,}/;
const SKIP = /作詞|作曲|編曲|歌唱|演唱|翻譯|翻好玩|歌詞|TV\s*size|^OP|^ED/i;
const TITLE = /無職|第.季|\bOP\d?\b|「芽吹の唄」|『芽吹の唄』/;   // title / credit lines in the pasted header
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
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const raw = line.trim(); if (!raw || raw.startsWith('#')) continue;
    if (SKIP.test(raw) && raw.length < 80 && !KANA.test(raw.replace(/大原ゆい子|芽吹の唄/g, ''))) continue;
    if (/[：:]/.test(raw) && /作詞|作曲|編曲|歌唱/.test(raw)) continue;
    if (TITLE.test(raw)) continue;
    const p = splitScripts(raw);
    if (p.ja) out.push({ ja: p.ja, zh: p.zh || '' });
    else if (p.zh && out.length && !out[out.length - 1].zh) out[out.length - 1].zh = p.zh;
  }
  return out;
}
if (typeof module !== 'undefined') module.exports = { parseLyrics, splitScripts };
