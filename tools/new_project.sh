#!/bin/zsh
# tools/new_project.sh NAME: start a new MV from projects/_template
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"
N=${1:?usage: tools/new_project.sh NAME   (letters, digits, - or _)}
[[ "$N" =~ '^[A-Za-z0-9_-]+$' ]] || { echo "name: letters, digits, - or _ only"; exit 1; }
[ -e projects/$N ] && { echo "projects/$N already exists"; exit 1; }
cp -R projects/_template projects/$N
cat <<EOF
projects/$N is ready. Next:
  1. put the song at        projects/$N/audio/song.mp3
  2. paste the lyrics into  projects/$N/lyrics.txt   (see lyrics.example.txt)
  3. node tools/server.mjs             (keep it running)
  4. node tools/analyze.mjs $N         (bpm + first downbeat -> song.json)
  5. time the lyrics:  http://localhost:8766/timing.html?project=$N
  6. preview:          http://localhost:8766/studio.html?project=$N&play
  7. write the story:  projects/$N/story.js + scenes.js   (docs/WORKFLOW.md)
  8. ./tools/render_chunks.sh $N
EOF
