#!/usr/bin/env bash
# Make small copies of the portraits in public/images/people for the /people
# cards, the PI hero and News avatars. The originals stay where they are, and
# a person's own bio window keeps showing them at full quality.
# Run this after adding or replacing a portrait, and commit the thumbs folder.
# Until then the page falls back to the original, so nothing breaks.
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)/public/images/people"
WIDTH=800

command -v cwebp >/dev/null || { echo "cwebp not found"; exit 1; }
mkdir -p "$DIR/thumbs"

for f in "$DIR"/*.webp; do
  out="$DIR/thumbs/$(basename "$f")"
  [ "$out" -nt "$f" ] && continue
  w=$(sips -g pixelWidth "$f" | awk '/pixelWidth/{print $2}')
  if [ "$w" -le "$WIDTH" ]; then
    cp "$f" "$out" # already small: resizing would only enlarge it
  else
    cwebp -quiet -q 82 -m 6 -sharp_yuv -mt -metadata none -resize "$WIDTH" 0 "$f" -o "$out"
  fi
done
