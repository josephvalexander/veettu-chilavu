#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  dev-build.sh — Local development helper
#
#  Builds a local copy of index.html with your real Client ID
#  injected, so you can test OAuth locally without committing
#  the ID to git.
#
#  USAGE:
#    1. Edit config.local.js and paste your real Client ID
#    2. Run:  bash dev-build.sh
#    3. Open dist-local/index.html with a local server:
#           npx serve dist-local
#       or: python3 -m http.server 8080 --directory dist-local
#    4. Make sure http://localhost:8080 is in your Google Cloud
#       Authorized JS Origins
# ─────────────────────────────────────────────────────────────

set -e

# Extract Client ID from config.local.js
CLIENT_ID=$(grep "LOCAL_CLIENT_ID" config.local.js | sed "s/.*= '//;s/';.*//")

if [ -z "$CLIENT_ID" ] || [[ "$CLIENT_ID" == *"PASTE_YOUR"* ]]; then
  echo "❌  Please edit config.local.js and paste your real Client ID first."
  exit 1
fi

echo "✅  Client ID found: ${CLIENT_ID:0:20}..."

# Build to dist-local/
rm -rf dist-local && mkdir -p dist-local
cp index.html dist-local/
cp sw.js dist-local/
cp manifest.json dist-local/
[ -d icons ] && cp -r icons dist-local/

# Inject Client ID
sed -i.bak "s|__GOOGLE_CLIENT_ID__|${CLIENT_ID}|g" dist-local/index.html && rm dist-local/index.html.bak

# Inject dummy version for local SW
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%MZ")
sed -i.bak "s|__SW_VERSION__|local-dev|g"       dist-local/sw.js && rm dist-local/sw.js.bak
sed -i.bak "s|__BUILD_TIME__|${BUILD_TIME}|g"   dist-local/sw.js && rm dist-local/sw.js.bak

# Write version.json
echo "{\"version\":\"local-dev\",\"buildTime\":\"${BUILD_TIME}\"}" > dist-local/version.json

echo ""
echo "🎉  Local build ready in dist-local/"
echo ""
echo "    Start a local server with one of:"
echo "      npx serve dist-local"
echo "      python3 -m http.server 8080 --directory dist-local"
echo ""
echo "    Then open http://localhost:8080"
