#!/usr/bin/env bash
# Static checks for Firebase env mapping layout (no real secrets required).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

fail=0

require() {
  if [[ ! -e "$1" ]]; then
    echo "MISSING $1"
    fail=1
  fi
}

require config/firebase/README.md
require config/firebase/development/google-services.json.example
require config/firebase/development/GoogleService-Info.plist.example
require config/firebase/production/google-services.json.example
require config/firebase/production/GoogleService-Info.plist.example
require scripts/select-firebase-config.sh

for example in \
  config/firebase/development/google-services.json.example \
  config/firebase/production/google-services.json.example
do
  if ! rg -q 'com\.tanlabs\.enforse' "$example"; then
    echo "Example missing Android package: $example"
    fail=1
  fi
done

for example in \
  config/firebase/development/GoogleService-Info.plist.example \
  config/firebase/production/GoogleService-Info.plist.example
do
  if ! rg -q 'com\.tanlabs\.en-for-se' "$example"; then
    echo "Example missing iOS bundle: $example"
    fail=1
  fi
done

if ! rg -q "export type AppEnv = 'development' \| 'production'" src/app/config/env.ts; then
  echo "src/app/config/env.ts must only allow development | production"
  fail=1
fi

if rg -q "export type AppEnv = .*staging" src/app/config/env.ts; then
  echo "src/app/config/env.ts still lists staging in AppEnv"
  fail=1
fi

if [[ "$fail" -ne 0 ]]; then
  echo "verify:firebase-config FAILED"
  exit 1
fi

echo "verify:firebase-config PASSED"
