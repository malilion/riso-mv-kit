#!/bin/zsh
# tools/encode.sh PROJECT [frames_dir=out/PROJECT] [out=video/PROJECT.mp4]
# 30 fps jpg frames + the song (trimmed to song.json "dur", faded out over "fadeOut") -> H.264/AAC.
# Without an audio file it encodes a silent animatic.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
P=${1:?usage: tools/encode.sh PROJECT [frames_dir] [out.mp4]}; FRAMES=${2:-out/$P}; OUT=${3:-video/$P.mp4}; mkdir -p "$(dirname "$OUT")"
cfg() { node -e "const s=require('./projects/$P/song.json');console.log(s['$1']??'$2')"; }
AUDIO="projects/$P/$(cfg audio audio/song.mp3)"; DUR=$(cfg dur 60); FADE=$(cfg fadeOut 2)
NFR=$(ls "$FRAMES" | grep -c '\.jpg$'); FDUR=$(echo "$NFR / 30" | bc -l)
if (( $(echo "$FDUR < $DUR" | bc -l) )); then DUR=$FDUR; fi
VOPT=(-c:v libx264 -preset slow -crf 18 -maxrate 20M -bufsize 40M -profile:v high -pix_fmt yuv420p -movflags +faststart)
if [ -f "$AUDIO" ]; then
  ffmpeg -v error -y -framerate 30 -i "$FRAMES/%05d.jpg" -i "$AUDIO" -map 0:v -map 1:a "${VOPT[@]}" -af "afade=t=out:st=$(echo "$DUR - $FADE" | bc -l):d=$FADE" -c:a aac -b:a 256k -ar 48000 -t "$DUR" "$OUT"
else
  echo "(no audio at $AUDIO: silent animatic)"
  ffmpeg -v error -y -framerate 30 -i "$FRAMES/%05d.jpg" "${VOPT[@]}" -t "$DUR" "$OUT"
fi
ffprobe -v error -show_entries format=duration,size -of compact "$OUT"
