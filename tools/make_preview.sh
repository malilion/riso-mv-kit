#!/bin/zsh
# tools/make_preview.sh PROJECT "a:b a:b ..."  — a silent, lyric-free highlight reel for the README.
# Renders only the listed time ranges with &nolyrics, joins them in order and writes
#   assets/previews/PROJECT.mp4   (960x540, no audio)   assets/previews/PROJECT.webp   (480x270 animated, plays inline)
# The halftone grain compresses badly, so both stay small on purpose (~6 MB for 35 s each).
# The song and its lyrics never end up in these files, so they are safe to commit.
# Needs: node tools/server.mjs running (PORT=8767 to use another port), ffmpeg, img2webp (brew install webp).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
P=${1:?usage: tools/make_preview.sh PROJECT "a:b a:b ..."}; RANGES=(${=2:?give the time ranges, e.g. "1:4.5 20:24"})
FR=out/preview-$P; TMP=out/preview-$P-tmp; mkdir -p $FR $TMP assets/previews
: > $TMP/list.txt; k=0
for r in $RANGES; do
  a=${r%%:*}; z=${r##*:}
  f0=$(printf '%.0f' $(echo "$a * 30" | bc -l)); n=$(( $(printf '%.0f' $(echo "$z * 30" | bc -l)) - f0 ))
  # headless Chrome occasionally dies mid-run; render.mjs skips finished frames, so just try again
  for try in 1 2 3 4; do
    node tools/render.mjs --project=$P --range=$a:$z --workers=4 --out=$FR --query=nolyrics ${PORT:+--port=$PORT} 2>&1 | tail -1 || true
    ok=1; for ((i = f0; i < f0 + n; i++)); do [ -s $FR/$(printf '%05d' $i).jpg ] || { ok=0; break; }; done
    [ $ok = 1 ] && break; echo "frames missing in $r, retry $try"
  done
  [ $ok = 1 ] || { echo "could not render $r"; exit 1; }
  ffmpeg -v error -y -framerate 30 -start_number $f0 -i $FR/%05d.jpg -frames:v $n -vf scale=960:540 -c:v libx264 -preset slow -crf 30 -pix_fmt yuv420p $TMP/$(printf '%02d' $k).mp4
  echo "file '$ROOT/$TMP/$(printf '%02d' $k).mp4'" >> $TMP/list.txt; k=$((k + 1))
done
ffmpeg -v error -y -f concat -safe 0 -i $TMP/list.txt -c copy -an -movflags +faststart assets/previews/$P.mp4
# animated webp: 12 fps is the drawings' own rate (they are on twos), so nothing is lost
rm -rf $TMP/w && mkdir -p $TMP/w && ffmpeg -v error -y -i assets/previews/$P.mp4 -vf fps=12,scale=480:270:flags=lanczos $TMP/w/%04d.png
img2webp -loop 0 -lossy -q ${WEBP_Q:-50} -m 4 -d 83 $TMP/w/*.png -o assets/previews/$P.webp >/dev/null
rm -rf $FR $TMP
ls -la assets/previews/$P.mp4 assets/previews/$P.webp
