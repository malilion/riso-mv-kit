#!/bin/zsh
# tools/make_brand.sh: re-print the repo icon and social preview from projects/_brand (needs tools/server.mjs)
#   -> assets/icon.png (512 x 512, round corners) and assets/social-preview.png (1280 x 640)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"; cd "$ROOT"; mkdir -p assets qa/_brand
for s in icon banner; do
  node tools/render.mjs --project=_brand --port=${PORT:-8766} --query=scene=sc_$s --outdir=qa/_brand --stills=1 > /dev/null
  mv qa/_brand/still_1.00.png qa/_brand/$s.png
done
R=80   # corner radius at 512 px
ffmpeg -v error -y -i qa/_brand/icon.png -vf "crop=1080:1080:420:0,scale=512:512:flags=lanczos,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='clip(($R+.5-hypot(max($R-X,max(X-(W-1-$R),0)),max($R-Y,max(Y-(H-1-$R),0))))*255,0,255)'" assets/icon.png
ffmpeg -v error -y -i qa/_brand/banner.png -vf "crop=1920:960:0:60,scale=1280:640:flags=lanczos" assets/social-preview.png
ls -la assets
