#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION="$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")"
OUT_DIR="$ROOT/dist"
ZIP_PATH="$OUT_DIR/skipper-v${VERSION}.zip"

mkdir -p "$OUT_DIR"
rm -f "$ZIP_PATH"

zip -r "$ZIP_PATH" . \
  -x "*.git*" \
  -x "*dist/*" \
  -x "*scripts/*" \
  -x "*docs/*" \
  -x "*.zip" \
  -x ".DS_Store" \
  -x ".cursor/*" \
  -x "README.md"

echo "Created $ZIP_PATH"
echo "Upload this file to the Chrome Web Store Developer Dashboard."
