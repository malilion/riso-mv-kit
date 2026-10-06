#!/bin/zsh
# tools/render_chunks.sh PROJECT [chunk_seconds=100]
# Renders the whole song in chunks so the jpg frames never fill the disk (each frame is ~1.3 MB, a 5-minute
# song is ~13 GB of frames): render a chunk -> encode it (same x264 settings) -> delete its frames -> next.
# Then the chunks are joined without re-encoding, the song is added with a fade-out, and a smaller copy is made:
#   video/PROJECT.mp4 (master)   video/PROJECT_share.mp4 (~6 Mbps, easier to send)
# Resumable: finished chunks are kept and skipped. Needs: node tools/server.mjs running.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
P=${1:?usage: tools/render_chunks.sh PROJECT [chunk_seconds]}; CS=${2:-100}
FR=out/$P; CH=out/$P-chunks; mkdir -p $FR $CH video
VOPT=(-c:v libx264 -preset slow -crf 18 -maxrate 20M -bufsize 40M -profile:v high -pix_fmt yuv420p -video_track_timescale 15360)
cfg() { node -e "const s=require('./projects/$P/song.json');console.log(s['$1']??'$2')"; }
DUR=$(cfg dur 60); FADE=$(cfg fadeOut 2); AUDIO="projects/$P/$(cfg audio audio/song.mp3)"
TOTAL=$(printf '%.0f' $(echo "$DUR * 30" | bc -l)); STEP=$((CS * 30))
: > $CH/list.txt
for ((a = 0, k = 0; a < TOTAL; a += STEP, k++)); do
  z=$((a + STEP < TOTAL ? a + STEP : TOTAL)); name=$(printf '%03d' $k)
  echo "file '$ROOT/$CH/$name.mp4'" >> $CH/list.txt
  if [ -f $CH/$name.mp4 ]; then echo "chunk $name already encoded"; continue; fi
  echo "== chunk $name: frames $a..$((z - 1))"
  node tools/render.mjs --project=$P --range=$(echo "$a / 30" | bc -l):$(echo "$z / 30" | bc -l) --workers=4 --out=$FR 2>&1 | tail -2
  for ((i = a; i < z; i++)); do [ -s $FR/$(printf '%05d' $i).jpg ] || { echo "missing frame $i"; exit 1; }; done
  ffmpeg -v error -y -framerate 30 -start_number $a -i $FR/%05d.jpg -frames:v $((z - a)) "${VOPT[@]}" $CH/$name.mp4.tmp.mp4 && mv $CH/$name.mp4.tmp.mp4 $CH/$name.mp4
  for ((i = a; i < z; i++)); do rm -f $FR/$(printf '%05d' $i).jpg; done
done
AOPT=(); [ -f "$AUDIO" ] && AOPT=(-i "$AUDIO" -map 0:v -map 1:a -af "afade=t=out:st=$(echo "$DUR - $FADE" | bc -l):d=$FADE" -c:a aac -b:a 256k -ar 48000)
ffmpeg -v error -y -f concat -safe 0 -i $CH/list.txt "${AOPT[@]}" -c:v copy -t $DUR -movflags +faststart video/$P.mp4
echo "master: $(ffprobe -v error -show_entries format=duration,size -of compact video/$P.mp4)"
ffmpeg -v error -y -i video/$P.mp4 -c:v libx264 -preset slow -crf 24 -maxrate 6M -bufsize 12M -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 192k video/${P}_share.mp4
echo "share: $(ffprobe -v error -show_entries format=duration,size -of compact video/${P}_share.mp4)"
echo "(the chunks in $CH can be deleted now)"
