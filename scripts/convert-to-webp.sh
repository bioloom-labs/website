#!/usr/bin/env bash
# Convert raster images under public/images to WebP at full resolution.
#  - photos        -> lossy WebP q85 (visually lossless, large savings)
#  - logos/socials -> lossless WebP  (crisp edges / text / transparency)
# Originals are MOVED to a backup dir OUTSIDE the repo (never committed).
set -euo pipefail

ROOT="/Users/qp252319/Desktop/Learning/Websites_Stuff/bioloom-labs"
IMG="$ROOT/public/images"
BACKUP="/Users/qp252319/Desktop/Learning/Websites_Stuff/bioloom-labs-image-originals-backup"

command -v cwebp >/dev/null || { echo "cwebp not found"; exit 1; }
mkdir -p "$BACKUP"

total_before=0
total_after=0
count=0

while IFS= read -r -d '' f; do
  rel="${f#"$IMG"/}"
  out="${f%.*}.webp"

  case "$rel" in
    logos/*|socials/*) mode=lossless ;;
    *)                 mode=lossy ;;
  esac

  if [ "$mode" = lossless ]; then
    cwebp -quiet -lossless -z 9 -metadata none "$f" -o "$out"
  else
    cwebp -quiet -q 85 -m 6 -sharp_yuv -mt -metadata none "$f" -o "$out"
  fi

  if [ ! -s "$out" ]; then echo "FAILED to encode: $f"; exit 1; fi

  mkdir -p "$BACKUP/$(dirname "$rel")"
  mv "$f" "$BACKUP/$rel"

  b=$(stat -f%z "$BACKUP/$rel")
  a=$(stat -f%z "$out")
  total_before=$((total_before + b))
  total_after=$((total_after + a))
  count=$((count + 1))

  awk -v b="$b" -v a="$a" -v r="$rel" -v m="$mode" \
    'BEGIN{printf "%9.2f MB -> %8.2f MB  (%-8s) %s\n", b/1048576, a/1048576, m, r}'
done < <(find "$IMG" -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) -print0)

echo "--------------------------------------------------------------"
awk -v b="$total_before" -v a="$total_after" -v c="$count" \
  'BEGIN{printf "%d files: %.1f MB -> %.1f MB  (saved %.1f MB, %.0f%%)\n", c, b/1048576, a/1048576, (b-a)/1048576, (1-a/b)*100}'
echo "Originals backed up to: $BACKUP"
