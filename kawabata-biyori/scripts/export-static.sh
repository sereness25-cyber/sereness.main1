#!/usr/bin/env bash
# かわばた日和を GitHub Pages 用の静的ページに書き出す。
#   NEXT_PUBLIC_SITE_URL=https://.../kawabata scripts/export-static.sh <出力先フォルダ>
# 記事などのデータはリポジトリ直下の kawabata-data/*.json から読む（GitHub 版の管理ページで編集したもの）。
set -euo pipefail
APP="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$(mkdir -p "$1" && cd "$1" && pwd)"
PORT="${PORT:-3999}"
cd "$APP"

export KAWABATA_STATIC=1
rm -rf .next
npx next build
npx next start -p "$PORT" > /dev/null 2>&1 &
SERVER=$!
trap 'kill $SERVER 2>/dev/null || true' EXIT
for _ in $(seq 1 60); do curl -sf -o /dev/null "http://localhost:$PORT/" && break; sleep 1; done

TMP="$(mktemp -d)"
( cd "$TMP" && wget -q -r -l 4 -E -k -p -nH --no-proxy \
    --reject-regex '(/admin|_rsc=|\?|/api/|sitemap|robots)' "http://localhost:$PORT/" ) || true
curl -sf "http://localhost:$PORT/sitemap.xml" -o "$TMP/sitemap.xml" || true
cp public/ogp.png "$TMP/"
mkdir -p "$TMP/images/photos" && cp public/images/photos/* "$TMP/images/photos/"

python3 scripts/export_static.py "$TMP" "$PORT"
# GitHub Pages は「_」で始まるフォルダを配らないので名前を変える
mv "$TMP/_next" "$TMP/assets"
grep -rl "_next/" --include=*.html --include=*.css "$TMP" | xargs -r sed -i 's#_next/#assets/#g'

find "$OUT" -mindepth 1 -delete
cp -r "$TMP"/. "$OUT"/
rm -rf "$TMP"
echo "書き出し完了: $OUT"
