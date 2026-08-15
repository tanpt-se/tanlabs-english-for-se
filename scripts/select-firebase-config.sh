#!/usr/bin/env bash
# Copy environment-specific Firebase client config into the native project paths.
# Usage:
#   bash scripts/select-firebase-config.sh
#   bash scripts/select-firebase-config.sh development
#   bash scripts/select-firebase-config.sh production
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

NODE_BINARY="${NODE_BINARY:-}"
if [[ -f "$ROOT_DIR/ios/.xcode.env" ]]; then
  source "$ROOT_DIR/ios/.xcode.env"
fi
if [[ -f "$ROOT_DIR/ios/.xcode.env.local" ]]; then
  source "$ROOT_DIR/ios/.xcode.env.local"
fi
if [[ -z "$NODE_BINARY" || ! -x "$NODE_BINARY" ]]; then
  NODE_BINARY="$(command -v node || true)"
fi
if [[ -z "$NODE_BINARY" || ! -x "$NODE_BINARY" ]]; then
  echo "Node executable not found. Configure NODE_BINARY in ios/.xcode.env.local."
  exit 1
fi

read_app_env_from_file() {
  local env_file="$1"
  if [[ ! -f "$env_file" ]]; then
    return 1
  fi
  local value
  value="$(rg -N '^APP_ENV=' "$env_file" | head -1 | sed 's/^APP_ENV=//' | tr -d '\r' | tr -d '"' | tr -d "'")"
  if [[ "$value" == "development" || "$value" == "production" ]]; then
    echo "$value"
    return 0
  fi
  return 1
}

resolve_env() {
  if [[ "${1:-}" == "development" || "${1:-}" == "production" ]]; then
    echo "$1"
    return
  fi
  if [[ "${APP_ENV:-}" == "development" || "${APP_ENV:-}" == "production" ]]; then
    echo "$APP_ENV"
    return
  fi

  local env_file=".env"
  if [[ -n "${ENVFILE:-}" ]]; then
    env_file="$ENVFILE"
  elif [[ "${CONFIGURATION:-}" == "Release" ]]; then
    env_file=".env.production"
  fi

  if value="$(read_app_env_from_file "$env_file")"; then
    echo "$value"
    return
  fi

  echo "development"
}

ENV_NAME="$(resolve_env "${1:-}")"
SRC_DIR="$ROOT_DIR/config/firebase/$ENV_NAME"
ANDROID_SRC="$SRC_DIR/google-services.json"
IOS_SRC="$SRC_DIR/GoogleService-Info.plist"
ANDROID_DST="$ROOT_DIR/android/app/google-services.json"
IOS_DST="$ROOT_DIR/ios/TanLabsEnglishForSE/GoogleService-Info.plist"

if [[ ! -f "$ANDROID_SRC" ]]; then
  echo "Missing $ANDROID_SRC"
  echo "Copy your Firebase Android config for $ENV_NAME into config/firebase/$ENV_NAME/ (see config/firebase/README.md)."
  exit 1
fi
if [[ ! -f "$IOS_SRC" ]]; then
  echo "Missing $IOS_SRC"
  echo "Copy your Firebase iOS config for $ENV_NAME into config/firebase/$ENV_NAME/ (see config/firebase/README.md)."
  exit 1
fi

android_package="$(
  "$NODE_BINARY" -e "const g=require(process.argv[1]); process.stdout.write(g.client?.[0]?.client_info?.android_client_info?.package_name||'')" "$ANDROID_SRC"
)"
ios_bundle="$(
  "$NODE_BINARY" -e "
const fs=require('fs');
const text=fs.readFileSync(process.argv[1],'utf8');
const m=text.match(/<key>BUNDLE_ID<\\/key>\\s*<string>([^<]+)<\\/string>/);
process.stdout.write(m?m[1]:'');
" "$IOS_SRC"
)"

if [[ "$android_package" != "com.tanlabs.enforse" ]]; then
  echo "Unexpected Android package_name=$android_package (expected com.tanlabs.enforse)"
  exit 1
fi
if [[ "$ios_bundle" != "com.tanlabs.en-for-se" ]]; then
  echo "Unexpected iOS BUNDLE_ID=$ios_bundle (expected com.tanlabs.en-for-se)"
  exit 1
fi

if rg -n 'private_key|BEGIN PRIVATE KEY|"type"[[:space:]]*:[[:space:]]*"service_account"' "$ANDROID_SRC" "$IOS_SRC" >/dev/null; then
  echo "Refusing Firebase client config that looks like a server service-account credential."
  exit 1
fi

cp "$ANDROID_SRC" "$ANDROID_DST"
cp "$IOS_SRC" "$IOS_DST"
echo "Firebase client config selected: $ENV_NAME"
echo "  → android/app/google-services.json"
echo "  → ios/TanLabsEnglishForSE/GoogleService-Info.plist"
