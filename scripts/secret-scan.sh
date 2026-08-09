#!/usr/bin/env bash
# Fail if forbidden secrets appear in mobile app / native source trees.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PATTERN='SUPABASE_SERVICE_ROLE_KEY|BEGIN PRIVATE KEY|-----BEGIN RSA PRIVATE KEY-----|firebase_private_key'
SCAN_PATHS=(App.tsx index.js src android/app ios/TanLabsEnglishForSE)

scan_with_rg() {
  rg -n -i -e "$PATTERN" \
    --glob '!**/node_modules/**' \
    --glob '!**/Pods/**' \
    --glob '!**/build/**' \
    --glob '!**/.gradle/**' \
    "${SCAN_PATHS[@]}"
}

scan_with_grep() {
  # Fallback when ripgrep is unavailable (some CI images).
  grep -R -n -I -E -i "$PATTERN" "${SCAN_PATHS[@]}" \
    --exclude-dir=node_modules \
    --exclude-dir=Pods \
    --exclude-dir=build \
    --exclude-dir=.gradle \
    || true
}

HITS=""
if command -v rg >/dev/null 2>&1; then
  HITS="$(scan_with_rg 2>/dev/null || true)"
elif command -v grep >/dev/null 2>&1; then
  echo "secret-scan: ripgrep not found; using grep fallback" >&2
  HITS="$(scan_with_grep)"
else
  echo "Secret scan FAILED — neither rg nor grep is available." >&2
  exit 1
fi

if [[ -n "${HITS}" ]]; then
  echo "Secret scan FAILED — forbidden credential patterns found:" >&2
  echo "${HITS}" >&2
  exit 1
fi

echo "Secret scan PASSED (no forbidden credential patterns in app source)."
