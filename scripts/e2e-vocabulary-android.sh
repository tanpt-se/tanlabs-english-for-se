#!/usr/bin/env bash
# Run Maestro PH3 vocabulary smoke on Android emulator/device.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
export PATH="${PATH}:${HOME}/.maestro/bin"

if ! command -v maestro >/dev/null 2>&1; then
  echo "maestro not found. Install: curl -fsSL https://get.maestro.mobile.dev | bash" >&2
  exit 1
fi

ENV_FILE="${ROOT}/.env.maestro"
if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
elif [[ -f "${ROOT}/.env.maestro.example" && -z "${SMOKE_EMAIL:-}" ]]; then
  echo "Copy .env.maestro.example → .env.maestro (or pass -e SMOKE_EMAIL / SMOKE_PASSWORD)." >&2
  exit 1
fi

: "${SMOKE_EMAIL:?Set SMOKE_EMAIL}"
: "${SMOKE_PASSWORD:?Set SMOKE_PASSWORD}"

maestro test \
  -e "SMOKE_EMAIL=${SMOKE_EMAIL}" \
  -e "SMOKE_PASSWORD=${SMOKE_PASSWORD}" \
  "${ROOT}/maestro/android/smoke-vocabulary.yaml"
