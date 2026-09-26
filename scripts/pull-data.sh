#!/usr/bin/env bash
# Download a release of Beyond-The-Jersey/data into .data-release/, for `npm run data:live` or
#   BTJ_DATA_SOURCE=release npm run build
# The latest release by default; BTJ_DATA_RELEASE=<tag> for another one. The repo is public.
set -euo pipefail
REPO="${BTJ_DATA_REPO:-Beyond-The-Jersey/data}"
TAG="${BTJ_DATA_RELEASE:-latest}"
DIR="${BTJ_DATA_DIR:-.data-release}"
API="https://api.github.com/repos/${REPO}/releases"
AUTH=()
if [ -n "${GH_TOKEN:-}" ]; then AUTH=(-H "Authorization: Bearer ${GH_TOKEN}"); fi

if [ "$TAG" = latest ]; then
  if ! LATEST=$(curl -fsSL ${AUTH[@]+"${AUTH[@]}"} "${API}/latest"); then
    echo "Couldn't find a release of ${REPO} (https://github.com/${REPO}/releases)." >&2
    exit 1
  fi
  TAG=$(node -p 'JSON.parse(process.argv[1]).tag_name' "$LATEST")
fi

rm -rf "$DIR"
mkdir -p "$DIR"
curl -fsSL ${AUTH[@]+"${AUTH[@]}"} -o "$DIR/data.zip" "https://github.com/${REPO}/releases/download/${TAG}/behind-the-jersey-data.zip"
unzip -q -o "$DIR/data.zip" -d "$DIR"
rm "$DIR/data.zip"
echo "$TAG" > "$DIR/RELEASE"
echo "Release ${TAG} of ${REPO} in ${DIR}/."
