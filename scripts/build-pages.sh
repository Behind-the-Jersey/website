#!/usr/bin/env bash
# Builds what GitHub Pages serves:
#   /       the live site, from $BTJ_DATA_SOURCE (default live: data/live, see npm run data:live)
#   /demo/  a copy that always uses the seed data from the design handover, for demos
set -euo pipefail
rm -rf out out-demo

BTJ_DATA_SOURCE=seed NEXT_PUBLIC_BASE_PATH=/demo NEXT_PUBLIC_DEMO=true npm run build
mv out out-demo

BTJ_DATA_SOURCE="${BTJ_DATA_SOURCE:-live}" npm run build
mv out-demo out/demo
# The team-only film (public/film/) is served once, at /film/, not again under /demo/.
rm -rf out/demo/film
echo "Built out/ (live, data: ${BTJ_DATA_SOURCE:-live}) and out/demo/ (seed)."
